import { TaskData, SwimLaneData, ProjectData } from '../model/types';
import { TRADES } from '../model/Trade';

type SidebarView = 'add-task' | 'details' | 'trades';

export class Sidebar {
  private el: HTMLElement;
  private contentEl: HTMLElement;
  private view: SidebarView = 'add-task';
  private isOpen = false;
  private selectedTask: TaskData | null = null;
  private project: ProjectData | null = null;

  onAddTask: ((task: Omit<TaskData, 'id' | 'color' | 'progress' | 'dependencies'>) => void) | null = null;
  onUpdateTask: ((task: TaskData) => void) | null = null;
  onDeleteTask: ((id: string) => void) | null = null;
  onClose: (() => void) | null = null;
  onTradeToggle: ((tradeId: string, enabled: boolean) => void) | null = null;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'sidebar';
    Object.assign(this.el.style, {
      position: 'fixed', top: '48px', right: '0', bottom: '0',
      width: '360px', background: '#fff',
      boxShadow: '-2px 0 12px rgba(0,0,0,0.08)',
      transform: 'translateX(100%)',
      transition: 'transform 0.25s ease',
      zIndex: '95', display: 'flex', flexDirection: 'column',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      overflowY: 'auto',
    });

    this.contentEl = document.createElement('div');
    this.contentEl.style.flex = '1';
    this.contentEl.style.padding = '0';
    this.el.appendChild(this.contentEl);
    container.appendChild(this.el);
  }

  setProject(project: ProjectData) { this.project = project; }

  open(view: SidebarView = 'add-task', task?: TaskData) {
    this.view = view;
    this.selectedTask = task || null;
    this.isOpen = true;
    this.el.style.transform = 'translateX(0)';
    this.render();
  }

  close() {
    this.isOpen = false;
    this.el.style.transform = 'translateX(100%)';
    this.onClose?.();
  }

  getIsOpen() { return this.isOpen; }

  private render() {
    this.contentEl.innerHTML = '';

    // Header
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px', borderBottom: '1px solid #e0e0e0',
    });
    const title = document.createElement('span');
    title.style.fontSize = '15px';
    title.style.fontWeight = '600';
    title.style.color = '#1a1a1a';
    title.textContent = this.view === 'add-task' ? 'Add Task' : this.view === 'details' ? 'Task Details' : 'Filter by Trade';

    const closeBtn = document.createElement('button');
    Object.assign(closeBtn.style, {
      background: 'transparent', border: 'none', fontSize: '20px',
      cursor: 'pointer', padding: '4px 8px', borderRadius: '6px',
      color: '#666', transition: 'background 0.15s ease',
    });
    closeBtn.textContent = '×';
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.background = '#f3f4f6');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.background = 'transparent');
    closeBtn.addEventListener('click', () => this.close());

    header.appendChild(title);
    header.appendChild(closeBtn);
    this.contentEl.appendChild(header);

    if (this.view === 'add-task') this.renderAddForm();
    else if (this.view === 'details') this.renderDetails();
    else if (this.view === 'trades') this.renderTrades();
  }

  private renderAddForm(existing?: TaskData) {
    const form = document.createElement('div');
    form.style.padding = '20px';
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = '14px';

    const swimlanes = this.project?.swimlanes || [{ id: 'default', name: 'General', order: 0 }];
    const today = new Date().toISOString().split('T')[0];

    const fields: { label: string; type: string; key: string; value: string; options?: { id: string; name: string }[] }[] = [
      { label: 'Task Name', type: 'text', key: 'name', value: existing?.name || '' },
      { label: 'Trade', type: 'select', key: 'tradeId', value: existing?.tradeId || 'general', options: TRADES.map(t => ({ id: t.id, name: t.name })) },
      { label: 'Swimlane', type: 'select', key: 'swimlaneId', value: existing?.swimlaneId || swimlanes[0].id, options: swimlanes.map(s => ({ id: s.id, name: s.name })) },
      { label: 'Start Date', type: 'date', key: 'startDate', value: existing?.startDate || today },
      { label: 'Duration (days)', type: 'number', key: 'duration', value: String(existing?.duration ?? 5) },
      { label: 'Crew Size', type: 'number', key: 'crewSize', value: String(existing?.crewSize ?? 1) },
    ];

    const inputs: Record<string, HTMLInputElement | HTMLSelectElement> = {};

    for (const f of fields) {
      const wrapper = document.createElement('div');
      const label = document.createElement('label');
      Object.assign(label.style, { fontSize: '12px', fontWeight: '500', color: '#666', marginBottom: '4px', display: 'block' });
      label.textContent = f.label;
      wrapper.appendChild(label);

      let input: HTMLInputElement | HTMLSelectElement;
      if (f.type === 'select') {
        input = document.createElement('select');
        for (const opt of f.options || []) {
          const o = document.createElement('option');
          o.value = opt.id;
          o.textContent = opt.name;
          if (opt.id === f.value) o.selected = true;
          input.appendChild(o);
        }
      } else {
        input = document.createElement('input');
        input.type = f.type;
        input.value = f.value;
        if (f.type === 'number') (input as HTMLInputElement).min = '1';
      }
      this.styleInput(input);
      inputs[f.key] = input;
      wrapper.appendChild(input);
      form.appendChild(wrapper);
    }

    const btnRow = document.createElement('div');
    btnRow.style.marginTop = '8px';
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';

    const submitBtn = document.createElement('button');
    Object.assign(submitBtn.style, {
      flex: '1', padding: '10px', background: '#1a1a1a', color: '#fff',
      border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
      cursor: 'pointer', transition: 'background 0.15s ease', fontFamily: 'inherit',
    });
    submitBtn.textContent = existing ? 'Update Task' : 'Add Task';
    submitBtn.addEventListener('mouseenter', () => submitBtn.style.background = '#333');
    submitBtn.addEventListener('mouseleave', () => submitBtn.style.background = '#1a1a1a');
    submitBtn.addEventListener('click', () => {
      const name = (inputs.name as HTMLInputElement).value.trim();
      if (!name) { (inputs.name as HTMLInputElement).focus(); return; }
      const data = {
        name,
        tradeId: inputs.tradeId.value,
        swimlaneId: inputs.swimlaneId.value,
        startDate: (inputs.startDate as HTMLInputElement).value,
        duration: parseInt((inputs.duration as HTMLInputElement).value) || 5,
        crewSize: parseInt((inputs.crewSize as HTMLInputElement).value) || 1,
      };
      if (existing) {
        this.onUpdateTask?.({ ...existing, ...data });
      } else {
        this.onAddTask?.(data);
        // Reset form
        (inputs.name as HTMLInputElement).value = '';
        (inputs.duration as HTMLInputElement).value = '5';
        (inputs.crewSize as HTMLInputElement).value = '1';
      }
    });

    btnRow.appendChild(submitBtn);

    if (existing) {
      const delBtn = document.createElement('button');
      Object.assign(delBtn.style, {
        padding: '10px 16px', background: '#fff', color: '#ef4444',
        border: '1px solid #ef4444', borderRadius: '6px', fontSize: '13px',
        fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit',
      });
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => {
        if (confirm(`Delete "${existing.name}"?`)) {
          this.onDeleteTask?.(existing.id);
          this.close();
        }
      });
      btnRow.appendChild(delBtn);
    }

    form.appendChild(btnRow);
    this.contentEl.appendChild(form);
  }

  private renderDetails() {
    if (!this.selectedTask) {
      const empty = document.createElement('div');
      Object.assign(empty.style, { padding: '40px 20px', textAlign: 'center', color: '#999', fontSize: '13px' });
      empty.textContent = 'No task selected';
      this.contentEl.appendChild(empty);
      return;
    }
    this.renderAddForm(this.selectedTask);
  }

  private renderTrades() {
    const list = document.createElement('div');
    list.style.padding = '12px 20px';

    for (const trade of TRADES) {
      const row = document.createElement('div');
      Object.assign(row.style, {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 0', borderBottom: '1px solid #f0f0f0',
      });

      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.alignItems = 'center';
      left.style.gap = '10px';

      const dot = document.createElement('div');
      Object.assign(dot.style, {
        width: '10px', height: '10px', borderRadius: '50%', background: trade.color,
      });

      const name = document.createElement('span');
      name.style.fontSize = '13px';
      name.style.color = '#333';
      name.textContent = trade.name;

      left.appendChild(dot);
      left.appendChild(name);

      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.checked = true;
      toggle.style.cursor = 'pointer';
      toggle.addEventListener('change', () => this.onTradeToggle?.(trade.id, toggle.checked));

      row.appendChild(left);
      row.appendChild(toggle);
      list.appendChild(row);
    }

    this.contentEl.appendChild(list);
  }

  private styleInput(el: HTMLInputElement | HTMLSelectElement) {
    Object.assign(el.style, {
      width: '100%', padding: '10px 12px', fontSize: '13px',
      background: '#f5f5f5', border: '1px solid #e0e0e0',
      borderRadius: '8px', color: '#1a1a1a', outline: 'none',
      fontFamily: 'inherit', transition: 'border-color 0.15s ease',
    });
    el.addEventListener('focus', () => el.style.borderColor = '#1a1a1a');
    el.addEventListener('blur', () => el.style.borderColor = '#e0e0e0');
  }
}
