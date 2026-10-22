import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  Building03Icon,
  CheckmarkCircle02Icon,
  Mail01Icon,
  Mortarboard01Icon,
  RefreshIcon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Text,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'

import { COLABORADORES } from '../data-grid/data'
import { DialogoConfirmar, RegistroConfirmar } from '../estados/confirmaciones'
import { textoDeRango } from '../patrones/formato'
import { CasoUbits } from '../patrones/piezas'
import { RangoDeFechas, type Rango } from './rango-de-fechas'

// Caso: descarga masiva de certificados (Aprendizaje › Certificados).
// Fuente: HU «Descarga masiva de certificados», RN-01 a RN-05.

type Modo = 'global' | 'contenido' | 'colaborador'

const MODOS: { id: Modo; titulo: string; detalle: string; icono: typeof UserIcon }[] = [
  { id: 'global', titulo: 'Global', detalle: 'Todos los certificados emitidos en un periodo', icono: Building03Icon },
  { id: 'contenido', titulo: 'Por contenido', detalle: 'Los de un curso, ruta o evento', icono: Mortarboard01Icon },
  { id: 'colaborador', titulo: 'Por colaborador', detalle: 'Todos los de una persona', icono: UserIcon },
]

const CONTENIDOS = ['Onboarding comercial Q3', 'Seguridad de la información 2026', 'Inducción corporativa', 'Ruta para nuevos líderes', 'Ventas consultivas']
const PERSONAS = COLABORADORES.map((c) => c.nombre)
const CORREO = 'lucia.ortega@meta.com'

type Solicitud = { clave: string; modo: Modo; filtro: string | null; periodo: string; certificados: number; hace: string; rango: Rango }

const clave = (modo: Modo, filtro: string | null, rango: Rango) =>
  [modo, filtro ?? '', rango?.from?.toDateString() ?? '', rango?.to?.toDateString() ?? ''].join('|')

const AGOSTO: Rango = { from: new Date('2026-08-01T00:00:00'), to: new Date('2026-08-31T00:00:00') }

const RECIENTES_INICIALES: Solicitud[] = [
  { clave: clave('global', null, AGOSTO), modo: 'global', filtro: null, periodo: textoDeRango(AGOSTO) ?? '', certificados: 312, hace: 'Hace 5 horas', rango: AGOSTO },
]

function estimar(modo: Modo, filtro: string | null) {
  if (modo === 'global') return 312
  if (modo === 'colaborador') return 6
  return 40 + ((filtro?.length ?? 0) * 7) % 90
}

