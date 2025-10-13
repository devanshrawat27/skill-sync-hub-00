import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Briefcase, Users, Bell } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    connections: 0,
    projects: 0,
    teamMembers: 0,
    notifications: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Fetch user profile
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      toast.error("Error loading profile");
      setLoading(false);
      return;
    }

    setProfile(data);

    // Load stats
    const [
      { count: connectionsCount },
      { count: projectsCount },
      { count: teamMembersCount },
      { count: notificationsCount }
    ] = await Promise.all([
      supabase.from("connections").select("*", { count: 'exact', head: true })
        .eq("status", "accepted")
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`),
      supabase.from("projects").select("*", { count: 'exact', head: true })
        .eq("creator_id", session.user.id),
      supabase.from("project_members").select("*", { count: 'exact', head: true })
        .eq("user_id", session.user.id)
        .eq("status", "accepted"),
      supabase.from("notifications").select("*", { count: 'exact', head: true })
        .eq("user_id", session.user.id)
        .eq("is_read", false)
    ]);

    setStats({
      connections: connectionsCount || 0,
      projects: projectsCount || 0,
      teamMembers: teamMembersCount || 0,
      notifications: notificationsCount || 0,
    });

    setLoading(false);
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
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Welcome back, {profile?.name}!</h1>
            <p className="text-muted-foreground">Here's what's happening with your projects and connections</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.connections}</div>
                  <div className="text-sm text-muted-foreground">Connections</div>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.projects}</div>
                  <div className="text-sm text-muted-foreground">Projects</div>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-highlight flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.teamMembers}</div>
                  <div className="text-sm text-muted-foreground">Team Members</div>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-highlight to-secondary flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.notifications}</div>
                  <div className="text-sm text-muted-foreground">Notifications</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
              <div className="space-y-4">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-2 font-medium">{profile?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="ml-2 font-medium">{profile?.email}</span>
                </div>
                {profile?.department && (
                  <div>
                    <span className="text-muted-foreground">Department:</span>
                    <span className="ml-2 font-medium">{profile.department}</span>
                  </div>
                )}
                <Button 
                  onClick={() => navigate("/profile")}
                  className="w-full bg-gradient-to-r from-primary to-accent text-white"
                >
                  Edit Profile
                </Button>
              </div>
            </Card>

            <Card className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate("/find-teammates")}
                  className="w-full justify-start" 
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Find Teammates
                </Button>
                <Button 
                  onClick={() => navigate("/projects/new")}
                  className="w-full justify-start" 
                  variant="outline"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Create New Project
                </Button>
                <Button 
                  onClick={() => navigate("/mentors")}
                  className="w-full justify-start" 
                  variant="outline"
                >
                  <User className="w-4 h-4 mr-2" />
                  Browse Mentors
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;