import { type SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
        <select
        className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:cursor-not-allowed disabled:opacity-50 text-slate-100",
            className
        )}
        ref={ref}
        {...props}
        >
        {children}
        </select>
    </div>
  );
});
Select.displayName = "Select";

export { Select };
