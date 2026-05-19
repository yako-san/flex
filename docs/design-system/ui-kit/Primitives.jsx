// FLEX UI kit — shared primitives: Button, IconButton, Pill, PillsToggle,
// PageHeader, Card, Input, Checkbox, Sidebar, AppShell.
// All styled via /ui_kits/flex_app/styles.css.

const { Plus } = window.FlexIcons;

// ===== Button =====
function Button({ variant = 'primary', size = 'md', children, className = '', ...props }) {
  const cls = `btn ${variant} ${size === 'sm' ? 'sm' : ''} ${className}`;
  return <button className={cls} {...props}>{children}</button>;
}

// ===== IconButton =====
function IconButton({ tone = 'add', size = 'md', ariaLabel, children, className = '', ...props }) {
  const cls = `ibtn ${tone === 'addOutline' ? 'outline' : ''} ${tone === 'util' ? 'util' : ''} ${tone === 'utilDark' ? 'utilDark' : ''} ${className}`;
  return <button className={cls} aria-label={ariaLabel} {...props}>{children}</button>;
}
function AddButton(props) {
  return <IconButton tone="add" {...props}><Plus size={22} stroke={3}/></IconButton>;
}

// ===== Pill =====
function Pill({ variant = 'neutral', children, className = '' }) {
  return <span className={`pill ${variant} ${className}`}>{children}</span>;
}

// ===== PillsToggle (segmented, with sliding yellow indicator) =====
function PillsToggle({ options, value, onChange }) {
  const rootRef = React.useRef(null);
  const btnRefs = React.useRef({});
  const [indicator, setIndicator] = React.useState({ x: 0, w: 0, ready: false });

  const sync = React.useCallback(() => {
    const root = rootRef.current;
    const btn = btnRefs.current[value];
    if (!root || !btn) return;
    const rRoot = root.getBoundingClientRect();
    const rBtn = btn.getBoundingClientRect();
    setIndicator({ x: rBtn.left - rRoot.left, w: rBtn.width, ready: true });
  }, [value]);

  React.useLayoutEffect(() => {
    sync();
    const onResize = () => sync();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [sync]);

  return (
    <div className="pills-toggle" role="radiogroup" ref={rootRef}>
      <span
        className="pills-toggle-indicator"
        style={{
          transform: `translateX(${indicator.x}px)`,
          width: indicator.w,
          opacity: indicator.ready ? 1 : 0,
        }}
      />
      {options.map(o => (
        <button
          key={o.value} role="radio" aria-checked={o.value === value}
          ref={el => { btnRefs.current[o.value] = el; }}
          className={o.value === value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >{o.label}</button>
      ))}
    </div>
  );
}

// ===== PageHeader =====
function PageHeader({ eyebrow, title, hint, subline, actions }) {
  return (
    <header className="page-header">
      <div className="left">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}{hint ? <span className="help" title={hint}>?</span> : null}</h1>
        {subline ? <div className="subline">{subline}</div> : null}
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </header>
  );
}

// ===== Input / Field =====
function Field({ label, children }) {
  return <div className="field"><label>{label}</label>{children}</div>;
}
function Input(props) {
  return <input className="input" {...props}/>;
}

// ===== Checkbox =====
function Checkbox({ checked, onChange, label, ...props }) {
  return (
    <label style={{display:'inline-flex',alignItems:'center',gap:8,fontSize:13,cursor:'pointer'}}>
      <input type="checkbox" className="checkbox" checked={checked} onChange={onChange} {...props}/>
      {label ? <span>{label}</span> : null}
    </label>
  );
}

// ===== Section Card (white/85 with header) =====
function SectionCard({ icon, title, count, action, children }) {
  return (
    <section className="card-white">
      <header className="section-head">
        <h2>{icon}{title}</h2>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {count != null ? <span className="count">{count}</span> : null}
          {action}
        </div>
      </header>
      <div style={{padding:8}}>{children}</div>
    </section>
  );
}

Object.assign(window, {
  Button, IconButton, AddButton, Pill, PillsToggle, PageHeader,
  Field, Input, Checkbox, SectionCard,
});
