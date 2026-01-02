import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useLanguageStore } from '@/stores/languageStore';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  descriptionAr: string;
  action: () => void;
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage } = useLanguageStore();
  const isRTL = language === 'ar';

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'd',
      ctrl: true,
      description: 'Go to Dashboard',
      descriptionAr: 'الذهاب للوحة التحكم',
      action: () => navigate('/dashboard')
    },
    {
      key: 'c',
      ctrl: true,
      shift: true,
      description: 'Open AI Chat',
      descriptionAr: 'فتح المحادثة الذكية',
      action: () => navigate('/chat')
    },
    {
      key: 'k',
      ctrl: true,
      description: 'Open Courses',
      descriptionAr: 'فتح المقررات',
      action: () => navigate('/courses')
    },
    {
      key: 'a',
      ctrl: true,
      shift: true,
      description: 'Open Achievements',
      descriptionAr: 'فتح الإنجازات',
      action: () => navigate('/achievements')
    },
    {
      key: 'm',
      ctrl: true,
      description: 'Open Messages',
      descriptionAr: 'فتح الرسائل',
      action: () => navigate('/messages')
    },
    {
      key: 'l',
      ctrl: true,
      shift: true,
      description: 'Toggle Language',
      descriptionAr: 'تبديل اللغة',
      action: () => setLanguage(language === 'ar' ? 'en' : 'ar')
    },
    {
      key: '/',
      ctrl: true,
      description: 'Show Shortcuts Help',
      descriptionAr: 'عرض اختصارات لوحة المفاتيح',
      action: () => {
        toast({
          title: isRTL ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts',
          description: isRTL 
            ? 'Ctrl+D: لوحة التحكم | Ctrl+Shift+C: الدردشة | Ctrl+K: المقررات | Ctrl+M: الرسائل'
            : 'Ctrl+D: Dashboard | Ctrl+Shift+C: Chat | Ctrl+K: Courses | Ctrl+M: Messages',
        });
      }
    },
    {
      key: 'Escape',
      description: 'Go Back',
      descriptionAr: 'العودة',
      action: () => navigate(-1)
    }
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
};
