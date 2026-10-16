import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle, Badge, Card, CardContent, Text, cn } from '@ubits/flux-ui'
import { Demo, EncabezadoPatron, VerEnAccion, Reglas, SectionIntro, type Regla } from '../patrones/piezas'
import { AiCard } from '@/shared/components/AiCard'
import { BotonIaUbits } from '../ajustes/demos'

// Fundamentos › Color: los colores del tema (src/index.css y el tema «ubits» de flux-ui) con su clase y su valor.
// El valor se calcula en vivo desde la variable CSS, así que cambia al pasar a modo oscuro.

type Token = { nombre: string; variable: string; clase: string; uso: string }

const GRUPOS: { titulo: string; descripcion: string; tokens: Token[] }[] = [
  {
    titulo: 'Marca',
    descripcion: 'El azul UBITS. Se usa para actuar y para marcar lo seleccionado, no para decorar.',
    tokens: [
      { nombre: 'Primario', variable: '--primary', clase: 'bg-primary', uso: 'Botón primario, enlaces, foco y lo activo.' },
      { nombre: 'Texto sobre primario', variable: '--primary-foreground', clase: 'bg-primary-foreground', uso: 'Texto e iconos encima del azul.' },
      { nombre: 'Anillo de foco', variable: '--ring', clase: 'bg-ring', uso: 'Contorno de lo que tiene el foco del teclado.' },
    ],
  },
  {
    titulo: 'Superficies',
    descripcion: 'Fondos en grises neutros, del más claro al que separa un bloque del resto.',
    tokens: [
      { nombre: 'Fondo', variable: '--background', clase: 'bg-background', uso: 'Fondo de la página.' },
      { nombre: 'Tarjeta', variable: '--card', clase: 'bg-card', uso: 'Tarjetas y paneles.' },
      { nombre: 'Flotante', variable: '--popover', clase: 'bg-popover', uso: 'Menús, ventanas y ayudas flotantes.' },
      { nombre: 'Atenuado', variable: '--muted', clase: 'bg-muted', uso: 'Fondos suaves, bandejas y cargas.' },
      { nombre: 'Secundario', variable: '--secondary', clase: 'bg-secondary', uso: 'Relleno de etiquetas y botones grises.' },
      { nombre: 'Barra lateral', variable: '--sidebar', clase: 'bg-sidebar', uso: 'Fondo de la barra lateral del marco.' },
    ],
  },
  {
    titulo: 'Texto y líneas',
    descripcion: 'Dos grises para el texto y uno para bordes y divisores.',
    tokens: [
      { nombre: 'Texto', variable: '--foreground', clase: 'bg-foreground', uso: 'Texto principal y títulos.' },
      { nombre: 'Texto atenuado', variable: '--muted-foreground', clase: 'bg-muted-foreground', uso: 'Descripciones, ayudas y datos secundarios.' },
      { nombre: 'Borde', variable: '--border', clase: 'bg-border', uso: 'Bordes de tarjetas y divisores.' },
      { nombre: 'Borde de campo', variable: '--input', clase: 'bg-input', uso: 'Borde de campos de formulario.' },
    ],
  },
  {
    titulo: 'Estado',
    descripcion: 'Solo para comunicar cómo está algo: bien, atención, información o error.',
    tokens: [
      { nombre: 'Éxito', variable: '--success', clase: 'bg-success', uso: 'Completado, activo, guardado.' },
      { nombre: 'Atención', variable: '--warning', clase: 'bg-warning', uso: 'Por vencer, casi al límite, revisar.' },
      { nombre: 'Información', variable: '--info', clase: 'bg-info', uso: 'Avisos neutros y novedades.' },
      { nombre: 'Error', variable: '--destructive', clase: 'bg-destructive', uso: 'Errores y acciones que borran.' },
    ],
  },
  {
    titulo: 'Planes',
    descripcion: 'El único violeta del tema, con el tono del morado de marca de la IA. Solo marca el plan Pro (1 oct).',
    tokens: [
      { nombre: 'Premium', variable: '--premium', clase: 'bg-premium', uso: 'La insignia del plan Pro, en el botón de la empresa.' },
    ],
  },
  {
    titulo: 'Gráficas',
    descripcion: 'Una escala de azules, de claro a oscuro, para series de datos.',
    tokens: [
      { nombre: 'Gráfica 1', variable: '--chart-1', clase: 'bg-chart-1', uso: 'La serie más clara.' },
      { nombre: 'Gráfica 2', variable: '--chart-2', clase: 'bg-chart-2', uso: 'Segunda serie.' },
      { nombre: 'Gráfica 3', variable: '--chart-3', clase: 'bg-chart-3', uso: 'Serie principal.' },
      { nombre: 'Gráfica 4', variable: '--chart-4', clase: 'bg-chart-4', uso: 'Cuarta serie.' },
      { nombre: 'Gráfica 5', variable: '--chart-5', clase: 'bg-chart-5', uso: 'La serie más oscura.' },
    ],
  },
]

