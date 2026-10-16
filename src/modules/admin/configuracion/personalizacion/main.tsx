import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import fondoDemo from '@/modules/auth/Assets/Background.jpg'
import metaLogo from '@/shared/assets/meta.png'
import { notify } from '@/shared/components/notify'
import { PageActionBar, PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { plural } from '@/modules/design-system/patrones/formato'
import { CampoImagen } from '../components/carga-imagen'
import { EMPRESA, VACIO, listo, mismoArchivo, type Archivo } from '../components/datos'
import { MarcoVistaPrevia, VistaEncabezado, VistaInicioSesion } from '../components/vista-previa'

type Pestana = 'inicio' | 'logo'

const PESTANAS: { value: Pestana; label: string }[] = [
  { value: 'inicio', label: 'Inicio de sesión' },
  { value: 'logo', label: 'Logo principal' },
]

const imagenSi = (archivo: Archivo, src: string) => (archivo.estado === 'listo' ? src : undefined)

// Configuración › Personalización (en la plataforma: /admin-hr/companies/customization/:id).
// Formulario a la izquierda y vista previa a la derecha. Las cargas son simuladas.
export function Component() {
  const [pestana, setPestana] = useState<Pestana>('inicio')

  return (
    <PageShell>
      <PageHeader
        title="Personaliza tu experiencia"
        description="Pon la marca de Meta Colombia en la página de inicio de sesión y en el encabezado de UBITS."
        tabs={
          <Tabs value={pestana} onValueChange={(value) => setPestana(value as Pestana)}>
            <TabsList variant="line">
              {PESTANAS.map((item) => (
                <TabsTrigger key={item.value} value={item.value} className="flex-none px-3">
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      <PageContent>{pestana === 'inicio' ? <InicioSesion key="inicio" /> : <LogoPrincipal key="logo" />}</PageContent>
    </PageShell>
  )
}

function InicioSesion() {
  const [guardado, setGuardado] = useState({ logo: VACIO, fondo: VACIO })
  const [logo, setLogo] = useState<Archivo>(VACIO)
  const [fondo, setFondo] = useState<Archivo>(VACIO)

  const cargando = logo.estado === 'cargando' || fondo.estado === 'cargando'
  const cambios = [!mismoArchivo(logo, guardado.logo), !mismoArchivo(fondo, guardado.fondo)].filter(Boolean).length

  return (
    <div className="grid animate-in items-start gap-8 duration-200 fade-in lg:grid-cols-2">
      <FieldGroup>
        <CampoImagen tipo="logo" imagen={metaLogo} value={logo} onChange={setLogo} />
        <CampoImagen tipo="fondo" imagen={fondoDemo} value={fondo} onChange={setFondo} />
        <Field>
          <FieldLabel htmlFor="link-ingreso">Link de ingreso</FieldLabel>
          <FieldDescription>
            Este es el enlace de acceso personalizado a la plataforma, ten presente que no es posible modificarlo, solo debes
            copiarlo y compartirlo para que tus colaboradores ingresen a UBITS.
          </FieldDescription>
          <InputGroup>
            <InputGroupInput id="link-ingreso" value={EMPRESA.enlaceIngreso} readOnly />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="sm"
                onClick={() => {
                  void navigator.clipboard?.writeText(EMPRESA.enlaceIngreso).catch(() => undefined)
                  notify('Enlace copiado', 'Compártelo con tus colaboradores para que ingresen a UBITS.')
                }}
              >
                <HugeiconsIcon icon={Copy01Icon} size={14} />
                Copiar
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </FieldGroup>

      <MarcoVistaPrevia descripcion="Así verás tu página de inicio de sesión.">
        <VistaInicioSesion logo={imagenSi(logo, metaLogo)} fondo={imagenSi(fondo, fondoDemo)} />
      </MarcoVistaPrevia>

      <BarraGuardar
        cambios={cambios}
        cargando={cargando}
        onDescartar={() => {
          setLogo(guardado.logo)
          setFondo(guardado.fondo)
        }}
        onGuardar={() => {
          setGuardado({ logo, fondo })
          notify('Cambios guardados', 'Tus colaboradores verán la nueva página de inicio de sesión.')
        }}
      />
    </div>
  )
}

function LogoPrincipal() {
  // Como en la plataforma: el logo horizontal ya está cargado y el de celular está subiendo.
  const [guardado, setGuardado] = useState({ logo: listo('logo'), celular: VACIO })
  const [logo, setLogo] = useState<Archivo>(() => listo('logo'))
  const [celular, setCelular] = useState<Archivo>({ estado: 'cargando', nombre: 'logo-celular.jpeg', progreso: 0 })
  const [vistaCelular, setVistaCelular] = useState(false)

  const cargando = logo.estado === 'cargando' || celular.estado === 'cargando'
  const cambios = [!mismoArchivo(logo, guardado.logo), !mismoArchivo(celular, guardado.celular)].filter(Boolean).length

  return (
    <div className="grid animate-in items-start gap-8 duration-200 fade-in lg:grid-cols-2">
      <FieldGroup>
        <CampoImagen tipo="logo" imagen={metaLogo} value={logo} onChange={setLogo} />
        <CampoImagen tipo="logoCelular" imagen={metaLogo} value={celular} onChange={setCelular} />
      </FieldGroup>

      <MarcoVistaPrevia
        descripcion="Así verás tu logo en el header de UBITS."
        accion={
          <Field orientation="horizontal" className="w-auto">
            <Switch id="vista-celular" checked={vistaCelular} onCheckedChange={setVistaCelular} />
            <FieldLabel htmlFor="vista-celular">Ver vista de celular</FieldLabel>
          </Field>
        }
      >
        <VistaEncabezado logo={imagenSi(logo, metaLogo)} logoCelular={imagenSi(celular, metaLogo)} celular={vistaCelular} />
      </MarcoVistaPrevia>

      <BarraGuardar
        cambios={cambios}
        cargando={cargando}
        onDescartar={() => {
          setLogo(guardado.logo)
          setCelular(guardado.celular)
        }}
        onGuardar={() => {
          setGuardado({ logo, celular })
          notify('Cambios guardados', 'El nuevo logo ya aparece en el encabezado de UBITS.')
        }}
      />
    </div>
  )
}

// Barra fija de guardado, como el patrón Design system › Navegación › Configuración: aparece cuando hay cambios.
// Va dentro de la cuadrícula de la pestaña, a lo ancho de las dos columnas.
function BarraGuardar({
  cambios,
  cargando,
  onDescartar,
  onGuardar,
}: {
  cambios: number
  cargando: boolean
  onDescartar: () => void
  onGuardar: () => void
}) {
  const texto = `Tienes ${cambios} ${plural(cambios, 'cambio', 'cambios')} sin guardar`
  return (
    <>
      {/* Siempre montado: así el aviso de cambios se anuncia al aparecer la barra (y al cambiar el número). */}
      <span role="status" className="sr-only">
        {cambios ? texto : ''}
      </span>
      {cambios ? (
        <PageActionBar className="mt-0 animate-in duration-300 fade-in slide-in-from-bottom-2 lg:col-span-2">
          <HugeiconsIcon icon={InformationCircleIcon} size={18} className="text-primary" aria-hidden="true" />
          <Text as="span" size="sm">
            {texto}
          </Text>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={onDescartar}>
              Descartar
            </Button>
            <Button disabled={cargando} onClick={onGuardar}>
              Guardar cambios
            </Button>
          </div>
        </PageActionBar>
      ) : null}
    </>
  )
}

Component.displayName = 'AdminPersonalizacionPage'
