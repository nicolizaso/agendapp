import { type SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
        <select
        className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-red-600 disabled:cursor-not-allowed disabled:opacity-50 text-neutral-200",
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
