import { LayoutDashboard, ListTodo, Dumbbell, ShoppingBag, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'tasks', icon: ListTodo, label: 'Tareas' },
    { id: 'gym', icon: Dumbbell, label: 'Gym' },
    { id: 'shop', icon: ShoppingBag, label: 'Tienda' },
    { id: 'analytics', icon: BarChart3, label: 'Progreso' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/90 backdrop-blur-lg border-t border-neutral-800 pb-safe md:hidden">
      <div className="flex items-center justify-between px-2 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive ? "text-red-600" : "text-neutral-500 hover:text-neutral-400"
              )}
            >
              <Icon className={clsx("w-5 h-5", isActive && "fill-current/20")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
