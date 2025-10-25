import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserX, Users, Clock, Check, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Connection {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_profile?: any;
  receiver_profile?: any;
}

const Connections = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [sentRequests, setSentRequests] = useState<Connection[]>([]);
  const [acceptedConnections, setAcceptedConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndLoadConnections();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('connections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections'
        },
        () => {
          loadConnections(currentUserId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAuthAndLoadConnections = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setCurrentUserId(session.user.id);
    await loadConnections(session.user.id);
  };

  const loadConnections = async (userId: string) => {
    if (!userId) return;
    
    // Load pending requests (received)
    const { data: pending } = await supabase
      .from("connections")
      .select(`
        *,
        sender_profile:profiles!connections_sender_id_fkey(*)
      `)
      .eq("receiver_id", userId)
      .eq("status", "pending");

    // Load sent requests
    const { data: sent } = await supabase
      .from("connections")
      .select(`
        *,
        receiver_profile:profiles!connections_receiver_id_fkey(*)
      `)
      .eq("sender_id", userId)
      .eq("status", "pending");

    // Load accepted connections
    const { data: accepted } = await supabase
      .from("connections")
      .select(`
        *,
        sender_profile:profiles!connections_sender_id_fkey(*),
        receiver_profile:profiles!connections_receiver_id_fkey(*)
      `)
      .eq("status", "accepted")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    setPendingRequests(pending || []);
    setSentRequests(sent || []);
    setAcceptedConnections(accepted || []);
    setLoading(false);
  };

  const handleAccept = async (connectionId: string) => {
    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("id", connectionId);

    if (error) {
      toast.error("Error accepting connection");
      return;
    }

    toast.success("Connection accepted!");
    await loadConnections(currentUserId);
  };

  const handleReject = async (connectionId: string) => {
    const { error } = await supabase
      .from("connections")
      .update({ status: "rejected" })
      .eq("id", connectionId);

    if (error) {
      toast.error("Error rejecting connection");
      return;
    }

    toast.success("Connection rejected");
    await loadConnections(currentUserId);
  };

  const handleCancelRequest = async (connectionId: string) => {
    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("id", connectionId);

    if (error) {
      toast.error("Error canceling request");
      return;
    }

    toast.success("Request canceled");
    await loadConnections(currentUserId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Connections</h1>
            <p className="text-muted-foreground">Manage your network and connection requests</p>
          </div>

          <Tabs defaultValue="connections" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="connections">
                <Users className="w-4 h-4 mr-2" />
                Connections ({acceptedConnections.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                <Clock className="w-4 h-4 mr-2" />
                Requests ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="sent">
                <UserCheck className="w-4 h-4 mr-2" />
                Sent ({sentRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="connections">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {acceptedConnections.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-lg">No connections yet</p>
                    <Button 
                      onClick={() => navigate("/find-teammates")}
                      className="mt-4"
                    >
                      Find Teammates
                    </Button>
                  </div>
                ) : (
                  acceptedConnections.map((connection) => {
                    const profile = connection.sender_id === currentUserId 
                      ? connection.receiver_profile 
                      : connection.sender_profile;
                    
                    return (
                      <Card key={connection.id} className="glass-card p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold">
                            {profile?.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">{profile?.name || "Unknown User"}</h3>
                            {profile?.department && (
                              <p className="text-sm text-muted-foreground">{profile.department}</p>
                            )}
                          </div>
                        </div>
                        {profile?.skills && profile.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {profile.skills.slice(0, 3).map((skill: string, idx: number) => (
                              <Badge key={idx} variant="secondary">{skill}</Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/profile?user=${profile?.user_id}`)}
                          >
                            View Profile
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/messages?user=${profile?.user_id}`)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="pending">
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-lg">No pending requests</p>
                  </div>
                ) : (
                  pendingRequests.map((request) => (
                    <Card key={request.id} className="glass-card p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                            {request.sender_profile?.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <h3 className="font-semibold">{request.sender_profile?.name || "Unknown User"}</h3>
                            {request.sender_profile?.department && (
                              <p className="text-sm text-muted-foreground">{request.sender_profile.department}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleAccept(request.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button 
                            onClick={() => handleReject(request.id)}
                            size="sm"
                            variant="destructive"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="sent">
              <div className="space-y-4">
                {sentRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-lg">No sent requests</p>
                  </div>
                ) : (
                  sentRequests.map((request) => (
                    <Card key={request.id} className="glass-card p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                            {request.receiver_profile?.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <h3 className="font-semibold">{request.receiver_profile?.name || "Unknown User"}</h3>
                            {request.receiver_profile?.department && (
                              <p className="text-sm text-muted-foreground">{request.receiver_profile.department}</p>
                            )}
                            <Badge variant="outline" className="mt-1">Pending</Badge>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleCancelRequest(request.id)}
                          size="sm"
                          variant="outline"
                        >
                          Cancel Request
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Connections;
