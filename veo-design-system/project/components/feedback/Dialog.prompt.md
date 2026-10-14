Modal for confirmations and short forms (solicitar reporte, reservar estructura).

```jsx
<Dialog open={open} onClose={close} eyebrow="Reserva" title="Corredor Sur · Unipolar 14"
  footer={<><Button variant="ghost" onClick={close}>Cancelar</Button><Button>Confirmar</Button></>}>
  La estructura queda reservada 48 horas.
</Dialog>
```
