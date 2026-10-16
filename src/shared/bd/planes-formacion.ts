// @ts-nocheck
// oxlint-disable
// El generador original trae variables y ramas que aquí no se usan. Se deja tal cual para no
// tocar los datos: si hay que corregirlo, se corrige en el catálogo de origen y se vuelve a portar.
// Planes de formación y sus grupos.
// Portado del catálogo del playground anterior; los datos no se editan a mano.

import { BD_MASTER_COLABORADORES } from './colaboradores';
import { BDS_CONTENIDOS_UBITS } from './catalogo-ubits';
const __planesGlobal = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {});
__planesGlobal.BD_MASTER_COLABORADORES = BD_MASTER_COLABORADORES;
__planesGlobal.BDS_CONTENIDOS_UBITS = BDS_CONTENIDOS_UBITS;

(function (global) {
    'use strict';

    var STORAGE_KEY = 'ubits-planes-formacion-db';
    /** Bump: plan demo masivo HU-LMS-015 (asignaciones desiguales). */
    var STORAGE_SCHEMA_VERSION = 13;
    var HORAS_META_COMPETENCIAS = 2;
    /** Usuario demo zona de estudio (María Alejandra — bd-master-colaboradores E006). */
    var PLAYGROUND_DEMO_USER_ID = 'E006';
    /** Planes de contenidos pasados (No vigente) al 100 % — tab Plan de contenidos / historial. */
    var DEMO_CONTENIDOS_PLANES_COMPLETOS = [
        'pf-c-gerencia-general-2025-q1',
        'pf-c-gerencia-general-2025-q2',
        'pf-c-gerencia-general-2025-q3'
    ];
    /**
     * Progreso: cada persona — 3 planes Vigente = 1 completado, 1 en curso, 1 sin iniciar.
     * Completado / sin iniciar = competencias. En curso = contenidos del área (1/3 ítems al 100 %).
     * Comunicación 2026 no se genera (evita un 4.º vigente). Tiempo de estudio del mes: 4 h 30 min (11.º en el ranking de la empresa).
     */
    var DEMO_PROGRESO_PLAN_COMPLETADO = 'pf-k-024-2026';
    var DEMO_PROGRESO_PLAN_SIN_INICIAR = 'pf-k-020-2026';
    /** Plan Vigente con varias competencias y asignación desigual (tab Competencias / Agregar usuario). */
    var DEMO_PLAN_COMPETENCIAS_MASIVO = 'pf-k-demo-masivo-2026';
    var DEMO_PROGRESO_MINUTOS_ESTUDIO_LIDER = 4 * 60 + 30;

    var AREAS_LIDERES = [
        { slug: 'ventas', area: 'Ventas', leaderId: 'E002' },
        { slug: 'instalaciones', area: 'Instalaciones', leaderId: 'E003' },
        { slug: 'reparaciones', area: 'Reparaciones', leaderId: 'E004' },
        { slug: 'atencion-al-cliente', area: 'Atención al Cliente', leaderId: 'E005' },
        { slug: 'logistica', area: 'Logística', leaderId: 'E006' },
        { slug: 'administracion', area: 'Administración', leaderId: 'E007' },
        { slug: 'marketing', area: 'Marketing', leaderId: 'E008' },
        { slug: 'recursos-humanos', area: 'Recursos Humanos', leaderId: 'E052' },
        { slug: 'gerencia-general', area: 'Gerencia General', leaderId: 'E001' }
    ];

    var TRIMESTRES = [
        { key: '2025-Q1', label: 'Q1 2025', start: '2025-01-01', end: '2025-03-31' },
        { key: '2025-Q2', label: 'Q2 2025', start: '2025-04-01', end: '2025-06-30' },
        { key: '2025-Q3', label: 'Q3 2025', start: '2025-07-01', end: '2025-09-30' },
        { key: '2025-Q4', label: 'Q4 2025', start: '2025-10-01', end: '2025-12-31' },
        { key: '2026-Q1', label: 'Q1 2026', start: '2026-01-01', end: '2026-03-31' },
        { key: '2026-Q2', label: 'Q2 2026', start: '2026-04-01', end: '2026-06-30' },
        { key: '2026-Q3', label: 'Q3 2026', start: '2026-07-01', end: '2026-09-30' }
    ];

    var COMPETENCIAS_PLAYGROUND = [
        { id: 'comp-024', nombre: 'Liderazgo' },
        { id: 'comp-020', nombre: 'Inglés' },
        { id: 'comp-004', nombre: 'Comunicación' }
    ];

    var COMP_CREADORES = ['E052', 'E053', 'E054'];
    var ANIOS_COMPETENCIAS = [2025, 2026, 2027];

    function hashStr(s) {
        var h = 0;
        var str = String(s || '');
        for (var i = 0; i < str.length; i++) {
            h = ((h << 5) - h) + str.charCodeAt(i);
            h = h | 0;
        }
        return Math.abs(h);
    }

    function parseIsoDate(iso) {
        if (!iso) return null;
        var p = String(iso).trim().split('-');
        if (p.length < 3) return null;
        var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
        return isNaN(d.getTime()) ? null : d;
    }

    function toIsoDate(d) {
        if (!d || isNaN(d.getTime())) return '';
        var y = d.getFullYear();
        var m = ('0' + (d.getMonth() + 1)).slice(-2);
        var day = ('0' + d.getDate()).slice(-2);
        return y + '-' + m + '-' + day;
    }

    /** Fecha real del dispositivo — vigencia de planes se recalcula con este «hoy». */
    var PLAYGROUND_TODAY = toIsoDate(new Date()) || '2026-07-23';

    function isoToDisplay(iso) {
        var d = parseIsoDate(iso);
        if (!d) return iso || '';
        return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
    }

    function getColaboradores() {
        var bd = BD_MASTER_COLABORADORES;
        return (bd && bd.colaboradores) ? bd.colaboradores.slice() : [];
    }

    function getColaboradorById(id) {
        var cid = String(id || '');
        var list = getColaboradores();
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].id) === cid) return list[i];
        }
        return null;
    }

    function getLiderById(leaderId) {
        return getColaboradorById(leaderId);
    }

    function getReportesDirectos(leaderId) {
        var lider = getLiderById(leaderId);
        if (!lider || !lider.nombre) return [];
        var nombreJefe = lider.nombre;
        return getColaboradores().filter(function (c) {
            return c.jefe === nombreJefe && !c.esGerenteGeneral;
        });
    }

    function getContenidosCatalogo() {
        var bd = BDS_CONTENIDOS_UBITS;
        return (bd && bd.contents) ? bd.contents.slice() : [];
    }

    function contenidosPorCompetencia(compId) {
        return getContenidosCatalogo().filter(function (c) {
            return c.competenciaPrincipalId === compId;
        });
    }

    function horasContenido(c) {
        if (!c) return 1;
        var v = Number(c.tiempoValor) || 60;
        var u = String(c.unidadTiempo || 'minutos').toLowerCase();
        if (u.indexOf('hora') >= 0) return v;
        return v / 60;
    }

    function formatDuration(c) {
        if (!c) return '60 min';
        var v = c.tiempoValor || 60;
        var u = String(c.unidadTiempo || 'minutos').toLowerCase();
        if (u.indexOf('hora') >= 0) return v + ' h';
        return v + ' min';
    }

    function progressStatus(pct) {
        if (pct >= 100) return 'completed';
        if (pct > 0) return 'progress';
        return 'default';
    }

    function getEstadoPlan(plan, hoyIso) {
        if (!plan) return 'Planeado';
        var hoy = parseIsoDate(hoyIso || PLAYGROUND_TODAY);
        var start = parseIsoDate(plan.fechaInicioIso || plan.fechaInicio);
        var end = parseIsoDate(plan.fechaFinIso || plan.fechaFin);
        if (plan.estado && String(plan.estado).indexOf('Procesando') === 0) return plan.estado;
        if (!start || !end || !hoy) return 'Planeado';
        if (hoy < start) return 'Planeado';
        if (hoy > end) return 'No vigente';
        return 'Vigente';
    }

    function planSinProgresoReal(estado) {
        if (!estado) return true;
        var e = String(estado);
        return e === 'Planeado' || e.indexOf('Procesando') === 0;
    }

    function pickContenidosParaPersona(planId, colaboradorId, quarterKey, pool, count) {
        var out = [];
        var used = {};
        var n = count || 3;
        var base = hashStr(planId + '|' + colaboradorId + '|' + quarterKey);
        for (var attempt = 0; attempt < pool.length * 2 && out.length < n; attempt++) {
            var idx = (base + attempt * 17) % pool.length;
            var c = pool[idx];
            if (!c || used[c.id]) continue;
            used[c.id] = true;
            out.push(c);
        }
        return out;
    }

    function genPctContenido(planId, colaboradorId, contentId, estado, itemIndex, totalItems) {
        if (planSinProgresoReal(estado)) return 0;
        var total = totalItems || 3;
        var idx = itemIndex != null ? itemIndex : 0;
        var profile = hashStr(planId + '|' + colaboradorId + '|plan-profile') % 5;
        if (profile === 0) return 100;
        var numComplete = profile === 1 ? 1 : (profile === 2 || profile === 3 ? 2 : 0);
        if (idx < numComplete) return 100;
        var h = hashStr(planId + colaboradorId + contentId);
        if (estado === 'No vigente') return Math.min(99, 15 + (h % 70));
        return Math.min(99, 10 + (h % 75));
    }

    function itemEstaFinalizado(it) {
        if (!it) return false;
        var pct = Number(it.progress);
        if (pct >= 100) return true;
        return String(it.status || '') === 'completed';
    }

    /** Porcentaje de ítems finalizados (100 %), no promedio de avance parcial. */
    function progresoFinalizacionItems(items) {
        if (!items || !items.length) return 0;
        var done = 0;
        items.forEach(function (it) {
            if (itemEstaFinalizado(it)) done += 1;
        });
        return Math.round((done / items.length) * 100);
    }

    function buildContenidoItem(c, pct) {
        return {
            id: c.id,
            title: c.title || c.titulo || '',
            duration: formatDuration(c),
            progress: pct,
            status: progressStatus(pct)
        };
    }

    function buildAsignacionContenidos(planId, col, contenidosItems) {
        return {
            id: 'fila-usuario-' + col.id,
            colaboradorId: String(col.id),
            nombreUsuario: (col.nombre || '').trim(),
            avatar: col.avatar || null,
            contenidos: contenidosItems.map(function (it) {
                return { id: it.id, title: it.title, duration: it.duration };
            }),
            contenidosCount: contenidosItems.length
        };
    }

    function progresoPromedioItems(items) {
        if (!items || !items.length) return 0;
        var sum = 0;
        items.forEach(function (it) { sum += Number(it.progress || 0); });
        return Math.round(sum / items.length);
    }

    function genConsumoCompetencia(planId, colaboradorId, compId, startIso, endIso, metaHoras, estado) {
        if (planSinProgresoReal(estado)) return { horas: 0, items: [] };
        var pool = contenidosPorCompetencia(compId);
        if (!pool.length) {
            pool = getContenidosCatalogo().slice(0, 20);
        }
        var h = hashStr(planId + colaboradorId);
        var targetPct = estado === 'No vigente'
            ? Math.min(100, 40 + (h % 61))
            : Math.min(100, (h % 95));
        var targetHoras = (targetPct / 100) * metaHoras;
        var consumidos = [];
        var acum = 0;
        var idx = h % Math.max(1, pool.length);
        for (var i = 0; i < pool.length && acum < targetHoras - 0.01; i++) {
            var c = pool[(idx + i) % pool.length];
            var hrs = horasContenido(c);
            consumidos.push({ contenidoId: c.id, horas: hrs, competenciaId: compId });
            acum += hrs;
        }
        return { horas: Math.min(acum, metaHoras * 1.2), items: consumidos };
    }

    function progresoCompetenciaPersona(consumo, metaHoras) {
        var h = consumo && consumo.horas ? consumo.horas : 0;
        return Math.min(100, Math.round((h / metaHoras) * 100));
    }

    function setItemsProgress(items, pct) {
        (items || []).forEach(function (it) {
            var value = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
            it.progress = value;
            it.status = progressStatus(value);
        });
    }

    function colaboradorCompletoPlan(plan, colaboradorId) {
        if (!plan) return false;
        var estado = plan.estado || getEstadoPlan(plan, PLAYGROUND_TODAY);
        if (planSinProgresoReal(estado)) return false;
        var cid = String(colaboradorId || '');
        var items = [];
        if (plan.tipo === 'contenidos') {
            items = (plan.contenidoPorUsuario || {})[cid] || [];
        } else if (plan.tipo === 'competencias') {
            items = (plan.competenciaPorUsuario || {})[cid] || [];
        } else {
            return false;
        }
        if (!items.length) return false;
        for (var i = 0; i < items.length; i++) {
            if (!itemEstaFinalizado(items[i])) return false;
        }
        return true;
    }

    function progresoUsuariosPlanCompleto(plan) {
        if (!plan) return 0;
        var estado = plan.estado || getEstadoPlan(plan, PLAYGROUND_TODAY);
        if (planSinProgresoReal(estado)) return 0;
        var asignaciones = plan.asignaciones || [];
        if (!asignaciones.length) return 0;
        var completos = 0;
        asignaciones.forEach(function (a) {
            var cid = a.colaboradorId != null && String(a.colaboradorId).trim() !== ''
                ? String(a.colaboradorId)
                : (String(a.id || '').indexOf('fila-usuario-') === 0
                    ? String(a.id).slice('fila-usuario-'.length)
                    : String(a.id || ''));
            if (colaboradorCompletoPlan(plan, cid)) completos += 1;
        });
        return Math.round((completos / asignaciones.length) * 100);
    }

    function recalcProgresoAgregado(plan) {
        plan.progresoAgregado = progresoUsuariosPlanCompleto(plan);
        plan._progresoStale = false;
    }

    function setContenidosItemsFinalizados(items, numComplete) {
        var n = Math.max(0, Math.round(Number(numComplete) || 0));
        (items || []).forEach(function (it, i) {
            var value = i < n ? 100 : 0;
            it.progress = value;
            it.status = progressStatus(value);
        });
    }

    function setCompetenciaUsuarioProgress(plan, colaboradorId, pct) {
        var cid = String(colaboradorId || '');
        var items = (plan.competenciaPorUsuario || {})[cid];
        if (!items || !items.length) return;
        var value = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
        setItemsProgress(items, value);
        var meta = plan.horasEstudioMeta != null ? Number(plan.horasEstudioMeta) : HORAS_META_COMPETENCIAS;
        if (!plan.consumoPorUsuario) plan.consumoPorUsuario = {};
        var prev = plan.consumoPorUsuario[cid] || { horas: 0, items: [] };
        plan.consumoPorUsuario[cid] = {
            horas: Math.round((value / 100) * meta * 100) / 100,
            items: prev.items || []
        };
    }

    /**
     * Demo progreso:
     * - María: 3 contenidos 2025 Gerencia General al 100 % (No vigente / historial).
     * - Todas las personas: 3 Vigente = 1 completado + 1 en curso + 1 sin iniciar.
     * - Ranking del mes (María): DEMO_PROGRESO_MINUTOS_ESTUDIO_LIDER (4 h 30 min: 11.ª en el ranking de la empresa).
     */
    function parseDemoDurationToMinutes(str) {
        if (!str) return 60;
        var s = String(str).trim().toLowerCase();
        var num = parseFloat(s.replace(/[^\d.]/g, '')) || 60;
        if (s.indexOf('h') >= 0) return Math.round(num * 60);
        return Math.round(num);
    }

    function minutosEstudioContenidosPlanDemo(plan, colaboradorId) {
        var cid = String(colaboradorId || '');
        var items = (plan.contenidoPorUsuario || {})[cid] || [];
        var total = 0;
        items.forEach(function (it) {
            var dur = parseDemoDurationToMinutes(it.duration);
            var pct = Number(it.progress) || 0;
            total += Math.round(dur * pct / 100);
        });
        return total;
    }

    /* Tiempo del mes fijo por persona en el demo: María queda 11.ª en el ranking de la empresa (Carlos, justo arriba). */
    var DEMO_MINUTOS_ESTUDIO_MES = {};
    DEMO_MINUTOS_ESTUDIO_MES[PLAYGROUND_DEMO_USER_ID] = DEMO_PROGRESO_MINUTOS_ESTUDIO_LIDER;
    DEMO_MINUTOS_ESTUDIO_MES.E009 = 4 * 60 + 45;

    function applyDemoLiderMinutosEstudioMes(planes) {
        Object.keys(DEMO_MINUTOS_ESTUDIO_MES).forEach(function (id) {
            applyDemoMinutosEstudioMes(planes, id, DEMO_MINUTOS_ESTUDIO_MES[id]);
        });
    }

    function applyDemoMinutosEstudioMes(planes, demoId, targetMin) {
        var otrosMin = 0;
        var completedPlan = null;
        (planes || []).forEach(function (plan) {
            if (!plan || !planTieneColaborador(plan, [demoId])) return;
            if (plan.estado !== 'Vigente') return;
            var planId = String(plan.id);
            if (planId === DEMO_PROGRESO_PLAN_COMPLETADO) {
                completedPlan = plan;
                return;
            }
            if (plan.tipo === 'contenidos') {
                otrosMin += minutosEstudioContenidosPlanDemo(plan, demoId);
            } else if (plan.tipo === 'competencias') {
                var consumo = (plan.consumoPorUsuario || {})[demoId] || { horas: 0 };
                otrosMin += Math.round((Number(consumo.horas) || 0) * 60);
            }
        });
        if (!completedPlan) return;
        var needMin = Math.max(0, targetMin - otrosMin);
        if (!completedPlan.consumoPorUsuario) completedPlan.consumoPorUsuario = {};
        var prev = completedPlan.consumoPorUsuario[demoId] || { horas: 0, items: [] };
        completedPlan.consumoPorUsuario[demoId] = {
            horas: Math.round((needMin / 60) * 100) / 100,
            items: prev.items || []
        };
    }

    function applyProgresoTresPlanesPersona(planes, colaboradorId) {
        var cid = String(colaboradorId || '');
        if (!cid) return;
        var vigentes = (planes || []).filter(function (plan) {
            return plan && plan.estado === 'Vigente' && planTieneColaborador(plan, [cid]);
        });
        var contents = vigentes.filter(function (p) { return p.tipo === 'contenidos'; });
        var comps = vigentes.filter(function (p) { return p.tipo === 'competencias'; }).slice();
        comps.sort(function (a, b) {
            if (String(a.id) === DEMO_PROGRESO_PLAN_COMPLETADO) return -1;
            if (String(b.id) === DEMO_PROGRESO_PLAN_COMPLETADO) return 1;
            if (String(a.id) === DEMO_PROGRESO_PLAN_SIN_INICIAR) return 1;
            if (String(b.id) === DEMO_PROGRESO_PLAN_SIN_INICIAR) return -1;
            return String(a.id).localeCompare(String(b.id));
        });

        contents.forEach(function (plan) {
            var midItems = (plan.contenidoPorUsuario || {})[cid];
            if (midItems && midItems.length) {
                setContenidosItemsFinalizados(midItems, 1);
                recalcProgresoAgregado(plan);
            }
        });

        comps.forEach(function (plan, idx) {
            setCompetenciaUsuarioProgress(plan, cid, idx === 0 ? 100 : 0);
            recalcProgresoAgregado(plan);
        });
    }

    function collectColaboradorIdsEnPlanes(planes) {
        var ids = {};
        (planes || []).forEach(function (plan) {
            (plan.asignaciones || []).forEach(function (a) {
                var cid = colaboradorIdFromAsignacion(a);
                if (cid) ids[cid] = true;
            });
        });
        return Object.keys(ids);
    }

    function applyPlaygroundDemoUserProgress(planes) {
        if (!planes || !planes.length) return;
        var demoId = PLAYGROUND_DEMO_USER_ID;
        planes.forEach(function (plan) {
            if (!plan || !planTieneColaborador(plan, [demoId])) return;
            var planId = String(plan.id);
            if (plan.tipo === 'contenidos' && DEMO_CONTENIDOS_PLANES_COMPLETOS.indexOf(planId) >= 0) {
                var pastItems = (plan.contenidoPorUsuario || {})[demoId];
                if (pastItems && pastItems.length) {
                    setItemsProgress(pastItems, 100);
                    recalcProgresoAgregado(plan);
                }
            }
        });
        collectColaboradorIdsEnPlanes(planes).forEach(function (cid) {
            applyProgresoTresPlanesPersona(planes, cid);
        });
        applyDemoLiderMinutosEstudioMes(planes);
    }

    function generateContenidosPlans() {
        var planes = [];
        var catalogo = getContenidosCatalogo();
        AREAS_LIDERES.forEach(function (areaDef) {
            TRIMESTRES.forEach(function (q) {
                var planId = 'pf-c-' + areaDef.slug + '-' + q.key.toLowerCase();
                var reportes = getReportesDirectos(areaDef.leaderId);
                var estado = getEstadoPlan({ fechaInicioIso: q.start, fechaFinIso: q.end }, PLAYGROUND_TODAY);
                var contenidoPorUsuario = {};
                var asignaciones = [];
                reportes.forEach(function (col) {
                    var picked = pickContenidosParaPersona(planId, col.id, q.key, catalogo, 3);
                    var items = picked.map(function (c, itemIdx) {
                        var pct = genPctContenido(planId, col.id, c.id, estado, itemIdx, picked.length);
                        return buildContenidoItem(c, pct);
                    });
                    contenidoPorUsuario[String(col.id)] = items;
                    asignaciones.push(buildAsignacionContenidos(planId, col, items));
                });
                var planDraft = {
                    id: planId,
                    tipo: 'contenidos',
                    nombre: areaDef.area + ' capacitación ' + q.label,
                    fechaInicioIso: q.start,
                    fechaFinIso: q.end,
                    fechaInicio: isoToDisplay(q.start),
                    fechaFin: isoToDisplay(q.end),
                    estado: estado,
                    area: areaDef.area,
                    trimestre: q.key,
                    creadorId: areaDef.leaderId,
                    asignaciones: asignaciones,
                    contenidoPorUsuario: contenidoPorUsuario,
                    progresoAgregado: 0
                };
                planDraft.progresoAgregado = progresoUsuariosPlanCompleto(planDraft);
                planes.push(planDraft);
            });
        });
        return planes;
    }

    function getTodosColaboradoresEmpresa() {
        return getColaboradores().filter(function (c) { return !c.esGerenteGeneral; });
    }

    function generateCompetenciasPlans() {
        var planes = [];
        COMPETENCIAS_PLAYGROUND.forEach(function (comp, compIdx) {
            ANIOS_COMPETENCIAS.forEach(function (anio, anioIdx) {
                /* Solo 2 competencias en 2026 → 3 vigentes por persona (contenidos Q vigente + 2 comps). */
                if (anio === 2026 && comp.id === 'comp-004') return;
                var planId = 'pf-k-' + comp.id.replace('comp-', '') + '-' + anio;
                var start = anio + '-01-01';
                var end = anio + '-12-31';
                var estado = getEstadoPlan({ fechaInicioIso: start, fechaFinIso: end }, PLAYGROUND_TODAY);
                var creadorId = COMP_CREADORES[(compIdx + anioIdx) % COMP_CREADORES.length];
                var empleados = getTodosColaboradoresEmpresa();
                var competenciaPorUsuario = {};
                var consumoPorUsuario = {};
                var asignaciones = [];
                empleados.forEach(function (col) {
                    var consumo = genConsumoCompetencia(planId, col.id, comp.id, start, end, HORAS_META_COMPETENCIAS, estado);
                    var pct = progresoCompetenciaPersona(consumo, HORAS_META_COMPETENCIAS);
                    if (!planSinProgresoReal(estado)) {
                        var hDone = hashStr(planId + '|' + col.id + '|comp-done');
                        if (hDone % 5 === 0) {
                            pct = 100;
                        } else {
                            pct = Math.min(99, Math.max(10, pct));
                        }
                    }
                    consumoPorUsuario[String(col.id)] = consumo;
                    var compItem = {
                        id: comp.id,
                        title: comp.nombre,
                        nombre: comp.nombre,
                        habilidades: [],
                        progress: pct,
                        status: progressStatus(pct)
                    };
                    competenciaPorUsuario[String(col.id)] = [compItem];
                    asignaciones.push({
                        id: 'fila-usuario-' + col.id,
                        colaboradorId: String(col.id),
                        nombreUsuario: (col.nombre || '').trim(),
                        avatar: col.avatar || null,
                        contenidos: [{ id: comp.id, title: comp.nombre, nombre: comp.nombre, habilidades: [] }],
                        contenidosCount: 1
                    });
                });
                var planDraft = {
                    id: planId,
                    tipo: 'competencias',
                    nombre: 'Empresa ' + comp.nombre + ' ' + anio,
                    fechaInicioIso: start,
                    fechaFinIso: end,
                    fechaInicio: isoToDisplay(start),
                    fechaFin: isoToDisplay(end),
                    estado: estado,
                    anio: anio,
                    competenciaId: comp.id,
                    horasEstudioMeta: HORAS_META_COMPETENCIAS,
                    horasEstudioPorCompetencia: HORAS_META_COMPETENCIAS,
                    creadorId: creadorId,
                    asignaciones: asignaciones,
                    competenciaPorUsuario: competenciaPorUsuario,
                    consumoPorUsuario: consumoPorUsuario,
                    progresoAgregado: 0
                };
                planDraft.progresoAgregado = progresoUsuariosPlanCompleto(planDraft);
                planes.push(planDraft);
            });
        });
        return planes;
    }

    /**
     * Plan demo HU-LMS-015: no es “toda la empresa × 1 competencia”.
     * Varias competencias + subset de personas + asignación desigual → Agregar usuario tiene candidatos.
     */
    function generateDemoMasivoCompetenciasPlan() {
        var planId = DEMO_PLAN_COMPETENCIAS_MASIVO;
        var start = '2026-01-01';
        var end = '2026-12-31';
        var estado = getEstadoPlan({ fechaInicioIso: start, fechaFinIso: end }, PLAYGROUND_TODAY);
        var comps = [
            { id: 'comp-024', nombre: 'Liderazgo' },
            { id: 'comp-020', nombre: 'Inglés' },
            { id: 'comp-004', nombre: 'Comunicación' },
            { id: 'comp-027', nombre: 'Negociación' }
        ];
        var empleados = []
            .concat(getReportesDirectos('E002'))
            .concat(getReportesDirectos('E008'))
            .concat(getReportesDirectos('E052'));
        var seen = {};
        empleados = empleados.filter(function (c) {
            var id = String(c.id);
            if (seen[id]) return false;
            seen[id] = true;
            return true;
        });
        if (empleados.length < 4) {
            empleados = getTodosColaboradoresEmpresa().slice(0, 12);
        }

        var competenciaPorUsuario = {};
        var consumoPorUsuario = {};
        var asignaciones = [];

        empleados.forEach(function (col, idx) {
            var cid = String(col.id);
            var pattern = idx % 4;
            var picked = [];
            if (pattern === 0) picked = [comps[0], comps[1]];
            else if (pattern === 1) picked = [comps[0], comps[2]];
            else if (pattern === 2) picked = [comps[1], comps[2], comps[3]];
            else picked = [comps[0]];

            competenciaPorUsuario[cid] = picked.map(function (comp, cIdx) {
                var pct = planSinProgresoReal(estado)
                    ? 0
                    : Math.min(95, 15 + ((hashStr(planId + '|' + cid + '|' + comp.id) % 8) * 10) + cIdx * 5);
                return {
                    id: comp.id,
                    title: comp.nombre,
                    nombre: comp.nombre,
                    habilidades: [],
                    progress: pct,
                    status: progressStatus(pct)
                };
            });
            consumoPorUsuario[cid] = genConsumoCompetencia(
                planId,
                cid,
                picked[0].id,
                start,
                end,
                HORAS_META_COMPETENCIAS,
                estado
            );
            asignaciones.push({
                id: 'fila-usuario-' + cid,
                colaboradorId: cid,
                nombreUsuario: (col.nombre || '').trim(),
                avatar: col.avatar || null,
                contenidos: picked.map(function (comp) {
                    return { id: comp.id, title: comp.nombre, nombre: comp.nombre, habilidades: [] };
                }),
                contenidosCount: picked.length
            });
        });

        var planDraft = {
            id: planId,
            tipo: 'competencias',
            nombre: 'Demo competencias masivas 2026',
            fechaInicioIso: start,
            fechaFinIso: end,
            fechaInicio: isoToDisplay(start),
            fechaFin: isoToDisplay(end),
            estado: estado,
            anio: 2026,
            horasEstudioMeta: HORAS_META_COMPETENCIAS,
            horasEstudioPorCompetencia: HORAS_META_COMPETENCIAS,
            creadorId: 'E052',
            asignaciones: asignaciones,
            competenciaPorUsuario: competenciaPorUsuario,
            consumoPorUsuario: consumoPorUsuario,
            progresoAgregado: 0,
            demoMasivo: true
        };
        planDraft.progresoAgregado = progresoUsuariosPlanCompleto(planDraft);
        return planDraft;
    }

    function buildSeedPlanes() {
        var planes = [generateDemoMasivoCompetenciasPlan()]
            .concat(generateContenidosPlans())
            .concat(generateCompetenciasPlans());
        applyPlaygroundDemoUserProgress(planes);
        return planes;
    }

    /** Planes generados sin colaboradores cargados quedan sin asignaciones ni progreso. */
    function seedLooksCorrupt(planes) {
        if (!planes || !planes.length) return true;
        for (var i = 0; i < planes.length; i++) {
            var p = planes[i];
            if (!p || !p.tipo) continue;
            if (!p.asignaciones || !p.asignaciones.length) return true;
        }
        return false;
    }

    function loadFromStorage() {
        try {
            var raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.planes) || parsed.schemaVersion !== STORAGE_SCHEMA_VERSION) {
                sessionStorage.removeItem(STORAGE_KEY);
                return null;
            }
            if (seedLooksCorrupt(parsed.planes)) {
                sessionStorage.removeItem(STORAGE_KEY);
                return null;
            }
            return parsed.planes;
        } catch {
            try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
            return null;
        }
    }

    function persistPlanesDb() {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                schemaVersion: STORAGE_SCHEMA_VERSION,
                planes: db.planes
            }));
        } catch { /* noop */ }
    }

    function refreshEstadosPlanes() {
        db.planes.forEach(function (p) {
            if (p.estado && String(p.estado).indexOf('Procesando') === 0) return;
            p.estado = getEstadoPlan(p, PLAYGROUND_TODAY);
        });
    }

    var db = {
        version: '1.0',
        playgroundToday: PLAYGROUND_TODAY,
        planes: loadFromStorage() || buildSeedPlanes()
    };

    refreshEstadosPlanes();

    function reseedIfCorrupt() {
        if (!getColaboradores().length) return false;
        if (!seedLooksCorrupt(db.planes)) return false;
        db.planes = buildSeedPlanes();
        refreshEstadosPlanes();
        persistPlanesDb();
        return true;
    }

    reseedIfCorrupt();

    function findPlanIndex(id) {
        var sid = String(id || '');
        for (var i = 0; i < db.planes.length; i++) {
            if (String(db.planes[i].id) === sid) return i;
        }
        return -1;
    }

    function clonePlan(plan) {
        if (!plan) return null;
        return JSON.parse(JSON.stringify(plan));
    }

    function hydratePlan(plan) {
        if (!plan) return null;
        var p = clonePlan(plan);
        p.estado = getEstadoPlan(p, PLAYGROUND_TODAY);
        p.fechaInicio = p.fechaInicio || isoToDisplay(p.fechaInicioIso);
        p.fechaFin = p.fechaFin || isoToDisplay(p.fechaFinIso);
        if (p.tipo === 'competencias' && p.horasEstudioMeta != null) {
            p.horasEstudioPorCompetencia = p.horasEstudioMeta;
        }
        return p;
    }

    function getProgresoColaboradorEnPlan(planOrId, colaboradorId) {
        var plan = planOrId;
        if (planOrId != null && typeof planOrId !== 'object') {
            plan = getPlanById(planOrId);
        }
        plan = hydratePlan(plan);
        if (!plan || planSinProgresoReal(plan.estado)) return 0;
        var cid = String(colaboradorId || '');
        if (plan.tipo === 'contenidos') {
            return progresoFinalizacionItems((plan.contenidoPorUsuario || {})[cid] || []);
        }
        if (plan.tipo === 'competencias') {
            return progresoFinalizacionItems((plan.competenciaPorUsuario || {})[cid] || []);
        }
        return 0;
    }

    function getProgresoAgregadoPlan(planOrId) {
        var plan = planOrId;
        if (planOrId != null && typeof planOrId !== 'object') {
            plan = getPlanById(planOrId);
        }
        plan = hydratePlan(plan);
        if (!plan || planSinProgresoReal(plan.estado)) return 0;
        if (plan.progresoAgregado != null && !plan._progresoStale) {
            return plan.progresoAgregado;
        }
        return progresoUsuariosPlanCompleto(plan);
    }

    function getCreadorFromPlan(planOrId) {
        var plan = planOrId;
        if (planOrId != null && typeof planOrId !== 'object') {
            plan = getPlanById(planOrId);
        }
        plan = hydratePlan(plan);
        if (!plan) return { creadorId: '', creador: '', creador_avatar: null };
        var creadorId = String(plan.creadorId || '');
        var col = getColaboradorById(creadorId);
        return {
            creadorId: creadorId,
            creador: col ? String(col.nombre || '').trim() : '',
            creador_avatar: col && col.avatar ? col.avatar : null
        };
    }

    function getAsignadosFromPlan(planOrId) {
        var plan = planOrId;
        if (planOrId != null && typeof planOrId !== 'object') {
            plan = getPlanById(planOrId);
        }
        plan = hydratePlan(plan);
        if (!plan) return [];
        return (plan.asignaciones || []).map(function (a) {
            return {
                colaboradorId: String(a.colaboradorId || ''),
                nombre: (a.nombreUsuario || a.nombre || '').trim(),
                avatar: a.avatar || null
            };
        }).filter(function (p) { return p.nombre; });
    }

    function getPlanById(planId) {
        var idx = findPlanIndex(planId);
        if (idx < 0) return null;
        return hydratePlan(db.planes[idx]);
    }

    function estadoSortRank(estado) {
        if (estado === 'Vigente') return 0;
        if (estado === 'No vigente') return 1;
        if (String(estado || '').indexOf('Procesando') === 0) return 2;
        if (estado === 'Planeado') return 3;
        return 4;
    }

    /** Planes de formación asignados a un colaborador (vista learner / zona de estudio). */
    function getPlanesParaColaborador(colaboradorId, opts) {
        opts = opts || {};
        var cid = String(colaboradorId || '');
        var tipo = opts.tipo;
        var estados = opts.estados;
        return db.planes.map(hydratePlan).filter(function (p) {
            if (tipo && p.tipo !== tipo) return false;
            if (!planTieneColaborador(p, [cid])) return false;
            if (estados && estados.length && estados.indexOf(p.estado) < 0) return false;
            return true;
        }).sort(function (a, b) {
            var ra = estadoSortRank(a.estado);
            var rb = estadoSortRank(b.estado);
            if (ra !== rb) return ra - rb;
            var endA = parseIsoDate(a.fechaFinIso) || new Date(0);
            var endB = parseIsoDate(b.fechaFinIso) || new Date(0);
            /* Más próximo a vencer primero; más lejano al final. */
            return endA - endB;
        });
    }

    function getPlanesByTipo(tipo) {
        var t = tipo === 'competencias' ? 'competencias' : 'contenidos';
        return db.planes.filter(function (p) { return p.tipo === t; }).map(hydratePlan);
    }

    function getSubordinadosIds(leaderId) {
        return getReportesDirectos(leaderId).map(function (c) { return String(c.id); });
    }

    function colaboradorIdFromAsignacion(a) {
        if (!a) return '';
        if (a.colaboradorId != null && String(a.colaboradorId).trim() !== '') return String(a.colaboradorId);
        var fid = String(a.id || '');
        if (fid.indexOf('fila-usuario-') === 0) return fid.slice('fila-usuario-'.length);
        return fid;
    }

    function planTieneColaborador(plan, colaboradorIds) {
        var ids = {};
        (colaboradorIds || []).forEach(function (id) { ids[String(id)] = true; });
        return (plan.asignaciones || []).some(function (a) {
            return ids[colaboradorIdFromAsignacion(a)];
        });
    }

    function getPlanesVisiblesParaLider(leaderId) {
        var subs = getSubordinadosIds(leaderId);
        if (!subs.length) return [];
        return db.planes.filter(function (p) {
            return planTieneColaborador(p, subs);
        }).map(hydratePlan);
    }

    function getPlanesVisiblesCreator() {
        return db.planes.map(hydratePlan);
    }

    function getPlanesListData(tipo, opts) {
        opts = opts || {};
        var list;
        if (opts.leaderId) {
            list = getPlanesVisiblesParaLider(opts.leaderId);
            if (tipo) {
                var t = tipo === 'competencias' ? 'competencias' : 'contenidos';
                list = list.filter(function (p) { return p.tipo === t; });
            }
        } else if (tipo) {
            list = getPlanesByTipo(tipo);
        } else {
            list = getPlanesVisiblesCreator();
        }
        return list.map(function (p) {
            var creadorInfo = getCreadorFromPlan(p);
            return {
                id: p.id,
                nombre: p.nombre,
                fechaInicio: p.fechaInicio,
                fechaFin: p.fechaFin,
                estado: p.estado,
                progreso: getProgresoAgregadoPlan(p),
                progresoAgregado: getProgresoAgregadoPlan(p),
                tipo: p.tipo,
                asignados: getAsignadosFromPlan(p),
                creadorId: creadorInfo.creadorId,
                creador: creadorInfo.creador,
                creador_avatar: creadorInfo.creador_avatar
            };
        });
    }

    function toEditarView(plan) {
        plan = hydratePlan(plan);
        if (!plan) return null;
        var asignaciones = (plan.asignaciones || []).slice();
        return {
            id: plan.id,
            nombre: plan.nombre,
            fechaInicio: plan.fechaInicio,
            fechaFin: plan.fechaFin,
            estado: plan.estado,
            tipo: plan.tipo,
            horasEstudioPorCompetencia: plan.horasEstudioPorCompetencia,
            getAsignaciones: function () { return asignaciones.slice(); },
            asignaciones: asignaciones,
            contenidoPorUsuario: plan.contenidoPorUsuario || {},
            competenciaPorUsuario: plan.competenciaPorUsuario || {}
        };
    }

    function getDetalleContenidoPorUsuario(plan) {
        plan = hydratePlan(plan);
        if (!plan) return {};
        var out = {};
        var map = plan.contenidoPorUsuario || {};
        var sinProg = planSinProgresoReal(plan.estado);
        var enrich = (typeof global !== 'undefined' && global.CATALOGO_PROVEEDORES &&
            typeof global.CATALOGO_PROVEEDORES.enrichPlanContenidoItemForCard === 'function')
            ? global.CATALOGO_PROVEEDORES.enrichPlanContenidoItemForCard
            : null;
        Object.keys(map).forEach(function (cid) {
            out[cid] = (map[cid] || []).map(function (c) {
                var copy = {};
                Object.keys(c).forEach(function (k) { copy[k] = c[k]; });
                if (sinProg) {
                    copy.progress = 0;
                    copy.status = 'default';
                }
                if (enrich) copy = enrich(copy);
                return copy;
            });
        });
        return out;
    }

    function nextPlanId(tipo) {
        var prefix = tipo === 'competencias' ? 'pf-k-user-' : 'pf-c-user-';
        var max = 0;
        db.planes.forEach(function (p) {
            if (String(p.id || '').indexOf(prefix) === 0) {
                var n = parseInt(String(p.id).slice(prefix.length), 10);
                if (!isNaN(n)) max = Math.max(max, n);
            }
        });
        return prefix + (max + 1);
    }

    function addPlan(plan) {
        if (!plan || !plan.nombre) return null;
        var nuevo = clonePlan(plan);
        nuevo.id = nuevo.id || nextPlanId(nuevo.tipo);
        nuevo.estado = nuevo.estado || 'Planeado';
        db.planes.push(nuevo);
        persistPlanesDb();
        return hydratePlan(nuevo);
    }

    function updatePlan(planId, patch) {
        var idx = findPlanIndex(planId);
        if (idx < 0 || !patch) return null;
        Object.keys(patch).forEach(function (k) {
            if (patch[k] !== undefined) db.planes[idx][k] = patch[k];
        });
        db.planes[idx]._progresoStale = true;
        persistPlanesDb();
        return hydratePlan(db.planes[idx]);
    }

    function deletePlans(ids) {
        if (!ids || !ids.length) return 0;
        var idSet = {};
        ids.forEach(function (id) { idSet[String(id)] = true; });
        var before = db.planes.length;
        db.planes = db.planes.filter(function (p) { return !idSet[String(p.id)]; });
        persistPlanesDb();
        return before - db.planes.length;
    }

    function resetToSeed() {
        db.planes = buildSeedPlanes();
        refreshEstadosPlanes();
        persistPlanesDb();
    }

    global.BD_PLANES_FORMACION = {
        PLAYGROUND_TODAY: PLAYGROUND_TODAY,
        DEMO_PLAN_COMPETENCIAS_MASIVO: DEMO_PLAN_COMPETENCIAS_MASIVO,
        HORAS_META_COMPETENCIAS: HORAS_META_COMPETENCIAS,
        get planes() { return db.planes; },
        getPlanById: getPlanById,
        getPlanesByTipo: getPlanesByTipo,
        getEstadoPlan: getEstadoPlan,
        getProgresoColaboradorEnPlan: getProgresoColaboradorEnPlan,
        getProgresoAgregadoPlan: getProgresoAgregadoPlan,
        progresoFinalizacionItems: progresoFinalizacionItems,
        getAsignadosFromPlan: getAsignadosFromPlan,
        getPlanesVisiblesParaLider: getPlanesVisiblesParaLider,
        getPlanesParaColaborador: getPlanesParaColaborador,
        getPlanesVisiblesCreator: getPlanesVisiblesCreator,
        getPlanesListData: getPlanesListData,
        toEditarView: toEditarView,
        getDetalleContenidoPorUsuario: getDetalleContenidoPorUsuario,
        hydratePlan: hydratePlan,
        addPlan: addPlan,
        updatePlan: updatePlan,
        deletePlans: deletePlans,
        persistPlanesDb: persistPlanesDb,
        resetToSeed: resetToSeed,
        reseedIfCorrupt: reseedIfCorrupt,
        isoToDisplay: isoToDisplay
    };
})(__planesGlobal);
export const BD_PLANES_FORMACION = __planesGlobal.BD_PLANES_FORMACION;
