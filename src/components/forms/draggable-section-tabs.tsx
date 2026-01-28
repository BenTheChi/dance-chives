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
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section } from "@/types/event";
import { useIsMobile } from "@/hooks/use-mobile";
import React from "react";

interface DraggableSectionTabsProps {
  sections: Section[];
  activeSectionId: string;
  onSectionClick: (sectionId: string) => void;
  onSectionDelete: (sectionId: string) => void;
  onReorder: (newOrder: Section[]) => void;
}

interface SortableSectionTabProps {
  section: Section;
  index: number;
  isActive: boolean;
  onSectionClick: (sectionId: string) => void;
  onSectionDelete: (sectionId: string) => void;
}

function SortableSectionTab({
  section,
  index,
  isActive,
  onSectionClick,
  onSectionDelete,
}: SortableSectionTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group w-full md:w-auto"
    >
      <button
        type="button"
        onClick={() => onSectionClick(section.id)}
        className={cn(
          "px-3 py-1.5 rounded-sm transition-all duration-200 w-full md:w-auto",
          "border-2 border-transparent",
          "group-hover:border-charcoal group-hover:shadow-[4px_4px_0_0_rgb(49,49,49)]",
          "active:shadow-[2px_2px_0_0_rgb(49,49,49)]",
          "text-sm font-bold uppercase tracking-wide",
          "font-display",
          isActive &&
            "border-charcoal shadow-[4px_4px_0_0_rgb(49,49,49)] bg-mint text-primary",
          !isActive &&
            "text-secondary-light group-hover:bg-[#dfdfeb] group-hover:text-periwinkle",
          isDragging && "cursor-grabbing",
          !isDragging && "cursor-grab"
        )}
        style={{ fontFamily: "var(--font-display)" }}
        {...attributes}
        {...listeners}
      >
        {section.title || `Section ${index + 1}`}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onSectionDelete(section.id);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        className={cn(
          "absolute -top-2 -right-2",
          "w-5 h-5 rounded-full",
          "bg-destructive text-destructive-foreground",
          "border-2 border-charcoal",
          "flex items-center justify-center",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity duration-200",
          "hover:bg-destructive/90",
          "z-10",
          "shadow-[2px_2px_0_0_rgb(49,49,49)]",
          "cursor-pointer"
        )}
        aria-label={`Delete ${section.title || "section"}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function DraggableSectionTabs({
  sections,
  activeSectionId,
  onSectionClick,
  onSectionDelete,
  onReorder,
}: DraggableSectionTabsProps) {
  const isMobile = useIsMobile();
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
        const oldIndex = sections.findIndex((s) => s.id === active.id);
        const newIndex = sections.findIndex((s) => s.id === over.id);

        const newOrder = arrayMove(sections, oldIndex, newIndex);

        // Update position field for each section
        const sectionsWithPosition = newOrder.map((section, index) => ({
          ...section,
          position: index,
        }));

        onReorder(sectionsWithPosition);
      }
    },
    [sections, onReorder]
  );

  const sectionIds = React.useMemo(() => sections.map((s) => s.id), [sections]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sectionIds}
        strategy={
          isMobile ? verticalListSortingStrategy : horizontalListSortingStrategy
        }
      >
        <div className="flex flex-col md:flex-row md:flex-wrap justify-center items-center gap-2">
          {sections.map((section, index) => (
            <SortableSectionTab
              key={section.id}
              section={section}
              index={index}
              isActive={activeSectionId === section.id}
              onSectionClick={onSectionClick}
              onSectionDelete={onSectionDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
