import { MotionConfig } from 'motion/react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlusSignIcon } from '@hugeicons/core-free-icons'
import { Button } from '@ubits/flux-ui'
import { createPortal } from 'react-dom'
import { AgentDock, ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { AgenteInicio } from '../../propuestas/components/agente-seleccion'
import { useHuecoDerecho } from '../../vacantes/detalle/components/agente-acoplado'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { CatalogoPlantillas } from '../../vacantes/components/catalogo-plantillas'
import { esPropia } from '../../vacantes/components/plantillas-propias'
import type { PlantillaCatalogo } from '../../vacantes/components/datos'
import { TablaVacantes } from './inicio/tabla-vacantes'
import { TableroAtencion } from './inicio/tablero-atencion'
import { useEstadoInicio } from './inicio/estado'
import { vacantesDeLaSesion } from './inicio/acciones'
import { Revelar } from '../../propuestas/components/animacion'
import { SaldoCreditos } from '../../propuestas/components/saldo-creditos'

// Exploración 1 · el inicio de Vacantes, organizado como se acordó en la reunión con Elkin (29 sep). Parte del home que
// él hizo (30 sep, Nicolás: «tráete también el home de vacante que hizo Elkin») y lo ordena así, de arriba abajo:
// 1. Cabecera con «Crear vacante» (primario) y Orbit Flow. «Crear con plantilla» se fue el 13 oct (reunión con la PM y el
//    TL): la plantilla es del proceso, no de la vacante, y se elige dentro de la vacante. Para no llenar de cero una
//    parecida está «Duplicar» en el «⋯» de cada fila. El catálogo solo se abre al volver de guardar una plantilla.
// 2. «Lo que necesita tu atención», PRIMERO: si te dicen que algo necesita tu atención, lo primero es resolverlo. Es un
//    tablero por categorías (críticas, esperando acción y sugerencias de la IA), no una fila de tarjetas.
// 3. «Tus vacantes», con las columnas que pidió Elkin y quién espera respuesta. Los dos bloques tienen la misma forma
// —marco gris, título arriba y lo suyo en blanco— para que la página lleve un solo ritmo (1 oct, Nicolás).
// «Cómo van los procesos» se fue el 8 oct (VP de producto: «mataría cómo van los procesos, porque en vacantes lo que les
// interesa es la lista, que puedan encontrar sus vacantes rápido»): el espacio es para la lista.
// Crear, las plantillas y editar llevan a la creación de Elkin colgada de esta exploración (`crear.tsx`).

const RUTA = '/admin/seleccion/exploraciones/uno'

export function Component() {
  const navigate = useNavigate()
  const location = useLocation()
  // Al cambiar una vacante desde el tablero o la tabla, las cifras se vuelven a calcular.
  useEstadoInicio()
  const llegada = location.state as { abrirCatalogo?: boolean; publicadaId?: string } | null
  // Al guardar o eliminar una plantilla propia se vuelve aquí con el catálogo abierto, para verla en su lista.
  const [catalogoAbierto, setCatalogoAbierto] = useState(Boolean(llegada?.abrirCatalogo))
  // Orbit Flow sobre todas las vacantes (OF-58): debajo del header, como dentro de una vacante.
  const [agente, setAgente] = useState(false)
  const hueco = useHuecoDerecho()

  useEffect(() => {
    if (!llegada) return
    // Lo recién publicado se abre en su vacante, con «Compartir» abierto (contrato con la creación). Si todavía llega
    // aquí, se manda allá.
    if (llegada.publicadaId) navigate(`${RUTA}/${llegada.publicadaId}`, { replace: true, state: { publicada: true } })
    else navigate(location.pathname, { replace: true, state: null })
  }, [llegada, navigate, location.pathname])

  // Una plantilla propia guarda la vacante completa; una del catálogo arranca con sus datos y sus etapas.
  const usarPlantilla = (plantilla: PlantillaCatalogo) => {
    setCatalogoAbierto(false)
    navigate(`${RUTA}/crear`, { state: esPropia(plantilla) ? { desdePlantilla: plantilla.id } : { plantillaSistema: plantilla.id } })
  }

  return (
    // Con «reducir movimiento» en el sistema, las animaciones de Selección se quedan quietas.
    <MotionConfig reducedMotion="user">
    <PageShell>
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Selección' }, { label: 'Vacantes' }]}
        title="Vacantes"
        // En una sola línea (1 oct, Nicolás): el marco de página corta la descripción a ~670 px.
        description="Atiende lo pendiente y encuentra cada vacante."
        actions={
          <>
            {/* Los créditos de Selección, a la vista en todo el producto (16 oct): un dato, no un botón más. */}
            <SaldoCreditos />
            <Button onClick={() => navigate(`${RUTA}/crear`)}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
              Crear vacante
            </Button>
            {/* La IA al final de la fila, a la derecha del primario; con el panel abierto no aparece. Son dos llamados a la
                acción: va con su nombre (regla orbit-flow-compacto, solo con más de dos). */}
            {agente ? null : <ReopenAgentButton onClick={() => setAgente(true)} />}
          </>
        }
      />

      <PageContent>
        {/* Las dos secciones entran en cascada al llegar. */}
        <Revelar>
          <TableroAtencion ruta={RUTA} onCrear={() => navigate(`${RUTA}/crear`)} />
        </Revelar>
        <Revelar orden={1}>
          <TablaVacantes ruta={RUTA} />
        </Revelar>
      </PageContent>

      <CatalogoPlantillas open={catalogoAbierto} onOpenChange={setCatalogoAbierto} onUsar={usarPlantilla} base={RUTA} />
      {hueco
        ? createPortal(
            <AgentDock open={agente}>
              <AgenteInicio vacantes={vacantesDeLaSesion()} onClose={() => setAgente(false)} onAbrir={(id) => navigate(`${RUTA}/${id}`)} />
            </AgentDock>,
            hueco,
          )
        : null}
    </PageShell>
    </MotionConfig>
  )
}

Component.displayName = 'SeleccionExploracionUnoInicioPage'
