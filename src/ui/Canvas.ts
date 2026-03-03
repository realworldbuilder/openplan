import { Camera } from '../core/Camera';
import { TaskData, ProjectData } from '../model/types';
import { getTradeColor } from '../model/Trade';

const HEADER_HEIGHT = 60;
const ROW_HEIGHT = 50;
const DAY_WIDTH = 40;
const TASK_HEIGHT = 32;
const TASK_Y_OFFSET = (ROW_HEIGHT - TASK_HEIGHT) / 2;

export class CanvasController {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private project: ProjectData | null = null;

  // Pan state
  private isPanning = false;
  private panStart = { x: 0, y: 0 };
  private camStart = { x: 0, y: 0 };

  // Drag task state
  private draggingTask: TaskData | null = null;
  private dragStartX = 0;
  private dragOrigDate = '';

  // Touch state
  private lastPinchDist = 0;
  private lastTouchCenter = { x: 0, y: 0 };

  onTaskClick: ((task: TaskData) => void) | null = null;
  onTaskDrag: ((task: TaskData, newStartDate: string) => void) | null = null;
  onDoubleClick: ((date: string, swimlaneId: string) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.camera = new Camera(canvas.width, canvas.height);
    this.setupEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setProject(p: ProjectData) { this.project = p; }
  getCamera() { return this.camera; }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = (window.innerHeight - 48) * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = (window.innerHeight - 48) + 'px';
    this.camera.resize(this.canvas.width, this.canvas.height);
  }

  private setupEvents() {
    const c = this.canvas;

    // Mouse
    c.addEventListener('mousedown', (e) => this.onMouseDown(e));
    c.addEventListener('mousemove', (e) => this.onMouseMove(e));
    c.addEventListener('mouseup', () => this.onMouseUp());
    c.addEventListener('mouseleave', () => this.onMouseUp());
    c.addEventListener('wheel', (e) => { e.preventDefault(); this.onWheel(e); }, { passive: false });
    c.addEventListener('dblclick', (e) => this.onDblClick(e));

    // Touch
    c.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    c.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    c.addEventListener('touchend', () => this.onTouchEnd());
  }

