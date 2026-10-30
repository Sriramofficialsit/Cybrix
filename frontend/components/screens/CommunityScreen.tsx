"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { s } from "@/lib/style";
import { Icon } from "@/components/Icon";
import {
  CommunityApiError,
  KIND_LABELS,
  REPORT_REASONS,
  addComment,
  createPost,
  deleteComment,
  deletePost,
  fetchComments,
  fetchFeed,
  fetchHighlights,
  fetchPost,
  reportComment,
  reportPost,
  setLike,
  timeAgo,
  updateComment,
  updatePost,
  type Comment,
  type FeedQuery,
  type Highlights,
  type Post,
  type PostInput,
  type PostKind,
} from "@/lib/community";
import { chatApi, type Channel, type Overview as ChatOverview } from "@/lib/chat";

const KIND_CHIP: Record<PostKind, string> = {
  writeup: "st st-v",
  question: "st st-info",
  announcement: "st st-warn",
};

const FILTERS: { label: string; kind: PostKind | null; mine?: boolean }[] = [
  { label: "All", kind: null },
  { label: "Write-ups", kind: "writeup" },
  { label: "Questions", kind: "question" },
  { label: "Announcements", kind: "announcement" },
  { label: "My posts", kind: null, mine: true },
];

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

// ---------- small pieces ----------

// Plain text with ``` fenced code blocks; React escapes everything
function RichText({ text }: { text: string }) {
  const parts = text.split(/```[^\n]*\n?/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <pre key={i} className="mono" style={s(`background:#150f23;color:#e9e3ff;border-radius:10px;padding:12px 14px;font-size:12px;overflow-x:auto;margin:8px 0;white-space:pre`)}>{part.replace(/\n$/, "")}</pre>
        ) : (
          part && <span key={i} style={s(`white-space:pre-wrap;word-break:break-word`)}>{part}</span>
        )
      )}
    </>
  );
}

