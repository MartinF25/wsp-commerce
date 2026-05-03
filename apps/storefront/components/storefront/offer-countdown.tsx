"use client";

import { Fragment, useEffect, useState } from "react";

export type OfferCountdownProps = {
  endsAt: string | Date;
  label?: string;
  expiredText?: string;
  footnote?: string;
  className?: string;
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function calcTimeLeft(endMs: number): TimeLeft | null {
  const diff = endMs - Date.now();
  if (diff <= 0) return null;
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const UNIT_LABELS = ["Tage", "Std", "Min", "Sek"] as const;

export function OfferCountdown({
  endsAt,
  label = "Angebot endet in",
  expiredText = "Dieses Angebot ist abgelaufen.",
  footnote,
  className = "",
}: OfferCountdownProps) {
  const endMs = (typeof endsAt === "string" ? new Date(endsAt) : endsAt).getTime();

  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  // SR text updates per minute only — avoids reading out every second-tick
  const [srText, setSrText] = useState(label);

  useEffect(() => {
    setMounted(true);

    const initial = calcTimeLeft(endMs);
    setTimeLeft(initial);

    if (!initial) {
      setSrText(expiredText);
      return;
    }

    setSrText(
      `${label}: ${initial.days} Tage, ${initial.hours} Stunden, ${initial.minutes} Minuten verbleibend`,
    );

    let prevMinute = initial.minutes;

    const id = setInterval(() => {
      const remaining = calcTimeLeft(endMs);
      setTimeLeft(remaining);

      if (!remaining) {
        setSrText(expiredText);
        clearInterval(id);
        return;
      }

      if (remaining.minutes !== prevMinute) {
        prevMinute = remaining.minutes;
        setSrText(
          `${label}: ${remaining.days} Tage, ${remaining.hours} Stunden, ${remaining.minutes} Minuten verbleibend`,
        );
      }
    }, 1_000);

    return () => clearInterval(id);
  }, [endMs, label, expiredText]);

  // Render a stable skeleton before mount to prevent hydration mismatch
  if (!mounted) {
    return (
      <div
        className={`rounded-2xl border border-gray-800 bg-gray-900 px-5 py-4 ${className}`}
        aria-hidden="true"
      >
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">{label}</p>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {UNIT_LABELS.map((unitLabel, i) => (
            <Fragment key={unitLabel}>
              <div className="flex flex-col items-center min-w-[3rem] sm:min-w-[3.5rem]">
                <span className="font-display text-3xl sm:text-4xl font-bold text-white tabular-nums leading-none">
                  --
                </span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1.5">
                  {unitLabel}
                </span>
              </div>
              {i < UNIT_LABELS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="text-brand-accent font-bold text-2xl sm:text-3xl leading-none mb-4 select-none"
                >
                  :
                </span>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div
        role="status"
        className={`rounded-2xl border border-gray-700 bg-gray-900 px-5 py-4 ${className}`}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm text-gray-400 font-medium">{expiredText}</p>
        </div>
      </div>
    );
  }

  const segments = [
    { value: timeLeft.days,    unitLabel: "Tage" },
    { value: timeLeft.hours,   unitLabel: "Std"  },
    { value: timeLeft.minutes, unitLabel: "Min"  },
    { value: timeLeft.seconds, unitLabel: "Sek"  },
  ] as const;

  return (
    <div
      role="timer"
      className={`rounded-2xl border border-gray-800 bg-gray-900 px-5 py-4 shadow-lg ${className}`}
    >
      {/* Visually hidden live region — updates per minute so screen readers aren't spammed */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {srText}
      </span>

      <p
        className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3"
        aria-hidden="true"
      >
        {label}
      </p>

      <div className="flex items-center gap-1.5 sm:gap-2" aria-hidden="true">
        {segments.map((seg, i) => (
          <Fragment key={seg.unitLabel}>
            <div className="flex flex-col items-center min-w-[3rem] sm:min-w-[3.5rem]">
              <span className="font-display text-3xl sm:text-4xl font-bold text-white tabular-nums leading-none">
                {pad(seg.value)}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1.5">
                {seg.unitLabel}
              </span>
            </div>
            {i < segments.length - 1 && (
              <span
                aria-hidden="true"
                className="text-brand-accent font-bold text-2xl sm:text-3xl leading-none mb-4 select-none"
              >
                :
              </span>
            )}
          </Fragment>
        ))}
      </div>

      {footnote && (
        <p className="text-[11px] text-gray-600 mt-3 leading-snug">{footnote}</p>
      )}
    </div>
  );
}
