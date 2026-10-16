import { useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowRight01Icon,
  FileEditIcon,
  InformationCircleIcon,
  Mail01Icon,
  SearchRemoveIcon,
  UserQuestion01Icon,
} from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  Switch,
  Text,
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@ubits/flux-ui'
import { BloqueAtencion, type AlertaAtencion } from '@/shared/components/BloqueAtencion'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { PASOS } from '@/modules/admin/seleccion/vacantes/crear/components/formulario'
import { STEP_INDICATOR, STEP_LINE } from '@/modules/design-system/drawers/components/drawer-styles'
import { FlujoCandidato } from '@/modules/admin/seleccion/vacantes/crear/components/flujo-candidato'
import { AgregarEtapa } from '@/modules/admin/seleccion/vacantes/crear/components/biblioteca-etapas'
import { AyudaCampo, SeccionFormulario, TarjetaAjuste } from '@/modules/admin/seleccion/vacantes/crear/components/piezas'
import { VACANTE_VACIA } from '@/modules/admin/seleccion/vacantes/crear/components/formulario'
import { ResumenVacante } from '@/modules/admin/seleccion/vacantes/crear/components/resumen-vacante'
import { DistribucionPuntos } from '@/modules/admin/seleccion/vacantes/crear/components/piezas-ia'
import {
  CATALOGO,
  FLUJO_RECOMENDADO,
  etapaDelCatalogo,
  type EtapaFlujo,
} from '@/modules/admin/seleccion/vacantes/crear/components/etapas'
import { CatalogoPlantillas } from '@/modules/admin/seleccion/vacantes/components/catalogo-plantillas'

// Muestras de la sección «Selección › Vacantes» de Ajustes propios. Lo de «En UBITS» es siempre la pieza real de la
// pantalla, importada tal cual, para que la ficha no se quede atrás cuando la pantalla cambie. Lo de «En la librería»
// es el componente de flux-ui sin tocar, con lo mínimo para verlo.

// ── Stepper del asistente ──

export function StepperLibreria() {
  const [paso, setPaso] = useState(2)
  return (
    <Stepper value={paso} onValueChange={setPaso}>
      <StepperNav>
        {PASOS.map((item, indice) => (
          <StepperItem key={item.numero} step={item.numero} completed={paso > item.numero}>
            {/* Sin StepperPanel debajo: aria-controls apuntaría a un panel que no existe. */}
            <StepperTrigger aria-controls={undefined}>
              <StepperIndicator>{item.numero}</StepperIndicator>
              <StepperTitle>{item.titulo}</StepperTitle>
            </StepperTrigger>
            {indice < PASOS.length - 1 ? <StepperSeparator /> : null}
          </StepperItem>
        ))}
      </StepperNav>
    </Stepper>
  )
}

export function StepperUbits() {
  const [paso, setPaso] = useState(2)
  return (
    <Stepper value={paso} onValueChange={setPaso} className="w-full">
      <StepperNav className="w-full">
        {PASOS.map((item, indice) => (
          <StepperItem key={item.numero} step={item.numero} completed={paso > item.numero} className="flex-1 last:flex-none">
            <StepperTrigger aria-controls={undefined} className="gap-2">
              <StepperIndicator className={STEP_INDICATOR}>{item.numero}</StepperIndicator>
              <StepperTitle className="text-sm whitespace-nowrap">{item.titulo}</StepperTitle>
            </StepperTrigger>
            {indice < PASOS.length - 1 ? <StepperSeparator className={`mx-3 flex-1 ${STEP_LINE}`} /> : null}
          </StepperItem>
        ))}
      </StepperNav>
    </Stepper>
  )
}

// ── Flujo del candidato ──

