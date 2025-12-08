import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Link, Mail, Users, Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string().trim().email("Please enter a valid email address").max(255);
interface ShareScriptProps {
  scriptId: string;
}

export const ShareScript = ({ scriptId }: ShareScriptProps) => {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateShareLink = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to share scripts.",
          variant: "destructive",
        });
        return;
      }

      // Generate share token using the database function
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_share_token');

      if (tokenError) throw tokenError;

      // Update script with share token and make it public
      const { error: updateError } = await supabase
        .from('scripts')
        .update({ 
          share_token: tokenData,
          is_public: true 
        })
        .eq('id', scriptId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setShareToken(tokenData);

      toast({
        title: "Share link generated!",
        description: "Anyone with this link can view your script.",
      });
    } catch (error) {
      console.error("Share link error:", error);
      toast({
        title: "Failed to generate link",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyShareLink = () => {
    if (!shareToken) return;
    const link = `${window.location.origin}/shared/${shareToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Link copied!",
      description: "Share link copied to clipboard.",
    });
  };

  const inviteCollaborator = async () => {
    const trimmedEmail = collaboratorEmail.trim().toLowerCase();
    
    if (!trimmedEmail) {
      toast({
        title: "Email required",
        description: "Please enter a collaborator email.",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailResult = emailSchema.safeParse(trimmedEmail);
    if (!emailResult.success) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Note: We cannot look up users by email from the client side for security reasons.
      // Instead, use an invitation system where collaborators accept via email link.
      // For now, show a message explaining this limitation.
      toast({
        title: "Feature limitation",
        description: "Please share the script link directly with your collaborator instead.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not process request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Script</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Public Link */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              <h4 className="font-semibold">Public Link</h4>
            </div>
            {shareToken ? (
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/shared/${shareToken}`}
                  readOnly
                  className="text-sm"
                />
                <Button onClick={copyShareLink} size="icon" variant="outline">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <Button onClick={generateShareLink} variant="outline" className="w-full">
                <Link className="w-4 h-4 mr-2" />
                Generate Share Link
              </Button>
            )}
          </Card>

          {/* Invite Collaborator */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <h4 className="font-semibold">Invite Collaborator</h4>
            </div>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="collaborator@example.com"
                value={collaboratorEmail}
                onChange={(e) => setCollaboratorEmail(e.target.value)}
              />
              <Select value={permission} onValueChange={(v: any) => setPermission(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="edit">Can Edit</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={inviteCollaborator} className="w-full gradient-btn">
                <Mail className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
