import { useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, Badge, Button, Field, FieldLabel, Switch, Text } from '@ubits/flux-ui'
import { PageActionBar, PageShell } from '@/shared/components/PageShell'
import {
  buscarPagina,
  cancelarRecurso,
  confirmarRecurso,
  getBorrador,
  hashPagina,
  rutaAsistente,
  volverAAnadirPagina,
  type DatosAsistencia,
  type SesionAsistencia,
} from '../crear-contenido/components/borrador'
import { EditorTexto } from '../crear-contenido/components/editor-texto'
import { BotonSalirCreacion, MarcoInmersivo } from '../crear-contenido/components/marco-inmersivo'
import { TarjetaSesion } from '../crear-contenido/components/asistencia/tarjeta-sesion'
import { asistenciaConfirmada, asistenciaLista, nombrePorDefecto, sesionNueva } from '../crear-contenido/components/asistencia/sesiones'

// Agregar asistencia (solo en Crear evento): instrucciones, autoasistencia y las sesiones del evento
// (HU-recurso-asistencia). Siempre hay al menos una sesión; «Autoasistencia» solo decide quién confirma la asistencia
// —el participante o el administrador— y no crea ni borra sesiones.
//
// **Es una pantalla, no un diálogo.** Era un modal a pantalla completa, y al pedirle confirmación a «Eliminar sesión»
// quedaba un modal encima de otro, que es justo lo que no se hace. Además es el flujo de alta más largo del evento
// —un formulario por sesión— y encaja con los demás: video, presentación y roleplay también son pantallas
// inmersivas con su propia dirección (Dave, 2-oct).
//
// Llega desde «Añadir página» (alta) o desde «Editar asistencia» de una página ya montada, y al confirmar vuelve al
// asistente con el recurso puesto.

const AVISO_ZONA_HORARIA = 'Las sesiones se guardan según la zona horaria de tu compañía: Bogotá (UTC-05:00).'

/** Si se vino a editar, los datos de la página que se está editando. */
function asistenciaAEditar(): DatosAsistencia | null {
  const b = getBorrador()
  const porIntencion = buscarPagina(b, b.intencion?.paginaId ?? null)?.pagina.recurso?.asistencia
  return porIntencion ?? buscarPagina(b, b.paginaActiva)?.pagina.recurso?.asistencia ?? null
}

function datosIniciales(inicial: DatosAsistencia | null): DatosAsistencia {
  return {
    instrucciones: inicial?.instrucciones ?? '',
    autoasistencia: Boolean(inicial?.autoasistencia),
    sesiones: inicial?.sesiones.length
      ? inicial.sesiones.map((s, i) => ({ ...s, nombre: s.nombre.trim() || nombrePorDefecto(i), descripcion: s.descripcion ?? '' }))
      : [sesionNueva(0)],
  }
}

