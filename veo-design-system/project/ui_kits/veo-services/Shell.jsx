const { Logo, Glyph, Input, IconButton, Badge } = window.VEODesignSystem_0c07b8;
const A = "../../assets";
const STATUS = { active: ["active", "Activa"], pending: ["pending", "Programada"], verified: ["verified", "Verificada"], offline: ["offline", "Fuera de servicio"] };

function NavItem({ icon, label, active, onClick }) {
  const [h, setH] = React.useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "flex", alignItems: "center", gap: 12, height: 48, padding: "0 24px", border: 0, width: "100%", cursor: "pointer", textAlign: "left",
        background: active ? "var(--veo-dark-90)" : h ? "var(--veo-dark-90)" : "transparent", color: active ? "var(--veo-white)" : "var(--veo-gray-40)",
        font: `${active ? 600 : 400} 14px/1 var(--font-sans)` }}>
      <span style={{ width: 6, height: 6, background: active ? "var(--veo-lime)" : "transparent", marginLeft: -12 }} />
      <Glyph name={icon} size={18} />
      {label}
    </button>
  );
}

function Sidebar({ route, go, onLogout }) {
  const items = [["dashboard", "layout-grid", "Campañas"], ["inventory", "map-pin", "Inventario"], ["reports", "chart-column", "Reportes"], ["permits", "shield-check", "Permisos"]];
  return (
    <aside style={{ width: 240, flexShrink: 0, background: "var(--veo-dark)", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div style={{ padding: "30px 24px 36px", display: "flex", alignItems: "center", gap: 12 }}>
        <Logo variant="light" height={22} assetsBase={A} />
        <span style={{ font: "400 12px/1 var(--font-sans)", color: "var(--veo-gray-40)", paddingTop: 4 }}>Services</span>
      </div>
      <nav style={{ display: "flex", flexDirection: "column" }}>
        {items.map(([r, i, l]) => <NavItem key={r} icon={i} label={l} active={route === r || (r === "dashboard" && route === "campaign")} onClick={() => go(r)} />)}
      </nav>
      <div style={{ marginTop: "auto", borderTop: "1px solid var(--veo-dark-80)" }}>
        <NavItem icon="settings" label="Configuración" onClick={() => {}} />
        <NavItem icon="log-out" label="Cerrar sesión" onClick={onLogout} />
      </div>
    </aside>
  );
}

function Topbar({ title, eyebrow, actions }) {
  const u = window.VEO_DATA.user;
  return (
    <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, padding: "30px 48px 24px", borderBottom: "1px solid var(--border-subtle)", background: "var(--veo-white)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {eyebrow ? <span style={{ font: "600 12px/1 var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--veo-gray)" }}>{eyebrow}</span> : null}
        <h1 style={{ margin: 0, font: "600 36px/1.1 var(--font-display)", letterSpacing: "-.02em", color: "var(--veo-dark)" }}>{title}</h1>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {actions}
        <Input variant="boxed" leading={<Glyph name="search" size={16} />} placeholder="Buscar campaña o permiso" style={{ width: 260 }} />
        <IconButton label="Notificaciones" variant="secondary" icon={<Glyph name="bell" size={18} />} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 12 }}>
          <div style={{ width: 36, height: 36, background: "var(--veo-gray)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "600 14px var(--font-display)" }}>AM</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ font: "600 12px/1 var(--font-sans)" }}>{u.name}</span>
            <span style={{ font: "400 12px/1 var(--font-sans)", color: "var(--text-muted)" }}>{u.company}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatusBadge({ status }) { const [t, l] = STATUS[status] || STATUS.pending; return <Badge tone={t}>{l}</Badge>; }

Object.assign(window, { Sidebar, Topbar, StatusBadge, KIT_ASSETS: A });
