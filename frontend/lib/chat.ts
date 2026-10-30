import { API_BASE, apiFetch } from "@/lib/auth";

// Client for /api/chat: groups, channels, DMs and the real-time stream.
// Types mirror what the backend returns. People are identified by `uid`
// (a one-way hash), never by account id.

export type Role = "owner" | "moderator" | "member";
export type RoomType = "channel" | "dm";

export type Person = { uid: string; name: string };

export type GroupSummary = {
  id: string;
  name: string;
  description: string;
  visibility: "public" | "private";
  memberCount: number;
  role: Role | null;
  inviteCode: string | null;
  createdAt: string;
  unread?: boolean;
  joined?: boolean;
};

export type Channel = {
  id: string;
  groupId: string;
  name: string;
  topic: string;
  position: number;
  lastMessageAt: string | null;
  unread: number;
};

export type DmSummary = {
  id: string;
  other: Person & { online: boolean };
  lastMessageAt: string | null;
  unread: number;
};

export type DmDetail = { id: string; other: Person & { online: boolean }; blockedByMe: boolean; canMessage: boolean };

export type Overview = { me: Person; reactions: string[]; groups: GroupSummary[]; dms: DmSummary[] };

export type GroupDetail = { group: GroupSummary; channels: Channel[]; member: boolean };

export type Member = Person & { role: Role; online: boolean; joinedAt: string };

export type Message = {
  id: string;
  roomType: RoomType;
  roomId: string;
  author: Person;
  body: string;
  deleted: boolean;
  replyTo: { id: string; author: Person; excerpt: string } | null;
  sharedPost: { id: string; title: string; kind: string } | null;
  reactions: { emoji: string; users: Person[] }[];
  createdAt: string;
  editedAt: string | null;
};

export type ChatEvent =
  | { type: "ready" }
  | { type: "message.created"; roomType: RoomType; roomId: string; groupId: string | null; message: Message }
  | { type: "message.updated"; roomType: RoomType; roomId: string; message: Message }
  | { type: "typing"; roomType: RoomType; roomId: string; user: Person }
  | { type: "group.updated"; groupId: string }
  | { type: "members.changed"; groupId: string }
  | { type: "group.removed"; groupId: string; reason?: "kicked" | "banned" };

export class ChatApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await apiFetch(`/api/chat${path}`, init);
  } catch {
    throw new ChatApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      res.status === 401 ? "Sign in to use groups and chat." : (body && body.message) || "Something went wrong. Please try again.";
    throw new ChatApiError(res.status, message);
  }

  return body as T;
}

const send = (method: string, data?: unknown): RequestInit => ({
  method,
  body: data === undefined ? undefined : JSON.stringify(data),
});

