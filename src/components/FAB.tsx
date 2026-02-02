import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/utils';
import { Plus } from 'lucide-react';

type FABProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function FAB({ className, ...props }: FABProps) {
  return (
    <button
      className={cn(
        "fixed bottom-6 right-6 h-14 w-14 rounded-full bg-rose-700 text-stone-100 shadow-lg hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 transition-transform active:scale-95 hidden md:flex items-center justify-center z-40",
        className
      )}
      {...props}
    >
      <Plus className="h-8 w-8" />
    </button>
  );
}