function Avatar({ name, staff }: { name: string; staff: boolean }) {
  if (staff) return <img src="/logo.png" alt="" className="avatar" style={s(`width:36px;height:36px;object-fit:contain;padding:4px`)} />;
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
  return (
    <span className="avatar" aria-hidden="true" style={s(`width:36px;height:36px;display:grid;place-items:center;font-weight:700;font-size:14px;color:#fff;background:linear-gradient(135deg,hsl(${hue} 70% 55%),hsl(${(hue + 40) % 360} 70% 45%));flex:none`)}>
      {name.slice(0, 1).toUpperCase()}
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

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onClick={onClose} style={s(`position:fixed;inset:0;z-index:60;background:rgba(21,15,35,.45);display:grid;place-items:center;padding:16px`)}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={s(`width:100%;max-width:440px;padding:24px;background:#fff`)}>
        <h2 className="disp" style={s(`font-size:18px;font-weight:600;margin-bottom:12px`)}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function ReportDialog({ what, onSubmit, onClose }: {
  what: string;
  onSubmit: (reason: string, details: string) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(reason, details);
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <Dialog title={`Report ${what}`} onClose={() => !busy && onClose()}>
      <form onSubmit={submit}>
        <fieldset style={s(`border:0;padding:0;margin:0;display:flex;flex-direction:column;gap:8px`)}>
          <legend style={s(`font-size:13px;color:#6a6480;margin-bottom:8px`)}>Why should moderators look at this?</legend>
          {REPORT_REASONS.map((r) => (
            <label key={r.value} style={s(`display:flex;gap:8px;align-items:center;font-size:13.5px;cursor:pointer`)}>
              <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
              {r.label}
            </label>
          ))}
        </fieldset>
        <textarea className="in" style={s(`margin-top:12px;min-height:70px;resize:vertical`)} placeholder="Anything else moderators should know (optional)" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} />
        {error && <div className="err-msg" role="alert">{error}</div>}
        <div style={s(`display:flex;justify-content:flex-end;gap:8px;margin-top:16px`)}>
          <button type="button" className="btn btn-g btn-s" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-v btn-s" disabled={!reason || busy}>{busy ? "Sending…" : "Report"}</button>
        </div>
      </form>
    </Dialog>
  );
}

// ---------- composer (new post and edit) ----------

function PostForm({ initial, canAnnounce, submitLabel, onSubmit, onCancel }: {
  initial?: Post;
  canAnnounce: boolean;
  submitLabel: string;
  onSubmit: (input: PostInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [kind, setKind] = useState<PostKind>(initial?.kind ?? "writeup");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [tags, setTags] = useState(initial ? initial.tags.join(", ") : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const kinds: PostKind[] = canAnnounce || initial?.kind === "announcement" ? ["writeup", "question", "announcement"] : ["writeup", "question"];
  const [tried, setTried] = useState(false);
  const titleLen = title.trim().length;
  const bodyLen = body.trim().length;
  const titleProblem = titleLen < 5 ? `Title needs at least 5 characters (${titleLen}/5)` : "";
  const bodyProblem = bodyLen < 10 ? `Post needs at least 10 characters (${bodyLen}/10)` : "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (titleProblem || bodyProblem) return;
    setBusy(true);
    setError("");
    try {
      await onSubmit({ kind, title, body, tags });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={s(`display:flex;flex-direction:column;gap:10px`)}>
      <div role="radiogroup" aria-label="Post type" style={s(`display:flex;gap:6px;flex-wrap:wrap`)}>
        {kinds.map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} className={`btn btn-s ${kind === k ? "btn-v" : "btn-g"}`} onClick={() => setKind(k)}>{KIND_LABELS[k]}</button>
        ))}
      </div>
      <input placeholder={kind === "question" ? "What's your question?" : "Title"} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} aria-label="Title" className={`in${tried && titleProblem ? " invalid" : ""}`} />
      {tried && titleProblem && <div className="err-msg" role="alert">{titleProblem}</div>}
      <textarea placeholder={"Share the details. Wrap code in ``` fences.\nNo flags or exam answers for live challenges, please."} value={body} onChange={(e) => setBody(e.target.value)} maxLength={10000} aria-label="Post body" className={`in${tried && bodyProblem ? " invalid" : ""}`} style={s(`min-height:130px;resize:vertical;line-height:1.55`)} />
      {tried && bodyProblem && <div className="err-msg" role="alert">{bodyProblem}</div>}
      <div style={s(`display:flex;gap:10px;align-items:center;flex-wrap:wrap`)}>
        <input className="in" style={s(`flex:1;min-width:180px`)} placeholder="Tags: sqli, jwt, osint (up to 5)" value={tags} onChange={(e) => setTags(e.target.value)} maxLength={140} aria-label="Tags" />
        <span style={s(`font-size:11px;color:#a79fbe`)}>{body.length} / 10000</span>
      </div>
      {error && <div className="err-msg" role="alert">{error}</div>}
      <div style={s(`display:flex;justify-content:flex-end;gap:8px`)}>
        {onCancel && <button type="button" className="btn btn-g btn-s" onClick={onCancel} disabled={busy}>Cancel</button>}
        <button className="btn btn-v btn-s" disabled={busy}>{busy ? "Saving…" : submitLabel}</button>
      </div>
    </form>
  );
}

function Composer({ canAnnounce, onPosted }: { canAnnounce: boolean; onPosted: (p: Post) => void }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="glass" style={s(`border-radius:16px;padding:12px;display:flex;gap:10px;align-items:center`)}>
        <img src="/bird-head.jpg" alt="" className="avatar" />
        <button type="button" className="in" style={s(`text-align:left;cursor:text;color:#a79fbe`)} onClick={() => setOpen(true)}>Share a write-up, ask a question…</button>
        <button type="button" className="btn btn-v btn-s" onClick={() => setOpen(true)}>Post</button>
      </div>
    );
  }

  return (
    <div className="glass" style={s(`border-radius:16px;padding:16px`)}>
      <PostForm
        canAnnounce={canAnnounce}
        submitLabel="Publish"
        onCancel={() => setOpen(false)}
        onSubmit={async (input) => {
          const post = await createPost(input);
          setOpen(false);
          onPosted(post);
        }}
      />
    </div>
  );
}

