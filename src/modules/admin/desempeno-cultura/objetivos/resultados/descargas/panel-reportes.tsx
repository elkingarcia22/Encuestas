import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Download04Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  FramePanel,
  IconTile,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Hint } from '@/shared/components/Hint'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { FILA_CLICABLE, FilasSeparadas, MarcoLista } from '../../../encuestas/components/marco-lista'
import { FilaBloque, ListaDescargas, SelectorVarios } from '../../../encuestas/resultados/descargas/panel-piezas'
import { BLOQUES_CARTA, TIPOS_REPORTE, personasDelPedido, tipoReporte, type Alcance, type BloqueCarta, type PedidoReporte, type TipoReporte } from '../../modelo/descargas/tipos'
import { CORTES, type Corte } from '../../modelo/resultados/lecturas'
import type { ResultadosCiclo } from '../../modelo/resultados/seguimiento'
import type { CentroDescargasCiclo } from './use-descargas-ciclo'

// «Reportes del ciclo» (21-oct, del prototipo), con el armado del panel de descargas de Encuestas: dos pestañas,
// «Reportes» para dar forma al próximo archivo y «Descargas» para seguir lo ya pedido. Cada sección es un marco gris
// con su lista; lo que falta para descargar lo dice el botón apagado en su globo.

export type PestanaReportes = 'reportes' | 'descargas'

const ALCANCES: readonly { id: Alcance; titulo: string; descripcion: string }[] = [
  { id: 'todos', titulo: 'Todo el ciclo', descripcion: 'Todas las personas del ciclo.' },
  { id: 'personas', titulo: 'Unas personas', descripcion: 'Elige a quién, una por una.' },
  { id: 'grupos', titulo: 'Uno o varios grupos', descripcion: 'Un corte del directorio: área, líder, país…' },
]

const alternar = <T,>(conjunto: ReadonlySet<T>, valor: T): ReadonlySet<T> => {
  const siguiente = new Set(conjunto)
  if (siguiente.has(valor)) siguiente.delete(valor)
  else siguiente.add(valor)
  return siguiente
}

