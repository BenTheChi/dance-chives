"use client";

import { Section } from "@/types/event";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TagUserCircleButton } from "@/components/events/TagUserCircleButton";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  checkUserWinnerOfSection,
  checkUserJudgeOfSection,
  removeTagFromSection,
  removeJudgeFromSection,
} from "@/lib/server_actions/request_actions";
import {
  sectionTypeSupportsWinners,
  sectionTypeSupportsJudges,
} from "@/lib/utils/section-helpers";

interface DescriptionWinnerColumnsProps {
  section: Section;
  eventId: string;
  canTagDirectly: boolean;
  currentUserId?: string;
  canEdit?: boolean;
}

export function DescriptionWinnerColumns({
  section,
  eventId,
  canTagDirectly,
  currentUserId,
  canEdit = false,
}: DescriptionWinnerColumnsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUserWinner, setIsUserWinner] = useState(false);
  const [isUserJudge, setIsUserJudge] = useState(false);
  const [showWinners, setShowWinners] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{
    userId: string;
    displayName: string;
    role: "winner" | "judge";
  } | null>(null);

  const supportsWinners = sectionTypeSupportsWinners(section.sectionType);
  const supportsJudges = sectionTypeSupportsJudges(section.sectionType);

  // Check if current user is winner of section
  useEffect(() => {
    const checkWinnerStatus = async () => {
      if (currentUserId && section?.id && supportsWinners) {
        try {
          const isWinner = await checkUserWinnerOfSection(
            eventId,
            section.id,
            currentUserId
          );
          setIsUserWinner(isWinner);
        } catch (error) {
          console.error("Error checking winner status:", error);
          setIsUserWinner(false);
        }
      } else {
        setIsUserWinner(false);
      }
    };
    checkWinnerStatus();
  }, [currentUserId, section, eventId, supportsWinners]);

  // Check if current user is judge of section
  useEffect(() => {
    const checkJudgeStatus = async () => {
      if (currentUserId && section?.id && supportsJudges) {
        try {
          const isJudge = await checkUserJudgeOfSection(
            eventId,
            section.id,
            currentUserId
          );
          setIsUserJudge(isJudge);
        } catch (error) {
          console.error("Error checking judge status:", error);
          setIsUserJudge(false);
        }
      } else {
        setIsUserJudge(false);
      }
    };
    checkJudgeStatus();
  }, [currentUserId, section, eventId, supportsJudges]);

  const hasWinners = section.winners && section.winners.length > 0;
  const hasJudges = section.judges && section.judges.length > 0;

  const supportsBoth = supportsWinners || supportsJudges;
  const hasTaggedUsers = hasWinners || hasJudges;
  const hasDescription = !!section.description;

  // Determine if we should show winner/judge section
  // Show if section type supports it AND (there are tagged users OR current user exists to potentially tag themselves)
  // Hide if no users are tagged and no current user (can't tag themselves)
  const showWinnerJudgeSection =
    supportsBoth && (hasTaggedUsers || !!currentUserId);

  // Handler to remove winner tag from section
  const handleRemoveWinner = (userId: string) => {
    if (!currentUserId) return;

    startTransition(async () => {
      try {
        await removeTagFromSection(eventId, section.id, userId);
        toast.success("Winner tag removed successfully");
        router.refresh();
      } catch (error) {
        console.error("Error removing winner tag:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to remove tag. Please try again."
        );
      }
    });
  };

  // Handler to remove judge tag from section
  const handleRemoveJudge = (userId: string) => {
    if (!currentUserId) return;

    startTransition(async () => {
      try {
        await removeJudgeFromSection(eventId, section.id, userId);
        toast.success("Judge tag removed successfully");
        router.refresh();
      } catch (error) {
        console.error("Error removing judge tag:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to remove tag. Please try again."
        );
      }
    });
  };

  const confirmPendingRemoval = () => {
    if (!pendingRemoval) return;
    if (pendingRemoval.role === "winner") {
      handleRemoveWinner(pendingRemoval.userId);
    } else {
      handleRemoveJudge(pendingRemoval.userId);
    }
    setPendingRemoval(null);
  };

  // Determine column spans based on what's visible
  const showBoth = hasDescription && showWinnerJudgeSection;
  const colSpan = showBoth ? "col-span-6 sm:col-span-3" : "col-span-6";

  // Don't render anything if both sections are hidden
  if (!hasDescription && !showWinnerJudgeSection) {
    return null;
  }

  return (
    <div className="grid grid-cols-6 gap-4 w-full">
      {/* Description Column - only show if description exists */}
      {hasDescription && (
        <div
          className={`${colSpan} flex flex-col gap-2 p-4 bg-primary-dark rounded-sm border-2 border-primary-light`}
        >
          <h2 className="text-center mx-auto">Description</h2>
          <div className="text-sm whitespace-pre-wrap">
            {section.description}
          </div>
        </div>
      )}

      {/* Winner & Judge Column - only show if section type supports winners or judges and has tagged users or user can tag */}
      {showWinnerJudgeSection && (
        <>
          <div
            className={`${colSpan} flex flex-col gap-4 p-4 bg-primary-dark rounded-sm border-2 border-primary-light`}
          >
            {/* Winner Section */}
            {supportsWinners && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 justify-center items-center">
                  <h2>Winner</h2>
                  {currentUserId && section?.id && !isUserWinner && (
                    <TagUserCircleButton
                      eventId={eventId}
                      target="section"
                      targetId={section.id}
                      isUserTagged={isUserWinner}
                      dialogTitle={`Tag yourself as a winner of ${section.title}?`}
                      size="sm"
                      defaultRole="Winner"
                    />
                  )}
                </div>
                {hasWinners && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="link"
                        className="text-xs text-secondary hover:text-primary-light p-0 h-auto"
                        onClick={() => setShowWinners(!showWinners)}
                      >
                        {showWinners ? "hide" : "show"}
                      </Button>
                    </div>
                    {showWinners && (
                      <div className="flex flex-wrap gap-1 items-center justify-center">
                        {Array.from(
                          new Map(
                            section
                              .winners!.filter((w) => w && w.id)
                              .map((w) => [w.id, w])
                          ).values()
                        ).map((winner) => {
                          const winnerId = winner.id || winner.username;
                          const isWinnerSelf =
                            currentUserId &&
                            (currentUserId === winnerId ||
                              currentUserId === winner.id ||
                              currentUserId === winner.username);
                          const canRemove = !!(isWinnerSelf || canEdit);
                          return winner.username ? (
                            <UserAvatar
                              key={winner.id}
                              username={winner.username}
                              displayName={winner.displayName}
                              avatar={(winner as any).avatar}
                              image={(winner as any).image}
                              showHoverCard
                              city={(winner as any).city || ""}
                              styles={(winner as any).styles}
                              showRemoveButton={canRemove}
                              onRemove={() => {
                                setPendingRemoval({
                                  userId: winnerId,
                                  displayName:
                                    winner.displayName ||
                                    winner.username ||
                                    "this winner",
                                  role: "winner",
                                });
                              }}
                              isRemoving={isPending}
                            />
                          ) : (
                            <span key={winner.id}>{winner.displayName}</span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Judge Section */}
            {supportsJudges && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 justify-center items-center">
                  <h2>Judge</h2>
                  {currentUserId && section?.id && !isUserJudge && (
                    <TagUserCircleButton
                      eventId={eventId}
                      target="section"
                      targetId={section.id}
                      isUserTagged={isUserJudge}
                      dialogTitle={`Tag yourself as a judge of ${section.title}?`}
                      size="sm"
                      defaultRole="Judge"
                    />
                  )}
                </div>
                {hasJudges && (
                  <div className="flex flex-wrap gap-1 items-center justify-center">
                    {Array.from(
                      new Map(
                        section
                          .judges!.filter((j) => j && j.id)
                          .map((j) => [j.id, j])
                      ).values()
                    ).map((judge) => {
                      const judgeId = judge.id || judge.username;
                      const isJudgeSelf =
                        currentUserId &&
                        (currentUserId === judgeId ||
                          currentUserId === judge.id ||
                          currentUserId === judge.username);
                      const canRemove = !!(isJudgeSelf || canEdit);
                      return judge.username ? (
                        <UserAvatar
                          key={judge.id}
                          username={judge.username}
                          displayName={judge.displayName}
                          avatar={(judge as any).avatar}
                          image={(judge as any).image}
                          showHoverCard
                          city={(judge as any).city || ""}
                          styles={(judge as any).styles}
                          showRemoveButton={canRemove}
                          onRemove={() => {
                            setPendingRemoval({
                              userId: judgeId,
                              displayName:
                                judge.displayName ||
                                judge.username ||
                                "this judge",
                              role: "judge",
                            });
                          }}
                          isRemoving={isPending}
                        />
                      ) : (
                        <span key={judge.id}>{judge.displayName}</span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          <ConfirmationDialog
            open={Boolean(pendingRemoval)}
            title="Remove tag"
            description={`Remove ${pendingRemoval?.displayName || "this tag"}?`}
            confirmLabel="Remove"
            cancelLabel="Cancel"
            loading={isPending}
            onCancel={() => setPendingRemoval(null)}
            onConfirm={confirmPendingRemoval}
          />
        </>
      )}
    </div>
  );
}
