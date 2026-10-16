import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Delete02Icon, FilterIcon, PlusSignIcon, Search01Icon, Tag01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Checkbox,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Separator,
  Text,
} from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { notifyAction } from '@/shared/components/notify'
import { plural } from '@/modules/design-system/patrones/formato'
import type { VacanteUI } from '../../../propuestas/datos'
import { noSeGuardo } from '../../../propuestas/simular'
import { crearEtiqueta, eliminarEtiqueta, etiquetaQueYaExiste, etiquetasDeVacantes, guardarEtiqueta, vacantesConEtiqueta, vacantesDeLaSesion } from './acciones'
import { useEstadoInicio } from './estado'

// Las etiquetas de las vacantes (las carpetas del producto), en un panel que sale de la tabla (8 oct, Nicolás: «deben
// estar afuera de crear una vacante y más atadas a la tabla»; «¿ya tienes la experiencia de cómo crear una etiqueta,
// cómo asociar una vacante con una etiqueta?»). Aquí se ven todas con cuántas vacantes las llevan, se crea una (sola o
// ya puesta en algunas), y al abrir una se renombra, se marcan o desmarcan sus vacantes, se ven en la tabla o se
// elimina. Crear y abrir una son vistas del mismo panel, con «←» para volver. Lo mismo, de a una o varias vacantes, se
// hace desde el «⋯» de la fila y desde la barra de las elegidas.

const MAX_NOMBRE = 40

const normal = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const cuantas = (n: number) => `${n} ${plural(n, 'vacante', 'vacantes')}`

export function PanelEtiquetas({
  abierto,
  onAbierto,
  onVerEnTabla,
}: {
  abierto: boolean
  onAbierto: (abierto: boolean) => void
  // Filtra la tabla por la etiqueta y cierra el panel.
  onVerEnTabla: (etiqueta: string) => void
}) {
  // Se vuelve a leer cuando cambia una etiqueta, aquí o desde la tabla.
  useEstadoInicio()
  const [busqueda, setBusqueda] = useState('')
  // Cada vez que se abre una vista empieza limpia: la vez va en su `key`.
  const [crear, setCrear] = useState({ abierta: false, nombre: '', vez: 0 })
  const [abierta, setAbierta] = useState({ etiqueta: '', abierta: false, vez: 0 })

  const todas = etiquetasDeVacantes()
  const visibles = todas.filter((etiqueta) => normal(etiqueta).includes(normal(busqueda)))
  const abrirCrear = (nombre = '') => setCrear((antes) => ({ abierta: true, nombre, vez: antes.vez + 1 }))

  const cambiar = (abrir: boolean) => {
    if (!abrir) {
      setBusqueda('')
      setCrear((antes) => ({ ...antes, abierta: false }))
      setAbierta((antes) => ({ ...antes, abierta: false }))
    }
    onAbierto(abrir)
  }

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={cambiar}
      size="md"
      icon={Tag01Icon}
      title="Etiquetas"
      description="Agrupan las vacantes para encontrarlas en la tabla."
      footer={
        <Button onClick={() => abrirCrear()}>
          <HugeiconsIcon icon={PlusSignIcon} size={16} aria-hidden="true" />
          Crear etiqueta
        </Button>
      }
    >
      {todas.length ? (
        <div className="flex flex-col gap-4">
          <InputGroup>
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} size={16} aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar una etiqueta" aria-label="Buscar una etiqueta" />
          </InputGroup>
          {visibles.length ? (
            <ItemGroup className="gap-2!">
              {visibles.map((etiqueta) => {
                const n = vacantesConEtiqueta(etiqueta).length
                return (
                  <Item
                    key={etiqueta}
                    variant="outline"
                    size="sm"
                    render={<button type="button" />}
                    className="w-full text-left hover:bg-accent/50"
                    onClick={() => setAbierta((antes) => ({ etiqueta, abierta: true, vez: antes.vez + 1 }))}
                    aria-label={`Abrir la etiqueta ${etiqueta}`}
                  >
                    <ItemMedia variant="icon">
                      <HugeiconsIcon icon={Tag01Icon} aria-hidden="true" />
                    </ItemMedia>
                    <ItemContent className="min-w-0!">
                      <ItemTitle className="w-full!">
                        <span className="truncate">{etiqueta}</span>
                      </ItemTitle>
                      <ItemDescription>{n ? `La ${n === 1 ? 'lleva' : 'llevan'} ${cuantas(n)}` : 'Ninguna vacante la lleva'}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" aria-hidden="true" />
                    </ItemActions>
                  </Item>
                )
              })}
            </ItemGroup>
          ) : (
            // Lo buscado no existe: se ofrece crearla con ese nombre.
            <div className="flex flex-col items-start gap-2">
              <Text as="p" variant="muted" size="sm">
                Ninguna etiqueta se llama así.
              </Text>
              <Button variant="outline" size="sm" onClick={() => abrirCrear(busqueda.trim())}>
                <HugeiconsIcon icon={PlusSignIcon} size={16} aria-hidden="true" />
                Crear «{busqueda.trim()}»
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Empty className="py-10">
          <EmptyHeader>
            {/* La carpeta «glass» (las etiquetas son las carpetas de las vacantes), no un icono de línea. */}
            <EmptyMedia variant="default">
              <ImagenGlass nombre="glass-folder" />
            </EmptyMedia>
            <EmptyTitle>Todavía no hay etiquetas</EmptyTitle>
            <EmptyDescription>Crea una para agrupar vacantes, como «Temporada fin de año» o «Reemplazos».</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => abrirCrear()}>
              <HugeiconsIcon icon={PlusSignIcon} size={16} aria-hidden="true" />
              Crear etiqueta
            </Button>
          </EmptyContent>
        </Empty>
      )}

      <VistaCrear key={`crear-${crear.vez}`} abierta={crear.abierta} nombreInicial={crear.nombre} onAbierta={(si) => setCrear((antes) => ({ ...antes, abierta: si }))} />
      {abierta.etiqueta ? (
        <VistaEtiqueta
          key={`${abierta.etiqueta}-${abierta.vez}`}
          etiqueta={abierta.etiqueta}
          abierta={abierta.abierta}
          onAbierta={(si) => setAbierta((antes) => ({ ...antes, abierta: si }))}
          onVerEnTabla={onVerEnTabla}
        />
      ) : null}
    </DrawerShell>
  )
}

