import Link from "next/link";
import { RetroShell } from "@/components/RetroShell";

export default function NotFound() {
  return (
    <RetroShell>
      <section className="card" role="alert" aria-live="assertive" style={{ padding: 18, maxWidth: 720 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>404 — Page Not Found</h1>
        <p className="muted" style={{ marginBottom: 14 }}>
          The page you’re looking for doesn’t exist.
        </p>
        <Link className="btn btn-primary" href="/">
          Back to home
        </Link>
      </section>
    </RetroShell>
  );
}
