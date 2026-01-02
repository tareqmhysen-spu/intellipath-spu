import { useState, useCallback } from 'react';
import { chatApi } from '@/api';
import type { ChatQueryRequest, ChatQueryResponse, Conversation, Message } from '@/api/types';
import { useToast } from '@/hooks/use-toast';

export function useIntelliPathChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();

  const sendQuery = useCallback(async (query: string, options?: Partial<ChatQueryRequest>) => {
    setIsLoading(true);
    try {
      const response = await chatApi.query({
        query,
        conversation_id: currentConversation?.id,
        ...options,
      });
      
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'user', content: query, created_at: new Date().toISOString() },
        { id: (Date.now() + 1).toString(), role: 'assistant', content: response.answer, created_at: new Date().toISOString(), sources: response.sources },
      ]);
      
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إرسال الاستفسار',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation, toast]);

  const sendSmartQuery = useCallback(async (query: string, options?: Partial<ChatQueryRequest>) => {
    setIsLoading(true);
    try {
      const response = await chatApi.smartQuery({
        query,
        conversation_id: currentConversation?.id,
        ...options,
      });
      
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'user', content: query, created_at: new Date().toISOString() },
        { id: (Date.now() + 1).toString(), role: 'assistant', content: response.answer, created_at: new Date().toISOString(), sources: response.sources },
      ]);
      
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إرسال الاستفسار الذكي',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation, toast]);

  const streamAgenticQuery = useCallback(async function* (query: string, options?: Partial<ChatQueryRequest>) {
    setIsStreaming(true);
    try {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'user', content: query, created_at: new Date().toISOString() },
      ]);

      let fullResponse = '';
      const assistantMessageId = (Date.now() + 1).toString();

      for await (const chunk of chatApi.streamAgenticQuery({
        query,
        conversation_id: currentConversation?.id,
        ...options,
      })) {
        fullResponse += chunk;
        
        setMessages(prev => {
          const existing = prev.find(m => m.id === assistantMessageId);
          if (existing) {
            return prev.map(m => 
              m.id === assistantMessageId 
                ? { ...m, content: fullResponse }
                : m
            );
          }
          return [
            ...prev,
            { id: assistantMessageId, role: 'assistant', content: fullResponse, created_at: new Date().toISOString() },
          ];
        });

        yield chunk;
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في البث',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsStreaming(false);
    }
  }, [currentConversation, toast]);

  const loadConversations = useCallback(async () => {
    try {
      const response = await chatApi.listConversations();
      setConversations(response.items);
      return response.items;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل المحادثات',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await chatApi.getMessages(conversationId);
      setMessages(response.items);
      return response.items;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الرسائل',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  const createConversation = useCallback(async (title?: string) => {
    try {
      const conversation = await chatApi.createConversation(title);
      setConversations(prev => [conversation, ...prev]);
      setCurrentConversation(conversation);
      setMessages([]);
      return conversation;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء محادثة جديدة',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await chatApi.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف المحادثة',
        variant: 'destructive',
      });
      throw error;
    }
  }, [currentConversation, toast]);

  const selectConversation = useCallback(async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    await loadMessages(conversation.id);
  }, [loadMessages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentConversation(null);
  }, []);

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isStreaming,
    sendQuery,
    sendSmartQuery,
    streamAgenticQuery,
    loadConversations,
    loadMessages,
    createConversation,
    deleteConversation,
    selectConversation,
    clearMessages,
  };
}
