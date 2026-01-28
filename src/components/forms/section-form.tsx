"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CirclePlusButton } from "@/components/ui/circle-plus-button";
import { CircleXButton } from "@/components/ui/circle-x-button";
import type {
  Control,
  UseFormSetValue,
  UseFormGetValues,
} from "react-hook-form";
import { Section, Bracket } from "@/types/event";
import { Video } from "@/types/video";
import { BracketForm } from "@/components/forms/bracket-form";
import { VideoForm } from "@/components/forms/video-form";
import { DraggableBracketTabs } from "@/components/forms/draggable-bracket-tabs";
import { DraggableVideoList } from "@/components/forms/draggable-video-list";
import {
  DndContext,
  pointerWithin,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type CollisionDetection,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { StyleMultiSelect } from "@/components/ui/style-multi-select";
import { DebouncedSearchMultiSelect } from "@/components/ui/debounced-search-multi-select";
import { UserSearchItem } from "@/types/user";
import { Image } from "@/types/image";
import {
  getDefaultVideoType,
  sectionTypeSupportsWinners,
  sectionTypeSupportsJudges,
  SectionType,
  updateSectionType,
} from "@/lib/utils/section-helpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchYouTubeOEmbed } from "@/lib/utils/youtube-oembed";
import { GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PosterUpload } from "../ui/poster-upload";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import * as z from "zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

async function searchUsers(query: string): Promise<UserSearchItem[]> {
  return fetch(`${process.env.NEXT_PUBLIC_ORIGIN}/api/users?keyword=${query}`)
    .then((response) => {
      if (!response.ok) {
        console.error("Failed to fetch users", response.statusText);
        return [];
      }
      return response.json();
    })
    .then((data) => {
      return data.data;
    })
    .catch((error) => {
      console.error(error);
      return [];
    });
}

interface SectionFormProps {
  control: Control<any>; // Use any to allow SimpleFormValues or FormValues
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  activeSectionIndex: number;
  activeSection: Section;
  sections: Section[];
  updateSections: (sections: Section[]) => void; // New prop to update sections
  activeSectionId: string;
  eventId?: string; // Event ID for winner tagging (only in edit mode)
}

export type SectionFormMode = "overview" | "videos" | "brackets";

// Custom date picker component that works with sections state
function SectionDatePicker({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (date: string) => void;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Convert MM/DD/YYYY string to Date object
  const parseDateString = (
    dateString: string | undefined | null
  ): Date | undefined => {
    if (!dateString || dateString.trim() === "") {
      return undefined;
    }
    try {
      const parsed = parse(dateString, "MM/dd/yyyy", new Date());
      return isValid(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  };

  // Convert Date object to MM/DD/YYYY string
  const formatDateToString = (date: Date | undefined): string => {
    if (!date || !isValid(date)) {
      return "";
    }
    return format(date, "MM/dd/yyyy");
  };

  const dateValue = parseDateString(value);

  // Calculate start and end months for year range (1950 to 5 years in the future)
  const currentYear = new Date().getFullYear();
  const startMonth = new Date(1950, 0, 1);
  const endMonth = new Date(currentYear + 5, 11, 31);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-neutral-300",
            !dateValue ? "text-charcoal" : "text-black",
            hasError && "border-red-500 border-2"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateValue ? (
            format(dateValue, "MM/dd/yyyy")
          ) : (
            <span className="!text-sm">Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          className="rounded-sm border shadow-sm"
          mode="single"
          selected={dateValue}
          onSelect={(date) => {
            onChange(formatDateToString(date));
            setOpen(false);
          }}
          defaultMonth={dateValue || new Date()}
          captionLayout="dropdown"
          startMonth={startMonth}
          endMonth={endMonth}
        />
      </PopoverContent>
    </Popover>
  );
}

interface SectionFormPropsWithMode extends SectionFormProps {
  mode?: SectionFormMode;
  /**
   * Optional external control for which bracket is active.
   * When provided, SectionForm will treat this as the source of truth
   * and notify changes via onActiveBracketChange.
   */
  externalActiveBracketId?: string | null;
  onActiveBracketChange?: (bracketId: string) => void;
}

export function SectionForm({
  control,
  setValue,
  getValues,
  activeSectionIndex,
  activeSection,
  sections,
  updateSections,
  activeSectionId,
  eventId,
  mode,
  externalActiveBracketId,
  onActiveBracketChange,
}: SectionFormPropsWithMode) {
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation schemas
  const dateRegex =
    /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20|21|22|23)[0-9]{2}$/;
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

  // Validate a single section
  const validateSection = (section: Section): Record<string, string> => {
    const sectionErrors: Record<string, string> = {};

    // Title validation
    if (!section.title || section.title.trim().length === 0) {
      sectionErrors.title = "Section title is required";
    }

    // Date validation
    if (section.date) {
      if (!dateRegex.test(section.date)) {
        sectionErrors.date = "Date must be in MM/DD/YYYY format";
      }
    }

    // Start time validation
    if (section.startTime) {
      if (!timeRegex.test(section.startTime)) {
        sectionErrors.startTime = "Start time must be in HH:MM format";
      }
    }

    // End time validation
    if (section.endTime) {
      if (!timeRegex.test(section.endTime)) {
        sectionErrors.endTime = "End time must be in HH:MM format";
      }
    }

    // Date/time logic validation
    const hasDate = Boolean(section.date);
    const hasStart = Boolean(section.startTime);
    const hasEnd = Boolean(section.endTime);
    const anyProvided = hasDate || hasStart || hasEnd;

    if (anyProvided) {
      if (!hasDate) {
        sectionErrors.date = "Date required";
      }
      if (!hasStart) {
        sectionErrors.startTime = "Start time required";
      }
      if (!hasEnd) {
        sectionErrors.endTime = "End time required";
      }
    }

    return sectionErrors;
  };

  // Validate active section and update errors
  const validateActiveSection = useCallback(() => {
    const sectionErrors = validateSection(activeSection);
    setErrors((prev) => {
      const newErrors = { ...prev };
      // Update errors with sectionId prefix
      Object.keys(sectionErrors).forEach((key) => {
        const errorKey = `${activeSectionId}-${key}`;
        newErrors[errorKey] = sectionErrors[key];
      });
      // Remove errors for fields that are now valid
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`${activeSectionId}-`)) {
          const fieldName = key.replace(`${activeSectionId}-`, "");
          if (!sectionErrors[fieldName]) {
            delete newErrors[key];
          }
        }
      });
      return newErrors;
    });
  }, [activeSection, activeSectionId]);

  // Validate on section change and clear touched state for previous section
  useEffect(() => {
    // Clear errors and touched state when switching sections
    setErrors((prev) => {
      const newErrors = { ...prev };
      // Keep only errors for the current section
      Object.keys(newErrors).forEach((key) => {
        if (!key.startsWith(`${activeSectionId}-`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
    // Validate the new active section
    validateActiveSection();
  }, [activeSectionId, validateActiveSection]);

  type SectionDateField = "date" | "startTime" | "endTime";
  const sectionDateFields: SectionDateField[] = [
    "date",
    "startTime",
    "endTime",
  ];

  const setSectionDateValue = (
    field: SectionDateField,
    value: string | undefined
  ) => {
    // Update sections state directly
    const updatedSections = sections.map((section, index) => {
      if (index === activeSectionIndex) {
        return { ...section, [field]: value };
      }
      return section;
    });
    updateSections(updatedSections);

    // Clear error when user starts typing
    const errorKey = `${activeSectionId}-${field}`;
    if (touched[errorKey] && value) {
      // Re-validate after a short delay to allow user to finish typing
      setTimeout(() => {
        validateActiveSection();
      }, 300);
    }
  };

  const clearSectionDateTime = () => {
    // Clear all date/time fields
    const updatedSections = sections.map((section, index) => {
      if (index === activeSectionIndex) {
        return {
          ...section,
          date: undefined,
          startTime: undefined,
          endTime: undefined,
        };
      }
      return section;
    });
    updateSections(updatedSections);

    // Clear validation errors for date/time fields
    setErrors((prev) => {
      const newErrors = { ...prev };
      sectionDateFields.forEach((field) => {
        const errorKey = `${activeSectionId}-${field}`;
        delete newErrors[errorKey];
      });
      return newErrors;
    });

    // Clear touched state for date/time fields
    setTouched((prev) => {
      const newTouched = { ...prev };
      sectionDateFields.forEach((field) => {
        const touchedKey = `${activeSectionId}-${field}`;
        delete newTouched[touchedKey];
      });
      return newTouched;
    });
  };

  const [internalActiveBracketId, setInternalActiveBracketId] = useState(
    activeSection.brackets.length > 0 ? activeSection.brackets[0].id : ""
  );

  const activeBracketId =
    externalActiveBracketId && externalActiveBracketId.length > 0
      ? externalActiveBracketId
      : internalActiveBracketId;

  const handleSetActiveBracketId = (bracketId: string) => {
    if (!externalActiveBracketId) {
      setInternalActiveBracketId(bracketId);
    }
    if (onActiveBracketChange) {
      onActiveBracketChange(bracketId);
    }
  };

  // Ensure active bracket is set when brackets exist and mode is brackets
  useEffect(() => {
    if (mode === "brackets" && activeSection.brackets.length > 0) {
      const isValidBracket = activeSection.brackets.some(
        (b) => b.id === activeBracketId
      );
      if (!isValidBracket || !activeBracketId) {
        const firstBracketId = activeSection.brackets[0]?.id;
        if (firstBracketId) {
          if (!externalActiveBracketId) {
            setInternalActiveBracketId(firstBracketId);
          }
          if (onActiveBracketChange) {
            onActiveBracketChange(firstBracketId);
          }
        }
      }
    } else if (mode === "brackets" && activeSection.brackets.length === 0) {
      // Clear active bracket if no brackets exist
      if (activeBracketId && !externalActiveBracketId) {
        setInternalActiveBracketId("");
      }
    }
  }, [
    mode,
    activeSection.brackets,
    activeBracketId,
    externalActiveBracketId,
    onActiveBracketChange,
  ]);
  const [sectionWinners, setSectionWinners] = useState<UserSearchItem[]>([]);
  const [sectionJudges, setSectionJudges] = useState<UserSearchItem[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [newBracketTitle, setNewBracketTitle] = useState("");
  const [bracketTitleError, setBracketTitleError] = useState<string>("");
  const [activeDragVideoId, setActiveDragVideoId] = useState<string | null>(
    null
  );
  const [dropPreview, setDropPreview] = useState<{
    bracketId: string;
    index: number;
  } | null>(null);

  // Load existing section winners from activeSection.winners
  // Use a Map to deduplicate winners by username
  useEffect(() => {
    if (activeSection?.winners && Array.isArray(activeSection.winners)) {
      // Deduplicate winners by username to prevent duplicates
      const uniqueWinners = Array.from(
        new Map(
          activeSection.winners
            .filter((w) => w && w.username)
            .map((w) => [w.username, w])
        ).values()
      );
      setSectionWinners(uniqueWinners);
    } else {
      setSectionWinners([]);
    }
  }, [activeSectionId, activeSection?.winners]);

  // Load existing section judges from activeSection.judges
  // Use a Map to deduplicate judges by username
  useEffect(() => {
    if (activeSection?.judges && Array.isArray(activeSection.judges)) {
      // Deduplicate judges by username to prevent duplicates
      const uniqueJudges = Array.from(
        new Map(
          activeSection.judges
            .filter((j) => j && j.username)
            .map((j) => [j.username, j])
        ).values()
      );
      setSectionJudges(uniqueJudges);
    } else {
      setSectionJudges([]);
    }
  }, [activeSectionId, activeSection?.judges]);

  // Ensure hasBrackets is set correctly based on section type when editing
  useEffect(() => {
    if (!activeSection) return;
  }, [
    activeSectionId,
    activeSection,
    activeSection?.sectionType,
    activeSection?.hasBrackets,
    activeSectionIndex,
    setValue,
    getValues,
  ]);

  const addBracket = (title?: string) => {
    if (!activeSection) return;

    // Validate bracket title is not blank
    const titleToValidate = title?.trim() || newBracketTitle.trim();
    if (!titleToValidate) {
      setBracketTitleError("Bracket title cannot be blank");
      return;
    }

    // Clear any previous error
    setBracketTitleError("");

    const bracketTitle = titleToValidate;

    const newBracket: Bracket = {
      id: Date.now().toString(),
      title: bracketTitle,
      videos: [],
    };

    const updatedSections = sections.map((section) =>
      section.id === activeSectionId
        ? { ...section, brackets: [...section.brackets, newBracket] }
        : section
    );

    // Update sections state
    updateSections(updatedSections);
    handleSetActiveBracketId(newBracket.id);
    // Clear the input after creating
    setNewBracketTitle("");
  };

  const removeVideoFromSection = (videoId: string) => {
    if (!activeSection) return;

    const updatedVideos = activeSection.videos.filter(
      (video) => video.id !== videoId
    );
    const updatedSections = sections.map((section) =>
      section.id === activeSectionId
        ? { ...section, videos: updatedVideos }
        : section
    );

    updateSections(updatedSections);
  };

  const removeBracket = (bracketId: string) => {
    if (!activeSection) return;

    const updatedBrackets = activeSection.brackets.filter(
      (bracket) => bracket.id !== bracketId
    );
    const updatedSections = sections.map((section) =>
      section.id === activeSectionId
        ? { ...section, brackets: updatedBrackets }
        : section
    );

    updateSections(updatedSections);

    // If we removed the active bracket, switch to the first available bracket
    if (activeBracketId === bracketId) {
      if (updatedBrackets.length > 0) {
        handleSetActiveBracketId(updatedBrackets[0].id);
      } else {
        if (!externalActiveBracketId) {
          setInternalActiveBracketId("");
        }
      }
    }
  };

  const handleBracketReorder = (newOrder: Bracket[]) => {
    if (!activeSection) return;

    const updatedSections = sections.map((section) =>
      section.id === activeSectionId
        ? { ...section, brackets: newOrder }
        : section
    );

    updateSections(updatedSections);
  };

  const bracketIds = useMemo(
    () => activeSection.brackets.map((b) => b.id),
    [activeSection.brackets]
  );

  const handleBracketsDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string;
      if (bracketIds.includes(id)) {
        // When reordering bracket tabs, show the dragged bracket so the form doesn't appear to change
        handleSetActiveBracketId(id);
      } else {
        setActiveDragVideoId(id);
      }
    },
    [bracketIds, handleSetActiveBracketId]
  );

  const handleBracketsDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      // Only switch active bracket / update drop preview when dragging a video.
      const isDraggingBracketTab = bracketIds.includes(active.id as string);
      if (isDraggingBracketTab) {
        setDropPreview(null);
        return;
      }

      if (!over) {
        setDropPreview(null);
        return;
      }

      const overId = over.id as string;
      const droppablePrefix = "bracket-";
      let targetBracketId: string;
      let targetIndex: number;

      const droppedOnBracketTab =
        overId.startsWith(droppablePrefix) || bracketIds.includes(overId);
      if (droppedOnBracketTab) {
        targetBracketId = overId.startsWith(droppablePrefix)
          ? overId.slice(droppablePrefix.length)
          : overId;
        const targetBracket = activeSection.brackets.find(
          (b) => b.id === targetBracketId
        );
        if (!targetBracket) {
          setDropPreview(null);
          return;
        }
        targetIndex = targetBracket.videos.length;
      } else {
        const targetBracket = activeSection.brackets.find((b) =>
          b.videos.some((v) => v.id === overId)
        );
        if (!targetBracket) {
          setDropPreview(null);
          return;
        }
        targetIndex = targetBracket.videos.findIndex((v) => v.id === overId);
        if (targetIndex === -1) {
          setDropPreview(null);
          return;
        }
        targetBracketId = targetBracket.id;
      }

      setDropPreview({ bracketId: targetBracketId, index: targetIndex });
      if (targetBracketId !== activeBracketId) {
        handleSetActiveBracketId(targetBracketId);
      }
    },
    [
      bracketIds,
      activeBracketId,
      activeSection.brackets,
      handleSetActiveBracketId,
    ]
  );

  const handleBracketsDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragVideoId(null);
      setDropPreview(null);
      if (!over || active.id === over.id) return;

      const isBracketDrag = bracketIds.includes(active.id as string);

      if (isBracketDrag) {
        const droppablePrefix = "bracket-";
        let overId = over.id as string;
        // When dragging bracket tabs, the pointer can be over either the sortable tab id
        // (bracket.id) or the droppable zone id used for cross-bracket video drops
        // (bracket-${bracket.id}). Normalize to the plain bracket id so reordering works
        // regardless of which one `pointerWithin` reports.
        if (overId.startsWith(droppablePrefix)) {
          overId = overId.slice(droppablePrefix.length);
        }
        const oldIndex = activeSection.brackets.findIndex(
          (b) => b.id === active.id
        );
        const newIndex = activeSection.brackets.findIndex(
          (b) => b.id === overId
        );
        if (oldIndex === -1 || newIndex === -1) return;
        const newOrder = arrayMove(activeSection.brackets, oldIndex, newIndex);
        handleBracketReorder(newOrder);
        return;
      }

      const videoId = active.id as string;
      const sourceBracket = activeSection.brackets.find((b) =>
        b.videos.some((v) => v.id === videoId)
      );
      if (!sourceBracket) return;

      const video = sourceBracket.videos.find((v) => v.id === videoId);
      if (!video) return;

      const overId = over.id as string;
      const droppablePrefix = "bracket-";
      let targetBracketId: string;
      let targetIndex: number;

      // Drop on bracket tab or bracket droppable zone (same node can report sortable id = bracket.id)
      const droppedOnBracketTab =
        overId.startsWith(droppablePrefix) || bracketIds.includes(overId);
      if (droppedOnBracketTab) {
        targetBracketId = overId.startsWith(droppablePrefix)
          ? overId.slice(droppablePrefix.length)
          : overId;
        const targetBracket = activeSection.brackets.find(
          (b) => b.id === targetBracketId
        );
        if (!targetBracket) return;
        targetIndex = targetBracket.videos.length;
      } else {
        const targetBracket = activeSection.brackets.find((b) =>
          b.videos.some((v) => v.id === overId)
        );
        if (!targetBracket) return;
        targetIndex = targetBracket.videos.findIndex((v) => v.id === overId);
        if (targetIndex === -1) return;
        targetBracketId = targetBracket.id;
      }

      const sourceVideos = sourceBracket.videos.filter((v) => v.id !== videoId);
      const targetBracket = activeSection.brackets.find(
        (b) => b.id === targetBracketId
      )!;

      let targetVideos: typeof sourceBracket.videos;
      if (sourceBracket.id === targetBracketId) {
        const insertIndex = sourceVideos.findIndex((v) => v.id === overId);
        targetVideos = [...sourceVideos];
        targetVideos.splice(
          insertIndex >= 0 ? insertIndex : targetVideos.length,
          0,
          video
        );
      } else {
        targetVideos = [...targetBracket.videos];
        targetVideos.splice(targetIndex, 0, video);
      }

      const updatedBrackets = activeSection.brackets.map((b) => {
        if (b.id === sourceBracket.id && sourceBracket.id !== targetBracketId)
          return { ...b, videos: sourceVideos };
        if (b.id === targetBracketId) return { ...b, videos: targetVideos };
        return b;
      });

      const updatedSections = sections.map((section) =>
        section.id === activeSectionId
          ? { ...section, brackets: updatedBrackets }
          : section
      );
      updateSections(updatedSections);
    },
    [
      activeSection,
      activeSectionId,
      bracketIds,
      sections,
      updateSections,
      handleBracketReorder,
    ]
  );

  const bracketsDndSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const bracketsCollisionDetection: CollisionDetection = useCallback(
    (args) => {
      const { active, droppableContainers } = args;
      const isBracketDrag = bracketIds.includes(active.id as string);

      // When dragging bracket tabs, ignore the special bracket droppable
      // containers (e.g. "bracket-<id>") that power the cross-bracket
      // video dragging "white box" so that tab reordering animations
      // use the sortable tab ids instead.
      const filteredDroppables = isBracketDrag
        ? droppableContainers.filter(
            (container) =>
              !container.id.toString().startsWith("bracket-")
          )
        : droppableContainers;

      return pointerWithin({
        ...args,
        droppableContainers: filteredDroppables,
      });
    },
    [bracketIds]
  );

  const handleStylesChange = (styles: string[]) => {
    const updatedSections = sections.map((section) =>
      section.id === activeSectionId ? { ...section, styles } : section
    );
    updateSections(updatedSections);

    // If applyStylesToVideos is true, propagate styles to all videos
    if (activeSection.applyStylesToVideos) {
      propagateStylesToVideos(styles, updatedSections);
    }
  };

  const handleApplyStylesToVideosChange = (apply: boolean) => {
    const updatedSections = sections.map((section) => {
      if (section.id !== activeSectionId) return section;

      if (apply) {
        // When turning ON: propagate section styles to all videos
        const sectionStyles = section.styles || [];
        return {
          ...section,
          applyStylesToVideos: true,
          styles: sectionStyles,
        };
      } else {
        // When turning OFF: remove section styles, clear video styles, enable video-level styles
        // Clear styles from all videos (direct and bracket videos)
        const updatedVideos = section.videos.map((video) => ({
          ...video,
          styles: [], // Empty array is valid for optional array field
        }));

        const updatedBrackets = section.brackets.map((bracket) => ({
          ...bracket,
          videos: bracket.videos.map((video) => ({
            ...video,
            styles: [], // Empty array is valid for optional array field
          })),
        }));

        return {
          ...section,
          applyStylesToVideos: false,
          styles: [], // Empty array is valid for optional array field
          videos: updatedVideos,
          brackets: updatedBrackets,
        };
      }
    });

    updateSections(updatedSections);

    // Propagate styles if turning ON
    if (apply) {
      const sectionStyles = activeSection.styles || [];
      propagateStylesToVideos(sectionStyles, updatedSections);
    }
  };

  const propagateStylesToVideos = (
    styles: string[],
    currentSections: Section[]
  ) => {
    const updatedSections = currentSections.map((section) => {
      if (section.id !== activeSectionId) return section;

      // Update direct videos
      const updatedVideos = section.videos.map((video) => ({
        ...video,
        styles: [...styles],
      }));

      // Update bracket videos
      const updatedBrackets = section.brackets.map((bracket) => ({
        ...bracket,
        videos: bracket.videos.map((video) => ({
          ...video,
          styles: [...styles],
        })),
      }));

      return {
        ...section,
        videos: updatedVideos,
        brackets: updatedBrackets,
      };
    });

    updateSections(updatedSections);
  };

  const handleRemoveSectionWinner = (username: string) => {
    const winnerToRemove = sectionWinners.find((w) => w.username === username);
    if (!winnerToRemove) {
      return;
    }

    // Update section winners in form state
    const updatedSections = sections.map((section) => {
      if (section.id !== activeSectionId) return section;

      return {
        ...section,
        winners: (section.winners || []).filter((w) => w.username !== username),
      };
    });

    updateSections(updatedSections);

    // Update local winners state for display
    setSectionWinners((prev) => prev.filter((w) => w.username !== username));
  };

  const resolvedMode: SectionFormMode = mode ?? "overview";

  const handleAddVideoFromUrl = async () => {
    if (!newVideoUrl.trim()) {
      toast.error("Please enter a YouTube URL.");
      return;
    }
    setIsAddingVideo(true);
    try {
      const metadata = await fetchYouTubeOEmbed(newVideoUrl.trim());
      const defaultVideoType = getDefaultVideoType(activeSection.sectionType);
      const truncatedTitle =
        metadata.title?.slice(0, 60) ||
        `Video ${activeSection.videos.length + 1}`;

      const newVideo: Video = {
        id: crypto.randomUUID(),
        title: truncatedTitle,
        src: newVideoUrl.trim(),
        thumbnailUrl: metadata.thumbnail_url,
        type: defaultVideoType,
      };

      const updatedSections = sections.map((section) =>
        section.id === activeSectionId
          ? {
              ...section,
              videos: [newVideo, ...section.videos],
              description: section.description ?? "",
            }
          : { ...section, description: section.description ?? "" }
      );

      updateSections(updatedSections);
      setNewVideoUrl("");
    } catch (error) {
      console.error(error);
      toast.error("Could not fetch video info. Please check the URL.");
    } finally {
      setIsAddingVideo(false);
    }
  };

  return (
    <section className="bg-primary space-y-4 p-6 border-2 border-primary-light rounded-sm">
      {resolvedMode === "overview" && (
        <>
          {/* Apply same style tags to all videos (available for all sections) */}
          <div className="flex items-center space-x-2">
            <Switch
              checked={activeSection.applyStylesToVideos || false}
              onCheckedChange={(checked) => {
                handleApplyStylesToVideosChange(checked);
              }}
            />
            <label className="text-sm font-medium text-white">
              Apply same style tags to all videos
            </label>
          </div>

          {activeSection.applyStylesToVideos && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Section Dance Styles
              </label>
              <StyleMultiSelect
                value={activeSection.styles || []}
                onChange={(styles) => {
                  handleStylesChange(styles);
                }}
              />
            </div>
          )}

          {/* Section Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Section Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={activeSection.title ?? ""}
              onChange={(e) => {
                const title = e.target.value;
                const updated = sections.map((section) => {
                  if (section.id !== activeSectionId) return section;
                  return {
                    ...section,
                    title,
                  };
                });
                updateSections(updated);
                // Clear error when user starts typing
                if (
                  touched[`${activeSectionId}-title`] &&
                  title.trim().length > 0
                ) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[`${activeSectionId}-title`];
                    return newErrors;
                  });
                }
              }}
              onBlur={() => {
                setTouched((prev) => ({
                  ...prev,
                  [`${activeSectionId}-title`]: true,
                }));
                validateActiveSection();
              }}
              className={cn(
                "bg-neutral-300",
                errors[`${activeSectionId}-title`] && "border-red-500 border-2"
              )}
              placeholder="Section title"
            />
            {errors[`${activeSectionId}-title`] && (
              <p className="text-sm text-red-500">
                {errors[`${activeSectionId}-title`]}
              </p>
            )}
          </div>

          {/* Type and Use Brackets Switch - Above Poster Upload */}
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-white">Type</label>
              <Select
                onValueChange={(newValue) => {
                  const updated = updateSectionType(
                    sections,
                    activeSectionId,
                    newValue as SectionType
                  );
                  updateSections(updated);
                }}
                value={activeSection.sectionType ?? "Battle"}
              >
                <SelectTrigger className="bg-neutral-300">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Battle">Battle</SelectItem>
                  <SelectItem value="Competition">Competition</SelectItem>
                  <SelectItem value="Class">Class</SelectItem>
                  <SelectItem value="Exhibition">Exhibition</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="Party">Party</SelectItem>
                  <SelectItem value="Performance">Performance</SelectItem>
                  <SelectItem value="Session">Session</SelectItem>
                  <SelectItem value="Showcase">Showcase</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-row items-center gap-3 space-y-0">
              <label className="text-sm font-medium text-white cursor-pointer whitespace-nowrap">
                Use Brackets
              </label>
              <Switch
                checked={Boolean(activeSection.hasBrackets)}
                onCheckedChange={(checked) => {
                  const updatedSections = sections.map((section) =>
                    section.id === activeSectionId
                      ? {
                          ...section,
                          hasBrackets: checked,
                        }
                      : section
                  );
                  updateSections(updatedSections);
                }}
              />
            </div>
          </div>

          {/* Details Accordion */}
          <Accordion
            type="single"
            collapsible
            className="w-full bg-secondary/80 border-1 border-secondary-light px-4"
          >
            <AccordionItem value="details" className="border-none">
              <AccordionTrigger className="text-white hover:no-underline py-2">
                <span>Details</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Poster Upload
                  </label>
                  <PosterUpload
                    initialPoster={activeSection.poster?.url || null}
                    initialPosterFile={activeSection.poster?.file || null}
                    initialBgColor={activeSection.bgColor || "#ffffff"}
                    onFileChange={({ file, bgColor }) => {
                      // Update sections state directly
                      const updatedSections = sections.map((section, index) => {
                        if (index === activeSectionIndex) {
                          const posterImage = file
                            ? {
                                id: section.poster?.id || crypto.randomUUID(),
                                title:
                                  section.poster?.title || "Section Poster",
                                url: section.poster?.url || "",
                                type: "poster" as const,
                                file,
                              }
                            : null;
                          return {
                            ...section,
                            bgColor,
                            poster: posterImage,
                          };
                        }
                        return section;
                      });
                      updateSections(updatedSections);
                    }}
                    editable={true}
                    maxFiles={1}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Description
                  </label>
                  <Textarea
                    value={activeSection.description ?? ""}
                    onChange={(e) => {
                      const description = e.target.value;
                      const updated = sections.map((section) => {
                        if (section.id !== activeSectionId) return section;
                        return {
                          ...section,
                          description,
                        };
                      });
                      updateSections(updated);
                    }}
                    placeholder="Section description"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="text-sm font-medium text-white">
                      Section Date & Time
                    </label>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearSectionDateTime}
                      className="hover:text-primary-light"
                    >
                      Clear date/time
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr]  rounded-sm bg-neutral-300 border border-charcoal p-4">
                    <div className="min-w-0">
                      <label className="text-sm font-medium text-black mb-2 block">
                        Section Date
                      </label>
                      <SectionDatePicker
                        value={activeSection.date ?? ""}
                        onChange={(date) => {
                          setSectionDateValue("date", date || undefined);
                          setTouched((prev) => ({
                            ...prev,
                            [`${activeSectionId}-date`]: true,
                          }));
                        }}
                        hasError={!!errors[`${activeSectionId}-date`]}
                      />
                      {errors[`${activeSectionId}-date`] && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors[`${activeSectionId}-date`]}
                        </p>
                      )}
                    </div>

                    <div className="min-w-0">
                      <label className="text-sm font-medium text-black mb-2 block">
                        Start Time
                      </label>
                      <Input
                        type="time"
                        value={activeSection.startTime ?? ""}
                        onChange={(e) => {
                          setSectionDateValue(
                            "startTime",
                            e.target.value || undefined
                          );
                          setTouched((prev) => ({
                            ...prev,
                            [`${activeSectionId}-startTime`]: true,
                          }));
                        }}
                        onBlur={() => validateActiveSection()}
                        className={cn(
                          "bg-neutral-300 w-full",
                          errors[`${activeSectionId}-startTime`] &&
                            "border-red-500 border-2"
                        )}
                      />
                      {errors[`${activeSectionId}-startTime`] && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors[`${activeSectionId}-startTime`]}
                        </p>
                      )}
                    </div>

                    <div className="min-w-0">
                      <label className="text-sm font-medium text-black mb-2 block">
                        End Time
                      </label>
                      <Input
                        type="time"
                        value={activeSection.endTime ?? ""}
                        onChange={(e) => {
                          setSectionDateValue(
                            "endTime",
                            e.target.value || undefined
                          );
                          setTouched((prev) => ({
                            ...prev,
                            [`${activeSectionId}-endTime`]: true,
                          }));
                        }}
                        onBlur={() => validateActiveSection()}
                        className={cn(
                          "bg-neutral-300 w-full",
                          errors[`${activeSectionId}-endTime`] &&
                            "border-red-500 border-2"
                        )}
                      />
                      {errors[`${activeSectionId}-endTime`] && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors[`${activeSectionId}-endTime`]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section Winners - only show if section type supports winners */}
                {sectionTypeSupportsWinners(activeSection.sectionType) && (
                  <div className="space-y-2">
                    <DebouncedSearchMultiSelect<UserSearchItem>
                      onSearch={searchUsers}
                      placeholder="Search users to mark as section winners..."
                      getDisplayValue={(item) =>
                        `${item.displayName} (${item.username})`
                      }
                      getItemId={(item) => item.username}
                      onChange={(users) => {
                        // Update section winners in form state with the complete list
                        const updatedSections = sections.map((section) => {
                          if (section.id !== activeSectionId) return section;
                          return {
                            ...section,
                            winners: users,
                          };
                        });

                        updateSections(updatedSections);

                        // Update local winners state for display
                        setSectionWinners(users);
                      }}
                      value={sectionWinners}
                      name="sectionWinners"
                      label="Section Winners"
                      labelColor="text-white"
                    />
                  </div>
                )}

                {/* Section Judges - only show if section type supports judges */}
                {sectionTypeSupportsJudges(activeSection.sectionType) && (
                  <div className="space-y-2">
                    <DebouncedSearchMultiSelect<UserSearchItem>
                      onSearch={searchUsers}
                      placeholder="Search users to mark as section judges..."
                      getDisplayValue={(item) =>
                        `${item.displayName} (${item.username})`
                      }
                      getItemId={(item) => item.username}
                      onChange={(users) => {
                        // Update section judges in form state with the complete list
                        const updatedSections = sections.map((section) => {
                          if (section.id !== activeSectionId) return section;
                          return {
                            ...section,
                            judges: users,
                          };
                        });

                        updateSections(updatedSections);

                        // Update local judges state for display
                        setSectionJudges(users);
                      }}
                      value={sectionJudges}
                      name="sectionJudges"
                      label="Section Judges"
                      labelColor="text-white"
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}

      {resolvedMode === "brackets" && (
        <div className="space-y-4">
          {/* Bracket Title Input - In its own container */}
          <section>
            <label className="text-sm font-medium text-white">
              New Bracket
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Ex. Prelims, Top 16, Semi Finals, etc"
                  value={newBracketTitle}
                  onChange={(e) => {
                    setNewBracketTitle(e.target.value);
                    // Clear error when user starts typing
                    if (bracketTitleError) {
                      setBracketTitleError("");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addBracket();
                    }
                  }}
                  className={bracketTitleError ? "border-red-500" : ""}
                />
                {bracketTitleError && (
                  <p className="text-sm text-red-500 mt-1">
                    {bracketTitleError}
                  </p>
                )}
              </div>
              <CirclePlusButton
                size="lg"
                onClick={() => addBracket()}
                aria-label="Add bracket"
              />
            </div>
          </section>

          {/* Bracket Tabs + Active Bracket: single DndContext for tab reorder and cross-bracket video drag */}
          {activeSection.brackets.length > 0 ? (
            <DndContext
              sensors={bracketsDndSensors}
              collisionDetection={bracketsCollisionDetection}
              onDragStart={handleBracketsDragStart}
              onDragOver={handleBracketsDragOver}
              onDragEnd={handleBracketsDragEnd}
              onDragCancel={() => {
                setActiveDragVideoId(null);
                setDropPreview(null);
              }}
            >
              <DraggableBracketTabs
                brackets={activeSection.brackets}
                activeBracketId={activeBracketId}
                onBracketClick={handleSetActiveBracketId}
                onBracketDelete={removeBracket}
                onReorder={handleBracketReorder}
                useParentContext
              />

              {/* Active Bracket Container */}
              {activeBracketId &&
                (() => {
                  const bracketIndex = activeSection.brackets.findIndex(
                    (b) => b.id === activeBracketId
                  );
                  const effectiveBracketIndex =
                    bracketIndex === -1 ? 0 : bracketIndex;
                  const bracket = activeSection.brackets[effectiveBracketIndex];

                  if (!bracket) {
                    return null;
                  }

                  return (
                    <BracketForm
                      control={control}
                      setValue={setValue}
                      getValues={getValues}
                      activeSectionIndex={activeSectionIndex}
                      activeBracketIndex={effectiveBracketIndex}
                      bracket={bracket}
                      sections={sections}
                      updateSections={updateSections}
                      activeSectionId={activeSectionId}
                      activeBracketId={bracket.id}
                      eventId={eventId}
                      useParentDndContext
                      dropPreview={
                        dropPreview?.bracketId === bracket.id
                          ? dropPreview.index
                          : undefined
                      }
                    />
                  );
                })()}

              {/* Drag overlay so ghost is visible when dragging outside the list */}
              <DragOverlay dropAnimation={null}>
                {activeDragVideoId
                  ? (() => {
                      const video = activeSection.brackets
                        .flatMap((b) => b.videos)
                        .find((v) => v.id === activeDragVideoId);
                      if (!video) return null;
                      return (
                        <div
                          className="flex items-center gap-3 px-4 py-3 rounded-sm border-2 border-charcoal bg-mint shadow-[4px_4px_0_0_rgb(49,49,49)] cursor-grabbing min-w-[200px] pointer-events-none"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          <GripVertical className="h-5 w-5 shrink-0 text-charcoal" />
                          <span className="text-sm font-medium text-charcoal truncate flex-1">
                            {video.title || "Untitled video"}
                          </span>
                        </div>
                      );
                    })()
                  : null}
              </DragOverlay>
            </DndContext>
          ) : null}
        </div>
      )}

      {resolvedMode === "videos" && !activeSection.hasBrackets && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter YouTube URL"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
              />
            </div>
            {isAddingVideo ? (
              <div className="rounded-sm bg-pulse-green border border-charcoal w-[50px] h-[50px] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-black" />
              </div>
            ) : (
              <CirclePlusButton size="lg" onClick={handleAddVideoFromUrl} />
            )}
          </div>

          {activeSection.videos.length > 0 && (
            <DraggableVideoList
              videos={activeSection.videos}
              onReorder={(newOrder) => {
                const updatedSections = sections.map((section) =>
                  section.id === activeSectionId
                    ? { ...section, videos: newOrder }
                    : section
                );
                updateSections(updatedSections);
              }}
              onVideoTitleChange={(videoId, title) => {
                const updatedSections = sections.map((section) => {
                  if (section.id !== activeSectionId) return section;
                  return {
                    ...section,
                    videos: section.videos.map((v) =>
                      v.id === videoId ? { ...v, title } : v
                    ),
                  };
                });
                updateSections(updatedSections);
              }}
              onVideoRemove={removeVideoFromSection}
              control={control}
              setValue={setValue}
              getValues={getValues}
              sections={sections}
              updateSections={updateSections}
              sectionIndex={activeSectionIndex}
              activeSectionId={activeSectionId}
              context="section"
              eventId={eventId}
            />
          )}
        </div>
      )}
    </section>
  );
}
