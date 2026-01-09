/**
 * RTL Utilities for Arabic Banking Interface
 * مكونات مساعدة لدعم الاتجاه من اليمين لليسار
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// ============= Number Display Component =============
// Prevents number reversal in RTL context
interface BidiNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number | string;
  suffix?: string;
  prefix?: string;
  locale?: string;
}

export function BidiNumber({ 
  value, 
  suffix, 
  prefix, 
  locale = "ar-SA",
  className,
  ...props 
}: BidiNumberProps) {
  const formattedValue = typeof value === "number" 
    ? value.toLocaleString(locale)
    : value;

  return (
    <span className={cn("bidi-isolate-ltr inline-flex items-center gap-1", className)} {...props}>
      {prefix && <span>{prefix}</span>}
      <bdi dir="ltr">{formattedValue}</bdi>
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </span>
  );
}

// ============= Currency Display Component =============
interface CurrencyProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number;
  currency?: string;
  showDecimals?: boolean;
}

export function Currency({ 
  amount, 
  currency = "ر.س", 
  showDecimals = true,
  className,
  ...props 
}: CurrencyProps) {
  const formattedAmount = showDecimals 
    ? amount.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : amount.toLocaleString("ar-SA");

  return (
    <span className={cn("inline-flex items-center gap-1", className)} {...props}>
      <bdi dir="ltr" className="font-medium">{formattedAmount}</bdi>
      <span className="text-muted-foreground text-sm">{currency}</span>
    </span>
  );
}

// ============= Percentage Display Component =============
interface PercentageProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  decimals?: number;
}

export function Percentage({ 
  value, 
  decimals = 0,
  className,
  ...props 
}: PercentageProps) {
  return (
    <span className={cn("inline-flex items-center", className)} {...props}>
      <bdi dir="ltr">{value.toFixed(decimals)}%</bdi>
    </span>
  );
}

// ============= Date Display Component =============
interface DateDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  date: Date | string;
  format?: "short" | "long" | "numeric";
}

export function DateDisplay({ 
  date, 
  format = "short",
  className,
  ...props 
}: DateDisplayProps) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
    short: { year: "numeric", month: "short", day: "numeric" },
    long: { year: "numeric", month: "long", day: "numeric", weekday: "long" },
    numeric: { year: "numeric", month: "2-digit", day: "2-digit" },
  };

  const formattedDate = dateObj.toLocaleDateString("ar-SA", optionsMap[format]);

  return (
    <span className={cn("bidi-isolate-rtl", className)} {...props}>
      {formattedDate}
    </span>
  );
}

// ============= RTL Icon Wrapper =============
// Flips directional icons for RTL
interface RTLIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  flip?: boolean;
}

export function RTLIcon({ children, flip = true, className, ...props }: RTLIconProps) {
  return (
    <span 
      className={cn(flip && "rtl-flip", "inline-flex", className)} 
      {...props}
    >
      {children}
    </span>
  );
}

// ============= Mixed Text Container =============
// For handling Arabic text with embedded English/numbers
interface MixedTextProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MixedText({ children, className, ...props }: MixedTextProps) {
  return (
    <div 
      className={cn("bidi-isolate-rtl", className)} 
      dir="rtl"
      {...props}
    >
      {children}
    </div>
  );
}

// ============= Progress Bar RTL Wrapper =============
interface RTLProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

export function RTLProgress({ value, className, indicatorClassName }: RTLProgressProps) {
  return (
    <div 
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      dir="ltr"
    >
      <div
        className={cn(
          "h-full bg-primary transition-all duration-300 ease-out rounded-full",
          indicatorClassName
        )}
        style={{ 
          width: `${Math.min(100, Math.max(0, value))}%`,
          marginInlineStart: "auto"
        }}
      />
    </div>
  );
}

// ============= RTL Stepper Indicator =============
interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  className?: string;
}

export function RTLStepIndicator({ 
  currentStep, 
  totalSteps, 
  labels,
  className 
}: StepIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  
  return (
    <div className={cn("flex items-center justify-between gap-2", className)} dir="rtl">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                step < currentStep && "bg-primary text-primary-foreground",
                step === currentStep && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                step > currentStep && "bg-muted text-muted-foreground"
              )}
            >
              {step}
            </div>
            {labels?.[index] && (
              <span className="text-xs text-muted-foreground text-center max-w-16 truncate">
                {labels[index]}
              </span>
            )}
          </div>
          {index < totalSteps - 1 && (
            <div 
              className={cn(
                "flex-1 h-0.5 rounded-full transition-all",
                step < currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============= RTL Checkbox Label =============
interface RTLCheckboxLabelProps {
  checkbox: React.ReactNode;
  label: React.ReactNode;
  description?: string;
  className?: string;
}

export function RTLCheckboxLabel({ 
  checkbox, 
  label, 
  description,
  className 
}: RTLCheckboxLabelProps) {
  return (
    <div className={cn("flex items-start gap-3", className)} dir="rtl">
      <div className="flex-shrink-0 pt-0.5">
        {checkbox}
      </div>
      <div className="flex-1 text-right">
        <div className="font-medium text-sm">{label}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

// ============= RTL Table Wrapper =============
interface RTLTableWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function RTLTableWrapper({ children, className, ...props }: RTLTableWrapperProps) {
  return (
    <div 
      className={cn("w-full overflow-x-auto", className)} 
      dir="rtl"
      {...props}
    >
      {children}
    </div>
  );
}
