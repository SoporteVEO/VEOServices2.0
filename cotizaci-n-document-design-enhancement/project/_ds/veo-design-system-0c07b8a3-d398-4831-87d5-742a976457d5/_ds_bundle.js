/* @ds-bundle: {"format":4,"namespace":"VEODesignSystem_0c07b8","components":[{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"Logo","sourcePath":"components/display/Logo.jsx"},{"name":"StatTile","sourcePath":"components/display/StatTile.jsx"},{"name":"Tag","sourcePath":"components/display/Tag.jsx"},{"name":"VerificationSeal","sourcePath":"components/display/VerificationSeal.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"RadioGroup","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"GLYPH_NAMES","sourcePath":"components/icons/Glyph.jsx"},{"name":"Glyph","sourcePath":"components/icons/Glyph.jsx"},{"name":"OOH_ICONS","sourcePath":"components/icons/OOHIcon.jsx"},{"name":"OOHIcon","sourcePath":"components/icons/OOHIcon.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/display/Badge.jsx":"83327a0e3f44","components/display/Card.jsx":"93e6e49167bb","components/display/Logo.jsx":"c07bf307b13d","components/display/StatTile.jsx":"8253c3c1030d","components/display/Tag.jsx":"345e337e971b","components/display/VerificationSeal.jsx":"8fd0cac0c738","components/feedback/Dialog.jsx":"8c0db041a2aa","components/feedback/Toast.jsx":"5e490bf6c1aa","components/feedback/Tooltip.jsx":"e9cb64051ec0","components/forms/Button.jsx":"708a3588180e","components/forms/Checkbox.jsx":"10a0c55e9899","components/forms/IconButton.jsx":"c9d942738e5e","components/forms/Input.jsx":"01002c8646e2","components/forms/Radio.jsx":"ac5bb7dd70b3","components/forms/Select.jsx":"fe9e6787284f","components/forms/Switch.jsx":"879d15e0f75e","components/icons/Glyph.jsx":"2e303c001f6f","components/icons/OOHIcon.jsx":"fc27a1c822a1","components/navigation/Tabs.jsx":"a131c013ee1b","ui_kits/veo-services/Campaign.jsx":"a2d0a993c142","ui_kits/veo-services/Dashboard.jsx":"d6f2bf265268","ui_kits/veo-services/Inventory.jsx":"cab2325db572","ui_kits/veo-services/Login.jsx":"f11c28f3b6fd","ui_kits/veo-services/Shell.jsx":"e97d046aa409","ui_kits/veo-services/data.js":"76e53cee1a34","ui_kits/website/Site.jsx":"418c1342f09a"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.VEODesignSystem_0c07b8 = window.VEODesignSystem_0c07b8 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/display/Badge.jsx
try { (() => {
const TONES = {
  verified: ["var(--veo-lime)", "var(--veo-dark)", "var(--veo-dark)"],
  active: ["var(--veo-lime-soft)", "var(--veo-success-ink)", "var(--veo-lime-deep)"],
  pending: ["#FBEBC2", "var(--veo-warning-ink)", "var(--veo-warning)"],
  offline: ["#F8D9D6", "var(--veo-danger-ink)", "var(--veo-danger)"],
  neutral: ["var(--veo-ice)", "var(--veo-gray)", "var(--veo-gray)"],
  dark: ["var(--veo-dark)", "var(--veo-white)", "var(--veo-lime)"]
};
function Badge({
  tone = "neutral",
  dot = true,
  children,
  style
}) {
  const [bg, fg, sq] = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 24,
      padding: "0 8px",
      background: bg,
      color: fg,
      borderRadius: 0,
      font: "var(--weight-semibold) 12px/1 var(--font-sans)",
      letterSpacing: "0.02em",
      whiteSpace: "nowrap",
      ...style
    }
  }, dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      background: sq,
      flexShrink: 0
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
const TONES = {
  plain: {
    bg: "var(--veo-white)",
    fg: "var(--veo-dark)",
    bd: "1px solid var(--border-subtle)",
    sub: "var(--veo-gray)"
  },
  sunken: {
    bg: "var(--veo-ice)",
    fg: "var(--veo-dark)",
    bd: "1px solid transparent",
    sub: "var(--veo-gray)"
  },
  inverse: {
    bg: "var(--veo-dark)",
    fg: "var(--veo-white)",
    bd: "1px solid var(--veo-dark)",
    sub: "var(--veo-gray-40)"
  },
  structure: {
    bg: "var(--veo-gray)",
    fg: "var(--veo-white)",
    bd: "1px solid var(--veo-gray)",
    sub: "var(--veo-ice)"
  },
  signal: {
    bg: "var(--veo-lime)",
    fg: "var(--veo-dark)",
    bd: "1px solid var(--veo-lime)",
    sub: "var(--veo-dark)"
  }
};
function Card({
  tone = "plain",
  eyebrow,
  title,
  media,
  mediaHeight = 180,
  padding = 24,
  footer,
  interactive = false,
  onClick,
  children,
  style
}) {
  const [hover, setHover] = React.useState(false);
  const t = TONES[tone] || TONES.plain;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      flexDirection: "column",
      background: t.bg,
      color: t.fg,
      border: interactive && hover ? "1px solid var(--veo-dark)" : t.bd,
      borderRadius: 0,
      cursor: interactive ? "pointer" : undefined,
      transition: "border-color var(--motion-fast) var(--ease-standard)",
      overflow: "hidden",
      ...style
    }
  }, media ? /*#__PURE__*/React.createElement("div", {
    style: {
      height: mediaHeight,
      background: "var(--veo-dark)",
      overflow: "hidden"
    }
  }, typeof media === "string" ? /*#__PURE__*/React.createElement("img", {
    src: media,
    alt: "",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block"
    }
  }) : media) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      flex: 1
    }
  }, eyebrow ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--weight-semibold) 12px/1 var(--font-sans)",
      letterSpacing: "var(--tracking-eyebrow)",
      textTransform: "uppercase",
      color: t.sub
    }
  }, eyebrow) : null, title ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--weight-semibold) 24px/1.1 var(--font-display)"
    }
  }, title) : null, children ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--weight-light) 14px/1.4 var(--font-sans)"
    }
  }, children) : null), footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: `12px ${padding}px`,
      borderTop: `1px solid ${tone === "inverse" ? "var(--veo-dark-80)" : "rgba(27,38,41,.12)"}`,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, footer) : null);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/Logo.jsx
