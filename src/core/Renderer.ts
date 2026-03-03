import { Camera } from './Camera';
import { TimeAxis } from './TimeAxis';
import { Project } from '../model/Project';
import { TaskData } from '../model/types';

const SWIMLANE_PADDING = 14;
const SWIMLANE_LABEL_WIDTH = 140;
const TASK_HEIGHT = 42;
const TASK_GAP = 8;
const TASK_RADIUS = 8;
const HEADER_HEIGHT = 54;
const MIN_SWIMLANE_HEIGHT = 70;

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private timeAxis: TimeAxis;
  private project: Project;
  private dirty = true;
  selectedTaskId: string | null = null;
  private _swimlaneLayout: { id: string; name: string; y: number; height: number }[] = [];

  constructor(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    timeAxis: TimeAxis,
    project: Project,
  ) {
    this.ctx = ctx;
    this.camera = camera;
    this.timeAxis = timeAxis;
    this.project = project;
    this.project.onChange(() => this.markDirty());
  }

  markDirty() { this.dirty = true; }

  start() {
    const loop = () => {
      if (this.dirty) {
        this.dirty = false;
        this.render();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private render() {
    const ctx = this.ctx;
    const w = this.camera.getWidth();
    const h = this.camera.getHeight();

    // Clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, w, h);

    // World-space rendering
    this.camera.transform(ctx);

    // Grid
    this.timeAxis.renderGrid(ctx, this.camera, h);

    // Compute swimlane layout (dynamic height based on task count)
    const swimlanes = [...this.project.data.swimlanes].sort((a, b) => a.order - b.order);
    const baseY = 10;
    const swimlaneLayout: { id: string; name: string; y: number; height: number }[] = [];
    let currentY = baseY;

    for (const sw of swimlanes) {
      const tasks = this.project.getTasksInSwimlane(sw.id);
      const taskCount = Math.max(1, tasks.length);
      const height = Math.max(MIN_SWIMLANE_HEIGHT, SWIMLANE_PADDING * 2 + taskCount * (TASK_HEIGHT + TASK_GAP) - TASK_GAP);
      swimlaneLayout.push({ id: sw.id, name: sw.name, y: currentY, height });
      currentY += height;
    }

    // Store for hit testing
    this._swimlaneLayout = swimlaneLayout;

    // Render swimlane backgrounds
    swimlaneLayout.forEach((sl, i) => {
      this.renderSwimlaneBackground(ctx, sl.y, sl.name, i, sl.height);
    });

    // Render tasks
    for (const sl of swimlaneLayout) {
      const tasks = this.project.getTasksInSwimlane(sl.id);
      tasks.forEach((task, ti) => {
        this.renderTask(ctx, task, sl.y + SWIMLANE_PADDING + ti * (TASK_HEIGHT + TASK_GAP));
      });
    }

    // Dependencies
    this.renderDependencies(ctx);

    // Today line
    this.timeAxis.renderTodayLine(ctx, this.camera, h);

    // Fixed header (screen-space)
    this.timeAxis.renderHeader(ctx, this.camera);

    // Swimlane labels (screen-space)
    this.renderSwimlaneLabelsNew(ctx, swimlaneLayout);
  }

  private renderSwimlaneBackground(ctx: CanvasRenderingContext2D, y: number, _name: string, index: number, height: number) {
    const topLeft = this.camera.screenToWorld(0, 0);
    const topRight = this.camera.screenToWorld(this.camera.getWidth(), 0);

    ctx.fillStyle = index % 2 === 0 ? 'rgba(0,0,0,0.025)' : 'rgba(0,0,0,0.0)';
    ctx.fillRect(topLeft.x - 5000, y, topRight.x - topLeft.x + 10000, height);

    // Separator line
    ctx.strokeStyle = '#d5d5d5';
    ctx.lineWidth = 1 / this.camera.zoom;
    ctx.beginPath();
    ctx.moveTo(topLeft.x - 5000, y + height);
    ctx.lineTo(topRight.x + 5000, y + height);
    ctx.stroke();
  }

  private renderSwimlaneLabelsNew(ctx: CanvasRenderingContext2D, layout: { id: string; name: string; y: number; height: number }[]) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    for (const sl of layout) {
      const worldY = sl.y + sl.height / 2;
      const screenPos = this.camera.worldToScreen(0, worldY);
      const sy = screenPos.y;

      const dpr = window.devicePixelRatio || 1;
      if (sy < HEADER_HEIGHT * dpr - 30 || sy > this.camera.getHeight() + 30) continue;

      const labelH = 34 * dpr;
      const labelW = SWIMLANE_LABEL_WIDTH * dpr;
      const lx = 12 * dpr;
      const ly = sy - labelH / 2;
      const r = 8 * dpr;

      // Background pill with shadow
      ctx.fillStyle = 'rgba(255,255,255,0.97)';
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 6 * dpr;
      ctx.shadowOffsetY = 2 * dpr;
      ctx.beginPath();
      ctx.roundRect(lx, ly, labelW, labelH, r);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = dpr;
      ctx.beginPath();
      ctx.roundRect(lx, ly, labelW, labelH, r);
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.font = `800 ${14 * dpr}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(sl.name, lx + 14 * dpr, sy);
    }

    ctx.restore();
  }

  private renderTask(ctx: CanvasRenderingContext2D, task: TaskData, y: number) {
    const startDate = new Date(task.startDate);
    const x = this.timeAxis.dateToX(startDate);
    const w = Math.max(this.timeAxis.getTaskWidth(startDate, task.duration), 60 / this.camera.zoom);
    const r = TASK_RADIUS / this.camera.zoom;
    const isSelected = task.id === this.selectedTaskId;

    // Shadow
    ctx.save();
    ctx.shadowColor = isSelected ? 'rgba(26,115,232,0.35)' : 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = (isSelected ? 10 : 6) / this.camera.zoom;
    ctx.shadowOffsetY = 3 / this.camera.zoom;

    // Bar
    ctx.fillStyle = task.color || '#9E9E9E';
    ctx.beginPath();
    ctx.roundRect(x, y, w, TASK_HEIGHT, r);
    ctx.fill();
    ctx.restore();

    // Subtle border
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1 / this.camera.zoom;
    ctx.beginPath();
    ctx.roundRect(x, y, w, TASK_HEIGHT, r);
    ctx.stroke();

    // Progress overlay
    if (task.progress > 0 && task.progress < 100) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#000';
      const pw = w * (task.progress / 100);
      ctx.beginPath();
      ctx.roundRect(x, y, pw, TASK_HEIGHT, r);
      ctx.fill();
      ctx.restore();
    }

    // Selection outline
    if (isSelected) {
      ctx.strokeStyle = '#1a73e8';
      ctx.lineWidth = 2.5 / this.camera.zoom;
      ctx.beginPath();
      ctx.roundRect(x - 1.5 / this.camera.zoom, y - 1.5 / this.camera.zoom, w + 3 / this.camera.zoom, TASK_HEIGHT + 3 / this.camera.zoom, r);
      ctx.stroke();
    }

    // Text — clip to bar
    const pad = 10 / this.camera.zoom;
    const textW = w - pad * 2;
    if (textW < 20 / this.camera.zoom) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, TASK_HEIGHT);
    ctx.clip();

    // Task name — bold white, crisp
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Scale font size but clamp to stay readable
    const nameSize = Math.max(12, 15 / this.camera.zoom);
    ctx.font = `700 ${nameSize}px -apple-system, BlinkMacSystemFont, sans-serif`;

    // Add text shadow for extra readability
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 2 / this.camera.zoom;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1 / this.camera.zoom;
    ctx.fillText(task.name, x + pad, y + TASK_HEIGHT / 2 - 8 / this.camera.zoom);
    ctx.shadowColor = 'transparent';

    // Duration + crew subtitle
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const subSize = Math.max(10, 12 / this.camera.zoom);
    ctx.font = `500 ${subSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
    const subtitle = `${task.duration}d` + (task.crewSize > 1 ? ` · ${task.crewSize} crew` : '');
    ctx.fillText(subtitle, x + pad, y + TASK_HEIGHT / 2 + 9 / this.camera.zoom);

    ctx.restore();
  }

  private renderDependencies(ctx: CanvasRenderingContext2D) {
    const tasks = this.project.data.tasks;
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    for (const task of tasks) {
      for (const depId of task.dependencies) {
        const dep = taskMap.get(depId);
        if (!dep) continue;

        const depStart = new Date(dep.startDate);
        const depEndX = this.timeAxis.dateToX(depStart) + this.timeAxis.getTaskWidth(depStart, dep.duration);
        const depY = this.getTaskScreenY(dep);

        const taskStartX = this.timeAxis.dateToX(new Date(task.startDate));
        const taskY = this.getTaskScreenY(task);

        if (depY === null || taskY === null) continue;

        const fromX = depEndX;
        const fromY = depY + TASK_HEIGHT / 2;
        const toX = taskStartX;
        const toY = taskY + TASK_HEIGHT / 2;

        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1.5 / this.camera.zoom;
        ctx.beginPath();
        const midX = fromX + (toX - fromX) / 2;
        ctx.moveTo(fromX, fromY);
        ctx.bezierCurveTo(midX, fromY, midX, toY, toX, toY);
        ctx.stroke();

        // Arrow
        ctx.fillStyle = '#999';
        ctx.beginPath();
        const s = 5 / this.camera.zoom;
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - s, toY - s);
        ctx.lineTo(toX - s, toY + s);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  private getTaskScreenY(task: TaskData): number | null {
    const sl = this._swimlaneLayout.find(s => s.id === task.swimlaneId);
    if (!sl) return null;
    const tasks = this.project.getTasksInSwimlane(task.swimlaneId);
    const tIndex = tasks.findIndex(t => t.id === task.id);
    if (tIndex === -1) return null;
    return sl.y + SWIMLANE_PADDING + tIndex * (TASK_HEIGHT + TASK_GAP);
  }

  hitTestTask(worldX: number, worldY: number): TaskData | null {
    for (const sl of this._swimlaneLayout) {
      const tasks = this.project.getTasksInSwimlane(sl.id);
      for (let ti = 0; ti < tasks.length; ti++) {
        const task = tasks[ti];
        const y = sl.y + SWIMLANE_PADDING + ti * (TASK_HEIGHT + TASK_GAP);
        const startDate = new Date(task.startDate);
        const x = this.timeAxis.dateToX(startDate);
        const w = Math.max(this.timeAxis.getTaskWidth(startDate, task.duration), 60);
        if (worldX >= x && worldX <= x + w && worldY >= y && worldY <= y + TASK_HEIGHT) {
          return task;
        }
      }
    }
    return null;
  }

  get swimlaneLayout() { return this._swimlaneLayout; }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
