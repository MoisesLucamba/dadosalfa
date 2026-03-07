import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Trash2, Edit, MessageSquare, MoreVertical } from "lucide-react";
import { useWorkspaceMessages } from "@/hooks/useWorkspaceChat";
import { useWorkspaceMembers } from "@/hooks/useWorkspaces";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkspaceGroupChatProps {
  workspaceId: string;
}

export const WorkspaceGroupChat = ({ workspaceId }: WorkspaceGroupChatProps) => {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, deleteMessage, editMessage } = useWorkspaceMessages(workspaceId);
  const { members } = useWorkspaceMembers(workspaceId);
  const [newMessage, setNewMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const getMemberName = (userId: string) => {
    if (userId === user?.id) return "Você";
    const member = members?.find(m => m.user_id === userId);
    return member?.profile?.contact_name || `Utilizador ${userId.slice(0, 6)}`;
  };

  const getInitials = (userId: string) => {
    const name = getMemberName(userId);
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await sendMessage.mutateAsync({ content: newMessage });
    setNewMessage("");
  };

  const handleEdit = async (messageId: string) => {
    if (!editContent.trim()) return;
    await editMessage.mutateAsync({ messageId, content: editContent });
    setEditingId(null);
    setEditContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="bg-card border-border flex flex-col h-[600px]">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Chat do Grupo
          <Badge variant="secondary" className="text-[10px]">{members?.length || 0} membros</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <p className="text-center text-muted-foreground text-sm py-8">A carregar mensagens...</p>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda. Inicie a conversa!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.user_id === user?.id;
              return (
                <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className={`text-xs font-bold ${isOwn ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {getInitials(msg.user_id)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground">{getMemberName(msg.user_id)}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(msg.created_at), "HH:mm", { locale: pt })}
                      </span>
                      {msg.is_edited && <span className="text-[10px] text-muted-foreground">(editado)</span>}
                    </div>
                    {editingId === msg.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(msg.id); if (e.key === 'Escape') setEditingId(null); }}
                          className="text-sm rounded-lg"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleEdit(msg.id)}>OK</Button>
                      </div>
                    ) : (
                      <div className={`inline-block px-3 py-2 rounded-2xl text-sm ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                        {msg.content}
                      </div>
                    )}
                    {isOwn && editingId !== msg.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isOwn ? "end" : "start"} className="rounded-xl">
                          <DropdownMenuItem onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }}>
                            <Edit className="mr-2 h-3 w-3" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteMessage.mutate(msg.id)}>
                            <Trash2 className="mr-2 h-3 w-3" /> Apagar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              placeholder="Escreva uma mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="rounded-xl"
              disabled={sendMessage.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMessage.isPending}
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
