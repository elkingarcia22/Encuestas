import { Link, useNavigate, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@ubits/flux-ui'

import { PantallaDeError } from '../../estados/errores-sistema'
import { FullscreenTemplate } from '../fullscreen-template'
import { MarcoAdmin } from '../admin-compartido/marco-admin'
import { CargaDePantalla } from './carga-pantalla'
import { BASE, buscarCaso, type CasoDeEstado } from './casos'

// Un estado ocupando la pantalla entera. El marco lo decide el caso, no esta pantalla: con barra
// lateral cuando pasa estando dentro del producto, y sin nada alrededor cuando la sesión, la
// conexión o el servidor dejaron a la persona fuera (ahí ese menú no respondería).

// Salida de los casos sin marco: su propia acción puede llevar a otro sitio (o no tener ninguna),
// y esto es una pantalla de muestra, así que siempre tiene que poder volverse al índice.
function VolverAlIndice() {
  return (
    <div className="fixed top-4 left-4 z-10">
      <Button variant="outline" size="sm" nativeButton={false} render={<Link to={BASE} />}>
        <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
        Estados
      </Button>
    </div>
  )
}

function Contenido({ caso, alSalir }: { caso: CasoDeEstado; alSalir: () => void }) {
  if (caso.tipo === 'carga') return <CargaDePantalla />

  return (
    <div className="flex flex-1 flex-col pt-2">
      <PantallaDeError error={caso.error!} onAccion={alSalir} />
    </div>
  )
}

export function Component() {
  const navigate = useNavigate()
  const { caso: id } = useParams()
  const caso = buscarCaso(id)

  // Una dirección de caso que no existe es, ella misma, el error «No encontramos esta página»: se
  // muestra tal cual, y su acción vuelve al índice para no dejar a nadie encerrado.
  if (!caso) {
    const noExiste = buscarCaso('404')!
    return (
      <MarcoAdmin migas={[{ etiqueta: 'Estados', ruta: BASE }, { etiqueta: 'No encontramos esta página' }]}>
        <div className="flex flex-1 flex-col pt-2">
          <PantallaDeError error={noExiste.error!} onAccion={() => navigate(BASE)} />
        </div>
      </MarcoAdmin>
    )
  }

  // Sin marco de verdad: el layout de documentación trae su propia barra lateral fija y seguiría
  // debajo, así que estos casos se pintan fuera de #root y lo dejan inerte (si no, el menú tapado
  // se sigue recorriendo con Tab y con el lector de pantalla).
  if (caso.marco === 'sola') {
    return (
      <FullscreenTemplate>
        <div className="flex h-full flex-col overflow-auto">
          <VolverAlIndice />
          <Contenido caso={caso} alSalir={() => navigate(BASE)} />
        </div>
      </FullscreenTemplate>
    )
  }

  return (
    <MarcoAdmin
      migas={[
        { etiqueta: 'Estados', ruta: BASE },
        { etiqueta: caso.nombre },
      ]}
    >
      <Contenido caso={caso} alSalir={() => navigate(BASE)} />
    </MarcoAdmin>
  )
}

Component.displayName = 'DesignSystemTemplateEstadoCaso'
