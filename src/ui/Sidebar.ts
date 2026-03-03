import { ProjectData } from '../model/types';

export class Sidebar {
  private el: HTMLElement;
  private nameEl: HTMLElement;
  private isOpen = false;

  onAction: ((action: string) => void) | null = null;
  onNewProject: (() => void) | null = null;
  onDeleteProject: (() => void) | null = null;
  onProjectNameChange: ((name: string) => void) | null = null;
  onClose: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', top: '48px', left: '0',
      width: '260px', height: 'calc(100% - 48px)',
      background: '#fff', borderRight: '1px solid #e5e7eb',
      transform: 'translateX(-260px)', transition: 'transform 0.2s ease',
      zIndex: '95', display: 'flex', flexDirection: 'column',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      overflowY: 'auto',
    });

    // Project section
    const projectSection = this.makeSection();
    this.nameEl = document.createElement('div');
    Object.assign(this.nameEl.style, {
      fontSize: '15px', fontWeight: '600', color: '#1a1a1a',
      padding: '4px 0', marginBottom: '10px', outline: 'none',
      cursor: 'text', borderRadius: '4px',
    });
    this.nameEl.contentEditable = 'true';
    this.nameEl.textContent = 'Untitled Project';
    this.nameEl.addEventListener('blur', () => {
      const val = this.nameEl.textContent?.trim() || 'Untitled Project';
      this.nameEl.textContent = val;
      this.onProjectNameChange?.(val);
    });
    this.nameEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.nameEl.blur(); }
    });

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';

    const newBtn = this.makeSmallBtn('+ New');
    newBtn.addEventListener('click', () => this.onNewProject?.());

    const delBtn = this.makeSmallBtn('Delete');
    Object.assign(delBtn.style, { color: '#ef4444', borderColor: '#fca5a5' });
    delBtn.addEventListener('click', () => this.onDeleteProject?.());

    btnRow.appendChild(newBtn);
    btnRow.appendChild(delBtn);
    projectSection.appendChild(this.nameEl);
    projectSection.appendChild(btnRow);
    this.el.appendChild(projectSection);

    // Tools section
    const toolsSection = this.makeSection();
    toolsSection.appendChild(this.makeSectionTitle('Tools'));
    for (const { emoji, label, action } of [
      { emoji: '➕', label: 'Add Task', action: 'add-task' },
      { emoji: '🏊', label: 'Swimlanes', action: 'swimlanes' },
      { emoji: '🛠️', label: 'Trades', action: 'trades' },
      { emoji: '📅', label: 'Go to Today', action: 'go-to-today' },
      { emoji: '🔗', label: 'Dependencies', action: 'toggle-deps' },
    ]) {
      const btn = this.makeActionBtn(`${emoji} ${label}`, action);
      toolsSection.appendChild(btn);
    }
    this.el.appendChild(toolsSection);

    // AI section
    const aiSection = this.makeSection();
    aiSection.appendChild(this.makeSectionTitle('AI'));
    const aiBtn = this.makeActionBtn('🤖 AI Composer', 'ai-composer');
    aiBtn.style.opacity = '0.4';
    aiBtn.style.cursor = 'not-allowed';
    aiBtn.onclick = null;
    aiSection.appendChild(aiBtn);
    this.el.appendChild(aiSection);

    // Export section
    const exportSection = this.makeSection();
    exportSection.appendChild(this.makeSectionTitle('Export'));
    exportSection.appendChild(this.makeActionBtn('💾 Export JSON', 'export-json'));
    this.el.appendChild(exportSection);

    // Footer
    const footer = document.createElement('div');
    Object.assign(footer.style, {
      padding: '16px', fontSize: '11px', color: '#aaa',
      textAlign: 'center', marginTop: 'auto',
    });
    footer.textContent = 'Saves automatically';
    this.el.appendChild(footer);

    container.appendChild(this.el);
  }

  private makeSection(): HTMLElement {
    const div = document.createElement('div');
    Object.assign(div.style, { padding: '12px 16px', borderBottom: '1px solid #f0f0f0' });
    return div;
  }

  private makeSectionTitle(text: string): HTMLElement {
    const el = document.createElement('div');
    Object.assign(el.style, {
      fontSize: '11px', fontWeight: '600', textTransform: 'uppercase',
      color: '#999', letterSpacing: '0.5px', marginBottom: '8px',
    });
    el.textContent = text;
    return el;
  }

  private makeActionBtn(text: string, action: string): HTMLElement {
    const btn = document.createElement('button');
    Object.assign(btn.style, {
      display: 'block', width: '100%', textAlign: 'left',
      padding: '8px 12px', border: 'none', background: 'transparent',
      fontSize: '13px', color: '#333', borderRadius: '6px',
      cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s ease',
    });
    btn.textContent = text;
    btn.addEventListener('mouseenter', () => { if (btn.style.opacity !== '0.4') btn.style.background = '#f3f4f6'; });
    btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
    btn.addEventListener('click', () => this.onAction?.(action));
    return btn;
  }

  private makeSmallBtn(text: string): HTMLButtonElement {
    const btn = document.createElement('button');
    Object.assign(btn.style, {
      padding: '6px 12px', fontSize: '12px', fontWeight: '500',
      border: '1px solid #e0e0e0', borderRadius: '6px',
      background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
      color: '#333', transition: 'background 0.15s ease',
    });
    btn.textContent = text;
    btn.addEventListener('mouseenter', () => btn.style.background = '#f3f4f6');
    btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
    return btn;
  }

  setProjectName(name: string) {
    this.nameEl.textContent = name;
  }

  open() {
    this.isOpen = true;
    this.el.style.transform = 'translateX(0)';
  }

  close() {
    this.isOpen = false;
    this.el.style.transform = 'translateX(-260px)';
    this.onClose?.();
  }

  toggle() {
    if (this.isOpen) this.close(); else this.open();
  }

  getIsOpen() { return this.isOpen; }
}
