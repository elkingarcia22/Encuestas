import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, PencilEdit02Icon } from '@hugeicons/core-free-icons'
import { Accordion, Button, Frame, Heading, IconTile, Switch, Text } from '@ubits/flux-ui'
import { Marco } from '@/modules/design-system/patrones/ficha'
import { Badge } from '@/shared/components/Badge'
import { EdicionEnLinea } from '@/shared/components/EdicionEnLinea'
import { SinResultados } from '@/shared/components/SinResultados'
import { FilaElegible, ListaElegible } from '@/modules/design-system/listas/lista-elegible'
import { pagina } from '@/modules/design-system/templates/admin-compartido/lista'
import { plural } from '@/modules/design-system/patrones/formato'
import { ContenedorDesplegable } from '@/modules/admin/desempeno-cultura/encuestas/crear/components/participantes/contenedor-desplegable'
import { ACTIVOS, nombreCompleto, useGrupos } from './grupos-datos'
import { ListaParticipantes, SIN_SELECCION, itemsEnArchivo, type SeleccionParticipantes } from './panel-participantes'
import { PERSONAS_EMPRESA, TIPOS, aTodaLaEmpresa, conArchivo, conGrupos, miembrosDe, type Asignacion, type TipoPlan } from './planes-datos'

// Paso 2 · A quiénes: arma UNA asignación a la vez (la actual). Mismos contenedores que el paso «Participantes» de
// Encuestas (Elkin): «Toda la empresa» con su interruptor y, debajo, los acordeones «Por grupos», «Por persona» y «Desde
// un archivo», con lo elegido como fichas que se quitan con su «x» encima de cada lista. Todo se suma sin repetir a nadie;
// el pie dice cuántas personas son y de dónde sale cada parte.
//
// Cómo se guarda en la asignación (planes-datos): los grupos en `destinatarios`, las personas sumadas una a una en
// `sumadas` y quien se deja fuera de su grupo en `fuera`. El archivo reemplaza a los grupos (así lo hace UBITS).

const ARCHIVO = 'participantes-plan.csv'
const MAS_FICHAS = 12
const n = (cuantas: number) => cuantas.toLocaleString('es-CO')
const personas = (cuantas: number) => `${n(cuantas)} ${plural(cuantas, 'persona', 'personas')}`

// Con el conteo al día (lo leen la lista de planes y el panel del plan).
const contada = (asignacion: Asignacion): Asignacion => ({ ...asignacion, personas: miembrosDe(asignacion).length })

// Lo elegido, encima de la lista: una ficha por grupo o persona que se quita con su «x» (las Fichas de Participantes).
function Fichas({ etiqueta, items }: { etiqueta: string; items: { id: string; texto: string; onQuitar: () => void }[] }) {
  if (!items.length) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-(--frame-panel-header-px)">
      <Text as="span" size="sm" variant="muted">
        {etiqueta}
      </Text>
      {items.slice(0, MAS_FICHAS).map((item) => (
        <Button key={item.id} variant="secondary" size="xs" onClick={item.onQuitar} aria-label={`Quitar ${item.texto}`}>
          {item.texto}
          <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
        </Button>
      ))}
      {items.length > MAS_FICHAS ? (
        <Text as="span" size="sm" variant="muted">
          y {n(items.length - MAS_FICHAS)} más
        </Text>
      ) : null}
    </div>
  )
}

