"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { s } from "@/lib/style";
import { Icon } from "@/components/Icon";
import {
  ChatApiError,
  chatApi,
  clockTime,
  inviteLink,
  openChatStream,
  type Channel,
  type ChatEvent,
  type DmDetail,
  type GroupDetail,
  type GroupSummary,
  type Member,
  type Message,
  type Overview,
  type Person,
  type RoomType,
} from "@/lib/chat";

type View =
  | { kind: "home" }
  | { kind: "discover" }
  | { kind: "group"; groupId: string; channelId: string | null }
  | { kind: "dm"; dmId: string };

type Room = { roomType: RoomType; roomId: string };

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");
const ROLE_LABEL = { owner: "Owner", moderator: "Moderator", member: "Member" } as const;

// ---------- small pieces ----------

function hue(name: string) {
  return [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
}

function Avatar({ name, size = 36, online }: { name: string; size?: number; online?: boolean }) {
  const h = hue(name);
  return (
    <span style={s(`position:relative;flex:none;width:${size}px;height:${size}px`)}>
      <span aria-hidden="true" style={s(`width:${size}px;height:${size}px;border-radius:${size / 3}px;display:grid;place-items:center;font-weight:700;font-size:${Math.round(size * 0.4)}px;color:#fff;background:linear-gradient(135deg,hsl(${h} 70% 55%),hsl(${(h + 40) % 360} 70% 45%))`)}>
        {name.slice(0, 1).toUpperCase()}
      </span>
      {online !== undefined && (
        <span title={online ? "Online" : "Offline"} style={s(`position:absolute;right:-2px;bottom:-2px;width:11px;height:11px;border-radius:50%;border:2px solid #fff;background:${online ? "#3ec98a" : "#c9c3d9"}`)} />
      )}
    </span>
  );
}

function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [text, onDone]);
  return <div className="set-toast" role="status"><Icon name="ic-check" size={16} />{text}</div>;
}

function Dialog({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onClick={onClose} style={s(`position:fixed;inset:0;z-index:60;background:rgba(21,15,35,.45);display:grid;place-items:center;padding:16px`)}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={s(`width:100%;max-width:${wide ? 560 : 440}px;max-height:90vh;overflow:auto;padding:24px;background:#fff`)}>
        <div style={s(`display:flex;align-items:center;justify-content:space-between;margin-bottom:14px`)}>
          <h2 className="disp" style={s(`font-size:18px;font-weight:600`)}>{title}</h2>
          <button type="button" className="cm-link" onClick={onClose} aria-label="Close"><Icon name="ic-x" size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Body text with ``` code fences and @mention highlighting
function MessageText({ text, me }: { text: string; me: string }) {
  const parts = text.split(/```[^\n]*\n?/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <pre key={i} className="mono" style={s(`background:#150f23;color:#e9e3ff;border-radius:8px;padding:10px 12px;font-size:12px;overflow-x:auto;margin:6px 0;white-space:pre`)}>{part.replace(/\n$/, "")}</pre>
        ) : (
          <span key={i} style={s(`white-space:pre-wrap;word-break:break-word`)}>
            {part.split(/(@[A-Za-z0-9_]{3,20})/g).map((bit, j) =>
              /^@[A-Za-z0-9_]{3,20}$/.test(bit) ? (
                <span key={j} style={s(`background:${bit.slice(1).toLowerCase() === me.toLowerCase() ? "rgba(245,165,36,.25)" : "rgba(124,58,237,.12)"};color:#5b21b6;border-radius:4px;padding:0 3px;font-weight:600`)}>{bit}</span>
              ) : (
                bit
              )
            )}
          </span>
        )
      )}
    </>
  );
}

// ---------- dialogs ----------

function CreateGroupDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (g: GroupSummary) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) return setError("Group name needs at least 3 characters");
    setBusy(true);
    setError("");
    try {
      onCreated(await chatApi.createGroup({ name, description, visibility }));
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <Dialog title="Create a group" onClose={() => !busy && onClose()}>
      <form onSubmit={submit} style={s(`display:flex;flex-direction:column;gap:10px`)}>
        <label style={s(`font-size:12px;font-weight:600`)}>Group name
          <input className="in" style={s(`margin-top:6px`)} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="e.g. Web Exploitation Study Group" autoFocus />
        </label>
        <label style={s(`font-size:12px;font-weight:600`)}>Description <span style={s(`color:#a79fbe;font-weight:400`)}>(optional)</span>
          <textarea className="in" style={s(`margin-top:6px;min-height:70px;resize:vertical`)} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} placeholder="What's this group about?" />
        </label>
        <div role="radiogroup" aria-label="Visibility" style={s(`display:grid;grid-template-columns:1fr 1fr;gap:8px`)}>
          {(["public", "private"] as const).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={visibility === v} onClick={() => setVisibility(v)} className="card" style={s(`padding:12px;text-align:left;cursor:pointer;border:1px solid ${visibility === v ? "#7c3aed" : "rgba(124,58,237,.15)"}`)}>
              <div style={s(`font-weight:700;font-size:13px`)}>{v === "public" ? "Public" : "Private"}</div>
              <div style={s(`font-size:11.5px;color:#6a6480;margin-top:3px`)}>{v === "public" ? "Anyone can find and join" : "Invite link only"}</div>
            </button>
          ))}
        </div>
        {error && <div className="err-msg" role="alert">{error}</div>}
        <div style={s(`display:flex;justify-content:flex-end;gap:8px;margin-top:6px`)}>
          <button type="button" className="btn btn-g btn-s" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-v btn-s" disabled={busy}>{busy ? "Creating…" : "Create group"}</button>
        </div>
      </form>
    </Dialog>
  );
}

