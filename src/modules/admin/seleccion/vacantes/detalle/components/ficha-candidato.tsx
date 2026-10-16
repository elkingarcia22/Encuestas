import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Calendar03Icon,
  DocumentValidationIcon,
  Location01Icon,
  Mail01Icon,
  Money03Icon,
  SmartPhone01Icon,
  UserAdd01Icon,
  UserRemove01Icon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  cn,
  Heading,
  Item,
  ItemActions,
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
  Separator,
  Text,
  Textarea,
} from '@ubits/flux-ui'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import styles from '@/modules/design-system/agente-contextual/components/agent.module.css'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'
import { BADGE_EVALUACION, TITULO_EVALUACION, conIA, evaluadasDe, resumenEvaluacion } from '../candidato/components/expediente-data'
import { ListaNotas } from '../candidato/components/notas'
import { NOMBRE_ETAPA, disponible, etapasDe, pesos, type Candidato, type EtapaId, type SeccionId, type Vacante } from './data'

export type Destacado = { seccion: SeccionId; tick: number } | null

const ESTADO_REQUISITO = { Cumple: 'success-outline', Parcial: 'warning-outline', 'Por validar': 'outline', 'No cumple': 'destructive-outline' } as const

type FichaProps = {
  candidato: Candidato | null
  vacante: Vacante
  onCerrar: () => void
  destacado: Destacado
  // Con el agente abierto, la ficha no bloquea el panel y se corre a su izquierda.
  agenteAbierto: boolean
  desplazamiento: string
  onMover: (etapa: EtapaId) => void
  onDescartar: () => void
  onResumir: () => void
  onNota: (texto: string) => void
}

// Sección de la ficha. Cuando el agente la cita, late con el resaltado (la clave nueva reinicia la animación).
function Seccion({ id, destacado, titulo, children }: { id: SeccionId; destacado: Destacado; titulo: string; children: ReactNode }) {
  const activo = destacado?.seccion === id
  return (
    <section key={activo ? destacado.tick : id} id={`ficha-${id}`} className={cn('flex scroll-mt-4 flex-col gap-3 rounded-xl', activo && styles.flash)}>
      <Heading as="h3" level={6}>
        {titulo}
      </Heading>
      {children}
    </section>
  )
}