export function TimelineLibreria() {
  return (
    <Timeline value={1}>
      {['Evaluación de CV', 'Entrevista con Serena', 'Oferta'].map((titulo, indice) => (
        <TimelineItem key={titulo} step={indice + 1}>
          <TimelineHeader>
            <TimelineSeparator />
            <TimelineTitle>{titulo}</TimelineTitle>
            <TimelineIndicator />
          </TimelineHeader>
          <TimelineContent>Etapa {indice + 1}</TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  )
}

const FLUJO_DEMO: EtapaFlujo[] = FLUJO_RECOMENDADO.slice(0, 3).flatMap((id) => {
  const etapa = CATALOGO.find((item) => item.id === id)
  return etapa ? [etapaDelCatalogo(etapa)] : []
})

export function FlujoUbits() {
  const [etapas, setEtapas] = useState(FLUJO_DEMO)
  const [abierta, setAbierta] = useState<string | null>(null)
  return (
    <div className="w-full">
      <FlujoCandidato
        etapas={etapas}
        onEtapas={setEtapas}
        onConfigurar={() => undefined}
        onRecomendado={() => setEtapas(FLUJO_DEMO)}
        onEditarPropia={() => undefined}
        abierta={abierta}
        onAbierta={setAbierta}
        mostrarErrores={false}
        agregar={<BibliotecaUbits />}
      />
    </div>
  )
}

// ── Biblioteca de etapas ──

export function BibliotecaUbits() {
  return (
    <div className="w-full max-w-sm">
      <AgregarEtapa
        catalogo={CATALOGO}
        todasEnElFlujo={false}
        onAgregar={() => undefined}
        onCrear={() => undefined}
        onEditar={() => undefined}
        onEliminar={() => undefined}
      />
    </div>
  )
}

// ── Así va la vacante ──

const VACANTE_DEMO = {
  ...VACANTE_VACIA,
  nombre: 'Diseñador UX',
  area: 'Diseño',
  modalidad: 'hibrido' as const,
  contrato: 'Término indefinido',
}

export function ResumenUbits() {
  return (
    <div className="w-full max-w-80">
      <ResumenVacante vacante={VACANTE_DEMO} paso={1} />
    </div>
  )
}

// ── Sección del formulario ──

export function AcordeonLibreria() {
  return (
    <Accordion className="w-full max-w-sm">
      <AccordionItem value="datos">
        <AccordionTrigger>Datos de la vacante</AccordionTrigger>
        <AccordionContent>Nombre, área, sede y modalidad.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function SeccionUbits() {
  return (
    <div className="w-full max-w-sm">
      <SeccionFormulario titulo="Datos de la vacante" completa>
        <Text as="p" variant="muted" size="sm">
          Nombre, área, sede y modalidad.
        </Text>
      </SeccionFormulario>
    </div>
  )
}

// ── Ayuda de un campo ──

export function AyudaLibreria() {
  return (
    <Tooltip>
      <TooltipTrigger render={<BotonIcono aria-label="Qué significa este campo (librería)" size="icon-xs" />}>
        <HugeiconsIcon icon={InformationCircleIcon} size={16} />
      </TooltipTrigger>
      <TooltipContent side="top">Solo abre al pasar el cursor.</TooltipContent>
    </Tooltip>
  )
}

export function AyudaUbits() {
  return (
    <div className="flex items-center gap-1">
      <Text as="span" size="sm" weight="medium">
        Salario
      </Text>
      <AyudaCampo>Ábrelo con clic o con el teclado: también funciona en táctil.</AyudaCampo>
    </div>
  )
}

// ── Tarjeta de ajuste con interruptor ──

export function AjusteLibreria() {
  return (
    <Field orientation="horizontal" className="max-w-sm">
      <FieldContent>
        <FieldTitle>Correo automático de rechazo</FieldTitle>
        <FieldDescription>Se envía al descartar a un candidato.</FieldDescription>
      </FieldContent>
      <Switch aria-label="Correo automático de rechazo (librería)" />
    </Field>
  )
}

export function AjusteUbits() {
  const [activo, setActivo] = useState(true)
  return (
    <div className="w-full max-w-sm">
      <TarjetaAjuste
        icono={Mail01Icon}
        titulo="Correo automático de rechazo"
        descripcion="Se envía al descartar a un candidato."
        control={<Switch checked={activo} onCheckedChange={setActivo} aria-label="Correo automático de rechazo" />}
      >
        {activo ? (
          <Text as="p" variant="muted" size="sm">
            Aquí aparece la plantilla del correo.
          </Text>
        ) : null}
      </TarjetaAjuste>
    </div>
  )
}

// ── Paneles de IA ──

export function PuntosUbits() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <DistribucionPuntos total={80} detalle="5 criterios" />
      <DistribucionPuntos total={110} detalle="5 criterios" />
    </div>
  )
}

// ── Superficies que se abren (diálogo y drawer) ──

export function CatalogoUbits() {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      <Button variant="outline" onClick={() => setAbierto(true)}>
        Ver todas las plantillas
      </Button>
      <CatalogoPlantillas open={abierto} onOpenChange={setAbierto} onUsar={() => setAbierto(false)} />
    </>
  )
}

// ── Alertas plegables del listado ──

// La pieza real, BloqueAtencion, con las cuatro alertas de Vacantes y datos de ejemplo (decisión 21 de la auditoría,
// 5-oct: hay una sola versión y la usan Vacantes y Contenidos). En la pantalla, «Ver» filtra la tabla a ese grupo.
const ALERTAS_DEMO: AlertaAtencion[] = [
  { id: 'accion', icono: UserQuestion01Icon, tono: 'text-destructive', titulo: '12 candidatos esperan una acción tuya', detalle: 'En 3 vacantes: revisar su hoja de vida, agendar entrevista o enviar oferta.', resumen: 'Candidatos por atender', onVer: () => notify('En Vacantes, la tabla se filtra a ese grupo') },
  { id: 'estancadas', icono: Alert02Icon, tono: 'text-warning', titulo: '2 vacantes llevan más de 30 días sin cerrarse', detalle: 'Revisa si hay que ajustar el perfil, el rango salarial o los canales de publicación.', resumen: 'Vacantes estancadas', onVer: () => notify('En Vacantes, la tabla se filtra a ese grupo') },
  { id: 'sin-candidatos', icono: SearchRemoveIcon, tono: 'text-info', titulo: '1 vacante sin ningún candidato en más de 10 días', detalle: 'El canal de publicación o los requisitos podrían estar limitando quién aplica.', resumen: 'Sin candidatos', onVer: () => notify('En Vacantes, la tabla se filtra a ese grupo') },
  { id: 'borradores', icono: FileEditIcon, tono: 'text-info', titulo: '2 borradores llevan más de 7 días sin publicarse', detalle: 'Termínalos o archívalos para que no se pierdan en la lista.', resumen: 'Borradores sin publicar', onVer: () => notify('En Vacantes, la tabla se filtra a ese grupo') },
]

export function AtencionUbits() {
  return (
    <div className="w-full">
      <BloqueAtencion alertas={ALERTAS_DEMO} etiqueta="Lo que necesita tu atención" />
    </div>
  )
}

// Para las piezas que viven metidas en la pantalla (la tabla, el encabezado del asistente) y no se pueden sacar sin
// sus datos: la muestra es la pantalla misma.
export function VerEnPantalla({ ruta, etiqueta, nota }: { ruta: string; etiqueta: string; nota: string }) {
  return (
    <div className="flex max-w-xs flex-col items-center gap-3 text-center">
      <Text as="p" variant="muted" size="sm">
        {nota}
      </Text>
      <Button variant="outline" nativeButton={false} render={<Link to={ruta} />}>
        {etiqueta}
        <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" data-icon="inline-end" />
      </Button>
    </div>
  )
}

export function NotaLibreria({ children }: { children: string }) {
  return (
    <Text as="p" variant="muted" size="sm" className="max-w-xs text-center">
      {children}
    </Text>
  )
}
