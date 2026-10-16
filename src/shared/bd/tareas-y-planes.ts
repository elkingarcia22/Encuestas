// @ts-nocheck
// oxlint-disable
// El generador original trae variables y ramas que aquí no se usan. Se deja tal cual para no
// tocar los datos: si hay que corregirlo, se corrige en el catálogo de origen y se vuelve a portar.
// Tareas, planes asignados y seguimiento.
// Portado del catálogo del playground anterior; los datos no se editan a mano.

import { BD_MASTER_COLABORADORES } from './colaboradores';
const __tareasGlobal = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {});
__tareasGlobal.BD_MASTER_COLABORADORES = BD_MASTER_COLABORADORES;

/* ========================================
   BASE DE DATOS UNIFICADA - TAREAS Y PLANES
   Archivo: bd-master/bd-tareas-y-planes.js (API global: TAREAS_PLANES_DB).

   Única fuente de datos para: planes.html, tareas.html, seguimiento.html,
   seguimiento-leader.html, plan-detail.html, flujos lms-creator que usen empleados.
   Objetivo: no duplicar datos en otros JS.

   Colaboradores (55): bd-master/bd-master-colaboradores.js (BD_MASTER_COLABORADORES.colaboradores).
   Ese script debe cargarse en el HTML antes de este archivo.

   REGLAS (documentadas aquí para no crear archivos extra):

   1. Tareas por usuario por mes: 30 en total.
      - 10 individuales: no van a seguimiento; sí a tareas.html y planes (tab individual).
      - 20 grupales: sí a seguimiento, tareas.html y planes (tab grupal).

   2. Planes por usuario por mes: 4 en total.
      - 3 individuales: se forman agrupando las 10 tareas en 3 planes (3+3+4 tareas).
      - 1 grupal: el plan de su área ese mes (ej. "Plan Logística 01/2025").

   3. Distribución de estados en TAREAS (por usuario/mes):
      - Finalizadas: 70–85%
      - Iniciadas: 10–20%
      - Vencidas: 5–15%
      (función repartoEstados, determinista por seed).
      Excepción: si la fecha de la tarea (endDate) es posterior a hoy, solo ~5% Finalizadas y el resto Por hacer (realista para días futuros; el día actual puede usar lógica dinámica por hora en tareas.html).

   4. Distribución de estados en PLANES (coherente con avance y fecha):
      - El estado se deriva con derivePlanStatus(progress, end_date, planIndex).
      - Nunca Finalizado si avance < 65% (evita Finalizado al 5%).
      - Fecha futura → Activo (Por hacer).
      - Fecha pasada + avance ≥ 65%: reparto 70–85% Finalizado / 10–20% Activo / 5–15% Vencido
        (repartoEstadoPlan), coherente con el avance de las tareas del plan.

   5. Rango de fechas: INICIO_RANGO fijo; FIN_RANGO = hoy + 5 días laborables (una semana por delante, sin sáb/dom). No se generan tareas con fecha posterior a FIN_RANGO.

   6. Días laborables: las tareas solo se asignan a días entre semana (lun–vie).
      Sábado y domingo no tienen tareas; si una fecha calculada cae en fin de semana,
      se ajusta al viernes o lunes más cercano dentro del mismo mes (toWeekdayInMonth).

   7. Vista tareas (tareas.html) para líder con reportes: por cada día laborable desde
      hoy hasta FIN_RANGO solo se muestran (1 tarea por reporte directo + 1 propia + 1 de la jefa).
      Ej.: María ve 6 tareas para su equipo + 1 suya + 1 de Patricia = 8 tareas/día.

   --- SUBTAREAS, COMENTARIOS E HISTORIAL (para task-detail.html) ---

   8. Subtareas:
      - Las subtareas solo viven dentro de una tarea. No se confunden con tareas ni con planes.
      - Un 80% de las tareas tienen subtareas. Las tareas que la usuaria (Mariana) asigna a su equipo
        tienen siempre subtareas (100%).
      - Cada tarea con subtareas tiene 3 o 4 subtareas. Mismo creador y asignado que la tarea madre.
      - Campos por subtarea: id, name, done, status, endDate, priority, assignee_name, assignee_avatar_url,
        assignee_email, created_at (ISO). El estado es coherente con done (Activo / Finalizado).

   9. Comentarios:
      - Cada tarea tiene 3 o 4 comentarios realistas. Orden cronológico (más antiguo primero).
      - Ejemplo: creador escribe "Hola [nombre], te creé estas tareas, si tienes dudas citame a una reu";
        al día siguiente el asignado responde; luego comentarios de avance ("todo entregado para revisión", etc.).
      - Campos: id, author, authorAvatar, time (ISO), text, images (array, normalmente vacío).

   10. Historial (actividades):
       - Desde que se crea la tarea se guardan eventos en orden cronológico.
       - Tipos: crear tarea, asignar tarea, cambiar prioridad, cambiar estado, añadir subtarea(s),
         completar subtarea, reabrir subtarea, cambiar fecha límite (y opc. eliminar/cambiar estado/prioridad de subtarea).
       - Campos por actividad: id, time (ISO), icon (clase FA sin "far "), author, text.
       - La vista task-detail mezcla comentarios y actividades en un solo timeline.

   11. Planes (recordatorio): son agrupaciones de tareas. Individuales = mismo creador y asignado;
       grupales = un creador y varios asignados (por área, pares o toda la empresa). Las tareas pueden
       o no tener subtareas; las subtareas no son tareas ni planes.

   12. API para task-detail: getTaskDetail(taskId) devuelve { task, subtasks, comments, activities }.
       Si la tarea tiene detalle en taskDetallePorId se usa ese; si no, se intenta construir desde
       actividadesSeguimiento (sin subtareas/comentarios/actividades). task-detail.html puede abrirse
       con ?id=X y llamar getTaskDetail(X) para rellenar la vista.
   ======================================== */

