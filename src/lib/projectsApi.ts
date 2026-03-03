/**
 * Frontend API client for MongoDB-backed project persistence.
 * Falls back gracefully if the server is unreachable.
 */

const getBaseUrl = () => {
  // In dev, Vite proxy forwards /api → backend server
  return '/api';
};

export interface StoredProject {
  id: string;
  name: string;
  project: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

/**
 * Fetch all projects from MongoDB.
 */
export const fetchProjects = async (): Promise<StoredProject[]> => {
  const res = await fetch(`${getBaseUrl()}/projects`);
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
  return res.json();
};

/**
 * Fetch a single project by ID.
 */
export const fetchProject = async (id: string): Promise<StoredProject> => {
  const res = await fetch(`${getBaseUrl()}/projects/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch project: ${res.status}`);
  return res.json();
};

/**
 * Create a new project in MongoDB.
 */
export const createProject = async (
  name: string,
  project: Record<string, unknown>
): Promise<StoredProject> => {
  const res = await fetch(`${getBaseUrl()}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, project }),
  });
  if (!res.ok) throw new Error(`Failed to create project: ${res.status}`);
  return res.json();
};

/**
 * Update an existing project in MongoDB.
 */
export const updateProject = async (
  id: string,
  data: { name?: string; project?: Record<string, unknown> }
): Promise<StoredProject> => {
  const res = await fetch(`${getBaseUrl()}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update project: ${res.status}`);
  return res.json();
};

/**
 * Delete a project from MongoDB.
 */
export const deleteProjectApi = async (id: string): Promise<void> => {
  const res = await fetch(`${getBaseUrl()}/projects/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete project: ${res.status}`);
};

/**
 * Check if the backend server is reachable.
 */
export const checkHealth = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${getBaseUrl()}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
};
