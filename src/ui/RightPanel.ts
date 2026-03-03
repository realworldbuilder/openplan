import { TaskData, SwimLaneData } from '../model/types';
import { TRADES } from '../model/Trade';

type PanelView = 'add-task' | 'details' | 'swimlanes' | 'trades';

export class RightPanel {
  private el: HTMLElement;
  private contentEl: HTMLElement;
  private isOpen = false;
  private currentView: PanelView = 'add-task';
  private swimlanes: SwimLaneData[] = [];
  private selectedTask: TaskData | null = null;

  onClose: (() => void) | null = null;
  onAddTask: ((data: Omit<TaskData, 'id' | 'color' | 'progress' | 'dependencies'>) => void) | null = null;
  onUpdateTask: ((task: TaskData) => void) | null = null;
  onDeleteTask: ((id: string) => void) | null = null;
  onAddSwimlane: ((name: string) => void) | null = null;
  onDeleteSwimlane: ((id: string) => void) | null = null;
  onRenameSwimlane: ((id: string, name: string) => void) | null = null;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', top: '48px', right: '0',
      width: '360px', height: 'calc(100% - 48px)',
      background: '#fff', borderLeft: '1px solid #e5e7eb',
      transform: 'translateX(360px)', transition: 'transform 0.2s ease',
      zIndex: '95', display: 'flex', flexDirection: 'column',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    });

    this.contentEl = document.createElement('div');
    this.contentEl.style.flex = '1';
    this.contentEl.style.overflowY = 'auto';
    this.el.appendChild(this.contentEl);
    container.appendChild(this.el);
  }

  setSwimlanes(s: SwimLaneData[]) { this.swimlanes = s; }

  open(view: PanelView, data?: any) {
    this.currentView = view;
    this.selectedTask = view === 'details' ? data : null;
    this.isOpen = true;
    this.el.style.transform = 'translateX(0)';
    this.render();
  }

  close() {
    this.isOpen = false;
    this.el.style.transform = 'translateX(360px)';
    this.onClose?.();
  }

  getIsOpen() { return this.isOpen; }

  private render() {
    this.contentEl.innerHTML = '';

    const titles: Record<PanelView, string> = {
      'add-task': 'Add Task',
      'details': 'Task Details',
      'swimlanes': 'Swimlanes',
      'trades': 'Trades',
    };

    // Header
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px', borderBottom: '1px solid #f0f0f0',
    });

    const title = document.createElement('span');
    Object.assign(title.style, { fontSize: '15px', fontWeight: '600', color: '#1a1a1a' });
    title.textContent = titles[this.currentView];

    const closeBtn = document.createElement('button');
    Object.assign(closeBtn.style, {
      background: 'transparent', border: 'none', fontSize: '20px',
      cursor: 'pointer', padding: '4px 8px', borderRadius: '6px',
      color: '#666', transition: 'background 0.15s ease', lineHeight: '1',
    });
    closeBtn.textContent = '×';
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.background = '#f3f4f6');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.background = 'transparent');
    closeBtn.addEventListener('click', () => this.close());

    header.appendChild(title);
    header.appendChild(closeBtn);
    this.contentEl.appendChild(header);

    if (this.currentView === 'add-task') this.renderTaskForm();
    else if (this.currentView === 'details') this.renderTaskForm(this.selectedTask!);
    else if (this.currentView === 'swimlanes') this.renderSwimlanes();
    else if (this.currentView === 'trades') this.renderTrades();
  }

  private renderTaskForm(existing?: TaskData) {
    const form = document.createElement('div');
    Object.assign(form.style, { padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' });

    const swimlanes = this.swimlanes.length ? this.swimlanes : [{ id: 'default', name: 'General', order: 0 }];
    const today = new Date().toISOString().split('T')[0];

    const fields = [
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
      Object.assign(label.style, { fontSize: '12px', fontWeight: '500', color: '#555', marginBottom: '4px', display: 'block' });
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
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';
    btnRow.style.marginTop = '8px';

    const submitBtn = document.createElement('button');
    Object.assign(submitBtn.style, {
      flex: '1', padding: '10px', background: '#1a1a1a', color: '#fff',
      border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
      cursor: 'pointer', transition: 'background 0.15s ease', fontFamily: 'inherit',
    });
    submitBtn.textContent = existing ? 'Save Changes' : 'Add Task';
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
        // Flash feedback
        submitBtn.textContent = '✓ Added';
        submitBtn.style.background = '#16a34a';
        setTimeout(() => { submitBtn.textContent = 'Add Task'; submitBtn.style.background = '#1a1a1a'; }, 1000);
        // Reset form
        (inputs.name as HTMLInputElement).value = '';
        (inputs.duration as HTMLInputElement).value = '5';
        (inputs.crewSize as HTMLInputElement).value = '1';
        (inputs.name as HTMLInputElement).focus();
      }
    });
    btnRow.appendChild(submitBtn);

    if (existing) {
      const delBtn = document.createElement('button');
      Object.assign(delBtn.style, {
        padding: '10px 16px', background: '#fff', color: '#ef4444',
        border: '1px solid #ef4444', borderRadius: '6px', fontSize: '13px',
        fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
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

  private renderSwimlanes() {
    const wrap = document.createElement('div');
    wrap.style.padding = '20px';

    const swimlanes = this.swimlanes.length ? this.swimlanes : [{ id: 'default', name: 'General', order: 0 }];
    for (const sl of swimlanes) {
      const row = document.createElement('div');
      Object.assign(row.style, {
        padding: '8px 12px', borderBottom: '1px solid #f0f0f0',
        fontSize: '13px', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      });

      const nameSpan = document.createElement('span');
      nameSpan.textContent = sl.name;
      nameSpan.style.cursor = 'pointer';
      nameSpan.title = 'Click to rename';
      nameSpan.addEventListener('click', () => {
        const newName = prompt('Rename swimlane:', sl.name);
        if (newName && newName.trim()) {
          this.onRenameSwimlane?.(sl.id, newName.trim());
        }
      });

      const delBtn = document.createElement('button');
      Object.assign(delBtn.style, {
        background: 'none', border: 'none', color: '#ccc', cursor: 'pointer',
        fontSize: '14px', padding: '2px 6px', borderRadius: '4px', transition: 'color 0.15s',
      });
      delBtn.textContent = '×';
      delBtn.addEventListener('mouseenter', () => delBtn.style.color = '#ef4444');
      delBtn.addEventListener('mouseleave', () => delBtn.style.color = '#ccc');
      delBtn.addEventListener('click', () => {
        if (confirm(`Delete "${sl.name}"? Tasks in this swimlane will be orphaned.`)) {
          this.onDeleteSwimlane?.(sl.id);
        }
      });

      row.appendChild(nameSpan);
      row.appendChild(delBtn);
      wrap.appendChild(row);
    }

    // Add swimlane
    const addRow = document.createElement('div');
    addRow.style.marginTop = '16px';
    addRow.style.display = 'flex';
    addRow.style.gap = '8px';

    const input = document.createElement('input');
    input.placeholder = 'New swimlane name';
    this.styleInput(input);
    input.style.flex = '1';

    const addBtn = document.createElement('button');
    Object.assign(addBtn.style, {
      padding: '8px 14px', background: '#1a1a1a', color: '#fff',
      border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
      cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
    });
    addBtn.textContent = 'Add';
    addBtn.addEventListener('click', () => {
      const name = input.value.trim();
      if (name) {
        this.onAddSwimlane?.(name);
        input.value = '';
      }
    });

    addRow.appendChild(input);
    addRow.appendChild(addBtn);
    wrap.appendChild(addRow);
    this.contentEl.appendChild(wrap);
  }

  private renderTrades() {
    const list = document.createElement('div');
    list.style.padding = '12px 20px';

    for (const trade of TRADES) {
      const row = document.createElement('div');
      Object.assign(row.style, {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 0', borderBottom: '1px solid #f0f0f0',
      });

      const dot = document.createElement('div');
      Object.assign(dot.style, {
        width: '10px', height: '10px', borderRadius: '50%',
        background: trade.color, flexShrink: '0',
      });

      const name = document.createElement('span');
      name.style.fontSize = '13px';
      name.style.color = '#333';
      name.textContent = trade.name;

      row.appendChild(dot);
      row.appendChild(name);
      list.appendChild(row);
    }

    this.contentEl.appendChild(list);
  }

  private styleInput(el: HTMLInputElement | HTMLSelectElement) {
    Object.assign(el.style, {
      width: '100%', padding: '8px 12px', fontSize: '14px',
      background: '#fafafa', border: '1px solid #e0e0e0',
      borderRadius: '6px', color: '#1a1a1a', outline: 'none',
      fontFamily: 'inherit', transition: 'border-color 0.15s ease, background 0.15s ease',
      boxSizing: 'border-box',
    });
    el.addEventListener('focus', () => { el.style.borderColor = '#1a1a1a'; el.style.background = '#fff'; });
    el.addEventListener('blur', () => { el.style.borderColor = '#e0e0e0'; el.style.background = '#fafafa'; });
  }
}
