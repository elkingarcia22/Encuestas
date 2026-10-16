import { useMemo } from 'react'
import { ColumnaIndicador, DetalleIndicador, FilaIndicadores } from '@/modules/design-system/graficos/fila-indicadores'
import { AnilloAvance, BarrasMini, DonaReparto, numero, type SegmentoReparto } from '@/modules/design-system/graficos/piezas'
import { plural } from '@/modules/design-system/patrones/formato'
import { DIAS_ESTANCADA, type VacanteLista } from './datos'

// Los tres indicadores del home de Vacantes, calculados del mismo listado que se ve abajo (nada
// inventado). Misma fila que el pulso de Encuestas (FilaIndicadores, bloque chart-2 de ReUI): la cifra, el gráfico
// en la esquina y el detalle debajo. Cada lectura lleva el gráfico que pide: las vacantes por
// estado son partes de un total (dona), los candidatos nuevos se comparan entre vacantes
// (barras, de la que más recibe a la que menos) y el tiempo abierto es un avance contra el
// límite de estancada (anillo).

const COLOR_ESTADO: Record<VacanteLista['estado'], string> = {
  Publicada: 'var(--success)',
  Pausada: 'var(--warning)',
  Borrador: 'var(--info)',
  Cerrada: 'var(--muted-foreground)',
}

const ETIQUETA_ESTADO: Record<VacanteLista['estado'], string> = {
  Publicada: 'Publicadas',
  Pausada: 'Pausadas',
  Borrador: 'Borradores',
  Cerrada: 'Cerradas',
}

export function IndicadoresVacantes({ filas }: { filas: readonly VacanteLista[] }) {
  const lectura = useMemo(() => {
    const cuantas = (estado: VacanteLista['estado']) => filas.filter((vacante) => vacante.estado === estado).length
    const estados: SegmentoReparto[] = (['Publicada', 'Pausada', 'Borrador', 'Cerrada'] as const).map((estado) => ({
      id: estado.toLowerCase(),
      etiqueta: ETIQUETA_ESTADO[estado],
      valor: cuantas(estado),
      color: COLOR_ESTADO[estado],
    }))

    const nuevos = filas.reduce((suma, vacante) => suma + vacante.nuevos, 0)
    const conNuevos = filas.filter((vacante) => vacante.nuevos > 0).sort((a, b) => b.nuevos - a.nuevos)
    const barras = conNuevos.map((vacante) => ({ id: vacante.id, nombre: vacante.titulo, valor: vacante.nuevos }))

    const publicadas = filas.filter((vacante) => vacante.estado === 'Publicada')
    const abiertas = publicadas.filter((vacante) => vacante.diasAbierta > 0)
    const promedio = abiertas.length === 0 ? 0 : Math.round(abiertas.reduce((suma, vacante) => suma + vacante.diasAbierta, 0) / abiertas.length)
    const estancadas = publicadas.filter((vacante) => vacante.diasAbierta >= DIAS_ESTANCADA).length

    return { publicadas: cuantas('Publicada'), pausadas: cuantas('Pausada'), borradores: cuantas('Borrador'), estados, nuevos, conNuevos, barras, promedio, estancadas }
  }, [filas])


  return (
    <FilaIndicadores etiqueta="Indicadores de vacantes">
        <ColumnaIndicador
          titulo="Vacantes publicadas"
          cifra={numero(lectura.publicadas)}
          grafico={<DonaReparto segmentos={lectura.estados} etiqueta="Vacantes por estado" />}
          pie={<DetalleIndicador>{`${numero(lectura.pausadas)} ${plural(lectura.pausadas, 'pausada', 'pausadas')} · ${numero(lectura.borradores)} en borrador`}</DetalleIndicador>}
        />
        <ColumnaIndicador
          titulo="Candidatos nuevos"
          cifra={numero(lectura.nuevos)}
          grafico={
            <div className="h-10 w-28">
              <BarrasMini barras={lectura.barras} etiqueta="Candidatos nuevos" color="var(--primary)" />
            </div>
          }
          pie={<DetalleIndicador>{lectura.conNuevos.length > 0 ? `Últimos 7 días · repartidos en ${numero(lectura.conNuevos.length)} ${plural(lectura.conNuevos.length, 'vacante', 'vacantes')}` : 'Últimos 7 días · sin candidatos nuevos'}</DetalleIndicador>}
        />
        <ColumnaIndicador
          titulo="Días abiertas en promedio"
          cifra={`${numero(lectura.promedio)} ${plural(lectura.promedio, 'día', 'días')}`}
          grafico={
            <AnilloAvance
              valor={(lectura.promedio / DIAS_ESTANCADA) * 100}
              color={lectura.promedio >= DIAS_ESTANCADA ? 'var(--destructive)' : 'var(--primary)'}
              etiqueta="Promedio de las publicadas"
              texto={`${numero(lectura.promedio)} de ${DIAS_ESTANCADA} días`}
              tamano={44}
            />
          }
          pie={<DetalleIndicador>{lectura.estancadas > 0 ? `${numero(lectura.estancadas)} ${plural(lectura.estancadas, 'pasa', 'pasan')} de ${DIAS_ESTANCADA} días, el límite de estancada` : `Ninguna pasa de ${DIAS_ESTANCADA} días, el límite de estancada`}</DetalleIndicador>}
        />
    </FilaIndicadores>
  )
}
