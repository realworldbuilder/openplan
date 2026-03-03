import { ProjectData, TaskData } from './model/types';
import { getTradeColor } from './model/Trade';
import { save, loadAny } from './io/Storage';
import { Toolbar } from './ui/Toolbar';
import { FloatingBar } from './ui/FloatingBar';
import { Sidebar } from './ui/Sidebar';
import { TaskDialog } from './ui/TaskDialog';
import { CanvasController } from './ui/Canvas';
import { v4 as uuid } from 'uuid';

// --- Default project ---
function createDefaultProject(): ProjectData {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: uuid(),
    name: 'Untitled Project',
    startDate: today,
    tasks: [],
    swimlanes: [
      { id: 'zone-1', name: 'Zone 1', order: 0 },
      { id: 'zone-2', name: 'Zone 2', order: 1 },
      { id: 'zone-3', name: 'Zone 3', order: 2 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// --- Init ---
const project = loadAny() || createDefaultProject();

// Remove existing toolbar from HTML (we build our own)
const existingToolbar = document.getElementById('toolbar');
existingToolbar?.remove();

// UI components
const toolbar = new Toolbar(document.body);
toolbar.setProjectName(project.name);

const floatingBar = new FloatingBar(document.body);
const sidebar = new Sidebar(document.body);
sidebar.setProject(project);

const taskDialog = new TaskDialog(document.body);
taskDialog.setSwimlanes(project.swimlanes);

const canvasEl = document.getElementById('canvas') as HTMLCanvasElement;
const canvasCtrl = new CanvasController(canvasEl);
canvasCtrl.setProject(project);

// --- Wiring ---

function addTask(data: Omit<TaskData, 'id' | 'color' | 'progress' | 'dependencies'>) {
  const task: TaskData = {
    ...data,
    id: uuid(),
    color: getTradeColor(data.tradeId),
    progress: 0,
    dependencies: [],
  };
  project.tasks.push(task);
  save(project);
}

function updateTask(updated: TaskData) {
  const idx = project.tasks.findIndex(t => t.id === updated.id);
  if (idx >= 0) {
    updated.color = getTradeColor(updated.tradeId);
    project.tasks[idx] = updated;
    save(project);
  }
}

function deleteTask(id: string) {
  project.tasks = project.tasks.filter(t => t.id !== id);
  save(project);
}

// Toolbar
toolbar.onProjectNameChange((name) => {
  project.name = name;
  save(project);
});

toolbar.onZoomToFit(() => {
  // Simple zoom to fit: reset camera
  const cam = canvasCtrl.getCamera();
  cam.x = 0;
  cam.y = 0;
  cam.zoom = 1;
});

// Floating bar
floatingBar.onAction = (action) => {
  if (action === 'add-task') taskDialog.open();
  else if (action === 'sidebar') { sidebar.open('add-task'); floatingBar.hide(); }
  else if (action === 'zoom-to-fit') { const cam = canvasCtrl.getCamera(); cam.x = 0; cam.y = 0; cam.zoom = 1; }
  else if (action === 'settings') sidebar.open('trades');
};

// Sidebar
sidebar.onAddTask = (data) => addTask(data);
sidebar.onUpdateTask = (task) => updateTask(task);
sidebar.onDeleteTask = (id) => deleteTask(id);
sidebar.onClose = () => floatingBar.show();

// Task dialog
taskDialog.onAddTask = (data) => addTask(data);

// Canvas events
canvasCtrl.onTaskClick = (task) => {
  sidebar.open('details', task);
  floatingBar.hide();
};

canvasCtrl.onTaskDrag = (task, newDate) => {
  task.startDate = newDate;
  updateTask(task);
};

canvasCtrl.onDoubleClick = (date, swimlaneId) => {
  taskDialog.open(date, swimlaneId);
};

// Save on init
save(project);
