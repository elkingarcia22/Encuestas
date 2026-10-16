import type { IconSvgElement } from "@hugeicons/react";
import { AiBrain01Icon, DashboardSpeed01Icon, FavouriteIcon, Plant02Icon, ShapesIcon } from "@hugeicons/core-free-icons";
import type { Tone } from "./tone";
import type { SurveyKind } from "./surveyBuilderTypes";

/**
 * Un icono y un tono por tipo de encuesta: el único lugar que decide cómo se ve «Cultura».
 * Las plantillas del home y las tarjetas de tipo del constructor leen de aquí, así que el tipo que
 * se reconoce en el home es el mismo que se reconoce al crear.
 */
export interface KindVisual {
  icon: IconSvgElement;
  tone: Tone;
}

export const KIND_VISUAL: Readonly<Record<SurveyKind, KindVisual>> = {
  cultura: { icon: FavouriteIcon, tone: "positive" },
  clima: { icon: Plant02Icon, tone: "brand" },
  enps: { icon: DashboardSpeed01Icon, tone: "warning" },
  // No es el tono de IA: ese se reserva para acciones reales de la IA. Esto es un tema de encuesta.
  ia: { icon: AiBrain01Icon, tone: "violet" },
  otros: { icon: ShapesIcon, tone: "neutral" },
};
