import { COLLABORATORS } from "./collaborators";
import { isLaunched } from "./homePulse";
import { unitFromSeed } from "./surveyResults";
import { daysUntil } from "./surveyListFilters";
import type { SurveyListItem } from "./types";

/**
 * Company coverage: the share of the directory that received at least one
 * survey in a window of days. It reads reach, not response — who the company
 * has been listening to, and who it has not asked at all.
 *
 * Each survey invites a block of people from the directory starting at its own
 * deterministic offset (from its id), so two surveys of 300 people do not
 * pretend to be the same 300. Someone in two surveys counts once.
 */

/** How far back "recently surveyed" reaches. */
export const COVERAGE_DAYS = 90;

export interface CompanyCoverage {
  /** Share of the directory reached, 0–100. */
  value: number;
  /** The same share in the window right before, for the delta; null if nobody was surveyed then. */
  previous: number | null;
  reached: number;
  total: number;
  surveys: number;
}

const invitedOf = (survey: SurveyListItem): number => Number(survey.participants.replace(/\D/g, "")) || 0;

function reachIn(surveys: readonly SurveyListItem[], today: Date, from: number, to: number): { reached: number; surveys: number } {
  const total = COLLABORATORS.length;
  const people = new Set<number>();
  let count = 0;
  for (const survey of surveys) {
    if (!isLaunched(survey)) continue;
    // Days since it opened: inside the window if it opened between `from` and `to` days ago.
    const sinceStart = -(daysUntil(survey.startDate, today) ?? Number.POSITIVE_INFINITY);
    if (sinceStart < from || sinceStart >= to) continue;
    count += 1;
    const invited = Math.min(invitedOf(survey), total);
    const offset = Math.floor(unitFromSeed(`${survey.id}:audience`) * total);
    for (let index = 0; index < invited; index += 1) people.add((offset + index) % total);
  }
  return { reached: people.size, surveys: count };
}

export function companyCoverage(surveys: readonly SurveyListItem[], today: Date): CompanyCoverage {
  const total = COLLABORATORS.length;
  const now = reachIn(surveys, today, 0, COVERAGE_DAYS);
  const before = reachIn(surveys, today, COVERAGE_DAYS, COVERAGE_DAYS * 2);
  const share = (reached: number) => Math.round((reached / total) * 1000) / 10;
  return {
    value: share(now.reached),
    previous: before.surveys > 0 ? share(before.reached) : null,
    reached: now.reached,
    total,
    surveys: now.surveys,
  };
}
