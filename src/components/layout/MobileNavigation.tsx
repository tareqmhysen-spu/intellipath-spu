import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  Network,
  Trophy,
  User,
} from 'lucide-react';
import { useLanguageStore } from '@/stores/languageStore';
import { cn } from '@/lib/utils';

const navItems = [
  {
    titleAr: 'الرئيسية',
    titleEn: 'Home',
    icon: LayoutDashboard,
    url: '/dashboard',
  },
  {
    titleAr: 'المستشار',
    titleEn: 'Chat',
    icon: MessageSquare,
    url: '/chat',
  },
  {
    titleAr: 'الخريطة',
    titleEn: 'Graph',
    icon: Network,
    url: '/knowledge-graph',
  },
  {
    titleAr: 'الإنجازات',
    titleEn: 'Awards',
    icon: Trophy,
    url: '/achievements',
  },
  {
    titleAr: 'حسابي',
    titleEn: 'Profile',
    icon: User,
    url: '/profile',
  },
];

export function MobileNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguageStore();

  const isActive = (url: string) => location.pathname === url;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item.url);
          return (
            <button
              key={item.url}
              onClick={() => navigate(item.url)}
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {active && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon className={cn('relative z-10 h-5 w-5', active && 'text-primary')} />
              <span className={cn('relative z-10 text-[10px] font-medium', active && 'text-primary')}>
                {t(item.titleAr, item.titleEn)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
