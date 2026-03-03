const ACTIONS = [
  { label: '+ Add Task', action: 'add-task' },
  { label: 'Swimlanes', action: 'swimlanes' },
  { label: 'Trades', action: 'trades' },
  { label: 'Today', action: 'go-to-today' },
];

export class FloatingBar {
  private el: HTMLElement;
  onAction: ((action: string) => void) | null = null;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: '2px',
      background: '#fff', borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      padding: '6px 8px', zIndex: '90',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    });

    for (const { label, action } of ACTIONS) {
      const btn = document.createElement('button');
      Object.assign(btn.style, {
        padding: '8px 14px', background: 'transparent', border: 'none',
        borderRadius: '8px', fontSize: '13px', fontWeight: '500',
        color: '#444', cursor: 'pointer', transition: 'background 0.15s ease',
        fontFamily: 'inherit', whiteSpace: 'nowrap',
      });
      btn.textContent = label;
      btn.addEventListener('mouseenter', () => btn.style.background = '#f3f4f6');
      btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
      btn.addEventListener('click', () => this.onAction?.(action));
      this.el.appendChild(btn);
    }

    container.appendChild(this.el);
  }

  show() { this.el.style.display = 'flex'; }
  hide() { this.el.style.display = 'none'; }
}
