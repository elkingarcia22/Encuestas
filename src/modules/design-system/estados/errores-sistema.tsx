import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  InformationCircleIcon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  Heading,
  Spinner,
  Text,
  ToggleGroup,
  ToggleGroupItem,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'

import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { notify } from '@/shared/components/notify'
import { SectionIntro } from '../patrones/piezas'
import { EJEMPLOS_ERROR, type ErrorDeSistema } from './errores-sistema-datos'

// Errores de sistema a pantalla completa. Fuente: HU «Errores de sistema (404, sin acceso,
// offline, licencia, servidor)». Los títulos y las acciones son los de la historia; los cuerpos
// son provisionales hasta traer el copy definitivo de Figma Errores (RN-02).

// onAccion es opcional: en los templates el botón navega de verdad; sin él, avisa qué haría.
export function PantallaDeError({ error, onAccion }: { error: ErrorDeSistema; onAccion?: () => void }) {
  const [reintentando, setReintentando] = useState(false)

  return (
    // RN-01: ilustración a la izquierda y texto con acción a la derecha; en móvil se apilan y el texto va centrado. El
    // bloque se centra en el espacio disponible (antes quedaba pegado a la izquierda).
    <div className="mx-auto grid w-full max-w-2xl flex-1 content-center items-center gap-8 px-2 py-10 md:grid-cols-[auto_minmax(0,1fr)]">
      {/* Ilustración glass del error mientras llega la de Figma Errores; ImagenGlass trae las densidades (13-oct). */}
      <ImagenGlass nombre={error.ilustracion.nombre} tamano={144} className="mx-auto size-36" />
      <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
        <div className="flex flex-col gap-1">
          <Heading as="h4" level={3}>
            {error.titulo}
          </Heading>
          <Text variant="muted">
            {error.cuerpo}
            {error.enfasis ? (
              <>
                {' '}
                <Text as="span" weight="semibold">
                  {error.enfasis}
                </Text>
              </>
            ) : null}
          </Text>
        </div>
        {error.accion ? (
          <Button
            className="mt-2"
            disabled={reintentando}
            onClick={() => {
              if (onAccion) {
                onAccion()
                return
              }
              if (error.id === 'offline') {
                setReintentando(true)
                setTimeout(() => setReintentando(false), 1500)
                return
              }
              notify(error.accion?.efecto ?? '', undefined, 'info')
            }}
          >
            {reintentando ? <Spinner /> : <HugeiconsIcon icon={error.accion.icono} aria-hidden="true" />}
            {reintentando ? 'Intentando…' : error.accion.etiqueta}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function EstadosErroresSistema() {
  const [elegido, setElegido] = useState(EJEMPLOS_ERROR[0].id)
  const error = EJEMPLOS_ERROR.find((e) => e.id === elegido) ?? EJEMPLOS_ERROR[0]

  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Errores de sistema"
        description="Cuando la plataforma no puede mostrar lo que se pidió. Van a pantalla completa, sin la barra lateral ni el encabezado, y cada uno ofrece una sola salida (o ninguna, si no hay nada que hacer)."
      />

      <div className="flex flex-col gap-3">
        <ToggleGroup
          variant="outline"
          size="sm"
          value={[elegido]}
          onValueChange={(valor) => valor[0] && setElegido(String(valor[0]))}
          aria-label="Elegir el error"
          className="flex-wrap"
        >
          {EJEMPLOS_ERROR.map((e) => (
            <ToggleGroupItem key={e.id} value={e.id}>
              {e.etiqueta}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Text variant="muted" size="sm">
          Cuándo aparece: {error.cuando}
        </Text>
      </div>

      <Card>
        <CardContent>
          <PantallaDeError key={error.id} error={error} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Alert variant="warning">
          <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
          <AlertTitle>«Sin acceso» no es «No encontramos esta página»</AlertTitle>
          <AlertDescription>
            Si el contenido existe pero la persona aún no lo tiene, decirle que no existe la confunde.
            Se muestra «Sin acceso» y a quién pedirlo.
          </AlertDescription>
        </Alert>
        <Alert variant="info">
          <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
          <AlertTitle>Nunca códigos ni jerga</AlertTitle>
          <AlertDescription>
            Nada de «403», «500» ni «permisos». El colaborador ve qué pasó con palabras y qué puede
            hacer ahora.
          </AlertDescription>
        </Alert>
      </div>

      <Alert>
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
        <AlertTitle>
          Pendientes de diseño{' '}
          <Badge variant="outline" size="sm">
            Figma Errores
          </Badge>
        </AlertTitle>
        <AlertDescription>
          Mientras llega la ilustración de Figma Errores, cada error usa una ilustración glass. Los
          cuerpos son provisionales: la historia pide usar el copy acordado sin parafrasearlo. Hoy la
          plataforma tiene dos páginas de «no encontrado» con diseños distintos; este patrón sirve para
          las dos.
        </AlertDescription>
      </Alert>
    </div>
  )
}
