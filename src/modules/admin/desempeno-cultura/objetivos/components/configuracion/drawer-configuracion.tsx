import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, PlusSignIcon, Settings02Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FramePanel,
  Input,
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { notify } from '@/shared/components/notify'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { BotonCancelarPanel } from '@/modules/design-system/drawers/components/boton-cancelar-panel'
import { FilasSeparadas, MarcoLista } from '../../../encuestas/components/marco-lista'
import type { Ciclo } from '../../modelo/ciclos'
import {
  APLICA,
  ESTADOS_FIJOS,
  LIMITES,
  TONOS,
  nivelesEfectivos,
  nuevoId,
  problemaDe,
  problemaDeConfig,
  tonoDe,
  tonoLibre,
  type Aplica,
  type Banda,
  type ConfigCiclo,
  type Nivel,
  type TonoId,
} from '../../modelo/configuracion'

// «Configurar ciclo»: los estados de los objetivos y los niveles de desempeño de UN ciclo (portado del panel
// «Configuración de objetivos» del prototipo, que valía para todo el módulo; aquí es por ciclo, 21-oct). Dos pestañas:
// los estados (los fijos del flujo, los resultados negativos y las bandas que se editan) y los niveles con que cierra
// cada persona. Se trabaja sobre una copia: nada cambia en el ciclo hasta «Guardar cambios».

type Pestana = 'estados' | 'niveles'

// Las columnas de una fila editable: nombre, desde, hasta, color y, en las bandas, cuándo aplica.
const COLUMNAS_BANDA = 'grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_7.5rem_7rem_2rem] items-center gap-2'
const COLUMNAS_NIVEL = 'grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_7.5rem_2rem] items-center gap-2'

function Punto({ tono }: { tono: TonoId }) {
  return <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: tonoDe(tono).color }} />
}

