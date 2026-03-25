interface SurfaceCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SurfaceCard({ children, className = "" }: SurfaceCardProps) {
  return (
    <div className={`bg-surface-lowest rounded-lg p-6 ${className}`}>
      {children}
    </div>
  );
}
