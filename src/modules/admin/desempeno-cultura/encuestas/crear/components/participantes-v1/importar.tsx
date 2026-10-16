import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, File01Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  Badge,
  Button,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import { AiThinking } from '@/shared/components/AiThinking'
import { notify } from '@/shared/components/notify'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { COLLABORATORS } from '../../../modelo/collaborators'
import { EXTENSIONES_PARTICIPANTES, TAMANO_MAXIMO_PARTICIPANTES, participantesDeFilas } from '../../../modelo/importarParticipantes'
import { formatCount, resolveImportedRows, type ResolvedImportRow } from '../../../modelo/participants'
import { leerPlanilla } from '../../../modelo/planilla'
import type { ImportedDemographic, ParticipantsSelection } from '../../../modelo/surveyBuilderTypes'
import { ZonaArchivo } from '../../../components/zona-archivo'

// «Importar con IA»: la lista sale de un archivo. Se lee de verdad (CSV o Excel), se cruza con el
// directorio —una fila es de alguien que ya está en UBITS si coincide su username o su correo— y
// las columnas de más se ofrecen como datos demográficos en el paso siguiente. Un segundo archivo se
// suma al primero: nunca lo reemplaza.

const MS_ANALISIS = 1800
const VACIO: Partial<ParticipantsSelection> = {
  importedFileName: null,
  importedUsers: [],
  importedCount: 0,
  importedNewCount: 0,
  importedDemographics: [],
  importedFailed: false,
}

