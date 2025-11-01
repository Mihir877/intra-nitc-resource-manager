// lib/notify.js
"use client";
import { createElement } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";

const iconEl = {
  success: () =>
    createElement(CheckCircle2, { className: "h-4 w-4 text-emerald-600" }),
  error: () => createElement(XCircle, { className: "h-4 w-4 text-red-600" }),
  info: () => createElement(Info, { className: "h-4 w-4 text-sky-600" }),
  warning: () =>
    createElement(AlertTriangle, { className: "h-4 w-4 text-amber-600" }),
};

export const notify = {
  success: (t, d) =>
    toast.success(t, { description: d, icon: iconEl.success() }),
  error: (t, d) => toast.error(t, { description: d, icon: iconEl.error() }),
  info: (t, d) => toast.message(t, { description: d, icon: iconEl.info() }),
  warning: (t, d) =>
    toast.warning?.(t, { description: d, icon: iconEl.warning() }) ??
    toast(t, { description: d, icon: iconEl.warning() }),
  loading: (t, d) => toast.loading(t, { description: d }),
  promise: (
    p,
    { loading = "Working…", success = "Done", error = "Failed" } = {}
  ) => toast.promise(p, { loading, success, error }),
};