// ---------- comments ----------

function CommentItem({ comment, onChanged, onRemoved, onToast }: {
  comment: Comment;
  onChanged: (c: Comment) => void;
  onRemoved: (id: string) => void;
  onToast: (t: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.body);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      onChanged(await updateComment(comment.id, text));
      setEditing(false);
    } catch (err) {
      onToast(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(comment.id);
      onRemoved(comment.id);
    } catch (err) {
      onToast(errMsg(err));
    }
  };

  return (
    <li style={s(`display:flex;gap:10px;align-items:flex-start`)}>
      <Avatar name={comment.author.name} staff={comment.author.staff} />
      <div style={s(`flex:1;min-width:0;background:rgba(124,58,237,.05);border-radius:12px;padding:10px 12px`)}>
        <div style={s(`display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;font-size:12px`)}>
          <b style={s(`font-size:13px`)}>{comment.author.name}</b>
          <span style={s(`color:#a79fbe`)}>{timeAgo(comment.createdAt)}{comment.editedAt ? " · edited" : ""}</span>
          {comment.status === "hidden" && <span className="st st-warn">Hidden pending review</span>}
          <span style={s(`margin-left:auto;display:flex;gap:10px`)}>
            {comment.mine ? (
              <>
                <button type="button" className="cm-link" onClick={() => setEditing(!editing)}>Edit</button>
                <button type="button" className="cm-link" onClick={remove}>Delete</button>
              </>
            ) : (
              <button type="button" className="cm-link" onClick={() => setReporting(true)}>Report</button>
            )}
          </span>
        </div>
        {editing ? (
          <form onSubmit={save} style={s(`margin-top:8px;display:flex;flex-direction:column;gap:8px`)}>
            <textarea className="in" value={text} onChange={(e) => setText(e.target.value)} maxLength={3000} style={s(`min-height:60px;resize:vertical`)} aria-label="Edit comment" />
            <div style={s(`display:flex;gap:6px;justify-content:flex-end`)}>
              <button type="button" className="btn btn-g btn-s" onClick={() => { setEditing(false); setText(comment.body); }}>Cancel</button>
              <button className="btn btn-v btn-s" disabled={busy || !text.trim()}>Save</button>
            </div>
          </form>
        ) : (
          <div style={s(`font-size:13.5px;margin-top:4px;line-height:1.55;color:#2a2340`)}><RichText text={comment.body} /></div>
        )}
      </div>
      {reporting && (
        <ReportDialog
          what="comment"
          onClose={() => setReporting(false)}
          onSubmit={async (reason, details) => {
            await reportComment(comment.id, reason, details);
            setReporting(false);
            onToast("Thanks — moderators will take a look");
          }}
        />
      )}
    </li>
  );
}

function Thread({ post, onCount, onToast }: { post: Post; onCount: (delta: number) => void; onToast: (t: string) => void }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (after: string | null) => {
    setError("");
    try {
      const page = await fetchComments(post.id, after);
      setComments((prev) => (after && prev ? [...prev, ...page.comments] : page.comments));
      setCursor(page.nextCursor);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [post.id]);

  useEffect(() => {
    load(null);
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const c = await addComment(post.id, text);
      setComments((prev) => [...(prev || []), c]);
      setText("");
      onCount(1);
    } catch (err) {
      onToast(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={s(`margin-top:14px;padding-top:14px;border-top:1px solid rgba(124,58,237,.12)`)}>
      {error && <p className="set-error" style={s(`font-size:13px`)}>{error} <button type="button" className="cm-link" onClick={() => load(null)}>Retry</button></p>}
      {comments === null && !error && <div className="set-skel-bar" style={s(`height:40px;border-radius:12px`)} />}
      {comments && comments.length === 0 && <p style={s(`font-size:13px;color:#6a6480`)}>No comments yet. Start the conversation.</p>}
      {comments && comments.length > 0 && (
        <ul style={s(`list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px`)}>
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              onToast={onToast}
              onChanged={(nc) => setComments((prev) => prev!.map((x) => (x.id === nc.id ? nc : x)))}
              onRemoved={(id) => {
                setComments((prev) => prev!.filter((x) => x.id !== id));
                onCount(-1);
              }}
            />
          ))}
        </ul>
      )}
      {cursor && <button type="button" className="btn btn-g btn-s" style={s(`margin-top:10px`)} onClick={() => load(cursor)}>Load more comments</button>}
      {post.status === "visible" && (
        <form onSubmit={submit} style={s(`display:flex;gap:8px;margin-top:12px;align-items:flex-end`)}>
          <textarea className="in" placeholder="Write a comment…" value={text} onChange={(e) => setText(e.target.value)} maxLength={3000} aria-label="Write a comment" style={s(`min-height:42px;height:42px;resize:vertical`)} />
          <button className="btn btn-v btn-s" disabled={busy || !text.trim()}>{busy ? "…" : "Reply"}</button>
        </form>
      )}
    </div>
  );
}

