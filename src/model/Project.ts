import { ProjectData, TaskData, SwimLaneData } from './types';
import * as Storage from '../io/Storage';

type Listener = () => void;

export class Project {
  data: ProjectData;
  private listeners: Listener[] = [];

  constructor(data: ProjectData) {
    this.data = data;
  }

  onChange(fn: Listener) {
    this.listeners.push(fn);
  }

  private emit() {
    this.listeners.forEach(fn => fn());
    Storage.save(this.data);
  }

  addTask(task: TaskData) {
    this.data.tasks.push(task);
    this.emit();
  }

  removeTask(id: string) {
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    this.data.tasks.forEach(t => {
      t.dependencies = t.dependencies.filter(d => d !== id);
    });
    this.emit();
  }

  updateTask(id: string, updates: Partial<TaskData>) {
    const task = this.data.tasks.find(t => t.id === id);
    if (task) {
      Object.assign(task, updates);
      this.emit();
    }
  }

  addSwimlane(sw: SwimLaneData) {
    this.data.swimlanes.push(sw);
    this.emit();
  }

  getTasksInSwimlane(swimlaneId: string): TaskData[] {
    return this.data.tasks.filter(t => t.swimlaneId === swimlaneId);
  }
}
