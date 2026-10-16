import { unitFromSeed } from "../surveyResults";
import type { Actionable, ActivationConfig, DeliverableItem } from "./actionableCatalog";
import { LAUNCH_BY_ID } from "./actionableCatalog";

/**
 * Cómo va un accionable ya encendido.
 *
 * El prototipo no ejecuta nada, así que el avance se deriva del id —estable
 * entre renders, como el resto de los números del reporte— en vez de moverse
 * cada vez que se abre el panel. Un tablero cuyas cifras cambian al mirarlas
 * es ilegible, y aquí el punto es justamente poder decir "cuatro de diez van".
 */

export type ProgressStatus = "done" | "doing" | "todo";

export const PROGRESS_STATUS_LABEL: Readonly<Record<ProgressStatus, string>> = {
  done: "Completó",
  doing: "En progreso",
  todo: "Sin empezar",
};

export interface ProgressRow {
  id: string;
  label: string;
  meta: string;
  status: ProgressStatus;
}

export interface ActionableProgress {
  /** La línea que resume todo: "4 de 10 líderes completaron el plan". */
  headline: string;
  /** 0–100, lo que dibuja la barra. */
  percent: number;
  done: number;
  doing: number;
  todo: number;
  total: number;
  /** Cuándo salió, en las palabras del selector de lanzamiento. */
  launchedLine: string;
  /** Persona por persona, o ítem por ítem cuando no hay nombres. */
  rows: readonly ProgressRow[];
  /** Cómo se llama lo que hay en `rows`. */
  rowsNoun: string;
}

/** Reparte un estado estable por fila, con la mezcla que pide el avance global. */
function statusFor(seed: string, doneShare: number, doingShare: number): ProgressStatus {
  const unit = unitFromSeed(seed);
  if (unit < doneShare) return "done";
  if (unit < doneShare + doingShare) return "doing";
  return "todo";
}

const asRow = (item: DeliverableItem, status: ProgressStatus): ProgressRow => ({
  id: item.id,
  label: item.label,
  meta: item.meta ?? "",
  status,
});

export function buildProgress(actionable: Actionable, activation: ActivationConfig): ActionableProgress {
  const { audience } = actionable;
  const seed = `${actionable.id}:progress`;

  // Una acción que acaba de salir no puede ir por la mitad: el reparto se
  // mueve con el momento elegido, que es lo que el lector acaba de decidir.
  const maturity = activation.launch === "now" ? 0.55 : activation.launch === "in7" ? 0.35 : 0.15;
  const doneShare = 0.15 + unitFromSeed(`${seed}:done`) * maturity;
  const doingShare = 0.12 + unitFromSeed(`${seed}:doing`) * 0.25;

  // Sin población nominal el avance se cuenta sobre lo que queda montado —los
  // cursos del plan, los resultados clave del objetivo—, que es lo único
  // contable que tiene ese accionable.
  const usesMembers = audience.members.length > 0;
  const source = usesMembers
    ? audience.members.map((member) => ({ id: member.id, label: member.name, meta: member.meta }))
    : actionable.deliverable.items.map((item) => ({ id: item.id, label: item.label, meta: item.meta ?? "" }));

  const rows: readonly ProgressRow[] = source.map((item) =>
    asRow(item, statusFor(`${seed}:${item.id}`, doneShare, doingShare))
  );

  // El total es la población real, aunque la lista muestre solo una parte.
  const total = usesMembers && audience.people > 0 ? audience.people : rows.length;
  const scale = rows.length === 0 ? 0 : total / rows.length;
  const done = Math.round(rows.filter((row) => row.status === "done").length * scale);
  const doing = Math.round(rows.filter((row) => row.status === "doing").length * scale);
  const todo = Math.max(0, total - done - doing);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const noun = usesMembers ? audience.memberNoun : "de lo que queda montado";
  const headline = usesMembers
    ? `${done} de ${total} ${noun} ${actionable.progressLabel}`
    : `${done} de ${total} ${actionable.deliverable.title.replace(/^\d+\s*/, "")} listos`;

  return {
    headline,
    percent,
    done,
    doing,
    todo,
    total,
    launchedLine: LAUNCH_BY_ID[activation.launch].label,
    rows,
    rowsNoun: usesMembers ? audience.memberNoun : "entregables",
  };
}
