import {
  Dumbbell,
  Sprout,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Users,
  MoreHorizontal,
  Cake,
  Home
} from 'lucide-react';

export const CATEGORIES = [
  { id: 'casa', label: 'Casa', icon: Home, color: 'text-purple-400', border: 'border-purple-400/50', bg: 'bg-purple-400/10', ring: 'ring-purple-400' },
  { id: 'gym', label: 'Gym', icon: Dumbbell, color: 'text-orange-400', border: 'border-orange-400/50', bg: 'bg-orange-400/10', ring: 'ring-orange-400' },
  { id: 'cultivo', label: 'Cultivo', icon: Sprout, color: 'text-green-400', border: 'border-green-400/50', bg: 'bg-green-400/10', ring: 'ring-green-400' },
  { id: 'trabajo', label: 'Trabajo', icon: Briefcase, color: 'text-blue-400', border: 'border-blue-400/50', bg: 'bg-blue-400/10', ring: 'ring-blue-400' },
  { id: 'facultad', label: 'Facultad', icon: GraduationCap, color: 'text-indigo-400', border: 'border-indigo-400/50', bg: 'bg-indigo-400/10', ring: 'ring-indigo-400' },
  { id: 'salud', label: 'Salud', icon: HeartPulse, color: 'text-red-400', border: 'border-red-400/50', bg: 'bg-red-400/10', ring: 'ring-red-400' },
  { id: 'amigos', label: 'Amigos', icon: Users, color: 'text-yellow-400', border: 'border-yellow-400/50', bg: 'bg-yellow-400/10', ring: 'ring-yellow-400' },
  { id: 'cumpleanos', label: 'Cumpleaños', icon: Cake, color: 'text-pink-400', border: 'border-pink-400/50', bg: 'bg-pink-400/10', ring: 'ring-pink-400' },
  { id: 'otros', label: 'Otros', icon: MoreHorizontal, color: 'text-stone-400', border: 'border-stone-400/50', bg: 'bg-stone-400/10', ring: 'ring-stone-400' },
];
