import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Mic01Icon, PlayIcon, StopIcon, UserIcon } from '@hugeicons/core-free-icons'
import {
  Avatar as AvatarUi,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  Heading,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Switch,
  Text,
  cn,
} from '@ubits/flux-ui'
import { BotonIa } from '@/shared/components/BotonIa'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import {
  CANVAS_CORPORATIVO,
  ESTILOS,
  PAISES_VOZ,
  VOCES,
  admiteAvatar,
  avatarPorId,
  avataresDe,
  categoriasPorGenero,
  estiloPorId,
  fotoAvatar,
  imagenPack,
  nombreSector,
  tituloVoz,
  vozPorId,
  type EstiloId,
  type Genero,
  type Voz,
} from './datos'
import { Diapositiva, Escalado } from './lienzo'
import { useMuestra } from './piezas'
import { BotonMuestra } from '@/modules/admin/aprendizaje/lms-creator/compartido/boton-muestra'
import { ActionDialog } from '@/shared/components/ActionDialog'

// Los selectores del setup y del editor: estilo visual, voz y avatar. Cada uno es una tarjeta con lo elegido y una
// ventana con las opciones (ActionDialog, la única ventana del sistema: decisión 4 de la auditoría, 5-oct); las
// opciones son tarjetas de selección (RadioGroup dentro de FieldLabel, como en /design-system/formularios).
//
// El campo de voz es **uno solo** para el video y para el personaje del roleplay (decisión 21): la misma tarjeta, la
// misma ventana, el mismo catálogo de voces (`datos.ts`) y el mismo reproductor de muestra (`useMuestra`).

// Tarjeta que se abre entera: el clic en cualquier parte abre su modal. El chevrón sigue siendo el botón (con su nombre
// para el lector de pantalla y el teclado); lo que tenga acción propia, como escuchar la voz, no deja pasar su clic.
const TARJETA_CLIC = 'cursor-pointer transition-colors hover:bg-muted/50'

// ── Estilo visual ────────────────────────────────────────────────────────────────────────────────────────────────

/** Miniatura de un estilo: la escena 1 del pack; Corporativo, la portada de canvas (para no confundirlo con la foto). */
export function MiniaturaEstilo({ estilo, className }: { estilo: EstiloId; className?: string }) {
  if (estilo === 'corporativa') {
    return (
      <Escalado className={cn('rounded-md', className)}>
        <Diapositiva plantilla="intro" campos={CANVAS_CORPORATIVO[1].campos} imagen={imagenPack('fotografia', 1)} />
      </Escalado>
    )
  }
  return <img src={imagenPack(estilo, 1)} alt="" className={cn('aspect-video w-full rounded-md object-cover', className)} />
}

export function CampoEstilo({ valor, onValor, deshabilitado }: { valor: EstiloId; onValor: (e: EstiloId) => void; deshabilitado?: boolean }) {
  const [abierto, setAbierto] = useState(false)
  const estilo = estiloPorId(valor)
  return (
    <Field>
      <FieldLabel>Estilo visual</FieldLabel>
      <Item variant="outline" className={cn('items-center', TARJETA_CLIC, deshabilitado && 'pointer-events-none')} onClick={() => setAbierto(true)}>
        <ItemMedia className="w-24 shrink-0">
          <MiniaturaEstilo estilo={valor} className="border" />
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle>{estilo.label}</ItemTitle>
          <ItemDescription>{estilo.descripcion}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <BotonIcono aria-label="Elegir estilo visual" disabled={deshabilitado}>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </BotonIcono>
        </ItemActions>
      </Item>
      <ModalEstilo abierto={abierto} valor={valor} onCerrar={() => setAbierto(false)} onGuardar={onValor} />
    </Field>
  )
}

