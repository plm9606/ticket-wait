import Image from "next/image";

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-16 h-16 text-base",
  xl: "w-24 h-24 text-lg",
} as const;

interface AvatarCircleProps {
  src?: string | null;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}

export function AvatarCircle({
  src,
  name,
  size = "md",
  className = "",
}: AvatarCircleProps) {
  const initials = name.slice(0, 2);

  if (src) {
    return (
      <div
        className={`relative rounded-full overflow-hidden shrink-0 ${sizes[size]} ${className}`}
      >
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes={size === "xl" ? "96px" : size === "lg" ? "64px" : "48px"}
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full bg-surface-low flex items-center justify-center shrink-0 font-medium text-on-surface-variant ${sizes[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
