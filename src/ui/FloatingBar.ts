export class FloatingBar {
  private el: HTMLElement;
  onAction: ((action: string) => void) | null = null;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'floating-bar';
    Object.assign(this.el.style, {
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: '4px',
      background: '#fff', borderRadius: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
      padding: '6px 8px', zIndex: '90',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    });

    const buttons: [string, string, boolean][] = [
      ['➕', 'add-task', false],
      ['📋', 'sidebar', false],
      ['⚙️', 'settings', false],
      ['🎯', 'zoom-to-fit', false],
      ['🤖', 'ai', true],
    ];

    for (const [icon, action, disabled] of buttons) {
      const btn = document.createElement('button');
      Object.assign(btn.style, {
        width: '44px', height: '44px', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none',
        borderRadius: '12px', fontSize: '18px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? '0.35' : '1',
        transition: 'background 0.15s ease',
      });
      btn.textContent = icon;
      btn.title = action.replace(/-/g, ' ');
      if (!disabled) {
        btn.addEventListener('mouseenter', () => btn.style.background = '#f3f4f6');
        btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
        btn.addEventListener('click', () => this.onAction?.(action));
      }
      this.el.appendChild(btn);
    }

    container.appendChild(this.el);
  }

  show() { this.el.style.display = 'flex'; }
  hide() { this.el.style.display = 'none'; }
}
