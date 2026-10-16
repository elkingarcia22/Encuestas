// @ts-nocheck
// Lo que el editor carga de un contenido: páginas y recursos.
// Portado del catálogo del playground anterior; los datos no se editan a mano.

export interface ContenidoEditorPayload {
  useDemoSeed?: boolean
  fechaPublicacion?: string | null
  privadoColaboradorIds?: string[]
}

export const BD_CONTENIDO_EDITOR_PAYLOAD = {
  "f002": {
    useDemoSeed: true,
    fechaPublicacion: "2026-04-24"
  },
  "f007": {
    useDemoSeed: true,
    fechaPublicacion: "2026-06-15"
  },
  "24000": {
    useDemoSeed: true,
    privadoColaboradorIds: ["E035", "E036", "E037", "E038"],
    fechaPublicacion: "2026-05-28"
  },
  "24001": {
    useDemoSeed: true,
    fechaPublicacion: null
  },
  "24003": {
    useDemoSeed: true,
    fechaPublicacion: "2026-04-10"
  }
};
