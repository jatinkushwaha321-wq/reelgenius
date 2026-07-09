import { Button } from '@/components/ui/button';

export function EmptyState({ icon: Icon, title, description, actionText, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl p-12 text-center max-w-lg mx-auto mt-12 bg-white/[0.01]">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
        {Icon && <Icon className="h-6 w-6" />}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} className="gradient-primary text-white shadow-lg shadow-primary/20">
          {actionText}
        </Button>
      )}
    </div>
  );
}
