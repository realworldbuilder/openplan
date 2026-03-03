export class Toolbar {
  private el: HTMLElement;
  private nameEl: HTMLElement;
  private onHamburger: (() => void) | null = null;
  private onNameChange: ((name: string) => void) | null = null;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', top: '0', left: '0', right: '0',
      height: '48px', background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', zIndex: '100',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    });

    const hamburger = document.createElement('button');
    Object.assign(hamburger.style, {
      width: '36px', height: '36px', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'transparent', border: 'none', fontSize: '18px',
      cursor: 'pointer', borderRadius: '6px', color: '#555',
      transition: 'background 0.15s ease', flexShrink: '0',
    });
    hamburger.textContent = '☰';
    hamburger.addEventListener('mouseenter', () => hamburger.style.background = '#f3f4f6');
    hamburger.addEventListener('mouseleave', () => hamburger.style.background = 'transparent');
    hamburger.addEventListener('click', () => this.onHamburger?.());

    const logo = document.createElement('span');
    Object.assign(logo.style, {
      fontWeight: '700', fontSize: '15px', color: '#1a1a1a',
      marginLeft: '8px',
    });
    logo.textContent = 'OpenPlan';

    const sep = document.createElement('div');
    Object.assign(sep.style, {
      width: '1px', height: '24px', background: '#e5e7eb',
      margin: '0 12px', flexShrink: '0',
    });

    this.nameEl = document.createElement('span');
    Object.assign(this.nameEl.style, {
      fontWeight: '500', fontSize: '14px', color: '#555',
      cursor: 'pointer', padding: '4px 8px', borderRadius: '6px',
      transition: 'background 0.15s ease', outline: 'none',
    });
    this.nameEl.textContent = 'Untitled Project';
    this.nameEl.addEventListener('mouseenter', () => this.nameEl.style.background = '#f3f4f6');
    this.nameEl.addEventListener('mouseleave', () => { if (!this.nameEl.isContentEditable) this.nameEl.style.background = 'transparent'; });
    this.nameEl.addEventListener('click', () => this.startEditing());

    this.el.appendChild(hamburger);
    this.el.appendChild(logo);
    this.el.appendChild(sep);
    this.el.appendChild(this.nameEl);
    container.appendChild(this.el);
  }

  private startEditing() {
    this.nameEl.contentEditable = 'true';
    this.nameEl.style.background = '#f3f4f6';
    this.nameEl.focus();
    const range = document.createRange();
    range.selectNodeContents(this.nameEl);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    const finish = () => {
      this.nameEl.contentEditable = 'false';
      this.nameEl.style.background = 'transparent';
      const val = this.nameEl.textContent?.trim() || 'Untitled Project';
      this.nameEl.textContent = val;
      this.onNameChange?.(val);
    };

    this.nameEl.addEventListener('blur', finish, { once: true });
    this.nameEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); this.nameEl.blur(); }
      if (e.key === 'Escape') { this.nameEl.textContent = this.nameEl.textContent; this.nameEl.blur(); }
    }, { once: true });
  }

  setProjectName(name: string) {
    this.nameEl.textContent = name;
  }

  onToggleSidebar(cb: () => void) { this.onHamburger = cb; }
  onProjectNameChange(cb: (n: string) => void) { this.onNameChange = cb; }
}
