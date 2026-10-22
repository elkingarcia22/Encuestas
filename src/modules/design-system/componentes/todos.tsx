import { useNavigate, useParams } from 'react-router'
import { Tabs, TabsContent } from '@ubits/flux-ui'
import { REGLAS_GLOBALES, ReglasGlobales } from '../ajustes/main'
import { ParaElDev } from '../diferencias/main'
import { Indicadores } from '../metricas/cifras'
import { EncabezadoPatron, PestanasDePatron } from '../patrones/piezas'
import datos from '../../../../ai-tools/flux-ui/diferencias.json'
import { CatalogoFlux } from './flux'
import { Customizados } from './inventario'
import { COMPONENTES_FLUX, PIEZAS_CUSTOM } from './inventario-datos'

// Componentes › Todos los componentes (7-oct, Cristian: «hay como 3 pantallas que hacen lo mismo»). Junta en una sola
// página lo que antes estaba repartido en Inventario, Storybook, Diferencias con la librería y Marco › Ajustes propios.
// Cada pestaña tiene su dirección; las direcciones viejas llevan aquí.

const PESTANAS = [
  { valor: 'customizados', etiqueta: 'Customizados' },
  { valor: 'flux', etiqueta: 'Flux tal cual' },
  { valor: 'reglas', etiqueta: 'Reglas globales' },
  { valor: 'dev', etiqueta: 'Para el dev de flux' },
]

export function Component() {
  const { pestana } = useParams()
  const navigate = useNavigate()
  const activa = PESTANAS.find((item) => item.valor === pestana)?.valor ?? 'customizados'

  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPatron antetitulo="Design system · Componentes" titulo="Todos los componentes" etiqueta={null}>
        Todo lo que hay para armar una pantalla, en dos niveles: lo que el equipo customizó sobre la librería (flux) y la
        librería sin tocar, de la que muchas piezas ya tienen su versión del proyecto. Antes de armar algo, se busca aquí:
        si ya está customizado, se usa esa pieza.
      </EncabezadoPatron>

      <Indicadores
        cifras={[
          { etiqueta: 'Customizados', valor: String(PIEZAS_CUSTOM.length), detalle: 'piezas del equipo, cada una con su ficha' },
          { etiqueta: 'Flux tal cual', valor: String(COMPONENTES_FLUX.length), detalle: 'componentes de la librería' },
          { etiqueta: 'Reglas globales', valor: String(REGLAS_GLOBALES.length), detalle: 'cambian toda la librería' },
          { etiqueta: 'Para el dev de flux', valor: String(datos.entradas.length), detalle: 'diferencias por resolver' },
        ]}
      />

      <Tabs value={activa} onValueChange={(valor) => navigate(`/design-system/componentes/${valor}`)}>
        <PestanasDePatron items={PESTANAS} />
        <TabsContent value="customizados" className="pt-6">
          <Customizados />
        </TabsContent>
        <TabsContent value="flux" className="pt-6">
          <CatalogoFlux />
        </TabsContent>
        <TabsContent value="reglas" className="pt-6">
          <ReglasGlobales />
        </TabsContent>
        <TabsContent value="dev" className="pt-6">
          <ParaElDev />
        </TabsContent>
      </Tabs>
    </div>
  )
}

Component.displayName = 'DesignSystemTodosLosComponentes'
