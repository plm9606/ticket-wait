interface EditorialHeadlineProps {
  title: string;
  subtitle?: string;
}

export function EditorialHeadline({ title, subtitle }: EditorialHeadlineProps) {
  return (
    <div className="px-6 pt-8 pb-6">
      <h2 className="font-headline text-5xl font-extrabold tracking-tight text-primary">
        {title}
      </h2>
      {subtitle && (
        <p className="text-on-surface-variant font-medium mt-3 text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}