function ModalEstilo({ abierto, valor, onCerrar, onGuardar }: { abierto: boolean; valor: EstiloId; onCerrar: () => void; onGuardar: (e: EstiloId) => void }) {
  const [eleccion, setEleccion] = useState(valor)
  useEffect(() => {
    if (abierto) setEleccion(valor)
  }, [abierto, valor])
  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      size="wide"
      title="Estilo visual"
      dismissible={false}
      footer={
        <>
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onGuardar(eleccion)
              onCerrar()
            }}
          >
            Guardar
          </Button>
        </>
      }
    >
      <RadioGroup value={eleccion} onValueChange={(v) => setEleccion(v as EstiloId)} className="grid grid-cols-2 gap-3 min-[901px]:grid-cols-3" aria-label="Estilo visual">
        {ESTILOS.map((e) => (
          <FieldLabel key={e.id} htmlFor={`estilo-${e.id}`}>
            <Field className="gap-2">
              <MiniaturaEstilo estilo={e.id} />
              <div className="flex items-start gap-2">
                <FieldContent>
                  <FieldTitle>{e.label}</FieldTitle>
                  <FieldDescription>{e.descripcion}</FieldDescription>
                </FieldContent>
                <RadioGroupItem value={e.id} id={`estilo-${e.id}`} />
              </div>
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </ActionDialog>
  )
}

// ── Voz ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Las banderas que hay en public/images/banderas: las mismas del editor de AI Studio (14-oct). */
const CON_BANDERA = new Set(['ar', 'cl', 'co', 'do', 'ec', 'mx', 'pe'])

/**
 * La bandera del país en un círculo, como en el editor de AI Studio (Dave, 14-oct), con sus mismas imágenes. Un país
 * sin imagen enseña su código, como allá. `lg` (32 px) para el campo grande del setup; `sm` (16 px) para todo lo
 * compacto —el botón de voz del editor, las listas, los grupos por país—, que gana alto.
 */
export function BanderaRedonda({ codigo, tam = 'sm' }: { codigo: string; tam?: 'sm' | 'md' | 'lg' }) {
  const lado = tam === 'lg' ? 'size-8' : tam === 'md' ? 'size-5.5' : 'size-4'
  return (
    <span aria-hidden="true" className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border', lado)}>
      {CON_BANDERA.has(codigo) ? (
        <img src={`/images/banderas/${codigo}.svg`} alt="" draggable={false} className="size-full object-cover" />
      ) : (
        <Text as="span" size="xs" weight="semibold" className="text-[0.55em] leading-none">
          {codigo.toUpperCase()}
        </Text>
      )}
    </span>
  )
}

function Bandera({ voz, tam = 'md' }: { voz: Voz; tam?: 'sm' | 'md' | 'lg' }) {
  return <BanderaRedonda codigo={voz.codigo} tam={tam} />
}

/**
 * Tarjeta de la voz: bandera, «Voz femenina», país, escuchar y elegir. La usan el setup del video («Voz del video») y
 * los dos roleplays («Voz del personaje»): al elegir una voz en la ventana queda seleccionada de una vez.
 */
export function CampoVoz({
  valor,
  onValor,
  deshabilitado,
  etiqueta = 'Voz del video',
}: {
  valor: string
  onValor: (id: string) => void
  deshabilitado?: boolean
  etiqueta?: string
}) {
  const [abierto, setAbierto] = useState(false)
  const voz = vozPorId(valor)
  const muestra = useMuestra()
  return (
    <Field>
      <FieldLabel>{etiqueta}</FieldLabel>
      <Item variant="outline" className={cn('items-center', TARJETA_CLIC, deshabilitado && 'pointer-events-none')} onClick={() => setAbierto(true)}>
        <ItemMedia>
          <Bandera voz={voz} tam="lg" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{tituloVoz(voz)}</ItemTitle>
          <ItemDescription>{voz.pais}</ItemDescription>
        </ItemContent>
        <ItemActions>
          {/* Escuchar tiene su propia acción: no abre el modal. */}
          <BotonMuestra
            disponible={Boolean(voz.muestra)}
            sonando={muestra.sonando === voz.muestra}
            onAlternar={() => muestra.alternar(voz.muestra)}
            etiqueta="Escuchar muestra"
          />
          <BotonIcono aria-label="Elegir voz" disabled={deshabilitado}>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </BotonIcono>
        </ItemActions>
      </Item>
      <ModalVoz
        abierto={abierto}
        titulo={etiqueta}
        modo="setup"
        valor={valor}
        onCerrar={() => {
          muestra.detener()
          setAbierto(false)
        }}
        onElegir={onValor}
      />
    </Field>
  )
}

/**
 * La misma voz, pero **sin ventana**: un desplegable con las voces agrupadas por país y el botón de escuchar al lado,
 * igual que la voz de «Video Avatar IA». Es la que va dentro de una ventana —el setup del roleplay—, porque la tarjeta
 * de arriba abre otra ventana y eso sería una encima de otra. Un desplegable es un globo flotante, no una ventana
 * (Dave, 5-oct; traído aquí para que siga habiendo un solo catálogo de voces, decisión 21).
 */
export function CampoVozCompacto({
  valor,
  onValor,
  etiqueta = 'Voz del personaje',
  id = 'voz-compacta',
}: {
  valor: string
  onValor: (id: string) => void
  etiqueta?: string
  id?: string
}) {
  const voz = vozPorId(valor)
  const muestra = useMuestra()
  const sonando = Boolean(voz.muestra) && muestra.sonando === voz.muestra
  return (
    <Field>
      <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
      <div className="flex items-center gap-2">
        <Select
          value={valor}
          onValueChange={(v) => {
            if (!v) return
            muestra.detener()
            onValor(String(v))
          }}
        >
          <SelectTrigger id={id} className="min-w-0 flex-1">
            <SelectValue>{(elegido: string) => <OpcionVoz voz={vozPorId(elegido)} />}</SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {PAISES_VOZ.map((pais) => {
              const voces = VOCES.filter((v) => v.pais === pais)
              return (
                <SelectGroup key={pais}>
                  <SelectLabel>
                    <span className="flex items-center gap-1.5">
                      <BanderaRedonda codigo={voces[0]?.codigo ?? ''} /> {pais}
                    </span>
                  </SelectLabel>
                  {voces.map((v) => (
                    <SelectItem key={v.id} value={v.id} disabled={!v.disponible}>
                      <OpcionVoz voz={v} conPais={false} />
                    </SelectItem>
                  ))}
                </SelectGroup>
              )
            })}
          </SelectContent>
        </Select>
        {/* Con su texto y del alto del desplegable (lg, 40 px): es el campo principal de la fila, y ahí el icono suelto
            no se lee como «escuchar» (Dave, 5-oct). */}
        <Button
          variant="outline"
          size="lg"
          className="shrink-0"
          disabled={!voz.muestra}
          aria-label={sonando ? 'Detener la muestra' : `Escuchar la ${tituloVoz(voz).toLowerCase()} de ${voz.pais}`}
          onClick={() => muestra.alternar(voz.muestra)}
        >
          <HugeiconsIcon icon={sonando ? StopIcon : PlayIcon} aria-hidden="true" />
          {sonando ? 'Detener' : 'Escuchar'}
        </Button>
      </div>
    </Field>
  )
}

// La voz en el desplegable, con la misma etiqueta que la «Voz de Serena» de Selección: una sola línea con la bandera,
// el tipo de voz y, en gris, el país. Va en una línea y no en dos para que el disparador mida lo mismo que el botón de
// escuchar que lleva al lado. El código de idioma (es-CO) no se enseña: no le dice nada a quien crea el contenido.
export function OpcionVoz({ voz, conPais = true }: { voz: Voz; conPais?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <BanderaRedonda codigo={voz.codigo} />
      <Text as="span" size="sm" weight="medium" className="shrink-0">
        {tituloVoz(voz)}
      </Text>
      {conPais ? (
        <Text as="span" size="sm" variant="muted" className="truncate">
          {voz.pais}
        </Text>
      ) : null}
      {voz.disponible ? null : (
        <Badge variant="secondary" size="xs" className="shrink-0">
          Pronto
        </Badge>
      )}
    </span>
  )
}

type ModalVozProps = {
  abierto: boolean
  titulo: string
  /** setup: elegir aplica de una vez; escena: se aplica al generar el audio. */
  modo: 'setup' | 'escena'
  valor: string
  onCerrar: () => void
  onElegir: (id: string) => void
  /** Solo en modo escena: «Generar audio» o «Regenerar audio». */
  accion?: string
}

export function ModalVoz({ abierto, titulo, modo, valor, onCerrar, onElegir, accion = 'Generar audio' }: ModalVozProps) {
  const [pais, setPais] = useState('todos')
  const [eleccion, setEleccion] = useState(valor)
  const muestra = useMuestra()

  useEffect(() => {
    if (abierto) {
      setEleccion(valor)
      setPais('todos')
    }
  }, [abierto, valor])

  const cerrar = () => {
    muestra.detener()
    onCerrar()
  }
  const elegir = (id: string) => {
    setEleccion(id)
    if (modo === 'setup') onElegir(id)
  }
  const paises = pais === 'todos' ? PAISES_VOZ : [pais]

  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) cerrar()
      }}
      size="wide"
      title={titulo}
      dismissible={false}
      footer={
        modo === 'setup' ? (
          <Button onClick={cerrar}>Listo</Button>
        ) : (
          <>
            <Button variant="outline" onClick={cerrar}>
              Cancelar
            </Button>
            <BotonIa
              size="sm"
              onClick={() => {
                onElegir(eleccion)
                cerrar()
              }}
            >
              {accion}
            </BotonIa>
          </>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 min-[901px]:flex-row min-[901px]:items-center">
          <Text as="p" size="sm" variant="muted" className="flex flex-1 items-center gap-2">
            <HugeiconsIcon icon={Mic01Icon} size={16} aria-hidden="true" />
            {modo === 'setup' ? 'Al hacer clic en una voz ya queda seleccionada.' : 'Elige una voz y regenera el audio para aplicar el cambio.'}
          </Text>
          <Select value={pais} onValueChange={(v) => setPais(String(v))}>
            <SelectTrigger size="sm" className="w-56" aria-label="País">
              <SelectValue>{(v) => (v === 'todos' ? 'Todos los países' : String(v))}</SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value="todos">Todos los países</SelectItem>
              {PAISES_VOZ.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <RadioGroup value={eleccion} onValueChange={(v) => elegir(String(v))} aria-label={titulo} className="flex flex-col gap-5">
          {paises.map((p) => {
            const voces = VOCES.filter((v) => v.pais === p)
            return (
              <section key={p} className="flex flex-col gap-2">
                <Heading as="h3" level={6} className="flex items-center gap-2">
                  <BanderaRedonda codigo={voces[0]?.codigo ?? ''} tam="md" />
                  {p}
                </Heading>
                <div className="grid gap-2 sm:grid-cols-2">
                  {voces.map((v) => (
                    <FieldLabel key={v.id} htmlFor={`voz-${modo}-${v.id}`}>
                      <Field orientation="horizontal" data-disabled={v.disponible ? undefined : 'true'} className="items-center">
                        <Bandera voz={v} />
                        <FieldContent>
                          <FieldTitle className="flex-wrap gap-1.5">
                            {tituloVoz(v)}
                            {/* Sin el código de idioma (es-CO): no le dice nada a quien crea el contenido, y el país
                                ya está en la descripción y en la cabecera del grupo. */}
                            {v.disponible ? null : (
                              <Badge variant="secondary" size="xs">
                                Próximamente
                              </Badge>
                            )}
                          </FieldTitle>
                          <FieldDescription>{v.pais}</FieldDescription>
                        </FieldContent>
                        {v.disponible ? (
                          <BotonMuestra
                            disponible={Boolean(v.muestra)}
                            sonando={muestra.sonando === v.muestra}
                            onAlternar={() => muestra.alternar(v.muestra)}
                            etiqueta={`Escuchar muestra · ${tituloVoz(v)} · ${v.pais}`}
                          />
                        ) : null}
                        <RadioGroupItem value={v.id} id={`voz-${modo}-${v.id}`} disabled={!v.disponible} />
                      </Field>
                    </FieldLabel>
                  ))}
                </div>
              </section>
            )
          })}
        </RadioGroup>
      </div>
    </ActionDialog>
  )
}

/** Botón de voz de una escena (tarjeta del guion en el editor): bandera, «Voz femenina», país. */
export function BotonVoz({ voz, onClick, deshabilitado }: { voz: Voz; onClick: () => void; deshabilitado?: boolean }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={deshabilitado} aria-label={`Voz de esta escena: ${tituloVoz(voz)}, ${voz.pais}`}>
      <BanderaRedonda codigo={voz.codigo} />
      {tituloVoz(voz)}
      <Text as="span" size="xs" variant="muted">
        {voz.pais}
      </Text>
      <HugeiconsIcon icon={ArrowRight01Icon} size={14} aria-hidden="true" />
    </Button>
  )
}

