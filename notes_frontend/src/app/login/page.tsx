"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RetroShell, InlineAlert } from "@/components/RetroShell";
import { useAuthStore } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, error, status } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = useMemo(() => email.trim().length > 2 && password.length >= 6, [email, password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    await login(email.trim(), password);
    router.push("/app");
  }

  return (
    <RetroShell>
      <section className="card" style={{ padding: 18, maxWidth: 520 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Login</h1>
        <p className="muted" style={{ marginBottom: 14 }}>
          Sign in to access your notes workspace.
        </p>

        {error ? <InlineAlert title="Login failed" message={error} tone="error" /> : null}

        <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <label>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Email
            </div>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>

          <label>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Password
            </div>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={!canSubmit || status === "loading"}>
            {status === "loading" ? "Signing in…" : "Login"}
          </button>
        </form>

        <div className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          No account? <Link href="/register" style={{ color: "var(--cyan)" }}>Register</Link>
        </div>
      </section>
    </RetroShell>
  );
}
