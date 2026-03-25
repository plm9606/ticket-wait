interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${
        active
          ? "bg-black text-white"
          : "bg-surface-lowest text-on-surface-variant"
      }`}
    >
      {label}
    </button>
  );
}
