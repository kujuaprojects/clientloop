const BASE = (process.env.SPROUTGIGS_WORKER_URL || "https://sproutgigs.com/api").replace(/\/$/, "");

function userId() {
  return process.env.SPROUTGIGS_USER_ID || process.env.SPROUTGIGS_APP_ID || "";
}

function headers() {
  const raw = `${userId()}:${process.env.SPROUTGIGS_SECRET_KEY || ""}`;
  return {
    Authorization: `Basic ${Buffer.from(raw).toString("base64")}`,
    "Content-Type": "application/json",
  };
}

export function sproutgigsConfigured() {
  return Boolean(userId() && process.env.SPROUTGIGS_SECRET_KEY && process.env.SPROUTGIGS_CATEGORY_ID);
}

export interface SproutGigJob {
  title: string;
  instructions: string;
  amountPerTask: number;
  totalBudget: number;
  workerUrl: string;
  countries?: string[];
}

function extractJobId(url?: string) {
  if (!url) return null;
  try {
    return new URL(url).searchParams.get("Id");
  } catch {
    return null;
  }
}

export async function estimateJobCost(job: SproutGigJob) {
  return postJob({ ...job, test: true });
}

export async function postJob(job: SproutGigJob & { test?: boolean }) {
  const numTasks = Math.max(1, Math.floor(job.totalBudget / job.amountPerTask));

  if (!sproutgigsConfigured()) {
    return {
      ok: true,
      demo: true,
      job_id: `demo_${Math.random().toString(36).slice(2, 10)}`,
      estimated_workers: numTasks,
      estimated_cost: (numTasks * job.amountPerTask).toFixed(2),
    };
  }

  const zoneId = process.env.SPROUTGIGS_ZONE_ID || "int";
  const body: Record<string, unknown> = {
    zone_id: zoneId,
    category_id: process.env.SPROUTGIGS_CATEGORY_ID,
    title: job.title.slice(0, 255),
    instructions: [job.instructions, `Open this tracked campaign URL: ${job.workerUrl}`],
    proofs: [{
      type: "url",
      description: "Paste the destination page URL you reached after opening the tracked campaign link.",
    }],
    num_tasks: numTasks,
    task_value: Number(job.amountPerTask.toFixed(2)),
    speed: Number(process.env.SPROUTGIGS_SPEED || 1000),
    ttr: Number(process.env.SPROUTGIGS_TTR || 7),
    hold_time: 15,
    watch_time: 0,
    daily_tasks_limit: 0,
    hourly_tasks_limit: 0,
    ...(job.test ? { test: 1 } : {}),
  };

  // SproutGigs supports excluding countries inside a zone, not a free-form allow list.
  if (job.countries?.length && process.env.SPROUTGIGS_EXCLUDED_COUNTRIES) {
    body.excluded_countries = process.env.SPROUTGIGS_EXCLUDED_COUNTRIES.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 10);
  }

  const res = await fetch(`${BASE}/jobs/post-job.php`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.message || "SproutGigs rejected the job");
  return { ...json, job_id: extractJobId(json.url) };
}
