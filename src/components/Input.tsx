import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      'flex h-12 w-full rounded-xl border border-ink-800 bg-ink-900 px-4 text-base text-ink-100',
      'transition-colors placeholder:text-ink-500',
      'focus-visible:outline-none focus-visible:border-ember-500 focus-visible:ring-1 focus-visible:ring-ember-500',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