  private screenToCanvas(e: MouseEvent | Touch): { x: number; y: number } {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * dpr, y: (e.clientY - rect.top) * dpr };
  }

  private onMouseDown(e: MouseEvent) {
    const { x, y } = this.screenToCanvas(e);
    const world = this.camera.screenToWorld(x, y);
    const task = this.hitTest(world.x, world.y);
    if (task) {
      this.draggingTask = task;
      this.dragStartX = world.x;
      this.dragOrigDate = task.startDate;
      this.canvas.style.cursor = 'grabbing';
    } else {
      this.isPanning = true;
      this.panStart = { x, y };
      this.camStart = { x: this.camera.x, y: this.camera.y };
      this.canvas.style.cursor = 'grabbing';
    }
  }

  private onMouseMove(e: MouseEvent) {
    const { x, y } = this.screenToCanvas(e);
    if (this.isPanning) {
      const dx = (x - this.panStart.x) / this.camera.zoom;
      const dy = (y - this.panStart.y) / this.camera.zoom;
      this.camera.x = this.camStart.x - dx;
      this.camera.y = this.camStart.y - dy;
    } else if (this.draggingTask) {
      const world = this.camera.screenToWorld(x, y);
      const dayDelta = Math.round((world.x - this.dragStartX) / DAY_WIDTH);
      const orig = new Date(this.dragOrigDate + 'T00:00:00');
      const newDate = new Date(orig.getTime() + dayDelta * 86400000);
      this.draggingTask.startDate = newDate.toISOString().split('T')[0];
    } else {
      // Hover cursor
      const world = this.camera.screenToWorld(x, y);
      const task = this.hitTest(world.x, world.y);
      this.canvas.style.cursor = task ? 'pointer' : 'default';
    }
  }

  private onMouseUp() {
    if (this.draggingTask) {
      if (this.draggingTask.startDate !== this.dragOrigDate) {
        this.onTaskDrag?.(this.draggingTask, this.draggingTask.startDate);
      } else {
        this.onTaskClick?.(this.draggingTask);
      }
      this.draggingTask = null;
    }
    this.isPanning = false;
    this.canvas.style.cursor = 'default';
  }

  private onWheel(e: WheelEvent) {
    const { x, y } = this.screenToCanvas(e);
    const worldBefore = this.camera.screenToWorld(x, y);
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    this.camera.zoom = Math.max(0.1, Math.min(5, this.camera.zoom * factor));
    const worldAfter = this.camera.screenToWorld(x, y);
    this.camera.x -= (worldAfter.x - worldBefore.x);
    this.camera.y -= (worldAfter.y - worldBefore.y);
  }

  private onDblClick(e: MouseEvent) {
    const { x, y } = this.screenToCanvas(e);
    const world = this.camera.screenToWorld(x, y);
    const task = this.hitTest(world.x, world.y);
    if (task) return; // Double-click on task does nothing extra

    if (!this.project) return;
    const projectStart = new Date(this.project.startDate + 'T00:00:00');
    const dayOffset = Math.floor(world.x / DAY_WIDTH);
    const clickDate = new Date(projectStart.getTime() + dayOffset * 86400000);
    const dateStr = clickDate.toISOString().split('T')[0];

    const swimlaneIdx = Math.floor((world.y - HEADER_HEIGHT) / ROW_HEIGHT);
    const swimlanes = this.project.swimlanes.length ? this.project.swimlanes : [{ id: 'default', name: 'General', order: 0 }];
    const sl = swimlanes[Math.max(0, Math.min(swimlaneIdx, swimlanes.length - 1))];
    this.onDoubleClick?.(dateStr, sl.id);
  }

  // Touch
  private onTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const { x, y } = this.screenToCanvas(t);
      this.isPanning = true;
      this.panStart = { x, y };
      this.camStart = { x: this.camera.x, y: this.camera.y };
    } else if (e.touches.length === 2) {
      this.isPanning = false;
      this.lastPinchDist = this.pinchDist(e);
      const c = this.pinchCenter(e);
      this.lastTouchCenter = this.screenToCanvas(c as any);
    }
  }

  private onTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1 && this.isPanning) {
      const t = e.touches[0];
      const { x, y } = this.screenToCanvas(t);
      const dx = (x - this.panStart.x) / this.camera.zoom;
      const dy = (y - this.panStart.y) / this.camera.zoom;
      this.camera.x = this.camStart.x - dx;
      this.camera.y = this.camStart.y - dy;
    } else if (e.touches.length === 2) {
      const dist = this.pinchDist(e);
      const factor = dist / this.lastPinchDist;
      this.camera.zoom = Math.max(0.1, Math.min(5, this.camera.zoom * factor));
      this.lastPinchDist = dist;
    }
  }

  private onTouchEnd() {
    this.isPanning = false;
  }

  private pinchDist(e: TouchEvent): number {
    const [a, b] = [e.touches[0], e.touches[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  private pinchCenter(e: TouchEvent): { clientX: number; clientY: number } {
    const [a, b] = [e.touches[0], e.touches[1]];
    return { clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 };
  }

  hitTest(worldX: number, worldY: number): TaskData | null {
    if (!this.project) return null;
    const projectStart = new Date(this.project.startDate + 'T00:00:00');
    const swimlanes = this.project.swimlanes.length ? this.project.swimlanes : [{ id: 'default', name: 'General', order: 0 }];

    for (const task of this.project.tasks) {
      const slIdx = swimlanes.findIndex(s => s.id === task.swimlaneId);
      const row = slIdx >= 0 ? slIdx : 0;
      const taskStart = new Date(task.startDate + 'T00:00:00');
      const dayOffset = Math.round((taskStart.getTime() - projectStart.getTime()) / 86400000);
      const tx = dayOffset * DAY_WIDTH;
      const ty = HEADER_HEIGHT + row * ROW_HEIGHT + TASK_Y_OFFSET;
      const tw = task.duration * DAY_WIDTH;

      if (worldX >= tx && worldX <= tx + tw && worldY >= ty && worldY <= ty + TASK_HEIGHT) {
        return task;
      }
    }
    return null;
  }
}
