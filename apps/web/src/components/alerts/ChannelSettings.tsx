"use client";

import { useState } from "react";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { requestNotificationPermission } from "@/lib/fcm";

export function ChannelSettings() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const handleTogglePush = async () => {
    if (pushEnabled) {
      setPushEnabled(false);
      return;
    }
    setPushLoading(true);
    try {
      const success = await requestNotificationPermission();
      setPushEnabled(success);
    } catch {
      // ignore
    } finally {
      setPushLoading(false);
    }
  };

  return (
    <SurfaceCard className="p-4">
      <h3 className="text-sm font-bold mb-3">알림 채널</h3>
      <div className="space-y-3">
        {/* Push */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Push 알림</span>
          <button
            onClick={handleTogglePush}
            disabled={pushLoading}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              pushEnabled ? "bg-black" : "bg-surface-dim"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                pushEnabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
        {/* Email */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-on-surface-variant">Email</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-surface-low text-on-surface-variant rounded-full">
              준비중
            </span>
          </div>
          <div className="w-11 h-6 rounded-full bg-surface-dim opacity-50" />
        </div>
        {/* SMS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-on-surface-variant">SMS</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-surface-low text-on-surface-variant rounded-full">
              준비중
            </span>
          </div>
          <div className="w-11 h-6 rounded-full bg-surface-dim opacity-50" />
        </div>
      </div>
    </SurfaceCard>
  );
}
