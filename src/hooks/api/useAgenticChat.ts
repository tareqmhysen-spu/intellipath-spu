import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: Source[];
  toolCalls?: ToolCall[];
  timestamp: Date;
}

interface Source {
  code: string;
  name: string;
  department: string;
  score: number;
}

interface ToolCall {
  name: string;
  result: any;
}

interface StudentContext {
  gpa?: number;
  department?: string;
  year_level?: number;
  credits_completed?: number;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agentic-chat`;
const RAG_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-query`;

export function useAgenticChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentThought, setCurrentThought] = useState<string>('');
  const [toolResults, setToolResults] = useState<ToolCall[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const { user } = useAuthStore();

  const sendMessage = useCallback(async (
    input: string,
    options?: {
      mode?: 'agentic' | 'rag' | 'simple';
      studentContext?: StudentContext;
      conversationId?: string;
    }
  ) => {
    const mode = options?.mode || 'agentic';
    const url = mode === 'rag' ? RAG_URL : CHAT_URL;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsStreaming(true);
    setCurrentThought('');
    setToolResults([]);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Get current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })).concat([
            { role: 'user', content: input }
          ]),
          mode,
          student_context: options?.studentContext,
          conversation_id: options?.conversationId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          toast({
            title: 'تم تجاوز الحد المسموح',
            description: 'يرجى المحاولة لاحقاً',
            variant: 'destructive',
          });
          throw new Error('Rate limit exceeded');
        }
        
        if (response.status === 402) {
          toast({
            title: 'رصيد غير كافٍ',
            description: 'يرجى إضافة رصيد لاستخدام الذكاء الاصطناعي',
            variant: 'destructive',
          });
          throw new Error('Payment required');
        }

        throw new Error(errorData.error || 'Failed to send message');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let sources: Source[] = [];
      const tools: ToolCall[] = [];
      const assistantMessageId = (Date.now() + 1).toString();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);

              // Handle tool results
              if (data.type === 'tool_result') {
                tools.push({ name: data.tool, result: data.result });
                setToolResults([...tools]);
                setCurrentThought(`تنفيذ أداة: ${data.tool}`);
              }
              // Handle sources
              else if (data.type === 'sources') {
                sources = data.sources;
              }
              // Handle content
              else if (data.content) {
                assistantContent += data.content;
                
                // Update thoughts based on content markers
                if (data.content.includes('[PLAN]')) {
                  setCurrentThought('التخطيط...');
                } else if (data.content.includes('[EXECUTE]')) {
                  setCurrentThought('التنفيذ...');
                } else if (data.content.includes('[REFLECT]')) {
                  setCurrentThought('المراجعة...');
                } else if (data.content.includes('[ANSWER]')) {
                  setCurrentThought('');
                }
                
                // Update assistant message
                setMessages(prev => {
                  const existing = prev.find(m => m.id === assistantMessageId);
                  if (existing) {
                    return prev.map(m =>
                      m.id === assistantMessageId
                        ? { ...m, content: assistantContent, sources, toolCalls: tools }
                        : m
                    );
                  }
                  return [
                    ...prev,
                    {
                      id: assistantMessageId,
                      role: 'assistant',
                      content: assistantContent,
                      sources,
                      toolCalls: tools,
                      timestamp: new Date(),
                    },
                  ];
                });
              }
              // Handle standard OpenAI format
              else if (data.choices?.[0]?.delta?.content) {
                assistantContent += data.choices[0].delta.content;
                
                setMessages(prev => {
                  const existing = prev.find(m => m.id === assistantMessageId);
                  if (existing) {
                    return prev.map(m =>
                      m.id === assistantMessageId
                        ? { ...m, content: assistantContent }
                        : m
                    );
                  }
                  return [
                    ...prev,
                    {
                      id: assistantMessageId,
                      role: 'assistant',
                      content: assistantContent,
                      timestamp: new Date(),
                    },
                  ];
                });
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      setCurrentThought('');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Chat error:', error);
        toast({
          title: 'خطأ',
          description: error.message || 'حدث خطأ أثناء الإرسال',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages, toast]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setToolResults([]);
    setCurrentThought('');
  }, []);

  const setInitialMessages = useCallback((msgs: Message[]) => {
    setMessages(msgs);
  }, []);

  return {
    messages,
    isLoading,
    isStreaming,
    currentThought,
    toolResults,
    sendMessage,
    stopGeneration,
    clearMessages,
    setInitialMessages,
  };
}
