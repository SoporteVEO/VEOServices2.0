-- Release note 0.3.1. Skipped when that version already exists (e.g. it was
-- created from the app), in which case nobody is notified twice.
WITH inserted AS (
    INSERT INTO "patch_notes" ("id", "version", "title", "body", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        '0.3.1',
        'Buscador de módulos, notificaciones del navegador y clientes con contactos',
        E'## Navegación\n\n- Nuevo **buscador de módulos** arriba a la derecha (la lupa) o con **Ctrl + K**. Escribe el nombre de un módulo y ve directo a él.\n- En el menú, **Vallas estáticas** ahora se llama **Vallas**.\n- En **Mi Espacio**, **Mis órdenes** ahora se llama **Producción Vallas**.\n- Las secciones de Mi Espacio ya no repiten el título de la página.\n- **Mis cotizaciones** ya no muestra las cotizaciones rechazadas.\n\n## Notificaciones del navegador\n\n- Ahora las notificaciones de la plataforma también te llegan como **aviso del navegador**, aunque estés en otra pestaña.\n- Verás un aviso para **activarlas** con un clic. Si lo cierras, puedes activarlas desde la **campana** de notificaciones.\n- Si el navegador las tiene bloqueadas, la campana te explica cómo permitirlas.\n- Al **cerrar sesión**, las notificaciones se desactivan en ese equipo para que no le lleguen a otra persona.\n\n## Clientes y cotizaciones\n\n- El **cliente** ahora solo lleva su **nombre** y su **tipo**. Los **correos y teléfonos** se agregan como **contactos**, y el contacto **principal** es el que se usa por defecto.\n- Al cotizar, junto al cliente aparece el campo **Contacto**: se elige solo el principal, pero puedes cambiarlo o crear uno nuevo. Su nombre y correo salen en la cotización.\n- El PDF de la cotización muestra **Cliente**, y la **Empresa** solo cuando tiene.\n- Nuevo campo opcional **Cliente Brilo** en el cliente. Al aceptar una cotización, el cliente de Brilo se **completa solo**.\n- El historial de contratos de un cliente ahora busca por los correos de **todos sus contactos**.\n- El **Historial** de una cotización muestra de forma más clara qué cambió, con el antes y el después.\n\n## Reportes\n\n- Al **enviar un reporte**, el destinatario se elige entre los **contactos del cliente** (el principal viene seleccionado). También puedes escribir otro correo.\n- Las fechas de vencimiento de contratos se muestran tal como están en Brilo.\n\n## Producción de vallas\n\n- Además de subir el archivo, ahora puedes agregar un **enlace del arte** (WeTransfer, Drive u otro) en cada valla. Producción lo abre desde la misma tarjeta.\n- La pestaña **Órdenes** de Producción ya no muestra las órdenes terminadas ni canceladas.\n- Al pedir una **reprogramación**, si el motivo es muy corto verás el aviso junto al campo.\n\n## Pantallas\n\n- Nuevo módulo **Producción Pantallas**. **Soporte Comercial** crea la **OP** con los mismos campos de la plantilla, y **Producción** la revisa.\n- Producción puede **ingresarla a las listas** con la ventana de siempre ya llena, o **devolverla a Soporte** con lo que hay que corregir. Soporte la corrige y la reenvía con el mismo número.\n- Cada paso envía una **notificación** a la otra área. Puedes descargar la OP en **PDF**.\n\n## Nexo\n\n- Nexo muestra la **tabla completa de contratos por vencer** de un periodo o de un vendedor.\n- Consulta Brilo con las **reglas de negocio** que Brilo publica para cada operación.\n\n## Aprende más\n\nEn VEO Academy encontrarás las guías actualizadas: [Registrar un cliente](academy:crear-cliente), [Órdenes de producción e instalación](academy:produccion) y [Pantallas digitales](academy:pantallas).',
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("version") DO NOTHING
    RETURNING "version", "title"
)
INSERT INTO "notifications" ("id", "user_id", "description", "priority", "href", "updatedAt")
SELECT
    gen_random_uuid()::text,
    u."id",
    'Nueva actualización ' || i."version" || ': ' || i."title",
    'MEDIUM'::"NotificationPriority",
    '/dashboard/actualizaciones',
    CURRENT_TIMESTAMP
FROM inserted i
CROSS JOIN "users" u
WHERE u."disabled" = false;
