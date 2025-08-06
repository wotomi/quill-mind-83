import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles,
  FileText,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService, AIAgentRequest } from "@/services/api";

interface ChatPanelProps {
  selectedFile: string | null;
}

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  fileContext?: string;
  loading?: boolean;
}

export const ChatPanel = ({ selectedFile }: ChatPanelProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        type: "ai",
        content: "Hello! I'm your AI assistant. I can help you with writing, editing, and improving your markdown documents. How can I assist you today?",
        timestamp: new Date(),
      }]);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
      fileContext: selectedFile || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage("");
    setIsLoading(true);

    try {
      const agentRequest: AIAgentRequest = {
        message: currentMessage,
        filename: selectedFile || undefined,
        action_type: 'analyze'
      };

      const response = await apiService.aiAgentAction(agentRequest);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: response.response,
        timestamp: new Date(),
        fileContext: selectedFile || undefined
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast({
        title: "AI Error",
        description: error instanceof Error ? error.message : "Failed to get AI response",
        variant: "destructive",
      });

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: "ai",
        content: "I apologize, but I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date(),
        fileContext: selectedFile || undefined
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-card flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-panel-border bg-panel-header flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-ai flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">AI Assistant</span>
        </div>
        
        {selectedFile && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="w-3 h-3" />
            {selectedFile}
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.type === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.type === "ai" && (
                <Avatar className="w-8 h-8 bg-gradient-ai">
                  <AvatarFallback className="bg-transparent">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={cn(
                "max-w-[85%] rounded-lg p-3 space-y-2",
                msg.type === "user" 
                  ? "bg-primary text-primary-foreground ml-auto" 
                  : "bg-secondary text-secondary-foreground"
              )}>
                {msg.fileContext && (
                  <div className="flex items-center gap-1 text-xs opacity-70">
                    <FileText className="w-3 h-3" />
                    {msg.fileContext}
                  </div>
                )}
                
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>

                {msg.type === "ai" && (
                  <div className="flex items-center gap-1 pt-1">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs opacity-60 hover:opacity-100">
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-60 hover:opacity-100">
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-60 hover:opacity-100">
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {msg.type === "user" && (
                <Avatar className="w-8 h-8 bg-muted">
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-panel-border">
        <div className="flex gap-2">
            <Input
              placeholder="Ask AI about your document..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              disabled={isLoading}
              className="flex-1 bg-background border-border"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              size="sm"
              className="bg-gradient-ai hover:opacity-90"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
        </div>
        
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3" />
          AI can make mistakes. Verify important information.
        </div>
      </div>
    </div>
  );
};