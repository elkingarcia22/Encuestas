import { useMemo } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Download01Icon, UserMultiple02Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Text,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { AdjuntoCsv, type Subida } from '@/modules/design-system/estados/procesos'
import { useTemporizadores } from '@/modules/design-system/estados/temporizadores'
import { plural } from '@/modules/design-system/patrones/formato'
import { NIVELES } from '@/modules/design-system/templates/gestion-usuarios/components/datos'
import { CATALOGO_COMPETENCIAS, CONTENIDOS } from './catalogo'
import { ACTIVOS, nombreCompleto, useGrupos, type Grupo } from './grupos-datos'
import { marcadosEn, TIPOS, type Alcance, type Asignacion, type TipoPlan } from './planes-datos'
import { COLUMNA_ITEM, descargarColaboradores, descargarListaItems, descargarPlantilla } from './reportes'
import { TablaSeleccion, type Filtro } from './tabla-seleccion'

// El paso «Participantes» de Agregar asignación, como en UBITS: la «Lista de usuarios» (tabla con casillas, filtros por
// Área, Líder y Nivel, y «Seleccionados (N)»), la lista de grupos (Nombre · Usuarios) o el archivo. El archivo es otro
// camino: trae a la vez a quién y qué (username y content_id), así que con él no hay paso «Contenido».

export type Participantes = { alcance: Alcance; destinatarios: string[]; personas: number }

const ARCHIVO = 'participantes-plan.csv'
const EN_ARCHIVO = 42
// Lo que «encuentra» el archivo de ejemplo: las primeras filas del catálogo.
export const itemsEnArchivo = (tipo: TipoPlan) => (tipo === 'competencias' ? CATALOGO_COMPETENCIAS.slice(0, 3).map((c) => c.titulo) : CONTENIDOS.slice(0, 3).map((c) => c.titulo))

// Lo que se va eligiendo en el paso «Participantes», según el tipo de asignación. Vive en Agregar asignación, que decide
// cuándo se puede seguir.
export type SeleccionParticipantes = { personas: string[]; grupos: string[]; archivo: Subida }
export const SIN_SELECCION: SeleccionParticipantes = { personas: [], grupos: [], archivo: 'idle' }

// De lo elegido a una asignación: a quién le llega y cuántas personas son. Null mientras no haya nada que asignar.
export function resolverParticipantes(modo: Alcance, valor: SeleccionParticipantes, grupos: Grupo[], personasEmpresa: number): Participantes | null {
  if (modo === 'empresa') return { alcance: 'empresa', destinatarios: [], personas: personasEmpresa }
  if (modo === 'colaboradores') {
    const nombres = ACTIVOS.filter((u) => valor.personas.includes(u.id)).map(nombreCompleto)
    return nombres.length ? { alcance: 'colaboradores', destinatarios: nombres, personas: nombres.length } : null
  }
  if (modo === 'grupos') {
    const elegidos = grupos.filter((g) => valor.grupos.includes(g.id))
    return elegidos.length
      ? { alcance: 'grupos', destinatarios: elegidos.map((g) => g.nombre), personas: elegidos.reduce((n, g) => n + g.integrantes.length, 0) }
      : null
  }
  return valor.archivo === 'done' ? { alcance: 'archivo', destinatarios: [ARCHIVO], personas: EN_ARCHIVO } : null
}

// Al editar una asignación: lo que tenía, otra vez marcado.
export function seleccionDe(asignacion: Asignacion, grupos: Grupo[]): SeleccionParticipantes {
  if (asignacion.alcance === 'colaboradores') return { ...SIN_SELECCION, personas: ACTIVOS.filter((u) => asignacion.destinatarios.includes(nombreCompleto(u))).map((u) => u.id) }
  if (asignacion.alcance === 'grupos') return { ...SIN_SELECCION, grupos: grupos.filter((g) => asignacion.destinatarios.includes(g.nombre)).map((g) => g.id) }
  if (asignacion.alcance === 'archivo') return { ...SIN_SELECCION, archivo: 'done' }
  return SIN_SELECCION
}

// ── Lista de usuarios ──

type FilaUsuario = { id: string; nombre: string; correo: string; username: string; area: string; lider: string; nivel: string }

