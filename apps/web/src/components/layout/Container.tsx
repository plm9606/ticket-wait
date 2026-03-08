export function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[720px] mx-auto px-5 pb-24 md:pb-12">
      {children}
    </div>
  );
}