function ChannelDialog({ groupId, channel, onClose, onSaved, onDeleted }: {
  groupId: string;
  channel: Channel | null;
  onClose: () => void;
  onSaved: (c: Channel) => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(channel?.name ?? "");
  const [topic, setTopic] = useState(channel?.topic ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onSaved(channel ? await chatApi.updateChannel(channel.id, { name, topic }) : await chatApi.createChannel(groupId, { name, topic }));
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!channel || !window.confirm(`Delete #${channel.name} and all its messages?`)) return;
    setBusy(true);
    try {
      await chatApi.deleteChannel(channel.id);
      onDeleted();
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <Dialog title={channel ? `Edit #${channel.name}` : "Create a channel"} onClose={() => !busy && onClose()}>
      <form onSubmit={submit} style={s(`display:flex;flex-direction:column;gap:10px`)}>
        <label style={s(`font-size:12px;font-weight:600`)}>Channel name
          <input className="in" style={s(`margin-top:6px`)} value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="e.g. ctf-writeups" autoFocus />
        </label>
        <label style={s(`font-size:12px;font-weight:600`)}>Topic <span style={s(`color:#a79fbe;font-weight:400`)}>(optional)</span>
          <input className="in" style={s(`margin-top:6px`)} value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={200} />
        </label>
        {error && <div className="err-msg" role="alert">{error}</div>}
        <div style={s(`display:flex;gap:8px;margin-top:6px`)}>
          {channel && <button type="button" className="btn btn-g btn-s" style={s(`color:#b4323a`)} onClick={remove} disabled={busy}>Delete</button>}
          <span style={s(`flex:1`)} />
          <button type="button" className="btn btn-g btn-s" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-v btn-s" disabled={busy || name.trim().length < 2}>{channel ? "Save" : "Create"}</button>
        </div>
      </form>
    </Dialog>
  );
}

function GroupSettingsDialog({ detail, onClose, onChanged, onGone, onToast }: {
  detail: GroupDetail;
  onClose: () => void;
  onChanged: () => void;
  onGone: (msg: string) => void;
  onToast: (t: string) => void;
}) {
  const g = detail.group;
  const isMod = g.role === "owner" || g.role === "moderator";
  const [name, setName] = useState(g.name);
  const [description, setDescription] = useState(g.description);
  const [visibility, setVisibility] = useState(g.visibility);
  const [invite, setInvite] = useState(g.inviteCode);
  const [bans, setBans] = useState<{ uid: string; name: string; at: string }[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isMod) chatApi.bans(g.id).then(setBans).catch(() => setBans([]));
  }, [g.id, isMod]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await chatApi.updateGroup(g.id, { name, description, ...(g.role === "owner" ? { visibility } : {}) });
      onChanged();
      onToast("Group updated");
    });
  };

  const copyInvite = async () => {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(inviteLink(invite));
      onToast("Invite link copied");
    } catch {
      window.prompt("Copy this invite link", inviteLink(invite));
    }
  };

  return (
    <Dialog title={`${g.name} · settings`} onClose={() => !busy && onClose()} wide>
      {isMod && (
        <>
          <div className="eyebrow" style={s(`margin-bottom:8px`)}>Invite link</div>
          <div style={s(`display:flex;gap:8px;flex-wrap:wrap`)}>
            <input className="in mono" readOnly value={invite ? inviteLink(invite) : ""} style={s(`flex:1;min-width:220px;font-size:12px`)} aria-label="Invite link" />
            <button type="button" className="btn btn-v btn-s" onClick={copyInvite}>Copy</button>
            <button type="button" className="btn btn-g btn-s" disabled={busy} onClick={() => window.confirm("Reset the invite link? The old link stops working.") && run(async () => { setInvite((await chatApi.resetInvite(g.id)).inviteCode); onToast("New invite link created"); })}>Reset</button>
          </div>
          <form onSubmit={save} style={s(`display:flex;flex-direction:column;gap:10px;margin-top:20px`)}>
            <div className="eyebrow">Details</div>
            <input className="in" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} aria-label="Group name" />
            <textarea className="in" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} aria-label="Description" style={s(`min-height:60px;resize:vertical`)} />
            {g.role === "owner" && (
              <select className="in" value={visibility} onChange={(e) => setVisibility(e.target.value as "public" | "private")} aria-label="Visibility">
                <option value="public">Public: anyone can find and join</option>
                <option value="private">Private: invite link only</option>
              </select>
            )}
            <button className="btn btn-v btn-s" style={s(`align-self:flex-end`)} disabled={busy}>Save</button>
          </form>
          <div className="eyebrow" style={s(`margin:20px 0 8px`)}>Banned members</div>
          {bans === null ? <p style={s(`font-size:12.5px;color:#6a6480`)}>Loading…</p> : bans.length === 0 ? (
            <p style={s(`font-size:12.5px;color:#6a6480`)}>Nobody is banned.</p>
          ) : (
            <ul style={s(`list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px`)}>
              {bans.map((b) => (
                <li key={b.uid} style={s(`display:flex;align-items:center;gap:8px;font-size:13px`)}>
                  <span style={s(`flex:1`)}>{b.name}</span>
                  <button type="button" className="cm-link" onClick={() => run(async () => { await chatApi.unban(g.id, b.uid); setBans((prev) => prev!.filter((x) => x.uid !== b.uid)); })}>Unban</button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {error && <div className="err-msg" role="alert" style={s(`margin-top:10px`)}>{error}</div>}
      <div style={s(`display:flex;justify-content:flex-end;gap:8px;margin-top:22px;padding-top:16px;border-top:1px solid rgba(124,58,237,.12)`)}>
        {g.role === "owner" ? (
          <button type="button" className="btn btn-g btn-s" style={s(`color:#b4323a`)} disabled={busy} onClick={() => window.confirm(`Delete ${g.name}? All channels and messages are removed for everyone.`) && run(async () => { await chatApi.deleteGroup(g.id); onGone("Group deleted"); })}>Delete group</button>
        ) : (
          <button type="button" className="btn btn-g btn-s" style={s(`color:#b4323a`)} disabled={busy} onClick={() => window.confirm(`Leave ${g.name}?`) && run(async () => { await chatApi.leave(g.id); onGone("You left the group"); })}>Leave group</button>
        )}
      </div>
    </Dialog>
  );
}

// ---------- discover ----------

function Discover({ onOpen, onToast }: { onOpen: (groupId: string) => void; onToast: (t: string) => void }) {
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<GroupSummary[] | null>(null);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      chatApi.discover(q.trim()).then((g) => { setGroups(g); setError(""); }).catch((e) => setError(errMsg(e)));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const join = async (g: GroupSummary) => {
    setBusy(g.id);
    try {
      await chatApi.join(g.id);
      onOpen(g.id);
    } catch (e) {
      onToast(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const joinCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = code.trim();
    const value = raw.includes("invite=") ? new URL(raw, window.location.origin).searchParams.get("invite") || "" : raw;
    setBusy("code");
    try {
      onOpen((await chatApi.joinInvite(value)).id);
    } catch (err) {
      onToast(errMsg(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={s(`padding:22px;overflow:auto;height:100%`)}>
      <div className="eyebrow" style={s(`margin-bottom:6px`)}>Discover</div>
      <h2 className="disp" style={s(`font-size:22px;font-weight:600`)}>Find a group</h2>
      <div style={s(`display:flex;gap:10px;margin-top:14px;flex-wrap:wrap`)}>
        <input className="in" type="search" placeholder="Search public groups" value={q} onChange={(e) => setQ(e.target.value)} style={s(`flex:2;min-width:200px`)} aria-label="Search public groups" />
        <form onSubmit={joinCode} style={s(`display:flex;gap:8px;flex:1;min-width:220px`)}>
          <input className="in mono" placeholder="Invite code or link" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Invite code or link" />
          <button className="btn btn-g btn-s" disabled={!code.trim() || busy === "code"}>Join</button>
        </form>
      </div>
      {error && <p className="set-error" style={s(`margin-top:14px`)}>{error}</p>}
      {groups === null && !error && <div className="set-skel-bar" style={s(`height:90px;margin-top:16px;border-radius:14px`)} />}
      {groups && groups.length === 0 && <p style={s(`margin-top:16px;font-size:13px;color:#6a6480`)}>No public groups found. Create one!</p>}
      <div style={s(`display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:16px`)}>
        {groups?.map((g) => (
          <div key={g.id} className="card lift" style={s(`padding:16px;display:flex;flex-direction:column;gap:8px`)}>
            <div style={s(`display:flex;align-items:center;gap:10px`)}>
              <Avatar name={g.name} size={40} />
              <div style={s(`min-width:0`)}>
                <div className="disp" style={s(`font-weight:600;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`)}>{g.name}</div>
                <div style={s(`font-size:11.5px;color:#6a6480`)}>{g.memberCount} member{g.memberCount === 1 ? "" : "s"}</div>
              </div>
            </div>
            <p style={s(`font-size:12.5px;color:#4a4560;line-height:1.5;flex:1;word-break:break-word`)}>{g.description || "No description yet."}</p>
            {g.joined ? (
              <button type="button" className="btn btn-g btn-s" onClick={() => onOpen(g.id)}>Open</button>
            ) : (
              <button type="button" className="btn btn-v btn-s" onClick={() => join(g)} disabled={busy === g.id}>{busy === g.id ? "Joining…" : "Join"}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- messages ----------

function MessageRow({ m, grouped, me, reactions, canModerate, onReply, onToast }: {
  m: Message;
  grouped: boolean;
  me: Person;
  reactions: string[];
  canModerate: boolean;
  onReply: (m: Message) => void;
  onToast: (t: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(m.body);
  const [picker, setPicker] = useState(false);
  const mine = m.author.uid === me.uid;

  const save = async () => {
    try {
      await chatApi.edit(m.id, text);
      setEditing(false);
    } catch (e) {
      onToast(errMsg(e));
    }
  };

  const react = async (emoji: string) => {
    setPicker(false);
    try {
      await chatApi.react(m.id, emoji);
    } catch (e) {
      onToast(errMsg(e));
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await chatApi.remove(m.id);
    } catch (e) {
      onToast(errMsg(e));
    }
  };

  return (
    <div className="ch-msg" id={`msg-${m.id}`} style={s(`display:flex;gap:12px;padding:${grouped ? "2px" : "10px"} 18px 2px;position:relative`)}>
      <div style={s(`width:36px;flex:none`)}>
        {!grouped && <Avatar name={m.author.name} />}
      </div>
      <div style={s(`flex:1;min-width:0`)}>
        {m.replyTo && (
          <a href={`#msg-${m.replyTo.id}`} style={s(`display:flex;gap:6px;align-items:center;font-size:12px;color:#6a6480;margin-bottom:2px;text-decoration:none`)}>
            <Icon name="ic-arrow-l" size={11} /> <b>@{m.replyTo.author.name}</b> <span style={s(`overflow:hidden;text-overflow:ellipsis;white-space:nowrap`)}>{m.replyTo.excerpt}</span>
          </a>
        )}
        {(!grouped || m.replyTo) && (
          <div style={s(`display:flex;gap:8px;align-items:baseline`)}>
            <b style={s(`font-size:14px;color:hsl(${hue(m.author.name)} 55% 38%)`)}>{m.author.name}</b>
            <time dateTime={m.createdAt} title={new Date(m.createdAt).toLocaleString()} style={s(`font-size:11px;color:#a79fbe`)}>{clockTime(m.createdAt)}</time>
          </div>
        )}
        {m.deleted ? (
          <div style={s(`font-size:13px;color:#a79fbe;font-style:italic`)}>Message deleted</div>
        ) : editing ? (
          <div style={s(`display:flex;flex-direction:column;gap:6px;margin-top:4px`)}>
            <textarea className="in" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} aria-label="Edit message" style={s(`min-height:50px;resize:vertical`)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === "Escape") setEditing(false); }} autoFocus />
            <div style={s(`font-size:11px;color:#6a6480`)}>Enter to save · Esc to cancel</div>
          </div>
        ) : (
          <div style={s(`font-size:14px;line-height:1.55;color:#1f1633`)}>
            {m.body && <MessageText text={m.body} me={me.name} />}
            {m.editedAt && <span style={s(`font-size:10.5px;color:#a79fbe;margin-left:6px`)}>(edited)</span>}
          </div>
        )}
        {m.sharedPost && (
          <Link href="/community" className="card" style={s(`display:flex;gap:10px;align-items:center;padding:10px 12px;margin-top:6px;max-width:420px;border-left:3px solid #7c3aed;text-decoration:none;color:inherit`)}>
            <Icon name="ic-book" size={16} style={s(`stroke:#7c3aed;flex:none`)} />
            <span style={s(`min-width:0`)}>
              <span style={s(`display:block;font-size:10.5px;color:#6a6480;text-transform:uppercase;letter-spacing:.4px`)}>Shared community post</span>
              <span style={s(`display:block;font-weight:600;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`)}>{m.sharedPost.title}</span>
            </span>
          </Link>
        )}
        {m.reactions.length > 0 && (
          <div style={s(`display:flex;gap:6px;flex-wrap:wrap;margin-top:6px`)}>
            {m.reactions.map((r) => {
              const mineR = r.users.some((u) => u.uid === me.uid);
              return (
                <button key={r.emoji} type="button" onClick={() => react(r.emoji)} title={r.users.map((u) => u.name).join(", ")} aria-pressed={mineR}
                  style={s(`border-radius:999px;padding:2px 8px;font-size:12.5px;cursor:pointer;border:1px solid ${mineR ? "#7c3aed" : "rgba(124,58,237,.18)"};background:${mineR ? "rgba(124,58,237,.12)" : "rgba(255,255,255,.7)"}`)}>
                  {r.emoji} {r.users.length}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {!m.deleted && !editing && (
        <div className="ch-actions" style={s(`position:absolute;right:16px;top:-8px;display:flex;gap:2px;background:#fff;border:1px solid rgba(124,58,237,.18);border-radius:8px;padding:2px;box-shadow:0 6px 16px -8px rgba(40,20,80,.3)`)}>
          <button type="button" className="ch-ibtn" title="React" aria-label="React" onClick={() => setPicker(!picker)}>😊</button>
          <button type="button" className="ch-ibtn" title="Reply" aria-label="Reply" onClick={() => onReply(m)}><Icon name="ic-arrow-l" size={14} /></button>
          {mine && <button type="button" className="ch-ibtn" title="Edit" aria-label="Edit" onClick={() => { setText(m.body); setEditing(true); }}><Icon name="ic-slider" size={14} /></button>}
          {(mine || canModerate) && <button type="button" className="ch-ibtn" title="Delete" aria-label="Delete" onClick={remove}><Icon name="ic-x" size={14} /></button>}
          {picker && (
            <div style={s(`position:absolute;right:0;top:32px;z-index:5;display:flex;gap:2px;background:#fff;border:1px solid rgba(124,58,237,.18);border-radius:10px;padding:4px;box-shadow:0 10px 24px -10px rgba(40,20,80,.35)`)}>
              {reactions.map((e) => <button key={e} type="button" className="ch-ibtn" onClick={() => react(e)} aria-label={`React ${e}`}>{e}</button>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Conversation({ room, title, subtitle, me, reactions, canModerate, canMessage, disabledReason, incoming, typingNames, onToast, header }: {
  room: Room;
  title: string;
  subtitle: string;
  me: Person;
  reactions: string[];
  canModerate: boolean;
  canMessage: boolean;
  disabledReason?: string;
  incoming: { seq: number; message: Message | null; resync: number };
  typingNames: string[];
  onToast: (t: string) => void;
  header?: React.ReactNode;
}) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [before, setBefore] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const lastTyping = useRef(0);
  const roomKey = `${room.roomType}:${room.roomId}`;

  const load = useCallback(async () => {
    setError("");
    try {
      const page = await chatApi.messages(room.roomType, room.roomId);
      setMessages(page.messages);
      setBefore(page.nextBefore);
      stick.current = true;
      chatApi.markRead(room.roomType, room.roomId).catch(() => {});
    } catch (e) {
      setError(errMsg(e));
    }
  }, [room.roomType, room.roomId]);

  useEffect(() => {
    setMessages(null);
    setReplyTo(null);
    setText("");
    load();
  }, [load]);

  // Missed events while the stream was reconnecting: reload
  useEffect(() => {
    if (incoming.resync) load();
  }, [incoming.resync, load]);

  // New or changed message for this room from the stream
  useEffect(() => {
    const m = incoming.message;
    if (!m || `${m.roomType}:${m.roomId}` !== roomKey) return;
    setMessages((prev) => {
      if (!prev) return prev;
      const i = prev.findIndex((x) => x.id === m.id);
      if (i >= 0) return prev.map((x) => (x.id === m.id ? m : x));
      return [...prev, m];
    });
    if (document.visibilityState === "visible") chatApi.markRead(room.roomType, room.roomId).catch(() => {});
  }, [incoming.seq]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the view pinned to the newest message unless the user scrolled up
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = listRef.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const loadOlder = async () => {
    if (!before) return;
    const el = listRef.current;
    const prevHeight = el ? el.scrollHeight : 0;
    try {
      const page = await chatApi.messages(room.roomType, room.roomId, before);
      stick.current = false;
      setMessages((prev) => [...page.messages, ...(prev || [])]);
      setBefore(page.nextBefore);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    } catch (e) {
      onToast(errMsg(e));
    }
  };

  const submit = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const m = await chatApi.send(room.roomType, room.roomId, { body, replyTo: replyTo?.id });
      stick.current = true;
      setMessages((prev) => (prev && !prev.some((x) => x.id === m.id) ? [...prev, m] : prev));
      setText("");
      setReplyTo(null);
    } catch (e) {
      onToast(errMsg(e));
    } finally {
      setSending(false);
    }
  };

  const onType = (value: string) => {
    setText(value);
    if (Date.now() - lastTyping.current > 3000 && value.trim()) {
      lastTyping.current = Date.now();
      chatApi.typing(room.roomType, room.roomId).catch(() => {});
    }
  };

  return (
    <div style={s(`display:flex;flex-direction:column;height:100%;min-width:0`)}>
      <div style={s(`display:flex;align-items:center;gap:10px;padding:12px 18px;border-bottom:1px solid rgba(124,58,237,.12);min-height:56px`)}>
        {header}
        <div style={s(`min-width:0;flex:1`)}>
          <div className="disp" style={s(`font-weight:600;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`)}>{title}</div>
          {subtitle && <div style={s(`font-size:12px;color:#6a6480;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`)}>{subtitle}</div>}
        </div>
      </div>

      <div ref={listRef} onScroll={onScroll} style={s(`flex:1;overflow-y:auto;padding:8px 0 12px`)} aria-live="polite">
        {error && <p className="set-error" style={s(`padding:18px`)}>{error} <button type="button" className="cm-link" onClick={load}>Retry</button></p>}
        {messages === null && !error && <div style={s(`padding:18px`)}><div className="set-skel-bar" style={s(`height:60px;border-radius:12px`)} /></div>}
        {before && <div style={s(`text-align:center;padding:8px`)}><button type="button" className="btn btn-g btn-s" onClick={loadOlder}>Load earlier messages</button></div>}
        {messages && messages.length === 0 && (
          <div style={s(`padding:40px 24px;text-align:center;color:#6a6480`)}>
            <div className="disp" style={s(`font-size:17px;font-weight:600;color:#1f1633`)}>Welcome to {title}</div>
            <p style={s(`font-size:13px;margin-top:6px`)}>This is the start of the conversation. Say hello!</p>
          </div>
        )}
        {messages?.map((m, i) => {
          const prev = messages[i - 1];
          const grouped = Boolean(prev && !prev.deleted && prev.author.uid === m.author.uid && !m.replyTo &&
            new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000);
          return <MessageRow key={m.id} m={m} grouped={grouped} me={me} reactions={reactions} canModerate={canModerate} onReply={setReplyTo} onToast={onToast} />;
        })}
      </div>

      <div style={s(`padding:0 18px 14px`)}>
        <div style={s(`height:18px;font-size:11.5px;color:#6a6480`)}>
          {typingNames.length > 0 && `${typingNames.slice(0, 3).join(", ")} ${typingNames.length === 1 ? "is" : "are"} typing…`}
        </div>
        {replyTo && (
          <div style={s(`display:flex;align-items:center;gap:8px;font-size:12px;background:rgba(124,58,237,.08);border-radius:10px 10px 0 0;padding:6px 10px`)}>
            Replying to <b>@{replyTo.author.name}</b>
            <span style={s(`flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#6a6480`)}>{replyTo.body}</span>
            <button type="button" className="cm-link" onClick={() => setReplyTo(null)} aria-label="Cancel reply"><Icon name="ic-x" size={12} /></button>
          </div>
        )}
        {canMessage ? (
          <div style={s(`display:flex;gap:8px;align-items:flex-end`)}>
            <textarea className="in" value={text} onChange={(e) => onType(e.target.value)} maxLength={2000} rows={1}
              placeholder={`Message ${title}`} aria-label={`Message ${title}`}
              style={s(`min-height:44px;max-height:160px;resize:vertical;${replyTo ? "border-top-left-radius:0;border-top-right-radius:0" : ""}`)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} />
            <button type="button" className="btn btn-v btn-s" onClick={submit} disabled={sending || !text.trim()} aria-label="Send">Send</button>
          </div>
        ) : (
          <div className="in" style={s(`color:#6a6480;text-align:center`)}>{disabledReason || "You can't send messages here"}</div>
        )}
        {canMessage && <div style={s(`font-size:10.5px;color:#a79fbe;margin-top:4px`)}>Enter to send · Shift+Enter for a new line · ``` for code</div>}
      </div>
    </div>
  );
}

// ---------- members panel ----------

function MembersPanel({ group, me, version, onDm, onToast }: {
  group: GroupSummary;
  me: Person;
  version: number;
  onDm: (name: string) => void;
  onToast: (t: string) => void;
}) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [menu, setMenu] = useState<string | null>(null);

  useEffect(() => {
    chatApi.members(group.id).then(setMembers).catch(() => setMembers([]));
  }, [group.id, version]);

  const rank = { member: 0, moderator: 1, owner: 2 };
  const myRank = rank[group.role || "member"];

  const act = async (label: string, fn: () => Promise<void>) => {
    setMenu(null);
    try {
      await fn();
      onToast(label);
      setMembers(await chatApi.members(group.id));
    } catch (e) {
      onToast(errMsg(e));
    }
  };

  const sections = (["owner", "moderator", "member"] as const)
    .map((role) => ({ role, list: (members || []).filter((m) => m.role === role) }))
    .filter((x) => x.list.length);

  return (
    <div style={s(`padding:14px 12px;overflow-y:auto;height:100%`)}>
      {members === null && <div className="set-skel-bar" style={s(`height:40px;border-radius:10px`)} />}
      {sections.map(({ role, list }) => (
        <div key={role} style={s(`margin-bottom:14px`)}>
          <div className="eyebrow" style={s(`margin:0 6px 6px`)}>{ROLE_LABEL[role]}s · {list.length}</div>
          {list.map((m) => {
            const isMe = m.uid === me.uid;
            const canManage = !isMe && myRank > rank[m.role];
            return (
              <div key={m.uid} style={s(`position:relative`)}>
                <button type="button" className="ch-row" onClick={() => setMenu(menu === m.uid ? null : m.uid)} aria-expanded={menu === m.uid} style={s(`opacity:${m.online ? 1 : 0.6}`)}>
                  <Avatar name={m.name} size={30} online={m.online} />
                  <span style={s(`overflow:hidden;text-overflow:ellipsis;white-space:nowrap`)}>{m.name}{isMe ? " (you)" : ""}</span>
                </button>
                {menu === m.uid && (
                  <div className="card" style={s(`position:absolute;right:4px;top:38px;z-index:5;padding:6px;display:flex;flex-direction:column;min-width:170px;background:#fff`)}>
                    {!isMe && <button type="button" className="ch-menu" onClick={() => { setMenu(null); onDm(m.name); }}>Message</button>}
                    {canManage && group.role === "owner" && (
                      m.role === "moderator"
                        ? <button type="button" className="ch-menu" onClick={() => act(`${m.name} is now a member`, () => chatApi.setRole(group.id, m.uid, "member"))}>Remove moderator</button>
                        : <button type="button" className="ch-menu" onClick={() => act(`${m.name} is now a moderator`, () => chatApi.setRole(group.id, m.uid, "moderator"))}>Make moderator</button>
                    )}
                    {canManage && group.role === "owner" && (
                      <button type="button" className="ch-menu" onClick={() => window.confirm(`Make ${m.name} the owner? You'll become a moderator.`) && act("Ownership transferred", () => chatApi.transfer(group.id, m.uid))}>Transfer ownership</button>
                    )}
                    {canManage && <button type="button" className="ch-menu" onClick={() => window.confirm(`Kick ${m.name}?`) && act(`${m.name} was kicked`, () => chatApi.kick(group.id, m.uid))}>Kick</button>}
                    {canManage && <button type="button" className="ch-menu" style={s(`color:#b4323a`)} onClick={() => window.confirm(`Ban ${m.name}? They can't rejoin until unbanned.`) && act(`${m.name} was banned`, () => chatApi.ban(group.id, m.uid))}>Ban</button>}
                    {isMe && <span style={s(`font-size:12px;color:#6a6480;padding:6px 8px`)}>That's you</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ---------- screen ----------

export default function ChatScreen() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<ChatApiError | null>(null);
  const [view, setView] = useState<View>({ kind: "home" });
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [dm, setDm] = useState<DmDetail | null>(null);
  const [incoming, setIncoming] = useState<{ seq: number; message: Message | null; resync: number }>({ seq: 0, message: null, resync: 0 });
  const [typing, setTyping] = useState<Record<string, { name: string; uid: string; until: number }[]>>({});
  const [membersVersion, setMembersVersion] = useState(0);
  const [showMembers, setShowMembers] = useState(true);
  const [mobileMain, setMobileMain] = useState(false);
  const [dialog, setDialog] = useState<null | "create" | "settings" | { channel: Channel | null }>(null);
  const [invite, setInvite] = useState<(GroupSummary & { code: string }) | null>(null);
  const [dmName, setDmName] = useState("");
  const [toast, setToast] = useState("");
  const viewRef = useRef(view);
  viewRef.current = view;

  const loadOverview = useCallback(async () => {
    try {
      setOverview(await chatApi.overview());
      setError(null);
    } catch (e) {
      setError(e instanceof ChatApiError ? e : new ChatApiError(0, errMsg(e)));
    }
  }, []);

  const loadGroup = useCallback(async (groupId: string) => {
    try {
      const d = await chatApi.group(groupId);
      setDetail(d);
      return d;
    } catch (e) {
      setToast(errMsg(e));
      setView({ kind: "home" });
      return null;
    }
  }, []);

  // URL: ?g=<group>&c=<channel> | ?dm=<id> | ?invite=<code>
  useEffect(() => {
    loadOverview();
    const params = new URLSearchParams(window.location.search);
    const code = params.get("invite");
    if (code) {
      chatApi.previewInvite(code).then((g) => setInvite({ ...g, code })).catch((e) => setToast(errMsg(e)));
    } else if (params.get("g")) {
      setView({ kind: "group", groupId: params.get("g")!, channelId: params.get("c") });
      setMobileMain(true);
    } else if (params.get("dm")) {
      setView({ kind: "dm", dmId: params.get("dm")! });
      setMobileMain(true);
    }
  }, [loadOverview]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (view.kind === "group") {
      params.set("g", view.groupId);
      if (view.channelId) params.set("c", view.channelId);
    } else if (view.kind === "dm") {
      params.set("dm", view.dmId);
    }
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [view]);

  // Group opened: load channels, pick the first if none chosen
  useEffect(() => {
    if (view.kind !== "group") {
      setDetail(null);
      return;
    }
    loadGroup(view.groupId).then((d) => {
      if (d && d.member && !view.channelId && d.channels[0]) {
        setView({ kind: "group", groupId: view.groupId, channelId: d.channels[0].id });
      }
    });
  }, [view.kind === "group" ? view.groupId : null]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (view.kind !== "dm") {
      setDm(null);
      return;
    }
    chatApi.dm(view.dmId).then(setDm).catch((e) => {
      setToast(errMsg(e));
      setView({ kind: "home" });
    });
  }, [view.kind === "dm" ? view.dmId : null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear unread for the room being viewed
  useEffect(() => {
    if (view.kind === "group" && view.channelId) {
      setDetail((d) => d && { ...d, channels: d.channels.map((c) => (c.id === view.channelId ? { ...c, unread: 0 } : c)) });
      setOverview((o) => o && {
        ...o,
        groups: o.groups.map((g) => (g.id === view.groupId ? { ...g, unread: false } : g)),
      });
    }
    if (view.kind === "dm") {
      setOverview((o) => o && { ...o, dms: o.dms.map((d) => (d.id === view.dmId ? { ...d, unread: 0 } : d)) });
    }
  }, [view]);

  // Real-time events
  useEffect(() => {
    let first = true;
    const stop = openChatStream((e: ChatEvent) => {
      const v = viewRef.current;
      if (e.type === "ready") {
        if (!first) {
          loadOverview();
          setIncoming((x) => ({ ...x, resync: x.resync + 1 }));
        }
        first = false;
        return;
      }
      if (e.type === "message.created" || e.type === "message.updated") {
        setIncoming((x) => ({ seq: x.seq + 1, message: e.message, resync: x.resync }));
        if (e.type === "message.created") {
          setTyping((t) => ({ ...t, [`${e.roomType}:${e.roomId}`]: (t[`${e.roomType}:${e.roomId}`] || []).filter((u) => u.uid !== e.message.author.uid) }));
          const viewing = (v.kind === "group" && e.roomType === "channel" && v.channelId === e.roomId) || (v.kind === "dm" && e.roomType === "dm" && v.dmId === e.roomId);
          if (!viewing) {
            setOverview((o) => {
              if (!o || e.message.author.uid === o.me.uid) return o;
              if (e.roomType === "dm") {
                if (!o.dms.some((d) => d.id === e.roomId)) {
                  loadOverview();
                  return o;
                }
                return { ...o, dms: o.dms.map((d) => (d.id === e.roomId ? { ...d, unread: d.unread + 1, lastMessageAt: e.message.createdAt } : d)) };
              }
              return { ...o, groups: o.groups.map((g) => (g.id === e.groupId ? { ...g, unread: true } : g)) };
            });
            if (e.roomType === "channel" && v.kind === "group" && v.groupId === e.groupId) {
              setDetail((d) => d && { ...d, channels: d.channels.map((c) => (c.id === e.roomId ? { ...c, unread: Math.min(99, c.unread + 1) } : c)) });
            }
          }
        }
        return;
      }
      if (e.type === "typing") {
        const key = `${e.roomType}:${e.roomId}`;
        setTyping((t) => ({ ...t, [key]: [...(t[key] || []).filter((u) => u.uid !== e.user.uid), { ...e.user, until: Date.now() + 5000 }] }));
        return;
      }
      if (e.type === "group.updated" || e.type === "members.changed") {
        if (v.kind === "group" && v.groupId === e.groupId) {
          if (e.type === "group.updated") loadGroup(e.groupId);
          else setMembersVersion((n) => n + 1);
        }
        if (e.type === "group.updated") loadOverview();
        return;
      }
      if (e.type === "group.removed") {
        loadOverview();
        if (v.kind === "group" && v.groupId === e.groupId) {
          setView({ kind: "home" });
          setMobileMain(false);
          setToast(e.reason === "banned" ? "You were banned from that group" : e.reason === "kicked" ? "You were removed from that group" : "That group was deleted");
        }
      }
    });
    return stop;
  }, [loadOverview, loadGroup]);

  // Expire typing indicators
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setTyping((all) => {
        let changed = false;
        const next: typeof all = {};
        for (const [k, list] of Object.entries(all)) {
          const live = list.filter((u) => u.until > now);
          if (live.length !== list.length) changed = true;
          if (live.length) next[k] = live;
        }
        return changed ? next : all;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const clearToast = useCallback(() => setToast(""), []);

  const openGroup = (groupId: string, channelId: string | null = null) => {
    setView({ kind: "group", groupId, channelId });
    setMobileMain(true);
  };

  const startDm = async (username: string) => {
    try {
      const d = await chatApi.openDm(username);
      await loadOverview();
      setView({ kind: "dm", dmId: d.id });
      setMobileMain(true);
      setDmName("");
    } catch (e) {
      setToast(errMsg(e));
    }
  };

  const acceptInvite = async () => {
    if (!invite) return;
    try {
      const g = await chatApi.joinInvite(invite.code);
      setInvite(null);
      await loadOverview();
      openGroup(g.id);
    } catch (e) {
      setToast(errMsg(e));
    }
  };

  if (error) {
    return (
      <div data-screen>
        <div className="card" style={s(`padding:26px;text-align:center`)} role="alert">
          <p className="set-error">{error.message}</p>
          <div style={s(`margin-top:14px`)}>
            {error.status === 401 ? <Link className="btn btn-v btn-s" href="/login">Sign in</Link> : <button className="btn btn-v btn-s" onClick={loadOverview}>Try again</button>}
          </div>
        </div>
      </div>
    );
  }

  const me = overview?.me || { uid: "", name: "" };
  const group = detail?.group;
  const channel = view.kind === "group" && detail ? detail.channels.find((c) => c.id === view.channelId) || null : null;
  const isMod = group?.role === "owner" || group?.role === "moderator";
  const room: Room | null = view.kind === "group" && channel ? { roomType: "channel", roomId: channel.id } : view.kind === "dm" && dm ? { roomType: "dm", roomId: dm.id } : null;
  const typingNames = room ? (typing[`${room.roomType}:${room.roomId}`] || []).map((u) => u.name) : [];
  const backBtn = (
    <button type="button" className="ch-ibtn ch-back" aria-label="Back" onClick={() => setMobileMain(false)}><Icon name="ic-back" size={16} /></button>
  );

  return (
    <div data-screen>
      <div style={s(`display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap`)}>
        <div style={s(`flex:1;min-width:200px`)}>
          <div className="eyebrow" style={s(`margin-bottom:6px`)}><Link href="/community" style={s(`color:inherit`)}>Community</Link> / Groups &amp; chat</div>
          <h1 className="disp" style={s(`font-size:26px;font-weight:600`)}><span className="grad">Groups &amp; chat</span></h1>
        </div>
        <Link href="/community" className="btn btn-g btn-s">Back to feed</Link>
      </div>

      <div className={`ch-shell glass${mobileMain ? " ch-main-open" : ""}${view.kind === "group" && detail?.member && showMembers ? " ch-with-members" : ""}`}>
        {/* rail */}
        <nav className="ch-rail" aria-label="Groups">
          <button type="button" className={`ch-rail-btn${view.kind === "home" || view.kind === "dm" ? " on" : ""}`} title="Direct messages" onClick={() => { setView({ kind: "home" }); setMobileMain(false); }}>
            <Icon name="ic-msg" size={20} />
            {overview?.dms.some((d) => d.unread) && <span className="ch-dot" />}
          </button>
          <span style={s(`width:28px;height:2px;background:rgba(124,58,237,.15);border-radius:2px;margin:2px auto`)} />
          {overview?.groups.map((g) => (
            <button key={g.id} type="button" className={`ch-rail-btn${view.kind === "group" && view.groupId === g.id ? " on" : ""}`} title={g.name} onClick={() => openGroup(g.id)}>
              <span style={s(`font-weight:700;font-size:16px;color:#fff;width:100%;height:100%;display:grid;place-items:center;border-radius:inherit;background:linear-gradient(135deg,hsl(${hue(g.name)} 65% 55%),hsl(${(hue(g.name) + 40) % 360} 65% 42%))`)}>{g.name.slice(0, 1).toUpperCase()}</span>
              {g.unread && <span className="ch-dot" />}
            </button>
          ))}
          <button type="button" className="ch-rail-btn ch-rail-add" title="Create a group" aria-label="Create a group" onClick={() => setDialog("create")}><Icon name="ic-plus" size={18} /></button>
          <button type="button" className={`ch-rail-btn ch-rail-add${view.kind === "discover" ? " on" : ""}`} title="Discover groups" aria-label="Discover groups" onClick={() => { setView({ kind: "discover" }); setMobileMain(true); }}><Icon name="ic-search" size={18} /></button>
        </nav>

        {/* sidebar */}
        <aside className="ch-side">
          {view.kind === "group" && group ? (
            <>
              <button type="button" className="ch-side-head" onClick={() => setDialog("settings")} title="Group settings">
                <span style={s(`flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`)}>{group.name}</span>
                <Icon name="ic-gear" size={15} />
              </button>
              <div style={s(`padding:10px 8px;overflow-y:auto;flex:1`)}>
                {detail?.member ? (
                  <>
                    <div style={s(`display:flex;align-items:center;justify-content:space-between;padding:4px 8px`)}>
                      <span className="eyebrow">Text channels</span>
                      {isMod && <button type="button" className="ch-ibtn" title="Create channel" aria-label="Create channel" onClick={() => setDialog({ channel: null })}><Icon name="ic-plus" size={14} /></button>}
                    </div>
                    {detail.channels.map((c) => (
                      <div key={c.id} style={s(`display:flex;align-items:center`)}>
                        <button type="button" className={`ch-row${c.id === view.channelId ? " on" : ""}`} onClick={() => { setView({ kind: "group", groupId: group.id, channelId: c.id }); setMobileMain(true); }}>
                          <span style={s(`color:#a79fbe;font-weight:700`)}>#</span>
                          <span style={s(`flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;${c.unread ? "font-weight:700;color:#1f1633" : ""}`)}>{c.name}</span>
                          {c.unread > 0 && <span className="ch-badge">{c.unread >= 99 ? "99+" : c.unread}</span>}
                        </button>
                        {isMod && c.id === view.channelId && <button type="button" className="ch-ibtn" title="Edit channel" aria-label="Edit channel" onClick={() => setDialog({ channel: c })}><Icon name="ic-gear" size={13} /></button>}
                      </div>
                    ))}
                  </>
                ) : (
                  <p style={s(`font-size:12.5px;color:#6a6480;padding:8px`)}>Join to see channels.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="ch-side-head" style={s(`cursor:default`)}>Direct messages</div>
              <form onSubmit={(e) => { e.preventDefault(); if (dmName.trim()) startDm(dmName.trim()); }} style={s(`display:flex;gap:6px;padding:10px 10px 4px`)}>
                <input className="in" placeholder="Username" value={dmName} onChange={(e) => setDmName(e.target.value)} maxLength={20} aria-label="Start a DM by username" style={s(`padding:8px 10px;font-size:12.5px`)} />
                <button className="btn btn-v btn-s" disabled={!dmName.trim()} style={s(`padding:8px 10px`)}>Chat</button>
              </form>
              <div style={s(`padding:6px 8px;overflow-y:auto;flex:1`)}>
                {overview && overview.dms.length === 0 && <p style={s(`font-size:12.5px;color:#6a6480;padding:8px`)}>No conversations yet. Start one with a username, or from a group&apos;s member list.</p>}
                {overview?.dms.map((d) => (
                  <button key={d.id} type="button" className={`ch-row${view.kind === "dm" && view.dmId === d.id ? " on" : ""}`} onClick={() => { setView({ kind: "dm", dmId: d.id }); setMobileMain(true); }}>
                    <Avatar name={d.other.name} size={28} online={d.other.online} />
                    <span style={s(`flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;${d.unread ? "font-weight:700;color:#1f1633" : ""}`)}>{d.other.name}</span>
                    {d.unread > 0 && <span className="ch-badge">{d.unread >= 99 ? "99+" : d.unread}</span>}
                  </button>
                ))}
              </div>
            </>
          )}
          <div style={s(`display:flex;align-items:center;gap:8px;padding:10px 12px;border-top:1px solid rgba(124,58,237,.12)`)}>
            <Avatar name={me.name || "?"} size={30} online />
            <span style={s(`font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`)}>{me.name}</span>
          </div>
        </aside>

        {/* main */}
        <main className="ch-main">
          {!overview ? (
            <div style={s(`padding:22px`)}><div className="set-skel-bar" style={s(`height:80px;border-radius:12px`)} /></div>
          ) : view.kind === "discover" ? (
            <div style={s(`height:100%;display:flex;flex-direction:column`)}>
              <div className="ch-back-row">{backBtn}</div>
              <Discover onOpen={async (id) => { await loadOverview(); openGroup(id); }} onToast={setToast} />
            </div>
          ) : view.kind === "group" && detail && !detail.member ? (
            <div style={s(`padding:40px 24px;text-align:center`)}>
              <div className="ch-back-row">{backBtn}</div>
              <Avatar name={detail.group.name} size={64} />
              <h2 className="disp" style={s(`font-size:22px;font-weight:600;margin-top:12px`)}>{detail.group.name}</h2>
              <p style={s(`font-size:13px;color:#6a6480;margin-top:6px`)}>{detail.group.description || "No description"} · {detail.group.memberCount} members</p>
              <button type="button" className="btn btn-v btn-s" style={s(`margin-top:16px`)} onClick={async () => { try { await chatApi.join(detail.group.id); await loadOverview(); await loadGroup(detail.group.id); setView({ kind: "group", groupId: detail.group.id, channelId: null }); } catch (e) { setToast(errMsg(e)); } }}>Join group</button>
            </div>
          ) : room && view.kind === "group" && channel && group ? (
            <Conversation
              key={room.roomId}
              room={room}
              title={`#${channel.name}`}
              subtitle={channel.topic}
              me={me}
              reactions={overview.reactions}
              canModerate={isMod}
              canMessage
              incoming={incoming}
              typingNames={typingNames}
              onToast={setToast}
              header={
                <>
                  {backBtn}
                  <button type="button" className="ch-ibtn ch-members-toggle" title="Members" aria-label="Toggle member list" aria-pressed={showMembers} onClick={() => setShowMembers(!showMembers)} style={s(`order:2`)}><Icon name="ic-users" size={16} /></button>
                </>
              }
            />
          ) : room && view.kind === "dm" && dm ? (
            <Conversation
              key={room.roomId}
              room={room}
              title={dm.other.name}
              subtitle={dm.other.online ? "Online" : "Offline"}
              me={me}
              reactions={overview.reactions}
              canModerate={false}
              canMessage={dm.canMessage}
              disabledReason={dm.blockedByMe ? "You blocked this member. Unblock to send messages." : "You can't message this member."}
              incoming={incoming}
              typingNames={typingNames}
              onToast={setToast}
              header={
                <>
                  {backBtn}
                  <button type="button" className="btn btn-g btn-s" style={s(`order:2`)} onClick={async () => {
                    if (!dm.blockedByMe && !window.confirm(`Block ${dm.other.name}? Neither of you will be able to send messages here.`)) return;
                    try { await chatApi.block(dm.id, !dm.blockedByMe); setDm(await chatApi.dm(dm.id)); } catch (e) { setToast(errMsg(e)); }
                  }}>{dm.blockedByMe ? "Unblock" : "Block"}</button>
                </>
              }
            />
          ) : (
            <div style={s(`padding:48px 24px;text-align:center`)}>
              <img src="/bird-support.jpg" alt="" style={s(`width:84px;height:84px;border-radius:22px;object-fit:cover`)} />
              <h2 className="disp" style={s(`font-size:20px;font-weight:600;margin-top:12px`)}>Study together</h2>
              <p style={s(`font-size:13px;color:#6a6480;margin-top:6px;max-width:380px;margin-inline:auto;line-height:1.55`)}>
                Create a group for your class or CTF team, discover public groups, or message another member directly.
              </p>
              <div style={s(`display:flex;gap:8px;justify-content:center;margin-top:16px;flex-wrap:wrap`)}>
                <button type="button" className="btn btn-v btn-s" onClick={() => setDialog("create")}>Create a group</button>
                <button type="button" className="btn btn-g btn-s" onClick={() => { setView({ kind: "discover" }); setMobileMain(true); }}>Discover groups</button>
              </div>
            </div>
          )}
        </main>

        {/* members */}
        {view.kind === "group" && group && detail?.member && showMembers && (
          <aside className="ch-members" aria-label="Members">
            <MembersPanel group={group} me={me} version={membersVersion} onDm={startDm} onToast={setToast} />
          </aside>
        )}
      </div>

      {dialog === "create" && (
        <CreateGroupDialog onClose={() => setDialog(null)} onCreated={async (g) => { setDialog(null); await loadOverview(); openGroup(g.id); setToast("Group created"); }} />
      )}
      {dialog === "settings" && detail && (
        <GroupSettingsDialog
          detail={detail}
          onClose={() => setDialog(null)}
          onChanged={() => { if (view.kind === "group") loadGroup(view.groupId); loadOverview(); }}
          onGone={(msg) => { setDialog(null); setView({ kind: "home" }); setMobileMain(false); loadOverview(); setToast(msg); }}
          onToast={setToast}
        />
      )}
      {dialog && typeof dialog === "object" && view.kind === "group" && (
        <ChannelDialog
          groupId={view.groupId}
          channel={dialog.channel}
          onClose={() => setDialog(null)}
          onSaved={async (c) => { setDialog(null); await loadGroup(view.groupId); setView({ kind: "group", groupId: view.groupId, channelId: c.id }); }}
          onDeleted={async () => { setDialog(null); const d = await loadGroup(view.groupId); setView({ kind: "group", groupId: view.groupId, channelId: d?.channels[0]?.id || null }); }}
        />
      )}
      {invite && (
        <Dialog title="You're invited" onClose={() => setInvite(null)}>
          <div style={s(`display:flex;gap:12px;align-items:center`)}>
            <Avatar name={invite.name} size={48} />
            <div>
              <div className="disp" style={s(`font-weight:600;font-size:16px`)}>{invite.name}</div>
              <div style={s(`font-size:12px;color:#6a6480`)}>{invite.memberCount} member{invite.memberCount === 1 ? "" : "s"} · {invite.visibility}</div>
            </div>
          </div>
          {invite.description && <p style={s(`font-size:13px;color:#4a4560;margin-top:12px;line-height:1.55`)}>{invite.description}</p>}
          <div style={s(`display:flex;justify-content:flex-end;gap:8px;margin-top:18px`)}>
            <button type="button" className="btn btn-g btn-s" onClick={() => setInvite(null)}>Not now</button>
            {invite.joined
              ? <button type="button" className="btn btn-v btn-s" onClick={() => { setInvite(null); openGroup(invite.id); }}>Open group</button>
              : <button type="button" className="btn btn-v btn-s" onClick={acceptInvite}>Join group</button>}
          </div>
        </Dialog>
      )}
      {toast && <Toast text={toast} onDone={clearToast} />}
    </div>
  );
}
