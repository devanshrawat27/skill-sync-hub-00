import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User, Search, Github, Linkedin, Code } from "lucide-react";
import { toast } from "sonner";

const FindTeammates = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    checkAuthAndLoadProfiles();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = profiles.filter(profile => 
        profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.skills?.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProfiles(filtered);
    } else {
      setFilteredProfiles(profiles);
    }
  }, [searchTerm, profiles]);

  const checkAuthAndLoadProfiles = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setCurrentUserId(session.user.id);

    // Fetch all profiles except current user
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("user_id", session.user.id);

    if (error) {
      toast.error("Error loading profiles");
      setLoading(false);
      return;
    }

    setProfiles(data || []);
    setFilteredProfiles(data || []);
    setLoading(false);
  };

  const handleConnect = async (userId: string) => {
    const { error } = await supabase
      .from("connections")
      .insert({
        sender_id: currentUserId,
        receiver_id: userId,
        status: "pending"
      });

    if (error) {
      toast.error("Error sending connection request");
      return;
    }

    toast.success("Connection request sent!");
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
            <h1 className="text-4xl font-bold mb-2">Find Teammates</h1>
            <p className="text-muted-foreground">Connect with students who share your interests and skills</p>
          </div>

          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by name, skills, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-lg">No teammates found. Try adjusting your search.</p>
              </div>
            ) : (
              filteredProfiles.map((profile) => (
                <Card key={profile.id} className="glass-card p-6 hover:scale-105 transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                      {profile.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{profile.name || "Unknown User"}</h3>
                      {profile.department && (
                        <p className="text-sm text-muted-foreground">{profile.department}</p>
                      )}
                      {profile.year && (
                        <p className="text-sm text-muted-foreground">Year {profile.year}</p>
                      )}
                    </div>
                  </div>

                  {profile.bio && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{profile.bio}</p>
                  )}

                  {profile.domain && (
                    <div className="mb-4">
                      <span className="text-xs font-semibold text-muted-foreground">Domain:</span>
                      <Badge className="ml-2">{profile.domain}</Badge>
                    </div>
                  )}

                  {profile.skills && profile.skills.length > 0 && (
                    <div className="mb-4">
                      <span className="text-xs font-semibold text-muted-foreground block mb-2">Skills:</span>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.slice(0, 3).map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{skill}</Badge>
                        ))}
                        {profile.skills.length > 3 && (
                          <Badge variant="outline">+{profile.skills.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mb-4">
                    {profile.github_url && (
                      <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Github className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {profile.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Linkedin className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {profile.leetcode_url && (
                      <a href={profile.leetcode_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Code className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>

                  <Button 
                    onClick={() => handleConnect(profile.user_id)}
                    className="w-full bg-gradient-to-r from-primary to-accent text-white"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FindTeammates;