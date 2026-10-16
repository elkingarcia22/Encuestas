import { activateAllCatalogDemographics } from "./demographics";
import { buildLibraryDemographic, getLibraryDemographics } from "./demographicsLibrary";
import {
  DEFAULT_ANONYMITY_THRESHOLD,
  DEFAULT_PARTICIPANTS,
} from "./surveyBuilderTypes";
import type { SurveyDraft } from "./surveyBuilderTypes";

/**
 * Starting point for "Crear en blanco": every field at its neutral default,
 * no sections, no questions. "Crear con plantilla" is where prefilled
 * content belongs — this one has to actually be empty.
 */
export const createBlankSurveyDraft = (): SurveyDraft => ({
  name: "",
  status: "draft",
  description: "",
  startDate: "",
  endDate: "",
  kind: null,
  visibility: "public",
  anonymityThreshold: DEFAULT_ANONYMITY_THRESHOLD,
  sections: [],
  participants: DEFAULT_PARTICIPANTS,
  // Not empty on purpose: the four variables every climate report is read by are
  // what "en blanco" means for demographics — starting with none would quietly
  // produce a survey whose results can't be segmented at all. They come from the
  // live module library (built-ins plus what the team saved), not just the seeds:
  // with the seeds only, data created in the module never started active.
  demographics: { enabled: true, fields: activateAllCatalogDemographics([], getLibraryDemographics(), buildLibraryDemographic) },
  welcomeEnabled: true,
  closingEnabled: true,
  welcomeDescription: "",
  closingDescription: "",
});
