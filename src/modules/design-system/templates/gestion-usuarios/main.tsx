import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { notify } from '@/shared/components/notify'

import { useTemporizadores } from '../../estados/temporizadores'
import { MarcoAdmin } from '../admin-compartido/marco-admin'
import { MASIVAS, USUARIOS_INICIALES, aplicarMasivo, migasDe, type AccionMasiva } from './components/datos'
import { GestionContexto, type ProcesoMasivo } from './components/estado'

// Template «Gestión de usuarios» (Configuración del menú de empresa). Calca /admin-hr/users con
// los patrones del design system: tabla con filtros y acciones, vacío, formulario con validación,
// carga masiva por archivo, confirmaciones y avisos. Cada pantalla es una ruta hija.

export function Component() {
  const { pathname } = useLocation()
  const despues = useTemporizadores()
  const [usuarios, setUsuarios] = useState(USUARIOS_INICIALES)
  const [recordatorioEnviado, setRecordatorioEnviado] = useState<number | null>(null)
  const [masivo, setMasivo] = useState<ProcesoMasivo | null>(null)

  // La acción masiva corre aquí, en el layout: sigue aunque se navegue entre pantallas del
  // template, y al terminar avisa y deja los cambios en la lista.
  const iniciarMasivo = (accion: AccionMasiva, filas: Record<string, string>[], omitidas: number) => {
    const total = filas.length
    setMasivo({ accion, total, hechos: 0, omitidas, estado: 'corriendo' })
    ;[0.15, 0.35, 0.55, 0.75, 0.9].forEach((t, i) =>
      despues(() => setMasivo((m) => (m ? { ...m, hechos: Math.round(total * t) } : m)), 1100 * (i + 1)),
    )
    despues(() => {
      setUsuarios((todos) => aplicarMasivo(accion, filas, todos))
      setMasivo((m) => (m ? { ...m, hechos: total, estado: 'listo' } : m))
      notify('Carga masiva terminada', `${MASIVAS[accion].hecho(total)}. También te enviamos el resultado por correo.`, 'success')
    }, 6600)
  }

  // Crear o editar un usuario y la carga masiva son formulario y pasos: van a 720 px, como Navegación › Pasos.
  const formulario = /\/(crear|editar|carga-masiva)(\/|$)/.test(pathname)

  return (
    <MarcoAdmin migas={migasDe(pathname)} ancho={formulario ? 'narrow' : 'default'}>
      <GestionContexto.Provider
        value={{ usuarios, setUsuarios, recordatorioEnviado, setRecordatorioEnviado, masivo, iniciarMasivo, cerrarMasivo: () => setMasivo(null) }}
      >
        <Outlet />
      </GestionContexto.Provider>
    </MarcoAdmin>
  )
}

Component.displayName = 'DesignSystemTemplateGestionUsuarios'
