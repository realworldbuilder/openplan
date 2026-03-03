import { Camera } from './Camera';
import { TimeAxis } from './TimeAxis';
import { Project } from '../model/Project';
import { TaskData } from '../model/types';

const SWIMLANE_HEIGHT = 120;
const SWIMLANE_LABEL_WIDTH = 140;
const TASK_HEIGHT = 32;
const TASK_GAP = 8;
const TASK_RADIUS = 6;
const HEADER_HEIGHT = 40;

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private timeAxis: TimeAxis;
  private project: Project;
  private dirty = true;
  selectedTaskId: string | null = null;

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
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, w, h);

    // World-space rendering
    this.camera.transform(ctx);

    // Grid
    this.timeAxis.renderGrid(ctx, this.camera, h);

    // Swimlanes
    const swimlanes = [...this.project.data.swimlanes].sort((a, b) => a.order - b.order);
    const baseY = 20;

    swimlanes.forEach((sw, i) => {
      const y = baseY + i * SWIMLANE_HEIGHT;
      this.renderSwimlaneBackground(ctx, y, sw.name, i);
      const tasks = this.project.getTasksInSwimlane(sw.id);
      tasks.forEach((task, ti) => {
        this.renderTask(ctx, task, y + 10 + ti * (TASK_HEIGHT + TASK_GAP));
      });
    });

    // Dependencies
    this.renderDependencies(ctx);

    // Today line
    this.timeAxis.renderTodayLine(ctx, this.camera, h);

    // Fixed header (screen-space)
    this.timeAxis.renderHeader(ctx, this.camera);

    // Swimlane labels (screen-space)
    this.renderSwimlaneLabels(ctx, swimlanes, baseY);
  }

  private renderSwimlaneBackground(ctx: CanvasRenderingContext2D, y: number, _name: string, index: number) {
    const topLeft = this.camera.screenToWorld(0, 0);
    const topRight = this.camera.screenToWorld(this.camera.getWidth(), 0);

    ctx.fillStyle = index % 2 === 0 ? 'rgba(0,0,0,0.015)' : 'rgba(0,0,0,0.0)';
    ctx.fillRect(topLeft.x - 2000, y, topRight.x - topLeft.x + 4000, SWIMLANE_HEIGHT);

    // Separator line
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 1 / this.camera.zoom;
    ctx.beginPath();
    ctx.moveTo(topLeft.x - 2000, y + SWIMLANE_HEIGHT);
    ctx.lineTo(topRight.x + 2000, y + SWIMLANE_HEIGHT);
    ctx.stroke();
  }

  private renderSwimlaneLabels(ctx: CanvasRenderingContext2D, swimlanes: typeof this.project.data.swimlanes, baseY: number) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    swimlanes.forEach((sw, i) => {
      const worldY = baseY + i * SWIMLANE_HEIGHT + SWIMLANE_HEIGHT / 2;
      const screenPos = this.camera.worldToScreen(0, worldY);
      const sy = screenPos.y;

      if (sy < HEADER_HEIGHT - 20 || sy > this.camera.getHeight() + 20) return;

      // Label background
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillRect(0, sy - 16, SWIMLANE_LABEL_WIDTH, 32);
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, sy - 16, SWIMLANE_LABEL_WIDTH, 32);

      ctx.fillStyle = '#333';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(sw.name, 12, sy + 4);
    });

    ctx.restore();
  }

  private renderTask(ctx: CanvasRenderingContext2D, task: TaskData, y: number) {
    const startDate = new Date(task.startDate);
    const x = this.timeAxis.dateToX(startDate);
    const w = this.timeAxis.getTaskWidth(startDate, task.duration);

    const isSelected = task.id === this.selectedTaskId;

    // Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 4 / this.camera.zoom;
    ctx.shadowOffsetY = 2 / this.camera.zoom;

    // Bar
    ctx.fillStyle = task.color;
    this.roundRect(ctx, x, y, w, TASK_HEIGHT, TASK_RADIUS / this.camera.zoom);
    ctx.fill();
    ctx.restore();

    // Progress
    if (task.progress > 0) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#000';
      const pw = w * (task.progress / 100);
      this.roundRect(ctx, x, y, pw, TASK_HEIGHT, TASK_RADIUS / this.camera.zoom);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Selection outline
    if (isSelected) {
      ctx.strokeStyle = '#1a73e8';
      ctx.lineWidth = 2 / this.camera.zoom;
      this.roundRect(ctx, x - 1, y - 1, w + 2, TASK_HEIGHT + 2, TASK_RADIUS / this.camera.zoom);
      ctx.stroke();
    }

    // Text
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${11 / this.camera.zoom}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'left';
    const textX = x + 8 / this.camera.zoom;
    const textY = y + TASK_HEIGHT / 2 + 4 / this.camera.zoom;
    const maxTextW = w - 16 / this.camera.zoom;
    if (maxTextW > 10 / this.camera.zoom) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, TASK_HEIGHT);
      ctx.clip();
      ctx.fillText(task.name, textX, textY);
      ctx.restore();
    }
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
    const swimlanes = [...this.project.data.swimlanes].sort((a, b) => a.order - b.order);
    const swIndex = swimlanes.findIndex(s => s.id === task.swimlaneId);
    if (swIndex === -1) return null;
    const tasks = this.project.getTasksInSwimlane(task.swimlaneId);
    const tIndex = tasks.findIndex(t => t.id === task.id);
    if (tIndex === -1) return null;
    return 20 + swIndex * SWIMLANE_HEIGHT + 10 + tIndex * (TASK_HEIGHT + TASK_GAP);
  }

  hitTestTask(worldX: number, worldY: number): TaskData | null {
    const swimlanes = [...this.project.data.swimlanes].sort((a, b) => a.order - b.order);
    for (let si = 0; si < swimlanes.length; si++) {
      const tasks = this.project.getTasksInSwimlane(swimlanes[si].id);
      for (let ti = 0; ti < tasks.length; ti++) {
        const task = tasks[ti];
        const y = 20 + si * SWIMLANE_HEIGHT + 10 + ti * (TASK_HEIGHT + TASK_GAP);
        const startDate = new Date(task.startDate);
        const x = this.timeAxis.dateToX(startDate);
        const w = this.timeAxis.getTaskWidth(startDate, task.duration);
        if (worldX >= x && worldX <= x + w && worldY >= y && worldY <= y + TASK_HEIGHT) {
          return task;
        }
      }
    }
    return null;
  }

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