export function FichaCandidato({
  candidato,
  vacante,
  onCerrar,
  destacado,
  agenteAbierto,
  desplazamiento,
  onMover,
  onDescartar,
  onResumir,
  onNota,
}: FichaProps) {
  const [borrador, setBorrador] = useState('')
  const opcionesEtapa = etapasDe(vacante).map((etapa) => ({ value: etapa.id, label: etapa.titulo }))
  // Vista rápida del tablero: lo completo (trayectoria, evaluaciones, transcripciones) está en el expediente.
  const expediente = candidato ? `/admin/seleccion/vacantes/${vacante.id}/candidatos/${candidato.id}` : ''

  const datos = candidato
    ? [
        { icono: Mail01Icon, etiqueta: 'Correo electrónico', valor: candidato.correo },
        { icono: SmartPhone01Icon, etiqueta: 'Celular', valor: candidato.celular },
        { icono: UserAdd01Icon, etiqueta: 'Origen', valor: candidato.origen },
        { icono: Location01Icon, etiqueta: 'Ciudad', valor: candidato.ciudad },
        {
          icono: Money03Icon,
          etiqueta: 'Pretensión salarial',
          valor: `${pesos(candidato.pretension)} · rango ${pesos(vacante.rango[0])} – ${pesos(vacante.rango[1])}`,
        },
        { icono: Calendar03Icon, etiqueta: 'Disponibilidad', valor: disponible(candidato.disponibilidad) },
      ]
    : []

  return (
    <DrawerShell
      open={candidato !== null}
      onOpenChange={(abierto) => (abierto ? undefined : onCerrar())}
      // Con el agente abierto la ficha queda junto al panel en vez de taparlo (posición, no apariencia).
      modal={!agenteAbierto}
      disablePointerDismissal={agenteAbierto}
      style={agenteAbierto ? { right: desplazamiento } : undefined}
      size="lg"
      title={candidato?.nombre ?? ''}
      description={candidato ? `${candidato.cargo} · ${candidato.empresa}` : undefined}
      media={
        candidato ? (
          <Avatar size="lg">
            <AvatarFallback>{candidato.iniciales}</AvatarFallback>
          </Avatar>
        ) : undefined
      }
      badge={
        candidato ? (
          <span className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">
              {NOMBRE_ETAPA[candidato.etapa]}
            </Badge>
            <EtiquetaIA size="sm">Ajuste {candidato.ajuste}%</EtiquetaIA>
          </span>
        ) : null
      }
      footer={
        candidato ? (
          <>
            <Select
              value={candidato.etapa}
              onValueChange={(valor) => onMover(valor as EtapaId)}
              items={opcionesEtapa}
            >
              <SelectTrigger className="w-full" aria-label="Mover de etapa">
                <SelectValue>{(valor: EtapaId) => `Etapa: ${NOMBRE_ETAPA[valor]}`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {opcionesEtapa.map((opcion) => (
                  <SelectItem key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={onDescartar}>
              <HugeiconsIcon icon={UserRemove01Icon} />
              Descartar candidato
            </Button>
          </>
        ) : null
      }
    >
      {candidato ? (
        <div className="flex flex-col gap-6">
          {candidato.accion ? (
            <Badge variant="warning-outline" className="w-fit max-w-full">
              <span className="truncate">Acción requerida: {candidato.accion}</span>
            </Badge>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <Button nativeButton={false} render={<Link to={expediente} />}>
              Ver expediente
              <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
            </Button>
            {/* El botón que abre el agente (orbe incluido), y el último de la fila. Se llama «Orbit Flow» como en todo el
                producto (auditoría, 5-oct; antes «Agente IA»); el agente abre con el resumen. */}
            <ReopenAgentButton className="w-full" onClick={onResumir} />
          </div>

          <Seccion id="datos" destacado={destacado} titulo="Datos">
            <ItemGroup className="gap-1">
              {datos.map((dato) => (
                <Item key={dato.etiqueta} size="xs">
                  <ItemMedia variant="icon">
                    <HugeiconsIcon icon={dato.icono} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemDescription>{dato.etiqueta}</ItemDescription>
                    <ItemTitle>{dato.valor}</ItemTitle>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          </Seccion>

          <Separator />

          <Seccion id="cv" destacado={destacado} titulo="Hoja de vida">
            <Text as="p" size="sm">
              {candidato.resumen}
            </Text>
            <div className="flex flex-wrap gap-1.5">
              {candidato.habilidades.map((habilidad) => (
                <Badge key={habilidad} variant="secondary">
                  {habilidad}
                </Badge>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {vacante.requisitos.map((requisito, indice) => (
                <div key={requisito} className="flex items-start justify-between gap-3">
                  <Text as="span" size="sm">
                    {requisito}
                  </Text>
                  <Badge variant={ESTADO_REQUISITO[candidato.requisitos[indice]]} className="shrink-0">
                    {candidato.requisitos[indice]}
                  </Badge>
                </div>
              ))}
            </div>
          </Seccion>

          <Separator />

          {/* Una línea por evaluación del flujo; el detalle vive en su pestaña del expediente. Conserva el id
              «serena» porque las fuentes del agente sobre la entrevista llevan aquí. */}
          <Seccion id="serena" destacado={destacado} titulo="Evaluaciones">
            <ItemGroup className="gap-2">
              {evaluadasDe(vacante).map((etapa) => {
                const { estado, linea } = resumenEvaluacion(etapa, candidato, vacante)
                return (
                  <Item key={etapa} variant="outline" size="sm" render={<Link to={`${expediente}?pestana=${etapa}`} />}>
                    <ItemMedia variant="icon">
                      {conIA(etapa) ? <IconoIA /> : <HugeiconsIcon icon={DocumentValidationIcon} />}
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{TITULO_EVALUACION[etapa]}</ItemTitle>
                      <ItemDescription>{linea}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Badge variant={BADGE_EVALUACION[estado].variant}>
                        {BADGE_EVALUACION[estado].texto}
                      </Badge>
                    </ItemActions>
                  </Item>
                )
              })}
            </ItemGroup>
          </Seccion>

          <Separator />

          <Seccion id="notas" destacado={destacado} titulo="Notas">
            {/* La misma lista de notas del expediente, sin la insignia de etapa. */}
            <ListaNotas notas={candidato.notas} vacia="Todavía no hay notas. Solo las ve el equipo de selección." />
            <Textarea
              value={borrador}
              onChange={(event) => setBorrador(event.target.value)}
              rows={3}
              placeholder="Escribe una nota para el equipo de selección"
              aria-label="Nueva nota"
            />
            <Button
              variant="outline"
              size="sm"
              className="self-end"
              disabled={!borrador.trim()}
              onClick={() => {
                onNota(borrador.trim())
                setBorrador('')
              }}
            >
              Agregar nota
            </Button>
          </Seccion>
        </div>
      ) : null}
    </DrawerShell>
  )
}
