import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Delete02Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Accordion, Alert, AlertDescription, AlertTitle, Button, FramePanel, Text } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import {
  SYSTEM_DEMOGRAPHICS,
  activateAllCatalogDemographics,
  buildCustomDemographic,
  buildImportedDemographic,
  buildSystemDemographic,
  deactivateAllBySource,
  findFieldByCatalogKey,
  importedCatalogKey,
  toggleCatalogDemographic,
  visibleFields,
} from '../../modelo/demographics'
// El constructor del módulo es el de demographicsLibrary, que lee la biblioteca viva (lo que trae la plataforma y lo que el
// equipo creó). El de modelo/demographics solo conoce lo que trae la plataforma: con él, lo creado no se activaba.
import { addFieldToLibrary, addFieldsToLibrary, buildLibraryDemographic, findLibraryDemographicByLabel, isInLibrary, useDemographicsLibrary } from '../../modelo/demographicsLibrary'
import type { DemographicField, DemographicsConfig, ImportedDemographic } from '../../modelo/surveyBuilderTypes'
import { DrawerDato, type EditorDato } from './demograficos/drawer-dato'
import { FilaDato } from './demograficos/fila-dato'
import { ContenedorDesplegable } from './participantes/contenedor-desplegable'
import { AvisoEnCurso, EnCurso } from './aviso-en-curso'

// Paso 3 · Datos demográficos: por qué se podrán cortar los resultados. Se combinan cuatro orígenes:
// los que ya creó el equipo en el módulo, los que trae el archivo de participantes, los que la
// plataforma ya tiene de cada persona, y los que se crean solo para esta encuesta. Cada origen es un acordeón: abrirlo
// solo muestra su lista, y dentro se activa o se quita cada dato. Abrir el paso ya cuenta como haberlo decidido.

function resumenVisibilidad(total: number, visibles: number): string {
  if (visibles === 0) return 'El participante no editará ningún dato demográfico: todos se toman directo de los registros del sistema.'
  if (visibles === total) return total === 1 ? 'El participante responderá o podrá editar 1 pregunta demográfica.' : `El participante responderá o podrá editar ${total} preguntas demográficas.`
  return `El participante responderá o podrá editar ${visibles} de ${total}; el resto no permite edición y se toma directo del sistema.`
}

type Seccion = 'custom' | 'library' | 'import' | 'system'

// Un acordeón por cada origen, como en Participantes (9-oct): sin interruptor. La flecha solo abre o cierra la lista; lo
// que entra en la encuesta se decide adentro, dato por dato o con «Activar todos» y «Quitar todos». Se abren de uno en uno.
function Contenedor({ id, titulo, detalle, conteo, children }: { id: Seccion; titulo: string; detalle: string; conteo?: string; children?: ReactNode }) {
  return (
    <ContenedorDesplegable id={id} titulo={titulo} detalle={detalle} conteo={conteo}>
      <FramePanel className="flex flex-col gap-2">{children}</FramePanel>
    </ContenedorDesplegable>
  )
}

type Masiva = { etiqueta: string; onClick: () => void }

