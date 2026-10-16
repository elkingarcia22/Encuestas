import { useEffect, useRef, useState } from 'react'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import { notify } from '@/shared/components/notify'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { AgregarEtapa } from './biblioteca-etapas'
import { configurarConIa } from './configurar-con-ia'
import { DialogoEtapa } from './dialogo-etapa'
import { FlujoCandidato } from './flujo-candidato'
import { PanelAgente } from './panel-agente'
import { PanelEntrevista } from './panel-entrevista'
import { PanelPruebas } from './panel-pruebas'
import { CATALOGO, FLUJO_RECOMENDADO, etapaDelCatalogo, etapaPropia, type EtapaCatalogo, type EtapaFlujo } from './etapas'

type Props = {
  nombreVacante: string
  etapas: EtapaFlujo[]
  onEtapas: (etapas: EtapaFlujo[]) => void
  // Tras intentar publicar con etapas sin configurar: sus avisos pasan a error.
  mostrarErrores: boolean
  onGenerandoIa: (mensaje: string | null) => void
}

// Lo que tarda «Configurar con IA» una etapa en la maqueta.
const MS_CONFIGURAR_CON_IA = 1400

// Paso 3: el camino que recorre quien se postula, en el orden en que va. Las etapas se sacan de la
// biblioteca desde «Agregar etapa» y las que llevan IA abren su configuración en un panel lateral.
export function PasoProceso({ nombreVacante, etapas, onEtapas, mostrarErrores, onGenerandoIa }: Props) {
  const [propias, setPropias] = useState<EtapaCatalogo[]>([])
  const [creando, setCreando] = useState(false)
  // La etapa propia que se está editando; null crea una nueva en vez de cambiar una existente.
  const [editando, setEditando] = useState<EtapaCatalogo | null>(null)
  // La etapa propia que se va a eliminar de la biblioteca, a la espera de que se confirme.
  const [porEliminar, setPorEliminar] = useState<EtapaCatalogo | null>(null)
  const [configurando, setConfigurando] = useState<string | null>(null)
  const [desplegada, setDesplegada] = useState<string | null>(null)
  // «Configurar con IA» desde la fila: mientras la IA trabaja, la etapa lo dice en su botón; al terminar, el
  // configurador abre con lo que propuso para revisarlo. Si se cancela, la etapa queda como estaba.
  const [porIa, setPorIa] = useState<string | null>(null)
  const [propuesta, setPropuesta] = useState<EtapaFlujo | null>(null)
  const relojIa = useRef<number | null>(null)
  useEffect(() => () => window.clearTimeout(relojIa.current ?? undefined), [])

  const enFlujo = etapas.find((etapa) => etapa.clave === configurando) ?? null
  const conPropuesta = propuesta !== null && propuesta.clave === enFlujo?.clave
  const enConfiguracion = conPropuesta ? propuesta : enFlujo
  // La clave del panel cambia con la propuesta: así abre con lo que armó la IA y no con lo que tenía antes.
  const clavePanel = enConfiguracion ? `${enConfiguracion.clave}${conPropuesta ? '-ia' : ''}` : ''
  const cerrarPanel = () => {
    setConfigurando(null)
    setPropuesta(null)
  }

  const configurarConLaIa = (clave: string) => {
    const etapa = etapas.find((una) => una.clave === clave)
    if (!etapa) return
    setPorIa(clave)
    onGenerandoIa(`Configurando «${etapa.nombre}» con IA…`)
    relojIa.current = window.setTimeout(() => {
      setPorIa(null)
      onGenerandoIa(null)
      setPropuesta(configurarConIa(etapa, nombreVacante))
      setConfigurando(clave)
    }, MS_CONFIGURAR_CON_IA)
  }
  // Cada etapa va una sola vez en el flujo: al agregarla sale de la biblioteca y, si se quita del
  // flujo, vuelve a aparecer ahí.
  const enElFlujo = new Set(etapas.map((etapa) => etapa.id))
  const disponibles = [...propias, ...CATALOGO].filter((etapa) => !enElFlujo.has(etapa.id))

  // Las etapas con IA que se configuran en un panel lateral (no en la propia tarjeta, como la de CV).
  const abreEnPanel = (configuracion: EtapaCatalogo['configuracion']) =>
    configuracion === 'pruebas' || configuracion === 'idiomas' || configuracion === 'roleplay' || configuracion === 'entrevista'

  const agregar = (catalogo: EtapaCatalogo, mensaje = `Agregamos «${catalogo.nombre}» al flujo`) => {
    if (enElFlujo.has(catalogo.id)) return
    const nueva = etapaDelCatalogo(catalogo)
    onEtapas([...etapas, nueva])
    // La evaluación de CV se ajusta en la propia tarjeta: se despliega sola para que se vea que trae
    // ajustes. Cualquier otra tarjeta que estuviera abierta se cierra: lo que importa ver es la nueva.
    setDesplegada(nueva.configuracion === 'cv' ? nueva.clave : null)
    // Las demás etapas con IA abren su panel de una vez: así se configuran apenas se agregan.
    if (abreEnPanel(nueva.configuracion)) setConfigurando(nueva.clave)
    notify(mensaje, undefined, 'success')
  }

  // El flujo con el que arranca la plataforma, para no empezar de cero: se puede reordenar o recortar después.
  const usarRecomendado = () => {
    const nuevas = FLUJO_RECOMENDADO.flatMap((id) => {
      const catalogo = CATALOGO.find((etapa) => etapa.id === id)
      return catalogo ? [etapaDelCatalogo(catalogo)] : []
    })
    onEtapas(nuevas)
    notify('Pusimos el flujo recomendado', `${nuevas.length} etapas; ajústalas a esta vacante.`, 'success')
  }

  // La etapa creada entra al flujo de una vez (queda al final, como el resto de las que se agregan) y
  // se guarda en la biblioteca, al comienzo: así queda lista por si se quita del flujo y se quiere volver
  // a agregar, o si se necesita en otra vacante.
  const crear = (nombre: string, categoria: string) => {
    const nueva = etapaPropia(nombre, categoria)
    setPropias((actuales) => [nueva, ...actuales])
    agregar(nueva, `Creamos «${nombre}» y la agregamos al flujo`)
  }

  // Guarda tanto si el diálogo estaba creando como editando: lo decide si había una etapa en `editando`.
  // Se puede abrir desde la biblioteca o desde la propia tarjeta en el flujo; si la etapa ya está en el
  // flujo de esta vacante, el cambio se ve ahí también, no solo en la biblioteca.
  const guardarPropia = (nombre: string, categoria: string) => {
    if (editando) {
      setPropias((actuales) => actuales.map((etapa) => (etapa.id === editando.id ? { ...etapa, nombre, categoria } : etapa)))
      if (enElFlujo.has(editando.id)) onEtapas(etapas.map((etapa) => (etapa.id === editando.id ? { ...etapa, nombre, categoria } : etapa)))
      notify(`Guardamos los cambios de «${nombre}»`, undefined, 'success')
    } else {
      crear(nombre, categoria)
    }
  }

  const editarEnFlujo = (etapa: EtapaFlujo) => {
    setEditando(etapa)
    setCreando(true)
  }

  const eliminarPropia = (etapa: EtapaCatalogo) => {
    setPropias((actuales) => actuales.filter((otra) => otra.id !== etapa.id))
    notify(`Eliminamos «${etapa.nombre}» de la biblioteca`, undefined, 'success')
  }

  const guardarAjustes = (clave: string, cambio: Partial<EtapaFlujo>) =>
    onEtapas(etapas.map((etapa) => (etapa.clave === clave ? { ...etapa, ...cambio } : etapa)))

  return (
    <div className="flex flex-col gap-4">
      {/* Una sola columna: el flujo manda y la biblioteca se abre desde «Agregar etapa», al final de la
          lista. A la derecha queda el panel «Así va la vacante», como en los otros pasos. */}
      <FlujoCandidato
        etapas={etapas}
        onEtapas={onEtapas}
        onConfigurar={setConfigurando}
        onConfigurarConIa={configurarConLaIa}
        porIa={porIa}
        onRecomendado={usarRecomendado}
        onEditarPropia={editarEnFlujo}
        abierta={desplegada}
        onAbierta={setDesplegada}
        mostrarErrores={mostrarErrores}
        agregar={
          <AgregarEtapa
            catalogo={disponibles}
            todasEnElFlujo={disponibles.length === 0}
            onAgregar={agregar}
            onCrear={() => {
              setEditando(null)
              setCreando(true)
            }}
            onEditar={(etapa) => {
              setEditando(etapa)
              setCreando(true)
            }}
            onEliminar={setPorEliminar}
          />
        }
      />

      <DialogoEtapa open={creando} onOpenChange={setCreando} etapa={editando} onGuardar={guardarPropia} />

      <DialogoConfirmar
        abierto={porEliminar !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : setPorEliminar(null))}
        icono={Delete02Icon}
        titulo="¿Eliminar esta etapa?"
        descripcion={`«${porEliminar?.nombre ?? ''}» sale de la biblioteca de etapas y ya no se podrá agregar a una vacante.`}
        accion="Eliminar etapa"
        destructiva
        onConfirmar={() => {
          if (porEliminar) eliminarPropia(porEliminar)
          setPorEliminar(null)
        }}
      />

      {enConfiguracion?.pruebas ? (
        <PanelPruebas
          key={clavePanel}
          abierto
          onAbiertoChange={(abierto) => !abierto && cerrarPanel()}
          pruebas={enConfiguracion.pruebas}
          onGuardar={(pruebas) => guardarAjustes(enConfiguracion.clave, { pruebas })}
          llenadoConIa={conPropuesta}
          nombreVacante={nombreVacante}
        />
      ) : null}

      {enConfiguracion?.agente && (enConfiguracion.configuracion === 'idiomas' || enConfiguracion.configuracion === 'roleplay') ? (
        <PanelAgente
          key={clavePanel}
          abierto
          onAbiertoChange={(abierto) => !abierto && cerrarPanel()}
          tipo={enConfiguracion.configuracion}
          nombreVacante={nombreVacante}
          ajustes={enConfiguracion.agente}
          onGuardar={(agente) => guardarAjustes(enConfiguracion.clave, { agente })}
          onGenerandoIa={onGenerandoIa}
          llenadoConIa={conPropuesta}
        />
      ) : null}

      {enConfiguracion?.entrevista ? (
        <PanelEntrevista
          key={clavePanel}
          abierto
          onAbiertoChange={(abierto) => !abierto && cerrarPanel()}
          ajustes={enConfiguracion.entrevista}
          onGuardar={(entrevista) => guardarAjustes(enConfiguracion.clave, { entrevista })}
          onGenerandoIa={onGenerandoIa}
          llenadoConIa={conPropuesta}
          nombreVacante={nombreVacante}
        />
      ) : null}
    </div>
  )
}
