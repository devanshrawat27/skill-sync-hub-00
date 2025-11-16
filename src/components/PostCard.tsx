import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    image_url: string | null;
    created_at: string;
    profiles: {
      name: string;
      profile_photo: string | null;
      profile_photo_visible: boolean | null;
    };
  };
  currentUserId?: string;
}

const PostCard = ({ post, currentUserId }: PostCardProps) => {
  const isOwnProfile = currentUserId === post.profiles?.name; // This should use user_id comparison
  const showPhoto = post.profiles?.profile_photo_visible || isOwnProfile;
  
  return (
    <Card className="glass-card p-6 mb-4">
      <div className="flex items-start gap-4">
        <Avatar className="w-12 h-12">
          <AvatarImage 
            src={showPhoto ? post.profiles?.profile_photo || undefined : undefined} 
          />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
            {post.profiles?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{post.profiles?.name || "Unknown User"}</h3>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
          
          <p className="text-foreground/90 whitespace-pre-wrap mb-3">
            {post.content}
          </p>
          
          {post.image_url && (
            <img 
              src={post.image_url} 
              alt="Post content" 
              className="w-full rounded-lg max-h-[500px] object-cover"
            />
          )}
        </div>
      </div>
    </Card>
  );
};

export default PostCard;