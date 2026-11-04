import type { AcademyArticleSource } from '../academy.types.js';

export const EXPANSION: AcademyArticleSource[] = [
  {
    slug: 'expansion-mapa',
    title: 'Mapa de expansión y rentabilidad de vallas',
    category: 'expansion',
    summary:
      'Cómo leer el mapa de Expansión: rentabilidad de cada valla, capas, mapas de calor, zonas y ranking.',
    tags: [
      'expansión',
      'sitios',
      'mapa',
      'rentabilidad',
      'roi',
      'costo mensual',
      'ocupación',
      'mapa de calor',
      'heatmap',
      'satélite',
      'capas',
      'zonas',
      'saturada',
      'desatendida',
      'ranking',
      'pantalla completa',
    ],
    modules: [
      {
        label: 'Abrir Expansión · Sitios',
        href: '/dashboard/expansion/sitios',
      },
    ],
    related: ['expansion-ubicaciones', 'glosario'],
    body: `**Expansión → Sitios** muestra en un mapa todas las vallas de VEO con su [rentabilidad](academy:glosario#rentabilidad-de-una-valla) y sirve para planificar dónde poner vallas nuevas. Lo ven quienes tienen el subrol **Expansión**.

[Abrir Expansión · Sitios](app:/dashboard/expansion/sitios)

## Indicadores

Arriba están los totales del período elegido: **Vallas en el mapa**, **Rentabilidad promedio**, **Ocupación promedio**, **Ingresos del período**, **Vallas con costo** y **Ubicaciones planificadas**.

## Cómo se calcula la rentabilidad

Cada valla recibe un puntaje de 0 a 100 según los contratos de Brilo del período:

- **Con costo mensual registrado**: se compara lo que facturó contra lo que costó (ROI). **Alta** desde 2.5x, **Media** desde 1.5x, **Baja** desde 1x y **Crítica** si no cubre su costo.
- **Sin costo**: se califica solo por **ocupación**, es decir, qué parte del período estuvo contratada. Alta desde 75 %, Media desde 50 % y Baja desde 25 %.

Los ingresos se prorratean por los días que cubre cada contrato, y dos contratos al mismo tiempo cuentan una sola vez para la ocupación.

### Registrar el costo de una valla

1. Haz clic en la valla del mapa y luego en **Ver detalle**.
2. En **Costo mensual de la valla**, escribe el **Costo (USD/mes)** y, si quieres, **Notas** (por ejemplo, *arrendamiento $150 + energía $50*).
3. Haz clic en **Guardar costo**. La rentabilidad se recalcula al momento. Con **Quitar costo** vuelve a calificarse por ocupación.

El detalle de la valla también muestra su foto, la **Ocupación mensual**, los **Contratos del período** y botones para **Google Maps** y **Street View**.

## Período

El selector de período cambia entre **Últimos 12 meses** y un **Año** específico. El año en curso se cuenta solo hasta hoy, para que los meses que faltan no bajen la ocupación.

## Vistas del mapa y capas

- **Vista base**: **Calles**, **Satélite**, **Híbrido** (satélite con calles), **Terreno** y **Nocturno**.
- **Capas**: elige **Colorear vallas por** (**Rentabilidad**, **Ocupación** o **Estado actual**) y activa o desactiva **Vallas**, **Agrupar vallas**, **Ubicaciones planificadas**, **Pantallas digitales**, **Mapa de calor · rentabilidad**, **Mapa de calor · densidad** y **Radio de cobertura** (250 m a 2 km).
- **Botones de la derecha**: **Ver todas las vallas**, **Vista 3D**, **Ocultar panel** y **Pantalla completa**.

> El mapa de calor de rentabilidad muestra dónde rinden más las vallas. El de densidad muestra dónde ya hay muchas: es una pista de saturación.

## Panel lateral

- **Planificadas**: las [ubicaciones planificadas](academy:expansion-ubicaciones). Haz clic en una para ir a ella en el mapa.
- **Zonas**: cada departamento con sus vallas, ocupación, ingresos y ubicaciones planificadas. Una zona es **Saturada** cuando concentra muchas vallas con baja ocupación, **Desatendida** cuando tiene poca presencia o demanda alta, y **Equilibrada** en los demás casos.
- **Ranking**: las vallas **Más rentables** y **Menos rentables** del período.`,
  },
  {
    slug: 'expansion-ubicaciones',
    title: 'Planificar ubicaciones nuevas',
    category: 'expansion',
    summary:
      'Cómo proponer una ubicación en el mapa, leer su puntaje según tráfico, densidad y competencia, pedir la opinión de Nexo y darle seguimiento.',
    tags: [
      'expansión',
      'nueva ubicación',
      'ubicación planificada',
      'sitio nuevo',
      'proponer',
      'puntaje',
      'recomendación',
      'tráfico',
      'calle principal',
      'densidad',
      'competencia',
      'canibalización',
      'nexo',
      'opinión de nexo',
      'analizar entorno',
      'openstreetmap',
      'comentarios',
      'documentos',
      'kml',
      'aprobada',
      'descartada',
    ],
    modules: [
      {
        label: 'Abrir Expansión · Sitios',
        href: '/dashboard/expansion/sitios',
      },
    ],
    related: ['expansion-mapa', 'nexo', 'glosario'],
    body: `Una **ubicación planificada** es un sitio donde VEO podría poner una valla nueva. Se dibuja en el mapa de [Expansión](academy:expansion-mapa) en morado y el sistema la evalúa con los datos reales de las vallas cercanas y del entorno.

## Crear una ubicación

1. En **Expansión → Sitios**, haz clic en **Nueva ubicación** y luego en el punto del mapa. También puedes hacer **clic derecho** directamente sobre el mapa.
2. Escribe el **Nombre** (obligatorio) y, si los tienes, **Estado**, **Prioridad**, **Formato**, **Dirección o referencia**, **Departamento**, medidas, **Precio mensual (USD)**, **Costo mensual (USD)** y una **Descripción**.
3. Revisa el recuadro **Estimación según vallas similares y el entorno** (ver abajo).
4. Haz clic en **Crear ubicación**. Recibe un código propio y aparece en la pestaña **Planificadas**.

> Si no sabes qué precio poner, usa **Usar precio de la zona**: toma el precio típico de las vallas cercanas.

## El puntaje de ubicación

Cada ubicación recibe un [puntaje de ubicación](academy:glosario#puntaje-de-ubicacion) de 0 a 100 que combina seis factores, cada uno con su barra:

| Factor | Peso | Qué mide |
| --- | --- | --- |
| **Exposición vehicular** | 25 % | Si está sobre o cerca de una carretera o vía principal. Una calle local puntúa bajo. |
| **Competencia propia** | 20 % | Baja con cada valla de VEO a menos de 500 m, y un poco con las que hay a 1 km. |
| **Rentabilidad de la zona** | 20 % | Qué tan rentables son las vallas cercanas; las más próximas pesan más. |
| **Ocupación esperada** | 15 % | La ocupación de esas vallas cercanas. |
| **Densidad urbana** | 10 % | Si es ciudad, pueblo o zona rural, y cuántos comercios, servicios y edificios hay alrededor. |
| **Retorno financiero** | 10 % | Ingreso estimado contra el costo. Solo cuenta si escribes precio y costo. |

Arriba ves las etiquetas de **Tráfico** y **Densidad** (alto, medio o bajo), la calle donde cae el punto y su colonia o ciudad.

### Alertas que limitan el puntaje

Algunas situaciones bajan el puntaje aunque el resto se vea bien. Aparecen en rojo:

- A menos de **150 m** de otra valla de VEO: le quita audiencia (máximo 40).
- El ingreso estimado **no cubre el costo** (máximo 50).
- **Calle local** sin una vía principal cerca (máximo 55).
- **Baja densidad** sin una vía de alto tráfico que la compense (máximo 60).

### Recomendación y confianza

- **Recomendada**: 68 o más.
- **Con reservas**: de 48 a 67.
- **No recomendada**: menos de 48.

La **confianza** (alta, media o baja) indica cuántos datos tuvo el cálculo. Baja cuando faltan datos del entorno, no hay precio y costo, o las vallas de referencia están lejos.

## Datos del entorno

La calle, el tipo de vía y la densidad se consultan en **OpenStreetMap** al elegir el punto (verás *Consultando calles y densidad en OpenStreetMap...*) y quedan guardados con la ubicación.

- Si en ese momento el servicio no responde, el puntaje usa solo el inventario de VEO. Abre la ubicación y, en **Análisis**, haz clic en **Analizar entorno**.
- Si arrastras el marcador morado a otro punto, el entorno se vuelve a consultar solo. Con **Actualizar entorno** lo refrescas cuando quieras.

> OpenStreetMap no tiene conteos reales de tráfico. El tipo de vía es una aproximación: confirma el flujo en sitio o con **Street View**.

## Opinión de Nexo

En el recuadro de estimación y en la pestaña **Análisis** está el botón **Pedir opinión a Nexo**. [Nexo](academy:nexo) revisa el puntaje, cada factor, el entorno, la descripción y los últimos comentarios del equipo, y responde con:

- Una **recomendación** y un titular.
- Un resumen en pocas líneas.
- **Fortalezas**, **riesgos** y **siguientes pasos** concretos.

Nexo solo usa los datos que tiene; si falta algo (por ejemplo, el costo), lo dice. Si cambias el precio o el costo, usa **Volver a analizar**. La opinión no se guarda: si quieres conservarla, cópiala en **Comentarios**.

## Dar seguimiento

Haz clic en una ubicación (en el mapa o en **Planificadas**) y luego en **Ver detalle**. Para moverla, arrastra su marcador en el mapa. El detalle tiene cuatro pestañas:

- **Análisis**: el puntaje, las razones, el **Radio de comparación** (1, 2, 3 o 5 km), la **Proyección mensual** y las **Vallas de referencia**.
- **Detalle**: cambia el **Estado**: **Propuesta**, **En evaluación**, **Aprobada** o **Descartada**. También tiene **Google Maps** y **Street View**.
- **Comentarios**: escribe y haz clic en **Comentar** para coordinar con el equipo.
- **Documentos**: arrastra o selecciona archivos (PDF, imágenes, Office, CSV, KML o KMZ, hasta 25 MB) como permisos, cotizaciones del terreno o fotos.

Con **Editar** cambias los datos, con **Ver en mapa** vuelves al punto y con **Eliminar** la borras junto con sus comentarios y documentos.`,
  },
];