try { (() => {
const FILES = {
  dark: "veo-logo-dark.png",
  light: "veo-logo-light.png",
  mono: "veo-logo-mono-dark.png",
  "isotipo-lime": "veo-isotipo-lime.png",
  "isotipo-dark": "veo-isotipo-dark.png"
};
function Logo({
  variant = "dark",
  height = 24,
  claim = false,
  assetsBase = "assets",
  style
}) {
  const iso = variant.startsWith("isotipo");
  const img = /*#__PURE__*/React.createElement("img", {
    src: `${assetsBase}/logo/${FILES[variant] || FILES.dark}`,
    alt: "VEO",
    style: {
      height,
      width: "auto",
      display: "block"
    }
  });
  if (!claim || iso) return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      ...style
    }
  }, img);
  const ink = variant === "light" ? "var(--veo-white)" : "var(--veo-dark)";
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: height * 0.75,
      ...style
    }
  }, img, /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--weight-regular) ${Math.round(height * 0.42)}px/1.05 var(--font-sans)`,
      color: ink
    }
  }, "Presencia visual", /*#__PURE__*/React.createElement("br", null), "inteligente"));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Logo.jsx", error: String((e && e.message) || e) }); }

// components/display/StatTile.jsx
try { (() => {
const TONES = {
  inverse: ["var(--veo-dark)", "var(--veo-lime)", "var(--veo-white)"],
  structure: ["var(--veo-gray)", "var(--veo-white)", "var(--veo-white)"],
  sunken: ["var(--veo-ice)", "var(--veo-dark)", "var(--veo-gray)"],
  plain: ["var(--veo-white)", "var(--veo-dark)", "var(--veo-gray)"],
  signal: ["var(--veo-lime)", "var(--veo-dark)", "var(--veo-dark)"]
};
function StatTile({
  value,
  label,
  delta,
  tone = "inverse",
  size = "md",
  style
}) {
  const [bg, num, lab] = TONES[tone] || TONES.inverse;
  const fs = size === "lg" ? 72 : size === "sm" ? 36 : 48;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      padding: 24,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      gap: 6,
      minHeight: size === "lg" ? 216 : 132,
      border: tone === "plain" ? "1px solid var(--border-subtle)" : "none",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--weight-semibold) ${fs}px/1 var(--font-display)`,
      letterSpacing: "var(--tracking-display)",
      color: num
    }
  }, value), delta ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-regular) 12px/1 var(--font-sans)",
      color: lab
    }
  }, delta) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--weight-regular) 14px/1.25 var(--font-sans)",
      color: lab,
      maxWidth: 180
    }
  }, label));
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/display/VerificationSeal.jsx
try { (() => {
function VerificationSeal({
  value,
  label,
  meta,
  tone = "inverse",
  assetsBase = "assets",
  style
}) {
  const dark = tone === "inverse";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 18,
      padding: "18px 24px",
      background: dark ? "var(--veo-dark)" : "var(--veo-white)",
      border: dark ? "none" : "1px solid var(--veo-dark)",
      color: dark ? "var(--veo-white)" : "var(--veo-dark)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: `${assetsBase}/logo/${dark ? "veo-isotipo-lime.png" : "veo-isotipo-dark.png"}`,
    alt: "VEO",
    style: {
      height: 30,
      width: "auto",
      display: "block"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      borderLeft: `1px solid ${dark ? "var(--veo-dark-60)" : "var(--veo-gray-40)"}`,
      paddingLeft: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-semibold) 36px/1 var(--font-display)",
      letterSpacing: "var(--tracking-display)",
      color: dark ? "var(--veo-lime)" : "var(--veo-dark)"
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-regular) 12px/1.3 var(--font-sans)"
    }
  }, label), meta ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-regular) 12px/1.3 var(--font-sans)",
      color: dark ? "var(--veo-gray-40)" : "var(--veo-gray)"
    }
  }, meta) : null));
}
Object.assign(__ds_scope, { VerificationSeal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/VerificationSeal.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  content,
  placement = "top",
  children
}) {
  const [open, setOpen] = React.useState(false);
  const pos = placement === "bottom" ? {
    top: "calc(100% + 6px)"
  } : {
    bottom: "calc(100% + 6px)"
  };
  return /*#__PURE__*/React.createElement("span", {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    style: {
      position: "relative",
      display: "inline-flex"
    }
  }, children, open ? /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      ...pos,
      zIndex: 50,
      whiteSpace: "nowrap",
      padding: "6px 8px",
      background: "var(--veo-dark)",
      color: "var(--veo-white)",
      font: "var(--weight-regular) 12px/1.2 var(--font-sans)",
      pointerEvents: "none"
    }
  }, content) : null);
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
const SIZES = {
  sm: {
    h: 36,
    px: 12,
    fs: 12,
    gap: 6
  },
  md: {
    h: 48,
    px: 18,
    fs: 14,
    gap: 12
  },
  lg: {
    h: 60,
    px: 24,
    fs: 18,
    gap: 12
  }
};
const VARIANTS = {
  primary: {
    bg: "var(--veo-dark)",
    fg: "var(--veo-white)",
    bd: "var(--veo-dark)",
    hbg: "var(--veo-gray)",
    hfg: "var(--veo-white)",
    hbd: "var(--veo-gray)"
  },
  signal: {
    bg: "var(--veo-lime)",
    fg: "var(--veo-dark)",
    bd: "var(--veo-lime)",
    hbg: "var(--veo-dark)",
    hfg: "var(--veo-lime)",
    hbd: "var(--veo-dark)"
  },
  secondary: {
    bg: "transparent",
    fg: "var(--veo-dark)",
    bd: "var(--veo-dark)",
    hbg: "var(--veo-dark)",
    hfg: "var(--veo-white)",
    hbd: "var(--veo-dark)"
  },
  inverse: {
    bg: "var(--veo-white)",
    fg: "var(--veo-dark)",
    bd: "var(--veo-white)",
    hbg: "var(--veo-lime)",
    hfg: "var(--veo-dark)",
    hbd: "var(--veo-lime)"
  },
  ghost: {
    bg: "transparent",
    fg: "var(--veo-dark)",
    bd: "transparent",
    hbg: "var(--veo-ice)",
    hfg: "var(--veo-dark)",
    hbd: "transparent"
  },
  danger: {
    bg: "var(--veo-danger)",
    fg: "var(--veo-white)",
    bd: "var(--veo-danger)",
    hbg: "var(--veo-danger-ink)",
    hfg: "var(--veo-white)",
    hbd: "var(--veo-danger-ink)"
  }
};
function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "end",
  fullWidth = false,
  disabled = false,
  type = "button",
  children,
  style,
  onClick,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const on = hover && !disabled;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: fullWidth ? "flex" : "inline-flex",
      width: fullWidth ? "100%" : undefined,
      alignItems: "center",
      justifyContent: icon && fullWidth ? "space-between" : "center",
      gap: s.gap,
      height: s.h,
      padding: `0 ${s.px}px`,
      border: `1px solid ${on ? v.hbd : v.bd}`,
      borderRadius: 0,
      background: on ? v.hbg : v.bg,
      color: on ? v.hfg : v.fg,
      font: `var(--weight-regular) ${s.fs}px/1 var(--font-sans)`,
      whiteSpace: "nowrap",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      transition: "background var(--motion-fast) var(--ease-standard), color var(--motion-fast) var(--ease-standard), border-color var(--motion-fast) var(--ease-standard)",
      ...style
    }
  }, rest), icon && iconPosition === "start" ? icon : null, children != null ? /*#__PURE__*/React.createElement("span", null, children) : null, icon && iconPosition === "end" ? icon : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
const SIZES = {
  sm: 36,
  md: 48,
  lg: 60
};
const VARIANTS = {
  primary: ["var(--veo-dark)", "var(--veo-white)", "var(--veo-gray)", "var(--veo-white)"],
  signal: ["var(--veo-lime)", "var(--veo-dark)", "var(--veo-dark)", "var(--veo-lime)"],
  secondary: ["transparent", "var(--veo-dark)", "var(--veo-dark)", "var(--veo-white)"],
  ghost: ["transparent", "currentColor", "var(--veo-ice)", "var(--veo-dark)"],
  inverse: ["transparent", "var(--veo-white)", "var(--veo-dark-80)", "var(--veo-lime)"]
};
function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const d = SIZES[size] || SIZES.md;
  const [bg, fg, hbg, hfg] = VARIANTS[variant] || VARIANTS.ghost;
  const on = hover && !disabled;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: d,
      height: d,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
      borderRadius: 0,
      border: variant === "secondary" ? "1px solid var(--veo-dark)" : "1px solid transparent",
      background: on ? hbg : bg,
      color: on ? hfg : fg,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      transition: "background var(--motion-fast) var(--ease-standard), color var(--motion-fast) var(--ease-standard)",
      ...style
    }
  }, rest), icon);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useId
} = React;
function Input({
  label,
  hint,
  error,
  variant = "underline",
  tone = "light",
  leading,
  value,
  defaultValue,
  placeholder,
  type = "text",
  disabled = false,
  onChange,
  id: idProp,
  style,
  ...rest
}) {
  const auto = useId();
  const id = idProp || auto;
  const [focus, setFocus] = useState(false);
  const ink = tone === "dark" ? "var(--veo-white)" : "var(--veo-dark)";
  const line = error ? "var(--veo-danger)" : focus ? tone === "dark" ? "var(--veo-lime)" : "var(--veo-dark)" : tone === "dark" ? "var(--veo-dark-60)" : "var(--veo-gray-40)";
  const boxed = variant === "boxed";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: {
      font: "var(--weight-semibold) 12px/1 var(--font-sans)",
      letterSpacing: "var(--tracking-eyebrow)",
      textTransform: "uppercase",
      color: tone === "dark" ? "var(--veo-gray-40)" : "var(--veo-dark)"
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      height: boxed ? 48 : 42,
      padding: boxed ? "0 12px" : 0,
      background: boxed ? tone === "dark" ? "var(--veo-dark-90)" : "var(--veo-white)" : "transparent",
      border: boxed ? `1px solid ${line}` : "none",
      borderBottom: `${focus && !boxed ? 2 : 1}px solid ${line}`,
      color: ink
    }
  }, leading, /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    type: type,
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      height: "100%",
      border: 0,
      outline: 0,
      background: "transparent",
      color: ink,
      font: "var(--weight-regular) 14px/1 var(--font-sans)"
    }
  }, rest))), error || hint ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--weight-regular) 12px/1.4 var(--font-sans)",
      color: error ? "var(--veo-danger-ink)" : "var(--text-muted)"
    }
  }, error || hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  label,
  checked = false,
  disabled = false,
  onChange,
  name,
  value,
  tone = "light",
  style
}) {
  const ink = tone === "dark" ? "var(--veo-white)" : "var(--veo-dark)";
  return /*#__PURE__*/React.createElement("label", {
    onClick: () => !disabled && onChange && onChange(value),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      color: ink,
      font: "var(--weight-regular) 14px/1.4 var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    role: "radio",
    "aria-checked": checked,
    "data-name": name,
    tabIndex: 0,
    style: {
      width: 18,
      height: 18,
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      border: `1.5px solid ${tone === "dark" ? "var(--veo-gray-70)" : "var(--veo-dark)"}`
    }
  }, checked ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      background: tone === "dark" ? "var(--veo-lime)" : "var(--veo-dark)"
    }
  }) : null), label);
}
function RadioGroup({
  options = [],
  value,
  onChange,
  name,
  direction = "column",
  tone = "light",
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    style: {
      display: "flex",
      flexDirection: direction,
      gap: direction === "row" ? 24 : 12,
      ...style
    }
  }, options.map(o => {
    const opt = typeof o === "string" ? {
      value: o,
      label: o
    } : o;
    return /*#__PURE__*/React.createElement(Radio, {
      key: opt.value,
      name: name,
      value: opt.value,
      label: opt.label,
      tone: tone,
      checked: value === opt.value,
      onChange: onChange
    });
  }));
}
Object.assign(__ds_scope, { Radio, RadioGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  label,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  tone = "light",
  style
}) {
  const [inner, setInner] = React.useState(!!defaultChecked);
  const on = checked ?? inner;
  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setInner(!on);
    onChange && onChange(!on);
  };
  return /*#__PURE__*/React.createElement("label", {
    onClick: toggle,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      color: tone === "dark" ? "var(--veo-white)" : "var(--veo-dark)",
      font: "var(--weight-regular) 14px/1.4 var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    role: "switch",
    "aria-checked": on,
    tabIndex: 0,
    style: {
      position: "relative",
      width: 42,
      height: 24,
      flexShrink: 0,
      background: on ? "var(--veo-lime)" : tone === "dark" ? "var(--veo-dark-80)" : "var(--veo-gray-20)",
      border: `1px solid ${on ? "var(--veo-lime)" : "var(--veo-gray-40)"}`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 3,
      left: on ? 21 : 3,
      width: 16,
      height: 16,
      background: on ? "var(--veo-dark)" : "var(--veo-white)",
      transition: "left var(--motion-fast) var(--ease-step)"
    }
  })), label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/icons/Glyph.jsx
