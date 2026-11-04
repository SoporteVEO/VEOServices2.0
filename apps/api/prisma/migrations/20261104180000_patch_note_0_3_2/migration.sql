-- Release note 0.3.2. Skipped when that version already exists (e.g. it was
-- created from the app), in which case nobody is notified twice.
WITH inserted AS (
    INSERT INTO "patch_notes" ("id", "version", "title", "body", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        '0.3.2',
        'Expansión: rentabilidad de vallas y planificación de ubicaciones con Nexo',
        E'## Expansión\n\n- Nuevo menú **Expansión → Sitios**, para quienes tienen el subrol **Expansión**.\n- Un **mapa** con todas las vallas coloreadas por **rentabilidad**: compara lo que facturó cada valla contra su **costo mensual**. Si la valla aún no tiene costo, se califica por **ocupación**.\n- Registra el **costo mensual** de cada valla desde su detalle y la rentabilidad se recalcula al momento.\n- Vistas de **Calles**, **Satélite**, **Híbrido**, **Terreno** y **Nocturno**, **mapas de calor** de rentabilidad y de densidad, **radio de cobertura**, **vista 3D** y **pantalla completa**.\n- Panel con las **ubicaciones planificadas**, las **zonas** (saturadas, equilibradas o desatendidas) y el **ranking** de vallas más y menos rentables.\n\n## Ubicaciones planificadas\n\n- Propón una ubicación nueva con **Nueva ubicación** o con **clic derecho** sobre el mapa. Agrega precio y costo estimados, **comentarios** del equipo y **documentos** (permisos, cotizaciones, KML).\n- Cada ubicación recibe un **puntaje de 0 a 100** según el **tráfico** de la calle, la **densidad** de la zona, la **competencia** de otras vallas de VEO cerca, la rentabilidad de las vallas vecinas y el retorno estimado. Las calles locales, las zonas poco pobladas y los sitios pegados a otra valla bajan el puntaje.\n- La calle y la densidad se consultan en **OpenStreetMap** y quedan guardadas con la ubicación.\n- Con **Pedir opinión a Nexo**, Nexo te da su recomendación con fortalezas, riesgos y siguientes pasos.\n\n## Solicitudes de funcionalidad\n\n- Al crear una solicitud puedes agregar hasta **5 archivos adicionales** en PDF, Excel o PowerPoint.\n- El equipo de desarrollo puede **editar** el título, la descripción, la prioridad y los archivos de una solicitud. Cada cambio queda en la **Actividad**.\n\n## Nexo\n\n- Nexo conoce el módulo de Expansión: consulta la rentabilidad de las vallas y las ubicaciones planificadas, y explica cómo usarlo.\n\n## Aprende más\n\nEn VEO Academy hay una nueva sección **Expansión**: [Mapa de expansión y rentabilidad de vallas](academy:expansion-mapa) y [Planificar ubicaciones nuevas](academy:expansion-ubicaciones).',
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
