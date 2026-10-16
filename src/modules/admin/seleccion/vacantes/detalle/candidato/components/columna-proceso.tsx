import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { DocumentValidationIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  FramePanel,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ubits/flux-ui'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { plural } from '@/modules/design-system/patrones/formato'
import { NOMBRE_ETAPA, disponible, etapasDe, pesos, type Candidato, type EtapaId, type Vacante } from '../../components/data'
import { BADGE_EVALUACION, TITULO_EVALUACION, conIA, evaluadasDe, resumenEvaluacion, type PestanaId } from './expediente-data'
import { Filas, Marco, Rotulo, type Destacado } from './piezas'

// Columna derecha del expediente, igual en todas las pestañas: dónde va el candidato en el proceso y cómo le fue
// en cada evaluación, en una línea cada una (el lenguaje de la columna de resumen de crear vacante). Es la de
// «Run Settings» en el bloque «Agent Run Detail» de ReUI. Las líneas de evaluación llevan a su pestaña.
export function ColumnaProceso({
  candidato,
  vacante,
  pestana,
  destacado,
  onMover,
}: {
  candidato: Candidato
  vacante: Vacante
  pestana: PestanaId
  destacado: Destacado
  onMover: (etapa: EtapaId) => void
}) {
  const etapas = etapasDe(vacante).map((etapa) => ({ value: etapa.id, label: etapa.titulo }))

  return (
    <Marco id="exp-datos" destacado={destacado} titulo="En el proceso" descripcion={`${vacante.titulo} · ${vacante.reclutador.nombre}`}>
      <FramePanel className="flex flex-col gap-4">
        <Select value={candidato.etapa} onValueChange={(valor) => onMover(valor as EtapaId)} items={etapas}>
          <SelectTrigger className="w-full" aria-label="Mover de etapa">
            <SelectValue>{(valor: EtapaId) => `Etapa: ${NOMBRE_ETAPA[valor]}`}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {etapas.map((opcion) => (
              <SelectItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Filas
          filas={[
            { termino: 'En la etapa', valor: candidato.dias === 0 ? 'Desde hoy' : `${candidato.dias} ${plural(candidato.dias, 'día', 'días')}` },
            {
              termino: 'Ajuste',
              valor: (
                <span className="inline-flex items-center gap-1.5">
                  <IconoIA />
                  {candidato.ajuste}%
                </span>
              ),
            },
            {
              termino: 'Pretensión',
              valor: (
                <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
                  {candidato.pretension > vacante.rango[1] ? (
                    <Badge variant="warning-outline">
                      Sobre el rango
                    </Badge>
                  ) : null}
                  {pesos(candidato.pretension)}
                </span>
              ),
            },
            { termino: 'Rango', valor: `${pesos(vacante.rango[0])} – ${pesos(vacante.rango[1])}` },
            { termino: 'Disponibilidad', valor: disponible(candidato.disponibilidad) },
            { termino: 'Llegó por', valor: candidato.origen },
          ]}
        />
      </FramePanel>

      <FramePanel className="flex flex-col gap-2">
        <Rotulo>Evaluaciones</Rotulo>
        <ItemGroup className="gap-1">
          {evaluadasDe(vacante).map((etapa) => {
            const { estado, linea } = resumenEvaluacion(etapa, candidato, vacante)
            return (
              <Item
                key={etapa}
                size="xs"
                variant={pestana === etapa ? 'muted' : 'default'}
                render={<Link to={{ search: `?pestana=${etapa}` }} replace aria-current={pestana === etapa ? 'page' : undefined} />}
              >
                <ItemMedia variant="icon">
                  {conIA(etapa) ? <IconoIA /> : <HugeiconsIcon icon={DocumentValidationIcon} />}
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="flex-wrap">
                    {TITULO_EVALUACION[etapa]}
                    <Badge variant={BADGE_EVALUACION[estado].variant}>
                      {BADGE_EVALUACION[estado].texto}
                    </Badge>
                  </ItemTitle>
                  <ItemDescription>{linea}</ItemDescription>
                </ItemContent>
              </Item>
            )
          })}
        </ItemGroup>
      </FramePanel>
    </Marco>
  )
}