try { (() => {
// UI glyphs — path data copied from Lucide (ISC) v0.460.0, rendered with square caps/miter joins to match VEO's OOH icon set.
const GLYPHS = {
  "arrow-up-right": [["path", {
    "d": "M7 7h10v10"
  }], ["path", {
    "d": "M7 17 17 7"
  }]],
  "arrow-right": [["path", {
    "d": "M5 12h14"
  }], ["path", {
    "d": "m12 5 7 7-7 7"
  }]],
  "arrow-left": [["path", {
    "d": "m12 19-7-7 7-7"
  }], ["path", {
    "d": "M19 12H5"
  }]],
  "check": [["path", {
    "d": "M20 6 9 17l-5-5"
  }]],
  "x": [["path", {
    "d": "M18 6 6 18"
  }], ["path", {
    "d": "m6 6 12 12"
  }]],
  "chevron-down": [["path", {
    "d": "m6 9 6 6 6-6"
  }]],
  "chevron-right": [["path", {
    "d": "m9 18 6-6-6-6"
  }]],
  "search": [["circle", {
    "cx": "11",
    "cy": "11",
    "r": "8"
  }], ["path", {
    "d": "m21 21-4.3-4.3"
  }]],
  "bell": [["path", {
    "d": "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
  }], ["path", {
    "d": "M10.3 21a1.94 1.94 0 0 0 3.4 0"
  }]],
  "map-pin": [["path", {
    "d": "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
  }], ["circle", {
    "cx": "12",
    "cy": "10",
    "r": "3"
  }]],
  "calendar": [["path", {
    "d": "M8 2v4"
  }], ["path", {
    "d": "M16 2v4"
  }], ["rect", {
    "width": "18",
    "height": "18",
    "x": "3",
    "y": "4",
    "rx": "2"
  }], ["path", {
    "d": "M3 10h18"
  }]],
  "download": [["path", {
    "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
  }], ["polyline", {
    "points": "7 10 12 15 17 10"
  }], ["line", {
    "x1": "12",
    "x2": "12",
    "y1": "15",
    "y2": "3"
  }]],
  "plus": [["path", {
    "d": "M5 12h14"
  }], ["path", {
    "d": "M12 5v14"
  }]],
  "filter": [["polygon", {
    "points": "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
  }]],
  "eye": [["path", {
    "d": "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
  }], ["circle", {
    "cx": "12",
    "cy": "12",
    "r": "3"
  }]],
  "triangle-alert": [["path", {
    "d": "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
  }], ["path", {
    "d": "M12 9v4"
  }], ["path", {
    "d": "M12 17h.01"
  }]],
  "info": [["circle", {
    "cx": "12",
    "cy": "12",
    "r": "10"
  }], ["path", {
    "d": "M12 16v-4"
  }], ["path", {
    "d": "M12 8h.01"
  }]],
  "monitor": [["rect", {
    "width": "20",
    "height": "14",
    "x": "2",
    "y": "3",
    "rx": "2"
  }], ["line", {
    "x1": "8",
    "x2": "16",
    "y1": "21",
    "y2": "21"
  }], ["line", {
    "x1": "12",
    "x2": "12",
    "y1": "17",
    "y2": "21"
  }]],
  "file-text": [["path", {
    "d": "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
  }], ["path", {
    "d": "M14 2v4a2 2 0 0 0 2 2h4"
  }], ["path", {
    "d": "M10 9H8"
  }], ["path", {
    "d": "M16 13H8"
  }], ["path", {
    "d": "M16 17H8"
  }]],
  "log-out": [["path", {
    "d": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
  }], ["polyline", {
    "points": "16 17 21 12 16 7"
  }], ["line", {
    "x1": "21",
    "x2": "9",
    "y1": "12",
    "y2": "12"
  }]],
  "settings": [["path", {
    "d": "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
  }], ["circle", {
    "cx": "12",
    "cy": "12",
    "r": "3"
  }]],
  "layout-grid": [["rect", {
    "width": "7",
    "height": "7",
    "x": "3",
    "y": "3",
    "rx": "1"
  }], ["rect", {
    "width": "7",
    "height": "7",
    "x": "14",
    "y": "3",
    "rx": "1"
  }], ["rect", {
    "width": "7",
    "height": "7",
    "x": "14",
    "y": "14",
    "rx": "1"
  }], ["rect", {
    "width": "7",
    "height": "7",
    "x": "3",
    "y": "14",
    "rx": "1"
  }]],
  "list": [["path", {
    "d": "M3 12h.01"
  }], ["path", {
    "d": "M3 18h.01"
  }], ["path", {
    "d": "M3 6h.01"
  }], ["path", {
    "d": "M8 12h13"
  }], ["path", {
    "d": "M8 18h13"
  }], ["path", {
    "d": "M8 6h13"
  }]],
  "shield-check": [["path", {
    "d": "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
  }], ["path", {
    "d": "m9 12 2 2 4-4"
  }]],
  "clock": [["circle", {
    "cx": "12",
    "cy": "12",
    "r": "10"
  }], ["polyline", {
    "points": "12 6 12 12 16 14"
  }]],
  "image": [["rect", {
    "width": "18",
    "height": "18",
    "x": "3",
    "y": "3",
    "rx": "2",
    "ry": "2"
  }], ["circle", {
    "cx": "9",
    "cy": "9",
    "r": "2"
  }], ["path", {
    "d": "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
  }]],
  "upload": [["path", {
    "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
  }], ["polyline", {
    "points": "17 8 12 3 7 8"
  }], ["line", {
    "x1": "12",
    "x2": "12",
    "y1": "3",
    "y2": "15"
  }]],
  "user": [["path", {
    "d": "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
  }], ["circle", {
    "cx": "12",
    "cy": "7",
    "r": "4"
  }]],
  "menu": [["line", {
    "x1": "4",
    "x2": "20",
    "y1": "12",
    "y2": "12"
  }], ["line", {
    "x1": "4",
    "x2": "20",
    "y1": "6",
    "y2": "6"
  }], ["line", {
    "x1": "4",
    "x2": "20",
    "y1": "18",
    "y2": "18"
  }]],
  "camera": [["path", {
    "d": "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
  }], ["circle", {
    "cx": "12",
    "cy": "13",
    "r": "3"
  }]],
  "ellipsis": [["circle", {
    "cx": "12",
    "cy": "12",
    "r": "1"
  }], ["circle", {
    "cx": "19",
    "cy": "12",
    "r": "1"
  }], ["circle", {
    "cx": "5",
    "cy": "12",
    "r": "1"
  }]],
  "chart-column": [["path", {
    "d": "M3 3v16a2 2 0 0 0 2 2h16"
  }], ["path", {
    "d": "M18 17V9"
  }], ["path", {
    "d": "M13 17V5"
  }], ["path", {
    "d": "M8 17v-3"
  }]],
  "wifi-off": [["path", {
    "d": "M12 20h.01"
  }], ["path", {
    "d": "M8.5 16.429a5 5 0 0 1 7 0"
  }], ["path", {
    "d": "M5 12.859a10 10 0 0 1 5.17-2.69"
  }], ["path", {
    "d": "M19 12.859a10 10 0 0 0-2.007-1.523"
  }], ["path", {
    "d": "M2 8.82a15 15 0 0 1 4.177-2.643"
  }], ["path", {
    "d": "M22 8.82a15 15 0 0 0-11.288-3.764"
  }], ["path", {
    "d": "m2 2 20 20"
  }]],
  "route": [["circle", {
    "cx": "6",
    "cy": "19",
    "r": "3"
  }], ["path", {
    "d": "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"
  }], ["circle", {
    "cx": "18",
    "cy": "5",
    "r": "3"
  }]]
};
const GLYPH_NAMES = Object.keys(GLYPHS);
function Glyph({
  name,
  size = 20,
  strokeWidth = 2,
  color = "currentColor",
  title,
  style,
  ...rest
}) {
  const els = GLYPHS[name];
  if (!els) return null;
  return React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "square",
    strokeLinejoin: "miter",
    role: title ? "img" : "presentation",
    "aria-label": title,
    style: {
      flexShrink: 0,
      display: "block",
      ...style
    },
    ...rest
  }, els.map(([tag, a], i) => React.createElement(tag, {
    key: i,
    ...a
  })));
}
Object.assign(__ds_scope, { GLYPH_NAMES, Glyph });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Glyph.jsx", error: String((e && e.message) || e) }); }

// components/display/Tag.jsx
try { (() => {
function Tag({
  selected = false,
  onRemove,
  onClick,
  icon,
  tone = "light",
  children,
  style
}) {
  const [hover, setHover] = React.useState(false);
  const dark = tone === "dark";
  const bd = selected ? "var(--veo-dark)" : hover ? dark ? "var(--veo-gray-40)" : "var(--veo-dark)" : dark ? "var(--veo-dark-60)" : "var(--veo-gray-40)";
  return /*#__PURE__*/React.createElement("span", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 30,
      padding: onRemove ? "0 6px 0 12px" : "0 12px",
      border: `1px solid ${bd}`,
      background: selected ? "var(--veo-dark)" : "transparent",
      color: selected || dark ? "var(--veo-white)" : "var(--veo-dark)",
      font: "var(--weight-regular) 12px/1 var(--font-sans)",
      cursor: onClick ? "pointer" : "default",
      whiteSpace: "nowrap",
      ...style
    }
  }, icon, children, onRemove ? /*#__PURE__*/React.createElement("span", {
    role: "button",
    "aria-label": "Quitar",
    onClick: e => {
      e.stopPropagation();
      onRemove();
    },
    style: {
      display: "inline-flex",
      cursor: "pointer",
      opacity: 0.7
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Glyph, {
    name: "x",
    size: 14
  })) : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open,
  title,
  eyebrow,
  onClose,
  footer,
  width = 520,
  children
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "var(--overlay-scrim)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation(),
    style: {
      width,
      maxWidth: "100%",
      background: "var(--veo-white)",
      color: "var(--veo-dark)",
      boxShadow: "var(--shadow-overlay)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 24,
      padding: "24px 24px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, eyebrow ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-semibold) 12px/1 var(--font-sans)",
      letterSpacing: "var(--tracking-eyebrow)",
      textTransform: "uppercase",
      color: "var(--veo-gray)"
    }
  }, eyebrow) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-semibold) 24px/1.1 var(--font-display)"
    }
  }, title)), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Cerrar",
    onClick: onClose,
    style: {
      width: 36,
      height: 36,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      border: 0,
      background: "transparent",
      cursor: "pointer",
      color: "var(--veo-dark)",
      marginTop: -6,
      marginRight: -6
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Glyph, {
    name: "x"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      font: "var(--weight-light) 14px/1.5 var(--font-sans)"
    }
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 12,
      padding: "18px 24px",
      borderTop: "1px solid var(--border-subtle)"
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const MARK = {
  success: "var(--veo-lime)",
  info: "var(--veo-gray-70)",
  warning: "var(--veo-warning)",
  danger: "var(--veo-danger)"
};
function Toast({
  tone = "success",
  title,
  children,
  action,
  onClose,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      width: 380,
      maxWidth: "100%",
      padding: 18,
      background: "var(--veo-dark)",
      color: "var(--veo-white)",
      boxShadow: "var(--shadow-float)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      marginTop: 4,
      flexShrink: 0,
      background: MARK[tone] || MARK.info
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, title ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--weight-semibold) 14px/1.3 var(--font-sans)"
    }
  }, title) : null, children ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--weight-regular) 12px/1.4 var(--font-sans)",
      color: "var(--veo-gray-40)"
    }
  }, children) : null, action ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, action) : null), onClose ? /*#__PURE__*/React.createElement("button", {
    "aria-label": "Cerrar",
    onClick: onClose,
    style: {
      border: 0,
      background: "none",
      color: "var(--veo-gray-40)",
      cursor: "pointer",
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Glyph, {
    name: "x",
    size: 16
  })) : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  label,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  tone = "light",
  style
}) {
  const [inner, setInner] = React.useState(!!defaultChecked);
  const on = checked ?? inner;
  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setInner(!on);
    onChange && onChange(!on);
  };
  const ink = tone === "dark" ? "var(--veo-white)" : "var(--veo-dark)";
  return /*#__PURE__*/React.createElement("label", {
    onClick: toggle,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      color: ink,
      font: "var(--weight-regular) 14px/1.4 var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    role: "checkbox",
    "aria-checked": on,
    tabIndex: 0,
    onKeyDown: e => {
      if (e.key === " ") {
        e.preventDefault();
        toggle();
      }
    },
    style: {
      width: 18,
      height: 18,
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      border: `1.5px solid ${on ? "var(--veo-dark)" : tone === "dark" ? "var(--veo-gray-70)" : "var(--veo-dark)"}`,
      background: on ? "var(--veo-lime)" : "transparent",
      color: "var(--veo-dark)",
      transition: "background var(--motion-instant) linear"
    }
  }, on ? /*#__PURE__*/React.createElement(__ds_scope.Glyph, {
    name: "check",
    size: 14,
    strokeWidth: 3
  }) : null), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useId
} = React;
function Select({
  label,
  options = [],
  value,
  defaultValue,
  placeholder,
  variant = "underline",
  tone = "light",
  disabled = false,
  onChange,
  id: idProp,
  style,
  ...rest
}) {
  const auto = useId();
  const id = idProp || auto;
  const [focus, setFocus] = useState(false);
  const ink = tone === "dark" ? "var(--veo-white)" : "var(--veo-dark)";
  const line = focus ? tone === "dark" ? "var(--veo-lime)" : "var(--veo-dark)" : tone === "dark" ? "var(--veo-dark-60)" : "var(--veo-gray-40)";
  const boxed = variant === "boxed";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: {
      font: "var(--weight-semibold) 12px/1 var(--font-sans)",
      letterSpacing: "var(--tracking-eyebrow)",
      textTransform: "uppercase",
      color: tone === "dark" ? "var(--veo-gray-40)" : "var(--veo-dark)"
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      height: boxed ? 48 : 42,
      color: ink,
      background: boxed ? tone === "dark" ? "var(--veo-dark-90)" : "var(--veo-white)" : "transparent",
      border: boxed ? `1px solid ${line}` : "none",
      borderBottom: `${focus && !boxed ? 2 : 1}px solid ${line}`
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: id,
    value: value,
    defaultValue: defaultValue ?? (placeholder ? "" : undefined),
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      appearance: "none",
      WebkitAppearance: "none",
      width: "100%",
      height: "100%",
      border: 0,
      outline: 0,
      background: "transparent",
      color: ink,
      padding: boxed ? "0 36px 0 12px" : "0 30px 0 0",
      font: "var(--weight-regular) 14px/1 var(--font-sans)",
      cursor: "pointer"
    }
  }, rest), placeholder ? /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder) : null, options.map(o => {
    const opt = typeof o === "string" ? {
      value: o,
      label: o
    } : o;
    return /*#__PURE__*/React.createElement("option", {
      key: opt.value,
      value: opt.value
    }, opt.label);
  })), /*#__PURE__*/React.createElement(__ds_scope.Glyph, {
    name: "chevron-down",
    size: 16,
    style: {
      position: "absolute",
      right: boxed ? 12 : 0,
      pointerEvents: "none"
    }
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/icons/OOHIcon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const OOH_ICONS = ["01-mupi", "02-mural", "03-kiosk", "04-wall-scaffold", "05-hanging-sign", "06-round-sign", "07-pole-banner", "08-wall-disc", "09-rooftop", "10-fence-board", "11-bridge-board", "12-unipole", "13-twin-leg", "14-square-board", "15-small-board", "16-lit-board", "17-screen-stand", "18-wall-panel", "19-totem", "20-mini-totem", "21-square-sign", "22-retail-screen", "23-monitor", "24-overpass", "25-highway", "26-shelter", "27-storefront", "28-premium", "29-mobile-truck", "30-t-board", "31-a-frame", "32-bench"];
function OOHIcon({
  name,
  variant = "color",
  size = 32,
  assetsBase = "assets",
  style,
  ...rest
}) {
  const file = OOH_ICONS.find(n => n === name || n.slice(3) === name) || name;
  return /*#__PURE__*/React.createElement("img", _extends({
    src: `${assetsBase}/icons/${variant}/${file}.png`,
    alt: file.slice(3).replace(/-/g, " "),
    width: size,
    height: size,
    style: {
      display: "block",
      width: size,
      height: size,
      objectFit: "contain",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { OOH_ICONS, OOHIcon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/OOHIcon.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items = [],
  value,
  onChange,
  tone = "light",
  style
}) {
  const dark = tone === "dark";
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: "flex",
      gap: 24,
      borderBottom: `1px solid ${dark ? "var(--veo-dark-80)" : "var(--border-subtle)"}`,
      ...style
    }
  }, items.map(it => {
    const t = typeof it === "string" ? {
      value: it,
      label: it
    } : it;
    const on = t.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: t.value,
      role: "tab",
      "aria-selected": on,
      onClick: () => onChange && onChange(t.value),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 48,
        padding: 0,
        marginBottom: -1,
        background: "none",
        border: 0,
        cursor: "pointer",
        borderBottom: `2px solid ${on ? dark ? "var(--veo-lime)" : "var(--veo-dark)" : "transparent"}`,
        color: on ? dark ? "var(--veo-white)" : "var(--veo-dark)" : dark ? "var(--veo-gray-40)" : "var(--veo-gray)",
        font: `${on ? "var(--weight-semibold)" : "var(--weight-regular)"} 14px/1 var(--font-sans)`
      }
    }, t.label, t.count != null ? /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--weight-regular) 12px/1 var(--font-sans)",
        padding: "3px 6px",
        background: on ? dark ? "var(--veo-lime)" : "var(--veo-dark)" : dark ? "var(--veo-dark-80)" : "var(--veo-ice)",
        color: on ? dark ? "var(--veo-dark)" : "var(--veo-white)" : "inherit"
      }
    }, t.count) : null);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/veo-services/Campaign.jsx
