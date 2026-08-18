import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** En mobile se ancla al borde inferior como bottom-sheet. */
  sheetOnMobile?: boolean;
}

const widths = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  full: 'sm:max-w-[95vw]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  sheetOnMobile = true,
}: ModalProps) {
  // Cierre con Escape + bloqueo del scroll de fondo mientras está abierto.
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[9000] flex bg-ink-950/80 backdrop-blur-sm animate-in fade-in duration-150',
        sheetOnMobile ? 'items-end sm:items-center sm:p-4' : 'items-center justify-center p-4'
      )}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          'relative flex w-full flex-col overflow-hidden border border-ink-800 bg-ink-900 shadow-lift',
          'max-h-[92dvh] animate-in duration-200 sm:mx-auto',
          sheetOnMobile
            ? 'rounded-t-3xl slide-in-from-bottom-4 sm:rounded-card sm:zoom-in-95'
            : 'rounded-card zoom-in-95',
          widths[size]
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-ink-800 p-5">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-bold tracking-tight text-ink-100">{title}</h2>
            {description && <p className="mt-1 text-sm text-ink-400">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain p-5 pb-safe">{children}</div>
      </div>
    </div>,
    document.body
  );
}
