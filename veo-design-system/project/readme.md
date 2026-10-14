# VEO Design System

VEO is an OOH & DOOH media operator in El Salvador: 15 years running its own billboard, screen and street-furniture network (359 structures) in private, high-traffic locations, with its own monitoring tech (**Sitecam**). VEO sells *verifiability*: every campaign comes with permit numbers, exhibition logs and photo evidence. Expansion to Guatemala and the region is planned.

Products covered here:
- **VEO Services** — the client web app + PWA in development (campaign status, exhibitions, evidence, permits, inventory). No screens were provided; the UI kit is a **proposal** derived from the manual.
- **Website** (veo.com.sv) — recreated from the manual's laptop mockup (p.98).

## Sources
- `uploads/VEO_Manual_de_Marca_2026_Digital.pdf` — Brandbook v1.0 2026, 112 pp. (strategy, voice, logo, palette, type, photography, motion, icons, applications). Extracted text: `scratch/manual.txt`.
- `uploads/VEO_Logotipo_Oscuro_Original.png` — logotipo for dark backgrounds (306×63).
- `uploads/FAVICON_VEO_Isotipo_Lima.png` — isotipo, Lime o + Gray square.
- No codebase, Figma or product screenshots were provided.

## Index
- `styles.css` — entry point (imports only) → `tokens/fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `base.css`
- `fonts/` — Funnel Display + Funnel Sans variable woff2 (Google Fonts)
- `assets/logo/` — logotipo light/dark/mono, isotipo lime/dark/lime-solo (dark & mono are recolors of the supplied PNG)
- `assets/icons/line|color/` — 32 OOH structure icons extracted from manual p.100
- `assets/imagery/` — photo-family references extracted from the manual (ARQ, BAR, OBS, MIR ×5, OBJ, DOOH, billboards)
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand)
- `components/` — React primitives (below)
- `ui_kits/veo-services/` — app click-through · `ui_kits/website/` — site hero + contact
- `SKILL.md` — Agent Skill entry

## Components
- forms/: **Button**, **IconButton**, **Input**, **Select**, **Checkbox**, **Radio** (+ RadioGroup), **Switch**
- display/: **Card**, **Badge**, **Tag**, **StatTile**, **VerificationSeal**, **Logo**
- navigation/: **Tabs**
- feedback/: **Dialog**, **Toast**, **Tooltip**
- icons/: **Glyph** (UI glyphs), **OOHIcon** (brand icon set)

No source defined a component inventory, so this is a standard set sized to the app. Intentional additions beyond a standard set:
- **StatTile** — the manual's "359 / +15" figure tiles (p.110).
- **VerificationSeal** — the manual's *sello de verificación* (isotipo + campaign figure) for Sitecam reports (p.64).
- **OOHIcon** / **Glyph** — wrappers for the brand icon set and the UI glyph substitute.
- **Logo** — wraps the official PNGs.

---

## CONTENT FUNDAMENTALS

Language: **Spanish (El Salvador)**. The voice is "the specialist who knows more than the client about the client's problem, and says it directly".

**Four voice attributes** (non-negotiable):
1. *Directo sin ser brusco* — arrive with a conclusion, not options. ✗ «Tenemos varias opciones que podrían funcionar…» ✓ «Para su objetivo y su temporada, el corredor Sur es el más eficiente. Aquí están los datos.»
2. *Técnico sin ser inaccesible* — data translated to client terms. ✓ «Este corredor registró 890K impactos en 21 días el trimestre pasado.»
3. *Confiable porque lo demuestra* — never declare a virtue; show the fact. ✗ «Somos el operador más confiable.» ✓ «Aquí está el número de permiso de cada estructura.»
4. *Energía de ejecución* — ✓ «Hicimos la revisión anoche. Todo está en orden.»

**Golden rule: present tense, no conditionals.** Nothing that doesn't exist today is said. ✗ «Desarrollaremos…», «En el futuro podremos…» ✓ «El estado de tu campaña está disponible en el portal ahora mismo.» The logo's period encodes this: a finished statement.

**Invariants:** never compare or allude to competitors; never promise what operations haven't confirmed in writing; every claimed fact must be auditable.

**Address (sistema verbal)** — changes with register:
- Institutional (investors, board): *usted*, descriptive, sober, no un-auditable adjectives.
- Consultative (clients, proposals, reports, app UI): *usted* by default; switch to tú/vos only if the client does first. → **VEO Services UI uses usted.**
- Street (billboards, DOOH, social): *voseo*, first person — the structure speaks. ≤6 words urban, ≤4 highway, one idea per piece. Dry self-deprecating humor allowed («Pasás frente a nosotros todos los días. Hoy nos tocaba a nosotros.»). Humor targets only the brand or the neutral environment — never people, the client, politics, bodies, competitors.

**Casing:** the name is written **VEO** in running text; the logo is drawn lowercase. Sentence case for headlines and buttons. Uppercase only for small tracked eyebrows/labels.

**Taglines:** «Visible. Verificable. VEO.» · «Lo que muestras importa.» (a closer, never an opener) · claim «Presencia visual inteligente».

**Emoji:** never. **Numbers:** only real ones (Spanish formatting: 99,2% · 1,2M).

UI copy examples: «Ingresar al portal», «Solicitar propuesta», «Quiero ver mi marca puesta», «Pantalla 07 fuera de servicio — el equipo está en sitio. El crédito ya está aplicado.»

## VISUAL FOUNDATIONS

**Color is defined by how much each one occupies.** Light base (Ice/White) carries reading; **VEO Gray #4A798C** builds structure; **VEO Dark #1B2629** gives institutional authority; **VEO Lime #BAEB56** *signals, never decorates* — CTAs, active states, the logo's square, single data highlights. Approved fields: Lime, Dark, Ice, Gray, White (p.70–71). The logo is never Lime. Status colors (warning/danger) are UI-only additions.

**Type:** Funnel Display (headlines, SemiBold 600, tight 0.95 leading, slight negative tracking) + Funnel Sans (body Light 300; Regular 400 for small screen text). No Bold for emphasis, no condensed. Fixed scale **144·96·72·48·36·24·18·12**, all multiples of 6 — step up/down, never in-between (UI adds 14/16 for dense app screens).

**Grid & spacing:** 6px module; tokens 6·12·18·24·36·48·72·96·144. Generous margins (48px page), big negative space, left-aligned blocks. Logo safe area 3X vs internal gap 1.5X.

**Shape:** "Nothing in VEO's world is circular." Full-cornered rectangles everywhere — radius 0. The only rounded form is the isotipo's stadium o. Radios are square; status markers are square pixels; switches are rectangular.

**The square module** is the core motif: the lime square closing the logo, page-number tabs, pixel clusters dissolving across vehicles/billboards/screens (p.92, 95). Use small lime/dark squares as bullets and markers.

**Cards:** flat, no shadow, square; either a 1px Gray-20 hairline on white, or a solid brand field (Ice / Dark / Gray / Lime). Interactive hover = border goes Dark.

**Borders:** 1px hairlines; forms use a single underline rule (2px Dark on focus). **Shadows:** none on surfaces; soft dark shadow only for floating overlays (toast, dialog).

**Backgrounds & imagery:** full-bleed photography on Dark; cold, desaturated city at eye level (1.55–1.70 m), one sharp subject, the VEO surface as the brightest point, Lime only as emitted light. Five families: ARQ (structure fragments, low angle — backgrounds/covers), BAR (long-exposure light trails — presence), OBS (bokeh, wet glass — street), MIR (high-key studio portraits on Gray/Ice, warm skin, looking off-frame toward content — the only faces), OBJ (the Lime o as a held object — own channels). Renders propose; real photos prove — never mixed. No gradients except darkening photos; no textures, no illustrations.

**Motion:** squares appear, fill, reveal and release — **no sliding, bouncing or rotating**. Short (160–240ms), stepped or standard ease. Transitions never call attention to themselves.

**Hover:** fill swap (Dark → Gray; Lime → Dark with Lime text; outline → Dark fill). **Press:** no shrink; same swap. **Focus:** 2px Lime outline.

**Transparency/blur:** only the Dark scrim (72%) under dialogs and photo darkening behind text; no glassmorphism. Logo is never placed on busy images without a solid block behind it.

**Layout:** fixed Dark sidebar for app; headlines huge and left-aligned; one Lime element per view.

## ICONOGRAPHY

- **Brand icon set** (manual §6.1, p.100): 32 OOH structure icons — billboards, unipoles, screens, mupis, bus shelters, overpasses, trucks, benches. Pixel-cut geometry: square caps, straight cuts, ~2px strokes. Two styles: **line** (single-tone Gray, on Dark) and **color** (Gray/Dark outlines with Lime + Ice fills, on light). Extracted as 96px PNGs to `assets/icons/` → use via `OOHIcon`. ⚠ Raster extractions; SVG masters needed for production.
- **UI glyphs:** the manual defines none. **Substitution:** Lucide (v0.460, ISC) path data embedded in `Glyph`, rendered with square linecaps + miter joins to match the brand set. Flagged — swap if VEO adopts an official UI set.
- The **↗ arrow** (`arrow-up-right`) is the recurring CTA mark (web mockup tiles).
- **No emoji. No unicode pictographs** as icons.
- The **isotipo** is the favicon/avatar/app icon (`assets/logo/veo-isotipo-lime.png`).