/* Crear una ----------------------------------------------------------------------------------------------------------- */

function VistaCrear({ abierta, nombreInicial, onAbierta }: { abierta: boolean; nombreInicial: string; onAbierta: (abierta: boolean) => void }) {
  const [nombre, setNombre] = useState(nombreInicial)
  const [ids, setIds] = useState<string[]>([])
  const limpio = nombre.trim()
  const repetida = limpio ? etiquetaQueYaExiste(limpio) : undefined
  const error = repetida ? `Ya existe «${repetida}». Ábrela desde la lista o elige otro nombre.` : limpio.length > MAX_NOMBRE ? `Máximo ${MAX_NOMBRE} caracteres.` : ''

  const crear = () => {
    const elegidas = vacantesDeLaSesion().filter((vacante) => ids.includes(vacante.id))
    // Si no se guarda, la vista vuelve a abrirse con lo escrito.
    if (noSeGuardo(`crear-etiqueta:${limpio}:${ids.join(',')}`, `No pudimos crear «${limpio}»`, crear)) {
      onAbierta(true)
      return
    }
    const deshacer = crearEtiqueta(limpio, elegidas)
    notifyAction(
      `Creaste «${limpio}»`,
      elegidas.length ? `La ${elegidas.length === 1 ? 'lleva' : 'llevan'} ${cuantas(elegidas.length)}; ya sale en «Filtros».` : 'Ya sale en «Filtros». Ponla en vacantes desde aquí o desde la tabla.',
      { label: 'Deshacer', onClick: deshacer },
      'success',
    )
  }

  return (
    <VentanaDeAccion
      open={abierta}
      onOpenChange={onAbierta}
      title="Crear etiqueta"
      sub="Agrupa vacantes para encontrarlas en la tabla."
      note={ids.length ? `La llevarán ${cuantas(ids.length)}.` : 'Puedes ponerla en vacantes ahora o después.'}
      confirmLabel="Crear etiqueta"
      confirmDisabled={!limpio || Boolean(error)}
      pendingLabel="Creando…"
      onConfirm={crear}
    >
      <CampoNombre valor={nombre} onCambiar={setNombre} error={error} />
      <ElegirVacantes titulo="Ponla en estas vacantes" ayuda="Opcional. Se marca y se desmarca después igual." elegidas={ids} onCambiar={setIds} />
    </VentanaDeAccion>
  )
}

