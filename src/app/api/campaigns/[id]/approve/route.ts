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

  const claim = await pool.query(
    `
    UPDATE campaigns
    SET status = 'submitting'
    WHERE id = $1
      AND status = 'prepared'
    RETURNING id
    `,
    [id]
  );

  if (!claim.rows.length) {
    return NextResponse.json(
      {
        error:
          "Campaign is no longer available for submission. It may already be submitting or submitted.",
      },
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

    const actualSpend =
      typeof job?.actual_spend === "number"
        ? job.actual_spend
        : null;

    if (!sgJobId) {
      await pool.query(
        `
        UPDATE campaigns
        SET status = 'prepared'
        WHERE id = $1
          AND status = 'submitting'
        `,
        [id]
      );

      return NextResponse.json(
        { error: "SproutGigs did not return a job ID" },
        { status: 502 }
      );
    }

    const update = await pool.query(
      `
      UPDATE campaigns
      SET
        sg_job_id = $1,
        actual_spend = COALESCE($2, actual_spend),
        status = 'pending_review'
      WHERE id = $3
        AND status = 'submitting'
      RETURNING id, sg_job_id, actual_spend, status
      `,
      [sgJobId, actualSpend, id]
    );

    if (!update.rows.length) {
      return NextResponse.json(
        {
          error:
            "SproutGigs accepted the job, but ClientLoop could not finalize the campaign record.",
          sgJobId,
          actualSpend,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      campaignId: id,
      sgJobId,
      actualSpend,
      status: "pending_review",
    });
  } catch (error: any) {
    await pool.query(
      `
      UPDATE campaigns
      SET status = 'prepared'
      WHERE id = $1
        AND status = 'submitting'
      `,
      [id]
    );

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