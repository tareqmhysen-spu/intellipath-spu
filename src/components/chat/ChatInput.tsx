import { useState, KeyboardEvent } from 'react';
import { Send, Loader2, Mic, Paperclip } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguageStore } from '@/stores/languageStore';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { t } = useLanguageStore();

  const handleSend = () => {
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div 
      className="border-t border-border/50 bg-background/80 backdrop-blur-xl p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mx-auto max-w-3xl">
        <motion.div 
          className={cn(
            "relative flex items-end gap-2 rounded-2xl border-2 bg-muted/30 p-2 transition-all duration-300",
            isFocused 
              ? "border-secondary/50 shadow-glow bg-background/50" 
              : "border-border/50"
          )}
          animate={isFocused ? {
            boxShadow: '0 0 20px hsl(172 66% 40% / 0.2)',
          } : {
            boxShadow: '0 0 0px transparent',
          }}
        >
          {/* Action buttons */}
          <div className="flex items-center gap-1 pb-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/10"
              disabled={isLoading || disabled}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Input */}
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={t('اسأل المستشار الذكي أي سؤال أكاديمي...', 'Ask the AI advisor any academic question...')}
              className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent pr-4 pl-4 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
              disabled={isLoading || disabled}
              rows={1}
            />
          </div>

          {/* Send button */}
          <div className="flex items-center gap-1 pb-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/10"
              disabled={isLoading || disabled}
            >
              <Mic className="h-4 w-4" />
            </Button>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || disabled}
                className={cn(
                  "h-10 w-10 rounded-xl transition-all duration-300",
                  input.trim() 
                    ? "bg-gradient-to-br from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 shadow-glow" 
                    : "bg-muted text-muted-foreground"
                )}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5 rtl:scale-x-[-1]" />
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Hint text */}
        <p className="text-center text-xs text-muted-foreground/60 mt-2">
          {t(
            'اضغط Enter للإرسال، Shift+Enter لسطر جديد',
            'Press Enter to send, Shift+Enter for new line'
          )}
        </p>
      </div>
    </motion.div>
  );
}