export function PasoQuienes({
  asignacion,
  numero,
  tipo,
  planNombre,
  conErrores,
  onCambio,
}: {
  asignacion: Asignacion
  numero: number
  tipo: TipoPlan
  planNombre: string
  conErrores: boolean
  onCambio: (asignacion: Asignacion) => void
}) {
  const grupos = useGrupos()
  const textos = TIPOS[tipo]
  const empresa = asignacion.alcance === 'empresa'
  const archivo = asignacion.alcance === 'archivo'
  const elegidos = useMemo(() => (asignacion.alcance === 'grupos' ? asignacion.destinatarios : []), [asignacion])
  const total = miembrosDe(asignacion).length

  // Lo que había antes de encender «Toda la empresa», para devolverlo al apagarla (como en Encuestas).
  const [guardado, setGuardado] = useState<Asignacion | null>(null)
  // El acordeón abierto: arranca en el que ya trae algo.
  const [abiertas, setAbiertas] = useState<string[]>(() => (archivo ? ['archivo'] : elegidos.length ? ['grupos'] : asignacion.sumadas?.length ? ['personas'] : ['grupos']))
  // La subida del archivo mientras corre; al terminar, la asignación queda «desde archivo».
  const [subida, setSubida] = useState<SeleccionParticipantes['archivo']>('idle')

  // Quién está por la base (grupos, archivo o empresa) y por qué grupo, para decirlo en «Por persona».
  const base = useMemo(() => new Set(miembrosDe({ ...asignacion, sumadas: [], fuera: [] })), [asignacion])
  const grupoDe = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const nombre of elegidos) for (const id of grupos.find((g) => g.nombre === nombre)?.integrantes ?? []) if (!mapa.has(id)) mapa.set(id, nombre)
    return mapa
  }, [elegidos, grupos])
  const miembros = new Set(miembrosDe(asignacion))
  const sumadas = asignacion.sumadas ?? []
  const fuera = new Set(asignacion.fuera ?? [])

  const cambiar = (siguiente: Asignacion) => onCambio(contada(siguiente))

  const cambiarEmpresa = (activa: boolean) => {
    if (activa) {
      setGuardado(asignacion)
      return cambiar(aTodaLaEmpresa(asignacion))
    }
    cambiar(guardado ? { ...guardado, nombre: asignacion.nombre, items: asignacion.items, habilidades: asignacion.habilidades } : { ...asignacion, alcance: 'colaboradores', destinatarios: [], sumadas: [], fuera: [] })
    setGuardado(null)
  }

  // ── Grupos ──
  const alternarGrupo = (nombre: string) => cambiar(conGrupos(asignacion, elegidos.includes(nombre) ? elegidos.filter((g) => g !== nombre) : [...elegidos, nombre]))

  // ── Personas ──
  // Marcar a alguien: si estaba fuera de su grupo, vuelve; si no, se suma una a una. Desmarcar: si se sumó a mano, sale de
  // la lista; si entró por un grupo (o por toda la empresa), queda fuera de esta asignación y el grupo sigue elegido.
  const alternarPersona = (id: string) => {
    if (miembros.has(id)) {
      return cambiar({ ...asignacion, sumadas: sumadas.filter((x) => x !== id), fuera: base.has(id) ? [...fuera, id] : [...fuera] })
    }
    const vuelve = fuera.has(id) && base.has(id)
    cambiar({ ...asignacion, sumadas: vuelve ? sumadas : [...sumadas, id], fuera: [...fuera].filter((x) => x !== id) })
  }

  // ── Archivo ──
  const valorArchivo: SeleccionParticipantes = { ...SIN_SELECCION, archivo: archivo ? 'done' : subida }
  const cambiarArchivo = (valor: SeleccionParticipantes) => {
    if (valor.archivo === 'done') {
      setSubida('idle')
      const conItems = asignacion.items.length ? asignacion.items : itemsEnArchivo(tipo)
      return cambiar({ ...conArchivo(asignacion, ARCHIVO, 42), items: conItems })
    }
    if (valor.archivo === 'idle' && archivo) cambiar({ ...asignacion, alcance: 'colaboradores', destinatarios: [], sumadas: [], fuera: [] })
    setSubida(valor.archivo)
  }

  // ── Nombres sugeridos, según a quiénes les llega ──
  const sugerencias = [
    ...(empresa ? ['Toda la empresa'] : elegidos.length ? [elegidos.length > 2 ? `${elegidos.slice(0, 2).join(' y ')} y ${elegidos.length - 2} más` : elegidos.join(' y ')] : []),
    ...elegidos.flatMap((g) => {
      const mes = g.match(/cohorte\s+(\w+)/i)?.[1]
      return mes ? [`Nuevos de ${mes}`] : []
    }),
    ...(planNombre.trim() && total ? [`${planNombre.trim()} · ${personas(total)}`] : []),
  ]
    .filter((s, i, todas) => todas.indexOf(s) === i)
    .slice(0, 3)

  // ── El pie: cuántas son y de dónde sale cada parte ──
  const deGrupos = elegidos.length ? [...base].filter((id) => !fuera.has(id)).length : 0
  const unaAUna = sumadas.filter((id) => !base.has(id)).length
  const dejadas = [...fuera].filter((id) => base.has(id)).length
  const desglose = empresa
    ? ['toda la empresa']
    : [
        elegidos.length ? `${personas(deGrupos)} de ${elegidos.length} ${plural(elegidos.length, 'grupo', 'grupos')}` : '',
        archivo ? `${personas(base.size - dejadas)} del archivo` : '',
        unaAUna ? `${personas(unaAUna)} ${plural(unaAUna, 'elegida', 'elegidas')} una a una` : '',
      ].filter(Boolean)

  return (
    <div className="flex flex-col gap-4">
      {/* La ficha de la asignación: su número, a cuántas personas les llega y su nombre, que se escribe encima. */}
      <FichaAsignacion asignacion={asignacion} numero={numero} total={total} sugerencias={sugerencias} onNombre={(nombre) => onCambio({ ...asignacion, nombre })} />

      <div className="flex flex-col gap-1 pt-2">
        <Heading as="h2" level={6}>
          A quiénes les llega
        </Heading>
        <Text as="p" size="sm" variant="muted">
          Puedes combinar grupos, personas sueltas o un archivo.
        </Text>
      </div>

      {/* «Toda la empresa»: el contenedor con interruptor de Participantes. Al encenderla no hay nada más que elegir. */}
      <Marco
        titulo="Toda la empresa"
        descripcion={`Las ${n(PERSONAS_EMPRESA)} personas que hoy están en la plataforma, y quien entre mientras el plan esté vigente. No hay que elegir nada más.`}
        accion={<Switch id="quienes-empresa" checked={empresa} onCheckedChange={cambiarEmpresa} aria-label="Toda la empresa" className="shrink-0" />}
      >
        {null}
      </Marco>

      <Accordion value={abiertas} onValueChange={(valor) => setAbiertas(valor as string[])} className="gap-4">
        <ContenedorDesplegable
          id="grupos"
          titulo="Por grupos"
          detalle={empresa ? 'Al elegir un grupo, la asignación deja de ir a toda la empresa.' : 'Un grupo entra completo y se mantiene al día: quien entre al grupo después, también lo recibe.'}
          conteo={empresa ? undefined : elegidos.length ? `${elegidos.length}/${grupos.length} · ${personas(deGrupos)}` : `0/${grupos.length} elegidos`}
        >
          <ListaGrupos elegidos={elegidos} onAlternar={alternarGrupo} />
        </ContenedorDesplegable>

        <ContenedorDesplegable
          id="personas"
          titulo="Por persona"
          detalle="Busca y marca a quien quieras, una a una. Quien entró por un grupo ya sale marcado; desmarcarlo lo deja fuera de esta asignación."
          conteo={empresa ? undefined : unaAUna ? `${personas(unaAUna)} ${plural(unaAUna, 'elegida', 'elegidas')}` : 'Ninguna elegida'}
        >
          <ListaPersonas miembros={miembros} sumadas={sumadas} base={base} fuera={fuera} grupoDe={grupoDe} empresa={empresa} onAlternar={alternarPersona} />
        </ContenedorDesplegable>

        <ContenedorDesplegable
          id="archivo"
          titulo="Desde un archivo"
          detalle={`Un CSV con las personas y sus ${textos.items}. Reemplaza a los grupos elegidos.`}
          conteo={archivo ? personas(base.size) : undefined}
        >
          <div className="px-(--frame-panel-header-px)">
            <ListaParticipantes modo="archivo" tipo={tipo} valor={valorArchivo} onCambio={cambiarArchivo} />
          </div>
        </ContenedorDesplegable>
      </Accordion>

      <Text as="p" size="sm" variant={conErrores && total === 0 ? 'destructive' : 'muted'} role={conErrores && total === 0 ? 'alert' : undefined} aria-live="polite">
        {total === 0
          ? 'Todavía no le llega a nadie: enciende toda la empresa, elige grupos o personas, o carga un archivo.'
          : `Suman ${personas(total)}: ${desglose.join(', ')}${dejadas && !empresa ? `, sin ${n(dejadas)} que dejaste fuera` : ''}${desglose.length > 1 ? ', sin repetir a nadie' : ''}.`}
      </Text>
    </div>
  )
}

