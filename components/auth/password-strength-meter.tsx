"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";

export interface PasswordCriteria {
  minLength: boolean;
  hasMixedCase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function evaluatePassword(password: string): {
  score: number; // 0 to 4
  label: "Too Weak" | "Weak" | "Fair" | "Good" | "Strong";
  colorClass: string;
  criteria: PasswordCriteria;
} {
  const criteria: PasswordCriteria = {
    minLength: password.length >= 8,
    hasMixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  if (!password) {
    return {
      score: 0,
      label: "Too Weak",
      colorClass: "bg-muted-brand/30 text-muted-brand",
      criteria,
    };
  }

  const passedCount = [
    criteria.minLength,
    criteria.hasMixedCase,
    criteria.hasNumber,
    criteria.hasSpecial,
  ].filter(Boolean).length;

  if (!criteria.minLength || passedCount <= 1) {
    return {
      score: 1,
      label: "Weak",
      colorClass: "bg-red-500 text-red-700",
      criteria,
    };
  }

  if (passedCount === 2) {
    return {
      score: 2,
      label: "Fair",
      colorClass: "bg-amber-500 text-amber-700",
      criteria,
    };
  }

  if (passedCount === 3) {
    return {
      score: 3,
      label: "Good",
      colorClass: "bg-blue-500 text-blue-700",
      criteria,
    };
  }

  return {
    score: 4,
    label: "Strong",
    colorClass: "bg-emerald-600 text-emerald-700",
    criteria,
  };
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label, colorClass, criteria } = useMemo(
    () => evaluatePassword(password),
    [password],
  );

  if (!password) return null;

  return (
    <div className="space-y-2 pt-1 text-xs">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-brand">Password Strength:</span>
        <span
          className={`font-semibold ${
            score <= 1
              ? "text-red-600"
              : score === 2
                ? "text-amber-600"
                : score === 3
                  ? "text-blue-600"
                  : "text-emerald-700"
          }`}
        >
          {label}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full rounded-full transition-all duration-300 ${
              step <= score
                ? score <= 1
                  ? "bg-red-500"
                  : score === 2
                    ? "bg-amber-500"
                    : score === 3
                      ? "bg-blue-500"
                      : "bg-emerald-600"
                : "bg-line"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-muted-brand">
        <div className="flex items-center gap-1">
          {criteria.minLength ? (
            <Check className="h-3 w-3 text-emerald-600 shrink-0" />
          ) : (
            <X className="h-3 w-3 text-muted-brand/60 shrink-0" />
          )}
          <span className={criteria.minLength ? "text-forest font-medium" : ""}>
            8+ characters
          </span>
        </div>

        <div className="flex items-center gap-1">
          {criteria.hasMixedCase ? (
            <Check className="h-3 w-3 text-emerald-600 shrink-0" />
          ) : (
            <X className="h-3 w-3 text-muted-brand/60 shrink-0" />
          )}
          <span className={criteria.hasMixedCase ? "text-forest font-medium" : ""}>
            Upper &amp; lowercase
          </span>
        </div>

        <div className="flex items-center gap-1">
          {criteria.hasNumber ? (
            <Check className="h-3 w-3 text-emerald-600 shrink-0" />
          ) : (
            <X className="h-3 w-3 text-muted-brand/60 shrink-0" />
          )}
          <span className={criteria.hasNumber ? "text-forest font-medium" : ""}>
            At least 1 number
          </span>
        </div>

        <div className="flex items-center gap-1">
          {criteria.hasSpecial ? (
            <Check className="h-3 w-3 text-emerald-600 shrink-0" />
          ) : (
            <X className="h-3 w-3 text-muted-brand/60 shrink-0" />
          )}
          <span className={criteria.hasSpecial ? "text-forest font-medium" : ""}>
            Special character (!@#$)
          </span>
        </div>
      </div>
    </div>
  );
}