try { (() => {
const {
  Tabs: CTabs,
  Button: CButton,
  Glyph: CGlyph,
  VerificationSeal: CSeal,
  Card: CCard,
  Dialog: CDialog,
  Select: CSelect,
  IconButton: CIconButton,
  Tooltip: CTooltip,
  OOHIcon: COOH
} = window.VEODesignSystem_0c07b8;
function Row({
  cells,
  head
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "160px 1.2fr 2fr 150px 48px",
      alignItems: "center",
      gap: 18,
      padding: "0 18px",
      height: head ? 42 : 60,
      borderBottom: "1px solid var(--border-subtle)",
      font: head ? "600 12px/1 var(--font-sans)" : "400 14px/1.3 var(--font-sans)",
      letterSpacing: head ? ".08em" : 0,
      textTransform: head ? "uppercase" : "none",
      color: head ? "var(--veo-gray)" : "var(--veo-dark)",
      background: head ? "var(--veo-ice)" : "#fff"
    }
  }, cells.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, c)));
}
function Campaign({
  campaign,
  back
}) {
  const c = campaign || window.VEO_DATA.campaigns[0];
  const [tab, setTab] = React.useState("exh");
  const [dlg, setDlg] = React.useState(false);
  const ex = window.VEO_DATA.exhibitions;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Topbar, {
    eyebrow: /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        gap: 6,
        alignItems: "center",
        cursor: "pointer"
      },
      onClick: back
    }, /*#__PURE__*/React.createElement(CGlyph, {
      name: "arrow-left",
      size: 14
    }), "Campa\xF1as \xB7 ", c.id),
    title: c.name,
    actions: /*#__PURE__*/React.createElement(CButton, {
      variant: "secondary",
      icon: /*#__PURE__*/React.createElement(CGlyph, {
        name: "download",
        size: 16
      }),
      onClick: () => setDlg(true)
    }, "Reporte")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 48px"
    }
  }, /*#__PURE__*/React.createElement(CTabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: "res",
      label: "Resumen"
    }, {
      value: "exh",
      label: "Exhibiciones",
      count: ex.length
    }, {
      value: "ev",
      label: "Evidencia"
    }, {
      value: "per",
      label: "Permisos",
      count: c.structures
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 48,
      display: "grid",
      gridTemplateColumns: "1fr 340px",
      gap: 24,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px solid var(--border-subtle)"
    }
  }, tab === "exh" || tab === "res" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Row, {
    head: true,
    cells: ["Fecha", "Estructura", "Evidencia", "Estado", ""]
  }), ex.map((e, i) => /*#__PURE__*/React.createElement(Row, {
    key: i,
    cells: [e.date, e.structure, e.evidence, /*#__PURE__*/React.createElement(StatusBadge, {
      status: e.status
    }), /*#__PURE__*/React.createElement(CTooltip, {
      content: "Ver evidencia"
    }, /*#__PURE__*/React.createElement(CIconButton, {
      size: "sm",
      label: "Ver",
      icon: /*#__PURE__*/React.createElement(CGlyph, {
        name: "eye",
        size: 16
      })
    }))]
  }))) : null, tab === "ev" ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 6,
      padding: 6
    }
  }, ["arq-arquitectura.jpg", "billboard-structure.jpg", "dooh-transit.jpg", "obs-observador.jpg", "bar-barrido.jpg", "billboard-animation.jpg"].map(f => /*#__PURE__*/React.createElement("div", {
    key: f,
    style: {
      position: "relative",
      height: 150
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: `../../assets/imagery/${f}`,
    alt: "",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 6,
      bottom: 6,
      background: "var(--veo-dark)",
      color: "#fff",
      font: "400 12px var(--font-sans)",
      padding: "3px 6px"
    }
  }, "13 oct \xB7 06:00 \xB7 SS-0142")))) : null, tab === "per" ? window.VEO_DATA.structures.slice(0, 4).map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 18,
      padding: 18,
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement(COOH, {
    name: s.icon,
    size: 36,
    assetsBase: "../../assets"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "600 14px var(--font-sans)"
    }
  }, s.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "400 12px var(--font-sans)",
      color: "var(--text-muted)"
    }
  }, s.format, " \xB7 ", s.corridor)), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "600 14px var(--font-display)"
    }
  }, "Permiso ", s.id), /*#__PURE__*/React.createElement(CIconButton, {
    size: "sm",
    label: "Descargar permiso",
    icon: /*#__PURE__*/React.createElement(CGlyph, {
      name: "file-text",
      size: 16
    })
  }))) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(CSeal, {
    value: c.impacts,
    label: "Impactos verificados",
    meta: `Sitecam · ${c.dates}`,
    assetsBase: "../../assets",
    style: {
      width: "100%"
    }
  }), /*#__PURE__*/React.createElement(CCard, {
    tone: "sunken",
    eyebrow: "Corredor",
    title: c.corridor
  }, "Para su objetivo y su temporada, este corredor registr\xF3 el mayor tr\xE1fico en horario de 6 a 9 am."), /*#__PURE__*/React.createElement(CCard, {
    eyebrow: "Uptime de pantallas",
    title: c.uptime
  }, "4 h fuera de servicio el 13 oct. Cr\xE9dito aplicado en su contrato."))), /*#__PURE__*/React.createElement(CDialog, {
    open: dlg,
    onClose: () => setDlg(false),
    eyebrow: "Reporte de campa\xF1a",
    title: "Descargar reporte",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(CButton, {
      variant: "ghost",
      size: "sm",
      onClick: () => setDlg(false)
    }, "Cancelar"), /*#__PURE__*/React.createElement(CButton, {
      size: "sm",
      onClick: () => setDlg(false)
    }, "Descargar PDF"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("span", null, "El reporte incluye exhibiciones, evidencia fotogr\xE1fica y el n\xFAmero de permiso de cada estructura."), /*#__PURE__*/React.createElement(CSelect, {
    label: "Periodo",
    defaultValue: "all",
    options: [{
      value: "all",
      label: "Toda la campaña"
    }, {
      value: "w",
      label: "Última semana"
    }]
  }))));
}
window.Campaign = Campaign;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/veo-services/Campaign.jsx", error: String((e && e.message) || e) }); }

