import Link from "next/link";

interface GradientButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export function GradientButton({
  children,
  href,
  onClick,
  fullWidth,
  disabled,
  className = "",
}: GradientButtonProps) {
  const base = `btn-primary inline-flex items-center justify-center px-6 py-3 text-sm font-medium transition-opacity ${
    fullWidth ? "w-full" : ""
  } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    );
  }

  return (
    <button className={base} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
