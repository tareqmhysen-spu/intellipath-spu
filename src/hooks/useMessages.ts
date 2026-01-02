import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { usePushNotifications } from './usePushNotifications';
import { useLanguageStore } from '@/stores/languageStore';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    email: string;
  };
  receiver?: {
    full_name: string;
    email: string;
  };
}

interface SendMessageData {
  receiver_id: string;
  subject?: string;
  content: string;
}

export const useMessages = () => {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const { notifyImportant, isEnabled } = usePushNotifications();
  const queryClient = useQueryClient();

  // Fetch all messages (sent and received)
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: async (): Promise<Message[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch sender/receiver profiles
      const userIds = new Set<string>();
      data?.forEach(msg => {
        userIds.add(msg.sender_id);
        userIds.add(msg.receiver_id);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      return (data || []).map(msg => ({
        ...msg,
        sender: profileMap.get(msg.sender_id),
        receiver: profileMap.get(msg.receiver_id)
      })) as Message[];
    },
    enabled: !!user?.id,
  });

  // Realtime subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('New message received:', payload);
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          
          // Send push notification for new message
          if (isEnabled && payload.new) {
            const newMessage = payload.new as any;
            
            // Get sender name
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', newMessage.sender_id)
              .single();
            
            const senderName = senderProfile?.full_name || 'Unknown';
            const isAr = language === 'ar';
            
            notifyImportant(
              `📨 رسالة جديدة من ${senderName}`,
              `📨 New message from ${senderName}`,
              newMessage.subject || (isAr ? 'رسالة جديدة' : 'New message'),
              newMessage.subject || 'New message'
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, isEnabled, language, notifyImportant]);

  // Send a new message
  const sendMessage = useMutation({
    mutationFn: async (data: SendMessageData) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: data.receiver_id,
          subject: data.subject || null,
          content: data.content,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  // Mark message as read
  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  // Get advisors list for messaging
  const { data: advisors = [] } = useQuery({
    queryKey: ['advisors'],
    queryFn: async () => {
      const { data: advisorRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['advisor', 'admin']);

      if (!advisorRoles?.length) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', advisorRoles.map(r => r.user_id));

      return profiles || [];
    },
  });

  const inbox = messages.filter(m => m.receiver_id === user?.id);
  const sent = messages.filter(m => m.sender_id === user?.id);
  const unreadCount = inbox.filter(m => !m.is_read).length;

  return {
    messages,
    inbox,
    sent,
    unreadCount,
    advisors,
    isLoading,
    sendMessage,
    markAsRead,
  };
};
