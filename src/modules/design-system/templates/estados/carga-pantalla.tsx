import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { RefreshIcon } from '@hugeicons/core-free-icons'
import { Button, type DataGridListConfig } from '@ubits/flux-ui'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'

import { useTemporizadores } from '../../estados/temporizadores'
import { useCargaInicial } from '../admin-compartido/lista'
import { EncabezadoPantalla } from '../admin-compartido/piezas'
import { USUARIOS_INICIALES, type Usuario } from '../gestion-usuarios/components/datos'
import { BUSCAR_USUARIOS, COLUMNAS_USUARIOS, FILTROS_USUARIOS } from '../gestion-usuarios/components/tabla-usuarios'

// La primera carga de una pantalla, a tamaño real. Según la regla de carga (Estados › Carga) una
// pantalla que llega por primera vez lleva skeleton con la silueta real, nunca un spinner que tape
// todo: DataGridList lo pinta solo con isLoading, así que la silueta no puede desalinearse.
//
// Se puede volver a cargar para comprobar lo que dice la regla: si al llegar el contenido algo salta
// de sitio, la silueta está mal.
//
// Es la misma tabla de la lista de Gestión de usuarios (columnas, filtros, buscador, selección y paginación en
// español), para que el esqueleto coincida con lo que llega (auditoría, 5-oct).

// El esqueleto pinta tantas filas como pageSize, así que las filas reales son las mismas: si no, la
// tabla se encoge al llegar el contenido y la silueta deja de parecerse (regla de carga).
const POR_PAGINA = 8
const FILAS = USUARIOS_INICIALES.slice(0, POR_PAGINA)

export function CargaDePantalla() {
  const [cargando, setCargando] = useCargaInicial(1400)
  const [vuelta, setVuelta] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const despues = useTemporizadores()

  const volverACargar = () => {
    setCargando(true)
    setVuelta((n) => n + 1)
    despues(() => setCargando(false), 1400)
  }

  // Buscar y filtrar no hacen nada aquí: la pantalla solo muestra la carga.
  const config: DataGridListConfig<Usuario> = {
    columns: COLUMNAS_USUARIOS,
    columnFilters: FILTROS_USUARIOS,
    search: { placeholder: BUSCAR_USUARIOS, onSearch: () => undefined },
    selection: { onSelectionChange: () => undefined },
  }

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPantalla
        titulo="Usuarios"
        descripcion="La pantalla mientras llega por primera vez."
        acciones={
          <Button variant="outline" onClick={volverACargar} disabled={cargando}>
            <HugeiconsIcon icon={RefreshIcon} aria-hidden="true" />
            Volver a cargar
          </Button>
        }
      />

      {/* Los datos van siempre: isLoading es quien pinta el esqueleto. Si se vacían, el contador de
          arriba dice «0 de 8» mientras carga, que es un dato falso. */}
      <TablaDatos
        key={vuelta}
        config={config}
        data={FILAS}
        isLoading={cargando}
        paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: FILAS.length }}
        nombre="usuarios"
        singular="usuario"
        id="usuarios-carga"
      />
    </div>
  )
}
