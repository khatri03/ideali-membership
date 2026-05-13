import { useEffect, useState } from "react";

export interface ToastData {
  id: string;
  message: string;
  type: "error" | "success" | "info";
}

const toastListeners: Set<(toast: ToastData) => void> = new Set();

export function showToast(message: string, type: ToastData["type"] = "error") {
  const toast: ToastData = {
    id: Math.random().toString(36).substring(2, 9),
    message,
    type,
  };
  toastListeners.forEach((listener) => listener(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const listener = (toast: ToastData) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    };
    toastListeners.add(listener);
    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "error"
              ? "bg-red-600 text-white"
              : toast.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-white"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}