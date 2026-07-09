export function PageHeader({ title, description, children }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 mt-4 sm:mt-0">{children}</div>}
    </div>
  );
}
