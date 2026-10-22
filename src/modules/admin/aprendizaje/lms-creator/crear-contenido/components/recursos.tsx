import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Delete02Icon, Layers01Icon } from '@hugeicons/core-free-icons'
import { Button, Field, FieldError, FieldLabel, Input, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { notify } from '@/shared/components/notify'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { plural } from '@/modules/design-system/patrones/formato'
import {
  BASE_LMS,
  abrirIntencion,
  actualizarPagina,
  buscarPagina,
  confirmarRecurso,
  seccionesVisibles,
  setBorrador,
  type Borrador,
  type Pagina,
  type Recurso,
  type Seccion,
  type TipoRecurso,
} from './borrador'
import { AnadirPagina } from './anadir-pagina'
import { EditorTexto } from './editor-texto'
import { ModalEmbebido, ModalPdf, ModalScorm, ModalTexto } from './modales-recurso'
import { apagarPideConfirmar, crearPaginaEncuesta, crearPaginaEvaluacion, editarSeccion, eliminarPagina, eliminarSeccion, habilitarSecciones } from './operaciones'
import { ModalAgregarVideo } from './video/modal-agregar-video'
import { ModalAgregarPresentacion } from './presentacion/modal-agregar-presentacion'
import { ModalAgregarRoleplay } from './roleplay/modal-agregar-roleplay'
import { abrirEdicionPresentacion } from './presentacion/vista-presentacion'

// Todo lo que se hace con las páginas y secciones desde el editor: «Agregar página» (el selector de tipo y, detrás, el
// flujo de cada recurso), «Editar», «Reemplazar» y «Eliminar página», y las secciones. Es la lógica del paso «Recursos»
// del asistente anterior sin su maqueta: el editor pone la vista y esto pone los modales y las salidas.
//
// Nunca nace una página en blanco: el selector abre el flujo del recurso y la página se crea al confirmarlo
// (`abrirIntencion` → `confirmarRecurso`). Evaluación es la excepción: nace al elegirla, vacía de preguntas.

/** Los recursos que se crean en un modal sobre el editor (antes tenían dirección propia: /agregar-recurso/pdf…). */
type RecursoEnModal = 'pdf' | 'texto' | 'embebido' | 'scorm'

type Modal = { tipo: RecursoEnModal | 'video' | 'presentacion-interactiva' | 'roleplay'; volver: boolean; inicial?: Recurso } | null

export type AccionesRecurso = {
  /** «Editar», «Editar video», «Editar presentación»… */
  editar?: { etiqueta: string; onClick: () => void }
  onReemplazar?: () => void
}

type Opciones = {
  borrador: Borrador
  /** Se abrió una página (al confirmar un recurso o al volver de uno): el editor la muestra. */
  onVerPagina: (id: string) => void
}

export function useRecursos({ borrador, onVerPagina }: Opciones) {
  const navigate = useNavigate()
  const [anadir, setAnadir] = useState<{ seccionId: string; paginaId?: string } | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [confirmar, setConfirmar] = useState<
    { tipo: 'secciones' } | { tipo: 'seccion'; seccion: Seccion } | { tipo: 'pagina'; pagina: Pagina } | null
  >(null)
  const [editando, setEditando] = useState<Seccion | null>(null)

  const secciones = seccionesVisibles(borrador)
  const primeraSeccion = secciones[0]?.id ?? 'default'

  // Al volver de un recurso con «Volver» (video con IA, presentación, roleplay), se reabre «Agregar página» en la sección
  // que se estaba llenando.
  useEffect(() => {
    if (borrador.reabrirAnadir) {
      setAnadir({ seccionId: borrador.intencion?.seccionId ?? primeraSeccion, paginaId: borrador.intencion?.paginaId })
      setBorrador({ reabrirAnadir: false })
    }
  }, [borrador.reabrirAnadir, borrador.intencion, primeraSeccion])

  // ── Añadir página ──

  const elegirTipo = (tipo: TipoRecurso, titulo: string) => {
    const seccionId = anadir?.seccionId ?? primeraSeccion
    const paginaId = anadir?.paginaId
    setAnadir(null)
    // Las encuestas nacen aquí mismo, igual que la evaluación: no hay nada que configurar antes.
    if (tipo === 'encuesta-libre' || tipo === 'encuesta-satisfaccion') {
      onVerPagina(crearPaginaEncuesta(seccionId, titulo, tipo === 'encuesta-satisfaccion'))
      return
    }
    if (tipo === 'evaluacion-final') {
      if (paginaId) {
        actualizarPagina(paginaId, { recurso: { tipo: 'evaluacion-final', preguntas: [] } })
        onVerPagina(paginaId)
        return
      }
      onVerPagina(crearPaginaEvaluacion(seccionId, titulo))
      return
    }
    abrirIntencion({ seccionId, titulo, tipo, paginaId })
    if (tipo === 'video') setModal({ tipo: 'video', volver: true })
    // Igual que el video: primero la puerta —crear una nueva o retomar una que ya existe— y después el setup.
    else if (tipo === 'presentacion-interactiva') setModal({ tipo: 'presentacion-interactiva', volver: true })
    // El roleplay también abre su puerta: ahí se decide si lo propone la IA o se llena a mano.
    else if (tipo === 'roleplay') setModal({ tipo: 'roleplay', volver: true })
    else if (tipo === 'asistencia') navigate(`${BASE_LMS}/agregar-asistencia`)
    else setModal({ tipo: tipo as RecursoEnModal, volver: true })
  }

  // ── Salidas de los modales de recurso ──

  const cerrarModal = () => {
    setModal(null)
    setBorrador({ intencion: null })
  }

  const volverModal = () => {
    setModal(null)
    setAnadir({ seccionId: borrador.intencion?.seccionId ?? primeraSeccion, paginaId: borrador.intencion?.paginaId })
  }

  const confirmarModal = (recurso: Recurso) => {
    const activa = buscarPagina(borrador, borrador.paginaActiva)?.pagina
    // Editar (texto o asistencia) sobreescribe la página activa; lo demás entra por la intención.
    const id = modal?.inicial && activa ? (actualizarPagina(activa.id, { recurso }), activa.id) : confirmarRecurso(recurso)
    setModal(null)
    onVerPagina(id)
  }

  const reemplazar = (pagina: Pagina) => {
    const tipo = pagina.recurso?.tipo
    if (!tipo) return
    const seccionId = buscarPagina(borrador, pagina.id)?.seccion.id ?? primeraSeccion
    if (tipo === 'evaluacion-final' || tipo === 'encuesta-libre' || tipo === 'encuesta-satisfaccion' || tipo === 'asistencia' || tipo === 'roleplay' || tipo === 'texto') {
      // Estos no tienen un «mismo flujo» que reemplace: se elige otro tipo para la misma página.
      setAnadir({ seccionId, paginaId: pagina.id })
      return
    }
    abrirIntencion({ seccionId, titulo: '', tipo, paginaId: pagina.id })
    setModal({ tipo: tipo as RecursoEnModal | 'video' | 'presentacion-interactiva', volver: false })
  }

  /** Qué ofrece la barra del recurso de una página: editar (si ese tipo se edita) y reemplazar. */
  const accionesDe = (pagina: Pagina): AccionesRecurso => {
    const r = pagina.recurso
    if (!r || r.generando) return {}
    const seccionId = buscarPagina(borrador, pagina.id)?.seccion.id ?? primeraSeccion
    const reemplazo = () => reemplazar(pagina)
    if (r.tipo === 'evaluacion-final' || r.tipo === 'encuesta-libre' || r.tipo === 'encuesta-satisfaccion') return {}
    if (r.tipo === 'texto') return { editar: { etiqueta: 'Editar', onClick: () => setModal({ tipo: 'texto', volver: false, inicial: r }) }, onReemplazar: reemplazo }
    if (r.tipo === 'asistencia')
      return {
        editar: {
          etiqueta: 'Editar',
          onClick: () => {
            abrirIntencion({ seccionId, titulo: pagina.titulo, tipo: 'asistencia', paginaId: pagina.id })
            navigate(`${BASE_LMS}/agregar-asistencia`)
          },
        },
      }
    if (r.tipo === 'roleplay')
      return {
        editar: {
          etiqueta: 'Editar',
          onClick: () => {
            abrirIntencion({ seccionId, titulo: '', tipo: 'roleplay', paginaId: pagina.id })
            navigate(`${BASE_LMS}/agregar-roleplay`)
          },
        },
        onReemplazar: reemplazo,
      }
    if (r.tipo === 'video' && r.generadoConIA)
      return {
        editar: {
          etiqueta: 'Editar',
          onClick: () => {
            if (r.origenVideo === 'avatar') {
              notify('No hay un borrador editable para este video. Genera uno con IA de nuevo.', undefined, 'warning')
              return
            }
            abrirIntencion({ seccionId, titulo: '', tipo: 'video', paginaId: pagina.id })
            navigate(`${BASE_LMS}/agregar-video/editor`)
          },
        },
        onReemplazar: reemplazo,
      }
    if (r.tipo === 'presentacion-interactiva' && r.presentacion)
      return {
        editar: {
          etiqueta: 'Editar',
          onClick: () => {
            if (!abrirEdicionPresentacion(r.presentacion)) {
              notify('No hay datos editables para esta presentación. Genera una con IA de nuevo.', undefined, 'warning')
              return
            }
            abrirIntencion({ seccionId, titulo: '', tipo: 'presentacion-interactiva', paginaId: pagina.id })
            navigate(`${BASE_LMS}/agregar-presentacion-interactiva/editor`)
          },
        },
        onReemplazar: reemplazo,
      }
    // Video, PDF, SCORM, embebido y presentación: «Reemplazar» abre el mismo flujo del tipo, no el selector.
    return { onReemplazar: reemplazo }
  }

  // ── Secciones ──

  const alternarSecciones = (encender: boolean) => {
    if (!encender && apagarPideConfirmar()) setConfirmar({ tipo: 'secciones' })
    else habilitarSecciones(encender)
  }

  const pedirEliminarSeccion = (seccion: Seccion) => {
    if (secciones.length <= 1) {
      notify('Debe haber al menos una sección.', undefined, 'warning')
      return
    }
    setConfirmar({ tipo: 'seccion', seccion })
  }

  const modales = (
    <>
      <AnadirPagina abierto={Boolean(anadir)} evento={borrador.evento} onCerrar={() => setAnadir(null)} onElegir={elegirTipo} />

      <ModalPdf abierto={modal?.tipo === 'pdf'} onCerrar={cerrarModal} onVolver={modal?.volver ? volverModal : undefined} onConfirmar={confirmarModal} />
      <ModalEmbebido abierto={modal?.tipo === 'embebido'} onCerrar={cerrarModal} onVolver={modal?.volver ? volverModal : undefined} onConfirmar={confirmarModal} />
      <ModalScorm abierto={modal?.tipo === 'scorm'} onCerrar={cerrarModal} onVolver={modal?.volver ? volverModal : undefined} onConfirmar={confirmarModal} />
      <ModalTexto
        abierto={modal?.tipo === 'texto'}
        inicial={modal?.inicial?.html}
        onCerrar={cerrarModal}
        onVolver={modal?.volver ? volverModal : undefined}
        onConfirmar={confirmarModal}
      />
      <ModalAgregarRoleplay
        abierto={modal?.tipo === 'roleplay'}
        onCerrar={cerrarModal}
        onVolver={modal?.volver ? volverModal : undefined}
        onListo={(paginaId) => {
          setModal(null)
          onVerPagina(paginaId)
        }}
      />
      <ModalAgregarPresentacion
        abierto={modal?.tipo === 'presentacion-interactiva'}
        onCerrar={cerrarModal}
        onVolver={modal?.volver ? volverModal : undefined}
      />
      <ModalAgregarVideo
        abierto={modal?.tipo === 'video'}
        onCerrar={cerrarModal}
        onVolver={modal?.volver ? volverModal : undefined}
        onListo={(id) => {
          setModal(null)
          onVerPagina(id)
        }}
      />

      <EditarSeccion seccion={editando} onCerrar={() => setEditando(null)} />

      <DialogoConfirmar
        abierto={confirmar?.tipo === 'secciones'}
        onAbiertoChange={(v) => !v && setConfirmar(null)}
        icono={Layers01Icon}
        titulo="¿Deshabilitar las secciones?"
        descripcion="Todas las páginas se mueven a una sola sección y los títulos que les pusiste se pierden. No se puede deshacer."
        accion="Deshabilitar secciones"
        onConfirmar={() => {
          habilitarSecciones(false)
          setConfirmar(null)
        }}
      />
      <DialogoConfirmar
        abierto={confirmar?.tipo === 'seccion'}
        onAbiertoChange={(v) => !v && setConfirmar(null)}
        icono={Delete02Icon}
        titulo="¿Eliminar la sección?"
        descripcion={
          <>
            <strong>Se eliminan también todas las páginas que tenga dentro</strong>, con sus recursos. No se puede deshacer.
          </>
        }
        accion="Eliminar sección"
        destructiva
        onConfirmar={() => {
          if (confirmar?.tipo === 'seccion') eliminarSeccion(confirmar.seccion.id)
          setConfirmar(null)
        }}
      >
        {/* El nombre va en el cuerpo, no en el título: el título dice qué es la ventana (acuerdo del 6-oct). */}
        {confirmar?.tipo === 'seccion' ? (
          <RegistroConfirmar
            nombre={confirmar.seccion.titulo.trim() || 'Sección sin título'}
            detalle={plural(confirmar.seccion.paginas.length, '1 página', `${confirmar.seccion.paginas.length} páginas`)}
            tono="neutro"
          />
        ) : null}
      </DialogoConfirmar>
      <DialogoConfirmar
        abierto={confirmar?.tipo === 'pagina'}
        onAbiertoChange={(v) => !v && setConfirmar(null)}
        icono={Delete02Icon}
        titulo="¿Eliminar la página?"
        descripcion="Se pierde con todos los recursos que tenga dentro. No se puede deshacer."
        accion="Eliminar página"
        destructiva
        onConfirmar={() => {
          if (confirmar?.tipo === 'pagina') eliminarPagina(confirmar.pagina.id)
          setConfirmar(null)
        }}
      >
        {confirmar?.tipo === 'pagina' ? (
          <RegistroConfirmar nombre={confirmar.pagina.titulo.trim() || 'Página sin título'} detalle="Página del contenido" tono="neutro" />
        ) : null}
      </DialogoConfirmar>
    </>
  )

  return {
    /** «Agregar página» en una sección (sin sección: la primera). */
    anadirPagina: (seccionId?: string) => setAnadir({ seccionId: seccionId ?? primeraSeccion }),
    accionesDe,
    pedirEliminarPagina: (pagina: Pagina) => setConfirmar({ tipo: 'pagina', pagina }),
    alternarSecciones,
    pedirEliminarSeccion,
    editarSeccion: setEditando,
    modales,
  }
}

// ── Editar sección ───────────────────────────────────────────────────────────────────────────────────────────────

function EditarSeccion({ seccion, onCerrar }: { seccion: Seccion | null; onCerrar: () => void }) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [clave, setClave] = useState(0)

  useEffect(() => {
    if (seccion) {
      setTitulo(seccion.titulo)
      setDescripcion(seccion.descripcion)
      setClave((c) => c + 1)
    }
  }, [seccion])

  const invalido = titulo.trim().length < 2
  const cambio = useMemo(() => Boolean(seccion) && (titulo !== seccion?.titulo || descripcion !== seccion?.descripcion), [seccion, titulo, descripcion])

  return (
    // La única ventana del sistema (ActionDialog, decisión 4 de la auditoría, 5-oct).
    <ActionDialog
      open={Boolean(seccion)}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      title="Editar sección"
      footer={
        <>
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            disabled={!cambio || invalido}
            onClick={() => {
              if (seccion) editarSeccion(seccion.id, titulo.trim(), descripcion)
              onCerrar()
            }}
          >
            Guardar cambios
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 py-1">
        <Field data-invalid={invalido ? 'true' : undefined}>
          <FieldLabel htmlFor="cc-seccion-titulo">
            Título de la sección
            <Text as="span" size="xs" className="ml-auto text-muted-foreground tabular-nums">
              {titulo.length}/60
            </Text>
          </FieldLabel>
          <Input
            id="cc-seccion-titulo"
            maxLength={60}
            placeholder="Escribe el título de la sección"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            aria-invalid={invalido ? true : undefined}
          />
          {invalido ? <FieldError>Mínimo 2 caracteres</FieldError> : null}
        </Field>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Text as="span" size="sm" weight="medium">
              Descripción
            </Text>
            <Badge variant="secondary" size="xs">
              Opcional
            </Badge>
          </div>
          <EditorTexto key={clave} id="cc-seccion-descripcion" valor={descripcion} onCambio={setDescripcion} placeholder="Agrega una descripción para la sección aquí" alto={120} />
        </div>
      </div>
    </ActionDialog>
  )
}
