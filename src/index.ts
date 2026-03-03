import { Camera } from './core/Camera';
import { TimeAxis } from './core/TimeAxis';
import { Renderer } from './core/Renderer';
import { Project } from './model/Project';
import { ProjectData } from './model/types';
import * as Storage from './io/Storage';
import { v4 as uuid } from 'uuid';

// --- Canvas setup ---
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 48;
}
resizeCanvas();

// --- Load or create project ---
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayISO = today.toISOString().split('T')[0];

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function createSampleProject(): ProjectData {
  const id = uuid();
  return {
    id,
    name: 'Commercial Buildout',
    startDate: todayISO,
    swimlanes: [
      { id: 'site-prep', name: 'Site Prep', order: 0 },
      { id: 'structure', name: 'Structure', order: 1 },
      { id: 'interior', name: 'Interior', order: 2 },
    ],
    tasks: [
      { id: uuid(), name: 'Demolition', startDate: todayISO, duration: 5, tradeId: 'demolition', swimlaneId: 'site-prep', crewSize: 4, dependencies: [], color: '#EF5350', progress: 0 },
      { id: uuid(), name: 'Site Grading', startDate: addDays(today, 7), duration: 8, tradeId: 'sitework', swimlaneId: 'site-prep', crewSize: 3, dependencies: [], color: '#8D6E63', progress: 0 },
      { id: uuid(), name: 'Underground Utilities', startDate: addDays(today, 19), duration: 10, tradeId: 'plumbing', swimlaneId: 'site-prep', crewSize: 5, dependencies: [], color: '#81C784', progress: 0 },
      { id: uuid(), name: 'Foundation Pour', startDate: addDays(today, 33), duration: 7, tradeId: 'concrete', swimlaneId: 'structure', crewSize: 6, dependencies: [], color: '#BDBDBD', progress: 0 },
      { id: uuid(), name: 'Steel Erection', startDate: addDays(today, 44), duration: 15, tradeId: 'steel', swimlaneId: 'structure', crewSize: 8, dependencies: [], color: '#546E7A', progress: 0 },
      { id: uuid(), name: 'Roofing', startDate: addDays(today, 63), duration: 10, tradeId: 'roofing', swimlaneId: 'structure', crewSize: 5, dependencies: [], color: '#78909C', progress: 0 },
      { id: uuid(), name: 'Framing', startDate: addDays(today, 50), duration: 12, tradeId: 'framing', swimlaneId: 'interior', crewSize: 6, dependencies: [], color: '#FFB74D', progress: 0 },
      { id: uuid(), name: 'Electrical Rough-In', startDate: addDays(today, 66), duration: 10, tradeId: 'electrical', swimlaneId: 'interior', crewSize: 4, dependencies: [], color: '#64B5F6', progress: 0 },
      { id: uuid(), name: 'HVAC Install', startDate: addDays(today, 66), duration: 12, tradeId: 'hvac', swimlaneId: 'interior', crewSize: 4, dependencies: [], color: '#FFD54F', progress: 0 },
      { id: uuid(), name: 'Drywall & Paint', startDate: addDays(today, 82), duration: 10, tradeId: 'drywall', swimlaneId: 'interior', crewSize: 5, dependencies: [], color: '#CE93D8', progress: 0 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

let projectData = Storage.loadAny();
if (!projectData) {
  projectData = createSampleProject();
  Storage.save(projectData);
}

const project = new Project(projectData);

// Set dependencies (link by index after creation)
const tasks = project.data.tasks;
if (tasks.length >= 10 && tasks[0].dependencies.length === 0) {
  tasks[1].dependencies = [tasks[0].id]; // Site Grading after Demolition
  tasks[2].dependencies = [tasks[1].id]; // Utilities after Grading
  tasks[3].dependencies = [tasks[2].id]; // Foundation after Utilities
  tasks[4].dependencies = [tasks[3].id]; // Steel after Foundation
  tasks[5].dependencies = [tasks[4].id]; // Roofing after Steel
  tasks[6].dependencies = [tasks[3].id]; // Framing after Foundation
  tasks[7].dependencies = [tasks[6].id]; // Electrical after Framing
  tasks[8].dependencies = [tasks[6].id]; // HVAC after Framing
  tasks[9].dependencies = [tasks[7].id, tasks[8].id]; // Drywall after Electrical & HVAC
  Storage.save(project.data);
}

// Update toolbar
document.getElementById('projectName')!.textContent = project.data.name;

// --- Camera, TimeAxis, Renderer ---
const camera = new Camera(canvas.width, canvas.height);
const timeAxis = new TimeAxis(new Date(project.data.startDate));
const renderer = new Renderer(ctx, camera, timeAxis, project);

// Center camera on today
camera.x = timeAxis.dateToX(today) + 200;
camera.y = 120;

// --- Input handling ---
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;

canvas.addEventListener('mousedown', (e) => {
  isPanning = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  const dx = (e.clientX - lastMouseX) / camera.zoom;
  const dy = (e.clientY - lastMouseY) / camera.zoom;
  camera.x -= dx;
  camera.y -= dy;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  renderer.markDirty();
});

canvas.addEventListener('mouseup', (e) => {
  if (isPanning && Math.abs(e.clientX - lastMouseX) < 3 && Math.abs(e.clientY - lastMouseY) < 3) {
    // It was a click, not a drag
    const world = camera.screenToWorld(e.clientX, e.clientY - 48);
    const task = renderer.hitTestTask(world.x, world.y);
    renderer.selectedTaskId = task ? task.id : null;
    renderer.markDirty();
  }
  isPanning = false;
  canvas.style.cursor = 'default';
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  const worldBefore = camera.screenToWorld(e.clientX, e.clientY - 48);
  camera.zoom = Math.max(0.1, Math.min(5, camera.zoom * zoomFactor));
  const worldAfter = camera.screenToWorld(e.clientX, e.clientY - 48);
  camera.x -= worldAfter.x - worldBefore.x;
  camera.y -= worldAfter.y - worldBefore.y;
  renderer.markDirty();
}, { passive: false });

window.addEventListener('resize', () => {
  resizeCanvas();
  camera.resize(canvas.width, canvas.height);
  renderer.markDirty();
});

// --- Start ---
renderer.markDirty();
renderer.start();
