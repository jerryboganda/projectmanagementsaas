"use client";

import { useMemo, useState } from "react";
import { CalendarToolbar } from "./calendar-toolbar";
import { CalendarSurface } from "./calendar-surface";
import { CalendarDetail } from "./calendar-detail";
import { CreateEventModal } from "./create-event-modal";
import { AnimatePresence } from "motion/react";
import { useCalendarData } from "@/hooks/use-calendar-data";
import type { CreateCalendarItemInput, UpdateCalendarItemInput } from "./data";
import { AlertCircle, CalendarDays, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export type ViewMode = "month" | "week" | "day" | "agenda";

export function CalendarLayout() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    items,
    projects,
    isLoading,
    error,
    createCalendarItem,
    updateCalendarItem,
    deleteCalendarItem,
  } = useCalendarData(currentDate, viewMode);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) => {
      const projectName = projects.find((project) => project.id === item.linkedProjectId)?.name ?? "";
      return [
        item.title,
        item.description ?? "",
        item.type,
        item.recurrenceRule ?? "",
        projectName,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [items, projects, searchQuery]);

  const selectedItem = useMemo(() => {
    return items.find(item => item.id === selectedItemId) || null;
  }, [items, selectedItemId]);

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;
  const isSearching = searchQuery.trim().length > 0;
  const isInitialLoading = isLoading && filteredItems.length === 0;

  const handleCreateEvent = async (input: CreateCalendarItemInput) => {
    await createCalendarItem(input);
  };

  const handleUpdateEvent = async (id: string, updates: UpdateCalendarItemInput) => {
    await updateCalendarItem(id, updates);
  };

  const handleDeleteEvent = async (id: string) => {
    await deleteCalendarItem(id);
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-dark relative">
      <CalendarToolbar 
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        itemCount={filteredItems.length}
        onNewEvent={() => setIsCreateModalOpen(true)}
      />

      {errorMessage && (
        <div className="mx-6 mt-4 rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">Live calendar data could not be loaded.</div>
              <div className="text-rose-200/80">{errorMessage}</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        {isInitialLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-[13px]">Loading calendar items...</span>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex-1">
            <EmptyState
              icon={CalendarDays}
              title={isSearching ? "No events match your search" : "No calendar items yet"}
              description={isSearching
                ? "Try a different search term or clear the search box."
                : "Create a calendar item to start populating this view."}
              actionLabel="New Event"
              onAction={() => setIsCreateModalOpen(true)}
            />
          </div>
        ) : (
          <CalendarSurface 
            items={filteredItems}
            currentDate={currentDate}
            viewMode={viewMode}
            selectedItemId={selectedItemId}
            onItemSelect={setSelectedItemId}
            projects={projects}
          />
        )}

        <AnimatePresence>
          {selectedItem && (
            <div className="absolute top-0 right-0 bottom-0 z-20">
              <CalendarDetail 
                key={selectedItem.id}
                item={selectedItem} 
                projects={projects}
                onSave={handleUpdateEvent}
                onDelete={handleDeleteEvent}
                onClose={() => setSelectedItemId(null)} 
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        projects={projects}
        onCreateItem={handleCreateEvent}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
