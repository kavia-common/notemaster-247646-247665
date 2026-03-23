import Link from "next/link";
import { RetroShell } from "@/components/RetroShell";

export default function Home() {
  return (
    <RetroShell>
      <section className="card" style={{ padding: 18 }}>
        <h1 style={{ fontSize: 34, letterSpacing: 0.2, marginBottom: 10 }}>
          Your notes. <span style={{ color: "var(--pink)" }}>Neon</span> organized.
        </h1>
        <p className="muted" style={{ lineHeight: 1.6, marginBottom: 14 }}>
          NoteMaster is a retro-themed notes workspace with tags, search, and pin/favorite toggles.
          This frontend is static-export compatible: authentication is stored client-side as a JWT and used for API calls.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link className="btn btn-primary" href="/register">
            Create account
          </Link>
          <Link className="btn" href="/login">
            Login
          </Link>
          <Link className="btn" href="/app">
            Go to workspace
          </Link>
        </div>

        <hr className="hr" style={{ margin: "16px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Search & Filter</div>
            <div className="muted" style={{ fontSize: 13 }}>
              Query across titles/content; filter by tag, pinned, favorite.
            </div>
          </div>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Tags</div>
            <div className="muted" style={{ fontSize: 13 }}>
              Add tags per-note; manage tags in a dedicated panel.
            </div>
          </div>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Pin & Favorite</div>
            <div className="muted" style={{ fontSize: 13 }}>
              Keep important notes on top (pin) or mark as favorite (star).
            </div>
          </div>
        </div>
      </section>
    </RetroShell>
  );
}