export function FormularioRevisarConfirmar() {
  const [modo, setModo] = useState<Modo>('contenido')
  const [contenido, setContenido] = useState('Onboarding comercial Q3')
  const [persona, setPersona] = useState<string | null>(null)
  const [rango, setRango] = useState<Rango>(AGOSTO)
  const [errores, setErrores] = useState<{ filtro?: string; fechas?: string }>({})
  const [revisando, setRevisando] = useState(false)
  const [recientes, setRecientes] = useState(RECIENTES_INICIALES)
  const [resultado, setResultado] = useState<'registrada' | 'duplicada' | null>(null)

  const filtro = modo === 'contenido' ? contenido : modo === 'colaborador' ? persona : null
  const certificados = estimar(modo, filtro)

  const revisar = () => {
    const encontrados: typeof errores = {}
    // Camino negativo de la historia: por colaborador sin elegir a nadie no se envía.
    if (modo === 'colaborador' && !persona) encontrados.filtro = 'Elige a la persona cuyos certificados quieres descargar.'
    if (modo === 'contenido' && !contenido) encontrados.filtro = 'Elige el contenido.'
    if (!rango?.from || !rango.to) encontrados.fechas = 'Elige desde y hasta cuándo se emitieron.'
    setErrores(encontrados)
    setResultado(null)
    if (Object.keys(encontrados).length === 0) setRevisando(true)
  }

  const confirmar = () => {
    setRevisando(false)
    const nueva = clave(modo, filtro, rango)
    // RN-03: una solicitud igual dentro de 48 horas no se acepta.
    if (recientes.some((s) => s.clave === nueva)) {
      setResultado('duplicada')
      return
    }
    setRecientes((previas) => [
      { clave: nueva, modo, filtro, periodo: textoDeRango(rango) ?? '', certificados, hace: 'Hace un momento', rango },
      ...previas,
    ])
    setResultado('registrada')
    notify('Solicitud registrada', `Te llegará un correo a ${CORREO}.`, 'success')
  }

  const repetir = (solicitud: Solicitud) => {
    setModo(solicitud.modo)
    if (solicitud.modo === 'contenido' && solicitud.filtro) setContenido(solicitud.filtro)
    if (solicitud.modo === 'colaborador') setPersona(solicitud.filtro)
    setRango(solicitud.rango)
    setErrores({})
    setResultado(null)
  }

  const modoActual = MODOS.find((m) => m.id === modo) ?? MODOS[0]

  return (
    <CasoUbits
      rol="Administrador"
      donde={['Aprendizaje', 'Certificados', 'Descarga masiva']}
      titulo="Revisar y confirmar antes de enviar"
      descripcion="Una descarga masiva genera cientos de archivos y llega por correo. Antes de pedirla se muestra un resumen para confirmar, y si ya se pidió lo mismo hace menos de 48 horas, no se repite. Usa «Repetir» en la solicitud de abajo para ver el aviso."
      historia="la historia «Descarga masiva de certificados»"
      reglas={[
        { titulo: 'Tres modos', detalle: 'Global, por contenido o por colaborador.' },
        { titulo: 'Revisar antes de generar', detalle: 'Toda solicitud pasa por la ventana «¿Pedir la descarga de certificados?», con el resumen de lo que se pide.' },
        { titulo: 'Sin duplicados en 48 horas', detalle: 'Si es igual a una reciente, no se genera y se dice cómo seguir.' },
        { titulo: 'Llega por correo', detalle: 'El enlace se envía a quien la pidió y dura 2 días.' },
        { titulo: 'No se envía incompleta', detalle: 'Por colaborador sin elegir a la persona muestra el error en el campo.' },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardContent className="flex flex-col gap-6">
            {resultado === 'registrada' ? (
              <Alert variant="success">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
                <AlertTitle>Solicitud registrada</AlertTitle>
                <AlertDescription>
                  Cuando esté lista te enviaremos el enlace a {CORREO}. Estará disponible durante 2 días.
                </AlertDescription>
              </Alert>
            ) : null}
            {resultado === 'duplicada' ? (
              <Alert variant="warning">
                <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
                <AlertTitle>Ya pediste esta misma descarga hace menos de 48 horas</AlertTitle>
                <AlertDescription>
                  Para no generar dos veces lo mismo, no se creó una nueva. Cambia las fechas o el filtro, o
                  vuelve a intentarlo cuando pasen 48 horas.
                </AlertDescription>
              </Alert>
            ) : null}

            <FieldGroup>
              <FieldSet>
                <FieldLegend>Qué certificados</FieldLegend>
                <RadioGroup
                  value={modo}
                  onValueChange={(valor) => {
                    setModo(valor as Modo)
                    setErrores({})
                    setResultado(null)
                  }}
                  className="grid gap-3 md:grid-cols-3"
                >
                  {MODOS.map((opcion) => (
                    <FieldLabel key={opcion.id} htmlFor={`modo-${opcion.id}`}>
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>
                            <HugeiconsIcon icon={opcion.icono} size={16} aria-hidden="true" />
                            {opcion.titulo}
                          </FieldTitle>
                          <FieldDescription>{opcion.detalle}</FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value={opcion.id} id={`modo-${opcion.id}`} />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              </FieldSet>

              <div className="grid gap-6 md:grid-cols-2">
                {modo === 'contenido' ? (
                  <Field data-invalid={errores.filtro ? 'true' : undefined}>
                    <FieldLabel htmlFor="cert-contenido">Contenido</FieldLabel>
                    <Select value={contenido} onValueChange={(valor) => setContenido(String(valor ?? ''))}>
                      <SelectTrigger id="cert-contenido" className="w-full">
                        <SelectValue>{(valor) => (valor ? String(valor) : 'Elige un contenido')}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {CONTENIDOS.map((opcion) => (
                          <SelectItem key={opcion} value={opcion}>
                            {opcion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errores.filtro ? <FieldError>{errores.filtro}</FieldError> : null}
                  </Field>
                ) : null}
                {modo === 'colaborador' ? (
                  <Field data-invalid={errores.filtro ? 'true' : undefined}>
                    <FieldLabel htmlFor="cert-persona">Colaborador</FieldLabel>
                    <Combobox
                      items={PERSONAS}
                      value={persona}
                      onValueChange={(valor) => {
                        setPersona((valor as string | null) ?? null)
                        setErrores((previos) => ({ ...previos, filtro: undefined }))
                      }}
                    >
                      <ComboboxInput id="cert-persona" placeholder="Busca por nombre…" aria-invalid={errores.filtro ? true : undefined} />
                      <ComboboxContent>
                        <ComboboxEmpty>No encontramos a nadie con ese nombre.</ComboboxEmpty>
                        <ComboboxList>
                          {(opcion: string) => (
                            <ComboboxItem key={opcion} value={opcion}>
                              {opcion}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {errores.filtro ? <FieldError>{errores.filtro}</FieldError> : <FieldDescription>Incluye todos sus certificados del periodo.</FieldDescription>}
                  </Field>
                ) : null}
                <Field data-invalid={errores.fechas ? 'true' : undefined}>
                  <FieldLabel htmlFor="cert-fechas">Emitidos entre</FieldLabel>
                  <RangoDeFechas
                    id="cert-fechas"
                    valor={rango}
                    invalido={!!errores.fechas}
                    onCambio={(nuevo) => {
                      setRango(nuevo)
                      setErrores((previos) => ({ ...previos, fechas: undefined }))
                    }}
                  />
                  {errores.fechas ? <FieldError>{errores.fechas}</FieldError> : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="cert-correo">Te llegará a</FieldLabel>
                  <Input id="cert-correo" value={CORREO} readOnly />
                  <FieldDescription>El correo de quien hace la solicitud.</FieldDescription>
                </Field>
              </div>
            </FieldGroup>

            <Separator />

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={revisar}>Revisar solicitud</Button>
              <Text variant="muted" size="sm">
                Todavía no se genera nada: primero verás un resumen.
              </Text>
            </div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Solicitudes recientes</CardTitle>
            <CardDescription>Las de las últimas 48 horas.</CardDescription>
          </CardHeader>
          <CardContent>
            <ItemGroup className="flex flex-col gap-2">
              {recientes.map((solicitud) => (
                <Item key={solicitud.clave} variant="outline" size="sm">
                  <ItemContent>
                    <ItemTitle>
                      {MODOS.find((m) => m.id === solicitud.modo)?.titulo}
                      {solicitud.filtro ? ` · ${solicitud.filtro}` : ''}
                    </ItemTitle>
                    <ItemDescription>
                      {solicitud.periodo} · {solicitud.certificados} certificados · {solicitud.hace}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <BotonIcono aria-label="Repetir esta solicitud" onClick={() => repetir(solicitud)}>
                      <HugeiconsIcon icon={RefreshIcon} aria-hidden="true" />
                    </BotonIcono>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          </CardContent>
        </Card>
      </div>

      {/* RN-02: resumen y confirmación explícita antes de generar. */}
      {/* 13-oct (regla dos-ventanas): confirmar con lo que se toca va en DialogoConfirmar con RegistroConfirmar, no en
          ActionDialog. El título es fijo; qué se pide y para cuándo va en la tarjeta. */}
      <DialogoConfirmar
        abierto={revisando}
        onAbiertoChange={setRevisando}
        icono={Mail01Icon}
        titulo="¿Pedir la descarga de certificados?"
        descripcion={`Se generará un solo archivo comprimido con los certificados que cumplan esto. Llega a ${CORREO} y el enlace estará disponible 2 días.`}
        cancelar="Volver a editar"
        accion="Pedir descarga"
        onConfirmar={confirmar}
      >
        <RegistroConfirmar
          nombre={`${modoActual.titulo}${filtro ? ` · ${filtro}` : ''}`}
          detalle={`Emitidos entre ${textoDeRango(rango)?.toLowerCase()} · unos ${certificados} certificados`}
          estado="Por generar"
          tono="neutro"
          icono={modoActual.icono}
        />
      </DialogoConfirmar>
    </CasoUbits>
  )
}
