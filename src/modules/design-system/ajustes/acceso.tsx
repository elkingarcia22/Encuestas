import { Button, Field, FieldLabel, Input } from '@ubits/flux-ui'
import type { Ajuste } from './main'
import { ConNota } from './demos'
import { SIN_FONDO_AUTOCOMPLETADO } from '../templates/auth/components/autocompletado'
import { CursorDeshabilitado } from '../templates/auth/components/cursor-deshabilitado'

// Ajustes propios del inicio de sesión (PR #26 de Carlos, 6 y 7-oct). Cristian (7-oct): «lo que hizo Carlos es
// correcto»; el botón de «¿Olvidaste tu contraseña?» se queda como él lo dejó. Lo que se fuerza queda aquí, cada uno
// con su ficha, y lo que le toca a la librería o a ingeniería va marcado como pedido.

const AUTH = 'src/modules/design-system/templates/auth/components'

function Campo({ id, className, inputClassName }: { id: string; className?: string; inputClassName?: string }) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>Correo o usuario</FieldLabel>
      <Input id={id} placeholder="nombre@empresa.com" className={inputClassName} autoComplete="username" />
    </Field>
  )
}

export const AJUSTES_ACCESO: Ajuste[] = [
  {
    id: 'acceso-olvidaste',
    titulo: '«¿Olvidaste tu contraseña?» del login',
    estado: 'variante',
    resumen: 'Junto a la etiqueta «Contraseña», un botón fantasma pequeño con el texto del color de siempre, no el enlace azul.',
    piezas: [{ nombre: 'Button', slug: 'button' }],
    libreria: (
      <Button type="button" variant="link" size="xs">
        ¿Olvidaste tu contraseña?
      </Button>
    ),
    ubits: (
      <Button type="button" variant="ghost" size="xs">
        ¿Olvidaste tu contraseña?
      </Button>
    ),
    cambia: ['Variante fantasma en vez de enlace: sin azul ni subrayado', 'Tamaño xs, en la misma fila de la etiqueta y sin agrandarla'],
    porque: 'Calca login.ubitslearning.com, donde la acción va discreta para no competir con «Iniciar sesión». Decisión de Cristian (7-oct) sobre el PR de Carlos.',
    donde: [`${AUTH}/login-form.tsx`, 'Inicio de sesión (/design-system/templates/auth)'],
    usar: 'Solo en el login, junto a la etiqueta de la contraseña.',
    evitar: 'Llevarlo a otras pantallas: fuera del acceso, una acción que lleva a otra página es el enlace del sistema (Button variant="link").',
  },
  {
    id: 'acceso-etiqueta',
    titulo: 'Etiqueta a 10 px del campo en el login',
    estado: 'variante',
    resumen: 'En los campos del acceso la etiqueta queda a 10 px de la caja; el tema deja 12.',
    piezas: [
      { nombre: 'Field', slug: 'field' },
      { nombre: 'Input', slug: 'input' },
    ],
    libreria: <Campo id="ajuste-acceso-etiqueta-lib" />,
    ubits: <Campo id="ajuste-acceso-etiqueta-ubits" className="gap-2.5!" />,
    cambia: ['Separación entre etiqueta y campo de 12 a 10 px', 'Con «!»: sin él no le gana al tema'],
    porque: 'La columna del login es angosta (360 px) y calca la referencia de producción, que junta un poco más la etiqueta.',
    donde: [`${AUTH}/login-form.tsx` + ' (correo y contraseña)'],
    usar: 'Solo en el formulario de entrada del login.',
    evitar: 'Copiarlo en otros formularios: fuera del login, cada Field usa el espacio que trae la librería.',
  },
  {
    id: 'acceso-autocompletado',
    titulo: 'Campos sin el fondo azul del autocompletado',
    estado: 'pedido',
    resumen: 'Cuando el navegador rellena el correo o la contraseña, el campo conserva el fondo del tema en vez de pintarse de azul.',
    piezas: [{ nombre: 'Input', slug: 'input' }],
    hechoAMano: 'Una transición del fondo que dura «para siempre» en :autofill (autocompletado.ts), con «!» porque el tema le pone su propia transición al campo.',
    libreria: (
      <ConNota nota="Autocompleta con Chrome para verlo: se pinta de azul.">
        <Campo id="ajuste-acceso-auto-lib" />
      </ConNota>
    ),
    ubits: (
      <ConNota nota="Con el ajuste conserva el fondo del tema, en claro y en oscuro.">
        <Campo id="ajuste-acceso-auto-ubits" inputClassName={SIN_FONDO_AUTOCOMPLETADO} />
      </ConNota>
    ),
    cambia: ['Sin fondo azul al autocompletar', 'Mismo campo en claro y en oscuro'],
    porque: 'El azul de Chrome rompe el tema justo en la primera pantalla que ve la persona.',
    donde: [`${AUTH}/autocompletado.ts`, `${AUTH}/login-form.tsx`, `${AUTH}/organization-form.tsx`, `${AUTH}/forgot-password-form.tsx`],
    usar: 'Pedir a ingeniería la regla global en src/index.css; cuando exista, se borra autocompletado.ts.',
    evitar: 'Copiar la clase campo por campo en otras pantallas mientras tanto.',
  },
  {
    id: 'acceso-cursor-deshabilitado',
    titulo: 'Cursor «no permitido» en el botón apagado',
    estado: 'pedido',
    resumen: 'Al pasar por encima de «Iniciar sesión» apagado, el cursor dice que no se puede pulsar.',
    piezas: [{ nombre: 'Button', slug: 'button' }],
    hechoAMano: 'Un envoltorio (CursorDeshabilitado) pone el cursor: el botón apagado de la librería no recibe el puntero y el cursor no cambia.',
    libreria: (
      <ConNota nota="Pasa el cursor: no cambia.">
        <Button disabled>Iniciar sesión</Button>
      </ConNota>
    ),
    ubits: (
      <ConNota nota="Pasa el cursor: «no permitido».">
        <CursorDeshabilitado disabled>
          <Button disabled>Iniciar sesión</Button>
        </CursorDeshabilitado>
      </ConNota>
    ),
    cambia: ['Cursor «no permitido» sobre el botón apagado', 'El botón sigue sin reaccionar al pasar por encima'],
    porque: 'Sin el cursor, el botón apagado parece roto. Ya está pedido a la librería en Diferencias (botón deshabilitado sin cursor ni motivo).',
    donde: [`${AUTH}/cursor-deshabilitado.tsx`, `${AUTH}/login-form.tsx`, `${AUTH}/organization-form.tsx`, `${AUTH}/forgot-password-form.tsx`, `${AUTH}/blocked-account-panel.tsx`],
    usar: 'En el acceso, mientras la librería no lo traiga en su botón.',
    evitar: 'Envolver botones en otras pantallas: se espera a que la librería lo resuelva para todos.',
  },
]