// ---------- post card ----------

// Sends a post into one of my group channels or DMs
function ShareDialog({ post, onClose, onToast }: { post: Post; onClose: () => void; onToast: (t: string) => void }) {
  const [chat, setChat] = useState<ChatOverview | null>(null);
  const [target, setTarget] = useState("");
  const [channels, setChannels] = useState<Channel[] | null>(null);
  const [channelId, setChannelId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    chatApi.overview().then(setChat).catch((e) => setError(errMsg(e)));
  }, []);

  // A group was picked: load its channels
  useEffect(() => {
    setChannels(null);
    setChannelId("");
    if (!target.startsWith("g:")) return;
    chatApi.group(target.slice(2)).then((d) => {
      setChannels(d.channels);
      setChannelId(d.channels[0]?.id || "");
    }).catch((e) => setError(errMsg(e)));
  }, [target]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const room = target.startsWith("dm:") ? { type: "dm" as const, id: target.slice(3) } : { type: "channel" as const, id: channelId };
    if (!room.id) return;
    setBusy(true);
    setError("");
    try {
      await chatApi.send(room.type, room.id, { body: note, sharePostId: post.id });
      onClose();
      onToast("Post shared");
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  const empty = chat && !chat.groups.length && !chat.dms.length;

  return (
    <Dialog title="Share post" onClose={() => !busy && onClose()}>
      <p style={s(`font-size:13px;color:#6a6480;margin-bottom:12px`)}>&ldquo;{post.title}&rdquo;</p>
      {!chat && !error && <div className="set-skel-bar" style={s(`height:40px;border-radius:10px`)} />}
      {empty && (
        <p style={s(`font-size:13px;color:#4a4560`)}>
          You&apos;re not in any groups or conversations yet. <Link href="/community/chat" style={s(`color:#5b21b6;font-weight:600`)}>Open Groups &amp; chat</Link>
        </p>
      )}
      {chat && !empty && (
        <form onSubmit={submit} style={s(`display:flex;flex-direction:column;gap:10px`)}>
          <select className="in" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Share to">
            <option value="">Choose where to share…</option>
            {chat.groups.length > 0 && (
              <optgroup label="Groups">
                {chat.groups.map((g) => <option key={g.id} value={`g:${g.id}`}>{g.name}</option>)}
              </optgroup>
            )}
            {chat.dms.length > 0 && (
              <optgroup label="Direct messages">
                {chat.dms.map((d) => <option key={d.id} value={`dm:${d.id}`}>@{d.other.name}</option>)}
              </optgroup>
            )}
          </select>
          {target.startsWith("g:") && (
            <select className="in" value={channelId} onChange={(e) => setChannelId(e.target.value)} aria-label="Channel" disabled={!channels}>
              {(channels || []).map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          )}
          <textarea className="in" placeholder="Add a message (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} style={s(`min-height:60px;resize:vertical`)} aria-label="Message" />
          {error && <div className="err-msg" role="alert">{error}</div>}
          <div style={s(`display:flex;justify-content:flex-end;gap:8px`)}>
            <button type="button" className="btn btn-g btn-s" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn btn-v btn-s" disabled={busy || !target || (target.startsWith("g:") && !channelId)}>{busy ? "Sharing…" : "Share"}</button>
          </div>
        </form>
      )}
      {error && !chat && <div className="err-msg" role="alert">{error}</div>}
    </Dialog>
  );
}

function PostCard({ post, canAnnounce, onChange, onRemove, onTag, onToast }: {
  post: Post;
  canAnnounce: boolean;
  onChange: (p: Post) => void;
  onRemove: (id: string) => void;
  onTag: (tag: string) => void;
  onToast: (t: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showThread, setShowThread] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [liking, setLiking] = useState(false);

  const readMore = async () => {
    try {
      onChange(await fetchPost(post.id));
      setExpanded(true);
    } catch (e) {
      onToast(errMsg(e));
    }
  };

  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);
    const want = !post.likedByMe;
    onChange({ ...post, likedByMe: want, likeCount: post.likeCount + (want ? 1 : -1) });
    try {
      const r = await setLike(post.id, want);
      onChange({ ...post, likedByMe: r.liked, likeCount: r.likeCount });
    } catch (e) {
      onChange(post);
      onToast(errMsg(e));
    } finally {
      setLiking(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    try {
      await deletePost(post.id);
      onRemove(post.id);
      onToast("Post deleted");
    } catch (e) {
      onToast(errMsg(e));
    }
  };

  if (editing) {
    return (
      <div className="card" style={s(`padding:18px 20px`)}>
        <div className="eyebrow" style={s(`margin-bottom:10px`)}>Edit post</div>
        <PostForm
          initial={post}
          canAnnounce={canAnnounce}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={async (input) => {
            onChange(await updatePost(post.id, input));
            setExpanded(true);
            setEditing(false);
            onToast("Post updated");
          }}
        />
      </div>
    );
  }

  return (
    <article className="card" style={s(`padding:18px 20px;${post.pinned ? "border:1px solid rgba(124,58,237,.35)" : ""}`)}>
      <div style={s(`display:flex;align-items:center;gap:10px`)}>
        <Avatar name={post.author.name} staff={post.author.staff} />
        <div style={s(`flex:1;min-width:0`)}>
          <div style={s(`font-size:13.5px;font-weight:600;display:flex;gap:6px;align-items:center;flex-wrap:wrap`)}>
            {post.author.name}
            {post.author.role && <span style={s(`font-size:11px;font-weight:500;color:#a79fbe`)}>· {post.author.role}</span>}
          </div>
          <div style={s(`font-size:11.5px;color:#a79fbe`)}>
            <time dateTime={post.createdAt} title={new Date(post.createdAt).toLocaleString()}>{timeAgo(post.createdAt)}</time>
            {post.editedAt ? " · edited" : ""}
          </div>
        </div>
        {post.pinned && <span className="st st-v" title="Pinned by moderators"><Icon name="ic-pin" size={10} /> Pinned</span>}
        <span className={KIND_CHIP[post.kind]}>{KIND_LABELS[post.kind]}</span>
      </div>

      {post.status === "hidden" && (
        <p className="st st-warn" style={s(`display:block;margin-top:10px;text-transform:none;font-size:12px;font-weight:500;padding:8px 10px`)}>
          Hidden after several reports — only you can see it until a moderator reviews it.
        </p>
      )}

      <h3 className="disp" style={s(`font-size:17px;font-weight:600;margin-top:12px;word-break:break-word`)}>{post.title}</h3>
      <div style={s(`font-size:13.5px;color:#4a4560;margin-top:6px;line-height:1.6`)}>
        <RichText text={post.body} />
        {post.truncated && !expanded && (
          <button type="button" className="cm-link" style={s(`margin-left:6px`)} onClick={readMore}>Read more</button>
        )}
      </div>

      {post.tags.length > 0 && (
        <div style={s(`display:flex;gap:6px;flex-wrap:wrap;margin-top:12px`)}>
          {post.tags.map((t) => <button key={t} type="button" className="tag" style={s(`cursor:pointer`)} onClick={() => onTag(t)}>#{t}</button>)}
        </div>
      )}

      <div style={s(`display:flex;gap:18px;margin-top:14px;font-size:13px;color:#6a6480;align-items:center`)}>
        <button type="button" className="cm-act" aria-pressed={post.likedByMe} onClick={toggleLike} disabled={post.status !== "visible"} style={s(post.likedByMe ? `color:#e5484d` : ``)}>
          <Icon name="ic-heart" size={15} style={s(post.likedByMe ? `fill:#e5484d;stroke:#e5484d` : ``)} />{post.likeCount}
          <span className="sr-only">{post.likedByMe ? "Unlike" : "Like"}</span>
        </button>
        <button type="button" className="cm-act" aria-expanded={showThread} onClick={() => setShowThread(!showThread)}>
          <Icon name="ic-msg" size={15} />{post.commentCount}
          <span className="sr-only">comments</span>
        </button>
        <span style={s(`margin-left:auto;display:flex;gap:12px`)}>
          {post.status === "visible" && <button type="button" className="cm-link" onClick={() => setSharing(true)}>Share</button>}
          {post.mine ? (
            <>
              <button type="button" className="cm-link" onClick={async () => { if (post.truncated && !expanded) await readMore(); setEditing(true); }}>Edit</button>
              <button type="button" className="cm-link" onClick={remove}>Delete</button>
            </>
          ) : (
            <button type="button" className="cm-link" onClick={() => setReporting(true)}>Report</button>
          )}
        </span>
      </div>

      {showThread && (
        <Thread post={post} onToast={onToast} onCount={(d) => onChange({ ...post, commentCount: Math.max(0, post.commentCount + d) })} />
      )}

      {sharing && <ShareDialog post={post} onClose={() => setSharing(false)} onToast={onToast} />}

      {reporting && (
        <ReportDialog
          what="post"
          onClose={() => setReporting(false)}
          onSubmit={async (reason, details) => {
            await reportPost(post.id, reason, details);
            setReporting(false);
            onToast("Thanks — moderators will take a look");
          }}
        />
      )}
    </article>
  );
}

// ---------- screen ----------

export default function CommunityScreen() {
  const [filter, setFilter] = useState(0);
  const [tag, setTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"latest" | "top">("latest");
  const [pinned, setPinned] = useState<Post[]>([]);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<CommunityApiError | null>(null);
  const [highlights, setHighlights] = useState<Highlights | null>(null);
  const [toast, setToast] = useState("");
  const requestId = useRef(0);

  // Debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const query: FeedQuery = { kind: FILTERS[filter].kind, mine: FILTERS[filter].mine, tag, q, sort };
  const queryKey = JSON.stringify(query);

  const loadFeed = useCallback(async () => {
    const id = ++requestId.current;
    setError(null);
    setPosts(null);
    try {
      const feed = await fetchFeed(JSON.parse(queryKey));
      if (id !== requestId.current) return;
      setPinned(feed.pinned);
      setPosts(feed.posts);
      setCursor(feed.nextCursor);
    } catch (e) {
      if (id === requestId.current) setError(e instanceof CommunityApiError ? e : new CommunityApiError(0, errMsg(e)));
    }
  }, [queryKey]);

  const loadHighlights = useCallback(() => {
    fetchHighlights().then(setHighlights).catch(() => {});
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    loadHighlights();
  }, [loadHighlights]);

  const loadMore = async () => {
    if (!cursor) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const feed = await fetchFeed({ ...JSON.parse(queryKey), cursor });
      if (id !== requestId.current) return;
      setPosts((prev) => {
        const seen = new Set((prev || []).map((p) => p.id));
        return [...(prev || []), ...feed.posts.filter((p) => !seen.has(p.id))];
      });
      setCursor(feed.nextCursor);
    } catch (e) {
      setToast(errMsg(e));
    } finally {
      setLoadingMore(false);
    }
  };

  const replace = (p: Post) => {
    setPinned((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    setPosts((prev) => prev && prev.map((x) => (x.id === p.id ? p : x)));
  };
  const removeOne = (id: string) => {
    setPinned((prev) => prev.filter((x) => x.id !== id));
    setPosts((prev) => prev && prev.filter((x) => x.id !== id));
    loadHighlights();
  };
  const onPosted = (p: Post) => {
    setToast("Posted");
    setPosts((prev) => [p, ...(prev || [])]);
    loadHighlights();
  };
  const pickTag = (t: string) => {
    setTag(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearToast = useCallback(() => setToast(""), []);
  const canAnnounce = Boolean(highlights?.me.canAnnounce);
  const all = [...pinned, ...(posts || [])];
  const filtered = Boolean(tag || q || filter !== 0);

  return (
    <div data-screen>
      <div style={s(`display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:22px`)}>
        <div>
          <div className="eyebrow" style={s(`margin-bottom:8px`)}>Learn out loud</div>
          <h1 className="disp" style={s(`font-size:30px;font-weight:600`)}><span className="grad">Community</span></h1>
          <p className="lead" style={s(`margin-top:8px`)}>Write-ups, questions and announcements · like, comment and help each other</p>
        </div>
        <div style={s(`display:flex;align-items:center;gap:14px`)}>
          <Link href="/community/chat" className="btn btn-v btn-s"><Icon name="ic-users" size={14} />Groups &amp; chat</Link>
          <img src="/bird-support.jpg" alt="" className="float hide-sm" style={s(`width:66px;height:66px;border-radius:18px;object-fit:cover;border:1px solid rgba(124,58,237,.2)`)} />
        </div>
      </div>

      <div className="cm-grid" style={s(`display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:20px;align-items:start`)}>
        <div>
          <Composer canAnnounce={canAnnounce} onPosted={onPosted} />

          <div style={s(`display:flex;gap:8px;margin:16px 0 10px;flex-wrap:wrap;align-items:center`)}>
            {FILTERS.map((f, i) => (
              <button key={f.label} type="button" className={`btn btn-s ${filter === i ? "btn-v" : "btn-g"}`} aria-pressed={filter === i} onClick={() => setFilter(i)}>{f.label}</button>
            ))}
          </div>
          <div style={s(`display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center`)}>
            <div style={s(`position:relative;flex:1;min-width:200px`)}>
              <Icon name="ic-search" size={14} style={s(`position:absolute;left:12px;top:50%;transform:translateY(-50%);stroke:#a79fbe`)} />
              <input className="in" type="search" placeholder="Search posts" value={search} onChange={(e) => setSearch(e.target.value)} maxLength={100} aria-label="Search posts" style={s(`padding-left:34px`)} />
            </div>
            <select className="in" value={sort} onChange={(e) => setSort(e.target.value as "latest" | "top")} aria-label="Sort posts" style={s(`width:auto`)}>
              <option value="latest">Latest</option>
              <option value="top">Most liked</option>
            </select>
            {tag && (
              <button type="button" className="tag" onClick={() => setTag(null)} style={s(`cursor:pointer;display:inline-flex;align-items:center;gap:4px`)} aria-label={`Clear tag filter ${tag}`}>
                #{tag} <Icon name="ic-x" size={11} />
              </button>
            )}
          </div>

          {error ? (
            <div className="card" style={s(`padding:26px;text-align:center`)} role="alert">
              <p className="set-error">{error.message}</p>
              <div style={s(`margin-top:14px`)}>
                {error.status === 401
                  ? <Link className="btn btn-v btn-s" href="/login">Sign in</Link>
                  : <button className="btn btn-v btn-s" onClick={loadFeed}>Try again</button>}
              </div>
            </div>
          ) : posts === null ? (
            <div className="set-skel" aria-busy="true" aria-label="Loading posts">
              {[0, 1, 2].map((i) => <div key={i} className="set-skel-bar" style={s(`height:150px;border-radius:16px`)} />)}
            </div>
          ) : all.length === 0 ? (
            <div className="card" style={s(`padding:30px;text-align:center`)}>
              <div className="disp" style={s(`font-size:16px;font-weight:600`)}>{filtered ? "No posts match" : "No posts yet"}</div>
              <p style={s(`font-size:13px;color:#6a6480;margin-top:6px`)}>{filtered ? "Try a different filter or search." : "Be the first to share a write-up or ask a question."}</p>
            </div>
          ) : (
            <div style={s(`display:flex;flex-direction:column;gap:14px`)}>
              {all.map((p) => (
                <PostCard key={p.id} post={p} canAnnounce={canAnnounce} onChange={replace} onRemove={removeOne} onTag={pickTag} onToast={setToast} />
              ))}
              {cursor && (
                <button type="button" className="btn btn-g btn-s" style={s(`align-self:center`)} onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              )}
            </div>
          )}
        </div>

        <div style={s(`display:flex;flex-direction:column;gap:16px`)}>
          <div className="card" style={s(`padding:20px`)}>
            <div className="eyebrow" style={s(`margin-bottom:12px`)}>Your activity</div>
            <div style={s(`display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center`)}>
              {[
                ["Posts", highlights?.me.posts],
                ["Likes", highlights?.me.likesReceived],
                ["Comments", highlights?.me.comments],
              ].map(([label, n]) => (
                <div key={label as string}>
                  <div className="disp" style={s(`font-size:20px;font-weight:700;color:#5b21b6`)}>{n ?? "–"}</div>
                  <div style={s(`font-size:11px;color:#6a6480`)}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={s(`padding:20px`)}>
            <div className="eyebrow" style={s(`margin-bottom:12px`)}>Trending tags · 14 days</div>
            {highlights && highlights.trendingTags.length > 0 ? (
              <div style={s(`display:flex;flex-wrap:wrap;gap:6px`)}>
                {highlights.trendingTags.map((t) => (
                  <button key={t.tag} type="button" className="tag" style={s(`cursor:pointer;${tag === t.tag ? "background:rgba(124,58,237,.18);color:#5b21b6" : ""}`)} onClick={() => pickTag(t.tag)} title={`${t.count} post${t.count === 1 ? "" : "s"}`}>
                    #{t.tag}
                  </button>
                ))}
              </div>
            ) : (
              <p style={s(`font-size:12.5px;color:#6a6480`)}>{highlights ? "Tags on recent posts show up here." : "Loading…"}</p>
            )}
          </div>
          <div className="card" style={s(`padding:20px`)}>
            <div className="eyebrow" style={s(`margin-bottom:12px`)}>Top contributors · 30 days</div>
            {highlights && highlights.topContributors.length > 0 ? (
              <ol style={s(`list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px`)}>
                {highlights.topContributors.map((c) => (
                  <li key={c.name} style={s(`display:flex;align-items:center;gap:10px`)}>
                    <Avatar name={c.name} staff={c.staff} />
                    <span style={s(`flex:1;font-size:13px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis`)}>{c.name}</span>
                    <span style={s(`font-size:11.5px;color:#6a6480;white-space:nowrap`)}>{c.posts} post{c.posts === 1 ? "" : "s"} · {c.likes} ♥</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p style={s(`font-size:12.5px;color:#6a6480`)}>{highlights ? "Post this month to appear here." : "Loading…"}</p>
            )}
          </div>
          <div className="card" style={s(`padding:20px`)}>
            <div className="eyebrow" style={s(`margin-bottom:10px`)}>Community rules</div>
            <ul style={s(`padding-left:18px;margin:0;font-size:12.5px;color:#4a4560;line-height:1.7`)}>
              <li>Be kind; critique ideas, not people.</li>
              <li>No flags or answers for live CTFs or exams.</li>
              <li>Only test systems you&apos;re authorised to test.</li>
              <li>Posts reported by several members are hidden for review.</li>
            </ul>
          </div>
        </div>
      </div>

      {toast && <Toast text={toast} onDone={clearToast} />}
    </div>
  );
}