export const chatApi = {
  overview: () => request<Overview>("/me"),

  createGroup: async (input: { name: string; description: string; visibility: "public" | "private" }) =>
    (await request<{ group: GroupSummary }>("/groups", send("POST", input))).group,
  discover: async (q: string) =>
    (await request<{ groups: GroupSummary[] }>(`/groups/discover${q ? `?q=${encodeURIComponent(q)}` : ""}`)).groups,
  group: (id: string) => request<GroupDetail>(`/groups/${id}`),
  updateGroup: async (id: string, input: Partial<{ name: string; description: string; visibility: string }>) =>
    (await request<{ group: GroupSummary }>(`/groups/${id}`, send("PUT", input))).group,
  deleteGroup: (id: string) => request<void>(`/groups/${id}`, send("DELETE")),
  join: async (id: string) => (await request<{ group: GroupSummary }>(`/groups/${id}/join`, send("POST"))).group,
  leave: (id: string) => request<void>(`/groups/${id}/leave`, send("POST")),
  resetInvite: async (id: string) => (await request<{ group: GroupSummary }>(`/groups/${id}/invite/reset`, send("POST"))).group,
  previewInvite: async (code: string) => (await request<{ group: GroupSummary }>(`/invites/${encodeURIComponent(code)}`)).group,
  joinInvite: async (code: string) => (await request<{ group: GroupSummary }>(`/invites/${encodeURIComponent(code)}/join`, send("POST"))).group,

  members: async (groupId: string) => (await request<{ members: Member[] }>(`/groups/${groupId}/members`)).members,
  setRole: (groupId: string, uid: string, role: "moderator" | "member") =>
    request<void>(`/groups/${groupId}/members/${uid}/role`, send("PUT", { role })),
  transfer: (groupId: string, uid: string) => request<void>(`/groups/${groupId}/members/${uid}/transfer`, send("POST")),
  kick: (groupId: string, uid: string) => request<void>(`/groups/${groupId}/members/${uid}/kick`, send("POST")),
  ban: (groupId: string, uid: string) => request<void>(`/groups/${groupId}/members/${uid}/ban`, send("POST")),
  bans: async (groupId: string) =>
    (await request<{ bans: { uid: string; name: string; at: string }[] }>(`/groups/${groupId}/bans`)).bans,
  unban: (groupId: string, uid: string) => request<void>(`/groups/${groupId}/bans/${uid}`, send("DELETE")),

  createChannel: async (groupId: string, input: { name: string; topic: string }) =>
    (await request<{ channel: Channel }>(`/groups/${groupId}/channels`, send("POST", input))).channel,
  updateChannel: async (id: string, input: Partial<{ name: string; topic: string }>) =>
    (await request<{ channel: Channel }>(`/channels/${id}`, send("PUT", input))).channel,
  deleteChannel: (id: string) => request<void>(`/channels/${id}`, send("DELETE")),

  openDm: async (username: string) => (await request<{ dm: DmSummary }>("/dms", send("POST", { username }))).dm,
  dm: async (id: string) => (await request<{ dm: DmDetail }>(`/dms/${id}`)).dm,
  block: (id: string, blocked: boolean) => request<{ blocked: boolean }>(`/dms/${id}/block`, send(blocked ? "POST" : "DELETE")),

  messages: (roomType: RoomType, roomId: string, before?: string | null) =>
    request<{ messages: Message[]; nextBefore: string | null }>(
      `/rooms/${roomType}/${roomId}/messages${before ? `?before=${before}` : ""}`
    ),
  send: async (roomType: RoomType, roomId: string, input: { body: string; replyTo?: string; sharePostId?: string }) =>
    (await request<{ message: Message }>(`/rooms/${roomType}/${roomId}/messages`, send("POST", input))).message,
  markRead: (roomType: RoomType, roomId: string) => request<void>(`/rooms/${roomType}/${roomId}/read`, send("POST")),
  typing: (roomType: RoomType, roomId: string) => request<void>(`/rooms/${roomType}/${roomId}/typing`, send("POST")),
  edit: async (id: string, body: string) => (await request<{ message: Message }>(`/messages/${id}`, send("PUT", { body }))).message,
  remove: (id: string) => request<void>(`/messages/${id}`, send("DELETE")),
  react: async (id: string, emoji: string) =>
    (await request<{ message: Message }>(`/messages/${id}/reactions`, send("POST", { emoji }))).message,
};

/**
 * Opens the real-time stream (Server-Sent Events, session cookie).
 * The browser reconnects by itself; every "ready" after the first means
 * events may have been missed, so callers should refetch.
 */
export function openChatStream(onEvent: (e: ChatEvent) => void): () => void {
  const source = new EventSource(`${API_BASE}/api/chat/stream`, { withCredentials: true });
  const types: ChatEvent["type"][] = ["ready", "message.created", "message.updated", "typing", "group.updated", "members.changed", "group.removed"];

  for (const type of types) {
    source.addEventListener(type, (e) => {
      try {
        onEvent(JSON.parse((e as MessageEvent).data));
      } catch {
        // ignore malformed event
      }
    });
  }

  return () => source.close();
}

export function inviteLink(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/community/chat?invite=${encodeURIComponent(code)}`;
}

export function clockTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return time;
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} ${time}`;
}