const FILAS_USUARIOS: FilaUsuario[] = ACTIVOS.map((u) => ({ id: u.id, nombre: nombreCompleto(u), correo: u.correo, username: u.username, area: u.area, lider: u.lider || '—', nivel: u.nivel }))
const opciones = (valores: string[]) => [...new Set(valores)].sort((a, b) => a.localeCompare(b, 'es')).map((v) => ({ label: v, value: v }))

const texto = (valor: string) => (
  <Text as="span" size="sm" className="block truncate">
    {valor}
  </Text>
)

const COLUMNAS_USUARIOS: DataGridListConfig<FilaUsuario>['columns'] = [
  { accessorKey: 'nombre', header: 'Nombre', size: 250, ...SIN_ARRASTRE, cell: ({ row }) => <Persona nombre={row.original.nombre} detalle={row.original.correo} /> },
  { accessorKey: 'username', header: 'Usuario', size: 130, ...SIN_ARRASTRE, cell: ({ row }) => texto(row.original.username) },
  { accessorKey: 'area', header: 'Área', size: 120, ...SIN_ARRASTRE, cell: ({ row }) => texto(row.original.area) },
  { accessorKey: 'lider', header: 'Líder', size: 160, ...SIN_ARRASTRE, cell: ({ row }) => texto(row.original.lider) },
  { accessorKey: 'nivel', header: 'Nivel', size: 190, ...SIN_ARRASTRE, cell: ({ row }) => texto(row.original.nivel) },
]
const FILTROS_USUARIOS: DataGridListConfig<FilaUsuario>['columnFilters'] = [
  { id: 'area', label: 'Área', type: 'select', multiple: true, options: opciones(FILAS_USUARIOS.map((f) => f.area)) },
  { id: 'lider', label: 'Líder', type: 'select', multiple: true, searchable: true, options: opciones(FILAS_USUARIOS.map((f) => f.lider)) },
  { id: 'nivel', label: 'Nivel', type: 'select', multiple: true, options: NIVELES.map((n) => ({ label: n, value: n })) },
]
const coincideUsuario = (f: FilaUsuario, q: string, filtros: Filtro[]) => {
  for (const campo of ['area', 'lider', 'nivel'] as const) {
    const elegidos = marcadosEn(filtros, campo)
    if (elegidos.length && !elegidos.includes(f[campo])) return false
  }
  return !q || `${f.nombre} ${f.correo} ${f.username}`.toLowerCase().includes(q)
}

// ── Lista de grupos ──

type FilaGrupo = { id: string; nombre: string; descripcion: string; usuarios: number }

const COLUMNAS_GRUPOS: DataGridListConfig<FilaGrupo>['columns'] = [
  {
    accessorKey: 'nombre',
    header: 'Nombre',
    size: 520,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col gap-1">
        <Text as="span" size="sm" weight="medium" className="truncate">
          {row.original.nombre}
        </Text>
        <Text as="span" variant="muted" size="xs" className="truncate">
          {row.original.descripcion || 'Sin descripción'}
        </Text>
      </div>
    ),
  },
  {
    accessorKey: 'usuarios',
    header: 'Usuarios',
    size: 160,
    ...SIN_ARRASTRE,
    cell: ({ row }) =>
      row.original.usuarios ? (
        <Text as="span" size="sm" className="tabular-nums">
          {row.original.usuarios.toLocaleString('es-CO')}
        </Text>
      ) : (
        <Badge variant="outline" size="xs">
          Sin integrantes
        </Badge>
      ),
  },
]
const coincideGrupo = (f: FilaGrupo, q: string) => !q || `${f.nombre} ${f.descripcion}`.toLowerCase().includes(q)

