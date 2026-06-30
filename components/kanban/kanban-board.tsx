"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KanbanItem {
  id: string;
  /** Which column the item currently lives in. */
  columnId: string;
}

export interface KanbanColumnDef {
  id: string;
  title: string;
  /** Optional secondary line under the title (e.g. a date). */
  subtitle?: string;
  /** Highlight this column (e.g. today on the schedule). */
  accent?: boolean;
}

const COLUMN_PREFIX = "column:";

export function KanbanBoard<T extends KanbanItem>({
  columns,
  items,
  renderCard,
  renderColumnMeta,
  onMove,
}: {
  columns: KanbanColumnDef[];
  items: T[];
  renderCard: (item: T) => ReactNode;
  renderColumnMeta?: (columnId: string, items: T[]) => ReactNode;
  onMove: (itemId: string, toColumnId: string) => Promise<void>;
}) {
  const [localItems, setLocalItems] = useState<T[]>(items);
  const [activeId, setActiveId] = useState<string | null>(null);
  const localRef = useRef(localItems);
  localRef.current = localItems;

  // Resync when the server sends new data (after a successful move or an add).
  const signature = items.map((i) => `${i.id}:${i.columnId}`).join("|");
  useEffect(() => {
    setLocalItems(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const itemsById = useMemo(() => {
    const map = new Map<string, T>();
    for (const item of localItems) map.set(item.id, item);
    return map;
  }, [localItems]);

  const groups = useMemo(() => {
    const map = new Map<string, T[]>();
    for (const col of columns) map.set(col.id, []);
    for (const item of localItems) map.get(item.columnId)?.push(item);
    return map;
  }, [columns, localItems]);

  function columnOf(itemId: string): string | undefined {
    return localRef.current.find((i) => i.id === itemId)?.columnId;
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const id = String(active.id);
    const overId = String(over.id);
    const sourceCol = columnOf(id);
    const targetCol = overId.startsWith(COLUMN_PREFIX)
      ? overId.slice(COLUMN_PREFIX.length)
      : columnOf(overId);
    if (!sourceCol || !targetCol) return;

    if (sourceCol === targetCol) {
      // Reorder within the column (visual only — order isn't persisted).
      if (!overId.startsWith(COLUMN_PREFIX) && overId !== id) {
        setLocalItems((prev) => {
          const from = prev.findIndex((i) => i.id === id);
          const to = prev.findIndex((i) => i.id === overId);
          return from === -1 || to === -1 ? prev : arrayMove(prev, from, to);
        });
      }
      return;
    }

    // Cross-column move: update optimistically, then persist.
    const snapshot = localRef.current;
    setLocalItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, columnId: targetCol } : i)),
    );
    onMove(id, targetCol).catch(() => setLocalItems(snapshot));
  }

  const activeItem = activeId ? itemsById.get(activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colItems = groups.get(col.id) ?? [];
          return (
            <Column
              key={col.id}
              column={col}
              count={colItems.length}
              meta={renderColumnMeta?.(col.id, colItems)}
              itemIds={colItems.map((i) => i.id)}
            >
              {colItems.map((item) => (
                <SortableCard key={item.id} id={item.id}>
                  {renderCard(item)}
                </SortableCard>
              ))}
            </Column>
          );
        })}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="w-[252px]">
            <CardShell
              dragging
              handle={
                <span className="flex items-center px-1 text-slate-400">
                  <GripVertical className="h-4 w-4" />
                </span>
              }
            >
              {renderCard(activeItem)}
            </CardShell>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  column,
  count,
  meta,
  itemIds,
  children,
}: {
  column: KanbanColumnDef;
  count: number;
  meta?: ReactNode;
  itemIds: string[];
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${COLUMN_PREFIX}${column.id}`,
  });

  return (
    <div className="flex w-[280px] shrink-0 flex-col">
      <div
        className={cn(
          "mb-3 rounded-lg border px-3 py-2",
          column.accent
            ? "border-brand-300 bg-brand-50"
            : "border-slate-200 bg-white",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{column.title}</p>
          <span className="rounded-full bg-slate-100 px-2 text-xs font-medium tabular-nums text-slate-500">
            {count}
          </span>
        </div>
        {column.subtitle ? (
          <p className="text-xs text-slate-500">{column.subtitle}</p>
        ) : null}
        {meta ? (
          <div className="mt-0.5 text-xs text-slate-500">{meta}</div>
        ) : null}
      </div>

      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-[120px] flex-1 flex-col gap-2 rounded-lg p-1 transition-colors",
            isOver && "bg-slate-100/70",
          )}
        >
          {itemIds.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-xs text-slate-400">
              Drop here
            </div>
          ) : (
            children
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableCard({ id, children }: { id: string; children: ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
    >
      <CardShell
        handle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            aria-label="Drag"
            className="flex cursor-grab items-center rounded-l-xl px-1 text-slate-300 hover:text-slate-500 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        }
      >
        {children}
      </CardShell>
    </div>
  );
}

function CardShell({
  children,
  handle,
  dragging,
}: {
  children: ReactNode;
  handle: ReactNode;
  dragging?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex touch-none items-stretch gap-1 rounded-xl border border-slate-200 bg-white shadow-sm",
        dragging && "shadow-lg",
      )}
    >
      {handle}
      <div className="min-w-0 flex-1 py-3 pr-3">{children}</div>
    </div>
  );
}
