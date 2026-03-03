import { ProjectData, TaskData } from './model/types';
import { Project } from './model/Project';
import { getTradeColor } from './model/Trade';
import { loadAny, save } from './io/Storage';
import { Camera } from './core/Camera';
import { TimeAxis } from './core/TimeAxis';
import { Renderer } from './core/Renderer';
import { Toolbar } from './ui/Toolbar';
import { FloatingBar } from './ui/FloatingBar';
import { Sidebar } from './ui/Sidebar';
import { RightPanel } from './ui/RightPanel';
import { v4 as uuid } from 'uuid';

// --- Default project with sample data ---
function createDefaultProject(): ProjectData {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

  return {
    id: uuid(),
    name: 'Commercial Buildout',
    startDate: fmt(addDays(today, -7)),
    tasks: [
      { id: uuid(), name: 'Mobilization', startDate: fmt(addDays(today, -5)), duration: 5, tradeId: 'general', swimlaneId: 'site-prep', crewSize: 8, color: '#9E9E9E', progress: 100, dependencies: [] },
      { id: uuid(), name: 'Site Clearing & Grading', startDate: fmt(addDays(today, 0)), duration: 15, tradeId: 'sitework', swimlaneId: 'site-prep', crewSize: 12, color: '#8D6E63', progress: 30, dependencies: [] },
      { id: uuid(), name: 'Underground Utilities', startDate: fmt(addDays(today, 10)), duration: 12, tradeId: 'plumbing', swimlaneId: 'site-prep', crewSize: 8, color: '#81C784', progress: 0, dependencies: [] },
      { id: uuid(), name: 'Foundation Excavation', startDate: fmt(addDays(today, 5)), duration: 10, tradeId: 'concrete', swimlaneId: 'structure', crewSize: 10, color: '#BDBDBD', progress: 0, dependencies: [] },
      { id: uuid(), name: 'Foundation Pour', startDate: fmt(addDays(today, 18)), duration: 8, tradeId: 'concrete', swimlaneId: 'structure', crewSize: 14, color: '#BDBDBD', progress: 0, dependencies: [] },
      { id: uuid(), name: 'Steel Erection', startDate: fmt(addDays(today, 28)), duration: 20, tradeId: 'steel', swimlaneId: 'structure', crewSize: 16, color: '#546E7A', progress: 0, dependencies: [] },
      { id: uuid(), name: 'Rough Electrical', startDate: fmt(addDays(today, 35)), duration: 15, tradeId: 'electrical', swimlaneId: 'interior', crewSize: 10, color: '#64B5F6', progress: 0, dependencies: [] },
      { id: uuid(), name: 'Rough Plumbing', startDate: fmt(addDays(today, 35)), duration: 12, tradeId: 'plumbing', swimlaneId: 'interior', crewSize: 8, color: '#81C784', progress: 0, dependencies: [] },
      { id: uuid(), name: 'HVAC Rough-in', startDate: fmt(addDays(today, 38)), duration: 14, tradeId: 'hvac', swimlaneId: 'interior', crewSize: 10, color: '#FFD54F', progress: 0, dependencies: [] },
      { id: uuid(), name: 'Drywall', startDate: fmt(addDays(today, 55)), duration: 12, tradeId: 'drywall', swimlaneId: 'interior', crewSize: 12, color: '#CE93D8', progress: 0, dependencies: [] },
    ],
    swimlanes: [
      { id: 'site-prep', name: 'Site Prep', order: 0 },
      { id: 'structure', name: 'Structure', order: 1 },
      { id: 'interior', name: 'Interior', order: 2 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// --- Init ---
const raw = loadAny();
const projectData = raw || createDefaultProject();
const project = new Project(projectData);

// Canvas setup
const canvasEl = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvasEl.getContext('2d')!;
const dpr = window.devicePixelRatio || 1;

let sidebarOpen = false;
let rightPanelOpen = false;

function resizeCanvas() {
  const leftOffset = sidebarOpen ? 260 : 0;
  const rightOffset = rightPanelOpen ? 360 : 0;
  const w = window.innerWidth - leftOffset - rightOffset;
  const h = window.innerHeight - 48;
  canvasEl.width = w * dpr;
  canvasEl.height = h * dpr;
  canvasEl.style.width = w + 'px';
  canvasEl.style.height = h + 'px';
  canvasEl.style.left = leftOffset + 'px';
  camera.resize(canvasEl.width, canvasEl.height);
  renderer.markDirty();
}

const camera = new Camera(window.innerWidth * dpr, (window.innerHeight - 48) * dpr);
const timeAxis = new TimeAxis(new Date(projectData.startDate));
const renderer = new Renderer(ctx, camera, timeAxis, project);

// Center camera on today
const todayX = timeAxis.dateToX(new Date());
camera.x = todayX;
camera.y = 180;

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Start render loop
renderer.start();

// --- UI Components ---
const toolbar = new Toolbar(document.body);
toolbar.setProjectName(project.data.name);

const floatingBar = new FloatingBar(document.body);
const sidebar = new Sidebar(document.body);
sidebar.setProjectName(project.data.name);

const rightPanel = new RightPanel(document.body);
rightPanel.setSwimlanes(project.data.swimlanes);

// --- Helpers ---
function openPanel(view: 'add-task' | 'details' | 'swimlanes' | 'trades', data?: any) {
  rightPanel.setSwimlanes(project.data.swimlanes);
  rightPanel.open(view, data);
  rightPanelOpen = true;
  resizeCanvas();
  updateFloatingBar();
}

// --- Visibility logic ---
function updateFloatingBar() {
  if (!sidebar.getIsOpen() && !rightPanel.getIsOpen()) {
    floatingBar.show();
  } else {
    floatingBar.hide();
  }
}

// --- Toolbar wiring ---
toolbar.onToggleSidebar(() => {
  sidebar.toggle();
  sidebarOpen = sidebar.getIsOpen();
  resizeCanvas();
  updateFloatingBar();
});

toolbar.onProjectNameChange((name) => {
  project.data.name = name;
  project.data.updatedAt = new Date().toISOString();
  sidebar.setProjectName(name);
});

// --- Sidebar wiring ---
sidebar.onProjectNameChange = (name) => {
  project.data.name = name;
  project.data.updatedAt = new Date().toISOString();
  toolbar.setProjectName(name);
};

sidebar.onAction = (action) => {
  if (action === 'add-task') openPanel('add-task');
  else if (action === 'swimlanes') openPanel('swimlanes');
  else if (action === 'trades') openPanel('trades');
  else if (action === 'go-to-today') {
    camera.x = timeAxis.dateToX(new Date());
    camera.y = 180;
    camera.zoom = 1;
    renderer.markDirty();
  } else if (action === 'toggle-deps') {
    // TODO
  } else if (action === 'export-json') {
    exportJSON();
  } else if (action === 'import-json') {
    importJSON();
  }
};

sidebar.onClose = () => updateFloatingBar();

// --- Floating bar wiring ---
floatingBar.onAction = (action) => {
  if (action === 'add-task') openPanel('add-task');
  else if (action === 'swimlanes') openPanel('swimlanes');
  else if (action === 'trades') openPanel('trades');
  else if (action === 'go-to-today') {
    camera.x = timeAxis.dateToX(new Date());
    camera.y = 180;
    camera.zoom = 1;
    renderer.markDirty();
  }
};

// --- Right panel wiring ---
rightPanel.onClose = () => {
  rightPanelOpen = false;
  resizeCanvas();
  renderer.selectedTaskId = null;
  renderer.markDirty();
  updateFloatingBar();
};

rightPanel.onAddTask = (data) => {
  const task: TaskData = {
    ...data,
    id: uuid(),
    color: getTradeColor(data.tradeId),
    progress: 0,
    dependencies: [],
  };
  project.addTask(task);
  // If task's swimlane doesn't exist, add it
  if (!project.data.swimlanes.find(s => s.id === task.swimlaneId)) {
    project.addSwimlane({ id: task.swimlaneId, name: task.swimlaneId, order: project.data.swimlanes.length });
  }
  renderer.markDirty();
};

rightPanel.onUpdateTask = (task) => {
  task.color = getTradeColor(task.tradeId);
  project.updateTask(task.id, task);
  renderer.markDirty();
};

rightPanel.onDeleteTask = (id) => {
  project.removeTask(id);
  renderer.selectedTaskId = null;
  renderer.markDirty();
};

rightPanel.onAddSwimlane = (name) => {
  const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  project.addSwimlane({ id, name, order: project.data.swimlanes.length });
  openPanel('swimlanes');
  renderer.markDirty();
};

// --- Export ---
function exportJSON() {
  const blob = new Blob([JSON.stringify(project.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.data.name.replace(/\s+/g, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Import ---
function importJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as ProjectData;
        if (!data.tasks || !data.swimlanes) throw new Error('Invalid project file');
        // Replace current project
        project.data.name = data.name || 'Imported Project';
        project.data.tasks = data.tasks;
        project.data.swimlanes = data.swimlanes;
        project.data.startDate = data.startDate || new Date().toISOString().split('T')[0];
        project.data.updatedAt = new Date().toISOString();
        // Update UI
        toolbar.setProjectName(project.data.name);
        sidebar.setProjectName(project.data.name);
        timeAxis.projectStart = new Date(project.data.startDate);
        camera.x = timeAxis.dateToX(new Date());
        camera.y = 180;
        camera.zoom = 1;
        renderer.markDirty();
        save(project.data);
      } catch (e) {
        alert('Invalid project file');
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

// --- Mouse/Touch Events ---
let isPanning = false;
let panStart = { x: 0, y: 0 };
let camStart = { x: 0, y: 0 };
let draggingTask: TaskData | null = null;
let dragStartX = 0;
let dragOrigDate = '';

function screenToCanvas(e: MouseEvent | Touch): { x: number; y: number } {
  const rect = canvasEl.getBoundingClientRect();
  return { x: (e.clientX - rect.left) * dpr, y: (e.clientY - rect.top) * dpr };
}

canvasEl.addEventListener('mousedown', (e) => {
  const { x, y } = screenToCanvas(e);
  const world = camera.screenToWorld(x, y);
  const task = renderer.hitTestTask(world.x, world.y);
  if (task) {
    draggingTask = task;
    dragStartX = world.x;
    dragOrigDate = task.startDate;
    canvasEl.style.cursor = 'grabbing';
  } else {
    isPanning = true;
    panStart = { x, y };
    camStart = { x: camera.x, y: camera.y };
    canvasEl.style.cursor = 'grabbing';
  }
});

canvasEl.addEventListener('mousemove', (e) => {
  const { x, y } = screenToCanvas(e);
  if (isPanning) {
    camera.x = camStart.x - (x - panStart.x) / camera.zoom;
    camera.y = camStart.y - (y - panStart.y) / camera.zoom;
    renderer.markDirty();
  } else if (draggingTask) {
    const world = camera.screenToWorld(x, y);
    const dayDelta = Math.round((world.x - dragStartX) / timeAxis.pixelsPerDay);
    const orig = new Date(dragOrigDate + 'T00:00:00');
    const newDate = new Date(orig.getTime() + dayDelta * 86400000);
    draggingTask.startDate = newDate.toISOString().split('T')[0];
    renderer.markDirty();
  } else {
    const world = camera.screenToWorld(x, y);
    const task = renderer.hitTestTask(world.x, world.y);
    canvasEl.style.cursor = task ? 'pointer' : 'default';
  }
});

canvasEl.addEventListener('mouseup', () => {
  if (draggingTask) {
    if (draggingTask.startDate !== dragOrigDate) {
      project.updateTask(draggingTask.id, { startDate: draggingTask.startDate });
    } else {
      // Click — open details
      renderer.selectedTaskId = draggingTask.id;
      openPanel('details', draggingTask);
      renderer.markDirty();
    }
    draggingTask = null;
  }
  isPanning = false;
  canvasEl.style.cursor = 'default';
});

canvasEl.addEventListener('mouseleave', () => {
  isPanning = false;
  draggingTask = null;
  canvasEl.style.cursor = 'default';
});

canvasEl.addEventListener('wheel', (e) => {
  e.preventDefault();
  const { x, y } = screenToCanvas(e);
  const worldBefore = camera.screenToWorld(x, y);
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  camera.zoom = Math.max(0.1, Math.min(5, camera.zoom * factor));
  const worldAfter = camera.screenToWorld(x, y);
  camera.x -= (worldAfter.x - worldBefore.x);
  camera.y -= (worldAfter.y - worldBefore.y);
  renderer.markDirty();
}, { passive: false });

canvasEl.addEventListener('dblclick', (e) => {
  const { x, y } = screenToCanvas(e);
  const world = camera.screenToWorld(x, y);
  const task = renderer.hitTestTask(world.x, world.y);
  if (task) return;

  openPanel('add-task');
});

// Touch events
let lastPinchDist = 0;
canvasEl.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (e.touches.length === 1) {
    const { x, y } = screenToCanvas(e.touches[0]);
    isPanning = true;
    panStart = { x, y };
    camStart = { x: camera.x, y: camera.y };
  } else if (e.touches.length === 2) {
    isPanning = false;
    lastPinchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
}, { passive: false });

canvasEl.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (e.touches.length === 1 && isPanning) {
    const { x, y } = screenToCanvas(e.touches[0]);
    camera.x = camStart.x - (x - panStart.x) / camera.zoom;
    camera.y = camStart.y - (y - panStart.y) / camera.zoom;
    renderer.markDirty();
  } else if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    camera.zoom = Math.max(0.1, Math.min(5, camera.zoom * (dist / lastPinchDist)));
    lastPinchDist = dist;
    renderer.markDirty();
  }
}, { passive: false });

canvasEl.addEventListener('touchend', () => { isPanning = false; });