// ── Avatar ───────────────────────────────────────────────────────────────────────────────────────────────────────

function FotoAvatar({ id }: { id: number | null }) {
  const avatar = avatarPorId(id)
  return (
    <AvatarUi size="lg">
      {avatar ? <AvatarImage src={fotoAvatar(avatar)} alt="" /> : null}
      <AvatarFallback>
        <HugeiconsIcon icon={UserIcon} size={18} aria-hidden="true" />
      </AvatarFallback>
    </AvatarUi>
  )
}

type CampoAvatarProps = {
  valor: number | null
  estilo: EstiloId
  sector: string
  genero: Genero
  onValor: (id: number | null) => void
  deshabilitado?: boolean
}

/** «Avatar del video» (opcional) del setup: apagado por defecto y solo con Corporativo o Fotografía Real. */
export function CampoAvatar({ valor, estilo, sector, genero, onValor, deshabilitado }: CampoAvatarProps) {
  const [abierto, setAbierto] = useState(false)
  const admite = admiteAvatar(estilo)
  const avatar = avatarPorId(valor)
  const interruptor = (
    <Switch
      checked={valor != null}
      disabled={!admite || deshabilitado}
      aria-label="Usar avatar en el video"
      onCheckedChange={(prendido) => {
        if (!prendido) return onValor(null)
        onValor(avataresDe(sector, genero)[0]?.id ?? avataresDe('staff', genero)[0].id)
        setAbierto(true)
      }}
    />
  )
  return (
    <Field>
      <FieldLabel>
        Avatar del video
        <Badge variant="secondary" size="xs">
          Opcional
        </Badge>
      </FieldLabel>
      <FieldDescription>
        {admite
          ? 'Se usará en las escenas con presentador. Solo en Corporativo y Fotografía Real.'
          : 'Solo disponible con estilo Corporativo o Fotografía Real, para que coincida con el look del video.'}
      </FieldDescription>
      <Item variant="outline" className="items-center">
        <ItemMedia>
          <FotoAvatar id={valor} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{avatar ? avatar.nombre : 'Ninguno'}</ItemTitle>
          {avatar ? <ItemDescription>{nombreSector(avatar.sector)}</ItemDescription> : null}
        </ItemContent>
        <ItemActions>
          {admite ? (
            interruptor
          ) : (
            <Hint label="Cambia el estilo visual a Corporativo o Fotografía Real para activar el avatar.">
              <span className="inline-flex">{interruptor}</span>
            </Hint>
          )}
          {avatar ? (
            <Hint label="Elegir avatar">
              <BotonIcono aria-label="Elegir avatar" disabled={deshabilitado} onClick={() => setAbierto(true)}>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </BotonIcono>
            </Hint>
          ) : null}
        </ItemActions>
      </Item>
      <ModalAvatar abierto={abierto} valor={valor} genero={genero} onCerrar={() => setAbierto(false)} onGuardar={(id) => onValor(id)} />
    </Field>
  )
}

