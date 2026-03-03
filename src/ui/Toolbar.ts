export class Toolbar {
  private el: HTMLElement;
  private nameEl: HTMLSpanElement;
  private nameChangeCb: ((name: string) => void) | null = null;
  private zoomToFitCb: (() => void) | null = null;
  private exportCb: ((format: string) => void) | null = null;
  private hamburgerCb: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'toolbar';
    Object.assign(this.el.style, {
      position: 'fixed', top: '0', left: '0', right: '0',
      height: '48px', background: '#fff',
      borderBottom: '1px solid #e0e0e0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', zIndex: '100',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    });

    // Left section
    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.alignItems = 'center';
    left.style.gap = '12px';

    const hamburger = document.createElement('button');
    Object.assign(hamburger.style, {
      background: 'transparent', border: 'none', fontSize: '20px',
      cursor: 'pointer', padding: '4px 8px', borderRadius: '6px',
      transition: 'background 0.15s ease',
    });
    hamburger.textContent = '☰';
    hamburger.title = 'Menu';
    hamburger.addEventListener('mouseenter', () => hamburger.style.background = '#f3f4f6');
    hamburger.addEventListener('mouseleave', () => hamburger.style.background = 'transparent');
    hamburger.addEventListener('click', () => this.hamburgerCb?.());

    this.nameEl = document.createElement('span');
    Object.assign(this.nameEl.style, {
      fontSize: '14px', fontWeight: '600', color: '#1a1a1a',
      cursor: 'pointer', padding: '4px 8px', borderRadius: '6px',
      transition: 'background 0.15s ease',
    });
    this.nameEl.textContent = 'Untitled Project';
    this.nameEl.title = 'Click to rename';
    this.nameEl.addEventListener('mouseenter', () => this.nameEl.style.background = '#f3f4f6');
    this.nameEl.addEventListener('mouseleave', () => this.nameEl.style.background = 'transparent');
    this.nameEl.addEventListener('click', () => this.startEditing());

    left.appendChild(hamburger);
    left.appendChild(this.nameEl);

    // Right section
    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.alignItems = 'center';
    right.style.gap = '8px';

    const zoomBtn = this.makeButton('Zoom to Fit', () => this.zoomToFitCb?.());
    const exportBtn = this.makeButton('Export ▾', () => this.showExportMenu(exportBtn));

    right.appendChild(zoomBtn);
    right.appendChild(exportBtn);

    this.el.appendChild(left);
    this.el.appendChild(right);
    container.appendChild(this.el);
  }

  private makeButton(text: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    Object.assign(btn.style, {
      background: 'transparent', border: '1px solid #e0e0e0',
      padding: '6px 12px', borderRadius: '6px', fontSize: '13px',
      fontWeight: '500', color: '#333', cursor: 'pointer',
      transition: 'all 0.15s ease',
      fontFamily: 'inherit',
    });
    btn.textContent = text;
    btn.addEventListener('mouseenter', () => { btn.style.background = '#f3f4f6'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
    btn.addEventListener('click', onClick);
    return btn;
  }

  private showExportMenu(anchor: HTMLElement) {
    const existing = document.getElementById('export-menu');
    if (existing) { existing.remove(); return; }

    const menu = document.createElement('div');
    menu.id = 'export-menu';
    Object.assign(menu.style, {
      position: 'absolute', top: '44px', right: '16px',
      background: '#fff', border: '1px solid #e0e0e0',
      borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      padding: '4px 0', zIndex: '200', minWidth: '140px',
    });

    for (const fmt of ['PDF', 'PNG', 'JSON']) {
      const item = document.createElement('div');
      Object.assign(item.style, {
        padding: '8px 16px', cursor: 'pointer', fontSize: '13px',
        transition: 'background 0.15s ease',
      });
      item.textContent = fmt;
      item.addEventListener('mouseenter', () => item.style.background = '#f3f4f6');
      item.addEventListener('mouseleave', () => item.style.background = 'transparent');
      item.addEventListener('click', () => {
        this.exportCb?.(fmt.toLowerCase());
        menu.remove();
      });
      menu.appendChild(item);
    }

    this.el.appendChild(menu);
    const close = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node) && e.target !== anchor) {
        menu.remove();
        document.removeEventListener('click', close);
      }
    };
    setTimeout(() => document.addEventListener('click', close), 0);
  }

  private startEditing() {
    const input = document.createElement('input');
    Object.assign(input.style, {
      fontSize: '14px', fontWeight: '600', color: '#1a1a1a',
      border: '1px solid #e0e0e0', borderRadius: '6px',
      padding: '4px 8px', background: '#f5f5f5',
      outline: 'none', width: '200px',
      fontFamily: 'inherit',
    });
    input.value = this.nameEl.textContent || '';
    this.nameEl.replaceWith(input);
    input.focus();
    input.select();

    const finish = () => {
      const val = input.value.trim() || 'Untitled Project';
      this.nameEl.textContent = val;
      input.replaceWith(this.nameEl);
      this.nameChangeCb?.(val);
    };
    input.addEventListener('blur', finish);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur();
      if (e.key === 'Escape') { input.value = this.nameEl.textContent || ''; input.blur(); }
    });
  }

  setProjectName(name: string) {
    this.nameEl.textContent = name;
  }

  onProjectNameChange(cb: (name: string) => void) { this.nameChangeCb = cb; }
  onZoomToFit(cb: () => void) { this.zoomToFitCb = cb; }
  onExport(cb: (format: string) => void) { this.exportCb = cb; }
  onHamburger(cb: () => void) { this.hamburgerCb = cb; }
}
