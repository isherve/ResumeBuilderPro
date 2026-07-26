import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'premium' | 'success';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'gradient-primary text-primary-foreground': variant === 'default',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
          'border border-input bg-background': variant === 'outline',
          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20': variant === 'premium',
          'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20': variant === 'success',
        },
        className,
      )}
      {...props}
    />
  );
}