function useFormulario({ r, corteInicial, personasIniciales, centro, onDescargar }: { r: ResultadosCiclo; corteInicial: Corte; personasIniciales: readonly string[]; centro: CentroDescargasCiclo; onDescargar: () => void }) {
  const [tipo, setTipo] = useState<TipoReporte>(personasIniciales.length > 0 ? 'individual' : 'detalle')
  const [alcance, setAlcance] = useState<Alcance>(personasIniciales.length > 0 ? 'personas' : 'todos')
  const [personas, setPersonas] = useState<ReadonlySet<string>>(new Set(personasIniciales))
  const [corte, setCorte] = useState<Corte>(corteInicial)
  const [grupos, setGrupos] = useState<ReadonlySet<string>>(new Set())
  const [porNivel, setPorNivel] = useState(false)
  const [niveles, setNiveles] = useState<ReadonlySet<string>>(new Set())
  const [bloques, setBloques] = useState<ReadonlySet<BloqueCarta>>(new Set(BLOQUES_CARTA.map((bloque) => bloque.id)))

  const opcionesPersonas = useMemo(() => r.personas.map((persona) => ({ id: persona.id, label: persona.colaborador.name })), [r.personas])
  const opcionesGrupos = useMemo(() => [...new Set(r.personas.map((persona) => persona.colaborador[corte] ?? 'Sin líder'))].sort((a, b) => a.localeCompare(b, 'es')).map((grupo) => ({ id: grupo, label: grupo })), [r.personas, corte])
  const opcionesNiveles = r.niveles.map((nivel) => ({ id: nivel.id, label: nivel.etiqueta }))

  const pedido: PedidoReporte = {
    tipo,
    alcance,
    personas: [...personas],
    corte,
    grupos: [...grupos],
    niveles: porNivel ? [...niveles] : [],
    bloques: BLOQUES_CARTA.map((bloque) => bloque.id).filter((id) => bloques.has(id)),
  }
  const entran = personasDelPedido(r, pedido)
  const objetivos = entran.reduce((suma, persona) => suma + persona.objetivos.length, 0)
  const formato = tipoReporte(tipo).formato

  const motivo =
    alcance === 'personas' && personas.size === 0
      ? 'Elige al menos una persona.'
      : alcance === 'grupos' && grupos.size === 0
        ? 'Elige al menos un grupo.'
        : porNivel && niveles.size === 0
          ? 'Elige al menos un nivel.'
          : tipo === 'individual' && bloques.size === 0
            ? 'Enciende al menos un bloque de la hoja.'
            : entran.length === 0
              ? 'Con estas opciones no queda nadie en el reporte.'
              : null

  const cuenta = tipo === 'detalle' ? `${objetivos.toLocaleString('es-CO')} ${objetivos === 1 ? 'fila' : 'filas'} (una por objetivo)` : tipo === 'individual' ? `${entran.length.toLocaleString('es-CO')} ${entran.length === 1 ? 'hoja' : 'hojas'} (una por persona)` : `${entran.length.toLocaleString('es-CO')} ${entran.length === 1 ? 'persona' : 'personas'}`

  const descargar = () => {
    if (motivo) return
    centro.iniciar(pedido)
    onDescargar()
  }
  const boton = (
    <Button onClick={descargar} disabled={Boolean(motivo)}>
      <HugeiconsIcon icon={Download04Icon} aria-hidden="true" />
      Descargar {formato === 'PDF' ? 'PDF' : 'Excel'}
    </Button>
  )

  return {
    pie: motivo ? (
      // Un botón apagado no recibe el cursor: el globo va en un envoltorio que sí lo recibe (y el foco del teclado).
      <Hint label={motivo} side="left">
        <span tabIndex={0} className="inline-flex">
          {boton}
        </span>
      </Hint>
    ) : (
      boton
    ),
    cuerpo: (
      <>
        <MarcoLista titulo="Tipo de reporte" descripcion="Elige qué archivo quieres generar de este ciclo.">
          {/* Relleno del panel forzado con «!»: el tema de la librería va sin capa y la clase sola no gana. Ficha: diferencias.json › frame-panel-relleno-no-se-quita. */}
          <FramePanel className="py-1!">
            <RadioGroup value={tipo} onValueChange={(valor) => setTipo(valor as TipoReporte)} aria-label="Tipo de reporte">
              <FilasSeparadas>
                {TIPOS_REPORTE.map((opcion) => (
                  <Item key={opcion.id} size="sm" render={<label htmlFor={`reporte-${opcion.id}`} />} className={FILA_CLICABLE}>
                    <RadioGroupItem value={opcion.id} id={`reporte-${opcion.id}`} />
                    <ItemMedia>
                      <IconTile variant="soft" size="sm">
                        <HugeiconsIcon icon={opcion.icono} aria-hidden="true" />
                      </IconTile>
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle>
                        {opcion.titulo}
                        <Badge variant="outline" size="xs">
                          {opcion.formato === 'PDF' ? 'PDF' : 'Excel'}
                        </Badge>
                      </ItemTitle>
                      <ItemDescription>{opcion.descripcion}</ItemDescription>
                    </ItemContent>
                  </Item>
                ))}
              </FilasSeparadas>
            </RadioGroup>
          </FramePanel>
        </MarcoLista>

        <MarcoLista titulo="A quién cubre" descripcion="Por defecto, todo el ciclo.">
          {/* Relleno del panel forzado con «!»: ficha diferencias.json › frame-panel-relleno-no-se-quita. */}
          <FramePanel className="py-1!">
            <RadioGroup value={alcance} onValueChange={(valor) => setAlcance(valor as Alcance)} aria-label="A quién cubre">
              <FilasSeparadas>
                {ALCANCES.map((opcion) => (
                  <div key={opcion.id} className="flex flex-col gap-3 py-3">
                    <FieldLabel htmlFor={`alcance-${opcion.id}`}>
                      <Field orientation="horizontal">
                        <RadioGroupItem value={opcion.id} id={`alcance-${opcion.id}`} />
                        <FieldContent>
                          <FieldTitle>{opcion.titulo}</FieldTitle>
                          <FieldDescription>{opcion.descripcion}</FieldDescription>
                        </FieldContent>
                      </Field>
                    </FieldLabel>
                    {alcance === 'personas' && opcion.id === 'personas' ? (
                      <SelectorVarios id="reporte-personas" opciones={opcionesPersonas} valor={personas} onCambio={setPersonas} placeholder="Busca por nombre" error={personas.size === 0} />
                    ) : null}
                    {alcance === 'grupos' && opcion.id === 'grupos' ? (
                      <div className="flex flex-col gap-2">
                        <Select
                          value={corte}
                          onValueChange={(valor) => {
                            setCorte(valor as Corte)
                            setGrupos(new Set())
                          }}
                        >
                          <SelectTrigger aria-label="Corte del directorio">
                            <SelectValue>{(valor: string) => CORTES.find((opcion) => opcion.value === valor)?.label}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {CORTES.map((opcion) => (
                              <SelectItem key={opcion.value} value={opcion.value}>
                                {opcion.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <SelectorVarios id="reporte-grupos" opciones={opcionesGrupos} valor={grupos} onCambio={setGrupos} placeholder="Elige grupos" error={grupos.size === 0} />
                      </div>
                    ) : null}
                  </div>
                ))}
              </FilasSeparadas>
            </RadioGroup>
          </FramePanel>
        </MarcoLista>

        <MarcoLista titulo="Quiénes entran" descripcion="Apagado, entran las personas de todos los niveles.">
          {/* Relleno del panel forzado con «!»: ficha diferencias.json › frame-panel-relleno-no-se-quita. */}
          <FramePanel className="py-1!">
            <FilasSeparadas>
              <FilaBloque
                id="por-nivel"
                titulo="Filtrar por nivel de desempeño"
                descripcion="Solo las personas de los niveles que elijas."
                activo={porNivel}
                onActivo={setPorNivel}
                avisoVacio="Elige al menos un nivel: así el reporte saldría vacío."
                selector={{ opciones: opcionesNiveles, valor: niveles, onCambio: setNiveles, placeholder: 'Elige niveles' }}
              />
            </FilasSeparadas>
          </FramePanel>
        </MarcoLista>

        {tipo === 'individual' ? (
          <MarcoLista titulo="Bloques de la hoja" descripcion="Los datos de la persona y del ciclo van siempre: son el documento.">
            {/* Relleno del panel forzado con «!»: ficha diferencias.json › frame-panel-relleno-no-se-quita. */}
            <FramePanel className="py-1!">
              <FilasSeparadas>
                {BLOQUES_CARTA.map((bloque) => (
                  <FilaBloque key={bloque.id} id={`bloque-${bloque.id}`} titulo={bloque.titulo} descripcion={bloque.descripcion} activo={bloques.has(bloque.id)} onActivo={() => setBloques(alternar(bloques, bloque.id))} />
                ))}
              </FilasSeparadas>
            </FramePanel>
          </MarcoLista>
        ) : null}

        <Alert variant="info">
          <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
          <AlertDescription>{motivo ?? `El reporte lleva ${cuenta}.`}</AlertDescription>
        </Alert>
      </>
    ),
  }
}

type Props = {
  abierto: boolean
  onAbierto: (abierto: boolean) => void
  pestana: PestanaReportes
  onPestana: (pestana: PestanaReportes) => void
  r: ResultadosCiclo
  corte: Corte
  personasIniciales: readonly string[]
  centro: CentroDescargasCiclo
}

/** Cada vez que se abre con otras personas ya elegidas («Exportar seleccionados»), el formulario arranca de nuevo. */
export function PanelReportes(props: Props) {
  return <Panel key={props.personasIniciales.join(',')} {...props} />
}

function Panel({
  abierto,
  onAbierto,
  pestana,
  onPestana,
  r,
  corte,
  personasIniciales,
  centro,
}: Props) {
  const formulario = useFormulario({ r, corteInicial: corte, personasIniciales, centro, onDescargar: () => onPestana('descargas') })
  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbierto}
      size="md"
      icon={Download04Icon}
      title="Reportes del ciclo"
      description="Configura y descarga el avance de este ciclo"
      footer={
        pestana === 'reportes' ? (
          formulario.pie
        ) : (
          <Button variant="outline" onClick={() => onAbierto(false)}>
            Seguir en segundo plano
          </Button>
        )
      }
    >
      <Tabs value={pestana} onValueChange={(valor) => onPestana(valor as PestanaReportes)} className="flex flex-col gap-5">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="reportes" className="flex-none">
            Reportes
          </TabsTrigger>
          <TabsTrigger value="descargas" className="flex-none">
            Descargas
            {centro.preparando > 0 ? (
              <Badge variant="primary-light" size="xs" className="tabular-nums">
                {centro.preparando}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="reportes" className="flex flex-col gap-6">
          {formulario.cuerpo}
        </TabsContent>
        <TabsContent value="descargas">
          <ListaDescargas
            entradas={centro.entradas.map((entrada) => ({ id: entrada.id, kind: entrada.tipo, fileName: entrada.archivo, status: entrada.estado === 'lista' ? 'ready' : 'preparing', progress: entrada.avance, delivered: entrada.entregado }))}
            tipoDe={(entrada) => {
              const tipo = tipoReporte(entrada.kind as TipoReporte)
              return { title: tipo.titulo, icon: tipo.icono }
            }}
            onEntregar={centro.entregar}
            vacio="Los reportes que pidas aparecen aquí."
          />
        </TabsContent>
      </Tabs>
    </DrawerShell>
  )
}
