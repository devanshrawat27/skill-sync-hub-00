import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreatePostDialogProps {
  onPostCreated: () => void;
}

const CreatePostDialog = ({ onPostCreated }: CreatePostDialogProps) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!content.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    setPosting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to post");
        return;
      }

      let imageUrl = null;

      // Upload image if exists
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(fileName, image);

        if (uploadError) {
          toast.error("Error uploading image");
          setPosting(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post_images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Create post
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: session.user.id,
          content,
          image_url: imageUrl
        });

      if (error) {
        toast.error("Error creating post");
        setPosting(false);
        return;
      }

      toast.success("Post created successfully!");
      setContent("");
      setImage(null);
      setImagePreview(null);
      setOpen(false);
      onPostCreated();
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-primary to-accent text-white font-medium glow-hover">
          <Send className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          
          {imagePreview && (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full rounded-lg max-h-[300px] object-cover"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
              >
                Remove
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="post-image"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <label htmlFor="post-image">
                <Button variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <ImagePlus className="w-4 h-4 mr-2" />
                    Add Image
                  </span>
                </Button>
              </label>
            </div>

            <Button 
              onClick={handlePost} 
              disabled={posting || !content.trim()}
              className="bg-gradient-to-r from-primary to-accent text-white"
            >
              {posting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;