import { Camera } from './Camera';

const HEADER_HEIGHT = 54;
const PIXELS_PER_DAY = 50;
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export class TimeAxis {
  projectStart: Date;

  constructor(projectStart: Date) {
    this.projectStart = new Date(projectStart);
    this.projectStart.setHours(0, 0, 0, 0);
  }

  get headerHeight() { return HEADER_HEIGHT; }
  get pixelsPerDay() { return PIXELS_PER_DAY; }

  dateToX(date: Date): number {
    const ms = date.getTime() - this.projectStart.getTime();
    return (ms / 86400000) * PIXELS_PER_DAY;
  }

  xToDate(x: number): Date {
    const days = x / PIXELS_PER_DAY;
    const d = new Date(this.projectStart);
    d.setDate(d.getDate() + Math.floor(days));
    return d;
  }

  businessDaysToPixels(days: number): number {
    return days * (7 / 5) * PIXELS_PER_DAY;
  }

  /** Get pixel width for a task starting at startDate with N business days */
  getTaskWidth(startDate: Date, businessDays: number): number {
    const end = this.addBusinessDays(startDate, businessDays);
    return this.dateToX(end) - this.dateToX(startDate);
  }

  addBusinessDays(start: Date, days: number): Date {
    const d = new Date(start);
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) added++;
    }
    return d;
  }

  renderGrid(ctx: CanvasRenderingContext2D, camera: Camera, canvasHeight: number) {
    const topLeft = camera.screenToWorld(0, 0);
    const bottomRight = camera.screenToWorld(camera.getWidth(), canvasHeight);

    const startDate = this.xToDate(topLeft.x - PIXELS_PER_DAY);
    const endDate = this.xToDate(bottomRight.x + PIXELS_PER_DAY);

    const d = new Date(startDate);
    d.setHours(0, 0, 0, 0);

    while (d <= endDate) {
      const x = this.dateToX(d);
      const dow = d.getDay();

      // Weekend shading
      if (dow === 0 || dow === 6) {
        ctx.fillStyle = 'rgba(0,0,0,0.02)';
        ctx.fillRect(x, topLeft.y - 1000, PIXELS_PER_DAY, bottomRight.y - topLeft.y + 2000);
      }

      // Grid line
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 0.7 / camera.zoom;
      ctx.beginPath();
      ctx.moveTo(x, topLeft.y - 1000);
      ctx.lineTo(x, bottomRight.y + 1000);
      ctx.stroke();

      d.setDate(d.getDate() + 1);
    }
  }

  renderTodayLine(ctx: CanvasRenderingContext2D, camera: Camera, canvasHeight: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const x = this.dateToX(today);

    const topLeft = camera.screenToWorld(0, 0);
    const bottomRight = camera.screenToWorld(0, canvasHeight);

    ctx.save();
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2 / camera.zoom;
    ctx.setLineDash([6 / camera.zoom, 4 / camera.zoom]);
    ctx.beginPath();
    ctx.moveTo(x, topLeft.y - 1000);
    ctx.lineTo(x, bottomRight.y + 1000);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  renderHeader(ctx: CanvasRenderingContext2D, camera: Camera) {
    // Reset transform for fixed header
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const w = camera.getWidth();

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, HEADER_HEIGHT);

    // Subtle shadow
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    ctx.fillRect(0, HEADER_HEIGHT, w, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.02)';
    ctx.fillRect(0, HEADER_HEIGHT + 1, w, 1);

    // Bottom border
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HEADER_HEIGHT);
    ctx.lineTo(w, HEADER_HEIGHT);
    ctx.stroke();

    // Compute visible dates
    const topLeft = camera.screenToWorld(0, 0);
    const topRight = camera.screenToWorld(w, 0);
    const startDate = this.xToDate(topLeft.x - PIXELS_PER_DAY * 2);
    const endDate = this.xToDate(topRight.x + PIXELS_PER_DAY * 2);

    const d = new Date(startDate);
    d.setHours(0, 0, 0, 0);

    let lastMonth = -1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (d <= endDate) {
      const x = this.dateToX(d);
      const screenPos = camera.worldToScreen(x, 0);
      const dayWidth = PIXELS_PER_DAY * camera.zoom;

      // Month label (on first day of month or first visible)
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        ctx.fillStyle = '#1a1a1a';
        ctx.font = '700 13px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, screenPos.x + 4, 18);
      }

      // Day number (only if zoom makes them readable)
      if (dayWidth > 20) {
        const dow = d.getDay();
        const isToday = d.getTime() === today.getTime();
        const isWeekend = dow === 0 || dow === 6;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (isToday) {
          // Today highlight circle
          ctx.fillStyle = '#e74c3c';
          ctx.beginPath();
          ctx.arc(screenPos.x + dayWidth / 2, 40, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = '700 11px -apple-system, BlinkMacSystemFont, sans-serif';
        } else {
          ctx.fillStyle = isWeekend ? '#aaa' : '#444';
          ctx.font = `${dayWidth > 30 ? '500 12' : '11'}px -apple-system, BlinkMacSystemFont, sans-serif`;
        }

        ctx.fillText(String(d.getDate()), screenPos.x + dayWidth / 2, 40);
        ctx.textAlign = 'left';
      }

      d.setDate(d.getDate() + 1);
    }

    ctx.restore();
  }
}
