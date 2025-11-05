// src/components/auth/PasswordField.jsx
import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ShieldCheck, ShieldAlert } from "lucide-react";

export default function PasswordField({
  id = "password",
  label = "Password",
  value,
  onChange,
  placeholder = "••••••••",
  showChecklist = true,
  showStrength = true,
  autoComplete = "new-password",
  confirmValue,
  onConfirmChange,
  confirmId = "confirm",
  confirmLabel = "Confirm password",
  required = true,
}) {
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);

  const checks = useMemo(() => {
    const len = (value || "").length >= 8;
    const upper = /[A-Z]/.test(value || "");
    const lower = /[a-z]/.test(value || "");
    const digit = /\d/.test(value || "");
    const special = /[^A-Za-z0-9]/.test(value || "");
    return {
      len,
      upper,
      lower,
      digit,
      special,
      all: len && upper && lower && digit && special,
    };
  }, [value]);

  const strength = useMemo(
    () =>
      ["len", "upper", "lower", "digit", "special"].reduce(
        (a, k) => a + (checks[k] ? 1 : 0),
        0
      ),
    [checks]
  );

  const strengthLabel =
    ["Weak", "Weak", "Fair", "Good", "Strong", "Strong"][strength] || "Weak";
  const strengthColor =
    [
      "bg-red-500",
      "bg-red-500",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-emerald-500",
      "bg-emerald-600",
    ][strength] || "bg-red-500";

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={id} className="mb-1 block">
          {label}
        </Label>
        <div className="relative">
          <Input
            id={id}
            type={show ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            autoComplete={autoComplete}
            aria-describedby={showChecklist ? `${id}-req` : undefined}
            required={required}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {typeof confirmValue !== "undefined" && onConfirmChange && (
        <div className="space-y-2">
          <Label htmlFor={confirmId} className="mb-1 block">
            {confirmLabel}
          </Label>
          <div className="relative">
            <Input
              id={confirmId}
              type={show2 ? "text" : "password"}
              placeholder={placeholder}
              value={confirmValue ?? ""} // ensure controlled
              onChange={onConfirmChange} // ensure handler passed
              autoComplete="new-password"
              disabled={false} // prevent accidental disable
            />
            <button
              type="button"
              onClick={() => setShow2((s) => !s)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              aria-label={
                show2 ? "Hide confirm password" : "Show confirm password"
              }
            >
              {show2 ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Both passwords must match exactly.
          </p>
        </div>
      )}

      {showStrength && (
        <div>
          <div className="h-1.5 w-full rounded bg-muted overflow-hidden">
            <div
              className={`h-1.5 transition-all ${strengthColor}`}
              style={{ width: `${(strength / 5) * 100}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Strength: {strengthLabel}
          </div>
        </div>
      )}

      {showChecklist && (
        <ul
          id={`${id}-req`}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs"
        >
          <ReqItem ok={checks.len} label="At least 8 characters" />
          <ReqItem ok={checks.upper} label="At least 1 uppercase letter" />
          <ReqItem ok={checks.lower} label="At least 1 lowercase letter" />
          <ReqItem ok={checks.digit} label="At least 1 number" />
          <ReqItem ok={checks.special} label="At least 1 special character" />
        </ul>
      )}
    </div>
  );
}

function ReqItem({ ok, label }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? (
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
      ) : (
        <ShieldAlert className="h-4 w-4 text-amber-500" />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </li>
  );
}
