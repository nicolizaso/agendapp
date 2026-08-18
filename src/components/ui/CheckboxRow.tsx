import { cn } from '../../lib/utils';

interface CheckboxRowProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  hint?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/** Fila con checkbox + etiqueta, con el estilo del resto de la app. */
export function CheckboxRow({ checked, onChange, label, hint, disabled, className }: CheckboxRowProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-950/40 p-3 transition-colors',
        !disabled && 'cursor-pointer hover:border-ink-700',
        disabled && 'cursor-not-allowed opacity-40',
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 cursor-pointer rounded-md border-ink-700 bg-ink-900 accent-ember-500 disabled:cursor-not-allowed"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink-100">{label}</span>
        {hint && <span className="mt-0.5 block truncate text-xs text-ink-500">{hint}</span>}
      </span>
    </label>
  );
}
