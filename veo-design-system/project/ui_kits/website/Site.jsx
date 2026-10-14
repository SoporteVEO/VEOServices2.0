const { Logo: WLogo, Glyph: WGlyph, Input: WInput, Button: WButton } = window.VEODesignSystem_0c07b8;
const WA = "../../assets";

function SiteNav({ go, page }) {
  const links = [["home", "Inicio"], ["home", "Estructuras"], ["home", "Sitecam"], ["home", "Nosotros"], ["contact", "Contacto"]];
  return (
    <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "30px 48px" }}>
      <span onClick={() => go("home")} style={{ cursor: "pointer" }}><WLogo variant="light" height={24} assetsBase={WA} /></span>
      <nav style={{ display: "flex", gap: 30 }}>
        {links.map(([p, l], i) => <a key={i} onClick={(e) => { e.preventDefault(); go(p); }} href="#" style={{ color: "var(--veo-white)", textDecoration: "none", font: "400 12px/1 var(--font-sans)", opacity: (p === page && (p === "contact" ? l === "Contacto" : l === "Inicio")) ? 1 : 0.7 }}>{l}</a>)}
      </nav>
    </div>
  );
}

function Home({ go }) {
  return (
    <section style={{ position: "relative", minHeight: 820, background: "var(--veo-dark)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <img src="../../assets/imagery/bar-barrido.jpg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
      <SiteNav go={go} page="home" />
      <div style={{ position: "relative", padding: "0 48px", font: "400 12px var(--font-sans)", color: "var(--veo-gray-40)" }}>San Salvador · El Salvador</div>
      <div style={{ position: "absolute", right: 96, top: 120, width: 220, height: 420, background: "var(--veo-lime)", opacity: 0.92 }}>
        <span style={{ position: "absolute", right: 0, top: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "var(--veo-lime)", font: "400 12px var(--font-sans)", color: "var(--veo-dark)" }}>Reservar <WGlyph name="arrow-up-right" size={12} /></span>
      </div>
      <div style={{ position: "relative", marginTop: "auto", padding: "0 48px 48px", display: "flex", flexDirection: "column", gap: 72 }}>
        <h1 style={{ margin: 0, font: "600 96px/0.95 var(--font-display)", letterSpacing: "-.03em", color: "var(--veo-white)" }}>Tú dinos quién.<br /><span style={{ color: "var(--veo-lime)" }}>Nosotros, dónde.</span></h1>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 120 }}>
          <span style={{ font: "300 14px/1.4 var(--font-sans)", color: "var(--veo-ice)" }}>Dale a tu marca <b style={{ fontWeight: 600 }}>Presencia Visual Inteligente.</b></span>
          <button onClick={() => go("contact")} style={{ width: 96, height: 96, background: "var(--veo-lime)", border: 0, cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 12, textAlign: "left", font: "600 12px/1.1 var(--font-sans)", textTransform: "uppercase", color: "var(--veo-dark)" }}>Hazlo<br />ahora<WGlyph name="arrow-up-right" size={18} style={{ alignSelf: "flex-end" }} /></button>
        </div>
      </div>
    </section>
  );
}

function Contact({ go }) {
  const [sent, setSent] = React.useState(false);
  return (
    <section>
      <div style={{ background: "var(--veo-dark)" }}><SiteNav go={go} page="contact" /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 600 }}>
        <div style={{ background: "var(--veo-lime)", padding: 48, display: "flex", flexDirection: "column", gap: 48 }}>
          <span style={{ display: "flex", gap: 12, font: "600 12px/1 var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--veo-dark)" }}><span>04</span>— El momento es ahora</span>
          <h2 style={{ margin: "auto 0 0", font: "600 72px/0.95 var(--font-display)", letterSpacing: "-.03em", color: "var(--veo-dark)" }}>Haz tu marca visible, verificable, ahora.</h2>
          <div style={{ borderTop: "1px solid var(--veo-dark)", paddingTop: 18, display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ font: "600 36px/1 var(--font-display)", color: "var(--veo-dark)" }}>24h</span>
            <span style={{ font: "400 12px/1.3 var(--font-sans)", color: "var(--veo-dark)", maxWidth: 220 }}>El tiempo en que le respondemos con una propuesta y los datos del corredor.</span>
          </div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} style={{ background: "var(--veo-ice)", padding: 48, display: "flex", flexDirection: "column", gap: 30, justifyContent: "center" }}>
          <WInput label="Nombre" placeholder="¿Cómo te llamamos?" />
          <WInput label="Empresa" placeholder="Nombre de su marca" />
          <WInput label="Correo" placeholder="nombre@empresa.com" />
          <WInput label="¿Qué necesita?" placeholder="Cuéntenos el objetivo, plazo o corredor." />
          <WButton type="submit" fullWidth icon={<WGlyph name={sent ? "check" : "arrow-up-right"} size={16} />}>{sent ? "Recibido. Le respondemos en 24 h." : "Quiero ver mi marca puesta"}</WButton>
        </form>
      </div>
      <div style={{ background: "var(--veo-dark)", padding: "72px 48px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <WLogo variant="light" height={36} assetsBase={WA} />
        <span style={{ font: "600 48px/1 var(--font-display)", letterSpacing: "-.02em", color: "var(--veo-white)" }}>Lo que<br />muestras<br /><span style={{ color: "var(--veo-lime)" }}>importa.</span></span>
      </div>
    </section>
  );
}
Object.assign(window, { Home, Contact });
