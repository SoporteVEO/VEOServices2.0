const { Tabs: CTabs, Button: CButton, Glyph: CGlyph, VerificationSeal: CSeal, Card: CCard, Dialog: CDialog, Select: CSelect, IconButton: CIconButton, Tooltip: CTooltip, OOHIcon: COOH } = window.VEODesignSystem_0c07b8;

function Row({ cells, head }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1.2fr 2fr 150px 48px", alignItems: "center", gap: 18, padding: "0 18px", height: head ? 42 : 60,
      borderBottom: "1px solid var(--border-subtle)", font: head ? "600 12px/1 var(--font-sans)" : "400 14px/1.3 var(--font-sans)",
      letterSpacing: head ? ".08em" : 0, textTransform: head ? "uppercase" : "none", color: head ? "var(--veo-gray)" : "var(--veo-dark)", background: head ? "var(--veo-ice)" : "#fff" }}>
      {cells.map((c, i) => <div key={i}>{c}</div>)}
    </div>
  );
}

function Campaign({ campaign, back }) {
  const c = campaign || window.VEO_DATA.campaigns[0];
  const [tab, setTab] = React.useState("exh");
  const [dlg, setDlg] = React.useState(false);
  const ex = window.VEO_DATA.exhibitions;
  return (
    <div>
      <Topbar eyebrow={<span style={{ display: "inline-flex", gap: 6, alignItems: "center", cursor: "pointer" }} onClick={back}><CGlyph name="arrow-left" size={14} />Campañas · {c.id}</span>} title={c.name}
        actions={<CButton variant="secondary" icon={<CGlyph name="download" size={16} />} onClick={() => setDlg(true)}>Reporte</CButton>} />
      <div style={{ padding: "0 48px" }}>
        <CTabs value={tab} onChange={setTab} items={[{ value: "res", label: "Resumen" }, { value: "exh", label: "Exhibiciones", count: ex.length }, { value: "ev", label: "Evidencia" }, { value: "per", label: "Permisos", count: c.structures }]} />
      </div>
      <div style={{ padding: 48, display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
        <div style={{ border: "1px solid var(--border-subtle)" }}>
          {tab === "exh" || tab === "res" ? <>
            <Row head cells={["Fecha", "Estructura", "Evidencia", "Estado", ""]} />
            {ex.map((e, i) => <Row key={i} cells={[e.date, e.structure, e.evidence, <StatusBadge status={e.status} />, <CTooltip content="Ver evidencia"><CIconButton size="sm" label="Ver" icon={<CGlyph name="eye" size={16} />} /></CTooltip>]} />)}
          </> : null}
          {tab === "ev" ? <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, padding: 6 }}>
            {["arq-arquitectura.jpg", "billboard-structure.jpg", "dooh-transit.jpg", "obs-observador.jpg", "bar-barrido.jpg", "billboard-animation.jpg"].map((f) => <div key={f} style={{ position: "relative", height: 150 }}><img src={`../../assets/imagery/${f}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /><span style={{ position: "absolute", left: 6, bottom: 6, background: "var(--veo-dark)", color: "#fff", font: "400 12px var(--font-sans)", padding: "3px 6px" }}>13 oct · 06:00 · SS-0142</span></div>)}
          </div> : null}
          {tab === "per" ? window.VEO_DATA.structures.slice(0, 4).map((s) => <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 18, padding: 18, borderBottom: "1px solid var(--border-subtle)" }}><COOH name={s.icon} size={36} assetsBase="../../assets" /><div style={{ flex: 1 }}><div style={{ font: "600 14px var(--font-sans)" }}>{s.name}</div><div style={{ font: "400 12px var(--font-sans)", color: "var(--text-muted)" }}>{s.format} · {s.corridor}</div></div><span style={{ font: "600 14px var(--font-display)" }}>Permiso {s.id}</span><CIconButton size="sm" label="Descargar permiso" icon={<CGlyph name="file-text" size={16} />} /></div>) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <CSeal value={c.impacts} label="Impactos verificados" meta={`Sitecam · ${c.dates}`} assetsBase="../../assets" style={{ width: "100%" }} />
          <CCard tone="sunken" eyebrow="Corredor" title={c.corridor}>Para su objetivo y su temporada, este corredor registró el mayor tráfico en horario de 6 a 9 am.</CCard>
          <CCard eyebrow="Uptime de pantallas" title={c.uptime}>4 h fuera de servicio el 13 oct. Crédito aplicado en su contrato.</CCard>
        </div>
      </div>
      <CDialog open={dlg} onClose={() => setDlg(false)} eyebrow="Reporte de campaña" title="Descargar reporte"
        footer={<><CButton variant="ghost" size="sm" onClick={() => setDlg(false)}>Cancelar</CButton><CButton size="sm" onClick={() => setDlg(false)}>Descargar PDF</CButton></>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span>El reporte incluye exhibiciones, evidencia fotográfica y el número de permiso de cada estructura.</span>
          <CSelect label="Periodo" defaultValue="all" options={[{ value: "all", label: "Toda la campaña" }, { value: "w", label: "Última semana" }]} />
        </div>
      </CDialog>
    </div>
  );
}
window.Campaign = Campaign;
