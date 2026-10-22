import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, MinusSignIcon, PieChartIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Frame,
  FramePanel,
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  Spinner,
  Text,
  cn,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Hint } from '@/shared/components/Hint'
import { notifyAction } from '@/shared/components/notify'
import { plural } from '@/modules/design-system/patrones/formato'
import { BotonCancelarPanel } from '@/modules/design-system/drawers/components/boton-cancelar-panel'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { BarraSegmentada } from '@/modules/design-system/templates/dashboard/components/graficos'
import {
  AGENTES,
  DIAS_ATAJO,
  conSigno,
  creditos,
  duracion,
  efecto,
  paraDosSemanas,
  porUrgencia,
  registroDeCreditos,
  revisarReparto,
  usosTexto,
  type AgenteId,
  type Bolsa,
} from '../../../propuestas/creditos'
import { IconoAgente } from '../../../propuestas/components/creditos-ui'
import { useAccion } from '@/modules/design-system/estados/carga'
import { noSeGuardo } from '../../../propuestas/simular'

// Reasignar créditos (25 sep). Lo de hoy era un cajón con −/+ que no decía qué pasaba al cambiar un número, un
// «Guardar» apagado sin decir por qué y «Quedan 10.700 sin asignar» en naranja como si fuera un error. Aquí cada agente
// dice qué le queda y para cuánto le alcanza con el número nuevo, lo que no se puede quitar está explicado junto al
// agente, y lo sin asignar es neutro: solo se pone rojo si el reparto se pasa de la bolsa.

// El atajo «Cubrir dos semanas» y el efecto de cada número viven en `propuestas/creditos.ts`: la sugerencia de la IA del
// tablero de atención reparte con la misma regla (5 oct).

