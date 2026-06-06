"use client";

import * as React from "react";

export interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "danger";
}

type Listener = (toasts: ToastData[]) => void;

let toasts: ToastData[] = [];
const listeners = new Set<Listener>();
let counter = 0;

function emit() {
  for (const l of listeners) l([...toasts]);
}

export function toast(t: Omit<ToastData, "id">) {
  const id = `t${++counter}`;
  toasts = [...toasts, { id, ...t }];
  emit();
  setTimeout(() => dismiss(id), 4000);
  return id;
}

export function dismiss(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function useToast() {
  const [state, setState] = React.useState<ToastData[]>(toasts);
  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return { toasts: state, toast, dismiss };
}
