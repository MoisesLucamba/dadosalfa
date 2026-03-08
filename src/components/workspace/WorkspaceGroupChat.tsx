import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Trash2, Edit, MessageSquare, MoreVertical, Paperclip, FileText, Image, X } from "lucide-react";
import { useWorkspaceMessages } from "@/hooks/useWorkspaceChat";
import { useWorkspaceMembers } from "@/hooks/useWorkspaces";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
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
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ name: string; url: string; type: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ficheiro demasiado grande (máx. 10MB)");
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${workspaceId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('workspace-files')
        .getPublicUrl(path);

      setPendingFile({
        name: file.name,
        url: urlData.publicUrl,
        type: file.type.startsWith('image/') ? 'image' : 'file',
      });
    } catch (err) {
      console.error('Upload error:', err);
      toast.error("Erro ao fazer upload do ficheiro");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    let content = newMessage.trim();
    
    if (pendingFile) {
      const fileMsg = pendingFile.type === 'image'
        ? `📷 [${pendingFile.name}](${pendingFile.url})`
        : `📎 [${pendingFile.name}](${pendingFile.url})`;
      content = content ? `${content}\n${fileMsg}` : fileMsg;
    }

    if (!content) return;

    await sendMessage.mutateAsync({ content });
    setNewMessage("");
    setPendingFile(null);
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

  const isFileMessage = (content: string) => {
    return content.includes('📎 [') || content.includes('📷 [');
  };

  const renderMessageContent = (content: string) => {
    // Parse file/image links
    const parts = content.split('\n');
    return parts.map((part, i) => {
      const fileMatch = part.match(/^(📎|📷)\s+\[(.+?)\]\((.+?)\)$/);
      if (fileMatch) {
        const [, icon, name, url] = fileMatch;
        if (icon === '📷') {
          return (
            <div key={i} className="mt-1">
              <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                <img 
                  src={url} 
                  alt={name} 
                  className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-border"
                />
              </a>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">{name}</span>
            </div>
          );
        }
        return (
          <a 
            key={i} 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 mt-1 px-2 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-xs"
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{name}</span>
          </a>
        );
      }
      return part ? <span key={i}>{part}</span> : null;
    });
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
                        {isFileMessage(msg.content) 
                          ? renderMessageContent(msg.content)
                          : msg.content
                        }
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

        {/* Pending file preview */}
        {pendingFile && (
          <div className="px-4 py-2 border-t border-border bg-muted/30">
            <div className="flex items-center gap-2 text-sm">
              {pendingFile.type === 'image' ? (
                <Image className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-primary shrink-0" />
              )}
              <span className="truncate text-foreground">{pendingFile.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0"
                onClick={() => setPendingFile(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Paperclip className={`h-4 w-4 ${isUploading ? 'animate-spin' : ''}`} />
            </Button>
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
              disabled={(!newMessage.trim() && !pendingFile) || sendMessage.isPending}
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