export function ReasignarCreditos({ open, onOpenChange, bolsa }: { open: boolean; onOpenChange: (open: boolean) => void; bolsa: Bolsa }) {
  // El borrador: lo que quedaría asignado a cada agente. Arranca en lo de hoy cada vez que se abre (el cajón se monta de
  // nuevo con `key`).
  const [borrador, setBorrador] = useState<Partial<Record<AgenteId, number>>>(() =>
    Object.fromEntries(bolsa.porAgente.filter((uno) => uno.agente.costo).map((uno) => [uno.agente.id, uno.asignado])),
  )
  const accion = useAccion()
  const revision = revisarReparto(bolsa, borrador)
  const conCosto = porUrgencia(bolsa.porAgente.filter((uno) => uno.agente.costo))
  const gratis = bolsa.porAgente.find((uno) => !uno.agente.costo)
  const asignado = bolsa.comprado - revision.sinAsignar
  const sePasa = revision.sinAsignar < 0
  const cambiar = (id: AgenteId, valor: number) => setBorrador((antes) => ({ ...antes, [id]: Math.max(0, valor) }))

  // Atajo: a quien no le alcanzan dos semanas, darle lo que le falta (de lo sin asignar).
  const cortos = conCosto.filter((uno) => (efecto(uno, borrador[uno.agente.id] ?? uno.asignado).dias ?? 0) < DIAS_ATAJO && uno.vacantes.length)
  const faltaParaCortos = cortos.reduce((suma, uno) => suma + Math.max(0, paraDosSemanas(uno) - (borrador[uno.agente.id] ?? uno.asignado)), 0)
  const cubrir = () =>
    setBorrador((antes) => ({
      ...antes,
      ...Object.fromEntries(cortos.map((uno) => [uno.agente.id, Math.max(antes[uno.agente.id] ?? uno.asignado, paraDosSemanas(uno))])),
    }))

  const guardar = () => {
    const cambios = revision.cambios
    // Si no se guarda, el panel sigue abierto con el reparto y el aviso deja reintentar.
    if (noSeGuardo(`reparto:${JSON.stringify(cambios)}`, 'No pudimos guardar el reparto', guardar, 'Los créditos siguen como estaban.')) return
    const deshacer = registroDeCreditos.repartir(cambios, 'Reparto desde Créditos de IA')
    onOpenChange(false)
    const resumen = Object.entries(cambios)
      .map(([id, delta]) => `${AGENTES.find((a) => a.id === id)?.nombre} ${conSigno(delta ?? 0)}`)
      .join(' · ')
    notifyAction('Reparto guardado', resumen, { label: 'Deshacer', onClick: deshacer }, 'success')
  }

  // Por qué no se puede guardar, dicho en el pie (no un botón apagado sin explicación).
  const porQueNo = revision.errores.length
    ? revision.errores.some((error) => !error.agente)
      ? 'Te pasas de la bolsa: quítale a otro agente.'
      : `Revisa ${revision.errores.map((error) => AGENTES.find((a) => a.id === error.agente)?.nombre).join(' y ')}.`
    : !revision.hayCambios
      ? 'Sin cambios todavía.'
      : `${Object.keys(revision.cambios).length} ${plural(Object.keys(revision.cambios).length, 'agente cambia', 'agentes cambian')}.`

  return (
    <DrawerShell
      open={open}
      onOpenChange={(abrir) => (accion.enCurso && !abrir ? undefined : onOpenChange(abrir))}
      size="lg"
      icon={PieChartIcon}
      title="Reasignar créditos"
      description="Reparte la bolsa entre los agentes. Lo usado y lo reservado para procesos en curso no se puede quitar."
      // 13-oct (I-021): con el reparto cambiado, no se cierra al tocar fuera y pregunta antes de descartar.
      conCambios={revision.hayCambios}
      footer={
        <div className="flex w-full items-center gap-2">
          <Text as="span" variant="muted" size="sm" role="status" className="min-w-0 flex-1">
            {porQueNo}
          </Text>
          <BotonCancelarPanel disabled={accion.enCurso} alCerrar={() => onOpenChange(false)} />
          <Button disabled={!revision.hayCambios || revision.errores.length > 0 || accion.enCurso} onClick={() => accion.correr(guardar)}>
            {accion.enCurso ? <Spinner /> : null}
            {accion.enCurso ? 'Guardando…' : 'Guardar reparto'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* La bolsa con el reparto nuevo: cuadra a la vista (asignado + sin asignar = bolsa). */}
        <Frame>
          <FramePanel className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <Cifra etiqueta="Bolsa" valor={creditos(bolsa.comprado)} />
              <Cifra
                etiqueta="Asignado"
                valor={creditos(asignado)}
                cambio={asignado !== bolsa.asignado ? conSigno(asignado - bolsa.asignado) : undefined}
              />
              <Cifra etiqueta="Sin asignar" valor={creditos(revision.sinAsignar)} alerta={sePasa} />
            </div>
            <div aria-hidden="true">
              <BarraSegmentada
                segmentos={[
                  ...conCosto.map((uno) => ({
                    id: uno.agente.id,
                    etiqueta: uno.agente.nombre,
                    valor: borrador[uno.agente.id] ?? uno.asignado,
                    color: uno.agente.color,
                  })),
                  { id: 'libre', etiqueta: 'Sin asignar', valor: Math.max(0, revision.sinAsignar), color: 'var(--muted)' },
                ]}
              />
            </div>
            {sePasa ? (
              <Text as="p" size="sm" className="text-destructive">
                Te pasas de la bolsa por {creditos(-revision.sinAsignar)}. Quítale a otro agente o pide una recarga.
              </Text>
            ) : null}
          </FramePanel>
        </Frame>

        {/* El atajo: lo que la mayoría viene a hacer aquí. */}
        {cortos.length && faltaParaCortos ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
            <Text as="p" size="sm" className="min-w-0 flex-1">
              A {cortos.map((uno) => uno.agente.nombre).join(', ').replace(/, ([^,]*)$/, ' y $1')} no les alcanza para dos semanas. Cubrirlas
              cuesta {creditos(faltaParaCortos)} de los {creditos(Math.max(0, revision.sinAsignar))} sin asignar.
            </Text>
            <Hint label="Le da a cada uno lo que gasta en dos semanas a su ritmo (o 5 usos si nadie lo ha usado todavía).">
              <Button variant="outline" size="sm" onClick={cubrir}>
                Cubrir dos semanas
              </Button>
            </Hint>
          </div>
        ) : null}

        <section aria-label="Agentes" className="flex flex-col divide-y">
          {conCosto.map((estado) => {
            const { agente } = estado
            const valor = borrador[agente.id] ?? estado.asignado
            const ahora = efecto(estado, estado.asignado)
            const despues = efecto(estado, valor)
            const delta = valor - estado.asignado
            const error = revision.errores.find((uno) => uno.agente === agente.id)
            const aviso = revision.avisos.find((uno) => uno.agente === agente.id)
            return (
              <div key={agente.id} className="flex flex-col gap-2 py-4 first:pt-0">
                <div className="flex items-start gap-3">
                  <IconoAgente agente={agente} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Text as="span" weight="medium" id={`reparto-${agente.id}`}>
                      {agente.nombre}
                    </Text>
                    <Text as="span" variant="muted" size="sm">
                      {creditos(agente.costo)} créditos por {agente.uso[0]}
                    </Text>
                  </div>
                  <NumberField
                    value={valor}
                    min={0}
                    step={agente.costo}
                    locale="es-CO"
                    onValueChange={(nuevo) => cambiar(agente.id, nuevo ?? 0)}
                    aria-labelledby={`reparto-${agente.id}`}
                    className="w-40 shrink-0"
                  >
                    <NumberFieldGroup>
                      <NumberFieldDecrement aria-label={`Quitarle ${agente.costo} a ${agente.nombre}`}>
                        <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} aria-hidden="true" />
                      </NumberFieldDecrement>
                      <NumberFieldInput aria-labelledby={`reparto-${agente.id}`} className="tabular-nums" />
                      <NumberFieldIncrement aria-label={`Darle ${agente.costo} a ${agente.nombre}`}>
                        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                      </NumberFieldIncrement>
                    </NumberFieldGroup>
                  </NumberField>
                </div>
                <div className="flex flex-col gap-1 ps-13">
                  <Text as="span" variant="muted" size="sm">
                    Usado {creditos(estado.usado)}
                    {estado.reservado ? ` · ${creditos(estado.reservado)} reservados para ${usosTexto(agente, estado.reservado / agente.costo)} en curso` : ''} · mínimo{' '}
                    {creditos(estado.minimo)}
                  </Text>
                  {/* El efecto del número nuevo, en lo que importa: cuántas veces más puede trabajar. */}
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Text as="span" size="sm">
                      {delta ? (
                        <>
                          {ahora.usos ? `Alcanzaba para ${usosTexto(agente, ahora.usos)}` : 'No alcanzaba para nada'}; ahora{' '}
                          <strong className="font-medium">{despues.usos ? `para ${usosTexto(agente, despues.usos)}` : `para ${ningun(agente)}`}</strong>
                        </>
                      ) : despues.usos ? (
                        <>Alcanza para {usosTexto(agente, despues.usos)}</>
                      ) : (
                        <>No le alcanza para {ningun(agente)}</>
                      )}
                      {despues.dias !== null && despues.usos ? `, ${duracion(despues.dias)} a su ritmo` : ''}.
                    </Text>
                    {delta ? (
                      <Badge variant={delta > 0 ? 'success-light' : 'secondary'} className="tabular-nums">
                        {conSigno(delta)}
                      </Badge>
                    ) : null}
                  </span>
                  {error ? (
                    <Text as="p" size="sm" className="flex items-start gap-1.5 text-destructive">
                      <HugeiconsIcon icon={Alert02Icon} size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                      {error.texto}
                    </Text>
                  ) : aviso ? (
                    <Text as="p" size="sm" className="flex items-start gap-1.5 text-warning-foreground">
                      <HugeiconsIcon icon={Alert02Icon} size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                      {aviso.texto}
                    </Text>
                  ) : null}
                </div>
              </div>
            )
          })}
          {gratis ? (
            <div className="flex items-center gap-3 py-4">
              <IconoAgente agente={gratis.agente} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Text as="span" weight="medium">
                  {gratis.agente.nombre}
                </Text>
                <Text as="span" variant="muted" size="sm">
                  No usa créditos: {creditos(gratis.vecesUsado)} CVs analizados.
                </Text>
              </div>
              <Badge variant="success-light">
                Gratis
              </Badge>
            </div>
          ) : null}
        </section>
      </div>
    </DrawerShell>
  )
}

function Cifra({ etiqueta, valor, cambio, alerta }: { etiqueta: string; valor: string; cambio?: string; alerta?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <Text as="span" variant="muted" size="sm">
        {etiqueta}
      </Text>
      <span className="flex flex-wrap items-baseline gap-1.5">
        <Text as="span" size="lg" weight="semibold" className={cn('tabular-nums', alerta && 'text-destructive')}>
          {valor}
        </Text>
        {cambio ? (
          <Text as="span" variant="muted" size="sm" className="tabular-nums">
            {cambio}
          </Text>
        ) : null}
      </span>
    </div>
  )
}

// «ninguna entrevista», «ningún roleplay»: del «una/un» del agente.
const ningun = (agente: { unUso: string }) => agente.unUso.replace(/^una /, 'ninguna ').replace(/^un /, 'ningún ')
