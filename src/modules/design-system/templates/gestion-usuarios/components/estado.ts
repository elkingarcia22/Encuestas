import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'

import { USUARIOS_INICIALES, type AccionMasiva, type Usuario } from './datos'

// Estado del template: vive en el layout para que las altas, ediciones y suspensiones se vean al
// volver a la lista, para recordar que los recordatorios ya se enviaron y para que una acción
// masiva siga corriendo aunque la persona salga de la pantalla (patrón «Procesos largos»).

export type ProcesoMasivo = {
  accion: AccionMasiva
  total: number
  hechos: number
  omitidas: number
  estado: 'corriendo' | 'listo'
}

export type EstadoGestion = {
  usuarios: Usuario[]
  setUsuarios: Dispatch<SetStateAction<Usuario[]>>
  recordatorioEnviado: number | null
  setRecordatorioEnviado: (personas: number | null) => void
  masivo: ProcesoMasivo | null
  iniciarMasivo: (accion: AccionMasiva, filas: Record<string, string>[], omitidas: number) => void
  cerrarMasivo: () => void
}

export const GestionContexto = createContext<EstadoGestion>({
  usuarios: USUARIOS_INICIALES,
  setUsuarios: () => undefined,
  recordatorioEnviado: null,
  setRecordatorioEnviado: () => undefined,
  masivo: null,
  iniciarMasivo: () => undefined,
  cerrarMasivo: () => undefined,
})

export const useGestion = () => useContext(GestionContexto)
