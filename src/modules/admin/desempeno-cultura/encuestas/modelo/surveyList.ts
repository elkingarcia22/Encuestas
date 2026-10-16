import type { SurveyListItem } from "./types";
import { formatSurveyDate } from "./surveyListDates";
import { createPublishedSurveyDraft } from "./surveyPreviewMocks";
import { NOM035_ACONTECIMIENTOS_SURVEY_ID, NOM035_RIESGO_SURVEY_ID } from "./nom035";

/** Hoy más `offset` días, en el formato de fecha de la lista. */
const daysFromToday = (offset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return formatSurveyDate(date);
};

/** A live survey whose author turned the demographics off: its results can only be read as a whole. */
const withoutDemographics = (item: SurveyListItem): SurveyListItem => {
  const draft = createPublishedSurveyDraft(item);
  return { ...item, draft: { ...draft, status: "live", demographics: { ...draft.demographics, enabled: false } } };
};

export const SURVEYS_LIST: SurveyListItem[] = [
  // Mediciones abiertas. The home alerts — por cerrar, participación baja,
  // riesgo por tendencia — only mean something if the list actually holds open
  // measurements in those situations, so these four are dated relative to
  // today rather than fixed: whenever the demo runs, one closes in three days
  // on a pace that will not reach the target, one closes in six on a middling
  // pace, and two are comfortably on track.
  { id: "open-nps-q3-2026", name: "NPS Clientes Premium Q3 2026", type: "NPS", status: "En progreso", statusVariant: "info", startDate: daysFromToday(-23), endDate: daysFromToday(3), participants: "214", progress: 23 },
  { id: "open-clima-q3-2026", name: "Clima Organizacional - Q3 2026", type: "Clima", status: "En progreso", statusVariant: "info", startDate: daysFromToday(-21), endDate: daysFromToday(6), participants: "232", progress: 41 },
  { id: "open-pulso-ago-2026", name: "Pulso de Bienestar - Ago 2026", type: "Clima", status: "En progreso", statusVariant: "info", startDate: daysFromToday(-30), endDate: daysFromToday(10), participants: "408", progress: 78 },
  { id: "open-cultura-ola2-2026", name: "Cultura y Valores - 2026 (2ª ola)", type: "Cultura", status: "En progreso", statusVariant: "info", startDate: daysFromToday(-15), endDate: daysFromToday(30), participants: "331", progress: 62 },

  withoutDemographics({ id: "open-bienvenida-sep-2026", name: "Pulso de Onboarding - Sep 2026", type: "Clima", status: "En progreso", statusVariant: "info", startDate: daysFromToday(-9), endDate: daysFromToday(21), participants: "64", progress: 72 }),

  // Programadas: ya se publicaron pero aún no abren, así que no tienen respuestas. Van fechadas
  // desde hoy por la misma razón que las abiertas: el home las cuenta como «por iniciar».
  { id: "scheduled-enps-q4-2026", name: "eNPS Colaboradores - Q4 2026", type: "NPS", status: "Por iniciar", statusVariant: "warning", startDate: daysFromToday(5), endDate: daysFromToday(20), participants: "540", progress: 0 },
  { id: "scheduled-pulso-oct-2026", name: "Pulso de Bienestar - Oct 2026", type: "Clima", status: "Por iniciar", statusVariant: "warning", startDate: daysFromToday(12), endDate: daysFromToday(26), participants: "86", progress: 0 },
  // Con participantes: sin ellos una encuesta no pasa a «Por iniciar» (Elkin, 13-oct); antes tenía 0.
  { id: "scheduled-cultura-2027", name: "Cultura y Valores - 2027 (1ª ola)", type: "Cultura", status: "Por iniciar", statusVariant: "warning", startDate: daysFromToday(9), endDate: daysFromToday(40), participants: "530", progress: 0 },

  // Casos que el panel de riesgos debe poder mostrar: una medición de sede que pasó su cierre sin que nadie la
  // finalizara y un borrador que debía abrir en dos días y aún no se publica.
  { id: "open-clima-monterrey-2026", name: "Clima Organizacional - Sede Monterrey", type: "Clima", status: "En progreso", statusVariant: "info", startDate: daysFromToday(-35), endDate: daysFromToday(-2), participants: "120", progress: 86 },
  { id: "draft-pulso-nov-2026", name: "Pulso de Bienestar - Nov 2026", type: "Clima", status: "Borrador", statusVariant: "neutral", startDate: daysFromToday(2), endDate: daysFromToday(16), participants: "408", progress: 0 },

  // Clima (Added 2025/2026)
  { id: "c2026-1", name: "Clima Organizacional - Q1 2026", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "15 ene 2026", endDate: "30 ene 2026", participants: "520", progress: 100 },
  { id: "c2025-4", name: "Clima Organizacional - Q4 2025", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "10 oct 2025", endDate: "25 oct 2025", participants: "505", progress: 100 },
  { id: "c2025-3", name: "Clima Organizacional - Q3 2025", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "12 jul 2025", endDate: "28 jul 2025", participants: "495", progress: 100 },
  { id: "c2025-2", name: "Clima Organizacional - Q2 2025", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "05 abr 2025", endDate: "20 abr 2025", participants: "480", progress: 100 },
  { id: "c2025-1", name: "Clima Organizacional - Q1 2025", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "15 ene 2025", endDate: "30 ene 2025", participants: "470", progress: 100 },
  
  // Clima (2024 items)
  { id: "c2", name: "Clima Organizacional - Q4 2024", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "10 oct 2024", endDate: "25 oct 2024", participants: "432", progress: 100 },
  { id: "c3", name: "Clima Organizacional - Q3 2024", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "12 jul 2024", endDate: "28 jul 2024", participants: "415", progress: 100 },
  { id: "c4", name: "Clima Organizacional - Q2 2024", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "05 abr 2024", endDate: "20 abr 2024", participants: "390", progress: 100 },
  { id: "c5", name: "Clima Organizacional - Q1 2024", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "15 ene 2024", endDate: "30 ene 2024", participants: "385", progress: 100 },
  
  // Cultura (Added 2025/2026)
  { id: "cu2026", name: "Cultura y Valores - 2026", type: "Cultura", status: "Finalizado", statusVariant: "positive", startDate: "01 mar 2026", endDate: "15 mar 2026", participants: "550", progress: 100 },
  { id: "cu2025", name: "Cultura y Valores - 2025", type: "Cultura", status: "Finalizado", statusVariant: "positive", startDate: "01 mar 2025", endDate: "15 mar 2025", participants: "530", progress: 100 },
  { id: "cu1", name: "Cultura y Valores - 2024", type: "Cultura", status: "Finalizado", statusVariant: "positive", startDate: "01 mar 2024", endDate: "15 mar 2024", participants: "510", progress: 100 },
  { id: "cu4", name: "Alineación de Propósito - 2024", type: "Cultura", status: "Finalizado", statusVariant: "positive", startDate: "10 nov 2024", endDate: "25 nov 2024", participants: "445", progress: 100 },
  
  // NOM 035. Las dos guías de referencia de la norma mexicana, medidas juntas
  // sobre la misma población: la III levanta los factores de riesgo
  // psicosocial y la I detecta quién vivió un acontecimiento traumático
  // severo. Se quedan en 93% a propósito — la norma exige el 100%, y ese hueco
  // es justamente lo que sus resultados tienen que hacer visible.
  { id: NOM035_RIESGO_SURVEY_ID, name: "NOM 035 - Riesgo psicosocial", type: "NOM 035", status: "Finalizado", statusVariant: "positive", startDate: "15 abr 2026", endDate: "15 may 2026", participants: "150", progress: 93 },
  { id: NOM035_ACONTECIMIENTOS_SURVEY_ID, name: "NOM 035 - Acontecimientos traumáticos", type: "NOM 035", status: "Finalizado", statusVariant: "positive", startDate: "15 abr 2026", endDate: "15 may 2026", participants: "150", progress: 93 },

  // NPS (Added 2025/2026)
  { id: "n2026-1", name: "NPS Clientes Premium Q1 2026", type: "NPS", status: "Finalizado", statusVariant: "positive", startDate: "01 feb 2026", endDate: "15 feb 2026", participants: "950", progress: 100 },
  { id: "n2025-4", name: "NPS Clientes Premium Q4 2025", type: "NPS", status: "Finalizado", statusVariant: "positive", startDate: "01 nov 2025", endDate: "15 nov 2025", participants: "920", progress: 100 },
  { id: "n2", name: "NPS Clientes Premium Q4 2024", type: "NPS", status: "Finalizado", statusVariant: "positive", startDate: "01 nov 2024", endDate: "15 nov 2024", participants: "820", progress: 100 },
  { id: "n3", name: "NPS Clientes Premium Q3 2024", type: "NPS", status: "Finalizado", statusVariant: "positive", startDate: "01 ago 2024", endDate: "15 ago 2024", participants: "780", progress: 100 },
];