function TablaUsuarios({ filas }: { filas: readonly ResolvedImportRow[] }) {
  if (filas.length === 0) {
    return (
      <Text as="p" size="sm" variant="muted" className="py-6 text-center">
        No hay personas en este grupo.
      </Text>
    )
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Colaborador</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Correo electrónico</TableHead>
            <TableHead>Área</TableHead>
            <TableHead>Líder</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.slice(0, 50).map(({ user, person }, indice) => (
            <TableRow key={`${user.username}-${user.email}-${indice}`}>
              <TableCell>
                <Persona nombre={user.name || person?.name || user.username} />
              </TableCell>
              <TableCell className="text-muted-foreground">{user.username || '—'}</TableCell>
              <TableCell className="text-muted-foreground">{user.email || '—'}</TableCell>
              <TableCell>{user.area || person?.area || '—'}</TableCell>
              <TableCell>{user.leader || person?.leader || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filas.length > 50 ? (
        <Text as="p" size="xs" variant="muted" className="pt-2">
          Y {formatCount(filas.length - 50)} personas más.
        </Text>
      ) : null}
    </div>
  )
}

// Las columnas de dos archivos se juntan: las opciones de una misma columna se suman.
function unirDemograficos(actuales: readonly ImportedDemographic[], nuevos: readonly ImportedDemographic[]): ImportedDemographic[] {
  const porClave = new Map(actuales.map((entrada) => [entrada.key, entrada]))
  for (const entrada of nuevos) {
    const previa = porClave.get(entrada.key)
    porClave.set(entrada.key, previa ? { ...previa, optionLabels: [...new Set([...previa.optionLabels, ...entrada.optionLabels])] } : entrada)
  }
  return [...porClave.values()]
}

export function ParticipantesImportar({ seleccion, onCambio }: { seleccion: ParticipantsSelection; onCambio: (cambio: Partial<ParticipantsSelection>) => void }) {
  const [analizando, setAnalizando] = useState<string | null>(null)
  const [otroArchivo, setOtroArchivo] = useState(false)
  const conArchivo = seleccion.importedUsers.length > 0
  const filas = resolveImportedRows(seleccion.importedUsers, COLLABORATORS)
  const nuevos = filas.filter((fila) => fila.person === null)
  const enUbits = filas.filter((fila) => fila.person !== null)

  const cargar = async (archivo: File) => {
    setAnalizando(archivo.name)
    setOtroArchivo(false)
    const [lectura] = await Promise.allSettled([leerPlanilla(archivo), new Promise((listo) => window.setTimeout(listo, MS_ANALISIS))])
    setAnalizando(null)
    if (lectura.status === 'rejected') {
      notify('No pudimos leer el archivo', `«${archivo.name}» parece estar corrupto o no ser una planilla válida.`)
      if (!conArchivo) onCambio({ ...VACIO, importedFileName: archivo.name, importedFailed: true })
      return
    }
    const { usuarios, demograficos } = participantesDeFilas(lectura.value)
    if (usuarios.length === 0) {
      notify('No encontramos usuarios en el archivo', `«${archivo.name}» es válido, pero no tiene una columna «name» o «username» con datos.`)
      return
    }
    // Un segundo archivo suma sus personas (sin repetir) y sus columnas a las que ya había.
    const conocidos = new Set(seleccion.importedUsers.map((usuario) => `${usuario.username}|${usuario.email}`))
    const agregados = usuarios.filter((usuario) => !conocidos.has(`${usuario.username}|${usuario.email}`))
    const todos = [...seleccion.importedUsers, ...agregados]
    onCambio({
      importedFileName: seleccion.importedFileName && conArchivo ? `${seleccion.importedFileName} + ${archivo.name}` : archivo.name,
      importedUsers: todos,
      importedCount: todos.length,
      importedNewCount: resolveImportedRows(todos, COLLABORATORS).filter((fila) => fila.person === null).length,
      importedDemographics: unirDemograficos(conArchivo ? seleccion.importedDemographics : [], demograficos),
      importedFailed: false,
    })
    notify(
      'Archivo añadido',
      agregados.length > 0
        ? `Se añadieron ${formatCount(agregados.length)} ${agregados.length === 1 ? 'persona' : 'personas'} de «${archivo.name}».`
        : `«${archivo.name}» no aportó personas nuevas: todas ya estaban cargadas.`,
    )
  }

  const zona = (
    <ZonaArchivo
      descripcion="Un archivo .csv o .xlsx con nombre o username como mínimo, hasta 5 MB."
      extensiones={EXTENSIONES_PARTICIPANTES}
      maximoBytes={TAMANO_MAXIMO_PARTICIPANTES}
      onArchivo={(archivo) => void cargar(archivo)}
      onRechazo={(rechazo) => notify(rechazo.titulo, rechazo.detalle)}
    />
  )

  if (analizando) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <AiThinking label="Analizando el archivo: participantes y datos demográficos…" />
        <Progress value={null} className="w-64" aria-label="Analizando el archivo" />
        <Text as="span" size="sm" variant="muted">
          Leyendo «{analizando}» y revisando qué columnas sirven como datos demográficos.
        </Text>
      </div>
    )
  }

  if (!conArchivo) return zona

  return (
    <div className="flex flex-col gap-4">
      <Attachment state="done" className="w-full">
        <AttachmentMedia>
          <HugeiconsIcon icon={File01Icon} aria-hidden="true" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>{seleccion.importedFileName}</AttachmentTitle>
          <AttachmentDescription>
            {formatCount(seleccion.importedCount)} personas · {formatCount(nuevos.length)} nuevas · {formatCount(enUbits.length)} ya en UBITS
            {seleccion.importedDemographics.length > 0 ? ` · ${seleccion.importedDemographics.length} datos demográficos detectados` : ''}
          </AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Quitar el archivo" onClick={() => onCambio(VACIO)}>
            <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>

      {seleccion.importedDemographics.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <Text as="span" size="sm" variant="muted">
            Columnas que podrás usar como datos demográficos:
          </Text>
          {seleccion.importedDemographics.map((entrada) => (
            <Badge key={entrada.key} variant="outline">
              {entrada.label}
            </Badge>
          ))}
        </div>
      ) : null}

      <Tabs defaultValue={nuevos.length > 0 ? 'nuevos' : 'ubits'}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList variant="line">
            <TabsTrigger value="nuevos" className="flex-none">
              Usuarios nuevos ({formatCount(nuevos.length)})
            </TabsTrigger>
            <TabsTrigger value="ubits" className="flex-none">
              Usuarios ya en UBITS ({formatCount(enUbits.length)})
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={() => setOtroArchivo(!otroArchivo)}>
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
            Subir otro archivo
          </Button>
        </div>
        {otroArchivo ? <div className="pt-4">{zona}</div> : null}
        <TabsContent value="nuevos" className="pt-3">
          <TablaUsuarios filas={nuevos} />
        </TabsContent>
        <TabsContent value="ubits" className="pt-3">
          <TablaUsuarios filas={enUbits} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
