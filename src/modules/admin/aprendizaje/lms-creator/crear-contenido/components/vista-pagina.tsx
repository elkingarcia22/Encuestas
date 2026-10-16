import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Edit02Icon, RefreshIcon, Settings02Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  cn,
  Field,
  FieldLabel,
  IconTile,
  Input,
  Separator,
  Switch,
  Text,
} from '@ubits/flux-ui'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { actualizarPagina, faltanPreguntas, nombreRecurso, type Pagina, useBorrador } from './borrador'
import { CargandoPresentacion, VistaEmbebido, VistaPdf, VistaScorm, VistaTexto, VistaVideo } from './bloque-recurso'
import { RecursosComplementarios } from './complementarios'
import { ProveedorAccionesEvaluacion, type AccionesEvaluacion } from './evaluacion/acciones-evaluacion'
import { AgenteEvaluaciones } from './evaluacion/agente-evaluaciones'
import { ProveedorAgenteEvaluaciones, useAgenteJunto } from './evaluacion/agente-junto'
import { EditorEvaluacion } from './evaluacion/editor-evaluacion'
import { cerrarNombrePagina, renombrarPagina } from './operaciones'
import { VistaPresentacion } from './presentacion/vista-presentacion'
import type { AccionesRecurso } from './recursos'
import { VistaRoleplay } from './roleplay/vista-roleplay'
import { VistaAsistencia } from './asistencia/vista-asistencia'
import { ICONO_RECURSO } from './tipos-recurso'
import { CargandoVideo } from './video/cargando-video'

// La página tal como se está armando: el título, el recurso principal con sus acciones (Editar, Reemplazar), el aviso de
// la evaluación sin preguntas y los recursos complementarios. Es lo que ocupa la columna «Vista previa» del paso 2, y
// antes vivía en la hoja lateral «Editar página».
//
// Una página nunca queda sin recurso: quitarlo es eliminarla, y eso se hace desde el pie de la columna.

const MAX_TITULO_PAGINA = 120

/**
 * La columna de vista previa con lo que necesita el editor de evaluaciones: Orbit Flow, el agente de evaluaciones, se
 * abre desde dentro del editor y vive aquí al lado, en su propio panel.
 */
export function VistaPagina({ pagina, acciones }: { pagina: Pagina | undefined; acciones: (pagina: Pagina) => AccionesRecurso }) {
  const agente = useAgenteJunto()
  // Lo que el editor de la evaluación publica para que su barra pinte «Configuración» y «Orbit Flow».
  const [accionesEvaluacion, setAccionesEvaluacion] = useState<AccionesEvaluacion | null>(null)

  return (
    <ProveedorAgenteEvaluaciones value={agente.abrir}>
      <ProveedorAccionesEvaluacion value={setAccionesEvaluacion}>
        {pagina?.recurso ? <CuerpoPagina key={pagina.id} pagina={pagina} acciones={acciones(pagina)} evaluacion={accionesEvaluacion} /> : null}
      </ProveedorAccionesEvaluacion>
      {agente.pedido ? (
        <AgenteEvaluaciones
          abierto={agente.abierto}
          onAbiertoChange={agente.setAbierto}
          sesion={agente.sesion}
          paginaId={agente.pedido.paginaId}
          onGenerar={agente.pedido.onGenerar}
          junto
        />
      ) : null}
    </ProveedorAgenteEvaluaciones>
  )
}

