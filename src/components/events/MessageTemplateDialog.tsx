"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { hasAuthLevel } from "@/lib/utils/auth-utils-client";
import { MessageSquare } from "lucide-react";

interface MessageTemplateDialogProps {
  eventId: string;
  eventTitle: string;
}

const TEMPLATES = {
  "Organizer friend": `Hey! It's Ben.  It's been a bit since we last connected. Hope you've been well.  You may or may not have heard, but I recently launched a project called Dance Chives to help organize dance events from our community.

I added your event [EVENT TITLE] to the site, with credit and links back to the original event and YouTube account.

[LINK HERE]

With your permission I would also like to download your IG posts for this event and others to give it an event poster and fill out the event information.

And if you'd rather it not be listed, just let me know and I'll happily take it down right away.

Thank you for your leadership and dedication the to dance scene 🙏`,
  "Organizer familiar": `Hey! It's Ben (Heartbreaker). It's been a bit since we last connected. Hope you've been well.

I wanted to share something I've been working on called Dance Chives. I built it as a way to support the work you do and help preserve the events, battles, and moments that shape our scene.

I added your event [EVENT TITLE] to our site, with credit and links back to the original event and YouTube account.

[LINK HERE]

With your permission I would also like to download your IG posts for this event and others to give it an event poster and fill out the event information.

And if you'd rather it not be listed, just let me know and I'll happily take it down right away.

Thank you for your leadership and dedication the to dance scene 🙏`,
  "Organizer new": `Hello! I'm Ben (Heartbreaker), founder of Dance Chives, a community archive that highlights street dance events, battle footage, and the people who make them happen.

I added your event [EVENT TITLE] to our site, with credit and links back to the original event and YouTube account.

[LINK HERE]

With your permission I would also like to download your IG posts for this event and others to give it an event poster and fill out the event information.

If you'd rather it not be listed, just let me know and I'll happily take it down right away.

Thank you for your leadership and dedication to the dance scene 🙏`,
  "Videographer familiar": `Hey! It's Ben (Heartbreaker). It's been a bit since we last connected. Hope you've been well.

I wanted to share something I've been working on called Dance Chives. I built it as a way to support the work you do and help preserve the events, battles, and moments that shape our scene.

I added your event footage [EVENT TITLE] to Dance Chives, with credit and links back to the original event and YouTube account.

[LINK HERE]

Totally optional but if you'd like, you can:
And if you'd rather it not be listed, just let me know and I'll happily take it down right away.

Thank you for your leadership and dedication the to dance scene 🙏`,
  "Videographer new": `Hello! I'm Ben (Heartbreaker), founder of Dance Chives, a community archive that highlights street dance events, battle footage, and the people who make them happen.

I wanted to share something I've been working on called Dance Chives. I built it as a way to support the work you do and help preserve the events, battles, and moments that shape our scene.

I added your event footage [EVENT TITLE] to Dance Chives, with credit and links back to the original event and YouTube account.

[LINK HERE]

And if you'd rather it not be listed, just let me know and I'll happily take it down right away.

Thank you for your leadership and dedication the to dance scene 🙏`,
} as const;

type TemplateKey = keyof typeof TEMPLATES;

export function MessageTemplateDialog({
  eventId,
  eventTitle,
}: MessageTemplateDialogProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<TemplateKey | null>(null);

  // Only show for super admins
  if (!hasAuthLevel(session, AUTH_LEVELS.SUPER_ADMIN)) {
    return null;
  }

  const handleCopyTemplate = async (templateKey: TemplateKey) => {
    const template = TEMPLATES[templateKey];
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://www.dancechives.com";
    const isVideographer =
      templateKey === "Videographer familiar" ||
      templateKey === "Videographer new";
    const eventUrl = isVideographer
      ? `${baseUrl}/watch/${eventId}`
      : `${baseUrl}/events/${eventId}`;

    const finalTemplate = template
      .replace(/\[EVENT TITLE\]/g, eventTitle)
      .replace(/\[LINK HERE\]/g, eventUrl);

    try {
      await navigator.clipboard.writeText(finalTemplate);
      setCopied(templateKey);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-periwinkle text-black border-black">
          <MessageSquare className="h-4 w-4 mr-2" />
          Message template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Message Templates</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {Object.keys(TEMPLATES).map((key) => {
            const templateKey = key as TemplateKey;
            return (
              <Button
                key={templateKey}
                onClick={() => handleCopyTemplate(templateKey)}
                className="bg-secondary text-white justify-center"
              >
                {copied === templateKey ? "✓ Copied!" : templateKey}
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