// Acciones que se aplican a todos los datos del contenedor. Las de activar y quitar van a la izquierda; guardar o
// permitir/no permitir edición van a la derecha.
function AccionesMasivas({
  acciones,
  accionesDerecha = [],
  onMostrar,
  onOcultar,
  bloqueado,
}: {
  acciones: Masiva[]
  accionesDerecha?: Masiva[]
  onMostrar?: () => void
  onOcultar?: () => void
  bloqueado: boolean
}) {
  const boton = (etiqueta: string, onClick: () => void) => (
    <EnCurso key={etiqueta} bloqueado={bloqueado}>
      <Button variant="ghost" size="sm" disabled={bloqueado} onClick={onClick}>
        {etiqueta}
      </Button>
    </EnCurso>
  )
  return (
    <div className="flex flex-wrap items-center justify-between gap-2" style={{ paddingRight: 'calc(0.75rem + 1px)' }}>
      <div className="flex flex-wrap gap-2">
        {acciones.map((accion) => boton(accion.etiqueta, accion.onClick))}
      </div>
      {accionesDerecha.length > 0 || (onMostrar && onOcultar) ? (
        <div className="flex flex-wrap gap-2">
          {accionesDerecha.map((accion) => boton(accion.etiqueta, accion.onClick))}
          {onMostrar && onOcultar ? (
            <>
              {boton('Permitir edición en todos', onMostrar)}
              {boton('No permitir edición en todos', onOcultar)}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function PasoDemograficos({
  config,
  onCambio,
  importados,
  importadosNuevos,
  enCurso = false,
  errorNorma = false,
}: {
  config: DemographicsConfig
  onCambio: (config: DemographicsConfig) => void
  importados: readonly ImportedDemographic[]
  importadosNuevos: number
  /** La encuesta ya está en curso: los datos se ven, pero no se activan, crean, editan ni quitan. */
  enCurso?: boolean
  /** Una NOM 035 que intentó seguir sin ningún dato activo: la norma pide al menos uno (PAR-107). */
  errorNorma?: boolean
}) {
  const biblioteca = useDemographicsLibrary()
  const [editor, setEditor] = useState<EditorDato | null>(null)
  // Los datos creados para la encuesta que se van a eliminar: se pregunta antes, porque no se pueden recuperar (PAR-103).
  const [porEliminar, setPorEliminar] = useState<readonly DemographicField[] | null>(null)
  const { fields } = config
  const deOrigenEn = (lista: readonly DemographicField[], origen: Seccion) => lista.filter((campo) => campo.source === origen)

  // Catálogo de los datos creados para esta encuesta: permite desactivarlos con el Switch sin que desaparezcan de la lista.
  const [catalogoPropios, setCatalogoPropios] = useState<readonly DemographicField[]>(() => fields.filter((campo) => campo.source === 'custom'))
  const listaPropios = [
    ...catalogoPropios.map((item) => fields.find((f) => f.id === item.id && f.source === 'custom') ?? item),
    ...fields.filter((f) => f.source === 'custom' && !catalogoPropios.some((c) => c.id === f.id)),
  ]

  // Arranca abierto el primer origen que ya trae datos activos (si no, el del módulo).
  const [abierta, setAbierta] = useState<string[]>(() => [(['custom', 'library', 'import', 'system'] as const).find((origen) => deOrigenEn(config.fields, origen).length > 0) ?? 'library'])

  const campos = (siguientes: readonly DemographicField[]) => onCambio({ ...config, enabled: true, fields: siguientes })
  const cambiarCampo = (campo: DemographicField) => {
    setCatalogoPropios((previos) => previos.map((item) => (item.id === campo.id ? campo : item)))
    campos(fields.map((actual) => (actual.id === campo.id ? campo : actual)))
  }
  const editar =
    (campo: DemographicField | null, opcionesFijas = false) =>
    () =>
      campo && setEditor({ campo, esNuevo: false, opcionesFijas })
  const deOrigen = (origen: DemographicField['source']) => fields.filter((campo) => campo.source === origen)
  const propiosActivos = deOrigen('custom')
  const conArchivo = importadosNuevos > 0 && importados.length > 0

  const alternarPropioActivo = (campo: DemographicField, activo: boolean) => {
    if (activo) {
      if (!fields.some((actual) => actual.id === campo.id)) campos([...fields, campo])
    } else {
      campos(fields.filter((actual) => actual.id !== campo.id))
    }
  }

  const visibles = visibleFields(fields).length
  // Para no crear un dato con un nombre que ya existe: los del sistema, los del módulo y los que ya tiene esta encuesta
  // (sin contar el que se está editando).
  const nombresUsados = [
    ...SYSTEM_DEMOGRAPHICS.map((entrada) => entrada.label),
    ...biblioteca.map((entrada) => entrada.label),
    ...listaPropios.filter((campo) => campo.id !== editor?.campo.id).map((campo) => campo.label),
    ...fields.filter((campo) => campo.source !== 'custom' && campo.id !== editor?.campo.id).map((campo) => campo.label),
  ]

  // Guardar desde el panel: uno nuevo se suma a la encuesta (y abre «solo para esta encuesta»); uno existente se reemplaza.
  const guardarEditor = (campo: DemographicField, esNuevo: boolean) => {
    if (esNuevo) {
      // Un dato nuevo abre su acordeón, para verlo en su lista.
      setAbierta(['custom'])
      setCatalogoPropios((previos) => [...previos, campo])
      campos([...fields, campo])
    } else {
      cambiarCampo(campo)
    }
    setEditor(null)
  }

  const visibilidadDe = (origen: Seccion, visible: boolean) => campos(fields.map((campo) => (campo.source === origen ? { ...campo, visible } : campo)))
  // Permitir o no edición al participante solo se ofrece en los precargados del sistema (`conVisibilidad`).
  // Y solo cuando hay alguno activo: sin datos no hay nada que configurar.
  const masivas = (origen: Seccion, acciones: Masiva[] = [], quitar = true, conVisibilidad = false, accionesDerecha: Masiva[] = []) => {
    const hayActivos = deOrigenEn(fields, origen).length > 0
    return (
      <AccionesMasivas
        acciones={quitar ? [...acciones, { etiqueta: 'Quitar todos', onClick: () => campos(deactivateAllBySource(fields, origen)) }] : acciones}
        accionesDerecha={accionesDerecha}
        onMostrar={conVisibilidad && hayActivos ? () => visibilidadDe(origen, true) : undefined}
        onOcultar={conVisibilidad && hayActivos ? () => visibilidadDe(origen, false) : undefined}
        bloqueado={enCurso}
      />
    )
  }

  const confirmarEliminar = () => {
    if (porEliminar && porEliminar.length > 0) {
      const ids = new Set(porEliminar.map((campo) => campo.id))
      setCatalogoPropios((previos) => previos.filter((actual) => !ids.has(actual.id)))
      campos(fields.filter((actual) => !ids.has(actual.id)))
      notify(
        porEliminar.length === 1 ? 'Eliminamos el dato de la encuesta' : `Eliminamos ${porEliminar.length} datos de la encuesta`,
        porEliminar.length === 1 ? porEliminar[0].label.trim() || 'Dato sin nombre' : undefined,
        'success',
      )
    }
    setPorEliminar(null)
    setEditor(null)
  }
  const varios = porEliminar !== null && porEliminar.length > 1
  const nombres = (porEliminar ?? []).map((campo) => `«${campo.label.trim() || 'Dato sin nombre'}»`)
  const nombresPorEliminar = nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}` : (nombres[0] ?? '')
  // Guardar todos en el módulo: los que tienen nombre y todavía no están. Pasan a la sección del módulo, ya activos.
  const guardarPropiosEnModulo = () => {
    const guardables = listaPropios.filter((campo) => campo.label.trim() !== '' && !isInLibrary(campo.label))
    const guardados = addFieldsToLibrary(guardables)
    const idsGuardables = new Set(guardables.map((campo) => campo.id))
    setCatalogoPropios((previos) => previos.filter((campo) => !idsGuardables.has(campo.id)))
    campos(
      fields.map((actual) => {
        if (!idsGuardables.has(actual.id)) return actual
        const entrada = findLibraryDemographicByLabel(actual.label)
        return entrada ? { ...actual, source: 'library' as const, catalogKey: entrada.key } : actual
      }),
    )
    notify(guardados > 0 ? `Guardamos ${guardados} ${guardados === 1 ? 'pregunta' : 'preguntas'} para reutilizar en futuras encuestas` : 'Ya estaban guardadas para reutilizar', undefined, 'success')
  }

  const agregarPropio = () => {
    setEditor({ campo: buildCustomDemographic(), esNuevo: true, opcionesFijas: false })
  }

  // Guardarlo en el módulo lo vuelve reutilizable: pasa a la sección del módulo, ya activo.
  const guardarEnModulo = (campo: DemographicField) => {
    addFieldToLibrary(campo)
    const entrada = findLibraryDemographicByLabel(campo.label)
    if (!entrada) return notify('No se pudo guardar la pregunta', 'Ponle un enunciado que no se repita con otro del módulo.', 'error')
    setCatalogoPropios((previos) => previos.filter((actual) => actual.id !== campo.id))
    const yaEstabaActivo = fields.some((actual) => actual.id === campo.id)
    campos(
      yaEstabaActivo
        ? fields.map((actual) => (actual.id === campo.id ? { ...actual, source: 'library', catalogKey: entrada.key } : actual))
        : [...fields, { ...campo, source: 'library', catalogKey: entrada.key }],
    )
    notify('Pregunta guardada para reutilizar', `«${entrada.label}» ya se puede reutilizar en futuras encuestas.`, 'success')
  }

  return (
    <div className="flex flex-col gap-4">
      {enCurso ? <AvisoEnCurso que="Los datos demográficos" /> : null}
      {errorNorma ? (
        <Alert variant="destructive">
          <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
          <AlertTitle>La NOM 035 pide al menos un dato demográfico</AlertTitle>
          <AlertDescription>Activa uno de las listas de abajo para continuar: la norma pide leer los resultados por grupo.</AlertDescription>
        </Alert>
      ) : null}
      {/* Arriba del todo: a la izquierda qué hace el botón y, a la derecha, el botón para crear un dato solo para esta encuesta. */}
      <div className="flex items-center justify-between gap-3">
        <Text as="p" size="sm" variant="muted">
          ¿Te falta un dato que no está en las listas? Créalo solo para esta encuesta.
        </Text>
        <EnCurso bloqueado={enCurso} className="shrink-0">
          <Button variant="outline" className="shrink-0" disabled={enCurso} onClick={agregarPropio}>
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
            Crear un dato para esta encuesta
          </Button>
        </EnCurso>
      </div>

      <Accordion value={abierta} onValueChange={(valor) => setAbierta(valor as string[])} className="gap-4">
      {/* Solo se muestra si hay datos creados para esta encuesta. Sin datos no hay nada que listar. */}
      {listaPropios.length > 0 ? (
        <Contenedor
          id="custom"
          titulo="Creados para esta encuesta"
          detalle="Los que armas aquí, a tu medida. Solo se usan en esta encuesta."
          conteo={`${propiosActivos.length}/${listaPropios.length} activos`}
        >
          {masivas(
            'custom',
            [
              {
                etiqueta: 'Activar todos',
                onClick: () => {
                  const faltantes = listaPropios.filter((item) => !fields.some((actual) => actual.id === item.id))
                  if (faltantes.length > 0) campos([...fields, ...faltantes])
                },
              },
            ],
            true,
            false,
            listaPropios.some((campo) => campo.label.trim() !== '' && !isInLibrary(campo.label))
              ? [{ etiqueta: 'Guardar todos para reutilizar', onClick: guardarPropiosEnModulo }]
              : [],
          )}
          {listaPropios.map((item) => {
            const campoActivo = fields.find((actual) => actual.id === item.id && actual.source === 'custom') ?? null
            return (
              <FilaDato
                key={item.id}
                titulo={item.label}
                conVisibilidad={false}
                bloqueado={enCurso}
                detalle="Solo en esta encuesta"
                campo={campoActivo}
                onActivar={(activo) => alternarPropioActivo(item, activo)}
                onEditar={editar(campoActivo ?? item)}
                onCambio={cambiarCampo}
                onQuitar={() => setPorEliminar([item])}
                onGuardar={item.label.trim() !== '' && !isInLibrary(item.label) ? () => guardarEnModulo(item) : undefined}
              />
            )
          })}
        </Contenedor>
      ) : null}

      <Contenedor
        id="library"
        titulo="Guardados para reutilizar"
        detalle="Los que tu equipo creó antes en Datos demográficos. Puedes usarlos en cualquier encuesta."
        conteo={`${biblioteca.filter((entrada) => findFieldByCatalogKey(fields, entrada.key)).length}/${biblioteca.length} agregados`}
      >
        {masivas('library', [{ etiqueta: 'Activar todos', onClick: () => campos(activateAllCatalogDemographics(fields, biblioteca, buildLibraryDemographic)) }], true, false)}
        {biblioteca.map((entrada) => {
          const campo = findFieldByCatalogKey(fields, entrada.key)
          return (
            <FilaDato
              key={entrada.key}
              titulo={entrada.label}
              detalle={`${entrada.optionLabels.length} opciones`}
              conVisibilidad={false}
              editable={false}
              bloqueado={enCurso}
              campo={campo}
              onActivar={(activo) => campos(toggleCatalogDemographic(fields, entrada.key, activo, buildLibraryDemographic))}
              onEditar={editar(campo)}
              onCambio={cambiarCampo}
            />
          )
        })}
      </Contenedor>

      {conArchivo ? (
        <Contenedor
          id="import"
          titulo="Datos demográficos en usuarios nuevos"
          detalle="Área, líder y las demás columnas que trae el archivo de los nuevos."
          conteo={`${importados.filter((entrada) => findFieldByCatalogKey(fields, importedCatalogKey(entrada.key))).length}/${importados.length} activos`}
        >
          {masivas(
            'import',
            [
              {
                etiqueta: 'Activar todos',
                onClick: () => campos(activateAllCatalogDemographics(fields, importados.map((e) => ({ ...e, key: importedCatalogKey(e.key) })), (clave) => buildImportedDemographic(importados.find((i) => importedCatalogKey(i.key) === clave)!))),
              },
            ],
            true,
            false,
            [
              {
                etiqueta: 'Guardar todos para reutilizar',
                onClick: () => {
                  const guardados = addFieldsToLibrary(deOrigen('import'))
                  notify(guardados > 0 ? `Guardamos ${guardados} preguntas para reutilizar en futuras encuestas` : 'Ya estaban todas guardadas para reutilizar', undefined, 'success')
                },
              },
            ],
          )}
          {importados.map((entrada) => {
            const clave = importedCatalogKey(entrada.key)
            const campo = findFieldByCatalogKey(fields, clave)
            return (
              <FilaDato
                key={entrada.key}
                titulo={entrada.label}
                detalle={`Del archivo · ${entrada.optionLabels.length} valores`}
                conVisibilidad={false}
                bloqueado={enCurso}
                campo={campo}
                onActivar={(activo) => campos(toggleCatalogDemographic(fields, clave, activo, () => buildImportedDemographic(entrada)))}
                onEditar={editar(campo)}
                onCambio={cambiarCampo}
              />
            )
          })}
        </Contenedor>
      ) : null}

      <Contenedor
        id="system"
        titulo="Ya los tenemos de tus colaboradores"
        detalle="Como área, sede o antigüedad: salen del perfil de cada persona, no hay que preguntárselos."
        conteo={`${SYSTEM_DEMOGRAPHICS.filter((entrada) => findFieldByCatalogKey(fields, entrada.key)).length}/${SYSTEM_DEMOGRAPHICS.length} activos`}
      >
        <Text as="p" size="sm" variant="muted">
          En los datos precargados puedes elegir si el participante puede editarlos al responder o si no permiten edición.
        </Text>
        {masivas('system', [{ etiqueta: 'Activar todos', onClick: () => campos(activateAllCatalogDemographics(fields, SYSTEM_DEMOGRAPHICS, buildSystemDemographic)) }], true, true)}
        {SYSTEM_DEMOGRAPHICS.map((entrada) => {
          const campo = findFieldByCatalogKey(fields, entrada.key)
          return (
            <FilaDato
              key={entrada.key}
              titulo={entrada.label}
              detalle={entrada.origin}
              bloqueado={enCurso}
              campo={campo}
              onActivar={(activo) => campos(toggleCatalogDemographic(fields, entrada.key, activo, buildSystemDemographic))}
              editable={false}
              onEditar={editar(campo)}
              onCambio={cambiarCampo}
            />
          )
        })}
      </Contenedor>
      </Accordion>

      <Text as="p" size="sm" variant="muted" aria-live="polite">
        {fields.length > 0 ? resumenVisibilidad(fields.length, visibles) : 'Todavía no hay datos activos: activa uno o crea uno para esta encuesta.'}
      </Text>
      <DrawerDato editor={editor} nombresUsados={nombresUsados} onGuardar={guardarEditor} onCancelar={() => setEditor(null)} onEliminar={editor?.campo.source === 'custom' && !enCurso ? (campo) => setPorEliminar([campo]) : undefined} />
      <DialogoConfirmar
        abierto={porEliminar !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : setPorEliminar(null))}
        icono={Delete02Icon}
        titulo={varios ? '¿Eliminar los datos demográficos?' : '¿Eliminar el dato demográfico?'}
        descripcion={
          varios
            ? `${nombresPorEliminar} salen de esta encuesta y no se pueden recuperar. Si guardaste alguno en el módulo, allá sigue.`
            : `${nombresPorEliminar} sale de esta encuesta y no se puede recuperar. Si lo guardaste en el módulo, allá sigue.`
        }
        accion={varios ? 'Eliminar datos' : 'Eliminar dato'}
        destructiva
        onConfirmar={confirmarEliminar}
      />
    </div>
  )
}
