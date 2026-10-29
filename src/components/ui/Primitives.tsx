import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "lime" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary: "bg-[#164A31] text-white hover:bg-[#0F3623] active:bg-[#0B291A]",
    secondary:
      "bg-white text-[#14241B] border border-[#E2E5DC] hover:bg-[#F3F1EA] active:bg-[#E8E5DC]",
    lime: "bg-[#D8F3A2] text-[#14241B] hover:bg-[#BCE66C] active:bg-[#A9D953]",
    ghost: "bg-transparent text-[#48564D] hover:text-[#14241B] hover:bg-[#F3F1EA]",
    danger: "bg-[#FDF2F2] text-[#9B1C1C] border border-[#F8B4B4] hover:bg-[#FDE8E8]",
  };

  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "px-3.5 py-2 text-xs min-h-[38px]",
    md: "px-5 py-2.5 text-sm min-h-[42px]",
    lg: "px-6 py-3 text-base min-h-[46px]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface MetaLineProps {
  items: (React.ReactNode | undefined | false)[];
  className?: string;
}

/**
 * Renders unboxed static metadata with subtle typographic separators (·)
 * in strict compliance with Zero-Pill Metadata Discipline.
 */
export function MetaLine({ items, className = "" }: MetaLineProps) {
  const validItems = items.filter(
    (item): item is React.ReactNode =>
      item !== undefined && item !== false && item !== null && item !== ""
  );
  if (validItems.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6E7B72] ${className}`}>
      {validItems.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span aria-hidden="true">·</span>}
          <span>{item}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

interface SegmentedOption<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (val: T) => void;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel = "Filter options",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F3F1EA] border border-[#E2E5DC] rounded-lg"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              active
                ? "bg-white text-[#14241B] shadow-xs"
                : "text-[#48564D] hover:text-[#14241B]"
            }`}
          >
            {opt.label}
            {typeof opt.count === "number" ? (
              <span className="ml-1.5 font-mono tabular-nums text-[#6E7B72]">
                ({opt.count})
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  valueLabel?: string;
  tone?: "forest" | "lime" | "info";
}

export function ProgressBar({
  value,
  max = 100,
  label,
  valueLabel,
  tone = "forest",
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
  const fillClass =
    tone === "lime"
      ? "bg-[#BCE66C]"
      : tone === "info"
      ? "bg-[#184E77]"
      : "bg-[#164A31]";

  return (
    <div className="w-full">
      {(label || valueLabel) && (
        <div className="flex items-center justify-between text-xs mb-1.5">
          {label && <span className="font-medium text-[#14241B]">{label}</span>}
          {valueLabel && (
            <span className="font-mono tabular-nums text-[#48564D]">{valueLabel}</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full h-2 bg-[#E8E6DF] rounded-full overflow-hidden"
      >
        <div
          className={`h-full ${fillClass} transition-transform duration-200 origin-left`}
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>
    </div>
  );
}

interface ModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ModalDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: ModalDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14241B]/50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-dialog-title"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-[#E2E5DC] rounded-xl p-5 sm:p-6 shadow-lg my-auto">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E2E5DC]">
          <div>
            <h2 id="modal-dialog-title" className="text-lg font-semibold text-[#14241B]">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-[#6E7B72] mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#6E7B72] hover:text-[#14241B] rounded-lg hover:bg-[#F3F1EA] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}
