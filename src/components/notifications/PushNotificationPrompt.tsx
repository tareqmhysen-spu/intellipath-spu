import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useLanguageStore } from '@/stores/languageStore';
import { motion, AnimatePresence } from 'framer-motion';

export const PushNotificationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { permission, isSupported, requestPermission } = usePushNotifications();
  const { t } = useLanguageStore();

  useEffect(() => {
    // Show prompt after 3 seconds if not already granted/denied
    const timer = setTimeout(() => {
      if (isSupported && permission === 'default') {
        const dismissed = localStorage.getItem('push-notification-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isSupported, permission]);

  const handleEnable = async () => {
    await requestPermission();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('push-notification-dismissed', 'true');
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        >
          <Card className="border-primary/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">
                    {t('تفعيل الإشعارات', 'Enable Notifications')}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t(
                      'احصل على تنبيهات فورية للمواعيد والتحديثات المهمة',
                      'Get instant alerts for deadlines and important updates'
                    )}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={handleEnable}>
                      {t('تفعيل', 'Enable')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleDismiss}>
                      {t('لاحقاً', 'Later')}
                    </Button>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
