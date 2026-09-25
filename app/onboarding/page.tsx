"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, CheckCircle2, ArrowRight } from "lucide-react";
import { post } from "@/lib/client";
import { Card, PageHeader } from "@/components/ui";

type Summary = {
  settings: number;
  solved: number;
  daily: number;
  recommendations: number;
  upsolve: number;
};

export default function Onboarding() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const text = await file.text();
      const snapshot = JSON.parse(text);
      const res = await post<{ summary: Summary }>(
        "/api/migrate-local",
        snapshot
      );
      setSummary(res.summary);
    } catch (err) {
      setError((err as Error).message || "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Import your existing history"
        description="Bring your solved problems, streaks, goals and settings over from the local version of DSA Guardian. Optional, safe to skip, and it never touches your local app."
      />

      <Card className="mt-6 p-5 text-sm">
        <p className="font-medium text-fg">How to get your snapshot file</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-fg-muted">
          <li>
            In the cloud project folder, run:
            <code className="mt-1 block rounded bg-surface-sunken px-2 py-1 font-mono text-xs text-fg">
              node scripts/export-local.mjs &quot;/path/to/DSA Guardian/data/guardian.db&quot;
            </code>
          </li>
          <li>
            It writes <code className="font-mono text-fg">guardian-export.json</code>
            — your local database is opened read-only and left untouched.
          </li>
          <li>Upload that file below.</li>
        </ol>
      </Card>

      {summary ? (
        <Card className="mt-6 p-5">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Import complete</span>
          </div>
          <ul className="num mt-3 grid grid-cols-2 gap-1 text-sm text-fg-muted">
            <li>Solved: {summary.solved}</li>
            <li>Daily records: {summary.daily}</li>
            <li>Recommendations: {summary.recommendations}</li>
            <li>Upsolve: {summary.upsolve}</li>
            <li>Settings: {summary.settings}</li>
          </ul>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-fg transition-all hover:brightness-110"
          >
            Go to dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Card>
      ) : (
        <div className="mt-6">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-card border border-dashed border-line bg-surface-raised/50 px-4 py-8 transition-colors hover:bg-surface-overlay">
            <Upload className="h-4 w-4 text-fg-muted" aria-hidden="true" />
            <span className="text-sm text-fg">
              {busy ? "Importing…" : "Choose guardian-export.json"}
            </span>
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              disabled={busy}
              onChange={onFile}
            />
          </label>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-danger">{error}</p>
          ) : null}
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-fg-muted transition-colors hover:text-fg"
          >
            Skip for now →
          </Link>
        </div>
      )}
    </div>
  );
}
