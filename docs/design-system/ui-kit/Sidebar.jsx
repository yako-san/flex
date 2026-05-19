// FLEX UI kit — Sidebar component (collapsed/expanded, badges).

const { ChevronRight } = window.FlexIcons;

function Sidebar({ items, activeId, onNavigate, badges = {} }) {
  const [hovered, setHovered] = React.useState(false);
  const expanded = hovered;

  return (
    <aside
      className={`sidebar ${expanded ? 'expanded' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="sidebar-logo"
           style={{ backgroundImage: 'url(../../assets/flex-rond-yako.svg)' }}
           title="FLEX — yako.cyclo" />
      <div className="sidebar-version">v1.0.19<br/>yako</div>

      <nav className="sidebar-nav">
        {items.map((it, i) => {
          const Icon = it.icon;
          const active = it.id === activeId;
          const badge = badges[it.id];
          return (
            <React.Fragment key={it.id}>
              {i > 0 ? <hr className="sb-divider"/> : null}
              <a className={`sb-item ${active ? 'active' : ''}`}
                 onClick={(e) => { e.preventDefault(); onNavigate(it.id); }}
                 href="#" title={it.label}>
                <span className="pastille-bg">
                  <Icon size={26} />
                </span>
                {badge != null && badge > 0 ? (
                  <span className={`badge ${it.badgeVariant || 'jaune'}`}>
                    {badge > 99 ? '99+' : badge}
                  </span>
                ) : null}
                <span className="label">{it.label}</span>
              </a>
            </React.Fragment>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="avatar"
             style={{ background:
               'linear-gradient(135deg,#806642 0%,#fff056 100%)' }} />
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
