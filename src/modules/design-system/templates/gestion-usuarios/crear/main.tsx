import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert01Icon, LogoutSquare01Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  toast,
} from '@ubits/flux-ui'
import { PageActionBar } from '@/shared/components/PageShell'
import { ChipGuardado } from '@/shared/components/ChipGuardado'
import { BotonSalirCreacion } from '@/modules/design-system/navegacion/boton-salir-creacion'

import { DialogoConfirmar, RegistroConfirmar } from '../../../estados/confirmaciones'
import { PantallaDeError } from '../../../estados/errores-sistema'
import { registroQueNoExiste } from '../../../estados/errores-sistema-datos'
import { EncabezadoPantalla } from '../../admin-compartido/piezas'
import { AREAS, NIVELES, PAISES, ROLES, nombreCompleto, ruta, type Nivel, type Rol, type Usuario } from '../components/datos'
import { useGestion } from '../components/estado'

// «Crear usuario» (/admin-hr/users/creation) y «Editar usuario». Mismos campos, textos de ayuda y
// obligatorios que la pantalla real. La validación sigue el patrón de Formularios: al salir del
// campo, nunca mientras se escribe, y al guardar con un resumen arriba que lleva al primer error.

type Borrador = {
  nombres: string
  apellidos: string
  username: string
  correo: string
  dni: string
  cargo: string
  pais: string
  ciudad: string
  nivel: Nivel | ''
  area: string
  rol: Rol | ''
  lider: string
  propioLider: boolean
  columnaA: string
  columnaB: string
}

type Campo = keyof Borrador
type Errores = Partial<Record<Campo, string>>

const VACIO: Borrador = {
  nombres: '',
  apellidos: '',
  username: '',
  correo: '',
  dni: '',
  cargo: '',
  pais: '',
  ciudad: '',
  nivel: '',
  area: '',
  rol: '',
  lider: '',
  propioLider: false,
  columnaA: '',
  columnaB: '',
}

const ETIQUETAS: Record<Campo, string> = {
  nombres: 'Nombre(s)',
  apellidos: 'Apellido(s)',
  username: 'Username',
  correo: 'Correo electrónico',
  dni: 'DNI',
  cargo: 'Cargo en la compañía',
  pais: 'País',
  ciudad: 'Ciudad',
  nivel: 'Nivel en la empresa',
  area: 'Área',
  rol: 'Tipo de rol',
  lider: 'Nombre del líder',
  propioLider: '¿El usuario es su propio líder?',
  columnaA: 'Columna A',
  columnaB: 'Columna B',
}

// Orden en que se revisan (y se enfocan) los campos al guardar.
const ORDEN: Campo[] = ['nombres', 'apellidos', 'username', 'correo', 'cargo', 'pais', 'ciudad', 'nivel', 'area', 'rol']

const aBorrador = (u: Usuario): Borrador => ({
  nombres: u.nombres,
  apellidos: u.apellidos,
  username: u.username,
  correo: u.correo,
  dni: u.dni,
  cargo: u.cargo,
  pais: u.pais,
  ciudad: u.ciudad,
  nivel: u.nivel,
  area: u.area,
  rol: u.rol,
  lider: u.lider,
  propioLider: !u.lider,
  columnaA: u.columnaA,
  columnaB: u.columnaB,
})

