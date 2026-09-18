export function redditConfigured() {
  return Boolean(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET);
}

async function getToken() {
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
      ).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": process.env.REDDIT_USER_AGENT || "clientloop/1.0",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token as string;
}

const SUBREDDITS = ["selfimprovement", "getdisciplined", "lifeadvice", "entrepreneur"];

export interface TrendingPost {
  title: string;
  subreddit: string;
  score: number;
  numComments: number;
  style: string;
  url: string;
}

const DEMO_TRENDS: TrendingPost[] = [
  { title: "I wasted $30k on self-help before one question changed everything", subreddit: "selfimprovement", score: 12400, numComments: 1830, style: "Personal story", url: "#" },
  { title: "The 5 AM club ruined my life — what actually worked", subreddit: "getdisciplined", score: 9800, numComments: 1410, style: "Contrarian take", url: "#" },
  { title: "I coached 200 people out of burnout. AMA.", subreddit: "entrepreneur", score: 8600, numComments: 2200, style: "Ask-me-anything", url: "#" },
  { title: "7 habits that quietly compound (with my clients' data)", subreddit: "selfimprovement", score: 5100, numComments: 640, style: "Data / case study", url: "#" },
  { title: "A brutally honest list for anyone feeling stuck at 30", subreddit: "lifeadvice", score: 4700, numComments: 890, style: "Hard-won list", url: "#" },
];

function guessStyle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("ama")) return "Ask-me-anything";
  if (t.includes("ruined") || t.includes("unpopular") || t.includes("hot take")) return "Contrarian take";
  if (/\b\d+\b/.test(t) && (t.includes("habit") || t.includes("list") || t.includes("rules"))) return "Hard-won list";
  if (t.includes("data") || t.includes("study")) return "Data / case study";
  return "Personal story";
}

export async function getTrendingPosts(): Promise<TrendingPost[]> {
  if (!redditConfigured()) return DEMO_TRENDS;

  try {
    const token = await getToken();
    const out: TrendingPost[] = [];
    for (const sub of SUBREDDITS) {
      const res = await fetch(
        `https://oauth.reddit.com/r/${sub}/top?t=week&limit=3`,
        { headers: { Authorization: `Bearer ${token}`, "User-Agent": process.env.REDDIT_USER_AGENT || "clientloop/1.0" }, next: { revalidate: 3600 } }
      );
      const json = await res.json();
      for (const c of json?.data?.children ?? []) {
        out.push({
          title: c.data.title,
          subreddit: c.data.subreddit,
          score: c.data.score,
          numComments: c.data.num_comments,
          style: guessStyle(c.data.title),
          url: `https://reddit.com${c.data.permalink}`,
        });
      }
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 10);
  } catch {
    return DEMO_TRENDS;
  }
}
