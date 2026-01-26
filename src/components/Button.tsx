import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'primary', size = 'md', ...props }, ref) => {
  const variants = {
    primary: 'bg-rose-700 text-stone-100 hover:bg-rose-600 border border-transparent shadow-sm',
    secondary: 'bg-rose-800 text-stone-200 hover:bg-rose-700 border border-transparent shadow-sm',
    danger: 'bg-red-800 text-white hover:bg-red-700 border border-transparent shadow-sm',
    ghost: 'bg-transparent text-rose-300 hover:text-white hover:bg-rose-900',
    outline: 'bg-transparent border border-rose-800 text-rose-300 hover:bg-rose-900 hover:text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'h-9 w-9 p-2'
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-700 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

Button.displayName = 'Button';
export { Button };
