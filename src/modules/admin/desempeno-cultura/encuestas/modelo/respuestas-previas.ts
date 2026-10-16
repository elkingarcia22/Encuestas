import { COLLABORATORS, type Collaborator } from "./collaborators";
import { effectiveIndividualIds, resolveImportedRows } from "./participants";
import type { ParticipantsSelection } from "./surveyBuilderTypes";

// Editar una encuesta que ya corre: quitar a alguien que ya respondió obliga a decidir qué pasa con lo que
// contestó. El prototipo no guarda respuestas por persona, así que «quién respondió» se simula de forma estable:
// una de cada tres personas del directorio, solo en las encuestas en curso o finalizadas.

const ESTADOS_CON_RESPUESTAS: ReadonlySet<string> = new Set(["En progreso", "Finalizado"]);

/** Ids de quienes ya respondieron, o null si la encuesta aún no recibe respuestas (nueva, borrador o por iniciar). */
export function respondieronEn(estado: string | undefined): ReadonlySet<string> | null {
  if (!estado || !ESTADOS_CON_RESPUESTAS.has(estado)) return null;
  return new Set(COLLABORATORS.filter((_, indice) => indice % 3 === 0).map((persona) => persona.id));
}

/** Todas las personas del directorio que hoy reciben la encuesta, sumando cada forma de elegir. */
export function audienciaIds(participants: ParticipantsSelection): ReadonlySet<string> {
  if (participants.mode === "company") return new Set(COLLABORATORS.map((persona) => persona.id));
  const ids = new Set(effectiveIndividualIds(participants));
  resolveImportedRows(participants.importedUsers, COLLABORATORS).forEach((row) => {
    if (row.person) ids.add(row.person.id);
  });
  return ids;
}

/** Quienes ya respondieron y dejarían de estar en la encuesta con este cambio. */
export function quitadosConRespuestas(
  antes: ParticipantsSelection,
  despues: ParticipantsSelection,
  respondieron: ReadonlySet<string>
): readonly Collaborator[] {
  const siguen = audienciaIds(despues);
  const estaban = audienciaIds(antes);
  return COLLABORATORS.filter((persona) => respondieron.has(persona.id) && estaban.has(persona.id) && !siguen.has(persona.id));
}
