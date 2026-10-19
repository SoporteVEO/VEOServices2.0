-- Release note for the feature request module. The version is the next minor
-- after the latest published note, since notes can also be created from the app.
WITH latest AS (
    SELECT COALESCE(
        (SELECT "version" FROM "patch_notes" ORDER BY "created_at" DESC LIMIT 1),
        '1.0.0'
    ) AS v
),
inserted AS (
    INSERT INTO "patch_notes" ("id", "version", "title", "body", "updated_at")
    SELECT
        gen_random_uuid()::text,
        split_part(v, '.', 1) || '.' || (split_part(v, '.', 2)::int + 1) || '.0',
        'Solicita nuevas funcionalidades desde la plataforma',
        E'## Novedades\n\n- Nuevo módulo **Solicitar funcionalidad**, al final del menú debajo de Actualizaciones. Desde ahí puedes pedir una mejora al equipo de desarrollo como si abrieras un ticket (por ejemplo **SF-0001**).\n- Cada solicitud lleva el formato **Solicitud de nueva funcionalidad**: descárgalo, llénalo, guárdalo en **PDF** y súbelo junto con un título y un resumen.\n- Puedes agregar **colaboradores** para que otras personas vean el avance, reciban los avisos y firmen la aprobación.\n- Sigue el **estado** de tu solicitud (Enviada, En revisión, En desarrollo, Por aprobar, Aprobada o Rechazada) y revisa todo lo que ha pasado en la pestaña **Actividad**.\n- Cuando desarrollo termina, te llega una **notificación** para probar la funcionalidad y **firmar tu aprobación** con tu firma dibujada. Si algo no funciona, puedes **reportar el problema** y la solicitud vuelve a desarrollo.\n- El equipo de desarrollo tiene una nueva sección **Solicitudes de funcionalidad** para revisar, descargar el PDF y dar seguimiento a cada solicitud.\n\n## Aprende más\n\nEn VEO Academy encontrarás la guía paso a paso: [Solicitar una nueva funcionalidad](academy:solicitar-funcionalidad).',
        CURRENT_TIMESTAMP
    FROM latest
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
