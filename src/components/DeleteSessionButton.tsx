"use client";

import { Trash2Icon } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const DeleteSessionButton = ({ sessionId }: { sessionId: string }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/session?id=${sessionId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        toast.success("Event deleted");
        router.push("/events");
      } else {
        console.error(response.statusText);
        toast.error("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      className="cursor-pointer"
      variant="destructive"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <Trash2Icon className="w-4 h-4" />
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  );
};
