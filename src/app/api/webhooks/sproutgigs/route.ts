import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const runtime = "nodejs";

function validSignature(raw: string, header: string | null) {
  const secret = process.env.SPROUTGIGS_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!header?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const received = header.slice(7);
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function receipt(externalId: string, payload: unknown) {
  try {
    await pool.query(
      `INSERT INTO webhook_receipts (source, external_id, payload) VALUES ('sproutgigs',$1,$2)`,
      [externalId, JSON.stringify(payload)]
    );
    return true;
  } catch (err: any) {
    if (err?.code === "23505") return false;
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-sproutgigs-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const eventType = String(payload.event_type || "");
  const eventDate = String(payload.event_date || "");
  const items = Array.isArray(payload.event) ? payload.event : [];

  for (const item of items) {
    const sgJobId = String(item.job_id || "");
    if (!sgJobId) continue;
    const { rows } = await pool.query("SELECT id FROM campaigns WHERE sg_job_id = $1", [sgJobId]);
    if (!rows.length) continue;
    const campaignId = rows[0].id;

    if (eventType === "tasks_submitted") {
      for (const taskId of Array.isArray(item.task_ids) ? item.task_ids : []) {
        const externalId = `task:${taskId}`;
        if (!(await receipt(externalId, { eventType, eventDate, item, taskId }))) continue;
        await pool.query(
          `INSERT INTO events (campaign_id, type, external_id, meta) VALUES ($1,'worker_submitted',$2,$3)`,
          [campaignId, externalId, JSON.stringify({ taskId, eventDate })]
        );
      }
    } else if (eventType === "job_status_changed") {
      for (const change of Array.isArray(item.changes) ? item.changes : []) {
        const status = String(change.status || "").toLowerCase();
        const externalId = `status:${sgJobId}:${change.date || eventDate}:${status}`;
        if (!(await receipt(externalId, { eventType, eventDate, item, change }))) continue;
        await pool.query(
          `INSERT INTO events (campaign_id, type, external_id, meta) VALUES ($1,'job_event',$2,$3)`,
          [campaignId, externalId, JSON.stringify(change)]
        );
        if (status) await pool.query("UPDATE campaigns SET status = $1 WHERE id = $2", [status, campaignId]);
      }
    } else {
      const externalId = `${eventType}:${sgJobId}:${eventDate}`;
      if (!(await receipt(externalId, { eventType, eventDate, item }))) continue;
      await pool.query(
        `INSERT INTO events (campaign_id, type, external_id, meta) VALUES ($1,'job_event',$2,$3)`,
        [campaignId, externalId, JSON.stringify({ eventType, eventDate, item })]
      );
    }
  }

  return NextResponse.json({ received: true });
}
