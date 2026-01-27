import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-rose-800 bg-rose-900 px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-rose-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-700 disabled:cursor-not-allowed disabled:opacity-50 text-stone-200",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
