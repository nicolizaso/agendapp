import React from 'react';
import * as Icons from 'lucide-react';

export const AVAILABLE_ICONS = [
  'Home', 'Briefcase', 'Dumbbell', 'HeartPulse', 'GraduationCap', 'Sprout',
  'Users', 'Heart', 'Cake', 'MoreHorizontal', 'Car', 'Plane', 'ShoppingCart',
  'Coffee', 'Zap', 'Star', 'Music', 'Book', 'Laptop', 'Smartphone', 'Sun',
  'Moon', 'Cloud', 'Umbrella', 'Camera', 'Video', 'Scissors', 'Key', 'Lock',
  'Unlock', 'Settings', 'Bell', 'Calendar', 'Clock', 'Mail', 'MessageSquare',
  'Phone', 'CreditCard', 'Wallet', 'Gift', 'Tag', 'MapPin', 'Compass'
];

export const AVAILABLE_COLORS = [
  { name: 'Púrpura', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/50', ring: 'ring-purple-400' },
  { name: 'Naranja', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/50', ring: 'ring-orange-400' },
  { name: 'Verde', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/50', ring: 'ring-green-400' },
  { name: 'Azul', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/50', ring: 'ring-blue-400' },
  { name: 'Índigo', color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/50', ring: 'ring-indigo-400' },
  { name: 'Rojo', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/50', ring: 'ring-red-400' },
  { name: 'Amarillo', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/50', ring: 'ring-yellow-400' },
  { name: 'Cian', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/50', ring: 'ring-cyan-400' },
  { name: 'Rosa', color: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/50', ring: 'ring-pink-400' },
  { name: 'Piedra', color: 'text-stone-400', bg: 'bg-stone-400/10', border: 'border-stone-400/50', ring: 'ring-stone-400' },
  { name: 'Esmeralda', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/50', ring: 'ring-emerald-400' },
  { name: 'Lima', color: 'text-lime-400', bg: 'bg-lime-400/10', border: 'border-lime-400/50', ring: 'ring-lime-400' },
  { name: 'Violeta', color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/50', ring: 'ring-violet-400' },
  { name: 'Rosa Fuerte', color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/50', ring: 'ring-rose-400' }
];

interface IconResolverProps {
  iconName: string;
  className?: string;
  size?: number | string;
}

export function IconResolver({ iconName, className, size = 24 }: IconResolverProps) {
  // @ts-ignore
  const IconComponent = Icons[iconName as keyof typeof Icons];

  if (!IconComponent) {
    const FallbackIcon = Icons['Circle'];
    return React.createElement(FallbackIcon as React.ElementType, { className, size });
  }

  return React.createElement(IconComponent as React.ElementType, { className, size });
}

export function getIconComponent(iconName: string): React.ComponentType<any> {
    // @ts-ignore
    const IconComponent = Icons[iconName] as React.ComponentType<any>;
    if (!IconComponent) return Icons['Circle'] as React.ComponentType<any>;
    return IconComponent;
}