/* Abrir una ----------------------------------------------------------------------------------------------------------- */

function VistaEtiqueta({
  etiqueta,
  abierta,
  onAbierta,
  onVerEnTabla,
}: {
  etiqueta: string
  abierta: boolean
  onAbierta: (abierta: boolean) => void
  onVerEnTabla: (etiqueta: string) => void
}) {
  const llevan = vacantesConEtiqueta(etiqueta)
  const [nombre, setNombre] = useState(etiqueta)
  const [ids, setIds] = useState(() => llevan.map((vacante) => vacante.id))
  const [eliminando, setEliminando] = useState(false)
  const limpio = nombre.trim()
  const repetida = limpio && limpio !== etiqueta ? etiquetaQueYaExiste(limpio, etiqueta) : undefined
  const error = !limpio ? 'Escribe un nombre.' : repetida ? `Ya existe «${repetida}». Elige otro nombre.` : limpio.length > MAX_NOMBRE ? `Máximo ${MAX_NOMBRE} caracteres.` : ''
  const antes = llevan.map((vacante) => vacante.id)
  const entran = ids.filter((id) => !antes.includes(id)).length
  const salen = antes.filter((id) => !ids.includes(id)).length
  const renombrada = limpio !== etiqueta
  const hayCambios = renombrada || entran > 0 || salen > 0

  const guardar = () => {
    if (noSeGuardo(`guardar-etiqueta:${etiqueta}:${limpio}:${ids.join(',')}`, `No pudimos guardar «${etiqueta}»`, guardar)) {
      onAbierta(true)
      return
    }
    const deshacer = guardarEtiqueta(etiqueta, limpio, ids)
    const partes = [entran ? `entró en ${cuantas(entran)}` : '', salen ? `salió de ${cuantas(salen)}` : ''].filter(Boolean).join(' y ')
    notifyAction(
      renombrada ? `«${etiqueta}» ahora es «${limpio}»` : `Guardaste «${limpio}»`,
      partes ? `${partes[0].toUpperCase()}${partes.slice(1)}.` : `Cambia en las ${cuantas(ids.length)} que la llevan.`,
      { label: 'Deshacer', onClick: deshacer },
      'success',
    )
  }

  const eliminar = () => {
    if (noSeGuardo(`eliminar-etiqueta:${etiqueta}`, `No pudimos eliminar «${etiqueta}»`, eliminar, 'Sigue en sus vacantes.')) return
    const deshacer = eliminarEtiqueta(etiqueta)
    onAbierta(false)
    notifyAction(`Eliminaste «${etiqueta}»`, llevan.length ? `Salió de ${cuantas(llevan.length)}.` : 'Ninguna vacante la llevaba.', { label: 'Deshacer', onClick: deshacer }, 'success')
  }

  return (
    <VentanaDeAccion
      open={abierta}
      onOpenChange={onAbierta}
      title={etiqueta}
      sub={llevan.length ? `La ${llevan.length === 1 ? 'lleva' : 'llevan'} ${cuantas(llevan.length)}.` : 'Ninguna vacante la lleva todavía.'}
      note={hayCambios && !error ? [renombrada ? 'Cambia de nombre' : '', entran ? `entra en ${entran}` : '', salen ? `sale de ${salen}` : ''].filter(Boolean).join(', ').replace(/^./, (letra) => letra.toUpperCase()) + '.' : undefined}
      confirmLabel="Guardar cambios"
      confirmDisabled={!hayCambios || Boolean(error)}
      pendingLabel="Guardando…"
      onConfirm={guardar}
    >
      {llevan.length ? (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => {
            onAbierta(false)
            onVerEnTabla(etiqueta)
          }}
        >
          <HugeiconsIcon icon={FilterIcon} size={16} aria-hidden="true" />
          Ver sus vacantes en la tabla
        </Button>
      ) : null}
      <CampoNombre valor={nombre} onCambiar={setNombre} error={error} />
      <ElegirVacantes titulo="Vacantes que la llevan" elegidas={ids} onCambiar={setIds} />
      <Separator />
      <div className="flex flex-col items-start gap-2">
        <Text as="span" size="sm" weight="medium">
          Eliminar la etiqueta
        </Text>
        <Text as="p" variant="muted" size="sm">
          {llevan.length ? `Sale de las ${cuantas(llevan.length)} que la llevan; las vacantes no cambian en nada más.` : 'Ninguna vacante la lleva.'}
        </Text>
        <Button variant="destructive" size="sm" onClick={() => setEliminando(true)}>
          <HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden="true" />
          Eliminar la etiqueta
        </Button>
      </div>
      {/* Dentro de la vista: su «←» vuelve a la etiqueta, no a la lista. */}
      <DialogoConfirmar
        abierto={eliminando}
        onAbiertoChange={setEliminando}
        icono={Delete02Icon}
        titulo={`¿Eliminar «${etiqueta}»?`}
        descripcion={llevan.length ? `Sale de las ${cuantas(llevan.length)} que la llevan y deja de estar en «Filtros».` : 'Deja de estar en «Filtros».'}
        accion="Eliminar"
        destructiva
        enCurso="Eliminando…"
        onConfirmar={eliminar}
      />
    </VentanaDeAccion>
  )
}

