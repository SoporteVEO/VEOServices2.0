const { Logo: LLogo, Input: LInput, Button: LButton, Checkbox: LCheckbox, Glyph: LGlyph } = window.VEODesignSystem_0c07b8;

function Login({ onLogin }) {
  const [email, setEmail] = React.useState("ana.morales@cafecumbre.com");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", minHeight: "100vh" }}>
      <div style={{ position: "relative", background: "var(--veo-dark)", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 48 }}>
        <img src="../../assets/imagery/bar-barrido.jpg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} />
        <div style={{ position: "relative" }}><LLogo variant="light" height={28} assetsBase="../../assets" /></div>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ font: "600 72px/0.95 var(--font-display)", letterSpacing: "-.02em", color: "var(--veo-white)" }}>Visible.<br />Verificable.<br /><span style={{ color: "var(--veo-lime)" }}>VEO.</span></div>
          <p style={{ margin: 0, maxWidth: 420, font: "300 18px/1.4 var(--font-sans)", color: "var(--veo-ice)" }}>El estado de su campaña, sus exhibiciones y los permisos de cada estructura, en un solo lugar.</p>
        </div>
      </div>
      <div style={{ background: "var(--veo-ice)", display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} style={{ width: 380, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 12, font: "600 12px/1 var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase" }}><span style={{ width: 12, height: 12, background: "var(--veo-lime)" }} />VEO Services</span>
            <h1 style={{ margin: 0, font: "600 36px/1.1 var(--font-display)", color: "var(--veo-dark)" }}>Ingresar</h1>
          </div>
          <LInput label="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
          <LInput label="Contraseña" type="password" defaultValue="••••••••••" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <LCheckbox label="Mantener sesión" defaultChecked />
            <a href="#" style={{ font: "400 12px var(--font-sans)" }}>Recuperar acceso</a>
          </div>
          <LButton type="submit" fullWidth icon={<LGlyph name="arrow-right" size={16} />}>Ingresar al portal</LButton>
          <p style={{ margin: 0, font: "400 12px/1.4 var(--font-sans)", color: "var(--text-muted)" }}>¿Aún no es cliente? Escríbanos y le respondemos en 24 h.</p>
        </form>
      </div>
    </div>
  );
}
window.Login = Login;