export function CuerpoPagina({
  pagina,
  acciones,
  evaluacion,
}: {
  pagina: Pagina
  acciones: AccionesRecurso
  /** Solo en una evaluación: lo que publica su editor para la barra del recurso. */
  evaluacion?: AccionesEvaluacion | null
}) {
  const r = pagina.recurso
  if (!r) return null
  // La evaluación y las encuestas no se fusionan con su cabecera: traen una tarjeta por pregunta dentro.
  const esEvaluacion = r.tipo === 'evaluacion-final' || r.tipo === 'encuesta-libre' || r.tipo === 'encuesta-satisfaccion'
  // Se fusionan cabecera y recurso en una sola tarjeta salvo los que ya traen las suyas: la evaluación (una
  // tarjeta por pregunta), la asistencia y el roleplay.
  const fusiona = !esEvaluacion && r.tipo !== 'asistencia' && r.tipo !== 'roleplay'
  const sinPreguntas = faltanPreguntas(pagina)

  return (
    <div className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="cc-hoja-titulo">
          Título de la página
          <Text as="span" size="xs" variant="muted" className="ml-auto tabular-nums">
            {pagina.titulo.length}/{MAX_TITULO_PAGINA}
          </Text>
        </FieldLabel>
        <Input
          id="cc-hoja-titulo"
          maxLength={MAX_TITULO_PAGINA}
          placeholder="Escribe el título de la página"
          value={pagina.titulo}
          onChange={(e) => renombrarPagina(pagina.id, e.target.value)}
          onBlur={() => cerrarNombrePagina(pagina.id)}
        />
      </Field>

      {/* Sin «Ocultar esta evaluación»: en la creación no se ocultan páginas; eso solo existe al editar un contenido. */}

      {/* El recurso va en **una sola tarjeta**: arriba qué es y qué se puede hacer con él, una línea, y debajo el
          recurso. Antes eran dos tarjetas apiladas y la de arriba se leía como un aviso suelto.
          **No se fusiona** cuando lo de abajo ya trae sus propias tarjetas —la evaluación, con una por pregunta, y
          asistencia y roleplay, que traen su pieza—: meterlas dentro de otra tarjeta empeora justo lo que se quiere
          evitar, cajas sobre cajas (Dave, 6-oct). */}
      <Card size={fusiona ? undefined : 'sm'} className={fusiona ? 'gap-0! overflow-hidden py-0!' : undefined}>
        <CardContent className={cn('flex flex-wrap items-center gap-x-3 gap-y-2', fusiona && 'p-4!')}>
          <IconTile variant="soft" size="sm">
            <HugeiconsIcon icon={ICONO_RECURSO[r.tipo]} aria-hidden="true" />
          </IconTile>
          <div className="mr-auto flex min-w-0 flex-col">
            <Text as="span" size="xs" variant="muted">
              Recurso principal
            </Text>
            <Text as="span" size="sm" weight="semibold">
              {nombreRecurso(r)}
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {/* En una evaluación, lo que se hace con el recurso es configurarla o pedirle preguntas al agente. */}
            {evaluacion?.abrirConfiguracion ? (
              <Button variant="outline" size="sm" onClick={evaluacion.abrirConfiguracion}>
                <HugeiconsIcon icon={Settings02Icon} size={14} />
                Configuración
              </Button>
            ) : null}
            {acciones.editar ? (
              <Button variant="outline" size="sm" onClick={acciones.editar.onClick}>
                <HugeiconsIcon icon={Edit02Icon} size={14} />
                {acciones.editar.etiqueta}
              </Button>
            ) : null}
            {acciones.onReemplazar ? (
              <Button variant="outline" size="sm" onClick={acciones.onReemplazar}>
                <HugeiconsIcon icon={RefreshIcon} size={14} />
                Reemplazar
              </Button>
            ) : null}
            {/* El botón del agente contextual es el del sistema, ya dice «Orbit Flow» y va siempre el último de la fila
                (decisión 9 de la auditoría, 5-oct). Mientras la IA escribe las preguntas no abre otra conversación. */}
            {/* Las encuestas no traen agente: solo aparece cuando el editor lo publica (Dave, 7-oct). */}
            {evaluacion?.abrirAgente ? (
              <ReopenAgentButton compact onClick={() => !evaluacion.generando && evaluacion.abrirAgente?.()} />
            ) : null}
          </div>
          {r.tipo === 'pdf' ? (
            <Field orientation="horizontal" className="basis-full">
              <Switch
                id="cc-pdf-descarga"
                size="sm"
                checked={r.permitirDescarga !== false}
                onCheckedChange={(permitir) => actualizarPagina(pagina.id, { recurso: { ...r, permitirDescarga: permitir } })}
              />
              <FieldLabel htmlFor="cc-pdf-descarga">Permitir descarga del PDF a los colaboradores</FieldLabel>
            </Field>
          ) : null}
        </CardContent>
        {fusiona ? (
          <>
            <Separator />
            <RecursoPrincipal pagina={pagina} />
          </>
        ) : null}
      </Card>

      {sinPreguntas ? (
        <Alert variant="warning">
          <AlertTitle>Añade al menos una pregunta</AlertTitle>
          <AlertDescription>
            {/* Las encuestas no tienen agente todavía: sin Orbit Flow en el texto (Dave, 14-oct). */}
            <p>
              {r.tipo === 'encuesta-libre'
                ? 'Sin preguntas no se puede crear el contenido. Escríbelas para que los colaboradores puedan responder la encuesta.'
                : 'Sin preguntas no se puede crear el contenido. Escríbelas tú o genéralas con Orbit Flow.'}
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      {fusiona ? null : <RecursoPrincipal pagina={pagina} />}

      {!esEvaluacion && !r.generando ? <RecursosComplementarios key={pagina.id} pagina={pagina} /> : null}
    </div>
  )
}

/** El recurso de la página en su versión de edición (la misma que tenía el editor de la experiencia de estudio). */
function RecursoPrincipal({ pagina }: { pagina: Pagina }) {
  const r = pagina.recurso
  // El avance de la generación en segundo plano (el mismo del panel «Generando recursos»): el cargador muestra el %.
  const progreso = useBorrador().trabajos.find((t) => t.paginaId === pagina.id && t.estado === 'cargando')?.progreso
  if (!r) return null

  if (r.tipo === 'evaluacion-final') return <EditorEvaluacion key={pagina.id} paginaId={pagina.id} />
  // Las encuestas usan el mismo editor: la libre se arma entera, la de satisfacción solo se lee.
  if (r.tipo === 'encuesta-libre') return <EditorEvaluacion key={pagina.id} paginaId={pagina.id} encuesta />
  if (r.tipo === 'encuesta-satisfaccion') return <EditorEvaluacion key={pagina.id} paginaId={pagina.id} encuesta soloLectura />
  if (r.generando) return <Lienzo>{r.tipo === 'video' ? <CargandoVideo progreso={progreso} /> : <CargandoPresentacion progreso={progreso} />}</Lienzo>

  switch (r.tipo) {
    case 'video':
      return (
        <Lienzo>
          <VistaVideo recurso={r} />
        </Lienzo>
      )
    case 'pdf':
      return (
        <Lienzo>
          <VistaPdf recurso={r} />
        </Lienzo>
      )
    case 'scorm':
      return (
        <Lienzo>
          <VistaScorm recurso={r} />
        </Lienzo>
      )
    case 'presentacion-interactiva':
      return <Lienzo>{r.presentacion ? <VistaPresentacion datos={r.presentacion} /> : <VistaScorm recurso={r} />}</Lienzo>
    case 'embebido':
      return (
        <Lienzo>
          <VistaEmbebido recurso={r} />
        </Lienzo>
      )
    case 'texto':
      return (
        <Lienzo relleno>
          <VistaTexto recurso={r} />
        </Lienzo>
      )
    case 'asistencia':
      return r.asistencia ? <VistaAsistencia datos={r.asistencia} /> : null
    case 'roleplay':
      return r.roleplay ? <VistaRoleplay config={r.roleplay} /> : null
    default:
      return null
  }
}

/**
 * El cuerpo del recurso dentro de la tarjeta que comparte con su cabecera. Ya no lleva tarjeta propia: el recurso
 * eran dos tarjetas apiladas —la barra que dice qué es y la que lo pinta—, con un hueco y dos bordes entre ellas, así
 * que nada decía que fueran lo mismo y la de arriba parecía un aviso suelto (Dave, 6-oct).
 *
 * Y va **a sangre**, sin relleno: así el recurso es lo que manda en la tarjeta. El único con relleno es el texto,
 * porque un bloque de lectura pegado al borde queda volando.
 */
function Lienzo({ children, relleno = false }: { children: ReactNode; relleno?: boolean }) {
  return <div className={relleno ? 'p-4' : undefined}>{children}</div>
}
