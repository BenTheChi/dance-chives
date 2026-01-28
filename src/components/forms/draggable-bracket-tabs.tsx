"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
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
import { Bracket } from "@/types/event";
import { useIsMobile } from "@/hooks/use-mobile";
import React from "react";

const BRACKET_DROPPABLE_PREFIX = "bracket-";

interface DraggableBracketTabsProps {
  brackets: Bracket[];
  activeBracketId: string;
  onBracketClick: (bracketId: string) => void;
  onBracketDelete: (bracketId: string) => void;
  onReorder: (newOrder: Bracket[]) => void;
  /** When true, do not render DndContext; parent provides it (for cross-bracket video drag). */
  useParentContext?: boolean;
}

interface SortableBracketTabProps {
  bracket: Bracket;
  index: number;
  isActive: boolean;
  onBracketClick: (bracketId: string) => void;
  onBracketDelete: (bracketId: string) => void;
}

export function getBracketDroppableId(bracketId: string) {
  return `${BRACKET_DROPPABLE_PREFIX}${bracketId}`;
}

function SortableBracketTab({
  bracket,
  index,
  isActive,
  onBracketClick,
  onBracketDelete,
}: SortableBracketTabProps) {
  const droppableId = getBracketDroppableId(bracket.id);
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: droppableId,
  });
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bracket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const refCallback = (node: HTMLButtonElement | null) => {
    setDroppableRef(node as HTMLElement | null);
    setSortableRef(node as HTMLElement | null);
  };

  return (
    <div className="relative group w-full md:w-auto">
      <button
        ref={refCallback}
        type="button"
        onClick={() => onBracketClick(bracket.id)}
        style={{ fontFamily: "var(--font-display)", ...style }}
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
          !isDragging && "cursor-grab",
          isOver && "ring-2 ring-primary ring-offset-2 rounded-sm"
        )}
        {...attributes}
        {...listeners}
      >
        {bracket.title || `Bracket ${index + 1}`}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onBracketDelete(bracket.id);
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
        aria-label={`Delete ${bracket.title || "bracket"}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function DraggableBracketTabs({
  brackets,
  activeBracketId,
  onBracketClick,
  onBracketDelete,
  onReorder,
  useParentContext = false,
}: DraggableBracketTabsProps) {
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
        const oldIndex = brackets.findIndex((b) => b.id === active.id);
        const newIndex = brackets.findIndex((b) => b.id === over.id);

        const newOrder = arrayMove(brackets, oldIndex, newIndex);

        // Update position field for each bracket
        const bracketsWithPosition = newOrder.map((bracket, index) => ({
          ...bracket,
          position: index,
        }));

        onReorder(bracketsWithPosition);
      }
    },
    [brackets, onReorder]
  );

  const bracketIds = React.useMemo(() => brackets.map((b) => b.id), [brackets]);

  const tabsContent = (
    <SortableContext
      items={bracketIds}
      strategy={
        isMobile ? verticalListSortingStrategy : horizontalListSortingStrategy
      }
    >
      <div className="flex flex-col md:flex-row md:flex-wrap justify-center items-center gap-2">
        {brackets.map((bracket, index) => (
          <SortableBracketTab
            key={bracket.id}
            bracket={bracket}
            index={index}
            isActive={activeBracketId === bracket.id}
            onBracketClick={onBracketClick}
            onBracketDelete={onBracketDelete}
          />
        ))}
      </div>
    </SortableContext>
  );

  if (useParentContext) {
    return tabsContent;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {tabsContent}
    </DndContext>
  );
}
