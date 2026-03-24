"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { FolderKanban } from "lucide-react";
import { CreateProjectModal } from "./create-project-modal";
import { ProjectDetail } from "./project-detail";
import { ProjectsGrid } from "./projects-grid";
import { ProjectsList } from "./projects-list";
import { ProjectsToolbar } from "./projects-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { useProjectsData } from "@/hooks/use-projects-data";

export type ViewMode = "list" | "grid";

export function ProjectsLayout() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedProjectOverride, setSelectedProjectOverride] = useState<string | null | undefined>(
    undefined,
  );
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const selectedProjectId = selectedProjectOverride ?? searchParams.get("projectId");

  const {
    projects,
    projectsQuery,
    selectedProject,
    toggleFavorite,
    updateProject,
    isUpdatingProject,
  } = useProjectsData(selectedProjectId);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const normalizedSearch = searchQuery.toLowerCase();
      const matchesSearch =
        project.name.toLowerCase().includes(normalizedSearch) ||
        project.identifier.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "All" || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background-dark">
      <ProjectsToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        projectCount={filteredProjects.length}
        onNewProject={() => setIsCreateModalOpen(true)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <div
          className={`flex flex-1 flex-col overflow-y-auto transition-all duration-300 ${
            selectedProjectId ? "md:mr-[400px]" : ""
          }`}
        >
          {projectsQuery.isError ? (
            <div className="mx-6 mt-6 flex flex-col gap-3 rounded-sm border border-rose-500/20 bg-rose-500/10 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Projects could not be loaded
                </p>
                <p className="mt-1 text-[12px] text-slate-400">
                  The workspace is still available, but the live project list needs another
                  fetch.
                </p>
              </div>
              <button
                onClick={() => void projectsQuery.refetch()}
                className="rounded-sm border border-rose-500/30 px-3 py-1.5 text-[12px] font-medium text-rose-200 transition-colors hover:bg-rose-500/10"
              >
                {projectsQuery.isFetching ? "Retrying..." : "Retry"}
              </button>
            </div>
          ) : null}

          {projectsQuery.isLoading ? (
            <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`project-loading-${index}`}
                  className="rounded-md border border-neutral-border bg-neutral-surface/30 p-4"
                >
                  <div className="mb-4 h-4 w-24 rounded bg-white/5" />
                  <div className="mb-2 h-5 w-2/3 rounded bg-white/5" />
                  <div className="mb-6 h-4 w-full rounded bg-white/5" />
                  <div className="mb-3 h-2 w-full rounded bg-white/5" />
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 rounded-full bg-white/5" />
                    <div className="h-4 w-24 rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title={
                searchQuery || statusFilter !== "All" ? "No projects found" : "No projects yet"
              }
              description={
                searchQuery || statusFilter !== "All"
                  ? "Try adjusting your search or filter criteria."
                  : "Create your first workspace project to organize real delivery work."
              }
              actionLabel="New Project"
              onAction={() => setIsCreateModalOpen(true)}
            />
          ) : (
            <div className="p-6">
              {viewMode === "list" ? (
                <ProjectsList
                  projects={filteredProjects}
                  selectedId={selectedProjectId}
                  onSelect={setSelectedProjectOverride}
                  onToggleFavorite={(projectId) => void toggleFavorite(projectId)}
                  onNewProject={() => setIsCreateModalOpen(true)}
                />
              ) : (
                <ProjectsGrid
                  projects={filteredProjects}
                  selectedId={selectedProjectId}
                  onSelect={setSelectedProjectOverride}
                  onToggleFavorite={(projectId) => void toggleFavorite(projectId)}
                  onNewProject={() => setIsCreateModalOpen(true)}
                />
              )}
            </div>
          )}
        </div>

        <AnimatePresence>
          {selectedProject ? (
            <ProjectDetail
              key={`${selectedProject.id}-${selectedProject.updatedAt}`}
              project={selectedProject}
              onClose={() => setSelectedProjectOverride(null)}
              onToggleFavorite={() => void toggleFavorite(selectedProject.id)}
              onUpdate={(projectId, updates) => void updateProject(projectId, updates)}
              isSaving={isUpdatingProject}
            />
          ) : null}
        </AnimatePresence>
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
