"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useId } from "react";
import type { ComponentProps, ReactNode } from "react";

const CONTROL =
  "w-full rounded-xl border border-line bg-parchment px-4 py-3 text-sm text-charcoal placeholder:text-moss/60 transition-colors focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15 aria-[invalid=true]:border-terracotta";

export function FieldWrap({
  label,
  error,
  hint,
  htmlFor,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-bold text-forest-deep">
        {label}
        {required && <span className="ml-0.5 text-terracotta">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-moss">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-semibold text-terracotta-deep">
          {error}
        </p>
      )}
    </div>
  );
}

type BaseProps = { label: string; error?: string; hint?: string };

export const Input = forwardRef<
  HTMLInputElement,
  ComponentProps<"input"> & BaseProps
>(function Input({ label, error, hint, required, className, ...props }, ref) {
  const id = useId();
  return (
    <FieldWrap label={label} error={error} hint={hint} htmlFor={id} required={required}>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        className={cn(CONTROL, className)}
        required={required}
        {...props}
      />
    </FieldWrap>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  ComponentProps<"textarea"> & BaseProps
>(function Textarea({ label, error, hint, required, className, ...props }, ref) {
  const id = useId();
  return (
    <FieldWrap label={label} error={error} hint={hint} htmlFor={id} required={required}>
      <textarea
        ref={ref}
        id={id}
        rows={4}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, "resize-y", className)}
        required={required}
        {...props}
      />
    </FieldWrap>
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  ComponentProps<"select"> & BaseProps
>(function Select({ label, error, hint, required, className, children, ...props }, ref) {
  const id = useId();
  return (
    <FieldWrap label={label} error={error} hint={hint} htmlFor={id} required={required}>
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, "appearance-none", className)}
        required={required}
        {...props}
      >
        {children}
      </select>
    </FieldWrap>
  );
});
