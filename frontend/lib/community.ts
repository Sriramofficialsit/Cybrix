import { apiFetch } from "@/lib/auth";

// Client for /api/community. Types mirror what the backend returns.

export type PostKind = "writeup" | "question" | "announcement";

export const KIND_LABELS: Record<PostKind, string> = {
  writeup: "Write-up",
  question: "Question",
  announcement: "Announcement",
};

export const REPORT_REASONS = [
  { value: "spam", label: "Spam or advertising" },
  { value: "harassment", label: "Harassment or hate" },
  { value: "spoiler", label: "Spoils a live CTF or exam" },
  { value: "unsafe", label: "Malware or illegal activity" },
  { value: "off_topic", label: "Off-topic" },
  { value: "other", label: "Something else" },
] as const;

export type Author = { name: string; role: string | null; staff: boolean };

export type Post = {
  id: string;
  kind: PostKind;
  title: string;
  body: string;
  truncated: boolean;
  tags: string[];
  author: Author;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  mine: boolean;
  pinned: boolean;
  status: "visible" | "hidden" | "removed";
  createdAt: string;
  editedAt: string | null;
};

export type Comment = {
  id: string;
  postId: string;
  body: string;
  author: Author;
  mine: boolean;
  status: "visible" | "hidden" | "removed";
  createdAt: string;
  editedAt: string | null;
};

export type Feed = { pinned: Post[]; posts: Post[]; nextCursor: string | null };

export type Highlights = {
  trendingTags: { tag: string; count: number }[];
  topContributors: (Author & { posts: number; likes: number })[];
  totals: { posts: number; comments: number };
  me: { posts: number; likesReceived: number; comments: number; canAnnounce: boolean };
};

export type FeedQuery = {
  kind?: PostKind | null;
  tag?: string | null;
  q?: string;
  sort?: "latest" | "top";
  mine?: boolean;
  cursor?: string | null;
};

export type PostInput = { kind: PostKind; title: string; body: string; tags: string };

export class CommunityApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await apiFetch(path, init);
  } catch {
    throw new CommunityApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      res.status === 401 ? "Sign in to join the community." : (body && body.message) || "Something went wrong. Please try again.";
    throw new CommunityApiError(res.status, message);
  }

  return body as T;
}

const json = (method: string, data?: unknown): RequestInit => ({
  method,
  body: data === undefined ? undefined : JSON.stringify(data),
});

export function fetchFeed(query: FeedQuery): Promise<Feed> {
  const params = new URLSearchParams();
  if (query.kind) params.set("kind", query.kind);
  if (query.tag) params.set("tag", query.tag);
  if (query.q) params.set("q", query.q);
  if (query.sort === "top") params.set("sort", "top");
  if (query.mine) params.set("mine", "1");
  if (query.cursor) params.set("cursor", query.cursor);
  const qs = params.toString();
  return request<Feed>(`/api/community/posts${qs ? `?${qs}` : ""}`);
}

export const fetchHighlights = () => request<Highlights>("/api/community/highlights");

export const fetchPost = async (id: string) => (await request<{ post: Post }>(`/api/community/posts/${id}`)).post;

export const createPost = async (input: PostInput) =>
  (await request<{ post: Post }>("/api/community/posts", json("POST", input))).post;

export const updatePost = async (id: string, input: Partial<PostInput>) =>
  (await request<{ post: Post }>(`/api/community/posts/${id}`, json("PUT", input))).post;

export const deletePost = (id: string) => request<void>(`/api/community/posts/${id}`, json("DELETE"));

export const setLike = (id: string, liked: boolean) =>
  request<{ liked: boolean; likeCount: number }>(`/api/community/posts/${id}/like`, json(liked ? "POST" : "DELETE"));

export const reportPost = (id: string, reason: string, details: string) =>
  request<{ reported: boolean }>(`/api/community/posts/${id}/report`, json("POST", { reason, details }));

export const fetchComments = (postId: string, cursor?: string | null) =>
  request<{ comments: Comment[]; nextCursor: string | null }>(
    `/api/community/posts/${postId}/comments${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`
  );

export const addComment = async (postId: string, body: string) =>
  (await request<{ comment: Comment }>(`/api/community/posts/${postId}/comments`, json("POST", { body }))).comment;

export const updateComment = async (id: string, body: string) =>
  (await request<{ comment: Comment }>(`/api/community/comments/${id}`, json("PUT", { body }))).comment;

export const deleteComment = (id: string) => request<void>(`/api/community/comments/${id}`, json("DELETE"));

export const reportComment = (id: string, reason: string, details: string) =>
  request<{ reported: boolean }>(`/api/community/comments/${id}/report`, json("POST", { reason, details }));

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
