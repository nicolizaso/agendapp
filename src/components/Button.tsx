import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
}

const variants = {
  primary:
    'bg-ember-500 text-ink-950 hover:bg-ember-400 active:bg-ember-600 border border-transparent font-bold shadow-ember',
  success:
    'bg-mint-400 text-ink-950 hover:bg-mint-300 active:bg-mint-500 border border-transparent font-bold',
  secondary: 'bg-ink-800 text-ink-100 hover:bg-ink-750 border border-ink-700',
  danger: 'bg-flare-500/15 text-flare-400 hover:bg-flare-500/25 border border-flare-500/30 font-semibold',
  ghost: 'bg-transparent text-ink-300 hover:text-ink-100 hover:bg-ink-800',
  outline: 'bg-transparent border border-ink-700 text-ink-200 hover:bg-ink-850 hover:text-ink-100',
};

const sizes = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-13 px-6 text-base gap-2',
  xl: 'h-16 px-7 text-base gap-2.5',
  icon: 'h-11 w-11 shrink-0',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950',
        'disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = 'Button';
export { Button };
