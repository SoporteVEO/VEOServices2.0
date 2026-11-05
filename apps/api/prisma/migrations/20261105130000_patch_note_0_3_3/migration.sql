-- Release note 0.3.3. Skipped when that version already exists (e.g. it was
-- created from the app), in which case nobody is notified twice.
WITH inserted AS (
    INSERT INTO "patch_notes" ("id", "version", "title", "body", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        '0.3.3',
        'Mentorías Keep / Stop / Start y el nuevo grupo Recursos Humanos',
        E'## Mentorías\n\n- Nuevo menú **Recursos Humanos → Mentorías** para registrar la retroalimentación trimestral **Keep / Stop / Start** (formato **VEO-FOR-03**).\n- **Mi equipo**: el jefe directo ve qué mentorías del trimestre están **Realizadas**, **Pendientes** o **Vencidas**. La fecha límite es el último día del primer mes del trimestre.\n- **Registrar mentoría**: los datos del colaborador se llenan solos. Se acuerda un solo Keep, un solo Stop y un solo Start con **qué, cómo, cuándo e indicador**, más el **compromiso** y la fecha del **próximo seguimiento**.\n- Desde la segunda sesión, primero se evalúa si se cumplió el **Start anterior** (Sí, Parcial o No) con su evidencia.\n- **Mis mentorías**: el colaborador revisa sus acuerdos y los **confirma de recibido**, con un comentario opcional. Después, solo Talento Humano puede corregirlos y cada cambio queda registrado.\n- **Panel Talento Humano**: avance por trimestre y por área/gerencia, porcentaje de **Starts cumplidos** e historial de cada colaborador, incluidos los archivados.\n- Descarga cada sesión o el historial completo en **PDF** con el formato de VEO.\n- Avisos y correos automáticos al iniciar el trimestre, al vencer la fecha límite y 3 días antes de cada seguimiento. Quien entra durante un trimestre empieza sus mentorías en el siguiente.\n\n## Plantilla\n\n- **Plantilla** e **Incapacidades** ahora están en el grupo **Recursos Humanos** del menú.\n- **Área/Gerencia** y **Cargo** se eligen de una lista. Si la opción no existe, escríbela y créala ahí mismo.\n\n## Nexo\n\n- Nexo conoce las mentorías: te dice a quién de tu equipo le falta la mentoría del trimestre, cuál fue el último Start de un colaborador y, si eres de Talento Humano, el avance por área.\n\n## Aprende más\n\nEn VEO Academy hay una nueva sección **Talento Humano**: [Mentorías Keep / Stop / Start](academy:mentorias) y [Mentorías: panel de Talento Humano](academy:mentorias-talento-humano).',
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
