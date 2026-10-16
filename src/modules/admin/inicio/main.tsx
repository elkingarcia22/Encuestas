import { useState } from 'react'
import { Heading, Tabs, TabsList, TabsTrigger, Text } from '@ubits/flux-ui'
import { NecesitaTuAtencion, TopMetricas } from '@/modules/design-system/templates/home-operativo/components/inicio-operativo'
import { PERSONA, saludo } from '@/modules/design-system/templates/home-operativo/components/data'
import { PageShell } from '@/shared/components/PageShell'
import { AccionesRapidas } from './components/acciones-rapidas'
import { METRICAS_ADMIN, PERIODOS_ADMIN, type PeriodoAdmin } from './components/metricas-periodo'

// Inicio del administrador (1 oct, Charlie). De arriba abajo: el saludo, seis «Acciones rápidas» en tarjetas, las
// métricas con su periodo (últimos 30 o 90 días) y «Necesita tu atención» al mismo ancho que las métricas. Se ocultaron «Cómo
// va cada producto» y la actividad reciente (sus bloques siguen en components/productos y components/bloques).
// Las métricas y los pendientes son los del concepto de producto (template Home operativo), que no cambia.

// Entrada escalonada al cargar (1 oct): cada bloque aparece con un leve desvanecido y sube 8px, uno detrás del otro —
// saludo, acciones rápidas (cada tarjeta a 50 ms de la anterior), métricas y «Necesita tu atención» con sus filas—. Todo
// termina en menos de un segundo y no se repite al cambiar de periodo. Con «reducir movimiento» no hay animación.
const ENTRADA = 'animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out fill-mode-both motion-reduce:animate-none'
const retraso = (ms: number) => ({ animationDelay: `${ms}ms` })

// Cada pendiente lleva a su pantalla del administrador. Gestión de usuarios todavía vive como plantilla del design
// system: es la única pantalla real que existe hoy.
const RUTA: Record<string, string> = {
  'evaluaciones-360': '/admin/desempeno-cultura/evaluaciones-360',
  encuestas: '/admin/desempeno-cultura/encuestas',
  'gestion-de-usuarios': '/design-system/templates/gestion-usuarios',
  'descarga-certificados': '/admin/aprendizaje/certificados/descarga',
  vacantes: '/admin/seleccion/exploraciones/uno',
  planes: '/admin/aprendizaje/planes-de-formacion/planes',
  metricas: '/admin/aprendizaje/metricas',
  'avisos-internos': '/admin/avisos-internos',
  contenidos: '/admin/aprendizaje/lms-creator/contenidos',
}

export function Component() {
  const [periodo, setPeriodo] = useState<PeriodoAdmin>('30')

  return (
    <PageShell className="gap-10">
      <div className="flex flex-col gap-10 pt-2">
        {/* Un solo saludo con la hora y el nombre y la línea de contexto. */}
        <header className={`flex flex-col gap-1 ${ENTRADA}`}>
          <Heading as="h1" level={2}>
            {saludo()}, {PERSONA.corto}
          </Heading>
          <Text variant="muted">Esto es lo que pasa hoy en tu empresa.</Text>
        </header>

        {/* Acciones rápidas arriba, justo después del saludo (1 oct): lo primero es lo que se puede hacer. */}
        <AccionesRapidas entrada={{ clase: ENTRADA, desde: 80, paso: 50 }} />

        {/* El periodo va dentro del marco de las métricas, en su franja de título (1 oct, «que se sienta parte del módulo»):
            pestañas de línea de la librería, sin las esquinas en pastilla de antes, porque solo cambian estas cifras. */}
        <div className={ENTRADA} style={retraso(420)}>
        <TopMetricas
          periodo="30"
          titulo="Métricas de aprendizaje"
          metricas={METRICAS_ADMIN[periodo]}
          encabezado={
            <Tabs value={periodo} onValueChange={(valor) => setPeriodo(valor as PeriodoAdmin)}>
              <TabsList variant="line" aria-label="Periodo de las métricas">
                {PERIODOS_ADMIN.map((opcion) => (
                  <TabsTrigger key={opcion.valor} value={opcion.valor}>
                    {opcion.etiqueta}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          }
        />
        </div>
        <div className={ENTRADA} style={retraso(520)}>
        <NecesitaTuAtencion enlace={(slug) => RUTA[slug] ?? '/admin'} contadorAzul enMarco entrada={{ clase: ENTRADA, desde: 600, paso: 40 }} />
        </div>
      </div>
    </PageShell>
  )
}

Component.displayName = 'AdminInicioPage'
