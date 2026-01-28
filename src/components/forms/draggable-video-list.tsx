"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Video } from "@/types/video";
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { CircleXButton } from "@/components/ui/circle-x-button";
import { VideoForm } from "./video-form";
import type {
  Control,
  UseFormSetValue,
  UseFormGetValues,
} from "react-hook-form";
import { Section } from "@/types/event";

interface DraggableVideoListProps {
  videos: Video[];
  onReorder: (newOrder: Video[]) => void;
  onVideoTitleChange: (videoId: string, title: string) => void;
  onVideoRemove: (videoId: string) => void;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  sections: Section[];
  updateSections: (sections: Section[]) => void;
  sectionIndex: number;
  activeSectionId: string;
  activeBracketId?: string;
  context: "section" | "bracket";
  eventId?: string;
  /** When true, do not render DndContext; parent must provide it (for cross-bracket drag). */
  useParentContext?: boolean;
  /** Index at which to show drop placeholder (e.g. when dragging from another bracket). */
  insertIndicatorIndex?: number;
}

interface SortableVideoItemProps {
  video: Video;
  index: number;
  onVideoTitleChange: (videoId: string, title: string) => void;
  onVideoRemove: (videoId: string) => void;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  sections: Section[];
  updateSections: (sections: Section[]) => void;
  sectionIndex: number;
  activeSectionId: string;
  activeBracketId?: string;
  context: "section" | "bracket";
  eventId?: string;
}

function SortableVideoItem({
  video,
  index,
  onVideoTitleChange,
  onVideoRemove,
  control,
  setValue,
  getValues,
  sections,
  updateSections,
  sectionIndex,
  activeSectionId,
  activeBracketId,
  context,
  eventId,
}: SortableVideoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(isDragging && "z-50")}
    >
      <AccordionItem
        value={video.id}
        className="border border-border rounded-sm bg-periwinkle-light/50 last:border-b"
      >
        <div className="bg-periwinkle-light/50 flex items-center gap-3 px-4 py-3">
          {/* Grabbable handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className={cn(
              "cursor-grab active:cursor-grabbing",
              "flex items-center justify-center",
              "text-charcoal hover:text-primary",
              "touch-none",
              "select-none",
              "shrink-0",
              "bg-transparent border-none p-0",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            )}
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <Input
            value={video.title ?? ""}
            onChange={(e) => {
              onVideoTitleChange(video.id, e.target.value);
            }}
            className="h-9 flex-1"
            onPointerDown={(e) => {
              // Stop drag from starting when clicking input
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          />

          <div className="flex items-center gap-5 px-3">
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
            >
              <AccordionTrigger 
                className="h-9 w-9 shrink-0 rounded-sm border border-charcoal flex items-center justify-center [&>svg]:text-charcoal"
              >
                <span className="sr-only">Toggle video</span>
              </AccordionTrigger>
            </div>

            <div
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
            >
              <CircleXButton
                size="md"
                aria-label={`Remove ${video.title || "video"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onVideoRemove(video.id);
                }}
              />
            </div>
          </div>
        </div>
        <AccordionContent className="px-4 pb-4 bg-periwinkle-light/50">
          <VideoForm
            key={video.id}
            control={control}
            setValue={setValue}
            getValues={getValues}
            video={video}
            sections={sections}
            updateSections={updateSections}
            videoIndex={index}
            sectionIndex={sectionIndex}
            activeSectionId={activeSectionId}
            activeBracketId={activeBracketId}
            context={context}
            eventId={eventId}
          />
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}

export function DraggableVideoList({
  videos,
  onReorder,
  onVideoTitleChange,
  onVideoRemove,
  control,
  setValue,
  getValues,
  sections,
  updateSections,
  sectionIndex,
  activeSectionId,
  activeBracketId,
  context,
  eventId,
  useParentContext = false,
  insertIndicatorIndex,
}: DraggableVideoListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = videos.findIndex((v) => v.id === active.id);
        const newIndex = videos.findIndex((v) => v.id === over.id);

        const newOrder = arrayMove(videos, oldIndex, newIndex);

        onReorder(newOrder);
      }
    },
    [videos, onReorder]
  );

  const videoIds = React.useMemo(() => videos.map((v) => v.id), [videos]);

  const showInsertIndicator =
    insertIndicatorIndex !== undefined && insertIndicatorIndex >= 0;

  const listContent = (
    <SortableContext items={videoIds} strategy={verticalListSortingStrategy}>
      <Accordion type="single" collapsible className="space-y-3">
        {videos.map((video, index) => (
          <React.Fragment key={video.id}>
            {showInsertIndicator && index === insertIndicatorIndex && (
              <div
                className="h-12 rounded-sm border-2 border-dashed border-primary bg-primary/10 flex items-center justify-center text-sm font-medium text-primary transition-colors"
                aria-hidden
              >
                Drop here
              </div>
            )}
            <SortableVideoItem
              video={video}
              index={index}
              onVideoTitleChange={onVideoTitleChange}
              onVideoRemove={onVideoRemove}
              control={control}
              setValue={setValue}
              getValues={getValues}
              sections={sections}
              updateSections={updateSections}
              sectionIndex={sectionIndex}
              activeSectionId={activeSectionId}
              activeBracketId={activeBracketId}
              context={context}
              eventId={eventId}
            />
          </React.Fragment>
        ))}
        {showInsertIndicator && insertIndicatorIndex === videos.length && (
          <div
            className="h-12 rounded-sm border-2 border-dashed border-primary bg-primary/10 flex items-center justify-center text-sm font-medium text-primary transition-colors"
            aria-hidden
          >
            Drop here
          </div>
        )}
      </Accordion>
    </SortableContext>
  );

  if (videos.length === 0) {
    return null;
  }

  if (useParentContext) {
    return listContent;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {listContent}
    </DndContext>
  );
}
