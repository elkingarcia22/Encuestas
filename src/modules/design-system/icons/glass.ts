// Los 50 iconos Glass (Iconly Pro, comunidad de Figma) exportados el 2026-09-14. Los PNG viven en
// public/iconos-glass/<categoría>/ en tres tamaños; catalogo.json y LEEME.md, en la misma carpeta,
// son la entrega para el equipo de flux-ui. Generado desde catalogo.json.

export type CategoriaGlass = 'acciones' | 'navegacion' | 'comunicacion' | 'archivos' | 'multimedia' | 'tiempo' | 'datos' | 'comercio' | 'favoritos' | 'cuenta-y-seguridad' | 'alertas'

export const CATEGORIAS_GLASS: { id: CategoriaGlass; nombre: string }[] = [
  { id: 'acciones', nombre: 'Acciones' },
  { id: 'navegacion', nombre: 'Navegación' },
  { id: 'comunicacion', nombre: 'Comunicación' },
  { id: 'archivos', nombre: 'Archivos' },
  { id: 'multimedia', nombre: 'Multimedia' },
  { id: 'tiempo', nombre: 'Tiempo y agenda' },
  { id: 'datos', nombre: 'Datos' },
  { id: 'comercio', nombre: 'Comercio' },
  { id: 'favoritos', nombre: 'Favoritos' },
  { id: 'cuenta-y-seguridad', nombre: 'Cuenta y seguridad' },
  { id: 'alertas', nombre: 'Alertas' },
]

export type IconoGlass = { nombre: string; nombreEs: string; categoria: CategoriaGlass; buscar: string[] }

