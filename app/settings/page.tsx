"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Save, Check, KeyRound, Info } from "lucide-react";
import { fetcher, post } from "@/lib/client";

type SettingsResp = {
  settings: {
    username: string;
    dailyGoalDefault: string;
    hardGoal: string;
    completionThreshold: string;
    dayOffsetMinutes: string;
    sheetOrder: string;
    selectedCompanies: string;
    hasCookie: boolean;
  };
  companies: string[];
};

export default function SettingsPage() {
  const { data, mutate } = useSWR<SettingsResp>("/api/settings", fetcher);
  const [form, setForm] = useState({
    username: "",
    dailyGoalDefault: "2",
    hardGoal: "2",
    completionThreshold: "80",
    dayOffsetMinutes: "0",
    sheetOrder: "neetcode",
  });
  const [companies, setCompanies] = useState<Set<string>>(new Set());
  const [cookie, setCookie] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm({
      username: data.settings.username,
      dailyGoalDefault: data.settings.dailyGoalDefault,
      hardGoal: data.settings.hardGoal,
      completionThreshold: data.settings.completionThreshold,
      dayOffsetMinutes: data.settings.dayOffsetMinutes,
      sheetOrder: data.settings.sheetOrder || "neetcode",
    });
    setCompanies(
      new Set(
        data.settings.selectedCompanies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );
  }, [data]);

  const save = async () => {
    const payload: Record<string, string> = {
      ...form,
      selectedCompanies: [...companies].join(","),
    };
    if (cookie.trim()) payload.cookie = cookie.trim();
    await post("/api/settings", payload);
    setCookie("");
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    mutate();
  };

  const clearCookie = async () => {
    await post("/api/settings", { cookie: "" });
    mutate();
  };

  const toggleCompany = (c: string) =>
    setCompanies((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });

  if (!data) return <div className="text-muted">Loading…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Field label="LeetCode username" hint="Used for public sync (solved counts + recent ACs).">
        <input
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="e.g. your_lc_handle"
          className="input"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Default daily questions goal"
          hint="Any difficulty. You're asked this each day."
        >
          <input
            type="number"
            min={1}
            max={50}
            value={form.dailyGoalDefault}
            onChange={(e) =>
              setForm({ ...form, dailyGoalDefault: e.target.value })
            }
            className="input"
          />
        </Field>
        <Field
          label="Daily Hard goal"
          hint="How many Hard questions to target daily — also how many are recommended."
        >
          <input
            type="number"
            min={1}
            max={20}
            value={form.hardGoal}
            onChange={(e) => setForm({ ...form, hardGoal: e.target.value })}
            className="input"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Topic complete at (%)"
          hint="Of a step's LeetCode problems. Unlocks Hard recs (default 80)."
        >
          <input
            type="number"
            min={1}
            max={100}
            value={form.completionThreshold}
            onChange={(e) =>
              setForm({ ...form, completionThreshold: e.target.value })
            }
            className="input"
          />
        </Field>
        <Field label="Day offset (min)" hint="0 = UTC (LeetCode reset). IST = 330.">
          <input
            type="number"
            value={form.dayOffsetMinutes}
            onChange={(e) =>
              setForm({ ...form, dayOffsetMinutes: e.target.value })
            }
            className="input"
          />
        </Field>
      </div>

      <Field
        label="Sheet order"
        hint="Display the A2Z steps in NeetCode roadmap flow, or original A2Z order."
      >
        <div className="flex gap-2">
          {[
            { v: "neetcode", label: "NeetCode roadmap flow" },
            { v: "a2z", label: "Original A2Z order" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setForm({ ...form, sheetOrder: o.v })}
              className={`rounded-md border px-3 py-2 text-sm ${
                form.sheetOrder === o.v
                  ? "border-accent bg-accent/10 text-text"
                  : "border-border bg-panel2 text-muted hover:bg-border"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label="Company filter"
        hint={`Recommend Hard questions asked by these companies. None selected = all (${data.companies.length}).`}
      >
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => setCompanies(new Set(data.companies))}
            className="rounded-md border border-border bg-panel2 px-2.5 py-1 text-xs hover:bg-border"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setCompanies(new Set())}
            className="rounded-md border border-border bg-panel2 px-2.5 py-1 text-xs hover:bg-border"
          >
            Clear
          </button>
          <span className="ml-auto text-xs text-muted">
            {companies.size} selected
          </span>
        </div>
        <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-panel2 p-2 grid grid-cols-2 sm:grid-cols-3 gap-1">
          {data.companies.map((c) => (
            <label
              key={c}
              className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-border cursor-pointer capitalize"
            >
              <input
                type="checkbox"
                checked={companies.has(c)}
                onChange={() => toggleCompany(c)}
              />
              {c.replace(/-/g, " ")}
            </label>
          ))}
        </div>
      </Field>

      <Field
        label={
          <span className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> LeetCode session cookie (optional)
          </span>
        }
        hint="Enables full solved-history sync. Stored only in your local database. Expires ~2 weeks."
      >
        <div className="rounded-md border border-border bg-panel2 p-3 text-xs text-muted flex gap-2 mb-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Get it from your browser: DevTools → Application → Cookies →
            leetcode.com → copy the <code>LEETCODE_SESSION</code> value (paste
            just the value, or the full <code>cookie</code> string).
          </span>
        </div>
        <input
          value={cookie}
          onChange={(e) => setCookie(e.target.value)}
          placeholder={
            data.settings.hasCookie ? "•••••• (saved) — paste to replace" : "Paste LEETCODE_SESSION value"
          }
          className="input font-mono text-xs"
          type="password"
        />
        {data.settings.hasCookie && (
          <button
            onClick={clearCookie}
            className="text-xs text-hard hover:underline mt-1"
          >
            Remove saved cookie
          </button>
        )}
      </Field>

      <button
        onClick={save}
        className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {saved ? "Saved" : "Save settings"}
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium block">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
