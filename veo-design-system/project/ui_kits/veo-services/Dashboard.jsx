const { Card: DCard, StatTile: DStat, Tag: DTag, Button: DButton, Glyph: DGlyph, Toast: DToast } = window.VEODesignSystem_0c07b8;

function Dashboard({ openCampaign }) {
  const [filter, setFilter] = React.useState("all");
  const [toast, setToast] = React.useState(true);
  const list = window.VEO_DATA.campaigns.filter((c) => filter === "all" || c.status === filter);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Topbar eyebrow="Café Cumbre" title="Campañas" />
      <div style={{ padding: 48, display: "flex", flexDirection: "column", gap: 36 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <DStat value="2,1M" label="Impactos verificados este trimestre" />
          <DStat tone="structure" value="14" label="Estructuras en exhibición" />
          <DStat tone="sunken" value="99,4%" label="Uptime de pantallas DOOH" />
          <DStat tone="sunken" value="4 h" label="Fuera de servicio · crédito aplicado" />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[["all", "Todas"], ["active", "Activas"], ["pending", "Programadas"], ["verified", "Finalizadas"]].map(([v, l]) => <DTag key={v} selected={filter === v} onClick={() => setFilter(v)}>{l}</DTag>)}
          </div>
          <DButton variant="signal" icon={<DGlyph name="arrow-up-right" size={16} />}>Solicitar propuesta</DButton>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {list.map((c, i) => (
            <DCard key={c.id} interactive onClick={() => openCampaign(c)} eyebrow={`${c.id} · ${c.corridor}`} title={c.name}
              media={["../../assets/imagery/arq-arquitectura.jpg", "../../assets/imagery/dooh-transit.jpg", "../../assets/imagery/billboard-structure.jpg"][i % 3]} mediaHeight={150}
              footer={<><StatusBadge status={c.status} /><span style={{ marginLeft: "auto", font: "400 12px var(--font-sans)", color: "var(--text-muted)" }}>{c.dates}</span></>}>
              <div style={{ display: "flex", gap: 24 }}>
                <span><b style={{ fontWeight: 600 }}>{c.structures}</b> estructuras</span>
                <span><b style={{ fontWeight: 600 }}>{c.impacts}</b> impactos</span>
              </div>
              <div style={{ height: 6, background: "var(--veo-ice)", marginTop: 12 }}><div style={{ height: 6, width: `${c.progress}%`, background: "var(--veo-dark)" }} /></div>
            </DCard>
          ))}
        </div>
      </div>
      {toast ? <DToast tone="danger" title="Pantalla Multiplaza: 4 h fuera de servicio" onClose={() => setToast(false)} style={{ position: "fixed", right: 24, bottom: 24 }}>El equipo atendió en sitio. Las horas están registradas y el crédito aplicado en su contrato.</DToast> : null}
    </div>
  );
}
window.Dashboard = Dashboard;
