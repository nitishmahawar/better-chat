import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/orpc/client";
import { toast } from "sonner";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Spinner } from "./ui/spinner";

interface DeleteConversationDialogProps {
  conversationId: string;
  conversationTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteConversationDialog = ({
  conversationId,
  conversationTitle,
  open,
  onOpenChange,
}: DeleteConversationDialogProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams({ strict: false });
  const isCurrentConversation = id === conversationId;

  const deleteMutation = useMutation(
    orpc.conversations.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.conversations.list.key(),
        });
        toast.success("Conversation deleted");
        onOpenChange(false);

        // If we're deleting the current conversation, navigate to home
        if (isCurrentConversation) {
          navigate({ to: "/" });
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete conversation");
      },
    })
  );

  const handleDelete = () => {
    deleteMutation.mutate({ id: conversationId });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the conversation "
            <span className="font-semibold">{conversationTitle}</span>" and all
            its messages. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && <Spinner />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
