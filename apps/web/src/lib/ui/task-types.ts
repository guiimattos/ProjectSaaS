export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskDTO = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  assigneeId: string | null;
  projectId: string | null;
  project: { id: string; name: string; color: string | null } | null;
  assignee: { id: string; name: string | null; email: string; image: string | null } | null;
};
export type ProjectDTO = { id: string; name: string; color: string | null };
export type MemberDTO = { id: string; name: string | null; email: string; image: string | null };

export const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
export const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const serializeTask = (t: unknown) => JSON.parse(JSON.stringify(t)) as TaskDTO;