export function Component() {
  const navigate = useNavigate()
  const [inicial] = useState(asistenciaAEditar)
  // La página que se está editando, para volver a ella al salir. Se lee una sola vez, antes de tocar nada.
  const [paginaId] = useState(() => {
    const b = getBorrador()
    return b.intencion?.paginaId ?? b.paginaActiva ?? null
  })
  const [datos, setDatos] = useState(() => datosIniciales(inicial))
  const listo = asistenciaLista(datos.sesiones)
  const editando = Boolean(inicial)

  const cambiarSesion = (id: string, cambio: Partial<SesionAsistencia>) =>
    setDatos((d) => ({ ...d, sesiones: d.sesiones.map((s) => (s.id === id ? { ...s, ...cambio } : s)) }))

  const quitarSesion = (id: string) =>
    setDatos((d) => (d.sesiones.length <= 1 ? d : { ...d, sesiones: d.sesiones.filter((s) => s.id !== id) }))

  const agregarSesion = () => setDatos((d) => ({ ...d, sesiones: [...d.sesiones, sesionNueva(d.sesiones.length)] }))

  const confirmar = () => {
    if (!listo) return
    const id = confirmarRecurso({ tipo: 'asistencia', asistencia: asistenciaConfirmada(datos) })
    navigate(`${rutaAsistente()}${hashPagina(id)}`)
  }

  /**
   * Salir sin guardar. Editando se vuelve **a la página que se estaba editando**, no a la raíz del asistente: sin el
   * hash, el asistente abría en el paso 1 y parecía que se había perdido el contenido (Dave, 2-oct). En alta no hay
   * página a la que volver, así que se deshace la intención y se cae en el paso de recursos.
   */
  const salir = () => navigate(editando && paginaId ? `${rutaAsistente()}${hashPagina(paginaId)}` : cancelarRecurso())

  return (
    <MarcoInmersivo
      // `lleno`: pantalla completa **de verdad**, sin modal. El marco inmersivo por defecto es un modal a pantalla
      // completa, y con él la confirmación de «Eliminar sesión» seguía siendo un diálogo encima de otro —justo lo que
      // había que quitar—. Con `lleno` el flujo es una pantalla y la confirmación, el único diálogo (Dave, 2-oct).
      lleno
      titulo={editando ? 'Editar asistencia' : 'Agregar asistencia'}
      subtitulo="Instrucciones, autoasistencia y sesiones del evento"
      // Una sola salida, sin flecha ni «Cancelar» (regla de creación, 6-oct). En alta es la X en círculo de la cabecera,
      // como en las demás experiencias inmersivas, y vuelve a «Añadir página» (el jefe de Dave, 14-oct); editando,
      // «Salir de la edición» sale a la página que se estaba editando.
      cerrar={editando ? undefined : { etiqueta: 'Volver a añadir página', onClick: () => navigate(volverAAnadirPagina()) }}
      acciones={editando ? <BotonSalirCreacion texto="Salir de la edición" onClick={salir} /> : undefined}
      barra={
        <PageActionBar className="mb-1">
          <Text as="span" size="sm" variant="muted">
            {datos.sesiones.length === 1 ? '1 sesión' : `${datos.sesiones.length} sesiones`}
          </Text>
          <Button className="ml-auto" disabled={!listo} onClick={confirmar}>
            Confirmar
          </Button>
        </PageActionBar>
      }
    >
      <PageShell width="narrow" className="gap-8">
        <Field>
          <FieldLabel htmlFor="as-instrucciones">
            Instrucciones
            <Badge variant="secondary" size="xs">
              Opcional
            </Badge>
          </FieldLabel>
          <EditorTexto
            id="as-instrucciones"
            valor={datos.instrucciones}
            onCambio={(instrucciones) => setDatos((d) => ({ ...d, instrucciones }))}
            placeholder="Escribe las instrucciones para los colaboradores…"
            alto={160}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text as="p" weight="semibold" id="as-autoasistencia">
              Autoasistencia
            </Text>
            <Switch
              checked={datos.autoasistencia}
              onCheckedChange={(autoasistencia) => setDatos((d) => ({ ...d, autoasistencia }))}
              aria-labelledby="as-autoasistencia"
            />
          </div>
          {/* No son dos modos excluyentes: tú cargas la asistencia siempre, y la autoasistencia solo **añade** la vía
              del participante. El texto de antes decía «si está desactivada, el administrador es quien confirma», y
              se entendía que al activarla dejabas de poder hacerlo (Dave, 2-oct). */}
          <Text as="p" size="sm" variant="muted">
            Siempre puedes cargar tú la asistencia a mano desde Resultados. Si la activas, <strong>además</strong> cada
            participante puede marcar la suya desde la plataforma, durante el horario de la sesión.
          </Text>
        </div>

        <div className="flex flex-col gap-4">
          <Alert variant="warning">
            <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
            <AlertDescription>
              <p>{AVISO_ZONA_HORARIA}</p>
            </AlertDescription>
          </Alert>

          <ul className="flex flex-col gap-4" aria-label="Sesiones">
            {datos.sesiones.map((sesion, indice) => (
              <li key={sesion.id}>
                <TarjetaSesion
                  sesion={sesion}
                  indice={indice}
                  unica={datos.sesiones.length <= 1}
                  onCambio={(cambio) => cambiarSesion(sesion.id, cambio)}
                  onQuitar={() => quitarSesion(sesion.id)}
                />
              </li>
            ))}
          </ul>

          <div>
            <Button variant="outline" onClick={agregarSesion}>
              <HugeiconsIcon icon={PlusSignIcon} size={16} aria-hidden="true" />
              Agregar sesión
            </Button>
          </div>
        </div>
      </PageShell>

    </MarcoInmersivo>
  )
}

Component.displayName = 'LmsAgregarAsistenciaPage'
