"use client";

import { useToast } from "@/hooks/useToast";

export function Toast() {
  const { message, visible } = useToast();

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
      <div className="bg-black text-white rounded-lg px-4 py-3 text-sm shadow-lg">
        {message}
      </div>
    </div>
  );
}
