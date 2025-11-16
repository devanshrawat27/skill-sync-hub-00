import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfilePhotoManagerProps {
  profilePhoto: string | null;
  profilePhotoVisible: boolean;
  userName: string;
  userId: string;
  onPhotoUpdate: () => void;
}

const ProfilePhotoManager = ({ 
  profilePhoto, 
  profilePhotoVisible, 
  userName,
  userId,
  onPhotoUpdate 
}: ProfilePhotoManagerProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/profile.${fileExt}`;

      // Delete old photo if exists
      if (profilePhoto) {
        const oldPath = profilePhoto.split('/').slice(-2).join('/');
        await supabase.storage
          .from('profile_photos')
          .remove([oldPath]);
      }

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from('profile_photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        toast.error("Error uploading photo");
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile_photos')
        .getPublicUrl(fileName);

      // Update profile with new photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo: publicUrl })
        .eq('user_id', userId);

      if (updateError) {
        toast.error("Error updating profile");
        return;
      }

      toast.success("Profile photo updated!");
      onPhotoUpdate();
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!profilePhoto) return;

    try {
      const photoPath = profilePhoto.split('/').slice(-2).join('/');
      
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('profile_photos')
        .remove([photoPath]);

      if (deleteError) {
        toast.error("Error deleting photo");
        return;
      }

      // Update profile to remove photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo: null })
        .eq('user_id', userId);

      if (updateError) {
        toast.error("Error updating profile");
        return;
      }

      toast.success("Profile photo deleted");
      onPhotoUpdate();
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleVisibilityToggle = async (visible: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ profile_photo_visible: visible })
        .eq('user_id', userId);

      if (error) {
        toast.error("Error updating visibility");
        return;
      }

      toast.success(visible ? "Photo is now visible" : "Photo is now hidden from others");
      onPhotoUpdate();
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  return (
    <Card className="glass-card p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">Profile Photo</h2>
      
      <div className="flex items-center gap-6 mb-6">
        <Avatar className="w-24 h-24">
          <AvatarImage src={profilePhoto || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl">
            {userName?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          <input
            type="file"
            id="profile-photo-upload"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <label htmlFor="profile-photo-upload">
            <Button variant="outline" size="sm" asChild disabled={uploading}>
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {profilePhoto ? "Replace Photo" : "Upload Photo"}
              </span>
            </Button>
          </label>

          {profilePhoto && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Photo
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <Label htmlFor="photo-visibility" className="text-base font-medium">
            Hide my photo from others
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            When enabled, others will see a default avatar instead of your photo
          </p>
        </div>
        <Switch
          id="photo-visibility"
          checked={!profilePhotoVisible}
          onCheckedChange={(checked) => handleVisibilityToggle(!checked)}
        />
      </div>
    </Card>
  );
};

export default ProfilePhotoManager;