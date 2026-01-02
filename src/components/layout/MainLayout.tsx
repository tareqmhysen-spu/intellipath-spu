import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Navbar } from './Navbar';
import { MobileNavigation } from './MobileNavigation';
import { PushNotificationPrompt } from '@/components/notifications/PushNotificationPrompt';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <Navbar />
          <main className="flex-1 overflow-auto pb-20 md:pb-0">
            {children}
          </main>
          <MobileNavigation />
        </div>
      </div>
      <PushNotificationPrompt />
    </SidebarProvider>
  );
}
