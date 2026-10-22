import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Notification01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import { Button, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, InputGroup, InputGroupAddon, InputGroupInput, Item, ItemContent, ItemDescription, ItemTitle } from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { Badge } from '@/shared/components/Badge'
import { notify } from '@/shared/components/notify'
import { SinResultados } from '@/shared/components/SinResultados'
import { formatoAvance } from '../../modelo/ciclos'
import { pendientes } from '../../modelo/resultados/lecturas'
import type { ResultadosCiclo } from '../../modelo/resultados/seguimiento'

// «Pendientes del ciclo» (9-oct, como el prototipo): lo que espera a alguien, en botones con su cuenta. Cada uno abre un
// panel con la lista (quién y qué) y el aviso para resolverlo; enviarlo pregunta antes (regla «preguntar-antes»).

type Tipo = 'por-aprobar' | 'devueltos' | 'riesgo-alto'
type Fila = { id: string; titulo: string; detalle: string }

const TEXTOS: Record<Tipo, { boton: string; titulo: string; descripcion: string; accion: (n: number) => string; aviso: (n: number) => string }> = {
  'por-aprobar': {
    boton: 'Por aprobar',
    titulo: 'Objetivos por aprobar',
    descripcion: 'Objetivos que esperan el visto bueno de su líder: hasta que lo tengan no cuentan en el avance.',
    accion: (n) => `Recordar aprobación a los líderes (${n})`,
    aviso: (n) => `Recordamos a los líderes ${n === 1 ? 'el objetivo' : `los ${n} objetivos`} por aprobar`,
  },
  devueltos: {
    boton: 'Devueltos',
    titulo: 'Objetivos por ajustar',
    descripcion: 'Objetivos que el líder devolvió con comentarios: la persona tiene que corregirlos y enviarlos otra vez.',
    accion: (n) => `Recordar el ajuste (${n})`,
    aviso: (n) => `Recordamos ajustar ${n === 1 ? 'el objetivo devuelto' : `los ${n} objetivos devueltos`}`,
  },
  'riesgo-alto': {
    boton: 'Riesgo alto',
    titulo: 'Colaboradores en riesgo alto',
    descripcion: 'Personas que van 25 puntos o más por detrás del calendario del ciclo.',
    accion: (n) => `Recordar actualizar avance (${n})`,
    aviso: (n) => `Recordamos actualizar su avance a ${n === 1 ? '1 persona' : `${n} personas`}`,
  },
}

export function Pendientes({ resultados }: { resultados: ResultadosCiclo }) {
  const p = pendientes(resultados)
  const listas: Record<Tipo, Fila[]> = {
    'por-aprobar': p.porAprobar.map(({ persona, objetivo }) => ({ id: objetivo.id, titulo: objetivo.titulo, detalle: `${persona.colaborador.name} · líder ${persona.colaborador.leader ?? 'sin asignar'}` })),
    devueltos: p.devueltos.map(({ persona, objetivo }) => ({ id: objetivo.id, titulo: objetivo.titulo, detalle: persona.colaborador.name })),
    'riesgo-alto': p.riesgoAlto.map((persona) => ({ id: persona.id, titulo: persona.colaborador.name, detalle: `${persona.colaborador.area} · avance ${formatoAvance(persona.avance ?? 0)}` })),
  }
  const tipos = (Object.keys(listas) as Tipo[]).filter((tipo) => listas[tipo].length > 0)
  const [abierto, setAbierto] = useState<Tipo | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  if (tipos.length === 0) return null

  const total = tipos.reduce((s, tipo) => s + listas[tipo].length, 0)
  const lista = abierto ? listas[abierto].filter((fila) => `${fila.titulo} ${fila.detalle}`.toLowerCase().includes(busqueda.trim().toLowerCase())) : []

  return (
    <>
      <Frame>
        {/* «!»: la misma cabecera en fila (título a la izquierda, botones a la derecha) que las cajas de Resultados de Encuestas. */}
        <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3!">
          <div>
            <FrameTitle>
              {total} {total === 1 ? 'pendiente por resolver' : 'pendientes por resolver'}
            </FrameTitle>
            <FrameDescription>Toca un pendiente para ver a quién le toca y avisarle.</FrameDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tipos.map((tipo) => (
              <Button
                key={tipo}
                variant="outline"
                onClick={() => {
                  setBusqueda('')
                  setAbierto(tipo)
                }}
              >
                {TEXTOS[tipo].boton}
                <Badge variant={tipo === 'riesgo-alto' ? 'destructive-light' : 'warning-light'} size="sm" className="tabular-nums">
                  {listas[tipo].length}
                </Badge>
              </Button>
            ))}
          </div>
        </FrameHeader>
      </Frame>

      <DrawerShell
        open={abierto !== null}
        onOpenChange={(valor) => (valor ? undefined : setAbierto(null))}
        size="md"
        icon={Notification01Icon}
        title={abierto ? TEXTOS[abierto].titulo : ''}
        description={abierto ? TEXTOS[abierto].descripcion : undefined}
        headerExtra={
          <div className="border-b px-5 py-3">
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar" aria-label="Buscar en los pendientes" />
            </InputGroup>
          </div>
        }
        footer={abierto ? <Button onClick={() => setConfirmar(true)}>{TEXTOS[abierto].accion(listas[abierto].length)}</Button> : undefined}
      >
        {lista.length === 0 ? (
          // Solo queda vacía al buscar (un pendiente sin filas no abre panel): el vacío de búsqueda del sistema.
          <SinResultados busqueda={busqueda} onLimpiar={() => setBusqueda('')} />
        ) : (
          <Frame>
          <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
            <div className="divide-y">
              {lista.map((fila) => (
                <div key={fila.id}>
                  <Item size="sm">
                    <ItemContent>
                      <ItemTitle>{fila.titulo}</ItemTitle>
                      <ItemDescription>{fila.detalle}</ItemDescription>
                    </ItemContent>
                  </Item>
                </div>
              ))}
            </div>
          </FramePanel>
          </Frame>
        )}
        {/* Dentro del panel: la confirmación se abre como vista del mismo, con «← título» para volver (regla «preguntar-dentro-del-panel»). */}
        <DialogoConfirmar
        abierto={confirmar}
        onAbiertoChange={setConfirmar}
        icono={Notification01Icon}
        titulo="¿Enviar el recordatorio?"
        descripcion={abierto ? <>Les llega un aviso a {listas[abierto].length} {listas[abierto].length === 1 ? 'persona' : 'personas'} con «{TEXTOS[abierto].titulo}» en <strong className="font-semibold">{resultados.ciclo.nombre}</strong>.</> : ''}
        accion="Enviar recordatorio"
        onConfirmar={() => {
          if (!abierto) return
          notify(TEXTOS[abierto].aviso(listas[abierto].length), resultados.ciclo.nombre, 'success')
          setConfirmar(false)
          setAbierto(null)
        }}
      >
        {abierto ? <RegistroConfirmar icono={Notification01Icon} nombre={TEXTOS[abierto].titulo} detalle={`${resultados.ciclo.nombre} · ${listas[abierto].length} ${listas[abierto].length === 1 ? 'pendiente' : 'pendientes'}`} tono="neutro" /> : null}
        </DialogoConfirmar>
      </DrawerShell>
    </>
  )
}
