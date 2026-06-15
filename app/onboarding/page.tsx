"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, CheckCircle2, ArrowRight } from "lucide-react";
import { post } from "@/lib/client";

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
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold">Import your existing history</h1>
      <p className="mt-2 text-sm text-muted">
        Bring your solved problems, streaks, goals, and settings from the local
        version of DSA Guardian. This is optional and safe to skip — and it never
        touches your local app.
      </p>

      <div className="mt-6 rounded-lg border border-border bg-panel/60 p-5 text-sm">
        <p className="font-medium">How to get your snapshot file</p>
        <ol className="mt-2 list-decimal list-inside space-y-1 text-muted">
          <li>
            In the cloud project folder, run:
            <code className="block mt-1 rounded bg-panel2 px-2 py-1 text-xs">
              node scripts/export-local.mjs &quot;/path/to/DSA Guardian/data/guardian.db&quot;
            </code>
          </li>
          <li>
            It writes <code>guardian-export.json</code> (your local DB is read
            only — untouched).
          </li>
          <li>Upload that file below.</li>
        </ol>
      </div>

      {summary ? (
        <div className="mt-6 rounded-lg border border-border bg-panel/60 p-5">
          <div className="flex items-center gap-2 text-easy">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Import complete</span>
          </div>
          <ul className="mt-3 text-sm text-muted grid grid-cols-2 gap-1">
            <li>Solved: {summary.solved}</li>
            <li>Daily records: {summary.daily}</li>
            <li>Recommendations: {summary.recommendations}</li>
            <li>Upsolve: {summary.upsolve}</li>
            <li>Settings: {summary.settings}</li>
          </ul>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-black hover:opacity-90"
          >
            Go to dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <label className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border bg-panel/40 px-4 py-6 cursor-pointer hover:bg-panel2 transition-colors">
            <Upload className="h-4 w-4" />
            <span className="text-sm">
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
            <p className="mt-3 text-sm text-hard">{error}</p>
          ) : null}
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-muted hover:text-text"
          >
            Skip for now →
          </Link>
        </div>
      )}
    </div>
  );
}