// La ficha de la asignación, arriba del paso: el número en su recuadro, «ASIGNACIÓN 1 · 48 PERSONAS» y el nombre como un
// título que se escribe encima (EdicionEnLinea, el patrón de títulos editables del sistema; el lápiz aparece al pasar).
// Debajo, nombres sugeridos según a quiénes les llega. El fondo es un degradado suave del color primario sobre el marco.
function FichaAsignacion({
  asignacion,
  numero,
  total,
  sugerencias,
  onNombre,
}: {
  asignacion: Asignacion
  numero: number
  total: number
  sugerencias: string[]
  onNombre: (nombre: string) => void
}) {
  return (
    <Frame className="bg-linear-to-br from-primary/12 via-primary/5 to-transparent">
      <div className="flex items-start gap-4 px-(--frame-panel-header-px) py-(--frame-panel-header-py)">
        <IconTile variant="soft" size="lg" className="shrink-0">
          <Text as="span" size="lg" weight="semibold" className="tabular-nums">
            {numero}
          </Text>
        </IconTile>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Text as="p" size="xs" variant="muted" weight="medium" className="tracking-wide uppercase tabular-nums">
            Asignación {numero} · {total ? personas(total) : 'sin personas todavía'}
          </Text>
          <div className="group flex min-w-0 items-center gap-2">
            <Heading as="h2" level={4} className="min-w-0 flex-1">
              <EdicionEnLinea valor={asignacion.nombre ?? ''} onCambiar={onNombre} etiqueta={`Nombre de la asignación ${numero}`} marcador='Ponle un nombre, por ejemplo "Líderes nuevos"' maxCaracteres={60} />
            </Heading>
            <HugeiconsIcon icon={PencilEdit02Icon} size={16} className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" aria-hidden="true" />
          </div>
          {sugerencias.length ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Text as="span" size="sm" variant="muted">
                Sugerencias:
              </Text>
              {sugerencias.map((sugerencia) => (
                <Button key={sugerencia} variant="outline" size="xs" onClick={() => onNombre(sugerencia)}>
                  {sugerencia}
                </Button>
              ))}
            </div>
          ) : null}
          <Text as="p" size="sm" variant="muted">
            Así la verás en el avance y en los reportes. Si no le pones nombre, se llama por sus grupos.
          </Text>
        </div>
      </div>
    </Frame>
  )
}

