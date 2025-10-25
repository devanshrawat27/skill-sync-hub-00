import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  user_id: string;
  user_name: string;
  user_photo: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Profile {
  user_id: string;
  name: string;
  profile_photo: string | null;
}

export default function Messages() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  useEffect(() => {
    const userId = searchParams.get("user");
    if (userId && user) {
      setSelectedUser(userId);
    }
  }, [searchParams, user]);

  useEffect(() => {
    if (selectedUser && user) {
      loadMessages(selectedUser);
      markMessagesAsRead(selectedUser);
    }
  }, [selectedUser, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as Message;
            
            // Update conversations list
            loadConversations();
            
            // If message is from currently selected user, add to messages
            if (selectedUser === newMsg.sender_id) {
              setMessages((prev) => [...prev, newMsg]);
              markMessagesAsRead(newMsg.sender_id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUser]);

  const checkAuthAndLoadData = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      navigate("/auth");
      return;
    }

    setUser(currentUser);
    await loadConversations();
    setLoading(false);
  };

  const loadConversations = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (!currentUser) return;

    // Get all messages where user is sender or receiver
    const { data: messagesData, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading conversations:", error);
      return;
    }

    // Group by conversation partner
    const conversationMap = new Map<string, Message[]>();
    messagesData?.forEach((msg) => {
      const partnerId =
        msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, []);
      }
      conversationMap.get(partnerId)!.push(msg);
    });

    // Get profiles for all partners
    const partnerIds = Array.from(conversationMap.keys());
    if (partnerIds.length === 0) {
      setConversations([]);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, profile_photo")
      .in("user_id", partnerIds);

    // Build conversations list
    const convos: Conversation[] = [];
    conversationMap.forEach((msgs, partnerId) => {
      const profile = profiles?.find((p) => p.user_id === partnerId);
      const lastMsg = msgs[0];
      const unreadCount = msgs.filter(
        (m) => m.receiver_id === currentUser.id && !m.is_read
      ).length;

      convos.push({
        user_id: partnerId,
        user_name: profile?.name || "Unknown User",
        user_photo: profile?.profile_photo || null,
        last_message: lastMsg.content,
        last_message_time: lastMsg.created_at,
        unread_count: unreadCount,
      });
    });

    // Sort by most recent
    convos.sort(
      (a, b) =>
        new Date(b.last_message_time).getTime() -
        new Date(a.last_message_time).getTime()
    );

    setConversations(convos);
  };

  const loadMessages = async (partnerId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
      return;
    }

    setMessages(data || []);
  };

  const markMessagesAsRead = async (senderId: string) => {
    if (!user) return;

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", user.id)
      .eq("sender_id", senderId)
      .eq("is_read", false);

    // Refresh conversations to update unread count
    loadConversations();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !user) return;

    setSending(true);

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: selectedUser,
      content: newMessage.trim(),
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
      loadConversations();
      loadMessages(selectedUser);
    }

    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSelectedUserProfile = (): Profile | null => {
    const convo = conversations.find((c) => c.user_id === selectedUser);
    if (!convo) return null;
    return {
      user_id: convo.user_id,
      name: convo.user_name,
      profile_photo: convo.user_photo,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedProfile = getSelectedUserProfile();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-20">
        <Card className="h-[calc(100vh-12rem)] flex flex-col md:flex-row overflow-hidden">
          {/* Conversations Sidebar */}
          <div className="w-full md:w-80 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </h2>
            </div>
            
            <ScrollArea className="flex-1">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">
                    Connect with users to start chatting
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {conversations.map((convo) => (
                    <button
                      key={convo.user_id}
                      onClick={() => setSelectedUser(convo.user_id)}
                      className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                        selectedUser === convo.user_id ? "bg-accent" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={convo.user_photo || undefined} />
                          <AvatarFallback>
                            {convo.user_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold truncate">
                              {convo.user_name}
                            </h3>
                            {convo.unread_count > 0 && (
                              <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {convo.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {convo.last_message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(convo.last_message_time), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedUser && selectedProfile ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedProfile.profile_photo || undefined} />
                    <AvatarFallback>
                      {selectedProfile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold">{selectedProfile.name}</h3>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isSent = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isSent
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm break-words">{msg.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isSent
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {formatDistanceToNow(new Date(msg.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}