// El paso «Participantes» (o «Cargar archivo»). Toda la empresa no tiene nada que elegir y no pasa por aquí.
export function ListaParticipantes({
  modo,
  tipo,
  valor,
  onCambio,
  yaAsignados = [],
}: {
  modo: Exclude<Alcance, 'empresa'>
  tipo: TipoPlan
  valor: SeleccionParticipantes
  onCambio: (valor: SeleccionParticipantes) => void
  // Nombres de quienes ya tienen el plan (o «Toda la empresa»): no se ofrecen otra vez.
  yaAsignados?: string[]
}) {
  const grupos = useGrupos()
  const despues = useTemporizadores()
  const textos = TIPOS[tipo]
  // Una sola lista por vuelta: la tabla compara lo que tiene delante para no perder lo elegido.
  const filasGrupos = useMemo(() => grupos.map((g) => ({ id: g.id, nombre: g.nombre, descripcion: g.descripcion, usuarios: g.integrantes.length })), [grupos])
  const todaLaEmpresa = yaAsignados.includes('Toda la empresa')
  // `yaAsignados` llega nuevo en cada vuelta: se compara por su contenido.
  const clave = yaAsignados.join('\n')
  const disponibles = useMemo(() => {
    const ya = new Set(clave.split('\n'))
    return ya.has('Toda la empresa') ? [] : FILAS_USUARIOS.filter((f) => !ya.has(f.nombre))
  }, [clave])

  if (modo === 'archivo') {
    const subir = () => {
      onCambio({ ...valor, archivo: 'uploading' })
      despues(() => onCambio({ ...valor, archivo: 'processing' }), 900)
      despues(() => onCambio({ ...valor, archivo: 'done' }), 1900)
    }
    const items = itemsEnArchivo(tipo)
    return (
      <div className="flex flex-col gap-4">
        {/* Como en UBITS: lo que hace falta para armar el archivo, arriba. */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={descargarColaboradores}>
            <HugeiconsIcon icon={Download01Icon} size={16} aria-hidden="true" />
            Descargar colaboradores
          </Button>
          <Button variant="outline" onClick={() => descargarListaItems(tipo)}>
            <HugeiconsIcon icon={Download01Icon} size={16} aria-hidden="true" />
            Descargar lista de {textos.items}
          </Button>
          <Button variant="outline" onClick={() => descargarPlantilla(tipo)}>
            <HugeiconsIcon icon={Download01Icon} size={16} aria-hidden="true" />
            Descargar plantilla
          </Button>
        </div>
        <Field>
          <FieldLabel>Archivo de participantes</FieldLabel>
          <AdjuntoCsv
            estado={valor.archivo}
            vacio={{ titulo: 'Arrastra o selecciona un archivo CSV', descripcion: 'Máx. 1 archivo · Hasta 255 MB' }}
            nombre={ARCHIVO}
            descripcion={
              valor.archivo === 'done'
                ? `${EN_ARCHIVO} usuarios y ${items.length} ${plural(items.length, textos.item, textos.items)} encontrados`
                : valor.archivo === 'processing'
                  ? 'Buscando a los usuarios…'
                  : 'Subiendo…'
            }
            porcentaje={valor.archivo === 'uploading' ? 60 : 100}
            className="w-full!"
            onElegir={subir}
            onQuitar={() => onCambio({ ...valor, archivo: 'idle' })}
          />
          <FieldDescription>
            Debe ser un CSV separado por comas (no por punto y coma). Incluye las columnas username y {COLUMNA_ITEM[tipo]}. Descarga la plantilla para ver el formato.
          </FieldDescription>
        </Field>
        {valor.archivo === 'done' ? (
          <Text as="p" size="sm" variant="muted">
            {textos.items.charAt(0).toUpperCase() + textos.items.slice(1)} del archivo: {items.join(', ')}. Las personas suspendidas no reciben el plan.
          </Text>
        ) : null}
      </div>
    )
  }

  if (modo === 'grupos') {
    return (
      <TablaSeleccion
        id="elegir-grupos"
        titulo="Lista de grupos"
        sustantivo={['grupo', 'grupos']}
        filas={filasGrupos}
        columnas={COLUMNAS_GRUPOS}
        coincide={coincideGrupo}
        buscar="Buscar grupos"
        marcados={valor.grupos}
        onCambio={(ids) => onCambio({ ...valor, grupos: ids })}
      />
    )
  }

  if (!disponibles.length) {
    return (
      <Empty className="py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={UserMultiple02Icon} size={20} aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Todos los colaboradores ya están asignados</EmptyTitle>
          <EmptyDescription>
            {todaLaEmpresa ? 'El plan ya le llega a toda la empresa, también a quien entre mientras esté vigente.' : 'Cada persona activa de la empresa ya tiene este plan.'}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  return (
    <TablaSeleccion
      id="elegir-usuarios"
      titulo="Lista de usuarios"
      sustantivo={['usuario', 'usuarios']}
      filas={disponibles}
      columnas={COLUMNAS_USUARIOS}
      filtros={FILTROS_USUARIOS}
      coincide={coincideUsuario}
      buscar="Nombre, correo o usuario"
      marcados={valor.personas}
      onCambio={(ids) => onCambio({ ...valor, personas: ids })}
    />
  )
}
