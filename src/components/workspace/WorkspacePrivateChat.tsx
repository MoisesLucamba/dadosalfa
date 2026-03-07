import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Lock, ArrowLeft, MessageSquare } from "lucide-react";
import { usePrivateMessages, useUnreadCounts } from "@/hooks/useWorkspaceChat";
import { useWorkspaceMembers, WorkspaceMember } from "@/hooks/useWorkspaces";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface WorkspacePrivateChatProps {
  workspaceId: string;
}

export const WorkspacePrivateChat = ({ workspaceId }: WorkspacePrivateChatProps) => {
  const { user } = useAuth();
  const { members } = useWorkspaceMembers(workspaceId);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { messages, isLoading, sendPrivateMessage, markAsRead } = usePrivateMessages(workspaceId, selectedUserId);
  const { unreadCounts } = useUnreadCounts(workspaceId);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const otherMembers = members?.filter(m => m.user_id !== user?.id) || [];

  const getMemberName = (userId: string) => {
    const member = members?.find(m => m.user_id === userId);
    return member?.profile?.contact_name || `Utilizador ${userId.slice(0, 6)}`;
  };

  const getInitials = (userId: string) => {
    return getMemberName(userId).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedUserId) markAsRead();
  }, [selectedUserId, messages, markAsRead]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await sendPrivateMessage.mutateAsync(newMessage);
    setNewMessage("");
  };

  if (!selectedUserId) {
    return (
      <Card className="bg-card border-border h-[600px] flex flex-col">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Mensagens Privadas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4">
          {otherMembers.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Sem outros membros neste workspace.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {otherMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedUserId(member.user_id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {getInitials(member.user_id)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{getMemberName(member.user_id)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                  </div>
                  {unreadCounts[member.user_id] > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-[10px] rounded-full px-2">
                      {unreadCounts[member.user_id]}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border h-[600px] flex flex-col">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedUserId(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {getInitials(selectedUserId)}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-base">{getMemberName(selectedUserId)}</CardTitle>
          <Lock className="h-3 w-3 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <p className="text-center text-muted-foreground text-sm py-8">A carregar...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Nenhuma mensagem. Diga olá!</p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className={`text-[10px] font-bold ${isOwn ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {getInitials(msg.sender_id)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[70%]`}>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(msg.created_at), "HH:mm", { locale: pt })}
                    </span>
                    <div className={`inline-block px-3 py-2 rounded-2xl text-sm ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              placeholder="Mensagem privada..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              className="rounded-xl"
              disabled={sendPrivateMessage.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sendPrivateMessage.isPending}
              size="icon"
              className="rounded-xl shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
