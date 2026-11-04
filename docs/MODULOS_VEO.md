# Módulos de VEO Services

Monorepo (Turborepo) con dos apps:

- `apps/api`: backend NestJS (módulos en `src/modules`).
- `apps/web`: frontend Next.js (secciones en `src/app/dashboard`).

Brilo es el ERP/base de datos legado (SQL Server) con el que VEO se integra.

---

## Ventas y comercial

| Módulo | Qué hace |
| --- | --- |
| `crm` | Pipelines, negocios (deals), contactos, tareas, actividades, plantillas, renovaciones, inventario y mensajería (correo/WhatsApp). |
| `offers` | Cotizaciones/ofertas; genera contratos y se sincroniza con documentos de Brilo. |
| `clients` | Catálogo y gestión de clientes. |
| `contracts` | Contratos de renta, vigencias y contratos por vencer. |
| `shop` | Tienda/catálogo de espacios digitales para compra. |
| `paypal` | Pagos en línea con PayPal. |

## Inventario publicitario

| Módulo | Qué hace |
| --- | --- |
| `billboards` | Espectaculares/vallas estáticas. |
| `static-billboard-codes` | Códigos e identificadores de vallas estáticas. |
| `digital-billboards` | Pantallas digitales (`pantallas`) y sus órdenes operativas. |
| `expansion` | Mapa de rentabilidad de vallas (ROI contra costo mensual u ocupación) y planificación de ubicaciones nuevas con entorno de OpenStreetMap, comentarios, documentos y opinión de Nexo. |

## Producción y operación

| Módulo | Qué hace |
| --- | --- |
| `production-orders` | Órdenes de producción, sus items, estatus y tareas de instalación. |
| `printing` | Impresión: trabajos, calendario y solicitudes de reprogramación. |
| `maintenance` | Mantenimiento de vallas/pantallas y portal de mantenimiento. |
| `fleet` | Flotilla: vehículos y sus mantenimientos. |
| `purchases` | Compras. |

## Finanzas

| Módulo | Qué hace |
| --- | --- |
| `finance` | Cuentas por cobrar, facturación, contabilidad y bancos. |

## Recursos humanos y equipo

| Módulo | Qué hace |
| --- | --- |
| `team-members` | Miembros del equipo. |
| `absences` | Ausencias y solicitudes de permisos. |
| `academy` | Capacitación interna. |

## Usuarios y acceso

| Módulo | Qué hace |
| --- | --- |
| `auth` | Autenticación y guards de acceso. |
| `users` | Administración de usuarios y permisos. |
| `me` | Perfil y datos del usuario en sesión. |
| `user-metrics` | Métricas de uso de la app por usuario. |

## Inteligencia y analítica

| Módulo | Qué hace |
| --- | --- |
| `agent` | Agente de IA con herramientas (CRM, Brilo, etc.) y chat integrado. |
| `analytics` | Reportes y analíticas (impresión, uso, ventas). |

## Producto y desarrollo

| Módulo | Qué hace |
| --- | --- |
| `feature-requests` | Solicitudes de nuevas funcionalidades. |
| `patch-notes` | Notas de actualización (changelog). |
| `development` | Herramientas de desarrollo: issues, feedback y aprendizajes del agente. |

## Integraciones e infraestructura

| Módulo | Qué hace |
| --- | --- |
| `brilo-database` | Acceso directo a la base de datos SQL Server de Brilo. |
| `brilo-webapi` | Consumo de la Web API de Brilo (catálogos, recuperaciones). |
| `s3-images` | Subida y procesamiento de imágenes en S3. |
| `email` | Envío de correos. |
| `notifications` | Notificaciones dentro de la app. |
| `push` | Notificaciones push. |
| `redis` | Caché y colas con Redis. |
| `prisma` | Acceso a la base de datos principal con Prisma. |

---

## Secciones del frontend (`/dashboard`)

`academy`, `actualizaciones`, `analytics`, `clients`, `contracts`, `crm`, `desarrollo`, `expansion`, `finanzas`, `images`, `mantenimiento`, `me`, `my-space`, `pantallas`, `produccion-pantallas`, `production`, `purchases`, `reports`, `rh`, `solicitudes`, `static-billboards`, `tools`, `users`.

Cada una corresponde, en general, al módulo del backend con nombre equivalente (`rh` → `team-members`/`absences`, `actualizaciones` → `patch-notes`, `solicitudes` → `feature-requests`, `desarrollo` → `development`).
