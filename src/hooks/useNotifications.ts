import { useCallback, useState } from 'react';

export const getNotificationMessage = (category: string | undefined): string => {
  switch (category) {
    case 'gym':
      return "Ponete las pilas, anda.";
    case 'cultivo':
      return "Ojo de amo engorda el ganado 🌱. A cuidar esas plantas.";
    case 'trabajo':
      return "Modo enfoque activado 💼.";
    case 'facultad':
      return "A estudiar 📚. Silencia el celular.";
    case 'salud':
      return "Tu cuerpo te lo agradece.";
    case 'casa':
      return "Cuida la casa 🔧";
    case 'amigos':
      return "Lleva churrito";
    case 'cumpleanos':
      return "🎂 No te olvides de saludar.";
    case 'otros':
      return "Deja de procrastinar.";
    default:
      return "Tienes una tarea pendiente 🔔.";
  }
};

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;

    // Only ask if default (not denied or granted yet)
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  }, []);

  const sendNotification = useCallback(
    (title: string, body: string, taskId: number | string) => {
      if (typeof Notification === 'undefined') return;
      if (permission !== 'granted') return;

      // Check for vibration support
      const vibratePattern = [200, 100, 200];
      // @ts-ignore - Check for vibration support explicitly
      const vibrate = (typeof navigator.vibrate === 'function') ? vibratePattern : undefined;

      const options = {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: String(taskId),
        vibrate: vibrate
      };

      new Notification(title, options as NotificationOptions);
    },
    [permission]
  );

  return { permission, requestPermission, sendNotification };
}
