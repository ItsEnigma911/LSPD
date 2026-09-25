import React from "react";
import { initials } from "../utils/format";

export const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`bg-ink-800/40 backdrop-blur-xl border border-ink-600/40 rounded-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${className}`}
  >
    {children}
  </div>
);

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="font-display text-lg tracking-wide text-bone-100 mb-3 pb-2 border-b border-ink-600">
    {children}
  </h2>
);

export const Avatar: React.FC<{ name: string; color: string; size?: number }> = ({
  name,
  color,
  size = 36,
}) => (
  <div
    className="rounded-full flex items-center justify-center font-display font-medium text-ink-950 shrink-0"
    style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
  >
    {initials(name)}
  </div>
);

export const Pill: React.FC<{ children: React.ReactNode; color?: string; tone?: "neutral" | "alert" }> = ({
  children,
  color,
  tone = "neutral",
}) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
      tone === "alert"
        ? "border-alert-500/50 text-alert-500 bg-alert-500/10"
        : "border-ink-600 text-bone-100 bg-ink-700"
    }`}
    style={color ? { borderColor: `${color}66`, color, backgroundColor: `${color}14` } : undefined}
  >
    {children}
  </span>
);

export const PrimaryButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
> = ({ children, className = "", ...rest }) => (
  <button
    {...rest}
    className={`px-4 py-2 rounded-sm bg-brass-500 hover:bg-brass-400 text-ink-950 font-display font-medium tracking-wide text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

export const GhostButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
> = ({ children, className = "", ...rest }) => (
  <button
    {...rest}
    className={`px-3 py-1.5 rounded-sm border border-ink-600 hover:border-brass-500 hover:text-brass-400 text-bone-100 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

export const DangerButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
> = ({ children, className = "", ...rest }) => (
  <button
    {...rest}
    className={`px-3 py-1.5 rounded-sm border border-alert-500/50 text-alert-500 hover:bg-alert-500/10 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = "",
  ...rest
}) => (
  <input
    {...rest}
    className={`w-full bg-ink-900 border border-ink-600 rounded-sm px-3 py-2 text-sm text-bone-100 placeholder:text-bone-400 focus:outline-none focus:border-brass-500 ${className}`}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className = "",
  children,
  ...rest
}) => (
  <select
    {...rest}
    className={`w-full bg-ink-900 border border-ink-600 rounded-sm px-3 py-2 text-sm text-bone-100 focus:outline-none focus:border-brass-500 ${className}`}
  >
    {children}
  </select>
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className = "",
  ...rest
}) => (
  <textarea
    {...rest}
    className={`w-full bg-ink-900 border border-ink-600 rounded-sm px-3 py-2 text-sm text-bone-100 placeholder:text-bone-400 focus:outline-none focus:border-brass-500 ${className}`}
  />
);

export const ProgressBar: React.FC<{ value: number; max: number; color?: string }> = ({
  value,
  max,
  color = "#B8934A",
}) => {
  const pct = max <= 0 ? 100 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-2 bg-ink-900 rounded-full overflow-hidden border border-ink-600">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
};
