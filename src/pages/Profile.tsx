import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    department: "",
    year: "",
    bio: "",
    domain: "",
    github_url: "",
    linkedin_url: "",
    leetcode_url: "",
    codeforces_url: "",
    portfolio_url: "",
    skills: "",
    interests: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

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

    if (data) {
      setProfile({
        name: data.name || "",
        email: data.email || "",
        department: data.department || "",
        year: data.year?.toString() || "",
        bio: data.bio || "",
        domain: data.domain || "",
        github_url: data.github_url || "",
        linkedin_url: data.linkedin_url || "",
        leetcode_url: data.leetcode_url || "",
        codeforces_url: data.codeforces_url || "",
        portfolio_url: data.portfolio_url || "",
        skills: data.skills?.join(", ") || "",
        interests: data.interests?.join(", ") || "",
      });
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const skillsArray = profile.skills.split(",").map(s => s.trim()).filter(s => s);
    const interestsArray = profile.interests.split(",").map(s => s.trim()).filter(s => s);

    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name,
        department: profile.department,
        year: profile.year ? parseInt(profile.year) : null,
        bio: profile.bio,
        domain: profile.domain,
        github_url: profile.github_url,
        linkedin_url: profile.linkedin_url,
        leetcode_url: profile.leetcode_url,
        codeforces_url: profile.codeforces_url,
        portfolio_url: profile.portfolio_url,
        skills: skillsArray,
        interests: interestsArray,
      })
      .eq("user_id", session.user.id);

    if (error) {
      toast.error("Error saving profile");
      setSaving(false);
      return;
    }

    toast.success("Profile updated successfully!");
    setSaving(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Edit Profile</h1>
            <p className="text-muted-foreground">Update your information to help teammates find you</p>
          </div>

          <Card className="glass-card p-8">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={profile.email}
                    disabled
                    className="mt-2 bg-muted"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="department">Department/Branch</Label>
                  <Input
                    id="department"
                    name="department"
                    value={profile.department}
                    onChange={handleChange}
                    placeholder="Computer Science"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    value={profile.year}
                    onChange={handleChange}
                    placeholder="2"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="domain">Domain/Interest Area</Label>
                <Input
                  id="domain"
                  name="domain"
                  value={profile.domain}
                  onChange={handleChange}
                  placeholder="Web Development, AI/ML, etc."
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input
                  id="skills"
                  name="skills"
                  value={profile.skills}
                  onChange={handleChange}
                  placeholder="React, Python, Machine Learning"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="interests">Interests (comma-separated)</Label>
                <Input
                  id="interests"
                  name="interests"
                  value={profile.interests}
                  onChange={handleChange}
                  placeholder="Web Dev, Data Science, Robotics"
                  className="mt-2"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Social Links</h3>
                
                <div>
                  <Label htmlFor="github_url">GitHub URL</Label>
                  <Input
                    id="github_url"
                    name="github_url"
                    value={profile.github_url}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    name="linkedin_url"
                    value={profile.linkedin_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="leetcode_url">LeetCode URL</Label>
                  <Input
                    id="leetcode_url"
                    name="leetcode_url"
                    value={profile.leetcode_url}
                    onChange={handleChange}
                    placeholder="https://leetcode.com/username"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="codeforces_url">Codeforces URL</Label>
                  <Input
                    id="codeforces_url"
                    name="codeforces_url"
                    value={profile.codeforces_url}
                    onChange={handleChange}
                    placeholder="https://codeforces.com/profile/username"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="portfolio_url">Portfolio URL</Label>
                  <Input
                    id="portfolio_url"
                    name="portfolio_url"
                    value={profile.portfolio_url}
                    onChange={handleChange}
                    placeholder="https://yourportfolio.com"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-primary to-accent text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  onClick={() => navigate("/dashboard")}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;