// ui_kits/veo-services/Dashboard.jsx
try { (() => {
const {
  Card: DCard,
  StatTile: DStat,
  Tag: DTag,
  Button: DButton,
  Glyph: DGlyph,
  Toast: DToast
} = window.VEODesignSystem_0c07b8;
function Dashboard({
  openCampaign
}) {
  const [filter, setFilter] = React.useState("all");
  const [toast, setToast] = React.useState(true);
  const list = window.VEO_DATA.campaigns.filter(c => filter === "all" || c.status === filter);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement(Topbar, {
    eyebrow: "Caf\xE9 Cumbre",
    title: "Campa\xF1as"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 48,
      display: "flex",
      flexDirection: "column",
      gap: 36
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(DStat, {
    value: "2,1M",
    label: "Impactos verificados este trimestre"
  }), /*#__PURE__*/React.createElement(DStat, {
    tone: "structure",
    value: "14",
    label: "Estructuras en exhibici\xF3n"
  }), /*#__PURE__*/React.createElement(DStat, {
    tone: "sunken",
    value: "99,4%",
    label: "Uptime de pantallas DOOH"
  }), /*#__PURE__*/React.createElement(DStat, {
    tone: "sunken",
    value: "4 h",
    label: "Fuera de servicio \xB7 cr\xE9dito aplicado"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, [["all", "Todas"], ["active", "Activas"], ["pending", "Programadas"], ["verified", "Finalizadas"]].map(([v, l]) => /*#__PURE__*/React.createElement(DTag, {
    key: v,
    selected: filter === v,
    onClick: () => setFilter(v)
  }, l))), /*#__PURE__*/React.createElement(DButton, {
    variant: "signal",
    icon: /*#__PURE__*/React.createElement(DGlyph, {
      name: "arrow-up-right",
      size: 16
    })
  }, "Solicitar propuesta")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 12
    }
  }, list.map((c, i) => /*#__PURE__*/React.createElement(DCard, {
    key: c.id,
    interactive: true,
    onClick: () => openCampaign(c),
    eyebrow: `${c.id} · ${c.corridor}`,
    title: c.name,
    media: ["../../assets/imagery/arq-arquitectura.jpg", "../../assets/imagery/dooh-transit.jpg", "../../assets/imagery/billboard-structure.jpg"][i % 3],
    mediaHeight: 150,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(StatusBadge, {
      status: c.status
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: "auto",
        font: "400 12px var(--font-sans)",
        color: "var(--text-muted)"
      }
    }, c.dates))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: 600
    }
  }, c.structures), " estructuras"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: 600
    }
  }, c.impacts), " impactos")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      background: "var(--veo-ice)",
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      width: `${c.progress}%`,
      background: "var(--veo-dark)"
    }
  })))))), toast ? /*#__PURE__*/React.createElement(DToast, {
    tone: "danger",
    title: "Pantalla Multiplaza: 4 h fuera de servicio",
    onClose: () => setToast(false),
    style: {
      position: "fixed",
      right: 24,
      bottom: 24
    }
  }, "El equipo atendi\xF3 en sitio. Las horas est\xE1n registradas y el cr\xE9dito aplicado en su contrato.") : null);
}
window.Dashboard = Dashboard;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/veo-services/Dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/veo-services/Inventory.jsx
try { (() => {
const {
  Tag: ITag,
  Checkbox: ICheckbox,
  Switch: ISwitch,
  Select: ISelect,
  OOHIcon: IOOH,
  Button: IButton,
  Glyph: IGlyph,
  RadioGroup: IRadio
} = window.VEODesignSystem_0c07b8;
function Inventory() {
  const all = window.VEO_DATA.structures;
  const [sel, setSel] = React.useState(all[0].id);
  const [view, setView] = React.useState("Lista");
  const [dooh, setDooh] = React.useState(true);
  const list = all.filter(s => dooh || !/DOOH/.test(s.format));
  const s = all.find(x => x.id === sel) || all[0];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Topbar, {
    eyebrow: "359 estructuras",
    title: "Inventario"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "240px 1fr 360px",
      minHeight: "calc(100vh - 117px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      borderRight: "1px solid var(--border-subtle)",
      display: "flex",
      flexDirection: "column",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(ISelect, {
    label: "Corredor",
    defaultValue: "",
    placeholder: "Todos",
    options: ["Corredor Sur", "Centro · Escalón", "Bulevar Constitución"]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "600 12px/1 var(--font-sans)",
      letterSpacing: ".08em",
      textTransform: "uppercase"
    }
  }, "Formato"), /*#__PURE__*/React.createElement(ICheckbox, {
    label: "Vallas",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(ICheckbox, {
    label: "Mupis y paradas",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(ICheckbox, {
    label: "Pantallas DOOH",
    checked: dooh,
    onChange: setDooh
  })), /*#__PURE__*/React.createElement(ISwitch, {
    label: "Solo disponibles"
  }), /*#__PURE__*/React.createElement(IRadio, {
    name: "v",
    value: view,
    onChange: setView,
    direction: "row",
    options: ["Lista", "Mapa"]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, list.map(x => /*#__PURE__*/React.createElement("div", {
    key: x.id,
    onClick: () => setSel(x.id),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 18,
      padding: "18px 24px",
      cursor: "pointer",
      borderBottom: "1px solid var(--border-subtle)",
      background: sel === x.id ? "var(--veo-ice)" : "#fff"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      alignSelf: "stretch",
      background: sel === x.id ? "var(--veo-dark)" : "transparent",
      margin: "-18px 0 -18px -24px"
    }
  }), /*#__PURE__*/React.createElement(IOOH, {
    name: x.icon,
    size: 40,
    assetsBase: "../../assets"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "600 14px/1.2 var(--font-sans)"
    }
  }, x.name), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "400 12px/1.2 var(--font-sans)",
      color: "var(--text-muted)"
    }
  }, x.format, " \xB7 ", x.size, " \xB7 ", x.corridor)), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "400 12px var(--font-sans)",
      color: "var(--veo-gray)",
      width: 70
    }
  }, x.traffic), /*#__PURE__*/React.createElement(StatusBadge, {
    status: x.status
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--veo-dark)",
      color: "#fff",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/imagery/billboard-structure.jpg",
    alt: "",
    style: {
      width: "100%",
      height: 220,
      objectFit: "cover",
      display: "block"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "600 12px/1 var(--font-sans)",
      letterSpacing: ".08em",
      textTransform: "uppercase",
      color: "var(--veo-gray-40)"
    }
  }, "Permiso ", s.id), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "600 36px/1.05 var(--font-display)"
    }
  }, s.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18,
      font: "400 14px/1.3 var(--font-sans)"
    }
  }, [["Formato", s.format], ["Medida", s.size], ["Corredor", s.corridor], ["Tráfico", s.traffic]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "400 12px var(--font-sans)",
      color: "var(--veo-gray-40)"
    }
  }, k), v))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(ITag, {
    tone: "dark"
  }, "Iluminada"), /*#__PURE__*/React.createElement(ITag, {
    tone: "dark"
  }, "Espacio privado"), /*#__PURE__*/React.createElement(ITag, {
    tone: "dark"
  }, "Sitecam")), /*#__PURE__*/React.createElement(IButton, {
    variant: "signal",
    fullWidth: true,
    icon: /*#__PURE__*/React.createElement(IGlyph, {
      name: "arrow-up-right",
      size: 16
    })
  }, "Reservar estructura")))));
}
window.Inventory = Inventory;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/veo-services/Inventory.jsx", error: String((e && e.message) || e) }); }

