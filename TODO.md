# OpenPlan — What DingPlan Had Right (copy these patterns)

## DingPlan UX That Worked
1. **Left sidebar** — hamburger toggle, project selector dropdown, action buttons stacked vertically (Add Task, Swimlanes, Trades, Go to Today, Dependencies), AI Composer button, Export section, Settings
2. **Right panel** — slides in for task details/editing, add task form, swimlane management, trade management, AI Composer chat
3. **Floating action bar** — bottom center pill when sidebar is closed, quick access to: Add Task, Swimlanes, Trades, Go to Today, Dependencies, AI Composer
4. **Canvas** — infinite pan/zoom Gantt, tasks as colored rounded rect bars with trade colors, swimlane bands, today line (red dashed), grid lines for days, month headers
5. **Task bars** — trade color fill, white text (task name + "7d, 8 crew"), subtle shadow, rounded corners, draggable horizontally
6. **Project management** — dropdown to switch projects, new project, delete project, auto-save to localStorage

## What's Wrong in OpenPlan Right Now
- Toolbar has weird "Export" dropdown that doesn't work
- FloatingBar icons are emoji (📎🎯🤖) — looks amateur, should be text labels or clean icons
- Sidebar is barebones — no project selector, no action sections
- TaskDialog form works but styling is generic
- Canvas.ts (226 lines) duplicates all the event handling that's already in index.ts — DEAD CODE
- No "Go to Today" that actually centers the camera
- Sample data loads into localStorage but if user already has data it shows their old stuff with no way to reset
- Swimlane labels are tiny pills floating randomly
- Task text rendering needs work at different zoom levels