export const ICONOS_GLASS: IconoGlass[] = [
  { nombre: 'glass-tick', nombreEs: 'Hecho', categoria: 'acciones', buscar: ['listo', 'completado', 'aprobado', 'check', 'terminado', 'finalizado'] },
  { nombre: 'glass-bookmark', nombreEs: 'Guardar', categoria: 'favoritos', buscar: ['marcador', 'guardado', 'favorito', 'ver después'] },
  { nombre: 'glass-heart', nombreEs: 'Me gusta', categoria: 'favoritos', buscar: ['corazón', 'favorito', 'bienestar', 'reconocimiento'] },
  { nombre: 'glass-chat', nombreEs: 'Chat', categoria: 'comunicacion', buscar: ['conversación', 'mensajes', 'orbit', 'suite ai', 'agente', 'comentarios'] },
  { nombre: 'glass-star', nombreEs: 'Estrella', categoria: 'favoritos', buscar: ['calificación', 'destacado', 'valoración', 'puntaje'] },
  { nombre: 'glass-arrow-right-circle', nombreEs: 'Flecha a la derecha', categoria: 'navegacion', buscar: ['siguiente', 'continuar', 'avanzar', 'ir'] },
  { nombre: 'glass-clock', nombreEs: 'Reloj', categoria: 'tiempo', buscar: ['hora', 'duración', 'pendiente', 'vence', 'historial'] },
  { nombre: 'glass-discovery', nombreEs: 'Explorar', categoria: 'navegacion', buscar: ['brújula', 'catálogo', 'descubrir', 'navegar'] },
  { nombre: 'glass-gallery', nombreEs: 'Galería', categoria: 'multimedia', buscar: ['imagen', 'foto', 'portada', 'ilustración'] },
  { nombre: 'glass-buy', nombreEs: 'Comprar', categoria: 'comercio', buscar: ['carrito', 'compra', 'licencias', 'tienda'] },
  { nombre: 'glass-play', nombreEs: 'Reproducir', categoria: 'multimedia', buscar: ['video', 'curso', 'empezar', 'iniciar', 'contenido'] },
  { nombre: 'glass-ticket-star', nombreEs: 'Insignia', categoria: 'favoritos', buscar: ['logro', 'certificado', 'premio', 'cupón', 'reconocimiento'] },
  { nombre: 'glass-bag', nombreEs: 'Bolsa', categoria: 'comercio', buscar: ['compras', 'pedido', 'paquete'] },
  { nombre: 'glass-discount', nombreEs: 'Descuento', categoria: 'comercio', buscar: ['oferta', 'promoción', 'porcentaje', 'cupón'] },
  { nombre: 'glass-game', nombreEs: 'Juego', categoria: 'multimedia', buscar: ['gamificación', 'reto', 'ludificación', 'control'] },
  { nombre: 'glass-notification', nombreEs: 'Notificación', categoria: 'comunicacion', buscar: ['campana', 'aviso', 'alerta', 'recordatorio'] },
  { nombre: 'glass-send', nombreEs: 'Enviar', categoria: 'comunicacion', buscar: ['avión de papel', 'compartir', 'publicar', 'mandar'] },
  { nombre: 'glass-filter', nombreEs: 'Filtrar', categoria: 'acciones', buscar: ['embudo', 'segmentar', 'refinar', 'ordenar'] },
  { nombre: 'glass-danger', nombreEs: 'Peligro', categoria: 'alertas', buscar: ['advertencia', 'riesgo', 'error', 'atención'] },
  { nombre: 'glass-video', nombreEs: 'Video', categoria: 'multimedia', buscar: ['cámara de video', 'grabación', 'clase', 'sesión'] },
  { nombre: 'glass-folder', nombreEs: 'Carpeta', categoria: 'archivos', buscar: ['colección', 'archivos', 'directorio', 'repositorio'] },
  { nombre: 'glass-lock', nombreEs: 'Candado', categoria: 'cuenta-y-seguridad', buscar: ['bloqueado', 'privado', 'seguridad', 'sin acceso'] },
  { nombre: 'glass-location', nombreEs: 'Ubicación', categoria: 'navegacion', buscar: ['mapa', 'sede', 'lugar', 'dirección', 'pin'] },
  { nombre: 'glass-edit', nombreEs: 'Editar', categoria: 'acciones', buscar: ['lápiz', 'modificar', 'escribir', 'cambiar'] },
  { nombre: 'glass-more-square', nombreEs: 'Más opciones', categoria: 'acciones', buscar: ['menú', 'puntos', 'acciones', 'cuadrado'] },
  { nombre: 'glass-graph', nombreEs: 'Gráfico circular', categoria: 'datos', buscar: ['torta', 'dona', 'proporción', 'métricas', 'reporte'] },
  { nombre: 'glass-setting', nombreEs: 'Configuración', categoria: 'cuenta-y-seguridad', buscar: ['ajustes', 'engranaje', 'preferencias', 'sistema'] },
  { nombre: 'glass-message', nombreEs: 'Mensaje', categoria: 'comunicacion', buscar: ['correo', 'email', 'sobre', 'bandeja'] },
  { nombre: 'glass-search', nombreEs: 'Buscar', categoria: 'acciones', buscar: ['lupa', 'encontrar', 'consultar', 'buscador'] },
  { nombre: 'glass-document', nombreEs: 'Documento', categoria: 'archivos', buscar: ['archivo', 'texto', 'reporte', 'política', 'contrato'] },
  { nombre: 'glass-bag-2', nombreEs: 'Bolsa (alternativa)', categoria: 'comercio', buscar: ['bolso', 'compras', 'maletín'] },
  { nombre: 'glass-calendar', nombreEs: 'Calendario', categoria: 'tiempo', buscar: ['fecha', 'agenda', 'evento', 'periodo', 'plazo'] },
  { nombre: 'glass-activity', nombreEs: 'Actividad', categoria: 'datos', buscar: ['tendencia', 'progreso', 'seguimiento', 'pulso'] },
  { nombre: 'glass-more-circle', nombreEs: 'Más opciones (círculo)', categoria: 'acciones', buscar: ['menú', 'puntos', 'acciones', 'círculo'] },
  { nombre: 'glass-info-circle', nombreEs: 'Información', categoria: 'alertas', buscar: ['aviso', 'ayuda', 'exclamación', 'nota'] },
  { nombre: 'glass-shield-done', nombreEs: 'Protegido', categoria: 'cuenta-y-seguridad', buscar: ['escudo', 'seguridad', 'verificado', 'cumplimiento'] },
  { nombre: 'glass-paper-plus', nombreEs: 'Nuevo documento', categoria: 'archivos', buscar: ['crear', 'agregar archivo', 'plantilla nueva'] },
  { nombre: 'glass-close-square', nombreEs: 'Cerrar', categoria: 'acciones', buscar: ['cancelar', 'quitar', 'eliminar', 'x'] },
  { nombre: 'glass-profile', nombreEs: 'Perfil', categoria: 'cuenta-y-seguridad', buscar: ['usuario', 'persona', 'colaborador', 'cuenta'] },
  { nombre: 'glass-paper', nombreEs: 'Hoja', categoria: 'archivos', buscar: ['página', 'nota', 'documento simple'] },
  { nombre: 'glass-password', nombreEs: 'Contraseña', categoria: 'cuenta-y-seguridad', buscar: ['llave', 'clave', 'acceso', 'credenciales'] },
  { nombre: 'glass-camera', nombreEs: 'Cámara', categoria: 'multimedia', buscar: ['foto', 'captura', 'fotografía'] },
  { nombre: 'glass-wallet', nombreEs: 'Billetera', categoria: 'comercio', buscar: ['pago', 'créditos', 'nómina', 'dinero', 'saldo'] },
  { nombre: 'glass-chart', nombreEs: 'Gráfico de barras', categoria: 'datos', buscar: ['barras', 'estadísticas', 'métricas', 'reporte', 'dashboard'] },
  { nombre: 'glass-volume', nombreEs: 'Volumen', categoria: 'multimedia', buscar: ['sonido', 'audio', 'altavoz', 'anuncio'] },
  { nombre: 'glass-home', nombreEs: 'Inicio', categoria: 'navegacion', buscar: ['casa', 'home', 'principal', 'workspace'] },
  { nombre: 'glass-info-square', nombreEs: 'Información (cuadrado)', categoria: 'alertas', buscar: ['aviso', 'ayuda', 'i', 'detalle'] },
  { nombre: 'glass-arrow-up-square', nombreEs: 'Flecha arriba', categoria: 'navegacion', buscar: ['subir', 'cargar', 'crecimiento', 'aumentar'] },
  { nombre: 'glass-add', nombreEs: 'Agregar', categoria: 'acciones', buscar: ['más', 'crear', 'nuevo', 'sumar'] },
  { nombre: 'glass-show', nombreEs: 'Ver', categoria: 'acciones', buscar: ['ojo', 'visible', 'vista previa', 'mostrar'] },
]

// Ruta pública de un icono en cada tamaño: @1x 144 px, @2x 288 px, @4x 576 px (lienzo cuadrado).
export const rutaGlass = (icono: Pick<IconoGlass, 'nombre' | 'categoria'>, escala: '1x' | '2x' | '4x' = '1x') =>
  `/iconos-glass/${icono.categoria}/${icono.nombre}@${escala}.png`
