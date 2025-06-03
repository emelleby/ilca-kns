"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { deleteOrganization } from "./functions";

interface DeleteOrganizationDialogProps {
  organization: {
    id: string;
    name: string;
    memberCount: number;
  };
  trigger?: React.ReactNode;
}

export default function DeleteOrganizationDialog({
  organization,
  trigger
}: DeleteOrganizationDialogProps) {
  const [isClient, setIsClient] = useState(false);
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate confirmation text
    if (confirmationText !== organization.name) {
      toast.error("Please type the organization name exactly to confirm deletion");
      return;
    }

    setIsDeleting(true);

    try {
      // Call server function directly
      const result = await deleteOrganization(organization.id);

      if (result.success) {
        // Reset form and close dialog
        setConfirmationText("");
        setOpen(false);

        const memberMessage = (typeof result.memberCount === "number" && result.memberCount > 0)
          ? ` ${result.memberCount} member${result.memberCount === 1 ? '' : 's'} have been withdrawn from the organization.`
          : "";

        toast.success(`Organization "${organization.name}" deleted successfully!${memberMessage}`);
      } else {
        toast.error(result.error || "Failed to delete organization. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast.error("Failed to delete organization. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (value: string) => {
    setConfirmationText(value);
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm">
      <Trash2 className="h-4 w-4" />
      <span className="sr-only">Delete organization</span>
    </Button>
  );

  if (!isClient) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleDelete}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <DialogTitle className="text-red-600">Delete Organization</DialogTitle>
            </div>
            <DialogDescription>
              You are about to permanently delete <strong>"{organization.name}"</strong>.
              {organization.memberCount > 0 && (
                <span className="text-amber-600 font-medium block mt-2">
                  ⚠️ This organization has {organization.memberCount} member{organization.memberCount === 1 ? '' : 's'}.
                  All members will be withdrawn from the organization but will remain as users in the system.
                </span>
              )}
              <span className="text-red-600 font-medium block mt-2">
                This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="confirmation" className="text-sm font-medium">
                Type the organization name to confirm deletion:
              </label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={organization.name}
                disabled={isDeleting}
                required
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Expected: <span className="font-mono font-medium">{organization.name}</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isDeleting || confirmationText !== organization.name}
            >
              {isDeleting ? "Deleting..." : "Delete Organization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
