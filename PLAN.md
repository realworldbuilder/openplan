# OpenPlan — Rebuild Plan

## What Is It
Free, open-source construction scheduling tool. P6 killer for subs.
Infinite canvas Gantt chart. Pure client-side. Zero backend for MVP.

## Stack
- **Vite + TypeScript** (vanilla, no React)
- **HTML5 Canvas** — infinite pan/zoom Gantt
- **localStorage** for persistence
- **Vercel** for deploy

## Architecture (Clean)

```
src/
  core/
    Camera.ts        — pan/zoom transform (world ↔ screen)
    TimeAxis.ts      — date grid, header rendering, today line
    Renderer.ts      — main render loop, requestAnimationFrame
  model/
    Project.ts       — project state container
    Task.ts          — task data model (id, name, start, duration, trade, deps, swimlane)
    Swimlane.ts      — swimlane/zone model
    Trade.ts         — trade definitions + colors
    types.ts         — shared interfaces
  engine/
    CPM.ts           — forward/backward pass (Phase 2, stub for now)
    Scheduler.ts     — auto-layout tasks in swimlanes
  ui/
    Canvas.ts        — canvas element, mouse/touch events, delegates to Renderer
    Toolbar.ts       — top bar (project name, actions)
    Sidebar.ts       — right panel (task details, add task, trade filters)
    FloatingBar.ts   — bottom action bar
    TaskDialog.ts    — add/edit task modal
  io/
    Storage.ts       — localStorage read/write
    XerExport.ts     — P6 XER format export
    PdfExport.ts     — jsPDF export
    JsonShare.ts     — share as JSON URL/file
  index.ts           — entry point, wires everything
index.html
```

## MVP Scope (Phase 1 — what we ship NOW)

### Must Have
1. **Infinite canvas** with pan (drag) and zoom (scroll/pinch)
2. **Time axis** — months + days in fixed header, grid lines in canvas
3. **Today line** — red dashed vertical line
4. **Tasks as colored bars** — rounded rect, trade color, name + duration text
5. **Swimlanes** — horizontal groupings (labeled on left)
6. **Add task** — dialog or sidebar form (name, trade, start date, duration, crew, swimlane)
7. **Drag tasks** — horizontal to reschedule
8. **Trade colors** — predefined set (electrical=blue, plumbing=green, etc.)
9. **localStorage** save/load — auto-save on every change
10. **Toolbar** — project name, hamburger toggle
11. **Floating action bar** — add task, toggle sidebar, zoom to fit, settings
12. **Light theme** — clean, professional, Notion-like
13. **Deploy to Vercel**

### Nice to Have (Phase 1.5)
- Dependencies (FS lines between tasks)
- XER export
- PDF export
- Multiple projects
- Trade filter toggles

### Phase 2 — CPM Engine
- Forward/backward pass
- Early/late start, float
- Critical path highlighting
- Auto-scheduling

### Phase 3 — Growth
- AI Composer (GPT/Claude function-calling)
- Auth + cloud sync (Supabase)
- Template marketplace
- Lookahead generator
- Mobile support
- Share as URL

## Key Design Decisions
- **Canvas is NOT the state** — Project model is source of truth, canvas just renders it
- **No framework** — vanilla TS, fast, no bloat
- **Separation of concerns** — rendering, data, UI are separate modules
- **Events over callbacks** — use CustomEvent for inter-module communication
- **Single render loop** — requestAnimationFrame, dirty flag
- **iOS-ready data layer** — ProjectData is pure JSON, serializable, no DOM refs. When we build the Swift client, it reads/writes the same schema. API sync layer will be the bridge.

## iOS Native Client (Phase 3+)
- SwiftUI + Canvas (or Metal for perf) Gantt renderer
- Same data model (ProjectData JSON ↔ Swift Codable structs)
- Shared Supabase backend for sync (web ↔ iOS)
- Offline-first with local persistence (Core Data or SwiftData)
- iPad: full Gantt with Apple Pencil support for drawing dependencies
- iPhone: focused task list view + quick-add, Gantt in landscape
- Potential: watchOS complication for today's tasks / milestone alerts
- Bundle ID reserved: com.openplan.app (or similar)

## What to Preserve from Old DingPlan
- Camera transform math (world ↔ screen) — it's solid
- TimeAxis date rendering approach (months on top, days below)
- Trade color palette
- The FEEL of the infinite canvas Gantt — that's the magic

## What to Fix from Old DingPlan
- Canvas.ts was 2000 lines — split into Renderer + Canvas + events
- TaskManager mixed rendering + state — separate model from view
- Sidebar was 1800 lines — split into components
- Class name mismatches everywhere — consistent naming
- No event system — everything was tightly coupled
