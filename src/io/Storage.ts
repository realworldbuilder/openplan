import { ProjectData } from '../model/types';

const PREFIX = 'openplan:project:';

export function save(project: ProjectData): void {
  project.updatedAt = new Date().toISOString();
  localStorage.setItem(PREFIX + project.id, JSON.stringify(project));
}

export function load(id: string): ProjectData | null {
  const raw = localStorage.getItem(PREFIX + id);
  return raw ? JSON.parse(raw) : null;
}

export function loadAny(): ProjectData | null {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    }
  }
  return null;
}

export function listProjects(): { id: string; name: string }[] {
  const results: { id: string; name: string }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const p = JSON.parse(raw);
        results.push({ id: p.id, name: p.name });
      }
    }
  }
  return results;
}
