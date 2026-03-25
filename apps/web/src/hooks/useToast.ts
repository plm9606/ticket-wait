import { create } from "zustand";

interface ToastState {
  message: string;
  visible: boolean;
  show: (message: string, duration?: number) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: "",
  visible: false,
  show: (message, duration = 3000) => {
    set({ message, visible: true });
    setTimeout(() => set({ visible: false }), duration);
  },
  hide: () => set({ visible: false }),
}));
