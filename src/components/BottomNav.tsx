import { Dumbbell, ClipboardList, Library } from 'lucide-react';
import { cn } from '../lib/utils';

export const NAV_ITEMS = [
  { id: 'gym', icon: Dumbbell, label: 'Entrenar' },
  { id: 'routines', icon: ClipboardList, label: 'Rutinas' },
  { id: 'exercises', icon: Library, label: 'Ejercicios' },
] as const;

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-800 bg-ink-950/95 pb-safe backdrop-blur-xl md:hidden"
    >
      <div className="flex items-stretch justify-around px-2 pt-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className="group relative flex h-14 w-full flex-col items-center justify-center gap-1"
            >
              <span
                className={cn(
                  'flex h-8 w-14 items-center justify-center rounded-full transition-all duration-200',
                  isActive ? 'bg-ember-500/15 text-ember-400' : 'text-ink-500 group-hover:text-ink-300'
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
              </span>
              <span
                className={cn(
                  'text-[10px] font-semibold tracking-wide transition-colors',
                  isActive ? 'text-ember-400' : 'text-ink-500'
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
