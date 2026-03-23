"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RetroShell, InlineAlert } from "@/components/RetroShell";
import { useAuthStore } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { register, error, status } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const canSubmit = useMemo(() => {
    return email.trim().length > 2 && password.length >= 6 && password === password2;
  }, [email, password, password2]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    await register(email.trim(), password);
    router.push("/app");
  }

  return (
    <RetroShell>
      <section className="card" style={{ padding: 18, maxWidth: 520 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Register</h1>
        <p className="muted" style={{ marginBottom: 14 }}>
          Create an account to start saving notes.
        </p>

        {error ? <InlineAlert title="Registration failed" message={error} tone="error" /> : null}

        <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <label>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Email
            </div>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>

          <label>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Password (min 6 chars)
            </div>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
            />
          </label>

          <label>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Confirm password
            </div>
            <input
              className="input"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              type="password"
              autoComplete="new-password"
            />
          </label>

          {!canSubmit && password2.length > 0 && password !== password2 ? (
            <InlineAlert title="Passwords do not match" tone="error" />
          ) : null}

          <button className="btn btn-primary" type="submit" disabled={!canSubmit || status === "loading"}>
            {status === "loading" ? "Creating…" : "Create account"}
          </button>
        </form>

        <div className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          Already have an account? <Link href="/login" style={{ color: "var(--cyan)" }}>Login</Link>
        </div>
      </section>
    </RetroShell>
  );
}
