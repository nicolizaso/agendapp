import { User, X, Dumbbell, ClipboardList } from 'lucide-react';
import { Button } from './Button';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: any) => void;
}

export function MobileMenu({ isOpen, onClose, onNavigate }: MobileMenuProps) {
  if (!isOpen) return null;

  const menuItems = [
    { id: 'gym', icon: Dumbbell, label: 'Entrenamiento' },
    { id: 'routines', icon: ClipboardList, label: 'Rutinas' },
    { id: 'exercises', icon: Dumbbell, label: 'Ejercicios' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-sm md:hidden animate-in fade-in duration-200">
      <div className="flex flex-col h-full p-6">
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                <span className="font-heading font-bold text-xl text-white">Menú</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-6 h-6" />
            </Button>
        </div>

        <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                    <button
                        key={item.id}
                        onClick={() => {
                            onNavigate(item.id);
                            onClose();
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-xl text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors text-lg"
                    >
                        <Icon className="w-6 h-6 text-lime-500" />
                        {item.label}
                    </button>
                )
            })}

            <div className="h-px bg-neutral-800 my-4" />

             <button
                disabled
                className="w-full flex items-center gap-4 p-4 rounded-xl text-neutral-500 cursor-not-allowed text-lg"
            >
                <User className="w-6 h-6 text-neutral-500" />
                Perfil (Pronto)
            </button>
        </nav>
      </div>
    </div>
  );
}