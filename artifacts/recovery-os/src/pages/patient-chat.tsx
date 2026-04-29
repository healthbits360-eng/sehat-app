import { useState, useRef, useEffect } from "react";
import { useListMyChatMessages, useSendMyChatMessage, getListMyChatMessagesQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useT } from "@/lib/i18n";

export default function PatientChat() {
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useListMyChatMessages();
  const sendMessage = useSendMyChatMessage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useT();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessage.isPending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;

    const content = input.trim();
    setInput("");

    try {
      await sendMessage.mutateAsync({ data: { content, language } });
      queryClient.invalidateQueries({ queryKey: getListMyChatMessagesQueryKey() });
    } catch (e: any) {
      if (e?.status === 402) {
        toast({
          title: "Upgrade Required",
          description: "You've hit your free limit for chat messages. Upgrade in Settings.",
          variant: "destructive",
          action: <Button variant="outline" size="sm" asChild><Link href="/settings">Upgrade</Link></Button>
        });
      } else {
        toast({ title: "Failed to send message", variant: "destructive" });
      }
      setInput(content); // restore input
    }
  };

  if (isLoading) {
    return <div className="h-[calc(100vh-8rem)] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] flex flex-col max-w-4xl mx-auto pb-4">
      <div className="mb-4">
        <h1 className="font-serif text-3xl font-bold text-foreground">Recovery Assistant</h1>
        <p className="text-muted-foreground mt-1">Ask questions about your plan, exercises, or recovery.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden bg-background border-2 shadow-sm relative">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
              <Sparkles className="h-12 w-12 text-primary mb-4" />
              <p className="text-lg">I'm your Clinical AI Assistant.</p>
              <p className="text-sm">How is your recovery progressing today?</p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className={`h-8 w-8 shrink-0 ${isUser ? 'border border-primary/20' : 'bg-primary/10 text-primary'}`}>
                      {isUser ? (
                        <>
                          <AvatarImage src={user?.profileImageUrl || ""} />
                          <AvatarFallback>{user?.firstName?.[0] || "U"}</AvatarFallback>
                        </>
                      ) : (
                        <AvatarFallback className="bg-transparent"><Sparkles className="h-4 w-4" /></AvatarFallback>
                      )}
                    </Avatar>
                    <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm ${isUser ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              {sendMessage.isPending && (
                <div className="flex gap-3 flex-row">
                  <Avatar className="h-8 w-8 shrink-0 bg-primary/10 text-primary">
                    <AvatarFallback className="bg-transparent"><Sparkles className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div className="px-4 py-3 rounded-2xl bg-muted rounded-tl-sm flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-card/50 backdrop-blur-sm">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-full px-6 bg-background"
              disabled={sendMessage.isPending}
            />
            <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!input.trim() || sendMessage.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
