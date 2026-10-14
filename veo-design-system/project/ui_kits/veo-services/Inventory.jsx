const { Tag: ITag, Checkbox: ICheckbox, Switch: ISwitch, Select: ISelect, OOHIcon: IOOH, Button: IButton, Glyph: IGlyph, RadioGroup: IRadio } = window.VEODesignSystem_0c07b8;

function Inventory() {
  const all = window.VEO_DATA.structures;
  const [sel, setSel] = React.useState(all[0].id);
  const [view, setView] = React.useState("Lista");
  const [dooh, setDooh] = React.useState(true);
  const list = all.filter((s) => dooh || !/DOOH/.test(s.format));
  const s = all.find((x) => x.id === sel) || all[0];
  return (
    <div>
      <Topbar eyebrow="359 estructuras" title="Inventario" />
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 360px", minHeight: "calc(100vh - 117px)" }}>
        <div style={{ padding: 24, borderRight: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 24 }}>
          <ISelect label="Corredor" defaultValue="" placeholder="Todos" options={["Corredor Sur", "Centro · Escalón", "Bulevar Constitución"]} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ font: "600 12px/1 var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase" }}>Formato</span>
            <ICheckbox label="Vallas" defaultChecked /><ICheckbox label="Mupis y paradas" defaultChecked /><ICheckbox label="Pantallas DOOH" checked={dooh} onChange={setDooh} />
          </div>
          <ISwitch label="Solo disponibles" />
          <IRadio name="v" value={view} onChange={setView} direction="row" options={["Lista", "Mapa"]} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {list.map((x) => (
            <div key={x.id} onClick={() => setSel(x.id)} style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 24px", cursor: "pointer", borderBottom: "1px solid var(--border-subtle)", background: sel === x.id ? "var(--veo-ice)" : "#fff" }}>
              <span style={{ width: 6, alignSelf: "stretch", background: sel === x.id ? "var(--veo-dark)" : "transparent", margin: "-18px 0 -18px -24px" }} />
              <IOOH name={x.icon} size={40} assetsBase="../../assets" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ font: "600 14px/1.2 var(--font-sans)" }}>{x.name}</span>
                <span style={{ font: "400 12px/1.2 var(--font-sans)", color: "var(--text-muted)" }}>{x.format} · {x.size} · {x.corridor}</span>
              </div>
              <span style={{ font: "400 12px var(--font-sans)", color: "var(--veo-gray)", width: 70 }}>{x.traffic}</span>
              <StatusBadge status={x.status} />
            </div>
          ))}
        </div>
        <div style={{ background: "var(--veo-dark)", color: "#fff", display: "flex", flexDirection: "column" }}>
          <img src="../../assets/imagery/billboard-structure.jpg" alt="" style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            <span style={{ font: "600 12px/1 var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--veo-gray-40)" }}>Permiso {s.id}</span>
            <span style={{ font: "600 36px/1.05 var(--font-display)" }}>{s.name}</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, font: "400 14px/1.3 var(--font-sans)" }}>
              {[["Formato", s.format], ["Medida", s.size], ["Corredor", s.corridor], ["Tráfico", s.traffic]].map(([k, v]) => <div key={k}><div style={{ font: "400 12px var(--font-sans)", color: "var(--veo-gray-40)" }}>{k}</div>{v}</div>)}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><ITag tone="dark">Iluminada</ITag><ITag tone="dark">Espacio privado</ITag><ITag tone="dark">Sitecam</ITag></div>
            <IButton variant="signal" fullWidth icon={<IGlyph name="arrow-up-right" size={16} />}>Reservar estructura</IButton>
          </div>
        </div>
      </div>
    </div>
  );
}
window.Inventory = Inventory;
