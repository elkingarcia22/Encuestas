import { parseSurveyDate, startOfToday } from "./surveyListDates";
import type { SurveyDraft } from "./surveyBuilderTypes";
import type { SurveyListItem } from "./types";

// Un borrador cuya fecha de inicio ya pasó (CRE-120, Elkin 14-oct): nunca llegó a «Por iniciar», así que al llegar su
// fecha no se envió ni abrió y sigue en borrador. No cuenta como en curso en ningún lado: la lista lo deja en
// «Borrador» con la fecha en tono de aviso, y el constructor no lo programa hasta que tenga fechas desde hoy.

export const INICIO_VENCIDO_TOOLTIP = "La fecha de inicio ya pasó y la encuesta sigue en borrador: nunca se envió.";

/** En la lista: la fila está en «Borrador» y su fecha de inicio es anterior a hoy. */
export function borradorConInicioVencido(encuesta: SurveyListItem, hoy: Date = startOfToday()): boolean {
  if (encuesta.status !== "Borrador") return false;
  const inicio = parseSurveyDate(encuesta.startDate);
  return inicio !== null && inicio < hoy;
}

const hoyIso = (): string => {
  const hoy = startOfToday();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
};

/** En el constructor: el borrador (sin publicar) tiene un inicio anterior a hoy. Las fechas del borrador son `aaaa-mm-dd`. */
export function inicioVencidoEnBorrador(draft: Pick<SurveyDraft, "status" | "startDate">): boolean {
  return draft.status === "draft" && draft.startDate !== "" && draft.startDate < hoyIso();
}