const REGLAS: Regla[] = [
  { titulo: 'Solo clases del tema', detalle: 'bg-primary, text-muted-foreground, border-border… Nunca un color escrito a mano ni la paleta de Tailwind (los «azul 500» y compañía).' },
  { titulo: 'Grises neutros, azul UBITS', detalle: 'La interfaz es gris; el azul se reserva para la acción principal y lo seleccionado.' },
  { titulo: 'El estado no decora', detalle: 'Verde, amarillo y rojo solo dicen cómo está algo. Un botón no es verde porque sí.' },
  { titulo: 'Lo activo, al 10 %', detalle: 'Fondo del primario al 10 % y texto en primario, como en la barra lateral (ver Marco › Medidas).' },
  { titulo: 'Probar en claro y oscuro', detalle: 'Si usas solo clases del tema, el modo oscuro sale solo. Revísalo igual antes de entregar.' },
]

// Valor de un color del tema en hexadecimal, leído en vivo. El navegador devuelve oklch: se pinta en un canvas
// de 1×1 y se lee el píxel. Se recalcula cuando cambia el tema (clase o data-theme en <html>).
function useValorHex(variable: string) {
  const [valor, setValor] = useState('')

  useEffect(() => {
    const calcular = () => {
      const muestra = document.createElement('span')
      muestra.style.color = `var(${variable})`
      document.body.appendChild(muestra)
      const color = getComputedStyle(muestra).color
      muestra.remove()
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
      const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase()}`
      setValor(a < 255 ? `${hex} · ${Math.round((a / 255) * 100)} %` : hex)
    }
    calcular()
    const observador = new MutationObserver(calcular)
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] })
    return () => observador.disconnect()
  }, [variable])

  return valor
}

function Muestra({ token }: { token: Token }) {
  const valor = useValorHex(token.variable)
  return (
    <Card size="sm" className="gap-3">
      <CardContent className="flex flex-col gap-3">
        {/* Muestra del color: una caja con la clase del token (la librería no tiene una pieza de muestra de color). */}
        <div className={cn('h-14 w-full rounded-md border', token.clase)} />
        <div className="flex flex-col gap-1">
          <Text as="span" size="sm" weight="semibold">
            {token.nombre}
          </Text>
          <Text as="span" variant="muted" size="xs">
            {token.uso}
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{token.clase}</Badge>
          {valor ? <Badge variant="outline">{valor}</Badge> : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function Component() {
  return (
    <div className="flex flex-col gap-10">
      <EncabezadoPatron titulo="Color" antetitulo="Design system · Fundamentos" etiqueta={<Badge variant="success-light">Del tema</Badge>} acciones={<VerEnAccion pagina="color" />}>
        Todos los colores salen del tema del proyecto. Así el modo oscuro y un cambio de marca funcionan solos. Los valores
        de esta página se leen en vivo: cambia a modo oscuro desde tu perfil y verás los del otro tema.
      </EncabezadoPatron>

      {GRUPOS.map((grupo) => (
        <section key={grupo.titulo} className="flex flex-col gap-4">
          <SectionIntro title={grupo.titulo} description={grupo.descripcion} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grupo.tokens.map((token) => (
              <Muestra key={token.variable} token={token} />
            ))}
          </div>
        </section>
      ))}

      <section className="flex flex-col gap-4">
        <SectionIntro
          title="Ambiente de IA"
          description="El degradado de Orbit, de azul a morado y fucsia. No es un color del tema: vive como imagen y como estilo del marco."
        />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Demo title="Degradado de IA" description="Tarjeta «Crear un curso» del Home y botón «Nueva conversación».">
            {/* Las piezas reales, no una imagen: la imagen del degradado saturado de borde a borde se retiró cuando la
                tarjeta pasó a «Halo» (18 sep) y aquí seguía mostrándose como si fuera la vigente. */}
            <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
              <AiCard title="Crear un curso" description="Genera contenido de aprendizaje apoyado en AI en minutos." action="Crear ahora" onAction={() => {}} />
              <BotonIaUbits />
            </div>
          </Demo>
          <Alert variant="info">
            <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
            <AlertTitle>Pendiente en la librería</AlertTitle>
            <AlertDescription>
              <p>
                Pedir que el degradado de IA sea parte del tema, para usarlo sin imágenes ni estilos propios. Mientras
                tanto, solo en acciones de IA (ver Componentes › Botones).
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </section>

      <Reglas titulo="Reglas" reglas={REGLAS} />
    </div>
  )
}

Component.displayName = 'DesignSystemColorPage'