// Los grupos de Planes de formación, en la lista para elegir de Participantes (filas de una línea).
function ListaGrupos({ elegidos, onAlternar }: { elegidos: string[]; onAlternar: (nombre: string) => void }) {
  const grupos = useGrupos()
  const [busqueda, setBusqueda] = useState('')
  const [soloElegidos, setSoloElegidos] = useState(false)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(20)
  if (soloElegidos && !elegidos.length) setSoloElegidos(false)
  const q = busqueda.trim().toLowerCase()
  const resultado = grupos.filter((g) => (!q || `${g.nombre} ${g.descripcion}`.toLowerCase().includes(q)) && (!soloElegidos || elegidos.includes(g.nombre)))
  const visibles = pagina(resultado, actual, porPagina)
  const enPagina = visibles.filter((g) => elegidos.includes(g.nombre)).length
  const todaLaPagina = visibles.length > 0 && enPagina === visibles.length
  const alternarPagina = () => visibles.filter((g) => elegidos.includes(g.nombre) === todaLaPagina).forEach((g) => onAlternar(g.nombre))

  return (
    <div className="flex flex-col gap-4">
      <Fichas etiqueta="Elegidos:" items={elegidos.map((nombre) => ({ id: nombre, texto: nombre, onQuitar: () => onAlternar(nombre) }))} />
      <ListaElegible
        id="plan-grupos"
        nombre="grupos"
        herramientasEnCabecera
        titulo={{ texto: 'Grupos' }}
        buscador={{
          valor: busqueda,
          placeholder: 'Busca un grupo',
          onValor: (valor) => {
            setBusqueda(valor)
            setActual(1)
          },
        }}
        herramientas={
          <Button variant={soloElegidos ? 'secondary' : 'outline'} aria-pressed={soloElegidos} onClick={() => setSoloElegidos(!soloElegidos)}>
            {soloElegidos ? 'Ver todos los grupos' : `Ver elegidos (${elegidos.length})`}
          </Button>
        }
        casillaPagina={{ marcada: todaLaPagina, parcial: enPagina > 0 && !todaLaPagina, onCambio: alternarPagina, etiqueta: 'Marcar los grupos de esta página' }}
        paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: resultado.length }}
        vacio={
          <SinResultados
            busqueda={busqueda}
            filtrosActivos={soloElegidos ? 1 : 0}
            onLimpiar={() => {
              setBusqueda('')
              setSoloElegidos(false)
            }}
          />
        }
      >
        {visibles.map((grupo) => (
          <FilaElegible
            key={grupo.id}
            marcada={elegidos.includes(grupo.nombre)}
            onCambio={() => onAlternar(grupo.nombre)}
            etiqueta={`Marcar el grupo ${grupo.nombre}`}
            tamano="xs"
            contenido={
              <Text as="span" size="sm" className="truncate">
                {grupo.nombre}{' '}
                {grupo.descripcion ? (
                  <Text as="span" size="sm" variant="muted">
                    · {grupo.descripcion}
                  </Text>
                ) : null}
              </Text>
            }
            lateral={
              grupo.integrantes.length ? (
                <Text as="span" size="sm" variant="muted" className="tabular-nums">
                  {personas(grupo.integrantes.length)}
                </Text>
              ) : (
                <Badge variant="outline" size="xs">
                  Sin integrantes
                </Badge>
              )
            }
          />
        ))}
      </ListaElegible>
    </div>
  )
}

