export class Camera {
  x = 0;
  y = 0;
  zoom = 1;
  private width: number;
  private height: number;

  constructor(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  transform(ctx: CanvasRenderingContext2D) {
    ctx.setTransform(
      this.zoom, 0, 0, this.zoom,
      -this.x * this.zoom + this.width / 2,
      -this.y * this.zoom + this.height / 2
    );
  }

  screenToWorld(sx: number, sy: number) {
    return {
      x: (sx - this.width / 2) / this.zoom + this.x,
      y: (sy - this.height / 2) / this.zoom + this.y,
    };
  }

  worldToScreen(wx: number, wy: number) {
    return {
      x: (wx - this.x) * this.zoom + this.width / 2,
      y: (wy - this.y) * this.zoom + this.height / 2,
    };
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  getWidth() { return this.width; }
  getHeight() { return this.height; }
}
