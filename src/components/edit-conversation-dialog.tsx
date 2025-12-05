import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/orpc/client";
import { toast } from "sonner";
import { Spinner } from "./ui/spinner";

interface EditConversationDialogProps {
  conversationId: string;
  currentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditConversationDialog = ({
  conversationId,
  currentTitle,
  open,
  onOpenChange,
}: EditConversationDialogProps) => {
  const [title, setTitle] = useState(currentTitle);
  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    orpc.conversations.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.conversations.list.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.conversations.get.key({
            input: { id: conversationId },
          }),
        });
        toast.success("Conversation title updated");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update conversation");
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    updateMutation.mutate({ id: conversationId, title });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Conversation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter conversation title"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Spinner />}
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