/** Tarjeta del avatar de una escena en el inspector del editor. */
export function TarjetaAvatarEscena({ id, onElegir, deshabilitado }: { id: number; onElegir: () => void; deshabilitado?: boolean }) {
  const avatar = avatarPorId(id)
  return (
    <Item variant="outline" size="sm" className="items-center">
      <ItemMedia>
        <FotoAvatar id={id} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{avatar?.nombre ?? 'Avatar'}</ItemTitle>
        <ItemDescription>{avatar ? nombreSector(avatar.sector) : ''}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Hint label="Elegir avatar">
          <BotonIcono aria-label="Elegir avatar" disabled={deshabilitado} onClick={onElegir}>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </BotonIcono>
        </Hint>
      </ItemActions>
    </Item>
  )
}

type ModalAvatarProps = {
  abierto: boolean
  valor: number | null
  genero: Genero
  onCerrar: () => void
  onGuardar: (id: number, aTodas: boolean) => void
  /** En el editor, con más de una escena con avatar: «Aplicar a todas las escenas con avatar». */
  conAplicarATodas?: boolean
}

export function ModalAvatar({ abierto, valor, genero, onCerrar, onGuardar, conAplicarATodas }: ModalAvatarProps) {
  const [industria, setIndustria] = useState('all')
  const [eleccion, setEleccion] = useState<number | null>(valor)
  const [aTodas, setATodas] = useState(true)
  const categorias = categoriasPorGenero(genero)

  useEffect(() => {
    if (!abierto) return
    setEleccion(valor)
    setIndustria('all')
    setATodas(true)
  }, [abierto, valor])

  const lista = avataresDe(industria, genero)

  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      size="wide"
      title="Avatar del video"
      dismissible={false}
      footer={
        <>
          {/* `order-first`: la casilla va a la izquierda del pie, antes del hueco que deja la nota vacía. */}
          {conAplicarATodas ? (
            <div className="order-first flex items-center gap-2">
              <Checkbox id="avatar-a-todas" checked={aTodas} onCheckedChange={(v) => setATodas(Boolean(v))} />
              <Label htmlFor="avatar-a-todas">Aplicar a todas las escenas con avatar</Label>
            </div>
          ) : null}
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            disabled={eleccion == null}
            onClick={() => {
              if (eleccion != null) onGuardar(eleccion, conAplicarATodas ? aTodas : false)
              onCerrar()
            }}
          >
            Guardar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 min-[901px]:flex-row min-[901px]:items-center">
          <Text as="p" size="sm" variant="muted" className="flex-1">
            Estos son los avatares que coinciden con la voz seleccionada.
          </Text>
          <Select value={industria} onValueChange={(v) => setIndustria(String(v))}>
            <SelectTrigger size="sm" className="w-64" aria-label="Industria">
              <SelectValue>
                {(v) => {
                  const c = categorias.find((x) => x.id === v)
                  return c ? `${c.label} (${c.cantidad})` : ''
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label} ({c.cantidad})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <RadioGroup
          value={eleccion != null ? String(eleccion) : ''}
          onValueChange={(v) => setEleccion(Number(v))}
          aria-label="Avatar del video"
          className="grid grid-cols-2 gap-3 min-[901px]:grid-cols-4"
        >
          {lista.map((a) => (
            <FieldLabel key={a.id} htmlFor={`avatar-${a.id}`}>
              <Field className="gap-2">
                <img src={fotoAvatar(a)} alt="" className="aspect-square w-full rounded-md object-cover" />
                <div className="flex items-start gap-2">
                  <FieldContent>
                    <FieldTitle>{a.nombre}</FieldTitle>
                    <FieldDescription>{nombreSector(a.sector)}</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={String(a.id)} id={`avatar-${a.id}`} />
                </div>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </div>
    </ActionDialog>
  )
}
