import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const maxWidthClass = size === 'lg' ? 'max-w-4xl' : size === 'xl' ? 'max-w-6xl' : size === 'full' ? 'max-w-[95vw]' : 'max-w-md';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={cn("bg-neutral-900 border border-neutral-800 rounded-xl w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto overscroll-contain flex flex-col", maxWidthClass)}>
        <div className="flex items-center justify-between p-4 border-b border-neutral-800/50 shrink-0">
          <h2 className="text-xl font-bold text-neutral-100">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-4 flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
