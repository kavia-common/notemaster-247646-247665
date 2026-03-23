"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { RetroShell, InlineAlert } from "@/components/RetroShell";
import { api, type Note, type Tag, type ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

type ViewMode = "grid" | "list";

function asErrorMessage(e: unknown): string {
  const err = e as ApiError;
  return err?.message || "Something went wrong";
}

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
}

export default function WorkspacePage() {
  const router = useRouter();
  const { token, status, hydrate, logout } = useAuthStore();

  const [view, setView] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string>("");
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [onlyFavorite, setOnlyFavorite] = useState(false);

  const [activeId, setActiveId] = useState<string | null>(null);

  // Editor state
  const activeNote = useMemo(() => notes.find((n) => n.id === activeId) ?? null, [notes, activeId]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftTags, setDraftTags] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (status === "anonymous") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!activeNote) return;
    setDraftTitle(activeNote.title);
    setDraftContent(activeNote.content);
    setDraftTags(activeNote.tags.join(", "));
  }, [activeNote]);

  async function refreshAll() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [notesRes, tagsRes] = await Promise.all([
        api.listNotes({
          token,
          q: q.trim() || undefined,
          tag: tag || undefined,
          pinned: onlyPinned || undefined,
          favorite: onlyFavorite || undefined,
          sort: "updated_desc",
        }),
        api.listTags(token),
      ]);
      setNotes(notesRes);
      setTags(tagsRes);
      if (activeId && !notesRes.some((n) => n.id === activeId)) setActiveId(null);
    } catch (e) {
      setError(asErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, token]);

  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    const t = window.setTimeout(() => refreshAll(), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, tag, onlyPinned, onlyFavorite]);

  async function createNewNote() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const created = await api.createNote(token, {
        title: "Untitled",
        content: "",
        tags: [],
      });
      setNotes((prev) => [created, ...prev]);
      setActiveId(created.id);
    } catch (e) {
      setError(asErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function saveActiveNote() {
    if (!token || !activeNote) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateNote(token, activeNote.id, {
        title: draftTitle.trim() || "Untitled",
        content: draftContent,
        tags: parseTags(draftTags),
      });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      // refresh tags list counts/names if backend supports it
      api.listTags(token).then(setTags).catch(() => {});
    } catch (e) {
      setError(asErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function deleteActiveNote() {
    if (!token || !activeNote) return;
    const ok = window.confirm("Delete this note? This cannot be undone.");
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      await api.deleteNote(token, activeNote.id);
      setNotes((prev) => prev.filter((n) => n.id !== activeNote.id));
      setActiveId(null);
    } catch (e) {
      setError(asErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function togglePinned(note: Note) {
    if (!token) return;
    const optimistic = { ...note, pinned: !note.pinned };
    setNotes((prev) => prev.map((n) => (n.id === note.id ? optimistic : n)));
    try {
      const updated = await api.updateNote(token, note.id, { pinned: optimistic.pinned });
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
    } catch (e) {
      setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
      setError(asErrorMessage(e));
    }
  }

  async function toggleFavorite(note: Note) {
    if (!token) return;
    const optimistic = { ...note, favorite: !note.favorite };
    setNotes((prev) => prev.map((n) => (n.id === note.id ? optimistic : n)));
    try {
      const updated = await api.updateNote(token, note.id, { favorite: optimistic.favorite });
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
    } catch (e) {
      setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
      setError(asErrorMessage(e));
    }
  }

  // Tag management (simple rename/delete UI)
  const [tagEditId, setTagEditId] = useState<string | null>(null);
  const [tagEditValue, setTagEditValue] = useState<string>("");

  async function beginRename(t: Tag) {
    setTagEditId(t.id);
    setTagEditValue(t.name);
  }

  async function commitRename() {
    if (!token || !tagEditId) return;
    const name = tagEditValue.trim();
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await api.renameTag(token, tagEditId, name);
      setTags((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setTagEditId(null);
      // refresh notes in case backend returns normalized tags
      refreshAll();
    } catch (e) {
      setError(asErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function deleteTag(tagId: string) {
    if (!token) return;
    const ok = window.confirm("Delete this tag? Notes will lose this tag.");
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      await api.deleteTag(token, tagId);
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      if (tag) setTag("");
      refreshAll();
    } catch (e) {
      setError(asErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  const filteredNotes = notes; // server does filtering; keep a single list for UI

  return (
    <RetroShell>
      <section className="card" style={{ padding: 14 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>
            Workspace <span className="muted" style={{ fontWeight: 600 }}>/ notes</span>
          </div>

          <div style={{ flex: 1 }} />

          <button className="btn btn-primary" onClick={createNewNote} disabled={loading || status !== "authenticated"}>
            + New Note
          </button>
          <button className="btn" onClick={refreshAll} disabled={loading || status !== "authenticated"}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button className="btn" onClick={logout}>
            Logout
          </button>
        </div>

        <hr className="hr" style={{ margin: "12px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12 }}>
          {/* Left: notes list/grid */}
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
              <label>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Search
                </div>
                <input
                  className="input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search title/content…"
                />
              </label>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className={clsx("btn", view === "grid" && "btn-primary")} onClick={() => setView("grid")}>
                  Grid
                </button>
                <button className={clsx("btn", view === "list" && "btn-primary")} onClick={() => setView("list")}>
                  List
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
              <label style={{ flex: "1 1 220px" }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Filter by tag
                </div>
                <select className="select" value={tag} onChange={(e) => setTag(e.target.value)}>
                  <option value="">All tags</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                      {typeof t.count === "number" ? ` (${t.count})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={onlyPinned} onChange={(e) => setOnlyPinned(e.target.checked)} />
                <span className="muted">Pinned</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={onlyFavorite} onChange={(e) => setOnlyFavorite(e.target.checked)} />
                <span className="muted">Favorite</span>
              </label>
            </div>

            {error ? <div style={{ marginTop: 12 }}><InlineAlert title="API error" message={error} tone="error" /></div> : null}

            <div
              style={{
                marginTop: 12,
                display: "grid",
                gridTemplateColumns: view === "grid" ? "repeat(auto-fit, minmax(220px, 1fr))" : "1fr",
                gap: 10,
              }}
            >
              {filteredNotes.map((n) => (
                <button
                  key={n.id}
                  className="panel"
                  onClick={() => setActiveId(n.id)}
                  style={{
                    padding: 12,
                    textAlign: "left",
                    cursor: "pointer",
                    borderColor:
                      n.id === activeId ? "rgba(255,229,106,0.65)" : "var(--border)",
                    background:
                      n.id === activeId
                        ? "linear-gradient(180deg, rgba(255,229,106,0.10), rgba(0,0,0,0.12))"
                        : "rgba(15, 23, 51, 0.65)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontWeight: 800, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.title || "Untitled"}
                    </div>
                    <span className="badge" title="Pinned">
                      <span style={{ color: n.pinned ? "var(--yellow)" : "rgba(231,240,255,0.45)" }}>⟡</span>
                    </span>
                    <span className="badge" title="Favorite">
                      <span style={{ color: n.favorite ? "var(--pink)" : "rgba(231,240,255,0.45)" }}>★</span>
                    </span>
                  </div>

                  <div className="muted" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.4 }}>
                    {n.content ? (n.content.length > 120 ? n.content.slice(0, 120) + "…" : n.content) : "No content yet."}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {n.tags.slice(0, 4).map((t) => (
                      <span key={t} className="badge">
                        #{t}
                      </span>
                    ))}
                    {n.tags.length > 4 ? <span className="badge">+{n.tags.length - 4}</span> : null}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <span className="badge" style={{ borderColor: "rgba(25,247,255,0.35)" }}>
                      {new Date(n.updated_at).toLocaleString()}
                    </span>
                  </div>
                </button>
              ))}

              {!loading && filteredNotes.length === 0 ? (
                <div className="muted" style={{ padding: 10 }}>
                  No notes match your filters. Create a new one to begin.
                </div>
              ) : null}
            </div>
          </div>

          {/* Right: editor + tags management */}
          <div style={{ display: "grid", gap: 12 }}>
            <section className="panel" style={{ padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 16, flex: 1 }}>
                  Editor
                </div>

                {activeNote ? (
                  <>
                    <button className="btn" onClick={() => togglePinned(activeNote)} disabled={loading}>
                      {activeNote.pinned ? "Unpin" : "Pin"}
                    </button>
                    <button className="btn" onClick={() => toggleFavorite(activeNote)} disabled={loading}>
                      {activeNote.favorite ? "Unfavorite" : "Favorite"}
                    </button>
                  </>
                ) : null}
              </div>

              <hr className="hr" style={{ margin: "10px 0" }} />

              {!activeNote ? (
                <div className="muted" style={{ padding: 8, lineHeight: 1.5 }}>
                  Select a note on the left, or create a new one.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  <label>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                      Title
                    </div>
                    <input className="input" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
                  </label>

                  <label>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                      Tags (comma-separated)
                    </div>
                    <input className="input" value={draftTags} onChange={(e) => setDraftTags(e.target.value)} placeholder="work, personal, ideas" />
                  </label>

                  <label>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                      Content
                    </div>
                    <textarea className="textarea" value={draftContent} onChange={(e) => setDraftContent(e.target.value)} />
                  </label>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-primary" onClick={saveActiveNote} disabled={loading}>
                      {loading ? "Saving…" : "Save"}
                    </button>
                    <button className="btn btn-danger" onClick={deleteActiveNote} disabled={loading}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="panel" style={{ padding: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Tags</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
                Manage tags globally. (Rename/Delete). Notes update after changes.
              </div>

              <hr className="hr" style={{ margin: "10px 0" }} />

              <div style={{ display: "grid", gap: 8 }}>
                {tags.map((t) => (
                  <div
                    key={t.id}
                    className="panel"
                    style={{
                      padding: 10,
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    {tagEditId === t.id ? (
                      <input
                        className="input"
                        value={tagEditValue}
                        onChange={(e) => setTagEditValue(e.target.value)}
                        aria-label={`Rename tag ${t.name}`}
                      />
                    ) : (
                      <button
                        className="badge"
                        onClick={() => setTag(t.name)}
                        style={{
                          justifyContent: "flex-start",
                          textAlign: "left",
                          cursor: "pointer",
                          width: "fit-content",
                          borderColor: tag === t.name ? "rgba(25,247,255,0.55)" : "var(--border)",
                        }}
                        title="Click to filter by this tag"
                      >
                        #{t.name}
                        {typeof t.count === "number" ? <span className="muted">({t.count})</span> : null}
                      </button>
                    )}

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      {tagEditId === t.id ? (
                        <>
                          <button className="btn btn-primary" onClick={commitRename} disabled={loading}>
                            Save
                          </button>
                          <button className="btn" onClick={() => setTagEditId(null)} disabled={loading}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn" onClick={() => beginRename(t)} disabled={loading}>
                            Rename
                          </button>
                          <button className="btn btn-danger" onClick={() => deleteTag(t.id)} disabled={loading}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {tags.length === 0 ? (
                  <div className="muted" style={{ padding: 8 }}>
                    No tags yet. Add tags to notes in the editor.
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </section>
    </RetroShell>
  );
}
