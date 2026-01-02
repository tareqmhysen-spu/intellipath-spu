import { motion } from 'framer-motion';
import { MessageSquare, Plus, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguageStore } from '@/stores/languageStore';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ChatSidebarProps) {
  const { t } = useLanguageStore();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t('اليوم', 'Today');
    if (diffDays === 1) return t('أمس', 'Yesterday');
    if (diffDays < 7) return t(`منذ ${diffDays} أيام`, `${diffDays} days ago`);
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-full w-64 flex-col border-l border-border bg-card rtl:border-l-0 rtl:border-r">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="font-semibold text-foreground">
          {t('المحادثات', 'Conversations')}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewConversation}
          className="h-8 w-8"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {conversations.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t('لا توجد محادثات', 'No conversations')}
            </div>
          ) : (
            conversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  'group flex items-center gap-2 rounded-lg p-2 transition-colors',
                  currentConversationId === conversation.id
                    ? 'bg-accent'
                    : 'hover:bg-muted'
                )}
              >
                <button
                  onClick={() => onSelectConversation(conversation.id)}
                  className="flex flex-1 items-center gap-2 text-right rtl:text-right ltr:text-left"
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-foreground">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(conversation.updated_at)}
                    </p>
                  </div>
                </button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onDeleteConversation(conversation.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="ml-2 h-4 w-4 rtl:ml-0 rtl:mr-2" />
                      {t('حذف', 'Delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
