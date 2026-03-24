"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { InboxFilterRail } from "./inbox-filter-rail";
import { InboxList } from "./inbox-list";
import { InboxDetail } from "./inbox-detail";
import { AnimatePresence } from "motion/react";
import { Inbox, Loader2, TriangleAlert } from "lucide-react";
import { useInbox } from "@/contexts/inbox-context";

export function InboxLayout() {
  const { items, unreadCount, isLoading, isError, refetch, markAsRead, markAllAsRead, archive } =
    useInbox();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState("inbox");
  const [savedState, setSavedState] = useState<Record<string, boolean>>({});
  const [doneState, setDoneState] = useState<Record<string, boolean>>({});

  const displayItems = items.map((item) => ({
    ...item,
    saved: !!savedState[item.id],
    done: !!doneState[item.id],
  }));

  const effectiveSelectedId =
    selectedId === undefined ? (displayItems[0]?.id ?? null) : selectedId;
  const selectedItem = displayItems.find((item) => item.id === effectiveSelectedId) ?? null;

  async function runInboxAction(action: () => Promise<void>, title: string, message: string) {
    try {
      await action();
    } catch {
      toast({
        type: "error",
        title,
        message,
      });
    }
  }

  const handleMarkAsRead = (id: string) => {
    void runInboxAction(
      async () => {
        await markAsRead(id);
      },
      "Could not update notification",
      "We couldn't mark that notification as read. Please try again.",
    );
  };

  const handleArchive = (id: string) => {
    void runInboxAction(
      async () => {
        await archive(id);
        if (effectiveSelectedId === id) {
          setSelectedId(undefined);
        }
      },
      "Could not archive notification",
      "We couldn't archive that notification. Please try again.",
    );
  };

  const handleMarkAllAsRead = () => {
    void runInboxAction(
      async () => {
        await markAllAsRead();
      },
      "Could not update notifications",
      "We couldn't mark all notifications as read. Please try again.",
    );
  };

  const handleSave = (id: string) => {
    setSavedState((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const handleDone = (id: string) => {
    setDoneState((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-background-dark relative">
      <div className="hidden md:flex h-full">
        <InboxFilterRail activeFilter={activeFilter} onSelectFilter={setActiveFilter} unreadCount={unreadCount} />
      </div>

      {isError ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={TriangleAlert}
            title="Inbox unavailable"
            description="We couldn't load your notifications for this workspace."
            actionLabel="Retry"
            onAction={() => {
              void refetch();
            }}
            className="w-full"
          />
        </div>
      ) : isLoading ? (
        <>
          <div className="w-full md:w-[420px] flex-shrink-0 border-r border-neutral-border bg-background-dark flex flex-col items-center justify-center">
            <Loader2 className="size-6 text-slate-500 animate-spin" />
            <p className="text-[13px] text-slate-400 mt-4">Loading inbox...</p>
          </div>
          <div className="hidden md:flex flex-1 items-center justify-center border-l border-neutral-border bg-neutral-surface/30" />
        </>
      ) : (
        <>
          <div className="w-full md:w-[420px] flex-shrink-0 h-full flex flex-col">
            <InboxList 
              items={displayItems} 
              activeFilter={activeFilter} 
              onSelectFilter={setActiveFilter}
              selectedId={effectiveSelectedId} 
              onSelect={setSelectedId} 
              onMarkAsRead={handleMarkAsRead}
              onArchive={handleArchive}
              onMarkAllAsRead={handleMarkAllAsRead}
              onSave={handleSave}
              onDone={handleDone}
            />
          </div>

          <AnimatePresence mode="wait">
            {selectedItem ? (
              <div className="absolute inset-0 z-20 md:relative md:inset-auto md:z-auto md:flex-1 flex flex-col bg-background-dark">
                <InboxDetail 
                  key={selectedItem.id} 
                  item={selectedItem} 
                  onClose={() => setSelectedId(null)}
                  onMarkAsRead={() => handleMarkAsRead(selectedItem.id)}
                  onArchive={() => handleArchive(selectedItem.id)}
                  onSave={() => handleSave(selectedItem.id)}
                  onDone={() => handleDone(selectedItem.id)}
                />
              </div>
            ) : (
              <div className="hidden md:flex flex-1 items-center justify-center border-l border-neutral-border bg-neutral-surface/30">
                <div className="text-center space-y-3">
                  <div className="size-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                    <Inbox className="size-6 text-slate-500" />
                  </div>
                  <p className="text-[13px] text-slate-400">Select an item to view details</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
