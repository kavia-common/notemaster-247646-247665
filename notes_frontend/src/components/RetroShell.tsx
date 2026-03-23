"use client";

import Link from "next/link";
import { useEffect } from "react";
import clsx from "clsx";
import { useAuthStore } from "@/lib/auth";

export function RetroShell({ children }: { children: React.ReactNode }) {
  const { status, email, hydrate, logout } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <>
      <header
        className="panel"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          borderRadius: 0,
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" className="badge badge-strong" aria-label="Go to home">
            NoteMaster
            <span className="muted" style={{ fontWeight: 600 }}>
              /retro
            </span>
          </Link>

          <div className="muted" style={{ fontSize: 13, flex: 1 }}>
            Notes • Tags • Search • Pin/Favorite
          </div>

          {status !== "authenticated" ? (
            <nav style={{ display: "flex", gap: 10 }}>
              <Link className={clsx("btn")} href="/login">
                Login
              </Link>
              <Link className={clsx("btn btn-primary")} href="/register">
                Register
              </Link>
            </nav>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="badge" title={email ?? ""}>
                <span style={{ color: "var(--cyan)" }}>●</span>
                {email ?? "Signed in"}
              </span>
              <Link className="btn" href="/app">
                Workspace
              </Link>
              <button className="btn" onClick={logout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="container" style={{ paddingTop: 18, paddingBottom: 34 }}>
        {children}
      </main>

      <footer className="container muted" style={{ paddingBottom: 30, fontSize: 12 }}>
        Tip: use <span className="kbd">Search</span> + <span className="kbd">Tags</span> to filter. Pin and Favorite are
        separate toggles.
      </footer>
    </>
  );
}

// PUBLIC_INTERFACE
export function InlineAlert({
  title,
  message,
  tone = "info",
}: {
  title: string;
  message?: string;
  tone?: "info" | "error" | "success";
}) {
  /** Inline alert for errors/success/info. */
  const border =
    tone === "error"
      ? "rgba(239,68,68,0.55)"
      : tone === "success"
        ? "rgba(41,255,154,0.55)"
        : "rgba(25,247,255,0.45)";
  const bg =
    tone === "error"
      ? "rgba(239,68,68,0.12)"
      : tone === "success"
        ? "rgba(41,255,154,0.10)"
        : "rgba(25,247,255,0.08)";
  return (
    <section className="card" role={tone === "error" ? "alert" : "status"} aria-live="polite" style={{ padding: 14, borderColor: border, background: bg }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      {message ? <div className="muted" style={{ marginTop: 6 }}>{message}</div> : null}
    </section>
  );
}
