# VEO Services — Resumen Ejecutivo

**Plataforma operativa de VEO Media** que moderniza ventas, producción, mantenimiento y reportes sobre el ERP Brilo, sin reemplazarlo. Unifica en una sola aplicación lo que antes vivía en sistemas legacy y procesos manuales.

---

## Alcance de la plataforma

| Área               | Qué cubre                                                                        |
| ------------------ | -------------------------------------------------------------------------------- |
| **Ventas**         | Contratos, cotizaciones, clientes, reportes a clientes, Mi Espacio del ejecutivo |
| **Inventario**     | Vallas estáticas y digitales, catálogo público, tienda en línea                  |
| **Producción**     | Órdenes de producción, calendario de impresión, instaladores en campo            |
| **Mantenimiento**  | Jobs de campo, evidencia fotográfica, portal para técnicos                       |
| **RRHH**           | Expedientes, incapacidades y flujo de aprobación                                 |
| **Finanzas**       | Facturación analítica, cobranza masiva (CxC)                                     |
| **Administración** | Usuarios por rol, analíticas de negocio y uso de la app                          |

**Arquitectura:** portal web (Next.js) + API (NestJS). Brilo (SQL Server) sigue siendo la fuente de verdad comercial; PostgreSQL gestiona los flujos nuevos.

---

## Capacidades implementadas

- **Contratos y vallas** consultados en tiempo real desde Brilo, con fotos en la nube.
- **Cotizaciones** con PDF, historial de cambios y vinculación a contrato Brilo al aceptar.
- **Reportes a clientes** (mensual, instalación, mantenimiento): generación de PowerPoint y envío por correo con registro de cumplimiento.
- **Mi Espacio:** KPIs del ejecutivo — contratos, reportes enviados/pendientes, ventas por centro de costos.
- **Producción:** órdenes automáticas al aceptar cotización, Gantt de impresión, asignación de instaladores, portal móvil y códigos QR.
- **Mantenimiento:** jobs vinculados a vallas Brilo, fotos de evidencia, portal `/mantenimiento` para técnicos.
- **E-Commerce:** reserva y pago de vallas digitales vía PayPal (self-service).
- **CxC Recuperaciones:** carga masiva de abonos a facturas contra Brilo WebAPI.
- **Analíticas admin:** facturación, cotizaciones, cumplimiento de reportes, KPIs de impresión y adopción de la app.
- **Portales externos:** instaladores (`/portal`), mantenimiento (`/mantenimiento`), catálogo público (`/vallas`, `/shop`).

---

## Valor logrado hasta hoy

_Estimados de ahorro según pipeline de proyectos (horas evitadas en procesos manuales)._

1. **Ciclo comercial integrado** — cotizar → producir → instalar → mantener → reportar al cliente, en una sola plataforma.  
   **~1,2 h/día · 36 h/mes · 432 h/año** _(combinado: cotizaciones + OP automática + dashboard integrado)_

2. **Trazabilidad de reportes** — cumplimiento medible por ejecutivo y visible en analíticas.  
   **~2 h/día · 60 h/mes · 720 h/año** _(dashboard mensual consolidado)_

3. **Eliminación de handoffs ventas → producción** — al aceptar cotizaciones se crea la OP sin intervención manual.  
   **~0,2 h/día · 6 h/mes · 72 h/año** _(generación automática de órdenes de producción)_

4. **Ventas digitales self-service** — reserva y pago de vallas digitales vía PayPal.  
   **~0,5 h/día · 15 h/mes · 180 h/año** _(referencial: flujo de cotización/comercial digital desde catálogo)_

5. **Cobranza masiva (CxC)** — abonos batch a facturas sin captura manual en Brilo.  
   **~1,5 h/día · 45 h/mes · 540 h/año** _(sincronización de facturación desde Brilo)_

6. **Visibilidad de management** — ventas, facturación, uso de la app y KPIs operativos.  
   **~5 h/día · 150 h/mes · 1.800 h/año** _(dashboard + reportes de ventas y facturación desde Brilo)_

**Total estimado combinado: ~10 h/día · 312 h/mes · 3.744 h/año**

---

## Línea de tiempo (marzo – agosto 2026)

| Mes | Entregables |
|-----|-------------|
| **Marzo** | Módulo de contratos, automatización de notificación por correo a clientes con contrato por vencer, integración con base de datos Brilo |
| **Abril** | E-commerce, módulo de vallas estáticas y digitales |
| **Mayo** | Módulo de imágenes, módulo de reportería |
| **Junio** | Mejoras en vallas estáticas (filtros activas/inactivas, historial detallado por valla: contratos, clientes, etc.), módulo de analíticas, primeras versiones de cotizaciones |
| **Julio** | Módulo de recursos humanos, mejora del dashboard general, cotizaciones mejoradas, primera versión del dashboard personal (Mi Espacio), módulo de clientes (cartera en VEO Services) |
| **Agosto** | Mejora del dashboard personal, módulo de producción y mantenimiento |
