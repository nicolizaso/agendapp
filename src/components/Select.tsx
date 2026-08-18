import { type SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        'flex h-12 w-full appearance-none rounded-xl border border-ink-800 bg-ink-900 pl-4 pr-10 text-base text-ink-100',
        'transition-colors focus-visible:outline-none focus-visible:border-ember-500 focus-visible:ring-1 focus-visible:ring-ember-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
  </div>
));
Select.displayName = 'Select';

export { Select };
