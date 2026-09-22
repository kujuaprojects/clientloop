import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { postJob } from "@/lib/sproutgigs";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const liveSubmissionEnabled =
  process.env.SPROUTGIGS_LIVE_SUBMISSION === "true";

if (!liveSubmissionEnabled) {
  return NextResponse.json(
    {
      error:
        "Live SproutGigs submission is disabled. Set SPROUTGIGS_LIVE_SUBMISSION=true to enable it.",
    },
    { status: 403 }
  );
}

  const { rows } = await pool.query(
    `
    SELECT
      id,
      title,
      subreddit,
      style,
      budget,
      pay_per_task,
      tracking_token,
      destination_url,
      status
    FROM campaigns
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  if (!rows.length) {
    return NextResponse.json(
      { error: "Campaign not found" },
      { status: 404 }
    );
  }

  const campaign = rows[0];

  if (campaign.status !== "prepared") {
    return NextResponse.json(
      { error: "Only prepared campaigns can be submitted" },
      { status: 409 }
    );
  }

  const appUrl = process.env.APP_URL || req.nextUrl.origin;
  const trackedUrl = `${appUrl.replace(/\/$/, "")}/r/${campaign.tracking_token}`;

  try {
    const job = await postJob({
      title: String(campaign.title).slice(0, 120),
      instructions:
        `Open the campaign page below and complete only the action described on that page.\n` +
        `Do not use VPNs, automation, duplicate accounts, or artificial social engagement.\n\n` +
        trackedUrl,
      amountPerTask: Number(campaign.pay_per_task),
      totalBudget: Number(campaign.budget),
      workerUrl: trackedUrl,
      countries: [],
    });

    const sgJobId = job?.job_id ?? null;

    if (!sgJobId) {
      return NextResponse.json(
        { error: "SproutGigs did not return a job ID" },
        { status: 502 }
      );
    }

    await pool.query(
      `
      UPDATE campaigns
      SET
        sg_job_id = $1,
        status = 'pending_review'
      WHERE id = $2
      `,
      [sgJobId, id]
    );

    return NextResponse.json({
      ok: true,
      campaignId: id,
      sgJobId,
      status: "pending_review",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Could not submit campaign to SproutGigs",
      },
      { status: 500 }
    );
  }
}