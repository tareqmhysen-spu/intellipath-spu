import { useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguageStore } from '@/stores/languageStore';
import { useMessages } from '@/hooks/useMessages';
import { useToast } from '@/hooks/use-toast';
import { 
  Inbox, Send, Mail, Plus, User, Clock, Check, CheckCheck,
  MessageSquare, Search
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function Messages() {
  const { language } = useLanguageStore();
  const { toast } = useToast();
  const { inbox, sent, advisors, unreadCount, isLoading, sendMessage, markAsRead } = useMessages();
  const isRTL = language === 'ar';

  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [newMessage, setNewMessage] = useState({
    receiver_id: '',
    subject: '',
    content: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  const handleSend = async () => {
    if (!newMessage.receiver_id || !newMessage.content.trim()) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      await sendMessage.mutateAsync(newMessage);
      toast({
        title: isRTL ? 'تم الإرسال' : 'Sent',
        description: isRTL ? 'تم إرسال الرسالة بنجاح' : 'Message sent successfully'
      });
      setShowCompose(false);
      setNewMessage({ receiver_id: '', subject: '', content: '' });
    } catch (error) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل إرسال الرسالة' : 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const handleOpenMessage = async (message: any) => {
    setSelectedMessage(message);
    if (!message.is_read && message.receiver_id === message.receiver_id) {
      await markAsRead.mutateAsync(message.id);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPp', { locale: isRTL ? ar : enUS });
  };

  const texts = {
    title: isRTL ? 'الرسائل' : 'Messages',
    inbox: isRTL ? 'البريد الوارد' : 'Inbox',
    sent: isRTL ? 'المرسلة' : 'Sent',
    compose: isRTL ? 'رسالة جديدة' : 'New Message',
    to: isRTL ? 'إلى' : 'To',
    subject: isRTL ? 'الموضوع' : 'Subject',
    message: isRTL ? 'الرسالة' : 'Message',
    send: isRTL ? 'إرسال' : 'Send',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    noMessages: isRTL ? 'لا توجد رسائل' : 'No messages',
    search: isRTL ? 'بحث...' : 'Search...',
    selectAdvisor: isRTL ? 'اختر المشرف' : 'Select advisor',
    from: isRTL ? 'من' : 'From',
  };

  const filteredInbox = inbox.filter(m => 
    m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sender?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSent = sent.filter(m =>
    m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.receiver?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="h-7 w-7 text-primary" />
              {texts.title}
            </h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="mt-2">
                {unreadCount} {isRTL ? 'غير مقروءة' : 'unread'}
              </Badge>
            )}
          </div>
          <Dialog open={showCompose} onOpenChange={setShowCompose}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {texts.compose}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{texts.compose}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{texts.to}</label>
                  <Select 
                    value={newMessage.receiver_id} 
                    onValueChange={(v) => setNewMessage(prev => ({ ...prev, receiver_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={texts.selectAdvisor} />
                    </SelectTrigger>
                    <SelectContent>
                      {advisors.map((advisor: any) => (
                        <SelectItem key={advisor.user_id} value={advisor.user_id}>
                          {advisor.full_name} ({advisor.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{texts.subject}</label>
                  <Input
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder={texts.subject}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{texts.message}</label>
                  <Textarea
                    value={newMessage.content}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                    placeholder={texts.message}
                    rows={5}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCompose(false)}>
                    {texts.cancel}
                  </Button>
                  <Button onClick={handleSend} disabled={sendMessage.isPending} className="gap-2">
                    <Send className="h-4 w-4" />
                    {texts.send}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={texts.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="h-4 w-4" />
              {texts.inbox}
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ms-1">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Send className="h-4 w-4" />
              {texts.sent}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-3">
            {isLoading ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent></Card>
            ) : filteredInbox.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {texts.noMessages}
                </CardContent>
              </Card>
            ) : (
              filteredInbox.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${!message.is_read ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => handleOpenMessage(message)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-full bg-primary/10 shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium truncate ${!message.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {message.sender?.full_name || 'Unknown'}
                              </span>
                              {!message.is_read && (
                                <Badge variant="default" className="text-xs">
                                  {isRTL ? 'جديد' : 'New'}
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm truncate ${!message.is_read ? 'font-medium' : ''}`}>
                              {message.subject || (isRTL ? 'بدون موضوع' : 'No subject')}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{message.content}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                          <Clock className="h-3 w-3" />
                          {formatDate(message.created_at)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-3">
            {filteredSent.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {texts.noMessages}
                </CardContent>
              </Card>
            ) : (
              filteredSent.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card 
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => setSelectedMessage(message)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-full bg-muted shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-muted-foreground">
                              {isRTL ? 'إلى: ' : 'To: '}{message.receiver?.full_name || 'Unknown'}
                            </span>
                            <p className="text-sm truncate">
                              {message.subject || (isRTL ? 'بدون موضوع' : 'No subject')}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{message.content}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                          {message.is_read ? (
                            <CheckCheck className="h-3 w-3 text-primary" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          {formatDate(message.created_at)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Message Detail Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {selectedMessage?.subject || (isRTL ? 'بدون موضوع' : 'No subject')}
              </DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>
                    {texts.from}: {selectedMessage.sender?.full_name || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(selectedMessage.created_at)}</span>
                </div>
                <div className="border-t pt-4">
                  <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
