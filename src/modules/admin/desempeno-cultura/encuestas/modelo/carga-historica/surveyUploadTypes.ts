/** Tipos del asistente «Cargar encuestas»: la encuesta en revisión, las cargas y los pasos. */
import { formatSurveyDate } from '../surveyListDates'
import type { DetectedSurveyAnalysis } from './types'

/** The only survey types a historical load can create — kept in sync with the "Tipo" column. */
export type SurveyTypeOption = 'Clima' | 'Cultura' | 'NPS'
export const SURVEY_TYPE_OPTIONS: SurveyTypeOption[] = ['Clima', 'Cultura', 'NPS']

/** One detected survey as the review wizard holds it: what we read from the
 *  files, plus whatever the user corrected on the "Datos generales" step. */
export interface SurveyReviewItem {
  groupKey: string
  name: string
  /** Never pre-filled — the user must pick it before advancing past "Datos generales". */
  type: SurveyTypeOption | ''
  visibility: 'publica' | 'anonima'
  anonymityThreshold: string
  startDate: Date | undefined
  endDate: Date | undefined
  fileNames: string[]
  analysis: DetectedSurveyAnalysis
}

/** A load running in the background, mirrored by the floating tray and by the
 *  survey row it created. */
export interface UploadTaskState {
  id: number
  name: string
  progress: number
  status: 'loading' | 'completed' | 'failed'
  /** Demo flag: this task's load is scripted to fail part-way through. */
  willFail?: boolean
}

export interface RecentUpload {
  id: string
  name: string
  /** Human-friendly relative time, e.g. "Hace 2 días". */
  loadedAt: string
  type: string
}

/**
 * Where the wizard is:
 *  - `dropzone`    files + recent loads (the entry screen)
 *  - `select`      several surveys detected, pick one
 *  - `general`     confirm the detected general data
 *  - `summary`     review the detected structure before loading
 *  - `next-action` a load started and the batch still holds pending surveys
 *  - `loading`     a load is running and nothing is pending
 *  - `error`/`empty` the two dead ends of file analysis
 */
export type UploadStep = 'dropzone' | 'select' | 'general' | 'summary' | 'next-action' | 'loading' | 'error' | 'empty'

/** Loads made in the last 7 days — populates the "Cargas" tab. */
export const RECENT_UPLOADS: RecentUpload[] = [
  { id: 'ru-1', name: 'Clima Laboral 2024 Q2', loadedAt: 'Hoy, 09:14', type: 'Clima' },
  { id: 'ru-2', name: 'Cultura Organizacional 2024', loadedAt: 'Ayer, 16:40', type: 'Cultura' },
  { id: 'ru-3', name: 'NPS Interno Marzo 2024', loadedAt: 'Hace 3 días', type: 'NPS' },
  { id: 'ru-4', name: 'Clima Laboral 2024 Q1', loadedAt: 'Hace 5 días', type: 'Clima' },
  { id: 'ru-5', name: 'Pulso Bienestar Febrero', loadedAt: 'Hace 6 días', type: 'Clima' },
]

/** Formats a date the way the survey list writes them, e.g. "15 ene 2026". Empty when there is no date. */
export function formatShortDate(date: Date | undefined): string {
  return date ? formatSurveyDate(date) : ''
}
