import { motion } from 'framer-motion';
import { Bot, User, Copy, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const { language } = useLanguageStore();
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group flex gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <motion.div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md',
          isUser
            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
            : 'bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground'
        )}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <motion.div
            animate={isStreaming ? {
              rotate: [0, 10, -10, 0],
            } : {}}
            transition={{ duration: 0.5, repeat: isStreaming ? Infinity : 0 }}
          >
            <Sparkles className="h-4 w-4" />
          </motion.div>
        )}
      </motion.div>

      {/* Message */}
      <div className="flex flex-col gap-1 max-w-[80%]">
        <motion.div
          className={cn(
            'relative rounded-2xl px-4 py-3 shadow-sm',
            isUser
              ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-sm'
              : 'glass-dark rounded-tl-sm'
          )}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {/* Glow effect for assistant */}
          {!isUser && (
            <div className="absolute inset-0 rounded-2xl rounded-tl-sm bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />
          )}
          
          <div className={cn(
            "prose prose-sm max-w-none relative",
            isUser ? "prose-invert" : "dark:prose-invert"
          )}>
            {isUser ? (
              <p className="m-0 whitespace-pre-wrap">{content}</p>
            ) : (
              <ReactMarkdown
                skipHtml={true}
                unwrapDisallowed={true}
                allowedElements={['p', 'ul', 'ol', 'li', 'code', 'pre', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'a', 'blockquote', 'br']}
                components={{
                  p: ({ children }) => <p className="m-0 mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="my-2 list-disc pr-4 rtl:pl-4 rtl:pr-0">{children}</ul>,
                  ol: ({ children }) => <ol className="my-2 list-decimal pr-4 rtl:pl-4 rtl:pr-0">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  code: ({ children }) => (
                    <code className="rounded bg-muted/50 px-1.5 py-0.5 text-sm font-mono">{children}</code>
                  ),
                  pre: ({ children }) => (
                    <pre className="my-2 overflow-x-auto rounded-lg bg-muted/30 p-3 backdrop-blur-sm">{children}</pre>
                  ),
                  strong: ({ children }) => <strong className="font-semibold text-secondary">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                  h4: ({ children }) => <h4 className="text-sm font-semibold mb-1">{children}</h4>,
                  a: ({ href, children }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary underline hover:no-underline"
                    >
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-r-2 rtl:border-r-0 rtl:border-l-2 border-secondary/50 pr-3 rtl:pr-0 rtl:pl-3 my-2 italic text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>
          
          {/* Streaming indicator */}
          {isStreaming && (
            <motion.div 
              className="flex gap-1 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-2 w-2 rounded-full bg-secondary"
                  animate={{
                    y: [0, -6, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
        
        {/* Copy button - only for assistant messages with content */}
        {!isUser && content && !isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 ml-1" />
                  <span>تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 ml-1" />
                  <span>نسخ</span>
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
