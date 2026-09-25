"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Save, KeyRound, Info, Trash2 } from "lucide-react";
import { fetcher, post } from "@/lib/client";
import { cn } from "@/lib/cn";
import {
  Button,
  Card,
  Field,
  FieldSet,
  PageHeader,
  Skeleton,
  useToast,
} from "@/components/ui";

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

const SHEET_ORDERS = [
  { value: "neetcode", label: "NeetCode roadmap flow" },
  { value: "a2z", label: "Original A2Z order" },
];

export default function SettingsPage() {
  const { data, mutate } = useSWR<SettingsResp>("/api/settings", fetcher);
  const toast = useToast();
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
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        ...form,
        selectedCompanies: [...companies].join(","),
      };
      if (cookie.trim()) payload.cookie = cookie.trim();
      await post("/api/settings", payload);
      setCookie("");
      toast("Settings saved.", "success");
      mutate();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const clearCookie = async () => {
    try {
      await post("/api/settings", { cookie: "" });
      toast("Saved cookie removed.", "success");
      mutate();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const toggleCompany = (c: string) =>
    setCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  if (!data) return <SettingsSkeleton />;

  return (
    <div className="max-w-2xl space-y-8 pb-4">
      <PageHeader
        title="Settings"
        description="How Guardian syncs, what counts as done, and which companies it draws from."
      />

      <Card className="space-y-5 p-5">
        <FieldSet
          title="Account"
          description="Guardian reads your public LeetCode profile using this handle."
        >
          <Field
            label="LeetCode username"
            hint="Used for public sync — solved counts and recent accepted submissions."
          >
            {(p) => (
              <input
                {...p}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. your_lc_handle"
                className="input"
              />
            )}
          </Field>
        </FieldSet>
      </Card>

      <Card className="space-y-5 p-5">
        <FieldSet title="Daily goals" description="What the streak and the rings measure.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Default daily questions goal"
              hint="Any difficulty. You're asked to confirm this each day."
            >
              {(p) => (
                <input
                  {...p}
                  type="number"
                  min={1}
                  max={50}
                  value={form.dailyGoalDefault}
                  onChange={(e) => setForm({ ...form, dailyGoalDefault: e.target.value })}
                  className="input num"
                />
              )}
            </Field>
            <Field
              label="Daily Hard goal"
              hint="Also sets how many Hard problems get recommended."
            >
              {(p) => (
                <input
                  {...p}
                  type="number"
                  min={1}
                  max={20}
                  value={form.hardGoal}
                  onChange={(e) => setForm({ ...form, hardGoal: e.target.value })}
                  className="input num"
                />
              )}
            </Field>
          </div>
        </FieldSet>
      </Card>

      <Card className="space-y-5 p-5">
        <FieldSet
          title="Sheet behaviour"
          description="When a topic counts as done, and how the steps are ordered."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Topic complete at (%)"
              hint="Of a step's LeetCode problems. Unlocks Hard recommendations."
            >
              {(p) => (
                <input
                  {...p}
                  type="number"
                  min={1}
                  max={100}
                  value={form.completionThreshold}
                  onChange={(e) =>
                    setForm({ ...form, completionThreshold: e.target.value })
                  }
                  className="input num"
                />
              )}
            </Field>
            <Field label="Day offset (minutes)" hint="0 = UTC, LeetCode's reset. IST = 330.">
              {(p) => (
                <input
                  {...p}
                  type="number"
                  value={form.dayOffsetMinutes}
                  onChange={(e) =>
                    setForm({ ...form, dayOffsetMinutes: e.target.value })
                  }
                  className="input num"
                />
              )}
            </Field>
          </div>

          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-fg">Sheet order</legend>
            <div className="flex flex-wrap gap-2">
              {SHEET_ORDERS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setForm({ ...form, sheetOrder: o.value })}
                  aria-pressed={form.sheetOrder === o.value}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm transition-colors",
                    form.sheetOrder === o.value
                      ? "border-brand bg-brand/10 text-fg"
                      : "border-line bg-surface-overlay text-fg-muted hover:text-fg"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-fg-muted">
              Reorders the A2Z steps for display only — the sheet contents are unchanged.
            </p>
          </fieldset>
        </FieldSet>
      </Card>

      <Card className="space-y-4 p-5">
        <FieldSet
          title="Company filter"
          description={`Hard recommendations are drawn from these companies. None selected means all ${data.companies.length}.`}
        >
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setCompanies(new Set(data.companies))}>
              Select all
            </Button>
            <Button size="sm" onClick={() => setCompanies(new Set())}>
              Clear
            </Button>
            <span className="num ml-auto text-xs text-fg-muted">
              {companies.size} selected
            </span>
          </div>
          <div className="grid max-h-56 grid-cols-2 gap-0.5 overflow-y-auto rounded-md border border-line bg-surface-sunken p-2 sm:grid-cols-3">
            {data.companies.map((c) => (
              <label
                key={c}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm capitalize text-fg-muted transition-colors hover:bg-surface-overlay hover:text-fg"
              >
                <input
                  type="checkbox"
                  checked={companies.has(c)}
                  onChange={() => toggleCompany(c)}
                  className="accent-brand"
                />
                {c.replace(/-/g, " ")}
              </label>
            ))}
          </div>
        </FieldSet>
      </Card>

      <Card className="space-y-4 p-5">
        <FieldSet
          title="Full history sync"
          description="Optional. Backfills every problem you've ever solved."
        >
          <div className="flex gap-2 rounded-md border border-line bg-surface-sunken p-3 text-xs text-fg-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Get it from your browser: DevTools → Application → Cookies → leetcode.com
              → copy the <code className="font-mono">LEETCODE_SESSION</code> value. Paste
              just the value, or the full cookie string.
            </span>
          </div>

          <Field
            label={
              <span className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-fg-muted" aria-hidden="true" />
                LeetCode session cookie
              </span>
            }
            hint="Encrypted at rest and used only to talk to LeetCode. Expires after about two weeks."
          >
            {(p) => (
              <input
                {...p}
                type="password"
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                placeholder={
                  data.settings.hasCookie
                    ? "•••••• saved — paste to replace"
                    : "Paste LEETCODE_SESSION value"
                }
                className="input font-mono text-xs"
              />
            )}
          </Field>

          {data.settings.hasCookie && (
            <Button
              size="sm"
              variant="danger"
              onClick={clearCookie}
              icon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Remove saved cookie
            </Button>
          )}
        </FieldSet>
      </Card>

      <div className="sticky bottom-20 flex justify-end md:bottom-4">
        <Button
          variant="primary"
          size="lg"
          onClick={save}
          loading={saving}
          icon={<Save className="h-4 w-4" aria-hidden="true" />}
          className="shadow-pop"
        >
          Save settings
        </Button>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="max-w-2xl space-y-6">
      <Skeleton className="h-10 w-40" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-card" />
      ))}
    </div>
  );
}
