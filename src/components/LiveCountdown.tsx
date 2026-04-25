import { useEffect, useState } from "react";

interface Props {
  /** Target ISO datetime (UTC). Defaults to next Friday 18:00 local. */
  target?: string;
  label?: string;
}

function nextFriday(): string {
  const d = new Date();
  const day = d.getDay();
  const delta = (5 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  d.setHours(18, 0, 0, 0);
  return d.toISOString();
}

/**
 * Module 8 — Live countdown to the most-anticipated release of the week.
 * Without an editorial feed, defaults to "Next Friday 6PM" (typical anime
 * episode drop window). Override `target` once a real release is wired in.
 */
export function LiveCountdown({ target, label = "Next Episode Drop" }: Props) {
  const goal = target ?? nextFriday();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, new Date(goal).getTime() - now);
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);

  const cell = (n: number, unit: string) => (
    <div className="flex flex-col items-center">
      <span className="font-mono text-3xl font-black tabular-nums text-primary sm:text-4xl">
        {String(n).padStart(2, "0")}
      </span>
      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{unit}</span>
    </div>
  );

  return (
    <div className="my-8 rounded-xl border border-primary/30 bg-card/50 p-5 shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
      <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.25em] text-foreground/80">
        ⏳ {label}
      </p>
      <div className="flex items-center justify-center gap-4">
        {cell(d, "Days")}
        <span className="text-2xl text-muted-foreground">:</span>
        {cell(h, "Hrs")}
        <span className="text-2xl text-muted-foreground">:</span>
        {cell(m, "Min")}
        <span className="text-2xl text-muted-foreground">:</span>
        {cell(s, "Sec")}
      </div>
    </div>
  );
}
