import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

export const usePushNotifications = () => {
  const { user } = useAuthStore();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        dir: document.documentElement.dir as NotificationDirection || 'auto',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
      
      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [isSupported, permission]);

  const notifyImportant = useCallback((
    titleAr: string, 
    titleEn: string, 
    bodyAr?: string, 
    bodyEn?: string
  ) => {
    const isArabic = document.documentElement.lang === 'ar';
    sendNotification(
      isArabic ? titleAr : titleEn,
      { body: isArabic ? bodyAr : bodyEn }
    );
  }, [sendNotification]);

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    notifyImportant,
    isEnabled: permission === 'granted',
  };
};
