import type { AcademyArticleSource } from '../academy.types.js';

export const TALENTO_HUMANO: AcademyArticleSource[] = [
  {
    slug: 'mentorias',
    title: 'Mentorías Keep / Stop / Start',
    category: 'talento-humano',
    summary:
      'Cómo registrar la mentoría trimestral de tu equipo, evaluar el Start anterior y confirmar de recibido tus acuerdos.',
    tags: [
      'mentorías',
      'mentoría',
      'retroalimentación',
      'feedback',
      'keep',
      'stop',
      'start',
      'trimestre',
      'fecha límite',
      'jefe directo',
      'mi equipo',
      'mis mentorías',
      'confirmar de recibido',
      'compromiso',
      'seguimiento',
      'VEO-FOR-03',
      'VEO-TH-MAN-01',
      'pdf',
    ],
    modules: [{ label: 'Abrir Mentorías', href: '/dashboard/rh/mentorias' }],
    related: ['mentorias-talento-humano', 'glosario'],
    body: `Cada trimestre, el **jefe directo** se reúne con cada colaborador y acuerdan tres cosas: qué **mantener** (Keep), qué **dejar de hacer** (Stop) y qué **empezar a hacer** (Start). Es el formato **VEO-FOR-03** del manual **VEO-TH-MAN-01**, y se registra en **Recursos Humanos → Mentorías**.

[Abrir Mentorías](app:/dashboard/rh/mentorias)

## Quién participa

- **Jefe directo**: registra la mentoría de cada colaborador que tiene a su cargo. Es el **Jefe directo** que Talento Humano asignó en la **Plantilla**.
- **Colaborador**: revisa los acuerdos y confirma de recibido.
- **Talento Humano**: da seguimiento al cumplimiento y es el único que puede corregir una sesión ya confirmada. Ver [Panel de Talento Humano](academy:mentorias-talento-humano).

Solo cuentan los colaboradores **activos** con jefe directo asignado.

## Trimestre y fecha límite

Hay una mentoría por colaborador en cada trimestre (**T1** a **T4**). La **fecha límite** es el último día del primer mes del trimestre: 31 de enero, 30 de abril, 31 de julio y 31 de octubre.

- **Pendiente**: aún no se registra y no ha pasado la fecha límite.
- **Vencida**: pasó la fecha límite sin registrarse. Todavía se puede registrar.
- **Realizada**: ya hay una sesión en el trimestre.

> Quien entra a VEO durante un trimestre no tiene mentoría ese trimestre: su primera es en el siguiente. Se toma la fecha de **Inicio de labores** de la Plantilla.

## Mi equipo

La pestaña **Mi equipo** aparece si tienes colaboradores a tu cargo. Arriba ves el trimestre con su fecha límite y cuántas mentorías están **Realizadas**, **Pendientes** y **Vencidas**. La tabla muestra el **Estado del trimestre**, la sesión registrada, el **Último Start** acordado y el **Próximo seguimiento**.

Haz clic en un colaborador para abrir su **Historial de mentorías**.

## Registrar una mentoría

1. En **Mi equipo**, haz clic en el colaborador y luego en **Registrar mentoría**.
2. Los **Datos de la sesión** (colaborador, cargo, área/gerencia, mentor y número de sesión) se llenan solos. Elige la **Fecha de la sesión** y la fecha del **Próximo seguimiento**, que debe ser posterior.
3. Si no es su primera mentoría, completa el [Seguimiento del Start anterior](#seguimiento-del-start-anterior).
4. Llena los [acuerdos Keep / Stop / Start](#acuerdos-keep-stop-start).
5. Escribe el **Compromiso concreto del colaborador**: qué hará antes del próximo seguimiento.
6. Haz clic en **Guardar y notificar**. El colaborador recibe un aviso y un correo para revisar los acuerdos.

La fecha de la sesión no puede ser futura ni anterior a la sesión pasada, y solo se registra una sesión por trimestre.

### Seguimiento del Start anterior

Antes de acordar algo nuevo, se evalúa si el colaborador cumplió el Start de la sesión pasada. El formulario muestra ese Start (qué, cómo, cuándo, indicador y compromiso). Marca **¿Cumplió el Start?** con **Sí**, **Parcial** o **No** y escribe la **Evidencia**: hechos o datos que respaldan la evaluación. Ambos son obligatorios.

### Acuerdos Keep / Stop / Start

Un solo Keep, un solo Stop y un solo Start. Cada uno lleva cuatro campos obligatorios:

| Campo | Qué escribir |
| --- | --- |
| **Qué** | La conducta concreta. |
| **Cómo** | Las acciones para lograrlo. |
| **Cuándo** | El plazo o la frecuencia. |
| **Indicador** | Cómo se medirá el avance. |

- **Keep · Continuar**: una conducta o práctica que funciona y debe mantenerse.
- **Stop · Dejar de hacer**: una conducta que frena su desempeño o al equipo.
- **Start · Empezar a hacer**: una acción nueva. Se evaluará en la próxima sesión.

## Confirmar de recibido

Cuando tu jefe registra tu mentoría, te llega una notificación y un correo. En la pestaña **Mis mentorías** verás el aviso **Tienes una mentoría por confirmar**.

1. Haz clic en **Revisar** (o en la sesión de la tabla) y lee los **Acuerdos**.
2. Haz clic en **Confirmar de recibido**. Si quieres, deja un **Comentario**.
3. Haz clic en **Confirmar de recibido** otra vez. Tu jefe recibe un aviso.

La sesión pasa de **Sin confirmar** a **Confirmada**. En **Mis mentorías** queda tu historial: cada sesión con su mentor, el **Start acordado** y el **Próximo seguimiento**.

## Editar una sesión

Mientras el colaborador no confirme, el jefe directo puede abrir la sesión y hacer clic en **Editar**. Después de la confirmación, solo Talento Humano puede **Corregir** la sesión, indicando el motivo. Cada cambio queda en la pestaña **Cambios** de la sesión, con quién lo hizo, cuándo y el valor anterior y el nuevo.

## Avisos automáticos

La plataforma revisa las mentorías todos los días a las 7:00 a. m. y avisa por notificación y por correo:

- **Al iniciar el trimestre**: cada jefe recibe la lista de mentorías pendientes de su equipo y la fecha límite.
- **Al vencer la fecha límite**: cada jefe recibe las que quedaron sin registrar, y Talento Humano un resumen por área.
- **3 días antes del próximo seguimiento**: el jefe y el colaborador reciben un recordatorio.

## Descargar el PDF

Abre una sesión y haz clic en **PDF** para descargar el formato **VEO-FOR-03** con los acuerdos, el compromiso, la confirmación y espacio para firmas. En el historial de un colaborador, **Descargar historial** genera un PDF con todas sus sesiones.`,
  },
  {
    slug: 'mentorias-talento-humano',
    title: 'Mentorías: panel de Talento Humano',
    category: 'talento-humano',
    summary:
      'Cumplimiento de mentorías por trimestre y por área, porcentaje de Starts cumplidos, historial, correcciones auditadas y catálogos de Área/Gerencia y Cargo.',
    tags: [
      'mentorías',
      'talento humano',
      'recursos humanos',
      'panel',
      'cumplimiento',
      'avance',
      'starts cumplidos',
      'vencidas',
      'historial',
      'archivados',
      'corregir',
      'auditoría',
      'cambios',
      'plantilla',
      'área',
      'gerencia',
      'cargo',
      'catálogo',
    ],
    modules: [
      {
        label: 'Abrir Mentorías',
        href: '/dashboard/rh/mentorias',
      },
      { label: 'Abrir Plantilla', href: '/dashboard/rh' },
    ],
    related: ['mentorias', 'glosario'],
    body: `Quienes tienen el subrol **HR** ven en **Recursos Humanos → Mentorías** la pestaña **Panel Talento Humano**, con el avance de toda la empresa. Para el proceso de registro y confirmación, ver [Mentorías Keep / Stop / Start](academy:mentorias).

[Abrir Mentorías](app:/dashboard/rh/mentorias)

## Indicadores del trimestre

Elige el **Trimestre** arriba a la derecha. Los indicadores muestran:

- **Colaboradores**: activos con jefe directo que deben tener mentoría ese trimestre.
- **Realizadas**, con el porcentaje de avance, **Pendientes** y **Vencidas**.
- **Starts cumplidos**: de los Starts evaluados en el trimestre, el porcentaje que se marcó **Sí**. Debajo ves cuántos fueron sí, parcial y no.

Los colaboradores que entraron durante el trimestre no cuentan en ese trimestre.

## Cumplimiento por área/gerencia

Una fila por cada **Área/Gerencia** con sus colaboradores, realizadas, pendientes, vencidas, **Avance** y **Starts cumplidos**. Quienes no tienen área aparecen en **Sin área asignada**.

## Colaboradores del trimestre

La lista de cada colaborador con su **Jefe directo**, **Estado**, sesión y resultado del **Start anterior**. Filtra por estado (**Vencida**, **Pendiente** o **Realizada**) o busca por colaborador, área o jefe. Haz clic en una fila para abrir su historial.

## Historial por colaborador

Toda la Plantilla, **incluidos los colaboradores archivados**, con su número de sesiones y la fecha de la última. Abre a cualquiera para ver sus sesiones y descargar su historial en PDF.

## Corregir una sesión confirmada

Después de que el colaborador confirma de recibido, solo Talento Humano puede cambiar la sesión:

1. Abre la sesión y haz clic en **Corregir**.
2. Haz los cambios y escribe **¿Por qué se corrige esta sesión?**. El motivo es obligatorio.
3. Haz clic en **Guardar corrección**. El colaborador y su jefe reciben un aviso.

La pestaña **Cambios** de la sesión guarda cada edición con el autor, la fecha, el motivo y el valor anterior y el nuevo de cada campo.

## Área/Gerencia y Cargo en la Plantilla

En la **Plantilla**, el **Área/Gerencia** y el **Cargo** de cada colaborador se eligen de una lista. Si la opción no existe, escríbela y haz clic en **Crear «…»**: queda disponible para todos. Así los reportes de mentorías agrupan bien por área.

En la Plantilla también se definen el **Jefe directo**, que es quien registra la mentoría, y el **Inicio de labores**, que decide desde qué trimestre le toca mentoría al colaborador.

[Abrir Plantilla](app:/dashboard/rh)`,
  },
];