// Buscador de una sola opción (país, ciudad, líder): Combobox con los textos en español.
function Buscador({
  id,
  opciones,
  valor,
  onCambio,
  onSalir,
  placeholder,
  vacio,
  invalido,
  deshabilitado,
}: {
  id: string
  opciones: string[]
  valor: string
  onCambio: (valor: string) => void
  onSalir?: () => void
  placeholder: string
  vacio: string
  invalido?: boolean
  deshabilitado?: boolean
}) {
  return (
    <Combobox items={opciones} value={valor || null} onValueChange={(nuevo) => onCambio((nuevo as string | null) ?? '')} disabled={deshabilitado}>
      <ComboboxInput id={id} placeholder={placeholder} aria-invalid={invalido ? true : undefined} onBlur={onSalir} />
      <ComboboxContent>
        <ComboboxEmpty>{vacio}</ComboboxEmpty>
        <ComboboxList>
          {(opcion: string) => (
            <ComboboxItem key={opcion} value={opcion}>
              {opcion}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export function Component() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuarios, setUsuarios } = useGestion()
  const editando = id ? usuarios.find((u) => u.id === id) : undefined

  const [borrador, setBorrador] = useState<Borrador>(() => (editando ? aBorrador(editando) : VACIO))
  const [original] = useState(borrador)
  const [errores, setErrores] = useState<Errores>({})
  const [enviado, setEnviado] = useState(false)
  const [saliendo, setSaliendo] = useState(false)

  // Un id que no existe: el error de sistema «No encontramos esta página», con su botón navegando.
  if (id && !editando) {
    return (
      <div className="flex flex-1 flex-col pt-2">
        <PantallaDeError error={registroQueNoExiste('este usuario', 'Gestión de usuarios')} onAccion={() => navigate(ruta())} />
      </div>
    )
  }

  const lideres = usuarios
    .filter((u) => u.nivel !== 'Operativo' && u.estado === 'Activo' && u.id !== editando?.id)
    .map(nombreCompleto)
    .slice(0, 80)

  const reglas: Partial<Record<Campo, (b: Borrador) => string | undefined>> = {
    nombres: (b) => (b.nombres.trim() ? undefined : 'Escribe el nombre.'),
    apellidos: (b) => (b.apellidos.trim() ? undefined : 'Escribe los apellidos.'),
    username: (b) => {
      const valor = b.username.trim()
      if (!valor) return 'Escribe el username: es el dato con el que entrará a la plataforma.'
      if (/\s/.test(valor)) return 'El username no lleva espacios.'
      const dueno = usuarios.find((u) => u.username === valor && u.id !== editando?.id)
      return dueno ? `Ese username ya es de ${nombreCompleto(dueno)}. Prueba con otro.` : undefined
    },
    correo: (b) => {
      const valor = b.correo.trim()
      if (!valor) return 'Escribe el correo electrónico.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) return 'Revisa el correo: parece que le falta algo.'
      return usuarios.some((u) => u.correo === valor && u.id !== editando?.id) ? 'Ese correo ya está registrado en tu empresa.' : undefined
    },
    cargo: (b) => (b.cargo.trim() ? undefined : 'Escribe el cargo en la compañía.'),
    pais: (b) => (b.pais ? undefined : 'Elige el país.'),
    ciudad: (b) => (b.ciudad ? undefined : 'Elige la ciudad.'),
    nivel: (b) => (b.nivel ? undefined : 'Elige el nivel en la empresa.'),
    area: (b) => (b.area ? undefined : 'Elige el área: con ella se arma el organigrama.'),
    rol: (b) => (b.rol ? undefined : 'Elige el tipo de rol.'),
  }
  const validar = (campo: Campo, b = borrador) => reglas[campo]?.(b)

  const cambiar = <K extends Campo>(campo: K, valor: Borrador[K]) => {
    const siguiente = { ...borrador, [campo]: valor }
    // La ciudad depende del país: si cambia el país, la ciudad se vuelve a elegir.
    if (campo === 'pais' && valor !== borrador.pais) siguiente.ciudad = ''
    if (campo === 'propioLider' && valor) siguiente.lider = ''
    setBorrador(siguiente)
    // Mientras escribe solo se quita el error si ya lo corrigió; nunca se agrega uno nuevo.
    if (errores[campo] && !validar(campo, siguiente)) setErrores((previos) => ({ ...previos, [campo]: undefined }))
  }

  const salirDelCampo = (campo: Campo) => setErrores((previos) => ({ ...previos, [campo]: validar(campo) }))

  const guardar = () => {
    const encontrados: Errores = {}
    for (const campo of ORDEN) {
      const error = validar(campo)
      if (error) encontrados[campo] = error
    }
    setErrores(encontrados)
    setEnviado(true)
    const primero = ORDEN.find((c) => encontrados[c])
    if (primero) {
      document.getElementById(`usuario-${primero}`)?.focus()
      return
    }

    const datos = {
      nombres: borrador.nombres.trim(),
      apellidos: borrador.apellidos.trim(),
      username: borrador.username.trim(),
      correo: borrador.correo.trim(),
      dni: borrador.dni.trim(),
      cargo: borrador.cargo.trim(),
      pais: borrador.pais,
      ciudad: borrador.ciudad,
      nivel: borrador.nivel as Nivel,
      area: borrador.area,
      rol: borrador.rol as Rol,
      lider: borrador.propioLider ? '' : borrador.lider,
      columnaA: borrador.columnaA.trim(),
      columnaB: borrador.columnaB.trim(),
    }

    if (editando) {
      setUsuarios((todos) => todos.map((u) => (u.id === editando.id ? { ...u, ...datos } : u)))
      toast.add({ type: 'success', title: 'Usuario actualizado', description: `Guardamos los cambios de ${datos.nombres} ${datos.apellidos}.` })
    } else {
      const nuevo: Usuario = {
        ...datos,
        id: `u-nuevo-${usuarios.length + 1}`,
        estado: 'Activo',
        proceso: 'Finalizado',
        creado: '2026-09-11',
        ultimoIngreso: null,
      }
      setUsuarios((todos) => [nuevo, ...todos])
      toast.add({
        type: 'success',
        title: 'Usuario creado',
        description: `Le enviamos a ${datos.correo} el enlace para crear su contraseña.`,
      })
    }
    navigate(ruta())
  }

  const hayCambios = JSON.stringify(borrador) !== JSON.stringify(original)
  const cancelar = () => (hayCambios ? setSaliendo(true) : navigate(ruta()))
  const nombreBorrador = `${borrador.nombres} ${borrador.apellidos}`.trim()
  // «Guardar y salir» guarda como el botón de la barra: valida y, si falta algo, se queda a corregirlo con el resumen arriba.
  const guardarYSalir = () => {
    setSaliendo(false)
    guardar()
  }
  const lista = ORDEN.filter((c) => errores[c])
  const invalido = (campo: Campo) => (errores[campo] ? 'true' : undefined)

  // Un campo de texto con su etiqueta, ayuda y error. Es una función y no un componente para que
  // el campo no se vuelva a montar (y pierda el foco) con cada letra.
  const texto = (campo: Campo, { ayuda, obligatorio = true, tipo = 'text' }: { ayuda?: string; obligatorio?: boolean; tipo?: string } = {}) => (
    <Field key={campo} data-invalid={invalido(campo)}>
      <FieldLabel htmlFor={`usuario-${campo}`}>
        {ETIQUETAS[campo]}
        {obligatorio ? null : (
          <Badge variant="secondary" size="xs">
            Opcional
          </Badge>
        )}
      </FieldLabel>
      <Input
        id={`usuario-${campo}`}
        type={tipo}
        value={borrador[campo] as string}
        aria-invalid={errores[campo] ? true : undefined}
        onChange={(e) => cambiar(campo, e.target.value as never)}
        onBlur={() => salirDelCampo(campo)}
      />
      {errores[campo] ? <FieldError>{errores[campo]}</FieldError> : ayuda ? <FieldDescription>{ayuda}</FieldDescription> : null}
    </Field>
  )

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2">
      <EncabezadoPantalla
        titulo={editando ? 'Editar usuario' : 'Crear usuario'}
        descripcion={
          editando
            ? `Actualiza los datos de ${nombreCompleto(editando)}. Los campos de área y líder son necesarios para crear tu organigrama.`
            : 'Llena los campos requeridos para crear un nuevo usuario en el sistema. Los campos de área y líder son necesarios para crear tu organigrama.'
        }
        acciones={<BotonSalirCreacion texto={editando ? 'Salir de la edición' : 'Salir de la creación'} onClick={cancelar} />}
      />

      {enviado && lista.length > 0 ? (
        <Alert variant="destructive">
          <HugeiconsIcon icon={Alert01Icon} aria-hidden="true" />
          <AlertTitle>{lista.length === 1 ? 'Falta un dato para guardar el usuario' : `Faltan ${lista.length} datos para guardar el usuario`}</AlertTitle>
          <AlertDescription>
            <ul className="ml-4 flex list-disc flex-col gap-1">
              {lista.map((campo) => (
                <li key={campo}>
                  {ETIQUETAS[campo]}: {errores[campo]}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-8">
          <FieldSet>
            <FieldLegend>Datos personales</FieldLegend>
            <FieldGroup className="grid gap-6 md:grid-cols-2">
              {texto('nombres')}
              {texto('apellidos')}
              {texto('dni', { obligatorio: false })}
            </FieldGroup>
          </FieldSet>

          <Separator />

          <FieldSet>
            <FieldLegend>Acceso a la plataforma</FieldLegend>
            <FieldGroup className="grid gap-6 md:grid-cols-2">
              {texto('username', { ayuda: 'Dato con el que tus usuarios ingresarán a la plataforma' })}
              {texto('correo', { tipo: 'email', ayuda: 'Aquí llega el enlace para crear la contraseña.' })}
              <Field data-invalid={invalido('rol')}>
                <FieldLabel htmlFor="usuario-rol">{ETIQUETAS.rol}</FieldLabel>
                <Select
                  value={borrador.rol || null}
                  onValueChange={(valor) => {
                    cambiar('rol', (valor as Rol) ?? '')
                    setErrores((previos) => ({ ...previos, rol: undefined }))
                  }}
                >
                  <SelectTrigger id="usuario-rol" className="w-full" aria-invalid={errores.rol ? true : undefined}>
                    <SelectValue placeholder="Seleccionar…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((rol) => (
                      <SelectItem key={rol} value={rol}>
                        {rol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errores.rol ? <FieldError>{errores.rol}</FieldError> : <FieldDescription>Administrador entra también al Workspace de administración.</FieldDescription>}
              </Field>
            </FieldGroup>
          </FieldSet>

          <Separator />

          <FieldSet>
            <FieldLegend>Organización</FieldLegend>
            <FieldGroup className="grid gap-6 md:grid-cols-2">
              {texto('cargo')}
              <Field data-invalid={invalido('nivel')}>
                <FieldLabel htmlFor="usuario-nivel">{ETIQUETAS.nivel}</FieldLabel>
                <Select
                  value={borrador.nivel || null}
                  onValueChange={(valor) => {
                    cambiar('nivel', (valor as Nivel) ?? '')
                    setErrores((previos) => ({ ...previos, nivel: undefined }))
                  }}
                >
                  <SelectTrigger id="usuario-nivel" className="w-full" aria-invalid={errores.nivel ? true : undefined}>
                    <SelectValue placeholder="Seleccionar…" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIVELES.map((nivel) => (
                      <SelectItem key={nivel} value={nivel}>
                        {nivel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errores.nivel ? <FieldError>{errores.nivel}</FieldError> : null}
              </Field>
              <Field data-invalid={invalido('area')}>
                <FieldLabel htmlFor="usuario-area">{ETIQUETAS.area}</FieldLabel>
                <Select
                  value={borrador.area || null}
                  onValueChange={(valor) => {
                    cambiar('area', (valor as string) ?? '')
                    setErrores((previos) => ({ ...previos, area: undefined }))
                  }}
                >
                  <SelectTrigger id="usuario-area" className="w-full" aria-invalid={errores.area ? true : undefined}>
                    <SelectValue placeholder="Seleccionar…" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errores.area ? <FieldError>{errores.area}</FieldError> : <FieldDescription>Este campo te ayudará a crear y controlar tu organigrama</FieldDescription>}
              </Field>
              <div className="flex flex-col gap-3">
                <Field data-disabled={borrador.propioLider ? 'true' : undefined}>
                  <FieldLabel htmlFor="usuario-lider">
                    {ETIQUETAS.lider}
                    <Badge variant="secondary" size="xs">
                      Opcional
                    </Badge>
                  </FieldLabel>
                  <Buscador
                    id="usuario-lider"
                    opciones={lideres}
                    valor={borrador.lider}
                    onCambio={(valor) => cambiar('lider', valor)}
                    placeholder="Buscar líder…"
                    vacio="No encontramos a nadie con ese nombre."
                    deshabilitado={borrador.propioLider}
                  />
                  <FieldDescription>Este campo te ayudará a crear y controlar tu organigrama</FieldDescription>
                </Field>
                <Field orientation="horizontal">
                  <Checkbox id="usuario-propio" checked={borrador.propioLider} onCheckedChange={(valor) => cambiar('propioLider', valor === true)} />
                  <FieldLabel htmlFor="usuario-propio">{ETIQUETAS.propioLider}</FieldLabel>
                </Field>
              </div>
              <Field data-invalid={invalido('pais')}>
                <FieldLabel htmlFor="usuario-pais">{ETIQUETAS.pais}</FieldLabel>
                <Buscador
                  id="usuario-pais"
                  opciones={Object.keys(PAISES)}
                  valor={borrador.pais}
                  onCambio={(valor) => cambiar('pais', valor)}
                  onSalir={() => salirDelCampo('pais')}
                  placeholder="Buscar país…"
                  vacio="No encontramos ese país."
                  invalido={!!errores.pais}
                />
                {errores.pais ? <FieldError>{errores.pais}</FieldError> : null}
              </Field>
              <Field data-invalid={invalido('ciudad')} data-disabled={borrador.pais ? undefined : 'true'}>
                <FieldLabel htmlFor="usuario-ciudad">{ETIQUETAS.ciudad}</FieldLabel>
                <Buscador
                  key={borrador.pais}
                  id="usuario-ciudad"
                  opciones={PAISES[borrador.pais] ?? []}
                  valor={borrador.ciudad}
                  onCambio={(valor) => cambiar('ciudad', valor)}
                  placeholder={borrador.pais ? 'Buscar ciudad…' : 'Elige primero el país'}
                  vacio="No encontramos esa ciudad."
                  invalido={!!errores.ciudad}
                  deshabilitado={!borrador.pais}
                />
                {errores.ciudad ? <FieldError>{errores.ciudad}</FieldError> : null}
              </Field>
            </FieldGroup>
          </FieldSet>

          <Separator />

          <FieldSet>
            <FieldLegend>Campos de tu empresa</FieldLegend>
            <FieldDescription>Columnas libres para segmentar reportes (sede, centro de costos…).</FieldDescription>
            <FieldGroup className="grid gap-6 md:grid-cols-2">
              {texto('columnaA', { obligatorio: false })}
              {texto('columnaB', { obligatorio: false })}
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      {/* Barra fija abajo, como en todos los flujos de creación: el estado del guardado a la izquierda (informa, no se
          pulsa) y la acción a la derecha. Sin «Cancelar»: la única salida es la de junto al título. Con un formulario
          corto baja hasta el final de la pantalla. */}
      <PageActionBar className="mt-auto">
        <ChipGuardado estado={hayCambios ? 'editando' : 'guardado'} />
        {/* onMouseDown sin foco: si el campo que se deja muestra su error al perder el foco,
            el botón se correría antes de soltar el clic y el clic se perdería. */}
        <div className="ml-auto flex items-center gap-2">
          <Button onMouseDown={(e) => e.preventDefault()} onClick={guardar}>
            {editando ? 'Guardar cambios' : 'Guardar'}
          </Button>
        </div>
      </PageActionBar>

      {/* Salir con cambios es preguntar antes de hacer algo: DialogoConfirmar con sus tres salidas y en su tamaño normal
          (en el chico los tres botones no caben en una fila). El título es fijo; el usuario va en la tarjeta. */}
      <DialogoConfirmar
        abierto={saliendo}
        onAbiertoChange={setSaliendo}
        icono={LogoutSquare01Icon}
        titulo={editando ? '¿Salir de la edición?' : '¿Salir de la creación?'}
        descripcion={
          editando
            ? 'Tienes cambios sin guardar. Si sales ahora, el usuario queda como estaba.'
            : 'Tienes cambios sin guardar. Si sales ahora, el usuario no se crea.'
        }
        cancelar="Seguir editando"
        otra={{
          texto: 'Salir sin guardar',
          onClick: () => {
            setSaliendo(false)
            navigate(ruta())
          },
        }}
        accion="Guardar y salir"
        onConfirmar={guardarYSalir}
      >
        <RegistroConfirmar
          nombre={nombreBorrador || 'Usuario sin nombre'}
          detalle={editando ? 'Usuario · en edición' : 'Usuario nuevo'}
          estado="Cambios sin guardar"
        />
      </DialogoConfirmar>

    </div>
  )
}

Component.displayName = 'GestionUsuariosCrear'
