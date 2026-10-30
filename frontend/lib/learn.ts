import { apiFetch } from "@/lib/auth";

// Client for /api/learn. The backend owns the curriculum and every reward
// rule; these types mirror what it returns.

export const COURSE_SLUG = "networking";
export const STAGES = ["story", "concept", "visualize", "game", "done"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABELS: Record<Stage, string> = {
  story: "Story",
  concept: "Concept",
  visualize: "Visualize",
  game: "Game",
  done: "Completion",
};

export type TopicStatus = "locked" | "current" | "done";

export type LearnProfile = {
  xp: number;
  level: number;
  rank: string;
  nextRank: { title: string; level: number } | null;
  levelXp: number;
  levelGoal: number;
  levelPct: number;
  streak: { current: number; best: number; activeToday: boolean };
};

export type LearnTopic = {
  id: string;
  key: string;
  title: string;
  desc: string;
  min: [number, number];
  icon: string;
  capstone: boolean;
  xp: number;
  status: TopicStatus;
  stagesDone: number;
  nextStage: Stage | null;
  lesson: string | null;
  completedAt: string | null;
};

export type LearnChest = { id: string; after: string; xp: number; opened: boolean; available: boolean };

export type LearnModule = {
  num: number;
  title: string;
  tagline: string;
  icon: string;
  accent: [string, string];
  state: TopicStatus;
  done: number;
  total: number;
  pct: number;
  stars: number;
  xpTotal: number;
  minutes: number;
  minutesLeft: number;
  chests: LearnChest[];
  topics: LearnTopic[];
};

export type LearnCourse = {
  slug: string;
  title: string;
  stages: Stage[];
  completedAt: string | null;
  current: (LearnTopic & { module: number; moduleTitle: string }) | null;
  totals: {
    topics: number;
    done: number;
    pct: number;
    worlds: number;
    worldsCleared: number;
    stars: number;
    starsMax: number;
    chests: number;
    chestsOpened: number;
    minutes: number;
    minutesLeft: number;
  };
  modules: LearnModule[];
};

export type Snapshot = { profile: LearnProfile; course: LearnCourse };

export type StageResult = {
  snapshot: Snapshot;
  awarded: { xp: number; items: { label: string; xp: number }[] };
  completed: { topic: boolean; module: number | null; course: boolean };
  levelUp: { level: number; rank: string; newRank: boolean } | null;
  next: { id: string; key: string; title: string; module: number; newModule: boolean; lesson: string | null } | null;
};

export type ChestResult = { snapshot: Snapshot; awarded: StageResult["awarded"] };

export class LearnApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const tz = () => String(new Date().getTimezoneOffset());

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await apiFetch(path, init);
  } catch {
    throw new LearnApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      res.status === 401 ? "Sign in to track your progress." : (body && body.message) || "Something went wrong. Please try again.";
    throw new LearnApiError(res.status, message);
  }

  return body as T;
}

// Lets the top bar (and any open screen) pick up new XP and streak values
export const PROFILE_EVENT = "learn:profile";

function announce(profile: LearnProfile) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<LearnProfile>(PROFILE_EVENT, { detail: profile }));
  }
}

export async function fetchProfile(): Promise<LearnProfile> {
  const { profile } = await request<{ profile: LearnProfile }>(`/api/learn/me?tz=${tz()}`);
  return profile;
}

export async function fetchCourse(slug = COURSE_SLUG): Promise<Snapshot> {
  return request<Snapshot>(`/api/learn/courses/${slug}?tz=${tz()}`);
}

export async function completeStage(topicId: string, stage: Stage, slug = COURSE_SLUG): Promise<StageResult> {
  const result = await request<StageResult>(
    `/api/learn/courses/${slug}/topics/${encodeURIComponent(topicId)}/stages/${stage}`,
    { method: "POST", body: JSON.stringify({ tz: tz() }) }
  );
  announce(result.snapshot.profile);
  return result;
}

export async function claimChest(chestId: string, slug = COURSE_SLUG): Promise<ChestResult> {
  const result = await request<ChestResult>(
    `/api/learn/courses/${slug}/chests/${encodeURIComponent(chestId)}`,
    { method: "POST", body: JSON.stringify({ tz: tz() }) }
  );
  announce(result.snapshot.profile);
  return result;
}

// Wipes the course's progress (and the XP it earned) so it starts fresh
export async function resetCourse(slug = COURSE_SLUG): Promise<{ snapshot: Snapshot; removedXp: number }> {
  const result = await request<{ snapshot: Snapshot; removedXp: number }>(
    `/api/learn/courses/${slug}/reset`,
    { method: "POST", body: JSON.stringify({ tz: tz() }) }
  );
  announce(result.snapshot.profile);
  return result;
}

// ---------- where each topic stage lives ----------

const COURSE_PATH = "/learn/modules/networking";

// Topics with built lesson pages use them; the rest use the generic lesson page
export function stageHref(topic: { id: string; lesson: string | null }, stage: Stage): string {
  if (topic.lesson) return `${topic.lesson}/${stage}`;
  return `${COURSE_PATH}/lesson?topic=${encodeURIComponent(topic.id)}&stage=${stage}`;
}

// Where "continue" should take the learner for this topic
export function topicHref(topic: { id: string; lesson: string | null; nextStage: Stage | null }): string {
  return stageHref(topic, topic.nextStage ?? "story");
}

export function moduleHref(num: number): string {
  return `${COURSE_PATH}#module-${num}`;
}

export function findTopic(course: LearnCourse, topicId: string) {
  for (const m of course.modules) {
    const t = m.topics.find((x) => x.id === topicId);
    if (t) return { module: m, topic: t };
  }
  return null;
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

export function formatDuration(minutes: number) {
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
