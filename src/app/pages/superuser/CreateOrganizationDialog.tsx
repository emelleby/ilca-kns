"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createOrganization } from "./functions";

interface CreateOrganizationDialogProps {
  trigger?: React.ReactNode;
}

export default function CreateOrganizationDialog({
  trigger
}: CreateOrganizationDialogProps) {
  const [isClient, setIsClient] = useState(false);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Call server function directly
      const result = await createOrganization(
        formData.name.trim(),
        formData.description.trim() || undefined
      );

      if (result) {
        // Reset form and close dialog
        setFormData({ name: "", description: "" });
        setOpen(false);

        toast.success("Organization created successfully!");

        // Delay reload to let user see the toast
        setTimeout(() => {
          window.location.reload();
        }, 1500); // 1.5 second delay
      } else {
        toast.error("Failed to create organization. Please try again.");
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Failed to create organization. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Create Organization
    </Button>
  );

  // Two-pass rendering to prevent hydration mismatches
  if (!isClient) {
    return (
      <Button disabled>
        <Plus className="mr-2 h-4 w-4" />
        Create Organization
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Add a new sailing organization to the system. You can assign administrators and manage members after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Organization Name *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Sailing Club Norway"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Brief description of the organization..."
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
