import { useRef, useState } from 'react'
import { File01Icon, Logout01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Checkbox,
  FramePanel,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Progress,
  Text,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { FilasSeparadas, MarcoLista } from '../../../components/marco-lista'
import { ListaDatos } from '@/modules/admin/seleccion/vacantes/crear/components/piezas-resumen'
import { EncabezadoPaso } from '../../../components/pasos-drawer'
import { AdjuntoCsv } from '@/modules/design-system/estados/procesos'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { PILL } from '@/modules/design-system/drawers/components/drawer-styles'
import { EXTENSIONES_SECCIONES, importedToSections, parseSectionFile } from '../../../modelo/sectionFileImport'
import { countDescendants, countQuestions } from '../../../modelo/sectionTree'
import type { SurveySection } from '../../../modelo/surveyBuilderTypes'
import { ZonaArchivo } from '../../../components/zona-archivo'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// «Importar con IA» del paso de secciones, con el mismo recorrido y el mismo panel lateral que el de participantes:
// se elige el archivo (.md, .txt, .csv o .xlsx), se lee, y se revisa lo que trae —cada sección con sus subsecciones
// y preguntas—. Todo llega marcado; se desmarca lo que no se quiera y «Importar» lo añade al final de la encuesta,
// sin reemplazar lo que ya había. En Markdown: # sección, ## subsección, ### sub-subsección, una viñeta por
// pregunta y sus opciones indentadas debajo; la etiqueta final marca el tipo. En planilla: columnas seccion,
// subseccion, subsubseccion, pregunta, tipo y opciones (separadas por |).

const MAXIMO = 5 * 1024 * 1024
const MS_ANALISIS = 1800

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

type Revision = { archivo: string; secciones: readonly SurveySection[] }

export function ImportarSecciones({
  abierto,
  onAbiertoChange,
  onImportar,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  onImportar: (secciones: SurveySection[]) => void
}) {
  const [analizando, setAnalizando] = useState<string | null>(null)
  const [revision, setRevision] = useState<Revision | null>(null)
  const [elegidas, setElegidas] = useState<ReadonlySet<string>>(() => new Set())
  // Cada lectura lleva su número: si se cierra el panel o se quita el archivo a mitad, el número cambia y lo que
  // termine de leerse después se descarta, así que al reabrir el panel empieza limpio (SEC-096).
  const lectura = useRef(0)
  // Con un archivo elegido (leyéndose o ya leído), cerrar pregunta antes, como «¿Salir sin cargar la encuesta?».
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  const archivoActual = analizando ?? revision?.archivo ?? null

  const reiniciar = () => {
    lectura.current += 1
    setAnalizando(null)
    setRevision(null)
    setElegidas(new Set())
  }

  const leer = async (archivo: File) => {
    const esta = ++lectura.current
    setAnalizando(archivo.name)
    const [resultado] = await Promise.allSettled([parseSectionFile(archivo), new Promise((listo) => window.setTimeout(listo, MS_ANALISIS))])
    if (esta !== lectura.current) return
    setAnalizando(null)
    if (resultado.status === 'rejected') {
      notify('Archivo no válido', `No pudimos leer «${archivo.name}».`)
      return
    }
    const secciones = importedToSections(resultado.value)
    if (secciones.length === 0) {
      notify('No se detectaron secciones', `«${archivo.name}» se leyó, pero no trae una estructura de secciones y preguntas.`)
      return
    }
    setRevision({ archivo: archivo.name, secciones })
    // Todo llega marcado: se desmarca lo que no se quiera importar.
    setElegidas(new Set(secciones.map((seccion) => seccion.id)))
  }

  const salirDelTodo = () => {
    setConfirmarSalida(false)
    onAbiertoChange(false)
    reiniciar()
  }

  const cerrar = (siguiente: boolean) => {
    if (siguiente) return onAbiertoChange(true)
    if (archivoActual) return setConfirmarSalida(true)
    salirDelTodo()
  }

  const elegidasLista = revision?.secciones.filter((seccion) => elegidas.has(seccion.id)) ?? []
  const preguntasElegidas = countQuestions(elegidasLista)
  const preguntasTotales = revision ? countQuestions(revision.secciones) : 0
  const todas = revision !== null && elegidas.size === revision.secciones.length

  const alternar = (id: string) =>
    setElegidas((previas) => {
      const siguientes = new Set(previas)
      if (siguientes.has(id)) siguientes.delete(id)
      else siguientes.add(id)
      return siguientes
    })
  const alternarTodas = () => setElegidas(todas ? new Set() : new Set(revision?.secciones.map((seccion) => seccion.id)))

  const importar = () => {
    if (!revision || elegidasLista.length === 0) return
    onImportar([...elegidasLista])
    // Se cuenta lo que entró (lo que pasa de tres niveles se recorta), no lo que traía el archivo.
    notify(
      `${elegidasLista.length === 1 ? 'Se importó' : 'Se importaron'} ${plural(elegidasLista.length, 'sección', 'secciones')} y ${plural(preguntasElegidas, 'pregunta', 'preguntas')}.`,
      'Se añadieron al final de la encuesta.',
    )
    salirDelTodo()
  }

  return (
    <>
    <DrawerShell
      open={abierto}
      onOpenChange={cerrar}
      size="lg"
      ai
      title="Importar con IA"
      description="Secciones y preguntas desde un archivo."
      footer={
        <>
          <Button variant="outline" className={PILL} onClick={() => cerrar(false)}>
            Cancelar
          </Button>
          <Button className={PILL} disabled={!revision || elegidas.size === 0} onClick={importar}>
            {revision ? `Importar ${plural(elegidas.size, 'sección', 'secciones')}` : 'Importar'}
          </Button>
        </>
      }
    >
      {analizando ? (
        // Leer el archivo no usa IA: carga neutra con la barra de avance, sin el indicador de «la IA está pensando» (auditoría, decisión 8).
        <div className="flex flex-col items-center gap-4 py-12">
          <Progress value={null} className="w-64" aria-label="Leyendo el archivo" />
          <Text as="span" size="sm" variant="muted">
            Leyendo «{analizando}» y armando la estructura de secciones.
          </Text>
        </div>
      ) : !revision ? (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <EncabezadoPaso titulo="¿De qué archivo las traemos?" descripcion="Leemos las secciones y sus preguntas. Después eliges cuáles añadir al final de la encuesta." />
          <ZonaArchivo
            descripcion="Markdown, texto, CSV o Excel · hasta 5 MB"
            extensiones={EXTENSIONES_SECCIONES}
            maximoBytes={MAXIMO}
            onArchivo={(archivo) => void leer(archivo)}
            onRechazo={(rechazo) => notify(rechazo.titulo, rechazo.detalle)}
          />
          </section>
          {/* Qué lee del archivo, igual que en «Importar con IA» de participantes: una fila por dato. */}
          <MarcoLista titulo="Qué debe traer el archivo" descripcion="Una fila por pregunta.">
            <FramePanel>
              <ListaDatos
                filas={[
                  { termino: 'Pregunta', valor: 'Obligatorio' },
                  { termino: 'Sección', valor: 'Opcional · si no va, se agrupan aparte' },
                  { termino: 'Subsección', valor: 'Opcional' },
                  { termino: 'Tipo de pregunta', valor: 'Opcional · si no va, es escala' },
                ]}
              />
            </FramePanel>
          </MarcoLista>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AdjuntoCsv
            estado="done"
            className="w-full!"
            icono={File01Icon}
            vacio={{ titulo: '', descripcion: '' }}
            nombre={revision.archivo}
            descripcion={`${plural(revision.secciones.length, 'sección', 'secciones')} · ${plural(preguntasTotales, 'pregunta', 'preguntas')}`}
            onElegir={() => undefined}
            onQuitar={reiniciar}
          />

          {/* Lo encontrado en su marco, como «Cargar encuestas»: el recuento arriba y las secciones con una línea entre cada una. */}
          <MarcoLista
            titulo="Lo que encontramos"
            descripcion={<span aria-live="polite">{`${elegidas.size} de ${plural(revision.secciones.length, 'sección', 'secciones')} para importar · ${plural(preguntasElegidas, 'pregunta', 'preguntas')}`}</span>}
          >
            <FramePanel className="py-1!">
              <FilasSeparadas>
                <Item size="sm" className="gap-3 px-0!" render={<label />}>
                  <Checkbox checked={todas} onCheckedChange={alternarTodas} aria-label="Marcar todas las secciones" />
                  <Text as="span" size="sm" variant="muted">
                    Marcar todas
                  </Text>
                </Item>
            {revision.secciones.map((seccion, indice) => {
              const subsecciones = countDescendants(seccion)
              const preguntas = countQuestions([seccion])
              return (
                  <Item key={seccion.id} size="sm" className="gap-3 px-0!">
                    <Checkbox checked={elegidas.has(seccion.id)} onCheckedChange={() => alternar(seccion.id)} aria-label={`Importar la sección ${seccion.title || indice + 1}`} />
                    <ItemContent>
                      <TextoCompleto texto={seccion.title.trim() || `Sección ${indice + 1}`}><ItemTitle className="truncate">{seccion.title.trim() || `Sección ${indice + 1}`}</ItemTitle></TextoCompleto>
                      <ItemDescription>
                        {[subsecciones > 0 ? plural(subsecciones, 'subsección', 'subsecciones') : null, plural(preguntas, 'pregunta', 'preguntas')].filter(Boolean).join(' · ')}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
              )
            })}
              </FilasSeparadas>
            </FramePanel>
          </MarcoLista>
        </div>
      )}
    </DrawerShell>
    <DialogoConfirmar
      abierto={confirmarSalida}
      onAbiertoChange={setConfirmarSalida}
      icono={Logout01Icon}
      titulo="¿Salir de la importación?"
      descripcion={`Se pierde lo que leímos de «${archivoActual ?? ''}» y no se agrega ninguna sección a la encuesta.`}
      cancelar="Seguir aquí"
      accion="Salir de la importación"
      onConfirmar={salirDelTodo}
    />
    </>
  )
}
