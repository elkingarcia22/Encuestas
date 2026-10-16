import { useEffect, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete02Icon,
  DragDropVerticalIcon,
  LayerBringToFrontIcon,
  LayerSendToBackIcon,
  MoreVerticalIcon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  FieldLabel,
  Heading,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Sortable,
  SortableItem,
  SortableItemHandle,
  Text,
  Textarea,
  cn,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { notifyAction } from '@/shared/components/notify'
import { SelectorColor } from '@/modules/design-system/formularios/selector-color'
import { ICONO_CAPA } from './iconos-capa'
import {
  CAPAS_PARA_AGREGAR,
  ESTILOS_TEXTO,
  FONDOS,
  NOMBRE_CAPA,
  RELLENOS,
  ajustarCaja,
  capaNueva,
  moverCapa,
  resumenCapa,
  type Caja,
  type Capa,
  type EstiloTexto,
  type FondoCanvas,
  type RellenoForma,
  type TipoCapa,
} from '../capas'

// Fondo y capas del canvas en Propiedades, como en el editor de AI Studio (el jefe de Dave, 14-oct): el fondo, la lista
// de capas (de la de adelante a la del fondo, que es como se leen), que se reordena arrastrando o con su «⋯», los botones
// para agregar una, y los campos de la capa elegida con su rotación (la posición y el tamaño, en la vista previa).
//
// Borrar una capa no pregunta: es un cambio simple, y el aviso trae «Deshacer» (regla de confirmaciones del 8-oct).

function Rotulo({ children }: { children: ReactNode }) {
  return (
    <Heading as="h3" level={6}>
      {children}
    </Heading>
  )
}

type Props = {
  capas: Capa[]
  fondo: FondoCanvas
  /** El acento de la escena, para el color que toma por defecto un texto o una forma. */
  foto: string
  elegida: string | null
  onElegir: (id: string | null) => void
  onCapas: (capas: Capa[]) => void
  onFondo: (fondo: FondoCanvas) => void
}

/** El fondo de la escena. */
export function CampoFondo({ fondo, onFondo }: Pick<Props, 'fondo' | 'onFondo'>) {
  return (
    <Field>
      <FieldLabel htmlFor="canvas-fondo">Fondo</FieldLabel>
      <Select value={fondo} onValueChange={(v) => onFondo(v as FondoCanvas)}>
        <SelectTrigger id="canvas-fondo" className="w-full">
          <SelectValue>{(v: FondoCanvas) => FONDOS.find((f) => f.id === v)?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {FONDOS.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

/** La lista de capas y los botones para agregar una. */
export function ListaCapas({ capas, foto, elegida, onElegir, onCapas }: Omit<Props, 'fondo' | 'onFondo'>) {
  // Se ven de la de adelante a la del fondo, como en cualquier editor; la lista guardada va al revés (la última se
  // pinta encima).
  const enOrden = [...capas].reverse()
  const indice = (id: string) => capas.findIndex((c) => c.id === id)

  const borrar = (id: string) => {
    const antes = capas
    const capa = capas.find((c) => c.id === id)
    onCapas(capas.filter((c) => c.id !== id))
    if (elegida === id) onElegir(null)
    notifyAction(`Se quitó la capa ${capa ? NOMBRE_CAPA[capa.tipo].toLowerCase() : ''}`.trim(), 'Puedes recuperarla con «Deshacer».', { label: 'Deshacer', onClick: () => onCapas(antes) }, 'info')
  }

  // Lo que oyen los lectores de pantalla al reordenar: en español y con el nombre de la capa, no con su id interno.
  const nombre = (id: unknown) => {
    const capa = capas.find((c) => c.id === id)
    return capa ? `la capa ${NOMBRE_CAPA[capa.tipo].toLowerCase()}${resumenCapa(capa) ? ` «${resumenCapa(capa)}»` : ''}` : 'la capa'
  }
  const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)
  const anuncios = {
    screenReaderInstructions: { draggable: 'Para mover una capa, pulsa la barra espaciadora o Intro. Muévela con las flechas y vuelve a pulsar para soltarla; Escape cancela.' },
    announcements: {
      onDragStart: ({ active }: { active: { id: unknown } }) => `Moviendo ${nombre(active.id)}.`,
      onDragOver: ({ active, over }: { active: { id: unknown }; over: { id: unknown } | null }) => mayuscula(over ? `${nombre(active.id)} va sobre ${nombre(over.id)}.` : `${nombre(active.id)} está fuera de la lista.`),
      onDragEnd: ({ active, over }: { active: { id: unknown }; over: { id: unknown } | null }) => mayuscula(over ? `${nombre(active.id)} quedó en su nuevo lugar.` : 'La capa volvió a su lugar.'),
      onDragCancel: ({ active }: { active: { id: unknown } }) => `Se canceló. ${nombre(active.id)} volvió a su lugar.`,
    },
  }

  const agregar = (tipo: TipoCapa) => {
    const nueva = capaNueva(tipo, foto, capas.filter((c) => !c.dePlantilla).length)
    onCapas([...capas, nueva])
    onElegir(nueva.id)
  }

  return (
    <section className="flex flex-col gap-2" aria-label="Capas">
      <div className="flex items-baseline justify-between gap-2">
        <Rotulo>Capas ({capas.length})</Rotulo>
        <Text as="span" size="xs" variant="muted">
          Arrastra para reordenar
        </Text>
      </div>
      {capas.length ? (
        <Sortable
          value={enOrden}
          getItemValue={(c) => c.id}
          onValueChange={(lista) => onCapas([...lista].reverse())}
          accessibility={anuncios}
          className="flex flex-col gap-0.5"
        >
          {enOrden.map((capa) => {
            const esElegida = capa.id === elegida
            const resumen = resumenCapa(capa)
            const i = indice(capa.id)
            return (
              <SortableItem key={capa.id} value={capa.id}>
                <div
                  className={cn('group/capa flex items-center gap-1.5 rounded-md py-1 pr-1 pl-0.5', esElegida ? 'bg-primary/10' : 'hover:bg-muted')}
                  aria-current={esElegida ? 'true' : undefined}
                >
                  <SortableItemHandle aria-label={`Reordenar la capa ${NOMBRE_CAPA[capa.tipo].toLowerCase()}`} className="flex shrink-0 items-center text-muted-foreground">
                    <HugeiconsIcon icon={DragDropVerticalIcon} size={14} aria-hidden="true" />
                  </SortableItemHandle>
                  {/* La fila entera elige la capa. */}
                  <Button variant="ghost" size="sm" className="h-7 min-w-0 flex-1 justify-start gap-1.5 px-1" onClick={() => onElegir(capa.id)}>
                    <HugeiconsIcon icon={ICONO_CAPA[capa.tipo]} size={14} aria-hidden="true" className={esElegida ? 'text-primary' : 'text-muted-foreground'} />
                    <Text as="span" size="xs" weight="medium" className={cn('shrink-0', esElegida && 'text-primary')}>
                      {NOMBRE_CAPA[capa.tipo]}
                    </Text>
                    {resumen ? (
                      <Text as="span" size="xs" variant="muted" className="min-w-0 truncate">
                        · {resumen}
                      </Text>
                    ) : null}
                  </Button>
                  <DropdownMenu>
                    <Hint label="Opciones de la capa">
                      <DropdownMenuTrigger render={<BotonIcono size="icon-xs" aria-label={`Opciones de la capa ${NOMBRE_CAPA[capa.tipo].toLowerCase()}`} />}>
                        <HugeiconsIcon icon={MoreVerticalIcon} size={14} />
                      </DropdownMenuTrigger>
                    </Hint>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuGroup>
                        <DropdownMenuItem disabled={i === capas.length - 1} onClick={() => onCapas(moverCapa(capas, capa.id, capas.length - 1))}>
                          <HugeiconsIcon icon={LayerBringToFrontIcon} size={16} aria-hidden="true" />
                          Traer al frente
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={i === capas.length - 1} onClick={() => onCapas(moverCapa(capas, capa.id, i + 1))}>
                          <HugeiconsIcon icon={ArrowUp01Icon} size={16} aria-hidden="true" />
                          Subir una
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={i === 0} onClick={() => onCapas(moverCapa(capas, capa.id, i - 1))}>
                          <HugeiconsIcon icon={ArrowDown01Icon} size={16} aria-hidden="true" />
                          Bajar una
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={i === 0} onClick={() => onCapas(moverCapa(capas, capa.id, 0))}>
                          <HugeiconsIcon icon={LayerSendToBackIcon} size={16} aria-hidden="true" />
                          Enviar al fondo
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem variant="destructive" onClick={() => borrar(capa.id)}>
                          <HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden="true" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </SortableItem>
            )
          })}
        </Sortable>
      ) : (
        <Text as="p" size="sm" variant="muted">
          La escena no tiene capas. Agrega una abajo.
        </Text>
      )}
      <div className="flex flex-wrap gap-1.5 border-t pt-2" aria-label="Agregar una capa">
        {CAPAS_PARA_AGREGAR.map((tipo) => (
          <Hint key={tipo} label={`Agregar ${NOMBRE_CAPA[tipo].toLowerCase()}`}>
            <Button variant="outline" size="xs" aria-label={`Agregar ${NOMBRE_CAPA[tipo].toLowerCase()}`} onClick={() => agregar(tipo)}>
              <HugeiconsIcon icon={PlusSignIcon} size={12} aria-hidden="true" />
              <HugeiconsIcon icon={ICONO_CAPA[tipo]} size={14} aria-hidden="true" />
            </Button>
          </Hint>
        ))}
      </div>
    </section>
  )
}

/** Un número de la caja: se escribe libre y se guarda al salir o con Intro. */
function CampoNumero({ id, etiqueta, valor, onCambio }: { id: string; etiqueta: string; valor: number; onCambio: (n: number) => void }) {
  const [texto, setTexto] = useState(String(valor))
  useEffect(() => setTexto(String(valor)), [valor])
  const guardar = () => {
    const n = Number(texto.replace(',', '.'))
    if (Number.isFinite(n) && n !== valor) onCambio(n)
    else setTexto(String(valor))
  }
  return (
    <Field className="gap-1.5!">
      <FieldLabel htmlFor={id} className="text-xs">
        {etiqueta}
      </FieldLabel>
      <Input id={id} inputMode="decimal" value={texto} onChange={(e) => setTexto(e.target.value)} onBlur={guardar} onKeyDown={(e) => e.key === 'Enter' && guardar()} className="h-8 tabular-nums" />
    </Field>
  )
}

/** Un color propio con su vuelta al que pone la escena. */
function CampoColorCapa({ id, etiqueta, valor, porDefecto, onCambio }: { id: string; etiqueta: string; valor?: string; porDefecto: string; onCambio: (color: string | undefined) => void }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
      {/* Sin color propio, la muestra enseña el que tiene de verdad (el de su relleno o el que le toca por el fondo); con
          él, el botón de restablecer del campo lo devuelve. */}
      <SelectorColor
        id={id}
        valor={valor ?? porDefecto}
        onCambio={onCambio}
        etiqueta={etiqueta}
        onRestablecer={valor ? () => onCambio(undefined) : undefined}
        etiquetaRestablecer="Usar el color de la escena"
      />
    </Field>
  )
}

/** Los campos de la capa elegida: los de su tipo y su rotación. */
export function PropiedadesCapa({
  capa,
  colorPorDefecto,
  onCambio,
  onSubirImagen,
}: {
  capa: Capa
  /** El color que tiene la capa sin color propio (hex sin `#`). */
  colorPorDefecto: string
  onCambio: (cambio: Partial<Capa>) => void
  onSubirImagen: () => void
}) {
  const caja = (cambio: Partial<Caja>) => onCambio({ caja: ajustarCaja({ ...capa.caja, ...cambio }) })
  const id = (campo: string) => `capa-${capa.id}-${campo}`

  let campos: ReactNode = null
  switch (capa.tipo) {
    case 'texto':
      campos = (
        <>
          <Field>
            <FieldLabel htmlFor={id('estilo')}>Estilo</FieldLabel>
            <Select value={capa.estilo ?? 'cuerpo'} onValueChange={(v) => onCambio({ estilo: v as EstiloTexto })}>
              <SelectTrigger id={id('estilo')} className="w-full">
                <SelectValue>{(v: EstiloTexto) => ESTILOS_TEXTO.find((e) => e.id === v)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ESTILOS_TEXTO.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={id('texto')}>Contenido</FieldLabel>
            <Textarea id={id('texto')} rows={3} value={capa.texto ?? ''} onChange={(e) => onCambio({ texto: e.target.value })} />
          </Field>
          <CampoColorCapa id={id('color')} etiqueta="Color del texto" valor={capa.color} porDefecto={colorPorDefecto} onCambio={(color) => onCambio({ color })} />
        </>
      )
      break
    case 'imagen':
      campos = (
        <Field>
          <FieldLabel>Imagen</FieldLabel>
          <div className="flex items-center gap-3">
            {capa.src ? <img src={capa.src} alt="" className="h-12 w-20 shrink-0 rounded-md border object-cover" /> : null}
            <Button variant="outline" size="sm" onClick={onSubirImagen}>
              Cambiar imagen
            </Button>
          </div>
        </Field>
      )
      break
    case 'forma':
      campos = (
        <>
          <Field>
            <FieldLabel htmlFor={id('relleno')}>Relleno</FieldLabel>
            {/* Con un color elegido a mano, el relleno lo dice: seguir mostrando «Color de acento» con la forma roja engañaba. */}
            <Select value={capa.color ? 'propio' : (capa.relleno ?? 'acento')} onValueChange={(v) => v !== 'propio' && onCambio({ relleno: v as RellenoForma, color: undefined })}>
              <SelectTrigger id={id('relleno')} className="w-full">
                <SelectValue>{(v: string) => (v === 'propio' ? 'Color propio' : RELLENOS.find((r) => r.id === v)?.label)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {RELLENOS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
                {capa.color ? (
                  <SelectItem value="propio" disabled>
                    Color propio
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </Field>
          <CampoColorCapa id={id('color')} etiqueta="Color de la forma" valor={capa.color} porDefecto={colorPorDefecto} onCambio={(color) => onCambio({ color })} />
        </>
      )
      break
    case 'badge':
      campos = (
        <>
          <Field>
            <FieldLabel htmlFor={id('titulo')}>Título</FieldLabel>
            <Input id={id('titulo')} value={capa.titulo ?? ''} onChange={(e) => onCambio({ titulo: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor={id('subtitulo')}>Subtítulo</FieldLabel>
            <Input id={id('subtitulo')} value={capa.subtitulo ?? ''} onChange={(e) => onCambio({ subtitulo: e.target.value })} />
          </Field>
        </>
      )
      break
    case 'lista':
      campos = (
        <Field>
          <FieldLabel htmlFor={id('items')}>Puntos, uno por línea</FieldLabel>
          <Textarea id={id('items')} rows={4} value={(capa.items ?? []).join('\n')} onChange={(e) => onCambio({ items: e.target.value.split('\n') })} />
        </Field>
      )
      break
    case 'dato':
      campos = (
        <>
          <Field>
            <FieldLabel htmlFor={id('valor')}>Valor</FieldLabel>
            <Input id={id('valor')} value={capa.valor ?? ''} onChange={(e) => onCambio({ valor: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor={id('etiqueta')}>Etiqueta</FieldLabel>
            <Input id={id('etiqueta')} value={capa.etiqueta ?? ''} onChange={(e) => onCambio({ etiqueta: e.target.value })} />
          </Field>
        </>
      )
      break
    case 'cita':
      campos = (
        <>
          <Field>
            <FieldLabel htmlFor={id('cita')}>Cita</FieldLabel>
            <Textarea id={id('cita')} rows={3} value={capa.cita ?? ''} onChange={(e) => onCambio({ cita: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor={id('autor')}>Autor</FieldLabel>
            <Input id={id('autor')} value={capa.autor ?? ''} onChange={(e) => onCambio({ autor: e.target.value })} />
          </Field>
        </>
      )
      break
    case 'agenda':
      campos = (
        <Field>
          <FieldLabel htmlFor={id('agenda')}>Bloques, uno por línea (título: descripción)</FieldLabel>
          <Textarea
            id={id('agenda')}
            rows={4}
            value={(capa.agenda ?? []).map((b) => `${b.titulo}: ${b.desc}`).join('\n')}
            onChange={(e) =>
              onCambio({
                agenda: e.target.value.split('\n').map((linea) => {
                  const [titulo, ...resto] = linea.split(':')
                  return { titulo: titulo.trim(), desc: resto.join(':').trim() }
                }),
              })
            }
          />
        </Field>
      )
      break
  }

  return (
    <section className="flex flex-col gap-3" aria-label={`Capa ${NOMBRE_CAPA[capa.tipo].toLowerCase()}`}>
      <Rotulo>Capa · {NOMBRE_CAPA[capa.tipo]}</Rotulo>
      {campos}
      {/* Sin X, Y, ancho ni alto en números: la capa se mueve y se escala en la vista previa (Dave, 14-oct). */}
      {/* La rotación con su número al lado: solo con la barra costaba volver a 0° (33 px de arrastre eran 48°). */}
      <div className="grid grid-cols-[1fr_5rem] items-end gap-3">
        <Field>
          <FieldLabel htmlFor={id('rot-barra')}>Rotación</FieldLabel>
          <Slider
            id={id('rot-barra')}
            aria-label="Rotación en grados"
            min={-180}
            max={180}
            value={capa.caja.rot}
            onValueChange={(v) => caja({ rot: Array.isArray(v) ? (v[0] ?? 0) : v })}
            className="h-8"
          />
        </Field>
        <CampoNumero id={id('rot')} etiqueta="Grados" valor={capa.caja.rot} onCambio={(rot) => caja({ rot })} />
      </div>
    </section>
  )
}