(function (global) {
    'use strict';

    function getImagesPrefixForCurrentPage() {
        try {
            var path = (global.location && global.location.pathname) ? String(global.location.pathname) : '';
            if (path.indexOf('/ubits-colaborador/aprendizaje/mi-equipo/') !== -1) return '../../../';
            if (path.indexOf('/ubits-admin/lms-creator/planes-formacion/') !== -1) return '../../../';
            if (path.indexOf('/ubits-admin/lms-creator/') !== -1) return '../../';
            if (path.indexOf('/ubits-colaborador/') !== -1) return '../../';
            if (path.indexOf('/ubits-admin/') !== -1) return '../../';
        } catch { /* noop */ }
        return '';
    }

    function normalizeAvatarUrl(avatar) {
        var a = String(avatar || '').trim();
        if (!a) return a;
        if (a.indexOf('http://') === 0 || a.indexOf('https://') === 0 || a.indexOf('data:') === 0) return a;
        // Permitir que la BD use formas como "../../images/..." o "images/..."
        // y normalizarlo al nivel correcto según el HTML actual (file:// incluido).
        a = a.replace(/^(\.\.\/)+/, ''); // quita ../../, ../../../, etc.
        if (a.indexOf('images/') === 0) return getImagesPrefixForCurrentPage() + a;
        return a;
    }

    const pad = (n) => String(n).padStart(2, '0');
    function getTodayString() {
        const d = new Date();
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
    /** Fecha en YYYY-MM-DD sumando días a hoy. */
    function getTodayPlusDays(days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    /** Fecha en YYYY-MM-DD sumando n días laborables (lun–vie) desde hoy. */
    function getTodayPlusWeekdays(n) {
        const d = new Date();
        let added = 0;
        while (added < n) {
            d.setDate(d.getDate() + 1);
            const dow = d.getDay();
            if (dow !== 0 && dow !== 6) added++;
        }
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    function formatearFechaSeguimiento(fecha) {
        const dia = fecha.getDate();
        const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const mes = meses[fecha.getMonth()];
        const anio = fecha.getFullYear();
        return `${dia} ${mes} ${anio} 10:00`;
    }

    function generarUsername(nombre) {
        const palabras = (nombre || '').toLowerCase().split(' ').filter(p => p.length > 0);
        const iniciales = palabras.map(p => p.charAt(0)).join('');
        return iniciales ? `${iniciales}@meta.com` : 'user@meta.com';
    }

    function obtenerJefe(area, esJefe, jefes) {
        if (!area || area === 'Gerencia General') return null;
        if (esJefe && jefes) {
            const gg = jefes.find(j => j.area === 'Gerencia General');
            return gg ? gg.nombre : null;
        }
        const j = (jefes || []).find(x => x.area === area);
        return j ? j.nombre : null;
    }

    // Usuario actual (María Alejandra - J005)
    const USUARIO_ACTUAL = {
        id: 'J005',
        idColaborador: '1011000006',
        nombre: 'María Alejandra Sánchez Pardo',
        cargo: 'Líder de Logística',
        area: 'Logística',
        username: 'masanchez@meta.com',
        avatar: normalizeAvatarUrl('../../images/Profile-image.jpg'),
        esJefe: true
    };

    // ============================================
    // ESTRUCTURA DE EMPRESA (Meta Colombia S.A.S.)
    // Personas: lista canónica en bd-master/bd-master-colaboradores.js (colaboradores).
    // Cargar bd-master-colaboradores.js antes de este en cada HTML que use bd-tareas-y-planes.js.
    // ============================================
    const EMPRESA_EJEMPLO = {
        nombre: 'Meta Colombia S.A.S.',
        descripcion: 'Empresa colombiana dedicada a la venta, reparación e instalación de productos decorativos de lujo.',
        empleados: 55,
        fundada: 2015
    };

    const _colaboradoresMaster = (global.BD_MASTER_COLABORADORES && Array.isArray(global.BD_MASTER_COLABORADORES.colaboradores))
        ? global.BD_MASTER_COLABORADORES.colaboradores
        : [];
    const EMPLEADOS_EJEMPLO = _colaboradoresMaster.map(function (c) {
        var copy = Object.assign({}, c);
        if (copy && copy.avatar) copy.avatar = normalizeAvatarUrl(copy.avatar);
        return copy;
    });
    const GERENTE_EJEMPLO = EMPLEADOS_EJEMPLO.find(function (e) { return e.esGerenteGeneral; }) || EMPLEADOS_EJEMPLO[0];
    const JEFES_EJEMPLO = EMPLEADOS_EJEMPLO.filter(function (e) { return e.esJefe && !e.esGerenteGeneral; });
    if (EMPLEADOS_EJEMPLO.length === 0) {
        console.warn('bd-tareas-y-planes: cargue bd-master/bd-master-colaboradores.js antes de este script (55 colaboradores de la empresa).');
    }

    const AREAS_EJEMPLO = [
        { id: 0, nombre: 'Gerencia General', descripcion: 'Dirección estratégica y toma de decisiones' },
        { id: 1, nombre: 'Ventas', descripcion: 'Asesoría comercial y cierre de negocios' },
        { id: 2, nombre: 'Instalaciones', descripcion: 'Instalación de productos en sitio' },
        { id: 3, nombre: 'Reparaciones', descripcion: 'Servicio técnico y mantenimiento' },
        { id: 4, nombre: 'Atención al Cliente', descripcion: 'Soporte y seguimiento postventa' },
        { id: 5, nombre: 'Logística', descripcion: 'Bodega, inventarios y entregas' },
        { id: 6, nombre: 'Administración', descripcion: 'Gestión administrativa y financiera' },
        { id: 7, nombre: 'Marketing', descripcion: 'Publicidad, diseño y redes sociales' },
        { id: 8, nombre: 'Recursos Humanos', descripcion: 'Gestión de personas, objetivos, encuestas y nómina' }
    ];

    function getReportesDirectosEjemplo(nombreLider) {
        return EMPLEADOS_EJEMPLO.filter(function (e) { return e.jefe === nombreLider; }).map(function (e) { return e.nombre; });
    }

    const INICIO_RANGO = '2025-01-01';
    /** Siempre hasta una semana laboral por delante (5 días hábiles, sin sáb/dom). */
    const FIN_RANGO = getTodayPlusWeekdays(5);

    const TITULOS_TAREAS = [
        'Revisar inventario bodega', 'Orden de compra pendiente', 'Seguimiento a proveedores', 'Cierre de ciclo logístico',
        'Informe de entregas', 'Coordinación con transporte', 'Actualizar trazabilidad', 'Revisión de KPIs logísticos',
        'Capacitación equipo bodega', 'Auditoría de procesos', 'Plan de contingencia', 'Reunión con operaciones',
        'Validar documentación de carga', 'Seguimiento reclamos', 'Optimización de rutas', 'Checklist de seguridad',
        'Reporte mensual logística', 'Alistamiento de pedidos', 'Coordinación con ventas', 'Revisar SLA de entregas',
        'Preparar presentación gerencia', 'Seguimiento indicadores', 'Actualizar procedimientos', 'Cierre de no conformidades',
        'Reunión semanal equipo', 'Revisar contratos de almacenamiento', 'Solicitud de cotizaciones', 'Análisis de costos',
        'Capacitación normativa', 'Inspección de instalaciones', 'Seguimiento metas trimestre', 'Preparar presupuesto área',
        'Evaluación de desempeño', 'Plan de mejora continua', 'Documentar lecciones aprendidas', 'Revisar política de devoluciones',
        'Coordinación con calidad', 'Seguimiento a indicadores', 'Cierre de incidentes', 'Reunión de seguimiento',
        'Actualizar base de datos', 'Verificar cumplimiento normativo', 'Preparar datos para auditoría', 'Revisar contratos vigentes',
        'Seguimiento a acciones correctivas', 'Capacitación en sistema WMS', 'Revisión de stock mínimo', 'Plan de abastecimiento'
    ];

    const NOMBRES_PLANES_IND = [
        'Metas personales Q1', 'Desarrollo profesional', 'Seguimiento objetivos', 'Plan de lectura', 'Capacitaciones personales',
        'Organización semanal', 'Proyectos propios', 'Mejora de procesos', 'Seguimiento indicadores', 'Plan de carrera',
        'Objetivos trimestrales', 'Formación continua', 'Tareas recurrentes', 'Seguimiento mensual', 'Plan de acción'
    ];

    function seeder(seed, i) {
        const x = Math.sin(seed * 9999 + i * 12345) * 10000;
        return x - Math.floor(x);
    }

    /** Ajusta un día del mes a día laborable (lun–vie). Sáb/dom se mueven al viernes o lunes más cercano dentro del mes. */
    function toWeekdayInMonth(year, month, day) {
        const daysInMonth = new Date(year, month, 0).getDate();
        const d = new Date(year, month - 1, day);
        const dow = d.getDay(); // 0 = domingo, 6 = sábado
        if (dow === 0) {
            // Domingo → lunes siguiente; si se sale del mes, viernes anterior
            return day + 1 <= daysInMonth ? day + 1 : Math.max(1, day - 2);
        }
        if (dow === 6) {
            // Sábado → viernes anterior; si no hay, lunes siguiente
            return day - 1 >= 1 ? day - 1 : Math.min(daysInMonth, day + 2);
        }
        return day;
    }

    /** Regla 3: reparte TAREAS_POR_MES en Finalizadas (70-85%), Iniciadas (10-20%), Vencidas (5-15%) */
    function repartoEstados(seed, baseIndex) {
        const r = seeder(seed, baseIndex);
        const pFinalizadas = PCT_FINALIZADAS_MIN + r * PCT_FINALIZADAS_RANGO;
        const r2 = seeder(seed, baseIndex + 1);
        const pIniciadas = PCT_INICIADAS_MIN + r2 * PCT_INICIADAS_RANGO;
        const pVencidas = 1 - pFinalizadas - pIniciadas;
        const n = TAREAS_POR_MES;
        let nF = Math.round(n * pFinalizadas);
        let nI = Math.round(n * pIniciadas);
        let nV = n - nF - nI;
        if (nV < 0) { nV = 0; nI = n - nF; }
        if (nI < 0) { nI = 0; nV = n - nF; }
        return { nFinalizadas: nF, nIniciadas: nI, nVencidas: nV };
    }

    // Constantes de reglas (regla 1 y 2)
    const TAREAS_POR_MES = 30;
    const TAREAS_INDIVIDUALES_POR_MES = 10;
    const TAREAS_GRUPALES_POR_MES = 20;
    const PLANES_INDIVIDUALES_POR_MES = 3;
    // 95% tareas en plan, 5% sueltas (solo las ve el creador). 9 en 3 planes de 3, 1 suelta.
    const TAMANOS_GRUPOS_INDIVIDUALES = [3, 3, 4];
    /** Tareas grupales por área y mes (plan compartido del equipo, no por persona). */
    const TAREAS_GRUPALES_POR_AREA_MES = 20;

    // Regla 3: rangos de distribución de estados en tareas (70-85% / 10-20% / 5-15%)
    const PCT_FINALIZADAS_MIN = 0.70;
    const PCT_FINALIZADAS_RANGO = 0.15;
    const PCT_INICIADAS_MIN = 0.10;
    const PCT_INICIADAS_RANGO = 0.10;

    // Regla 4: reparto de estados en planes (70–85% / 10–20% / 5–15%), acotado por avance mínimo.
    const PCT_PLAN_FINALIZADOS_MIN = 0.70;
    const PCT_PLAN_FINALIZADOS_RANGO = 0.15;
    const PCT_PLAN_INICIADOS_MIN = 0.10;
    const PCT_PLAN_INICIADOS_RANGO = 0.10;
    const PLAN_STATUS_SEED = 7777;
    /** Avance mínimo para permitir estado Finalizado (evita cierre con 3–5%). */
    const PLAN_MIN_PCT_PARA_FINALIZAR = 65;

    /** Reparto objetivo de estado de plan (determinista por seed). */
    function repartoEstadoPlan(seed, planIndex) {
        const pF = PCT_PLAN_FINALIZADOS_MIN + seeder(seed, planIndex * 3) * PCT_PLAN_FINALIZADOS_RANGO;
        const pI = PCT_PLAN_INICIADOS_MIN + seeder(seed, planIndex * 3 + 1) * PCT_PLAN_INICIADOS_RANGO;
        const r = seeder(seed, planIndex * 3 + 2);
        if (r < pF) return 'Finalizado';
        if (r < pF + pI) return 'Activo';
        return 'Vencido';
    }

    /**
     * Estado del plan coherente con avance y fecha.
     * planIndex alimenta el reparto 70–85% / 10–20% / 5–15% en planes ya vencidos.
     */
    function derivePlanStatus(progress, endDateStr, todayStr, planIndex) {
        const end = (endDateStr || '').split('T')[0];
        const pct = typeof progress === 'number' ? progress : 0;
        const idx = typeof planIndex === 'number' ? planIndex : 0;

        if (!end || end > todayStr) {
            return { status: 'Activo', finished: false };
        }
        if (pct < PLAN_MIN_PCT_PARA_FINALIZAR) {
            return { status: 'Vencido', finished: false };
        }
        if (pct >= 100) {
            return { status: 'Finalizado', finished: true };
        }

        const target = repartoEstadoPlan(PLAN_STATUS_SEED, idx);
        if (target === 'Finalizado') {
            return { status: 'Finalizado', finished: true };
        }
        if (target === 'Activo') {
            return { status: 'Activo', finished: false };
        }
        return { status: 'Vencido', finished: false };
    }

    /** Reparte estados para un total arbitrario de tareas (misma regla 70–85% / 10–20% / 5–15%). */
    function repartoEstadosCount(seed, baseIndex, total) {
        const r = seeder(seed, baseIndex);
        const pFinalizadas = PCT_FINALIZADAS_MIN + r * PCT_FINALIZADAS_RANGO;
        const r2 = seeder(seed, baseIndex + 1);
        const pIniciadas = PCT_INICIADAS_MIN + r2 * PCT_INICIADAS_RANGO;
        let nF = Math.round(total * pFinalizadas);
        let nI = Math.round(total * pIniciadas);
        let nV = total - nF - nI;
        if (nV < 0) { nV = 0; nI = total - nF; }
        if (nI < 0) { nI = 0; nV = total - nF; }
        return { nFinalizadas: nF, nIniciadas: nI, nVencidas: nV };
    }

    /** Nombres genéricos para subtareas (se eligen por seed). */
    const NOMBRES_SUBTAREAS = [
        'Revisar alcance y requisitos', 'Preparar materiales', 'Ejecutar y validar', 'Documentar y reportar',
        'Verificar datos', 'Actualizar registro', 'Cerrar y notificar', 'Seguimiento y cierre',
        'Validar con responsable', 'Enviar para aprobación', 'Completar checklist', 'Archivar evidencia'
    ];

    function isoToMs(iso) {
        if (!iso) return NaN;
        const t = new Date(iso).getTime();
        return isNaN(t) ? NaN : t;
    }

    /**
     * Límite superior para tiempos del historial: no después de "ahora" ni del fin del día de la fecha límite.
     * Los comentarios no pueden estar fechados en el futuro ni confundirse con el día de vencimiento si aún no llega.
     */
    function getDetalleTimelineCapMs(endDateStr) {
        const nowMs = Date.now();
        if (!endDateStr) return nowMs;
        const p = String(endDateStr).split('-').map(Number);
        if (p.length !== 3) return nowMs;
        const endDayMs = new Date(p[0], p[1] - 1, p[2], 23, 59, 59, 999).getTime();
        return Math.min(nowMs, endDayMs);
    }

    /**
     * Reordena y recorta tiempos sintéticos: creación primero; comentarios y actividades solo entre creación y cap (hoy / fin de tarea).
     */
    function sanitizeDetalleTimeline(subtasks, comments, activities, fechaCreacion, endDateStr) {
        const capMs = getDetalleTimelineCapMs(endDateStr);
        let fcMs = fechaCreacion instanceof Date ? fechaCreacion.getTime() : new Date(fechaCreacion).getTime();
        if (isNaN(fcMs)) fcMs = capMs - 3600000;
        if (fcMs > capMs) fcMs = capMs - 3600000;
        if (fcMs > capMs) fcMs = capMs - 86400000;

        const creacionAct = activities.find(function (a) {
            return a && a.text && /creó la tarea/i.test(String(a.text));
        });
        if (creacionAct) {
            creacionAct.time = new Date(fcMs).toISOString();
        }

        const creacionMs = creacionAct ? isoToMs(creacionAct.time) : fcMs;
        let cursor = creacionMs + 5000;

        activities.forEach(function (a, i) {
            if (creacionAct && a === creacionAct) return;
            let m = isoToMs(a.time);
            if (isNaN(m)) m = cursor;
            if (m <= creacionMs) m = creacionMs + 2000 + i * 1500;
            if (m > capMs) m = Math.min(capMs - (activities.length - i) * 800, capMs);
            if (m <= creacionMs) m = creacionMs + 1000 + i * 1000;
            a.time = new Date(m).toISOString();
            cursor = Math.max(cursor, m);
        });

        comments.forEach(function (c, i) {
            let m = isoToMs(c.time);
            if (isNaN(m)) m = cursor + i * 2000;
            if (m <= creacionMs) m = creacionMs + 3000 + i * 2000;
            if (m > capMs) m = capMs - (comments.length - i) * 1500;
            if (m <= creacionMs) m = creacionMs + 4000 + i * 2000;
            c.time = new Date(Math.min(m, capMs)).toISOString();
            cursor = Math.max(cursor, isoToMs(c.time));
        });

        subtasks.forEach(function (s, i) {
            let m = isoToMs(s.created_at);
            if (isNaN(m)) m = creacionMs + 60000 + i * 30000;
            if (m <= creacionMs) m = creacionMs + 10000 + i * 5000;
            if (m > capMs) m = Math.min(creacionMs + (i + 2) * 60000, capMs);
            s.created_at = new Date(m).toISOString();
        });
    }

    /**
     * Genera subtareas, comentarios y actividades para una tarea (detalle usado por task-detail).
     * Lógica: 80% de tareas tienen subtareas; si la creadora es la usuaria y el asignado es de su equipo, 100%.
     * @param {number} taskId - Id de la tarea
     * @param {Object} opts - { nombreTarea, creador, creadorAvatar, asignado: { nombre, avatar, username }, fechaCreacion (Date), endDateStr, prioridad, done, estado, tieneSubtareas }
     * @param {number} seed - Semilla para aleatoriedad
     * @param {number} baseIdx - Índice base para seeder
     * @returns {{ subtasks: Array, comments: Array, activities: Array }}
     */
    function generarDetalleTarea(taskId, opts, seed, baseIdx) {
        const creador = opts.creador || 'Sin especificar';
        const creadorAvatar = opts.creadorAvatar || null;
        const asignado = opts.asignado || { nombre: 'Sin asignar', avatar: null, username: null };
        const asignadoNombre = asignado.nombre || 'Sin asignar';
        const fechaCreacion = opts.fechaCreacion || new Date();
        const endDateStr = opts.endDateStr || '';
        const prioridad = (opts.prioridad || 'media').toLowerCase();
        const prioridadLabel = prioridad === 'alta' ? 'Alta' : prioridad === 'baja' ? 'Baja' : 'Media';
        const done = !!opts.done;
        const estado = opts.estado || (done ? 'Finalizado' : 'Activo');
        const tieneSubtareas = !!opts.tieneSubtareas;
        const nombreTarea = opts.nombreTarea || 'Tarea';

        const toISO = (d) => (d && d.toISOString) ? d.toISOString() : (typeof d === 'string' ? d : '');
        const addHours = (d, h) => { const x = new Date(d); x.setHours(x.getHours() + h); return x; };
        const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

        const subtasks = [];
        const numSubtareas = tieneSubtareas ? (seeder(seed, baseIdx + 600) < 0.5 ? 3 : 4) : 0;
        for (let s = 0; s < numSubtareas; s++) {
            const subId = taskId * 1000 + s;
            const subName = NOMBRES_SUBTAREAS[(baseIdx + s * 7) % NOMBRES_SUBTAREAS.length];
            const subDone = done ? (seeder(seed, baseIdx + 601 + s) < 0.9) : (seeder(seed, baseIdx + 602 + s) < 0.3);
            const subStatus = subDone ? 'Finalizado' : 'Activo';
            const subCreated = addHours(fechaCreacion, s + 1);
            subtasks.push({
                id: subId,
                name: subName,
                done: subDone,
                status: subStatus,
                endDate: endDateStr,
                priority: prioridad,
                assignee_name: asignadoNombre,
                assignee_avatar_url: (asignado.avatar && String(asignado.avatar).trim()) ? asignado.avatar : null,
                assignee_email: asignado.username || null,
                created_at: toISO(subCreated)
            });
        }

        const comments = [];
        const t0 = toISO(fechaCreacion);
        const t1 = toISO(addDays(fechaCreacion, 1));
        const t2 = toISO(addDays(fechaCreacion, 2));
        const t3 = toISO(addDays(fechaCreacion, 3));
        comments.push({ id: taskId * 2000 + 1, author: creador, authorAvatar: creadorAvatar, time: t0, text: 'Hola ' + (asignadoNombre.split(' ')[0] || asignadoNombre) + ', te asigné esta tarea. Si tienes dudas citame a una reunión o escríbeme por aquí.', images: [] });
        comments.push({ id: taskId * 2000 + 2, author: asignadoNombre, authorAvatar: (asignado.avatar && String(asignado.avatar).trim()) ? asignado.avatar : null, time: t1, text: 'Listo, ya la tengo en mi lista. Voy a revisar el alcance y te aviso si necesito algo.', images: [] });
        if (numSubtareas > 0) {
            comments.push({ id: taskId * 2000 + 3, author: asignadoNombre, authorAvatar: (asignado.avatar && String(asignado.avatar).trim()) ? asignado.avatar : null, time: t2, text: done ? 'Todo entregado para revisión. Avísame si hay que ajustar algo.' : 'Voy avanzando con las subtareas, hoy termino al menos dos.', images: [] });
        }
        if (done || seeder(seed, baseIdx + 603) < 0.6) {
            comments.push({ id: taskId * 2000 + 4, author: creador, authorAvatar: creadorAvatar, time: t3, text: done ? 'Revisado, todo correcto. Gracias.' : 'Perfecto, cualquier cosa me comentas.', images: [] });
        }

        const activities = [];
        let actId = 0;
        const pushAct = (icon, author, text, time) => {
            actId++;
            activities.push({ id: 'act-' + taskId + '-' + actId, time: toISO(time), icon: icon, author: author, text: text });
        };
        pushAct('fa-circle-plus', creador, 'creó la tarea.', fechaCreacion);
        pushAct('fa-user-pen', creador, 'asignó la tarea a ' + asignadoNombre + '.', addHours(fechaCreacion, 1));
        if (seeder(seed, baseIdx + 604) < 0.4) {
            pushAct('fa-chevrons-up', creador, 'cambió la prioridad a ' + prioridadLabel + '.', addHours(fechaCreacion, 2));
        }
        /* No se registra "Por hacer": es el estado inicial al crear la tarea. */
        if (numSubtareas > 0) {
            if (numSubtareas === 1) {
                pushAct('fa-plus-circle', asignadoNombre, 'añadió la subtarea "' + (subtasks[0].name) + '".', addHours(fechaCreacion, 4));
            } else {
                subtasks.slice(0, 2).forEach((st, i) => pushAct('fa-plus-circle', asignadoNombre, 'añadió la subtarea "' + st.name + '".', addHours(fechaCreacion, 4 + i)));
                pushAct('fa-layer-plus', asignadoNombre, 'añadió ' + numSubtareas + ' subtareas en lote.', addHours(fechaCreacion, 5));
            }
            const completadas = subtasks.filter(st => st.done);
            if (completadas.length > 0) {
                pushAct('fa-circle-check', asignadoNombre, 'marcó "' + completadas[0].name + '" como completada.', addHours(fechaCreacion, 6));
            }
            if (endDateStr && seeder(seed, baseIdx + 606) < 0.35) {
                const [y, m, d] = endDateStr.split('-').map(Number);
                const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
                pushAct('fa-calendar-pen', asignadoNombre, 'cambió la fecha límite al ' + d + ' ' + (meses[(m || 1) - 1]) + ' ' + (y || new Date().getFullYear()) + '.', addHours(fechaCreacion, 7));
            }
        }

        sanitizeDetalleTimeline(subtasks, comments, activities, fechaCreacion, endDateStr);

        return { subtasks, comments, activities };
    }

    let actividadesSeguimiento = [];
    let tareasPorEmpleadoParaVistaTareas = {};
    let currentUserEmpleadoId = null;
    let planesIndividualesMaria = [];
    let planDetalleCompleto = {};
    let tareasPorPlanCompleto = {};
    let planNombreToId = {};
    /** Detalle por tarea (subtasks, comments, activities) para task-detail. Clave = id de tarea. */
    let taskDetallePorId = {};

    function generarDatos() {
        const empleados = (EMPLEADOS_EJEMPLO && EMPLEADOS_EJEMPLO.length)
            ? EMPLEADOS_EJEMPLO
            : [{
                id: USUARIO_ACTUAL.id,
                idColaborador: USUARIO_ACTUAL.idColaborador,
                nombre: USUARIO_ACTUAL.nombre,
                cargo: USUARIO_ACTUAL.cargo,
                area: USUARIO_ACTUAL.area,
                jefe: null,
                avatar: USUARIO_ACTUAL.avatar,
                esJefe: USUARIO_ACTUAL.esJefe,
                username: USUARIO_ACTUAL.username
            }];
        const jefes = (JEFES_EJEMPLO && JEFES_EJEMPLO.length) ? [GERENTE_EJEMPLO].concat(JEFES_EJEMPLO) : [];
        currentUserEmpleadoId = null;

        const todayStr = getTodayString();
        const partsInicio = INICIO_RANGO.split('-').map(Number);
        const partsFin = FIN_RANGO.split('-').map(Number);
        const y0 = partsInicio[0], m0 = partsInicio[1];
        const y1 = partsFin[0], m1 = partsFin[1], d1 = partsFin[2] || 31; // día tope del rango (no generar tareas después)
        const monthsTotal = (y1 - y0) * 12 + (m1 - m0) + 1;

        let idActividad = 10001;
        actividadesSeguimiento = [];
        tareasPorEmpleadoParaVistaTareas = {};
        planesIndividualesMaria = [];
        planDetalleCompleto = {};
        tareasPorPlanCompleto = {};
        planNombreToId = {};
        taskDetallePorId = {};
        let planGlobalIndex = 0;
        const reportesDirectosMaria = getReportesDirectosEjemplo(USUARIO_ACTUAL.nombre) || [];
        const empleadosPorArea = {};
        empleados.forEach(function (emp) {
            const area = emp.area || 'General';
            if (!empleadosPorArea[area]) empleadosPorArea[area] = [];
            empleadosPorArea[area].push(emp);
        });

        empleados.forEach((emp, empIndex) => {
            const username = emp.username || generarUsername(emp.nombre);
            const empleadoId = emp.id || emp.idColaborador || String(empIndex);
            if (currentUserEmpleadoId == null && (emp.nombre === USUARIO_ACTUAL.nombre || username === USUARIO_ACTUAL.username)) currentUserEmpleadoId = empleadoId;
            if (empleados.length === 1) currentUserEmpleadoId = empleadoId;
            tareasPorEmpleadoParaVistaTareas[empleadoId] = { individuales: [], grupales: [] };
            const seed = (empIndex + 1) * 1000;

            for (let mi = 0; mi < monthsTotal; mi++) {
                const year = y0 + Math.floor(mi / 12);
                const month = (mi % 12) + 1;
                const daysInMonth = new Date(year, month, 0).getDate();
                const isLastMonth = (year === y1 && month === m1);
                const maxDay = isLastMonth ? Math.min(daysInMonth, d1) : daysInMonth;
                const baseIdx = empIndex * 1000 + mi * TAREAS_INDIVIDUALES_POR_MES;
                const { nFinalizadas, nIniciadas, nVencidas } = repartoEstadosCount(seed, baseIdx, TAREAS_INDIVIDUALES_POR_MES);
                const estados = [];
                for (let i = 0; i < nFinalizadas; i++) estados.push('Finalizada');
                for (let i = 0; i < nIniciadas; i++) estados.push('Por hacer');
                for (let i = 0; i < nVencidas; i++) estados.push('Vencida');
                for (let i = estados.length; i < TAREAS_INDIVIDUALES_POR_MES; i++) estados.push('Finalizada');
                shuffleArray(estados, seed + baseIdx);

                for (let i = 0; i < TAREAS_INDIVIDUALES_POR_MES; i++) {
                    const estado = estados[i];
                    const done = estado === 'Finalizada';
                    let day = Math.max(1, Math.min(maxDay, Math.floor(seeder(seed, baseIdx + i + 100) * maxDay) + 1));
                    day = toWeekdayInMonth(year, month, day);
                    if (day > maxDay) day = maxDay;
                    let endDateStr = `${year}-${pad(month)}-${pad(day)}`;
                    if (endDateStr > FIN_RANGO) { endDateStr = FIN_RANGO; }
                    /* Días futuros: solo ~5% finalizadas (realista); pasado/hoy mantienen la distribución normal */
                    let estadoFinal = estado;
                    let doneFinal = done;
                    if (endDateStr > todayStr) {
                        estadoFinal = seeder(seed, baseIdx + i + 777) < 0.05 ? 'Finalizada' : 'Por hacer';
                        doneFinal = estadoFinal === 'Finalizada';
                    }
                    const [ey, em, ed] = endDateStr.split('-').map(Number);
                    const endDate = new Date(ey, em - 1, ed);
                    let fechaCreacion = new Date(ey, em - 1, Math.max(1, ed - 2));
                    if (endDateStr >= todayStr) {
                        const tp = todayStr.split('-').map(Number);
                        const todayMidnight = new Date(tp[0], tp[1] - 1, tp[2]);
                        if (fechaCreacion.getTime() > todayMidnight.getTime()) {
                            fechaCreacion = new Date(todayMidnight);
                        }
                    }
                    const prioridades = ['Alta', 'Media', 'Baja'];
                    const prioridad = prioridades[Math.floor(seeder(seed, baseIdx + i + 200) * 3)];
                    const nombreTarea = TITULOS_TAREAS[(baseIdx + i) % TITULOS_TAREAS.length];

                    const tareaVista = {
                        id: idActividad,
                        name: nombreTarea,
                        done: doneFinal,
                        status: estadoFinal === 'Finalizada' ? 'Finalizado' : (estadoFinal === 'Vencida' ? 'Vencido' : 'Activo'),
                        endDate: endDateStr,
                        priority: prioridad.toLowerCase(),
                        assignee_email: username,
                        assignee_name: emp.nombre || null,
                        assignee_avatar_url: (emp.avatar && String(emp.avatar).trim()) ? emp.avatar : null,
                        etiqueta: null,
                        created_by: emp.nombre,
                        created_by_avatar_url: emp.avatar || '',
                        role: 'colaborador',
                        planId: null,
                        planNombre: null,
                        description: seeder(seed, baseIdx + i + 400) > 0.7 ? 'Seguimiento y cierre.' : null
                    };

                    const tieneSubtareas = (seeder(seed, baseIdx + i + 500) < 0.8) ||
                        (emp.nombre === USUARIO_ACTUAL.nombre && reportesDirectosMaria.indexOf(emp.nombre) >= 0);

                    tareasPorEmpleadoParaVistaTareas[empleadoId].individuales.push(Object.assign({}, tareaVista));

                    const taskParaDetalle = Object.assign({}, tareaVista, { created_at: fechaCreacion.toISOString() });
                    const detalle = generarDetalleTarea(idActividad, {
                        nombreTarea: nombreTarea,
                        creador: emp.nombre,
                        creadorAvatar: emp.avatar || null,
                        asignado: { nombre: emp.nombre, avatar: emp.avatar || null, username: username },
                        fechaCreacion: fechaCreacion,
                        endDateStr: endDateStr,
                        prioridad: prioridad.toLowerCase(),
                        done: doneFinal,
                        estado: tareaVista.status,
                        tieneSubtareas: tieneSubtareas
                    }, seed, baseIdx + i);
                    taskDetallePorId[idActividad] = {
                        task: taskParaDetalle,
                        subtasks: detalle.subtasks,
                        comments: detalle.comments,
                        activities: detalle.activities
                    };

                    idActividad++;
                }

                if (empleadoId === currentUserEmpleadoId) {
                    const indBase = mi * TAREAS_INDIVIDUALES_POR_MES;
                    const inds = tareasPorEmpleadoParaVistaTareas[empleadoId].individuales;
                    const grupos = [];
                    let offset = 0;
                    for (let g = 0; g < TAMANOS_GRUPOS_INDIVIDUALES.length; g++) {
                        const size = TAMANOS_GRUPOS_INDIVIDUALES[g];
                        grupos.push(inds.slice(indBase + offset, indBase + offset + size));
                        offset += size;
                    }
                    const planFechaCreacion = `${year}-${pad(month)}-${pad(1)}`;
                    grupos.forEach((tasks, p) => {
                        if (tasks.length === 0) return;
                        const planId = 'ind-' + (empIndex * 100 + mi * 3 + p + 100);
                        const planEndDay = Math.max(1, Math.min(daysInMonth, 5 + p * 8));
                        const planEndDate = `${year}-${pad(month)}-${pad(planEndDay)}`;
                        const planName = NOMBRES_PLANES_IND[(mi + p) % NOMBRES_PLANES_IND.length] + ' ' + pad(month) + '/' + year;
                        const tasksDone = tasks.filter(t => t.done).length;
                        const progress = tasks.length > 0 ? Math.round((tasksDone / tasks.length) * 100) : 0;
                        const derivedPlan = derivePlanStatus(progress, planEndDate, todayStr, planGlobalIndex++);
                        tasks.forEach(t => { t.planId = planId; });
                        const planObj = {
                            id: planId,
                            name: planName,
                            description: 'Plan individual de ' + emp.nombre + '.',
                            end_date: planEndDate,
                            status: derivedPlan.status,
                            tasksDone: tasksDone,
                            tasksTotal: tasks.length,
                            finished: derivedPlan.finished,
                            hasMembers: false,
                            created_by: emp.nombre,
                            created_by_avatar_url: (emp.avatar && String(emp.avatar).trim()) ? emp.avatar : null,
                            fechaCreacion: planFechaCreacion,
                            progress: progress
                        };
                        planesIndividualesMaria.push(planObj);
                        planDetalleCompleto[planId] = planObj;
                        tareasPorPlanCompleto[planId] = tasks.map(t => Object.assign({}, t));
                    });
                }
            }
        });

        // Tareas grupales: 1 plan por área/mes con TAREAS_GRUPALES_POR_AREA_MES tareas repartidas en el equipo.
        Object.keys(empleadosPorArea).forEach(function (area, areaIdx) {
            const areaEmps = empleadosPorArea[area];
            if (!areaEmps || areaEmps.length === 0) return;
            const lider = obtenerJefe(area, false, jefes) || areaEmps[0].nombre;
            const liderObj = jefes.find(function (j) { return j.nombre === lider; });
            const creadorAvatar = (liderObj && liderObj.avatar && String(liderObj.avatar).trim()) ? liderObj.avatar : null;

            for (let mi = 0; mi < monthsTotal; mi++) {
                const year = y0 + Math.floor(mi / 12);
                const month = (mi % 12) + 1;
                const daysInMonth = new Date(year, month, 0).getDate();
                const isLastMonth = (year === y1 && month === m1);
                const maxDay = isLastMonth ? Math.min(daysInMonth, d1) : daysInMonth;
                const planNombreGrupo = 'Plan ' + area + ' ' + pad(month) + '/' + year;
                const baseIdx = 50000 + areaIdx * 1000 + mi * TAREAS_GRUPALES_POR_AREA_MES;
                const seedArea = (areaIdx + 1) * 2000;
                const { nFinalizadas, nIniciadas, nVencidas } = repartoEstadosCount(seedArea, baseIdx, TAREAS_GRUPALES_POR_AREA_MES);
                const estadosGrupo = [];
                for (let gi = 0; gi < nFinalizadas; gi++) estadosGrupo.push('Finalizada');
                for (let gi = 0; gi < nIniciadas; gi++) estadosGrupo.push('Por hacer');
                for (let gi = 0; gi < nVencidas; gi++) estadosGrupo.push('Vencida');
                for (let gi = estadosGrupo.length; gi < TAREAS_GRUPALES_POR_AREA_MES; gi++) estadosGrupo.push('Finalizada');
                shuffleArray(estadosGrupo, seedArea + baseIdx);

                for (let gi = 0; gi < TAREAS_GRUPALES_POR_AREA_MES; gi++) {
                    const emp = areaEmps[gi % areaEmps.length];
                    const username = emp.username || generarUsername(emp.nombre);
                    const empleadoId = emp.id || emp.idColaborador || String(areaIdx);
                    const estado = estadosGrupo[gi];
                    const done = estado === 'Finalizada';
                    let day = maxDay <= 1 ? 1 : 1 + Math.round((gi / (TAREAS_GRUPALES_POR_AREA_MES - 1)) * (maxDay - 1));
                    day = toWeekdayInMonth(year, month, day);
                    if (day > maxDay) day = maxDay;
                    let endDateStr = year + '-' + pad(month) + '-' + pad(day);
                    if (endDateStr > FIN_RANGO) { endDateStr = FIN_RANGO; }
                    let estadoFinal = estado;
                    let doneFinal = done;
                    if (endDateStr > todayStr) {
                        estadoFinal = seeder(seedArea, baseIdx + gi + 777) < 0.05 ? 'Finalizada' : 'Por hacer';
                        doneFinal = estadoFinal === 'Finalizada';
                    }
                    const [ey, em, ed] = endDateStr.split('-').map(Number);
                    const endDate = new Date(ey, em - 1, ed);
                    let fechaCreacion = new Date(ey, em - 1, Math.max(1, ed - 2));
                    if (endDateStr >= todayStr) {
                        const tp = todayStr.split('-').map(Number);
                        const todayMidnight = new Date(tp[0], tp[1] - 1, tp[2]);
                        if (fechaCreacion.getTime() > todayMidnight.getTime()) {
                            fechaCreacion = new Date(todayMidnight);
                        }
                    }
                    const prioridades = ['Alta', 'Media', 'Baja'];
                    const prioridad = prioridades[Math.floor(seeder(seedArea, baseIdx + gi + 200) * 3)];
                    const nombreTarea = TITULOS_TAREAS[(baseIdx + gi) % TITULOS_TAREAS.length];
                    const asignado = { nombre: emp.nombre, avatar: emp.avatar || '', username: username };

                    const tareaGrupo = {
                        id: idActividad,
                        name: nombreTarea,
                        done: doneFinal,
                        status: estadoFinal === 'Finalizada' ? 'Finalizado' : (estadoFinal === 'Vencida' ? 'Vencido' : 'Activo'),
                        endDate: endDateStr,
                        priority: prioridad.toLowerCase(),
                        assignee_email: username,
                        assignee_name: emp.nombre || null,
                        assignee_avatar_url: (emp.avatar && String(emp.avatar).trim()) ? emp.avatar : null,
                        etiqueta: null,
                        created_by: lider,
                        created_by_avatar_url: creadorAvatar || '',
                        role: 'colaborador',
                        planId: null,
                        planNombre: planNombreGrupo,
                        description: seeder(seedArea, baseIdx + gi + 400) > 0.7 ? 'Seguimiento y cierre.' : null
                    };

                    if (!tareasPorEmpleadoParaVistaTareas[empleadoId]) {
                        tareasPorEmpleadoParaVistaTareas[empleadoId] = { individuales: [], grupales: [] };
                    }
                    tareasPorEmpleadoParaVistaTareas[empleadoId].grupales.push(Object.assign({}, tareaGrupo));

                    actividadesSeguimiento.push({
                        id: idActividad,
                        tipo: 'tarea',
                        nombre: nombreTarea,
                        plan: planNombreGrupo,
                        asignado: asignado,
                        idColaborador: emp.idColaborador || emp.id,
                        area: area,
                        areaCreador: area,
                        lider: lider,
                        cargo: emp.cargo || '',
                        estado: estadoFinal,
                        prioridad: prioridad,
                        avance: doneFinal ? 100 : 0,
                        fechaCreacion: formatearFechaSeguimiento(fechaCreacion),
                        fechaFinalizacion: formatearFechaSeguimiento(endDate),
                        creador: lider,
                        creador_avatar: creadorAvatar,
                        comentarios: Math.floor(seeder(seedArea, baseIdx + gi + 300) * 5)
                    });

                    const tieneSubtareas = (seeder(seedArea, baseIdx + gi + 500) < 0.8) ||
                        (lider === USUARIO_ACTUAL.nombre && reportesDirectosMaria.indexOf(emp.nombre) >= 0);
                    const detalle = generarDetalleTarea(idActividad, {
                        nombreTarea: nombreTarea,
                        creador: lider,
                        creadorAvatar: creadorAvatar,
                        asignado: { nombre: emp.nombre, avatar: emp.avatar || null, username: username },
                        fechaCreacion: fechaCreacion,
                        endDateStr: endDateStr,
                        prioridad: prioridad.toLowerCase(),
                        done: doneFinal,
                        estado: tareaGrupo.status,
                        tieneSubtareas: tieneSubtareas
                    }, seedArea, baseIdx + gi);
                    taskDetallePorId[idActividad] = {
                        task: Object.assign({}, tareaGrupo, { created_at: fechaCreacion.toISOString() }),
                        subtasks: detalle.subtasks,
                        comments: detalle.comments,
                        activities: detalle.activities
                    };

                    idActividad++;
                }
            }
        });

        // María Alejandra: siempre 6 tareas vencidas de la semana anterior (solo para ella, lógica fija no aleatoria).
        if (currentUserEmpleadoId != null) {
            const mariaEmp = empleados.find(function (e) { return e.id === currentUserEmpleadoId; });
            if (mariaEmp) {
                const usernameMaria = mariaEmp.username || generarUsername(mariaEmp.nombre);
                const prioridades = ['alta', 'media', 'baja'];
                const titulosVencidas = [
                    'Revisar inventario bodega', 'Orden de compra pendiente', 'Seguimiento a proveedores',
                    'Cierre de ciclo logístico', 'Informe de entregas', 'Coordinación con transporte'
                ];
                for (var k = 1; k <= 6; k++) {
                    var rawDate = getTodayPlusDays(-k);
                    var [y, m, d] = rawDate.split('-').map(Number);
                    var dayWeekday = toWeekdayInMonth(y, m, d);
                    var endDateVencida = y + '-' + pad(m) + '-' + pad(dayWeekday);
                    var fechaCreacionVencida = new Date(y, m - 1, Math.max(1, dayWeekday - 2));
                    var tareaVencida = {
                        id: idActividad,
                        name: titulosVencidas[k - 1],
                        done: false,
                        status: 'Vencido',
                        endDate: endDateVencida,
                        priority: prioridades[(k - 1) % 3],
                        assignee_email: usernameMaria,
                        assignee_name: mariaEmp.nombre || null,
                        assignee_avatar_url: (mariaEmp.avatar && String(mariaEmp.avatar).trim()) ? mariaEmp.avatar : null,
                        etiqueta: null,
                        created_by: mariaEmp.nombre,
                        created_by_avatar_url: mariaEmp.avatar || '',
                        role: 'colaborador',
                        planId: null,
                        planNombre: null,
                        description: 'Tarea de la semana anterior.'
                    };
                    tareasPorEmpleadoParaVistaTareas[currentUserEmpleadoId].individuales.push(tareaVencida);

                    var tieneSubtareasVencida = (idActividad % 5) !== 0;
                    var detalleVencida = generarDetalleTarea(idActividad, {
                        nombreTarea: titulosVencidas[k - 1],
                        creador: mariaEmp.nombre,
                        creadorAvatar: mariaEmp.avatar || null,
                        asignado: { nombre: mariaEmp.nombre, avatar: mariaEmp.avatar || null, username: usernameMaria },
                        fechaCreacion: fechaCreacionVencida,
                        endDateStr: endDateVencida,
                        prioridad: prioridades[(k - 1) % 3],
                        done: false,
                        estado: 'Vencido',
                        tieneSubtareas: tieneSubtareasVencida
                    }, 9999, idActividad + k * 100);
                    taskDetallePorId[idActividad] = {
                        task: Object.assign({}, tareaVencida, { created_at: fechaCreacionVencida.toISOString() }),
                        subtasks: detalleVencida.subtasks,
                        comments: detalleVencida.comments,
                        activities: detalleVencida.activities
                    };

                    idActividad++;
                }
            }
        }

        // Planes de compañía creados por HR: Objetivos Qx 20xx y Encuestas Qx 20xx. Una tarea por persona y por mes del trimestre (toda la compañía).
        const jefaRH = empleados.find(e => (e.cargo || '').indexOf('Jefa') >= 0 && (e.area || '') === 'Recursos Humanos');
        const encargadoObjetivos = empleados.find(e => (e.cargo || '').indexOf('Objetivos') >= 0 && (e.area || '') === 'Recursos Humanos');
        const encargadaEncuestas = empleados.find(e => (e.cargo || '').indexOf('Encuestas') >= 0 && (e.area || '') === 'Recursos Humanos');
        const asignadosCompania = empleados.filter(e => (e.area || '') !== 'Recursos Humanos' && (e.area || '') !== 'Gerencia General');
        const quarters = [
            { label: 'Q1 2025', year: 2025, monthStart: 1 },
            { label: 'Q2 2025', year: 2025, monthStart: 4 },
            { label: 'Q3 2025', year: 2025, monthStart: 7 },
            { label: 'Q4 2025', year: 2025, monthStart: 10 },
            { label: 'Q1 2026', year: 2026, monthStart: 1 }
        ];
        const tareasObjetivos = ['Crear objetivos en la interfaz', 'Evaluación de desempeño', 'Cargar progreso final de objetivos'];
        const tareasEncuestas = ['Contestar encuesta de cultura', 'Contestar encuesta de salud', 'Contestar encuesta 360'];
        quarters.forEach(function (q, qIdx) {
            const year = q.year;
            const mesInicio = q.monthStart;
            ['Objetivos', 'Encuestas'].forEach(function (tipo, tipoIdx) {
                const nombrePlan = tipo + ' ' + q.label;
                // Las tareas de compañía (Objetivos/Encuestas) se muestran como creadas por la Líder de RH
                const creadorEmp = jefaRH || (tipo === 'Objetivos' ? encargadoObjetivos : encargadaEncuestas);
                const creadorNombre = creadorEmp ? creadorEmp.nombre : (tipo === 'Objetivos' ? 'Roberto Carlos Méndez Soto' : 'Adriana Lucía Ríos Calle');
                const tareasTitulos = tipo === 'Objetivos' ? tareasObjetivos : tareasEncuestas;
                for (let mes = 0; mes < 3; mes++) {
                    const m = mesInicio + mes;
                    const day = toWeekdayInMonth(year, m, 15); // día 15 o el laborable más cercano
                    const endDateStr = year + '-' + pad(m) + '-' + pad(day);
                    const endDate = new Date(year, m - 1, day);
                    let fechaCreacion = new Date(year, m - 1, Math.max(1, day - 2));
                    if (endDateStr >= todayStr) {
                        const tp = todayStr.split('-').map(Number);
                        const todayMidnight = new Date(tp[0], tp[1] - 1, tp[2]);
                        if (fechaCreacion.getTime() > todayMidnight.getTime()) {
                            fechaCreacion = new Date(todayMidnight);
                        }
                    }
                    const esFechaFutura = endDateStr > todayStr;
                    asignadosCompania.forEach(function (empAsig, idxCompania) {
                        const asignado = { nombre: empAsig.nombre, avatar: empAsig.avatar || '', username: empAsig.username || generarUsername(empAsig.nombre) };
                        let estado = seeder(8888, idActividad + idxCompania * 10 + mes) < 0.75 ? 'Finalizada' : (seeder(8888, idActividad + idxCompania * 10 + mes + 1) < 0.5 ? 'Por hacer' : 'Vencida');
                        if (esFechaFutura) {
                            estado = seeder(8888, idActividad + idxCompania * 10 + mes + 555) < 0.05 ? 'Finalizada' : 'Por hacer';
                        }
                        const done = estado === 'Finalizada';
                        const statusVista = estado === 'Finalizada' ? 'Finalizado' : (estado === 'Vencida' ? 'Vencido' : 'Activo');
                        actividadesSeguimiento.push({
                            id: idActividad,
                            tipo: 'tarea',
                            nombre: tareasTitulos[mes],
                            plan: nombrePlan,
                            asignado: asignado,
                            idColaborador: empAsig.idColaborador || empAsig.id,
                            area: empAsig.area || 'General',
                            areaCreador: 'Recursos Humanos',
                            lider: obtenerJefe(empAsig.area, empAsig.esJefe, jefes),
                            cargo: empAsig.cargo || '',
                            estado: estado,
                            prioridad: 'Media',
                            avance: done ? 100 : 0,
                            fechaCreacion: formatearFechaSeguimiento(fechaCreacion),
                            fechaFinalizacion: formatearFechaSeguimiento(endDate),
                            creador: creadorNombre,
                            creador_avatar: creadorEmp && (creadorEmp.avatar && String(creadorEmp.avatar).trim()) ? creadorEmp.avatar : null,
                            comentarios: 0
                        });

                        const taskCompania = {
                            id: idActividad,
                            name: tareasTitulos[mes],
                            done: done,
                            status: statusVista,
                            endDate: endDateStr,
                            priority: 'media',
                            assignee_email: asignado.username || null,
                            assignee_name: asignado.nombre || null,
                            assignee_avatar_url: (asignado.avatar && String(asignado.avatar).trim()) ? asignado.avatar : null,
                            etiqueta: null,
                            created_by: creadorNombre,
                            created_by_avatar_url: creadorEmp && (creadorEmp.avatar && String(creadorEmp.avatar).trim()) ? creadorEmp.avatar : null,
                            planId: null,
                            planNombre: nombrePlan,
                            description: tipo === 'Objetivos' ? 'Tarea de objetivos trimestrales.' : 'Tarea de encuesta de compañía.',
                            created_at: fechaCreacion.toISOString()
                        };
                        const tieneSubtareasCompania = seeder(8888, idActividad + 700) < 0.2;
                        const detalleCompania = generarDetalleTarea(idActividad, {
                            nombreTarea: tareasTitulos[mes],
                            creador: creadorNombre,
                            creadorAvatar: creadorEmp && (creadorEmp.avatar && String(creadorEmp.avatar).trim()) ? creadorEmp.avatar : null,
                            asignado: { nombre: asignado.nombre, avatar: asignado.avatar || null, username: asignado.username },
                            fechaCreacion: fechaCreacion,
                            endDateStr: endDateStr,
                            prioridad: 'media',
                            done: done,
                            estado: statusVista,
                            tieneSubtareas: tieneSubtareasCompania
                        }, 8888, idActividad + idxCompania * 10 + mes);
                        taskDetallePorId[idActividad] = {
                            task: taskCompania,
                            subtasks: detalleCompania.subtasks,
                            comments: detalleCompania.comments,
                            activities: detalleCompania.activities
                        };

                        idActividad++;
                    });
                }
            });
        });

        // Construir actividades tipo 'plan' para el tab Planes de seguimiento (agrupando tareas por plan)
        const planIdBase = 50000;
        let planIdNext = planIdBase;
        const byPlan = {};
        actividadesSeguimiento.forEach(function (t) {
            if (t.tipo !== 'tarea' || !t.plan) return;
            const key = t.plan;
            if (!byPlan[key]) {
                byPlan[key] = { tareas: [], asignadosMap: new Map() };
            }
            byPlan[key].tareas.push(t);
            if (t.asignado && t.asignado.nombre) {
                byPlan[key].asignadosMap.set(t.asignado.nombre, {
                    id: t.idColaborador,
                    nombre: t.asignado.nombre,
                    avatar: t.asignado.avatar || '',
                    username: t.asignado.username || generarUsername(t.asignado.nombre)
                });
            }
        });
        Object.keys(byPlan).forEach(function (nombrePlan) {
            const g = byPlan[nombrePlan];
            const tareas = g.tareas;
            if (tareas.length === 0) return;
            const primera = tareas[0];
            // Creador del plan: "Plan {área} MM/YYYY" → jefe del área; Objetivos/Encuestas → primera.creador (RH)
            const esPlanGrupalPorArea = nombrePlan.indexOf('Plan ') === 0;
            const areaLider = esPlanGrupalPorArea ? jefes.find(function (j) { return j.area === primera.area; }) : null;
            const planCreador = (esPlanGrupalPorArea && areaLider && areaLider.nombre) ? areaLider.nombre : primera.creador;
            const asignados = Array.from(g.asignadosMap.values());
            const tareasFinalizadas = tareas.filter(function (t) { return t.estado === 'Finalizada'; }).length;
            const avancePlan = tareas.length > 0 ? Math.round((tareasFinalizadas / tareas.length) * 100) : 0;
            const fechasCreacion = tareas.map(function (t) { return parseFechaSeguimiento(t.fechaCreacion); }).filter(Boolean);
            const fechasFinVal = tareas.map(function (t) { return parseFechaSeguimiento(t.fechaFinalizacion); }).filter(Boolean);
            const minCreacion = fechasCreacion.length ? new Date(Math.min.apply(null, fechasCreacion)) : primera.fechaCreacion;
            const maxFin = fechasFinVal.length ? new Date(Math.max.apply(null, fechasFinVal)) : primera.fechaFinalizacion;
            const planId = planIdNext++;
            const planEndDateStr = typeof maxFin === 'object' && maxFin instanceof Date ? (maxFin.getFullYear() + '-' + pad(maxFin.getMonth() + 1) + '-' + pad(maxFin.getDate())) : null;
            const planFechaCreacionStr = typeof minCreacion === 'object' && minCreacion instanceof Date ? (minCreacion.getFullYear() + '-' + pad(minCreacion.getMonth() + 1) + '-' + pad(minCreacion.getDate())) : null;
            const derivedPlan = derivePlanStatus(avancePlan, planEndDateStr, todayStr, planGlobalIndex++);
            const estadoPlan = derivedPlan.status === 'Finalizado' ? 'Finalizada' : (derivedPlan.status === 'Vencido' ? 'Vencida' : 'Por hacer');
            const planCreadorAvatar = (esPlanGrupalPorArea && areaLider && areaLider.avatar && String(areaLider.avatar).trim()) ? areaLider.avatar : null;
            const planObj = {
                id: planId,
                name: nombrePlan,
                description: 'Plan grupal de ' + (primera.area || 'área') + '.',
                end_date: planEndDateStr,
                status: derivedPlan.status,
                tasksDone: tareasFinalizadas,
                tasksTotal: tareas.length,
                finished: derivedPlan.finished,
                hasMembers: true,
                created_by: planCreador,
                created_by_avatar_url: planCreadorAvatar,
                fechaCreacion: planFechaCreacionStr,
                progress: avancePlan
            };
            planDetalleCompleto[planId] = planObj;
            planNombreToId[nombrePlan] = planId;
            actividadesSeguimiento.push({
                id: planId,
                tipo: 'plan',
                nombre: nombrePlan,
                plan: nombrePlan,
                asignado: asignados[0] || { nombre: planCreador, avatar: '', username: '' },
                asignados: asignados,
                idColaborador: primera.idColaborador,
                area: primera.area,
                areaCreador: primera.areaCreador != null ? primera.areaCreador : primera.area,
                lider: primera.lider,
                cargo: primera.cargo || '',
                estado: estadoPlan,
                prioridad: 'Media',
                avance: avancePlan,
                totalTareas: tareas.length,
                fechaCreacion: typeof minCreacion === 'object' && minCreacion instanceof Date ? formatearFechaSeguimiento(minCreacion) : primera.fechaCreacion,
                fechaFinalizacion: typeof maxFin === 'object' && maxFin instanceof Date ? formatearFechaSeguimiento(maxFin) : primera.fechaFinalizacion,
                creador: planCreador,
                comentarios: 0
            });
        });
    }

    function parseFechaSeguimiento(fechaStr) {
        if (!fechaStr) return null;
        const meses = { 'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5, 'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11 };
        const partes = fechaStr.trim().split(/[\s\/\-]+/);
        if (partes.length >= 3 && partes[1].toLowerCase() in meses) {
            const dia = parseInt(partes[0], 10);
            const mes = meses[partes[1].toLowerCase()];
            const anio = parseInt(partes[2], 10);
            if (!isNaN(dia) && !isNaN(mes) && !isNaN(anio)) return new Date(anio, mes, dia);
        }
        return null;
    }

    function shuffleArray(arr, seed) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(seeder(seed, i) * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    generarDatos();

    function getUsuarioActual() {
        return Object.assign({}, USUARIO_ACTUAL);
    }

    // Cumplimiento por hora del día para tareas grupales: a las 8 todas iniciadas, al mediodía ~mitad finalizadas, a las 18 todas finalizadas
    function estadoGrupalPorHora(taskId, endDateStr) {
        var today = getTodayString();
        if (!endDateStr) return { done: false, status: 'Activo' };
        if (endDateStr < today) return { done: true, status: 'Finalizado' };
        if (endDateStr > today) return { done: false, status: 'Activo' };
        var now = new Date();
        var currentHour = now.getHours() + now.getMinutes() / 60;
        var completionHour = 8 + (Number(taskId) % 11); // reparto entre 8h y 18h
        if (currentHour >= completionHour) return { done: true, status: 'Finalizado' };
        return { done: false, status: 'Activo' };
    }

    /** Devuelve array de fechas YYYY-MM-DD de días laborables entre hoy y finRango (inclusive). */
    function getWeekdaysFromTodayTo(finRango) {
        const today = getTodayString();
        if (today > finRango) return [];
        const out = [];
        const [y1, m1, d1] = finRango.split('-').map(Number);
        const end = new Date(y1, m1 - 1, d1);
        let d = new Date();
        d.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        while (d <= end) {
            const dow = d.getDay();
            if (dow !== 0 && dow !== 6) {
                out.push(d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()));
            }
            d.setDate(d.getDate() + 1);
        }
        return out;
    }

    function getTareasVistaTareas() {
        const empleadoId = currentUserEmpleadoId != null ? currentUserEmpleadoId : USUARIO_ACTUAL.id;
        const data = tareasPorEmpleadoParaVistaTareas[empleadoId] || { individuales: [], grupales: [] };
        const nombreUsuarioActual = USUARIO_ACTUAL.nombre;

        // Regla especial para María (y cualquier líder): en tareas.html solo (1 tarea por reporte directo + 1 propia + 1 de la jefa) por día laborable.
        const reportesDirectos = (EMPLEADOS_EJEMPLO || []).filter(function (e) { return e.jefe === nombreUsuarioActual; });
        const esVistaLiderPorDia = reportesDirectos.length > 0;
        const jefa = (GERENTE_EJEMPLO && nombreUsuarioActual !== GERENTE_EJEMPLO.nombre) ? GERENTE_EJEMPLO : null;

        if (esVistaLiderPorDia) {
            // Vencidas: las propias de María (individuales vencidas)
            const vencidas = (data.individuales || [])
                .filter(function (t) { return t.status === 'Vencido'; })
                .map(function (t) { return Object.assign({}, t); });

            const weekdays = getWeekdaysFromTodayTo(FIN_RANGO);
            const porDia = {};

            // Índice por empleadoId → array de todas sus tareas (individuales + grupales)
            // para poder buscar tareas reales por fecha.
            const tareasPorEmpleado = {};
            reportesDirectos.forEach(function (emp) {
                const empId = emp.id || emp.idColaborador;
                const empData = tareasPorEmpleadoParaVistaTareas[empId] || { individuales: [], grupales: [] };
                tareasPorEmpleado[empId] = (empData.grupales || []).concat(empData.individuales || []);
            });
            // Auto: tareas propias de María
            tareasPorEmpleado['__self__'] = (data.grupales || []).concat(data.individuales || []);

            /**
             * Busca la tarea de un empleado para un día dado.
             * Orden de preferencia: exacta en endDate → más cercana por fecha.
             */
            function pickTaskForDay(empId, dateStr) {
                const lista = tareasPorEmpleado[empId] || [];
                /**
                 * Normaliza done para que sea siempre booleano coherente con status.
                 * Si esReutilizada=true (tarea de otro día), la mostramos como Activo
                 * para que no aparezca "Finalizada" en un día diferente al original.
                 */
                function normalizar(t, overrides) {
                    var esReutilizada = overrides && overrides.endDate && overrides.endDate !== t.endDate;
                    var copia = Object.assign({}, t, overrides);
                    if (esReutilizada) {
                        // Al reutilizar en otro día, no tiene sentido mostrarla finalizada
                        copia.done = false;
                        copia.status = 'Activo';
                    } else {
                        copia.done = (copia.status === 'Finalizado') ? true : !!copia.done;
                    }
                    return copia;
                }
                // 1. Exacta
                const exacta = lista.find(function (t) { return t.endDate === dateStr; });
                if (exacta) return normalizar(exacta);
                // 2. Más cercana (por diferencia absoluta de días)
                if (!lista.length) return null;
                var best = null, bestDiff = Infinity;
                const ts = new Date(dateStr).getTime();
                lista.forEach(function (t) {
                    if (!t.endDate) return;
                    var diff = Math.abs(new Date(t.endDate).getTime() - ts);
                    if (diff < bestDiff) { bestDiff = diff; best = t; }
                });
                return best ? normalizar(best, { endDate: dateStr }) : null;
            }

            weekdays.forEach(function (dateStr) {
                const list = [];

                // 1. Una tarea real por cada reporte directo (solo si la tarea fue creada por o asignada a la usuaria actual)
                reportesDirectos.forEach(function (emp) {
                    const empId = emp.id || emp.idColaborador;
                    const tarea = pickTaskForDay(empId, dateStr);
                    if (tarea && (tarea.created_by === nombreUsuarioActual || (tarea.assignee_name && String(tarea.assignee_name).trim() === nombreUsuarioActual))) {
                        list.push(tarea);
                    }
                });

                // 2. Una tarea propia de María para ese día
                const tareaPropia = pickTaskForDay('__self__', dateStr);
                if (tareaPropia) {
                    list.push(tareaPropia);
                }

                // 3. Tarea de la jefa (Patricia): buscamos grupales donde created_by = jefa.nombre
                if (jefa) {
                    const tareasJefa = (data.grupales || []).filter(function (t) {
                        return t.created_by && t.created_by === jefa.nombre;
                    });
                    const exactaJefa = tareasJefa.find(function (t) { return t.endDate === dateStr; });
                    const tareaJefa = exactaJefa || (tareasJefa.length ? Object.assign({}, tareasJefa[0], { endDate: dateStr }) : null);
                    if (tareaJefa) list.push(Object.assign({}, tareaJefa));
                }

                if (list.length) porDia[dateStr] = list;
            });

            /**
             * Días anteriores a hoy: en calendario/tareas.html deben listarse solo tareas finalizadas
             * con endDate exacto en ese día (la regla "1 por reporte + propia + jefa" solo aplica a hoy→FIN_RANGO).
             */
            (function agregarDiasPasadosSoloFinalizados() {
                const hoyStr = getTodayString();
                function esTareaFinalizada(t) {
                    return t && (t.done === true || t.status === 'Finalizado' || t.status === 'Finalizada');
                }
                const fechasPasadas = {};
                function marcarFechas(lista) {
                    (lista || []).forEach(function (t) {
                        if (!t.endDate || t.endDate >= hoyStr || !esTareaFinalizada(t)) return;
                        fechasPasadas[t.endDate] = true;
                    });
                }
                reportesDirectos.forEach(function (emp) {
                    const empId = emp.id || emp.idColaborador;
                    marcarFechas(tareasPorEmpleado[empId] || []);
                });
                marcarFechas(tareasPorEmpleado['__self__'] || []);
                if (jefa) {
                    (data.grupales || []).forEach(function (t) {
                        if (t.created_by && t.created_by === jefa.nombre && t.endDate && t.endDate < hoyStr && esTareaFinalizada(t)) {
                            fechasPasadas[t.endDate] = true;
                        }
                    });
                }
                Object.keys(fechasPasadas).sort().forEach(function (dateStr) {
                    const list = [];
                    const ids = {};
                    function pushUnique(t) {
                        const tid = t.id;
                        if (tid != null && ids[tid]) return;
                        if (tid != null) ids[tid] = true;
                        list.push(Object.assign({}, t));
                    }
                    reportesDirectos.forEach(function (emp) {
                        const empId = emp.id || emp.idColaborador;
                        (tareasPorEmpleado[empId] || []).forEach(function (t) {
                            if (t.endDate !== dateStr || !esTareaFinalizada(t)) return;
                            if (t.created_by === nombreUsuarioActual || (t.assignee_name && String(t.assignee_name).trim() === nombreUsuarioActual)) {
                                pushUnique(t);
                            }
                        });
                    });
                    (tareasPorEmpleado['__self__'] || []).forEach(function (t) {
                        if (t.endDate === dateStr && esTareaFinalizada(t)) pushUnique(t);
                    });
                    if (jefa) {
                        (data.grupales || []).forEach(function (t) {
                            if (t.created_by === jefa.nombre && t.endDate === dateStr && esTareaFinalizada(t)) pushUnique(t);
                        });
                    }
                    if (list.length) porDia[dateStr] = list;
                });
            })();

            return { vencidas: vencidas, porDia: porDia };
        }

        const todasTareas = []
            .concat(data.individuales.map(t => Object.assign({}, t, { created_by: nombreUsuarioActual, created_by_avatar_url: USUARIO_ACTUAL.avatar })))
            .concat(data.grupales.map(t => Object.assign({}, t))); // grupales ya tienen created_by = líder

        // Incluir también las tareas que el usuario actual creó para otros (creadas por María, asignadas a otra persona)
        const tareasCreadasParaOtros = actividadesSeguimiento
            .filter(function (a) {
                if (a.tipo !== 'tarea' || !a.creador || a.creador !== nombreUsuarioActual) return false;
                const asignadoNombre = a.asignado && a.asignado.nombre;
                return asignadoNombre && asignadoNombre !== nombreUsuarioActual;
            })
            .map(function (a) {
                const asignado = a.asignado || {};
                const endDate = fechaSeguimientoToYYYYMMDD(a.fechaFinalizacion);
                var porHora = estadoGrupalPorHora(a.id, endDate);
                return {
                    id: a.id,
                    name: a.nombre,
                    done: porHora.done,
                    status: porHora.status,
                    endDate: endDate,
                    priority: (a.prioridad || 'Media').toLowerCase(),
                    assignee_email: asignado.username || null,
                    assignee_name: asignado.nombre || null,
                    assignee_avatar_url: (asignado.avatar && String(asignado.avatar).trim()) ? asignado.avatar : null,
                    etiqueta: null,
                    planId: (a.plan && planNombreToId[a.plan] != null) ? planNombreToId[a.plan] : null,
                    planNombre: a.plan || null,
                    description: null,
                    created_by: a.creador || nombreUsuarioActual,
                    created_by_avatar_url: (a.creador_avatar && String(a.creador_avatar).trim()) ? a.creador_avatar : USUARIO_ACTUAL.avatar
                };
            });
        todasTareas.push.apply(todasTareas, tareasCreadasParaOtros);

        // Incluir tareas asignadas a mí por otros (ej. RH: Objetivos/Encuestas creadas por Carmen Rosa)
        const idsEnLista = new Set(todasTareas.map(function (t) { return t.id; }));
        const tareasAsignadasAMiPorOtros = actividadesSeguimiento
            .filter(function (a) {
                if (a.tipo !== 'tarea' || !a.asignado || a.asignado.nombre !== nombreUsuarioActual) return false;
                return !idsEnLista.has(a.id);
            })
            .map(function (a) {
                const asignado = a.asignado || {};
                const endDate = fechaSeguimientoToYYYYMMDD(a.fechaFinalizacion);
                var porHora = (a.plan && planNombreToId[a.plan] != null) ? estadoGrupalPorHora(a.id, endDate) : { done: a.estado === 'Finalizada', status: a.estado === 'Finalizada' ? 'Finalizado' : (a.estado === 'Vencida' ? 'Vencido' : 'Activo') };
                return {
                    id: a.id,
                    name: a.nombre,
                    done: porHora.done,
                    status: porHora.status,
                    endDate: endDate,
                    priority: (a.prioridad || 'Media').toLowerCase(),
                    assignee_email: asignado.username || null,
                    assignee_name: asignado.nombre || null,
                    assignee_avatar_url: (asignado.avatar && String(asignado.avatar).trim()) ? asignado.avatar : null,
                    etiqueta: null,
                    planId: (a.plan && planNombreToId[a.plan] != null) ? planNombreToId[a.plan] : null,
                    planNombre: a.plan || null,
                    description: null,
                    created_by: a.creador || '',
                    created_by_avatar_url: (a.creador_avatar && String(a.creador_avatar).trim()) ? a.creador_avatar : null
                };
            });
        todasTareas.push.apply(todasTareas, tareasAsignadasAMiPorOtros);

        // Aplicar cumplimiento por hora a todas las tareas grupales (las que tienen planNombre)
        todasTareas.forEach(function (t) {
            if (t.planNombre && planNombreToId[t.planNombre] != null) t.planId = planNombreToId[t.planNombre];
            if (t.planNombre) {
                var h = estadoGrupalPorHora(t.id, t.endDate);
                t.done = h.done;
                t.status = h.status;
            }
        });

        const vencidas = todasTareas.filter(t => t.status === 'Vencido').map(t => Object.assign({}, t));
        const porDia = {};
        todasTareas.filter(t => t.endDate).forEach(t => {
            const c = Object.assign({}, t);
            if (!porDia[c.endDate]) porDia[c.endDate] = [];
            porDia[c.endDate].push(c);
        });
        return { vencidas, porDia };
    }

    function fechaSeguimientoToYYYYMMDD(fechaStr) {
        var d = parseFechaSeguimiento(fechaStr);
        if (!d) return null;
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function estadoPlanToStatus(estado) {
        if (estado === 'Finalizada') return 'Finalizado';
        if (estado === 'Vencida') return 'Vencido';
        return 'Activo';
    }

    function planVisibleEnVistaPlanes(plan) {
        if (!plan || !plan.name) return false;
        var name = plan.name;
        if (name.indexOf('Plan ' + USUARIO_ACTUAL.area + ' ') === 0) return true;
        if (name.indexOf('Objetivos ') === 0 || name.indexOf('Encuestas ') === 0) return true;
        return false;
    }

    function normalizeNameForPlanAssign(str) {
        if (str == null) return '';
        return String(str).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
    }

    /** Planes donde María participa como creadora o tiene tareas asignadas (selector tirilla / task-detail). */
    function getPlanesParaAsignarTarea() {
        var userName = USUARIO_ACTUAL.nombre;
        var userEmail = USUARIO_ACTUAL.username;
        var userNorm = normalizeNameForPlanAssign(userName);
        var planes = getPlanesVistaPlanes();
        if (!Array.isArray(planes)) return [];
        return planes.filter(function (p) {
            if (!p) return false;
            if (normalizeNameForPlanAssign(p.created_by) === userNorm) return true;
            var planTasks = getTareasPorPlan(p.id) || [];
            return planTasks.some(function (t) {
                if (!t) return false;
                return normalizeNameForPlanAssign(t.assignee_name) === userNorm
                    || (userEmail && t.assignee_email === userEmail);
            });
        }).map(function (p) {
            return { id: p.id, name: p.name || 'Plan sin nombre' };
        });
    }

    // Vista planes (María): individuales propios + plan grupal de su área + planes empresa.
    function getPlanesVistaPlanes() {
        var individuales = planesIndividualesMaria.map(function (p) { return Object.assign({}, p); });
        var grupales = Object.keys(planDetalleCompleto).filter(function (k) {
            var n = parseInt(k, 10);
            if (isNaN(n) || n < 50000) return false;
            return planVisibleEnVistaPlanes(planDetalleCompleto[k]);
        }).map(function (k) { return Object.assign({}, planDetalleCompleto[k]); });
        return individuales.concat(grupales);
    }

    function getPlanDetalle(planId) {
        var id = String(planId);
        if (planDetalleCompleto[id]) return Object.assign({}, planDetalleCompleto[id]);
        return null;
    }

    function getTareasPorPlan(planId) {
        var id = String(planId);
        var list = tareasPorPlanCompleto[id];
        if (list) return list.map(function (t) { return Object.assign({}, t); });
        var planIdNum = parseInt(planId, 10);
        if (planIdNum >= 50000) {
            var planGrupal = actividadesSeguimiento.find(function (a) { return a.tipo === 'plan' && a.id === planIdNum; });
            if (planGrupal) {
                var nombrePlan = planGrupal.nombre;
                return actividadesSeguimiento
                    .filter(function (a) { return a.tipo === 'tarea' && a.plan === nombrePlan; })
                    .map(function (t) {
                        var asignado = t.asignado || {};
                        return {
                            id: t.id,
                            name: t.nombre,
                            done: t.estado === 'Finalizada',
                            status: t.estado === 'Finalizada' ? 'Finalizado' : (t.estado === 'Vencida' ? 'Vencido' : 'Activo'),
                            endDate: fechaSeguimientoToYYYYMMDD(t.fechaFinalizacion),
                            priority: (t.prioridad || 'Media').toLowerCase(),
                            assignee_email: asignado.username || null,
                            assignee_name: asignado.nombre || null,
                            assignee_avatar_url: (asignado.avatar && String(asignado.avatar).trim()) ? asignado.avatar : null,
                            etiqueta: null,
                            planId: planIdNum,
                            planNombre: nombrePlan,
                            description: null,
                            created_by: t.creador || ''
                        };
                    });
            }
        }
        return [];
    }

    function getActividadesSeguimiento() {
        return actividadesSeguimiento.map(a => Object.assign({}, a));
    }

    function getActividadesParaLider(nombreLider) {
        const reportes = getReportesDirectosEjemplo(nombreLider) || [];
        const setReportes = new Set(reportes);
        setReportes.add(nombreLider);
        return actividadesSeguimiento.filter(function (act) {
            if (act.tipo === 'tarea' && act.asignado) return setReportes.has(act.asignado.nombre);
            if (act.tipo === 'plan' && act.asignados && act.asignados.length) {
                return act.asignados.some(function (a) { return setReportes.has(a.nombre); });
            }
            return false;
        });
    }

    function normalizeNameForMatch(str) {
        if (str == null || typeof str !== 'string') return '';
        return str.replace(/\s+/g, ' ').trim();
    }

    /** Resuelve nombre y avatar del creador por nombre (para "Creada por" en panel de detalle). Incluye Gerente para que las tareas que la jefa le crea a María muestren "Creada por Patricia". */
    function getCreatorDisplay(nombre) {
        var name = normalizeNameForMatch(nombre);
        if (!name) return { name: 'Sin especificar', avatar: null };
        var current = getUsuarioActual();
        if (current && current.nombre && normalizeNameForMatch(current.nombre) === name) return { name: current.nombre, avatar: (current.avatar && String(current.avatar).trim()) ? current.avatar : null };
        // JEFES_EJEMPLO es accesible directamente en este scope (IIFE); getJefesEjemplo() no existe como función local.
        var jefes = [GERENTE_EJEMPLO].concat(JEFES_EJEMPLO || []);
        var emp = (jefes || []).find(function (e) { return e && normalizeNameForMatch(e.nombre) === name; });
        if (emp) return { name: emp.nombre || name, avatar: (emp.avatar && String(emp.avatar).trim()) ? emp.avatar : null };
        var empleados = EMPLEADOS_EJEMPLO || [];
        emp = (empleados || []).find(function (e) { return normalizeNameForMatch(e.nombre) === name; });
        if (emp) return { name: emp.nombre || name, avatar: (emp.avatar && String(emp.avatar).trim()) ? emp.avatar : null };
        return { name: name, avatar: null };
    }

    /** ID fijo para la tarea prototipo Aprendizaje (URL estable: task-detail.html?id=9000000000001). */
    const TASK_ID_PROTO_APRENDIZAJE = 9000000000001;
    /** Demo vista tareas: curso en progreso (75 %) — Comunicación asertiva para líderes (f016). */
    const TASK_ID_PROTO_APRENDIZAJE_PROGRESO = 9000000000002;
    /** Demo vista tareas: curso finalizado — Emplea los valores del liderazgo femenino (UBITS u040). */
    const TASK_ID_PROTO_APRENDIZAJE_COMPLETADA = 9000000000003;

    /**
     * Detalle canónico para demos de tareas tipo Aprendizaje (Metas personales, hoy).
     * @param {Object} spec - taskId, name, learningContentId, done, learningContentProgress?, learningCardStatus?, description?, seed, baseIdx
     */
    function buildProtoAprendizajeTaskDetailFromSpec(spec) {
        var u = getUsuarioActual();
        var planesList = getPlanesVistaPlanes();
        var planId = null;
        var planNombre = null;
        var metas = planesList.find(function (p) { return (p.name || '').indexOf('Metas personales') === 0; });
        if (metas) {
            planId = metas.id;
            planNombre = metas.name;
        }
        var todayStr = getTodayString();
        var fechaCreacion = new Date();
        fechaCreacion.setDate(fechaCreacion.getDate() - 1);
        var taskId = spec.taskId;
        var done = !!spec.done;
        var estadoTxt = spec.status || (done ? 'Finalizado' : 'Activo');
        var taskBase = {
            id: taskId,
            name: spec.name,
            done: done,
            status: estadoTxt,
            endDate: todayStr,
            priority: 'media',
            assignee_email: u.username || null,
            assignee_name: u.nombre || null,
            assignee_avatar_url: (u.avatar && String(u.avatar).trim()) ? u.avatar : null,
            created_by: u.nombre,
            created_by_avatar_url: (u.avatar && String(u.avatar).trim()) ? u.avatar : null,
            planId: planId,
            planNombre: planNombre,
            taskType: 'aprendizaje',
            learningContentId: spec.learningContentId,
            description: spec.description || '',
            created_at: fechaCreacion.toISOString()
        };
        if (typeof spec.learningContentProgress === 'number') {
            taskBase.learningContentProgress = spec.learningContentProgress;
        }
        if (spec.learningCardStatus) {
            taskBase.learningCardStatus = spec.learningCardStatus;
        }
        var detalle = generarDetalleTarea(taskId, {
            nombreTarea: taskBase.name,
            creador: u.nombre,
            creadorAvatar: u.avatar || null,
            asignado: { nombre: u.nombre, avatar: u.avatar || null, username: u.username },
            fechaCreacion: fechaCreacion,
            endDateStr: todayStr,
            prioridad: 'media',
            done: done,
            estado: estadoTxt === 'Finalizado' ? 'Finalizado' : 'Activo',
            tieneSubtareas: false
        }, spec.seed || 4242, spec.baseIdx || 1);
        return {
            task: taskBase,
            subtasks: detalle.subtasks,
            comments: detalle.comments,
            activities: detalle.activities
        };
    }

    function buildProtoAprendizajeTaskDetail() {
        return buildProtoAprendizajeTaskDetailFromSpec({
            taskId: TASK_ID_PROTO_APRENDIZAJE,
            name: 'Curso: Trabajo en equipo y colaboración',
            learningContentId: 'f012',
            done: false,
            status: 'Activo',
            description: 'Prototipo oficial de tarea de tipo Aprendizaje para demos y enlace compartido.',
            seed: 4242,
            baseIdx: 1
        });
    }

    function buildProtoAprendizajeTaskDetailProgreso() {
        return buildProtoAprendizajeTaskDetailFromSpec({
            taskId: TASK_ID_PROTO_APRENDIZAJE_PROGRESO,
            name: 'Curso: Comunicación asertiva para líderes',
            learningContentId: 'f016',
            done: false,
            status: 'Activo',
            learningContentProgress: 75,
            learningCardStatus: 'progress',
            description: 'Demo: contenido en progreso (75 %).',
            seed: 5151,
            baseIdx: 2
        });
    }

    function buildProtoAprendizajeTaskDetailCompletada() {
        return buildProtoAprendizajeTaskDetailFromSpec({
            taskId: TASK_ID_PROTO_APRENDIZAJE_COMPLETADA,
            name: 'Curso: Emplea los valores del liderazgo femenino',
            learningContentId: 'u040',
            done: true,
            status: 'Finalizado',
            learningContentProgress: 100,
            learningCardStatus: 'completed',
            description: 'Demo: contenido y tarea finalizados.',
            seed: 6262,
            baseIdx: 3
        });
    }

    /**
     * Devuelve el detalle completo de una tarea para task-detail.html: tarea (con created_at),
     * subtareas, comentarios y actividades (historial). Si la tarea no está en taskDetallePorId
     * (ej. tarea sintética de la vista líder), se intenta construir desde actividadesSeguimiento.
     * @param {string|number} taskId - Id de la tarea
     * @returns {{ task: Object, subtasks: Array, comments: Array, activities: Array } | null}
     */
    function getTaskDetail(taskId) {
        const id = Number(taskId);
        if (id === TASK_ID_PROTO_APRENDIZAJE) {
            return buildProtoAprendizajeTaskDetail();
        }
        if (id === TASK_ID_PROTO_APRENDIZAJE_PROGRESO) {
            return buildProtoAprendizajeTaskDetailProgreso();
        }
        if (id === TASK_ID_PROTO_APRENDIZAJE_COMPLETADA) {
            return buildProtoAprendizajeTaskDetailCompletada();
        }
        if (taskDetallePorId[id]) {
            const d = taskDetallePorId[id];
            return {
                task: Object.assign({}, d.task),
                subtasks: (d.subtasks || []).map(s => Object.assign({}, s)),
                comments: (d.comments || []).map(c => Object.assign({}, c)),
                activities: (d.activities || []).map(a => Object.assign({}, a))
            };
        }
        const act = actividadesSeguimiento.find(function (a) { return a.tipo === 'tarea' && a.id === id; });
        if (act) {
            const asignado = act.asignado || {};
            const endDate = fechaSeguimientoToYYYYMMDD(act.fechaFinalizacion);
            return {
                task: {
                    id: act.id,
                    name: act.nombre,
                    done: act.estado === 'Finalizada',
                    status: act.estado === 'Finalizada' ? 'Finalizado' : (act.estado === 'Vencida' ? 'Vencido' : 'Activo'),
                    endDate: endDate,
                    priority: (act.prioridad || 'Media').toLowerCase(),
                    assignee_email: asignado.username || null,
                    assignee_name: asignado.nombre || null,
                    assignee_avatar_url: (asignado.avatar && String(asignado.avatar).trim()) ? asignado.avatar : null,
                    created_by: act.creador || null,
                    created_by_avatar_url: (act.creador_avatar && String(act.creador_avatar).trim()) ? act.creador_avatar : null,
                    planId: (act.plan && planNombreToId[act.plan] != null) ? planNombreToId[act.plan] : null,
                    planNombre: act.plan || null,
                    description: null,
                    created_at: act.fechaCreacion ? (parseFechaSeguimiento(act.fechaCreacion) || new Date()).toISOString() : new Date().toISOString()
                },
                subtasks: [],
                comments: [],
                activities: []
            };
        }
        return null;
    }

    global.TAREAS_PLANES_DB = {
        TASK_ID_PROTO_APRENDIZAJE: TASK_ID_PROTO_APRENDIZAJE,
        TASK_ID_PROTO_APRENDIZAJE_PROGRESO: TASK_ID_PROTO_APRENDIZAJE_PROGRESO,
        TASK_ID_PROTO_APRENDIZAJE_COMPLETADA: TASK_ID_PROTO_APRENDIZAJE_COMPLETADA,
        getUsuarioActual: getUsuarioActual,
        getTareasVistaTareas: getTareasVistaTareas,
        getPlanesVistaPlanes: getPlanesVistaPlanes,
        getPlanesParaAsignarTarea: getPlanesParaAsignarTarea,
        getPlanDetalle: getPlanDetalle,
        getTareasPorPlan: getTareasPorPlan,
        getActividadesSeguimiento: getActividadesSeguimiento,
        getActividadesParaLider: getActividadesParaLider,
        getCreatorDisplay: getCreatorDisplay,
        getTodayString: getTodayString,
        getReportesDirectos: getReportesDirectosEjemplo,
        getTaskDetail: getTaskDetail,
        getEmpresaEjemplo: function () { return Object.assign({}, EMPRESA_EJEMPLO); },
        getAreasEjemplo: function () { return AREAS_EJEMPLO.slice(); },
        getJefesEjemplo: function () { return JEFES_EJEMPLO.slice(); },
        getEmpleadosEjemplo: function () { return EMPLEADOS_EJEMPLO.slice(); }
    };

})(__tareasGlobal);
export const TAREAS_PLANES_DB = __tareasGlobal.TAREAS_PLANES_DB;
