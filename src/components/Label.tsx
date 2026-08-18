import { type LabelHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-xs font-semibold uppercase tracking-wider text-ink-400 leading-none',
      className
    )}
    {...props}
  />
));
Label.displayName = 'Label';

export { Label };
