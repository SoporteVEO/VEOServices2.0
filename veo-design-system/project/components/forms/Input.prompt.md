Text field with uppercase label and a single hairline rule; use for every form in VEO Services.

```jsx
<Input label="Nombre" placeholder="¿Cómo te llamamos?" />
<Input variant="boxed" leading={<Glyph name="search" size={16} />} placeholder="Buscar estructura" />
<Input label="Correo" error="Revise el formato del correo." />
```

- variant: underline (web forms) · boxed (app filters/toolbars). tone: light · dark.
- Focus: rule thickens to 2px Dark (Lime on dark surfaces).