/* Piezas -------------------------------------------------------------------------------------------------------------- */

function CampoNombre({ valor, onCambiar, error }: { valor: string; onCambiar: (valor: string) => void; error: string }) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor="etiqueta-nombre">Nombre</FieldLabel>
      <Input
        id="etiqueta-nombre"
        value={valor}
        onChange={(evento) => onCambiar(evento.target.value)}
        placeholder="Por ejemplo: Temporada fin de año"
        aria-invalid={error ? true : undefined}
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}

// Las vacantes para marcar: las que ya la llevan primero (como estaban al abrir: no saltan al marcar), con buscador.
function ElegirVacantes({ titulo, ayuda, elegidas, onCambiar }: { titulo: string; ayuda?: string; elegidas: string[]; onCambiar: (ids: string[]) => void }) {
  const [busqueda, setBusqueda] = useState('')
  const [orden] = useState<VacanteUI[]>(() => {
    const todas = vacantesDeLaSesion()
    return [...todas.filter((vacante) => elegidas.includes(vacante.id)), ...todas.filter((vacante) => !elegidas.includes(vacante.id))]
  })
  const texto = normal(busqueda)
  const visibles = orden.filter((vacante) => normal(`${vacante.titulo} ${vacante.area} ${vacante.sede}`).includes(texto))
  const alternar = (id: string) => onCambiar(elegidas.includes(id) ? elegidas.filter((otra) => otra !== id) : [...elegidas, id])

  return (
    <Field>
      <FieldLabel htmlFor="etiqueta-buscar-vacante">
        {titulo}
        {elegidas.length ? (
          <Text as="span" variant="muted" size="sm" weight="normal" className="tabular-nums">
            {elegidas.length} de {orden.length}
          </Text>
        ) : null}
      </FieldLabel>
      {ayuda ? <FieldDescription>{ayuda}</FieldDescription> : null}
      <InputGroup>
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} size={16} aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput id="etiqueta-buscar-vacante" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Cargo, área o sede" />
      </InputGroup>
      {visibles.length ? (
        <ItemGroup className="gap-1!">
          {visibles.map((vacante) => {
            const elegida = elegidas.includes(vacante.id)
            return (
              <Item key={vacante.id} size="sm" variant={elegida ? 'outline' : 'default'} render={<label />} className="cursor-pointer">
                <ItemMedia className="h-6">
                  <Checkbox checked={elegida} onCheckedChange={() => alternar(vacante.id)} aria-label={`Elegir ${vacante.titulo}`} />
                </ItemMedia>
                <ItemContent className="min-w-0!">
                  <ItemTitle className="w-full!">
                    <span className="truncate">{vacante.titulo}</span>
                  </ItemTitle>
                  <ItemDescription className="truncate">
                    {vacante.area} · {vacante.estado === 'Publicada' && vacante.oculta ? 'Oculta del portal' : vacante.estado}
                  </ItemDescription>
                </ItemContent>
              </Item>
            )
          })}
        </ItemGroup>
      ) : (
        <Text as="p" variant="muted" size="sm">
          Ninguna vacante coincide.
        </Text>
      )}
    </Field>
  )
}