// Las personas activas de la empresa. Quien entró por un grupo sale marcada con «Por el grupo…».
function ListaPersonas({
  miembros,
  sumadas,
  base,
  fuera,
  grupoDe,
  empresa,
  onAlternar,
}: {
  miembros: ReadonlySet<string>
  sumadas: string[]
  base: ReadonlySet<string>
  fuera: ReadonlySet<string>
  grupoDe: ReadonlyMap<string, string>
  empresa: boolean
  onAlternar: (id: string) => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const [soloElegidas, setSoloElegidas] = useState(false)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(20)
  if (soloElegidas && !miembros.size) setSoloElegidas(false)
  const q = busqueda.trim().toLowerCase()
  const resultado = ACTIVOS.filter((u) => (!q || `${nombreCompleto(u)} ${u.correo} ${u.area}`.toLowerCase().includes(q)) && (!soloElegidas || miembros.has(u.id)))
  const visibles = pagina(resultado, actual, porPagina)
  const enPagina = visibles.filter((u) => miembros.has(u.id)).length
  const todaLaPagina = visibles.length > 0 && enPagina === visibles.length
  const detalle = (id: string, correo: string) =>
    [correo, empresa && base.has(id) ? 'Por toda la empresa' : grupoDe.has(id) && !fuera.has(id) ? `Por el grupo ${grupoDe.get(id)}` : fuera.has(id) && base.has(id) ? 'Fuera de esta asignación' : null].filter(Boolean).join(' · ')

  return (
    <div className="flex flex-col gap-4">
      <Fichas
        etiqueta="Elegidas una a una:"
        items={sumadas.flatMap((id) => {
          const u = ACTIVOS.find((p) => p.id === id)
          return u ? [{ id, texto: nombreCompleto(u), onQuitar: () => onAlternar(id) }] : []
        })}
      />
      <ListaElegible
        id="plan-personas"
        nombre="personas"
        herramientasEnCabecera
        titulo={{ texto: 'Personas' }}
        buscador={{
          valor: busqueda,
          placeholder: 'Busca a una persona',
          onValor: (valor) => {
            setBusqueda(valor)
            setActual(1)
          },
        }}
        herramientas={
          <Button variant={soloElegidas ? 'secondary' : 'outline'} aria-pressed={soloElegidas} onClick={() => setSoloElegidas(!soloElegidas)}>
            {soloElegidas ? 'Ver a todas' : `Ver elegidas (${n(miembros.size)})`}
          </Button>
        }
        resumen={personas(resultado.length)}
        casillaPagina={{
          marcada: todaLaPagina,
          parcial: enPagina > 0 && !todaLaPagina,
          onCambio: () => visibles.filter((u) => miembros.has(u.id) === todaLaPagina).forEach((u) => onAlternar(u.id)),
          etiqueta: 'Seleccionar esta página',
        }}
        paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: resultado.length }}
        vacio={
          <SinResultados
            busqueda={busqueda}
            filtrosActivos={soloElegidas ? 1 : 0}
            onLimpiar={() => {
              setBusqueda('')
              setSoloElegidas(false)
            }}
          />
        }
      >
        {visibles.map((u) => (
          <FilaElegible
            key={u.id}
            marcada={miembros.has(u.id)}
            onCambio={() => onAlternar(u.id)}
            etiqueta={`Seleccionar a ${nombreCompleto(u)}`}
            tamano="xs"
            contenido={
              <Text as="span" size="sm" className="truncate">
                {nombreCompleto(u)}{' '}
                <Text as="span" size="sm" variant="muted">
                  · {detalle(u.id, u.correo)}
                </Text>
              </Text>
            }
            lateral={
              <Text as="span" size="sm" variant="muted">
                {u.area}
              </Text>
            }
          />
        ))}
      </ListaElegible>
    </div>
  )
}
