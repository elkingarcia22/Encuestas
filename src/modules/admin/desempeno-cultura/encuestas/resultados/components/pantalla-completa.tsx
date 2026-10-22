import { useState, type ReactNode } from 'react'
import { BotonAmpliar, PantallaCompleta } from '@/modules/design-system/marco/pantalla-completa'

// «Ver en pantalla completa» (9-oct): el botón de solo icono que abre un mapa de calor a pantalla completa. Lo usan
// Favorabilidad y Riesgo › Mapa, eNPS › Por segmento y el Comparativo › Mapa de calor. Lo que va dentro se pasa como
// hijo: suele ser el mismo mapa, con más sitio para las columnas de grupos. Sus controles (ver por, filtros, personalizar
// y la leyenda «cómo leer») se pasan en `acciones` y van en la misma línea del título, junto a la X.
// Desde el 13-oct es la plantilla de pantalla completa del sistema (PantallaCompleta, war room del 13-oct): nació aquí
// y se mudó al design system para que el tablero de Selección y los editores de LMS Creator se vean igual.
export function BotonPantallaCompleta({ titulo, descripcion, acciones, children }: { titulo: string; descripcion?: string; acciones?: ReactNode; children: ReactNode }) {
  const [abierta, setAbierta] = useState(false)
  return (
    <>
      <BotonAmpliar onClick={() => setAbierta(true)} />
      <PantallaCompleta abierta={abierta} onCerrar={() => setAbierta(false)} titulo={titulo} descripcion={descripcion} acciones={acciones}>
        {abierta ? children : null}
      </PantallaCompleta>
    </>
  )
}
