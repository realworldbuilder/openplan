import { TaskData, SwimLaneData } from '../model/types';
import { TRADES } from '../model/Trade';

export class TaskDialog {
  private overlay: HTMLElement;
  private card: HTMLElement;
  onAddTask: ((task: Omit<TaskData, 'id' | 'color' | 'progress' | 'dependencies'>) => void) | null = null;
  private swimlanes: SwimLaneData[] = [];
  private defaultDate: string = '';
  private defaultSwimlane: string = '';

  constructor(container: HTMLElement) {
    this.overlay = document.createElement('div');
    this.overlay.id = 'task-dialog-overlay';
    Object.assign(this.overlay.style, {
      position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.3)',
      display: 'none', alignItems: 'center', justifyContent: 'center',
      zIndex: '200',
    });

    this.card = document.createElement('div');
    Object.assign(this.card.style, {
      background: '#fff', borderRadius: '12px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      padding: '24px', width: '380px', maxWidth: '90vw',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    });

    this.overlay.appendChild(this.card);
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    container.appendChild(this.overlay);
  }

  setSwimlanes(s: SwimLaneData[]) { this.swimlanes = s; }

  open(defaultDate?: string, defaultSwimlane?: string) {
    this.defaultDate = defaultDate || new Date().toISOString().split('T')[0];
    this.defaultSwimlane = defaultSwimlane || this.swimlanes[0]?.id || 'default';
    this.render();
    this.overlay.style.display = 'flex';
    const firstInput = this.card.querySelector('input');
    firstInput?.focus();
  }

  close() {
    this.overlay.style.display = 'none';
  }

  private render() {
    this.card.innerHTML = '';

    const title = document.createElement('h3');
    Object.assign(title.style, { margin: '0 0 20px', fontSize: '16px', fontWeight: '600', color: '#1a1a1a' });
    title.textContent = 'Quick Add Task';
    this.card.appendChild(title);

    const swimlanes = this.swimlanes.length ? this.swimlanes : [{ id: 'default', name: 'General', order: 0 }];

    const fields: { label: string; type: string; key: string; value: string; options?: { id: string; name: string }[] }[] = [
      { label: 'Task Name', type: 'text', key: 'name', value: '' },
      { label: 'Trade', type: 'select', key: 'tradeId', value: 'general', options: TRADES.map(t => ({ id: t.id, name: t.name })) },
      { label: 'Swimlane', type: 'select', key: 'swimlaneId', value: this.defaultSwimlane, options: swimlanes.map(s => ({ id: s.id, name: s.name })) },
      { label: 'Start Date', type: 'date', key: 'startDate', value: this.defaultDate },
      { label: 'Duration (days)', type: 'number', key: 'duration', value: '5' },
      { label: 'Crew Size', type: 'number', key: 'crewSize', value: '1' },
    ];

    const inputs: Record<string, HTMLInputElement | HTMLSelectElement> = {};

    for (const f of fields) {
      const wrapper = document.createElement('div');
      wrapper.style.marginBottom = '12px';
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
      this.card.appendChild(wrapper);
    }

    const submit = () => {
      const name = (inputs.name as HTMLInputElement).value.trim();
      if (!name) { (inputs.name as HTMLInputElement).focus(); return; }
      this.onAddTask?.({
        name,
        tradeId: inputs.tradeId.value,
        swimlaneId: inputs.swimlaneId.value,
        startDate: (inputs.startDate as HTMLInputElement).value,
        duration: parseInt((inputs.duration as HTMLInputElement).value) || 5,
        crewSize: parseInt((inputs.crewSize as HTMLInputElement).value) || 1,
      });
      this.close();
    };

    // Keyboard
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.close();
      if (e.key === 'Enter' && !(e.target instanceof HTMLSelectElement)) submit();
    };
    this.card.addEventListener('keydown', keyHandler);

    // Buttons
    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, { display: 'flex', gap: '8px', marginTop: '20px' });

    const addBtn = document.createElement('button');
    Object.assign(addBtn.style, {
      flex: '1', padding: '10px', background: '#1a1a1a', color: '#fff',
      border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
      cursor: 'pointer', transition: 'background 0.15s ease', fontFamily: 'inherit',
    });
    addBtn.textContent = 'Add Task';
    addBtn.addEventListener('mouseenter', () => addBtn.style.background = '#333');
    addBtn.addEventListener('mouseleave', () => addBtn.style.background = '#1a1a1a');
    addBtn.addEventListener('click', submit);

    const cancelBtn = document.createElement('button');
    Object.assign(cancelBtn.style, {
      padding: '10px 20px', background: 'transparent', color: '#666',
      border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px',
      fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit',
    });
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.close());

    btnRow.appendChild(addBtn);
    btnRow.appendChild(cancelBtn);
    this.card.appendChild(btnRow);
  }

  private styleInput(el: HTMLInputElement | HTMLSelectElement) {
    Object.assign(el.style, {
      width: '100%', padding: '10px 12px', fontSize: '13px',
      background: '#f5f5f5', border: '1px solid #e0e0e0',
      borderRadius: '8px', color: '#1a1a1a', outline: 'none',
      fontFamily: 'inherit', transition: 'border-color 0.15s ease',
      boxSizing: 'border-box',
    });
    el.addEventListener('focus', () => el.style.borderColor = '#1a1a1a');
    el.addEventListener('blur', () => el.style.borderColor = '#e0e0e0');
  }
}