function SelectorTono({ valor, onCambio, etiqueta, deshabilitado }: { valor: TonoId; onCambio: (tono: TonoId) => void; etiqueta: string; deshabilitado?: boolean }) {
  return (
    <Select value={valor} onValueChange={(nuevo) => onCambio(nuevo as TonoId)} disabled={deshabilitado}>
      <SelectTrigger aria-label={etiqueta}>
        <SelectValue>
          {(id: string) => (
            <span className="flex min-w-0 items-center gap-2">
              <Punto tono={id as TonoId} />
              <span className="truncate">{tonoDe(id as TonoId).etiqueta}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {TONOS.map((tono) => (
          <SelectItem key={tono.id} value={tono.id}>
            <span className="flex items-center gap-2">
              <Punto tono={tono.id} />
              {tono.etiqueta}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function Porcentaje({ valor, onCambio, etiqueta, min, deshabilitado }: { valor: number; onCambio: (valor: number) => void; etiqueta: string; min: number; deshabilitado?: boolean }) {
  return (
    <NumberField value={valor} min={min} max={1000} disabled={deshabilitado} onValueChange={(nuevo) => onCambio(nuevo ?? 0)}>
      <NumberFieldGroup>
        <NumberFieldInput aria-label={etiqueta} />
      </NumberFieldGroup>
    </NumberField>
  )
}

function Encabezados({ columnas, etiquetas }: { columnas: string; etiquetas: readonly string[] }) {
  return (
    <div className={`${columnas} pb-1`} aria-hidden="true">
      {etiquetas.map((etiqueta, indice) => (
        <Text key={indice} as="span" size="xs" variant="muted">
          {etiqueta}
        </Text>
      ))}
    </div>
  )
}

function BotonQuitar({ nombre, minimo, onQuitar }: { nombre: string; minimo: boolean; onQuitar: () => void }) {
  const boton = (
    // text-destructive!: el botón de icono no trae tono rojo para eliminar (ficha button-ghost-tonos).
    <BotonIcono aria-label={`Quitar ${nombre || 'la fila'}`} className="text-destructive!" disabled={minimo} onClick={onQuitar}>
      <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
    </BotonIcono>
  )
  return minimo ? (
    <Hint label="Llegaste al mínimo: no se puede quitar otro.">
      <span className="inline-flex">{boton}</span>
    </Hint>
  ) : (
    boton
  )
}

function BotonAgregar({ texto, lleno, maximo, onAgregar }: { texto: string; lleno: boolean; maximo: number; onAgregar: () => void }) {
  const boton = (
    <Button variant="ghost" size="sm" disabled={lleno} onClick={onAgregar}>
      <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
      {texto}
    </Button>
  )
  return lleno ? (
    <Hint label={`Se permiten hasta ${maximo}.`}>
      <span className="inline-flex">{boton}</span>
    </Hint>
  ) : (
    boton
  )
}

function PestanaEstados({ config, onCambio, intento }: { config: ConfigCiclo; onCambio: (cambio: Partial<ConfigCiclo>) => void; intento: boolean }) {
  const bandas = config.bandas
  const cambiarBanda = (id: string, cambio: Partial<Banda>) => onCambio({ bandas: bandas.map((banda) => (banda.id === id ? { ...banda, ...cambio } : banda)) })
  const agregar = () => {
    const ultima = [...bandas].sort((a, b) => a.hasta - b.hasta).at(-1)
    const desde = (ultima?.hasta ?? 0) + 1
    onCambio({ bandas: [...bandas, { id: nuevoId('banda'), nombre: '', desde, hasta: desde + 10, tono: tonoLibre(bandas.map((banda) => banda.tono)), aplica: 'curso' }] })
  }
  const problema = intento ? problemaDe(bandas, 'estado') : null

  return (
    <div className="flex flex-col gap-5">
      <MarcoLista titulo="Estados fijos del flujo" descripcion="Los pone el flujo de aprobación y de avance: no se editan ni se eliminan.">
        {/* py-1!: las filas llevan su aire; al panel no se le cambia el relleno con una clase normal (ficha frame-panel-relleno-no-se-quita). */}
        <FramePanel className="py-1!">
          <FilasSeparadas>
            {ESTADOS_FIJOS.map((estado) => (
              <div key={estado.id} className="flex items-center gap-3 py-2.5">
                <Punto tono={estado.tono} />
                <Text as="span" size="sm" weight="medium" className="flex-1">
                  {estado.nombre}
                </Text>
                <Text as="span" size="sm" variant="muted">
                  {estado.cuando}
                </Text>
              </div>
            ))}
          </FilasSeparadas>
        </FramePanel>
      </MarcoLista>

      <MarcoLista titulo="Resultados negativos" descripcion="Si un objetivo puede quedar por debajo de 0 % y restar en el ciclo.">
        <FramePanel>
          <Field orientation="horizontal">
            <Switch id="config-negativos" checked={config.negativos} onCheckedChange={(negativos) => onCambio({ negativos })} />
            <FieldContent>
              <FieldLabel htmlFor="config-negativos">Permitir resultados negativos</FieldLabel>
              <FieldDescription>{config.negativos ? 'Aparece el estado «Restó» para los objetivos entre −100 % y −1 %.' : 'Apagado, ningún objetivo baja de 0 %.'}</FieldDescription>
            </FieldContent>
          </Field>
        </FramePanel>
      </MarcoLista>

      <MarcoLista
        titulo={
          <span className="inline-flex items-center gap-2">
            Estados configurables
            <Badge variant="secondary" radius="full" className="tabular-nums">
              {bandas.length} de {LIMITES.bandas.max}
            </Badge>
          </span>
        }
        descripcion="El nombre, el rango de cumplimiento, el color y en qué momento del ciclo puede aparecer cada estado."
      >
        <FramePanel className="flex flex-col gap-2">
          <Encabezados columnas={COLUMNAS_BANDA} etiquetas={['Nombre', 'Desde (%)', 'Hasta (%)', 'Color', 'Aplica', '']} />
          {bandas.map((banda, indice) => (
            <div key={banda.id} className={COLUMNAS_BANDA}>
              <Input value={banda.nombre} placeholder={`Estado ${indice + 1}`} aria-label={`Nombre del estado ${indice + 1}`} aria-invalid={intento && banda.nombre.trim() === '' ? true : undefined} onChange={(evento) => cambiarBanda(banda.id, { nombre: evento.target.value })} />
              <Porcentaje valor={banda.desde} min={0} etiqueta={`Desde, ${banda.nombre || `estado ${indice + 1}`}`} onCambio={(desde) => cambiarBanda(banda.id, { desde })} />
              <Porcentaje valor={banda.hasta} min={0} etiqueta={`Hasta, ${banda.nombre || `estado ${indice + 1}`}`} onCambio={(hasta) => cambiarBanda(banda.id, { hasta })} />
              <SelectorTono valor={banda.tono} etiqueta={`Color, ${banda.nombre || `estado ${indice + 1}`}`} onCambio={(tono) => cambiarBanda(banda.id, { tono })} />
              <Select value={banda.aplica} onValueChange={(aplica) => cambiarBanda(banda.id, { aplica: aplica as Aplica })}>
                <SelectTrigger aria-label={`Cuándo aplica, ${banda.nombre || `estado ${indice + 1}`}`}>
                  <SelectValue>{(valor: string) => APLICA[valor as Aplica]?.etiqueta}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(APLICA) as Aplica[]).map((aplica) => (
                    <SelectItem key={aplica} value={aplica}>
                      <span className="flex flex-col">
                        <span>{APLICA[aplica].etiqueta}</span>
                        <Text as="span" size="xs" variant="muted">
                          {APLICA[aplica].ayuda}
                        </Text>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <BotonQuitar nombre={banda.nombre} minimo={bandas.length <= LIMITES.bandas.min} onQuitar={() => onCambio({ bandas: bandas.filter((otra) => otra.id !== banda.id) })} />
            </div>
          ))}
          <div>
            <BotonAgregar texto="Agregar estado" lleno={bandas.length >= LIMITES.bandas.max} maximo={LIMITES.bandas.max} onAgregar={agregar} />
          </div>
          {problema ? <FieldError>{problema}</FieldError> : null}
        </FramePanel>
      </MarcoLista>
    </div>
  )
}

function PestanaNiveles({ config, onCambio, intento }: { config: ConfigCiclo; onCambio: (cambio: Partial<ConfigCiclo>) => void; intento: boolean }) {
  const niveles = nivelesEfectivos(config)
  const espejo = config.nivelesEspejo
  const cambiarNivel = (id: string, cambio: Partial<Nivel>) => onCambio({ niveles: config.niveles.map((nivel) => (nivel.id === id ? { ...nivel, ...cambio } : nivel)) })
  const agregar = () => {
    const ultimo = [...config.niveles].sort((a, b) => a.hasta - b.hasta).at(-1)
    const desde = Math.min(100, (ultimo?.hasta ?? 0) + 1)
    onCambio({ niveles: [...config.niveles, { id: nuevoId('nivel'), nombre: '', desde, hasta: 100, tono: tonoLibre(config.niveles.map((nivel) => nivel.tono)) }] })
  }
  const problema = intento && !espejo ? problemaDe(config.niveles, 'nivel') : null

  return (
    <div className="flex flex-col gap-5">
      <MarcoLista titulo="De dónde salen los niveles">
        <FramePanel>
          <Field orientation="horizontal">
            <Switch id="config-espejo" checked={espejo} onCheckedChange={(nivelesEspejo) => onCambio({ nivelesEspejo })} />
            <FieldContent>
              <FieldLabel htmlFor="config-espejo">Usar los estados configurables como niveles</FieldLabel>
              <FieldDescription>{espejo ? 'Cada persona cierra con el estado que alcance: cambia los estados para cambiar los niveles.' : 'Apagado, el ciclo tiene su propia escala de niveles.'}</FieldDescription>
            </FieldContent>
          </Field>
        </FramePanel>
      </MarcoLista>

      <MarcoLista
        titulo={
          <span className="inline-flex items-center gap-2">
            Niveles de desempeño
            <Badge variant="secondary" radius="full" className="tabular-nums">
              {espejo ? 'Copiados de los estados' : `${niveles.length} de ${LIMITES.niveles.max}`}
            </Badge>
          </span>
        }
        descripcion="Con qué calificación cierra cada persona según el cumplimiento que alcance."
      >
        <FramePanel className="flex flex-col gap-2">
          <Encabezados columnas={COLUMNAS_NIVEL} etiquetas={['Nombre', 'Desde (%)', 'Hasta (%)', 'Color', '']} />
          {niveles.map((nivel, indice) => (
            <div key={nivel.id} className={COLUMNAS_NIVEL}>
              <Input value={nivel.nombre} disabled={espejo} placeholder={`Nivel ${indice + 1}`} aria-label={`Nombre del nivel ${indice + 1}`} aria-invalid={intento && !espejo && nivel.nombre.trim() === '' ? true : undefined} onChange={(evento) => cambiarNivel(nivel.id, { nombre: evento.target.value })} />
              <Porcentaje valor={nivel.desde} min={0} deshabilitado={espejo} etiqueta={`Desde, ${nivel.nombre || `nivel ${indice + 1}`}`} onCambio={(desde) => cambiarNivel(nivel.id, { desde })} />
              <Porcentaje valor={nivel.hasta} min={0} deshabilitado={espejo} etiqueta={`Hasta, ${nivel.nombre || `nivel ${indice + 1}`}`} onCambio={(hasta) => cambiarNivel(nivel.id, { hasta })} />
              <SelectorTono valor={nivel.tono} deshabilitado={espejo} etiqueta={`Color, ${nivel.nombre || `nivel ${indice + 1}`}`} onCambio={(tono) => cambiarNivel(nivel.id, { tono })} />
              {espejo ? <span /> : <BotonQuitar nombre={nivel.nombre} minimo={config.niveles.length <= LIMITES.niveles.min} onQuitar={() => onCambio({ niveles: config.niveles.filter((otro) => otro.id !== nivel.id) })} />}
            </div>
          ))}
          {espejo ? null : (
            <div>
              <BotonAgregar texto="Agregar nivel" lleno={config.niveles.length >= LIMITES.niveles.max} maximo={LIMITES.niveles.max} onAgregar={agregar} />
            </div>
          )}
          {problema ? <FieldError>{problema}</FieldError> : null}
        </FramePanel>
      </MarcoLista>
    </div>
  )
}

function Formulario({ ciclo, inicial, onGuardar, onCerrar }: { ciclo: Ciclo; inicial: ConfigCiclo; onGuardar: (config: ConfigCiclo) => void; onCerrar: () => void }) {
  const [config, setConfig] = useState(inicial)
  const [pestana, setPestana] = useState<Pestana>('estados')
  const [intento, setIntento] = useState(false)
  const cambiar = (cambio: Partial<ConfigCiclo>) => setConfig((actual) => ({ ...actual, ...cambio }))
  const conCambios = JSON.stringify(config) !== JSON.stringify(inicial)

  const guardar = () => {
    setIntento(true)
    const problema = problemaDeConfig(config)
    if (problema) {
      // Lleva a la pestaña donde está el problema: los niveles solo fallan si los estados ya están bien.
      setPestana(problemaDe(config.bandas, 'estado') || config.bandas.length < LIMITES.bandas.min ? 'estados' : 'niveles')
      return
    }
    onGuardar(config)
    notify('Configuración guardada', `«${ciclo.nombre}» usa los nuevos estados y niveles.`, 'success')
  }

  return (
    <DrawerShell
      open
      onOpenChange={(abierto) => (abierto ? undefined : onCerrar())}
      size="xl"
      icon={Settings02Icon}
      title="Configurar ciclo"
      description={`Estados de los objetivos y niveles de desempeño de «${ciclo.nombre}». Solo aplican a este ciclo.`}
      conCambios={conCambios}
      footer={
        <>
          <BotonCancelarPanel />
          <Button onClick={guardar} disabled={!conCambios}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <Tabs value={pestana} onValueChange={(valor) => setPestana(valor as Pestana)} className="flex flex-col gap-5">
        <TabsList variant="line">
          <TabsTrigger value="estados">Estados de objetivos</TabsTrigger>
          <TabsTrigger value="niveles">Niveles de desempeño</TabsTrigger>
        </TabsList>
        <TabsContent value="estados">
          <PestanaEstados config={config} onCambio={cambiar} intento={intento} />
        </TabsContent>
        <TabsContent value="niveles">
          <PestanaNiveles config={config} onCambio={cambiar} intento={intento} />
        </TabsContent>
      </Tabs>
    </DrawerShell>
  )
}

/** El panel se monta solo mientras hay un ciclo que configurar: al guardar o cerrar, `ciclo` vuelve a null. */
export function DrawerConfiguracion({ ciclo, config, onGuardar, onCerrar }: { ciclo: Ciclo | null; config: ConfigCiclo | null; onGuardar: (config: ConfigCiclo) => void; onCerrar: () => void }) {
  if (!ciclo || !config) return null
  return <Formulario key={ciclo.id} ciclo={ciclo} inicial={config} onGuardar={onGuardar} onCerrar={onCerrar} />
}