// ui_kits/veo-services/Login.jsx
try { (() => {
const {
  Logo: LLogo,
  Input: LInput,
  Button: LButton,
  Checkbox: LCheckbox,
  Glyph: LGlyph
} = window.VEODesignSystem_0c07b8;
function Login({
  onLogin
}) {
  const [email, setEmail] = React.useState("ana.morales@cafecumbre.com");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.1fr 1fr",
      minHeight: "100vh"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      background: "var(--veo-dark)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: 48
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/imagery/bar-barrido.jpg",
    alt: "",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      opacity: 0.55
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(LLogo, {
    variant: "light",
    height: 28,
    assetsBase: "../../assets"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "600 72px/0.95 var(--font-display)",
      letterSpacing: "-.02em",
      color: "var(--veo-white)"
    }
  }, "Visible.", /*#__PURE__*/React.createElement("br", null), "Verificable.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--veo-lime)"
    }
  }, "VEO.")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 420,
      font: "300 18px/1.4 var(--font-sans)",
      color: "var(--veo-ice)"
    }
  }, "El estado de su campa\xF1a, sus exhibiciones y los permisos de cada estructura, en un solo lugar."))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--veo-ice)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 48
    }
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onLogin();
    },
    style: {
      width: 380,
      display: "flex",
      flexDirection: "column",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      font: "600 12px/1 var(--font-sans)",
      letterSpacing: ".08em",
      textTransform: "uppercase"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      background: "var(--veo-lime)"
    }
  }), "VEO Services"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: "600 36px/1.1 var(--font-display)",
      color: "var(--veo-dark)"
    }
  }, "Ingresar")), /*#__PURE__*/React.createElement(LInput, {
    label: "Correo",
    value: email,
    onChange: e => setEmail(e.target.value)
  }), /*#__PURE__*/React.createElement(LInput, {
    label: "Contrase\xF1a",
    type: "password",
    defaultValue: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(LCheckbox, {
    label: "Mantener sesi\xF3n",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      font: "400 12px var(--font-sans)"
    }
  }, "Recuperar acceso")), /*#__PURE__*/React.createElement(LButton, {
    type: "submit",
    fullWidth: true,
    icon: /*#__PURE__*/React.createElement(LGlyph, {
      name: "arrow-right",
      size: 16
    })
  }, "Ingresar al portal"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: "400 12px/1.4 var(--font-sans)",
      color: "var(--text-muted)"
    }
  }, "\xBFA\xFAn no es cliente? Escr\xEDbanos y le respondemos en 24 h."))));
}
window.Login = Login;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/veo-services/Login.jsx", error: String((e && e.message) || e) }); }

