import { cn } from '../lib/utils';

interface LogoMarkProps {
  className?: string;
  /** `plain` hereda el color del texto; `brand` usa el degradado ember. */
  tone?: 'brand' | 'plain';
}

/**
 * Marca de Carga: una barra olímpica vista de frente.
 * Se mantiene legible incluso a 16px (favicon / pestaña).
 */
export function LogoMark({ className, tone = 'brand' }: LogoMarkProps) {
  if (tone === 'plain') {
    return (
      <svg viewBox="0 0 64 64" className={cn('w-8 h-8', className)} aria-hidden="true" fill="currentColor">
        <rect x="18" y="28.5" width="28" height="7" rx="3.5" />
        <rect x="17" y="18" width="8" height="28" rx="4" />
        <rect x="39" y="18" width="8" height="28" rx="4" />
        <rect x="7" y="25" width="6" height="14" rx="3" />
        <rect x="51" y="25" width="6" height="14" rx="3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className={cn('w-9 h-9', className)} aria-hidden="true">
      <defs>
        <linearGradient id="carga-mark-ember" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF8A4C" />
          <stop offset="0.55" stopColor="#FF6B2C" />
          <stop offset="1" stopColor="#E5451A" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#carga-mark-ember)" />
      <g fill="#0A0B0D">
        <rect x="18" y="28.5" width="28" height="7" rx="3.5" />
        <rect x="17" y="18" width="8" height="28" rx="4" />
        <rect x="39" y="18" width="8" height="28" rx="4" />
        <rect x="7" y="25" width="6" height="14" rx="3" />
        <rect x="51" y="25" width="6" height="14" rx="3" />
      </g>
    </svg>
  );
}

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md';
}

export function Logo({ className, showTagline = false, size = 'md' }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LogoMark className={size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'} />
      <div className="leading-none">
        <span
          className={cn(
            'font-heading font-bold tracking-tight text-ink-100 block',
            size === 'sm' ? 'text-lg' : 'text-xl'
          )}
        >
          Carga
        </span>
        {showTagline && (
          <span className="text-[11px] text-ink-400 font-medium tracking-wide">
            Registro de entrenamiento
          </span>
        )}
      </div>
    </div>
  );
}