// ui_kits/veo-services/Shell.jsx
try { (() => {
const {
  Logo,
  Glyph,
  Input,
  IconButton,
  Badge
} = window.VEODesignSystem_0c07b8;
const A = "../../assets";
const STATUS = {
  active: ["active", "Activa"],
  pending: ["pending", "Programada"],
  verified: ["verified", "Verificada"],
  offline: ["offline", "Fuera de servicio"]
};
function NavItem({
  icon,
  label,
  active,
  onClick
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      height: 48,
      padding: "0 24px",
      border: 0,
      width: "100%",
      cursor: "pointer",
      textAlign: "left",
      background: active ? "var(--veo-dark-90)" : h ? "var(--veo-dark-90)" : "transparent",
      color: active ? "var(--veo-white)" : "var(--veo-gray-40)",
      font: `${active ? 600 : 400} 14px/1 var(--font-sans)`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      background: active ? "var(--veo-lime)" : "transparent",
      marginLeft: -12
    }
  }), /*#__PURE__*/React.createElement(Glyph, {
    name: icon,
    size: 18
  }), label);
}
function Sidebar({
  route,
  go,
  onLogout
}) {
  const items = [["dashboard", "layout-grid", "Campañas"], ["inventory", "map-pin", "Inventario"], ["reports", "chart-column", "Reportes"], ["permits", "shield-check", "Permisos"]];
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 240,
      flexShrink: 0,
      background: "var(--veo-dark)",
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "30px 24px 36px",
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    variant: "light",
    height: 22,
    assetsBase: A
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "400 12px/1 var(--font-sans)",
      color: "var(--veo-gray-40)",
      paddingTop: 4
    }
  }, "Services")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, items.map(([r, i, l]) => /*#__PURE__*/React.createElement(NavItem, {
    key: r,
    icon: i,
    label: l,
    active: route === r || r === "dashboard" && route === "campaign",
    onClick: () => go(r)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      borderTop: "1px solid var(--veo-dark-80)"
    }
  }, /*#__PURE__*/React.createElement(NavItem, {
    icon: "settings",
    label: "Configuraci\xF3n",
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: "log-out",
    label: "Cerrar sesi\xF3n",
    onClick: onLogout
  })));
}
function Topbar({
  title,
  eyebrow,
  actions
}) {
  const u = window.VEO_DATA.user;
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 24,
      padding: "30px 48px 24px",
      borderBottom: "1px solid var(--border-subtle)",
      background: "var(--veo-white)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, eyebrow ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "600 12px/1 var(--font-sans)",
      letterSpacing: ".08em",
      textTransform: "uppercase",
      color: "var(--veo-gray)"
    }
  }, eyebrow) : null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: "600 36px/1.1 var(--font-display)",
      letterSpacing: "-.02em",
      color: "var(--veo-dark)"
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, actions, /*#__PURE__*/React.createElement(Input, {
    variant: "boxed",
    leading: /*#__PURE__*/React.createElement(Glyph, {
      name: "search",
      size: 16
    }),
    placeholder: "Buscar campa\xF1a o permiso",
    style: {
      width: 260
    }
  }), /*#__PURE__*/React.createElement(IconButton, {
    label: "Notificaciones",
    variant: "secondary",
    icon: /*#__PURE__*/React.createElement(Glyph, {
      name: "bell",
      size: 18
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      paddingLeft: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      background: "var(--veo-gray)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      font: "600 14px var(--font-display)"
    }
  }, "AM"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "600 12px/1 var(--font-sans)"
    }
  }, u.name), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "400 12px/1 var(--font-sans)",
      color: "var(--text-muted)"
    }
  }, u.company)))));
}
function StatusBadge({
  status
}) {
  const [t, l] = STATUS[status] || STATUS.pending;
  return /*#__PURE__*/React.createElement(Badge, {
    tone: t
  }, l);
}
Object.assign(window, {
  Sidebar,
  Topbar,
  StatusBadge,
  KIT_ASSETS: A
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/veo-services/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/veo-services/data.js
try { (() => {
window.VEO_DATA = {
  user: {
    name: "Ana Morales",
    company: "Café Cumbre",
    role: "Dir. de Marketing"
  },
  campaigns: [{
    id: "C-2041",
    name: "Lanzamiento Cumbre Frío",
    status: "active",
    corridor: "Corredor Sur",
    dates: "01 – 31 oct 2026",
    structures: 8,
    impacts: "890K",
    uptime: "99,2%",
    progress: 45
  }, {
    id: "C-2038",
    name: "Temporada navideña",
    status: "pending",
    corridor: "Centro · Escalón",
    dates: "15 nov – 31 dic 2026",
    structures: 12,
    impacts: "—",
    uptime: "—",
    progress: 0
  }, {
    id: "C-2027",
    name: "Café de origen",
    status: "verified",
    corridor: "Carretera al Puerto",
    dates: "01 – 30 sep 2026",
    structures: 6,
    impacts: "1,2M",
    uptime: "99,8%",
    progress: 100
  }],
  structures: [{
    id: "SS-0142",
    name: "Unipolar 14",
    icon: "12-unipole",
    format: "Valla unipolar",
    size: "12 × 4 m",
    corridor: "Corredor Sur",
    status: "active",
    traffic: "42K/día"
  }, {
    id: "SS-0207",
    name: "Pantalla Multiplaza",
    icon: "23-monitor",
    format: "Pantalla DOOH",
    size: "6 × 3 m",
    corridor: "Centro · Escalón",
    status: "offline",
    traffic: "68K/día"
  }, {
    id: "SS-0311",
    name: "Parada Masferrer",
    icon: "26-shelter",
    format: "Parada de bus",
    size: "1,2 × 1,8 m",
    corridor: "Centro · Escalón",
    status: "active",
    traffic: "18K/día"
  }, {
    id: "SS-0098",
    name: "Mupi Paseo",
    icon: "01-mupi",
    format: "Mupi",
    size: "1,2 × 1,8 m",
    corridor: "Paseo General Escalón",
    status: "active",
    traffic: "22K/día"
  }, {
    id: "SS-0415",
    name: "Puente Constitución",
    icon: "24-overpass",
    format: "Puente peatonal",
    size: "15 × 2 m",
    corridor: "Bulevar Constitución",
    status: "active",
    traffic: "55K/día"
  }, {
    id: "SS-0520",
    name: "Tótem Plaza Futura",
    icon: "19-totem",
    format: "Tótem DOOH",
    size: "1 × 2,4 m",
    corridor: "Corredor Sur",
    status: "pending",
    traffic: "12K/día"
  }],
  exhibitions: [{
    date: "13 oct · 06:00",
    structure: "Unipolar 14",
    evidence: "Foto + Sitecam",
    status: "verified"
  }, {
    date: "13 oct · 06:00",
    structure: "Pantalla Multiplaza",
    evidence: "4 h fuera de servicio · crédito aplicado",
    status: "offline"
  }, {
    date: "12 oct · 06:00",
    structure: "Parada Masferrer",
    evidence: "Foto + Sitecam",
    status: "verified"
  }, {
    date: "12 oct · 06:00",
    structure: "Unipolar 14",
    evidence: "Foto + Sitecam",
    status: "verified"
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/veo-services/data.js", error: String((e && e.message) || e) }); }

// ui_kits/website/Site.jsx
try { (() => {
const {
  Logo: WLogo,
  Glyph: WGlyph,
  Input: WInput,
  Button: WButton
} = window.VEODesignSystem_0c07b8;
const WA = "../../assets";
function SiteNav({
  go,
  page
}) {
  const links = [["home", "Inicio"], ["home", "Estructuras"], ["home", "Sitecam"], ["home", "Nosotros"], ["contact", "Contacto"]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "30px 48px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => go("home"),
    style: {
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(WLogo, {
    variant: "light",
    height: 24,
    assetsBase: WA
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: 30
    }
  }, links.map(([p, l], i) => /*#__PURE__*/React.createElement("a", {
    key: i,
    onClick: e => {
      e.preventDefault();
      go(p);
    },
    href: "#",
    style: {
      color: "var(--veo-white)",
      textDecoration: "none",
      font: "400 12px/1 var(--font-sans)",
      opacity: p === page && (p === "contact" ? l === "Contacto" : l === "Inicio") ? 1 : 0.7
    }
  }, l))));
}
function Home({
  go
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: "relative",
      minHeight: 820,
      background: "var(--veo-dark)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/imagery/bar-barrido.jpg",
    alt: "",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      opacity: 0.5
    }
  }), /*#__PURE__*/React.createElement(SiteNav, {
    go: go,
    page: "home"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      padding: "0 48px",
      font: "400 12px var(--font-sans)",
      color: "var(--veo-gray-40)"
    }
  }, "San Salvador \xB7 El Salvador"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: 96,
      top: 120,
      width: 220,
      height: 420,
      background: "var(--veo-lime)",
      opacity: 0.92
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 0,
      top: 0,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 8px",
      background: "var(--veo-lime)",
      font: "400 12px var(--font-sans)",
      color: "var(--veo-dark)"
    }
  }, "Reservar ", /*#__PURE__*/React.createElement(WGlyph, {
    name: "arrow-up-right",
    size: 12
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      marginTop: "auto",
      padding: "0 48px 48px",
      display: "flex",
      flexDirection: "column",
      gap: 72
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: "600 96px/0.95 var(--font-display)",
      letterSpacing: "-.03em",
      color: "var(--veo-white)"
    }
  }, "T\xFA dinos qui\xE9n.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--veo-lime)"
    }
  }, "Nosotros, d\xF3nde.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 120
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "300 14px/1.4 var(--font-sans)",
      color: "var(--veo-ice)"
    }
  }, "Dale a tu marca ", /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: 600
    }
  }, "Presencia Visual Inteligente.")), /*#__PURE__*/React.createElement("button", {
    onClick: () => go("contact"),
    style: {
      width: 96,
      height: 96,
      background: "var(--veo-lime)",
      border: 0,
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: 12,
      textAlign: "left",
      font: "600 12px/1.1 var(--font-sans)",
      textTransform: "uppercase",
      color: "var(--veo-dark)"
    }
  }, "Hazlo", /*#__PURE__*/React.createElement("br", null), "ahora", /*#__PURE__*/React.createElement(WGlyph, {
    name: "arrow-up-right",
    size: 18,
    style: {
      alignSelf: "flex-end"
    }
  })))));
}
function Contact({
  go
}) {
  const [sent, setSent] = React.useState(false);
  return /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--veo-dark)"
    }
  }, /*#__PURE__*/React.createElement(SiteNav, {
    go: go,
    page: "contact"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      minHeight: 600
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--veo-lime)",
      padding: 48,
      display: "flex",
      flexDirection: "column",
      gap: 48
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      gap: 12,
      font: "600 12px/1 var(--font-sans)",
      letterSpacing: ".08em",
      textTransform: "uppercase",
      color: "var(--veo-dark)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "04"), "\u2014 El momento es ahora"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "auto 0 0",
      font: "600 72px/0.95 var(--font-display)",
      letterSpacing: "-.03em",
      color: "var(--veo-dark)"
    }
  }, "Haz tu marca visible, verificable, ahora."), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid var(--veo-dark)",
      paddingTop: 18,
      display: "flex",
      alignItems: "center",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "600 36px/1 var(--font-display)",
      color: "var(--veo-dark)"
    }
  }, "24h"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "400 12px/1.3 var(--font-sans)",
      color: "var(--veo-dark)",
      maxWidth: 220
    }
  }, "El tiempo en que le respondemos con una propuesta y los datos del corredor."))), /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      setSent(true);
    },
    style: {
      background: "var(--veo-ice)",
      padding: 48,
      display: "flex",
      flexDirection: "column",
      gap: 30,
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(WInput, {
    label: "Nombre",
    placeholder: "\xBFC\xF3mo te llamamos?"
  }), /*#__PURE__*/React.createElement(WInput, {
    label: "Empresa",
    placeholder: "Nombre de su marca"
  }), /*#__PURE__*/React.createElement(WInput, {
    label: "Correo",
    placeholder: "nombre@empresa.com"
  }), /*#__PURE__*/React.createElement(WInput, {
    label: "\xBFQu\xE9 necesita?",
    placeholder: "Cu\xE9ntenos el objetivo, plazo o corredor."
  }), /*#__PURE__*/React.createElement(WButton, {
    type: "submit",
    fullWidth: true,
    icon: /*#__PURE__*/React.createElement(WGlyph, {
      name: sent ? "check" : "arrow-up-right",
      size: 16
    })
  }, sent ? "Recibido. Le respondemos en 24 h." : "Quiero ver mi marca puesta"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--veo-dark)",
      padding: "72px 48px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement(WLogo, {
    variant: "light",
    height: 36,
    assetsBase: WA
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "600 48px/1 var(--font-display)",
      letterSpacing: "-.02em",
      color: "var(--veo-white)"
    }
  }, "Lo que", /*#__PURE__*/React.createElement("br", null), "muestras", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--veo-lime)"
    }
  }, "importa."))));
}
Object.assign(window, {
  Home,
  Contact
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Site.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.VerificationSeal = __ds_scope.VerificationSeal;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.RadioGroup = __ds_scope.RadioGroup;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.GLYPH_NAMES = __ds_scope.GLYPH_NAMES;

__ds_ns.Glyph = __ds_scope.Glyph;

__ds_ns.OOH_ICONS = __ds_scope.OOH_ICONS;

__ds_ns.OOHIcon = __ds_scope.OOHIcon;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
