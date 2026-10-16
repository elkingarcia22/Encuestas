// @ts-nocheck
// Evaluaciones 360 y sus participantes.
// Portado del catálogo del playground anterior; los datos no se editan a mano.

export const BD_EVALUACIONES_360 = {

  /* ─── 7 evaluaciones de ejemplo ───
   * activada: el usuario pulsó «Activar» en el flujo. Sin activada → siempre borrador en listado
   *           (aunque tenga fechas; si llega el inicio sin activar, sigue borrador).
   *           Con activada: por iniciar / en progreso / finalizada según fechas y estado.
   */
  evaluaciones: [
    {
      id: 'AXS007',
      nombre: 'Evaluación 360 People Excellence',
      fechaInicio: '2026-10-01',
      fechaFin: '2026-12-20',
      estado: 'borrador',
      activada: false,
      checks: { tipo: false, competencias: false, evaluados: false, resultados: false },
      /* Borrador: borrador en cabecera aunque haya tipos guardados; falta completar secciones */
      contenido360: {
        tipo: [
          /* Activos deben sumar 100 % */
          { id: 'autoevaluacion', activo: true, peso: 25 },
          { id: 'descendente', activo: true, peso: 75 },
          { id: 'paralela', activo: false, peso: 0 },
          { id: 'ascendente', activo: false, peso: 0 },
          { id: 'cliente', activo: false, peso: 0 }
        ],
        competencias: [],
        evaluados: {},
        resultados: null,
        guardado: true
      }
    },
    {
      id: 'AXS001',
      nombre: 'Evaluación 360 Liderazgo Q1 2025',
      fechaInicio: '2025-01-15',
      fechaFin: '2025-03-31',
      estado: 'finalizada',
      activada: true,
      checks: { tipo: true, competencias: true, evaluados: true, resultados: true }
    },
    {
      id: 'AXS002',
      nombre: 'Evaluación 360 Desempeño Comercial Q2 2026',
      fechaInicio: '2026-04-01',
      fechaFin: '2026-06-30',
      estado: 'activa',
      activada: true,
      checks: { tipo: true, competencias: true, evaluados: true, resultados: true },
      contenido360: {
        guardado: true,
        tipo: [
          { id: 'autoevaluacion', activo: true, peso: 10 },
          { id: 'descendente', activo: true, peso: 35 },
          { id: 'paralela', activo: true, peso: 25 },
          { id: 'ascendente', activo: true, peso: 15 },
          { id: 'cliente', activo: true, peso: 15 }
        ],
        competencias: [
          {
            id: 'comp-axs002-a',
            nombre: 'Orientación a resultados comerciales',
            descripcion: 'Cumplimiento de metas, seguimiento de oportunidades y calidad del relacionamiento con clientes.',
            enunciados: [
              { id: 'en-axs002-1', texto: 'Cumple o supera las metas de ventas y actividades comerciales acordadas.', tipoRespuesta: 'calificacion', escala: 'desempeno', obligatoria: false, tiposEvaluacion: ['descendente', 'paralela', 'cliente'] },
              { id: 'en-axs002-2', texto: 'Mantiene un pipeline visible y prioriza las oportunidades con mayor impacto.', tipoRespuesta: 'calificacion', escala: 'regularidad', obligatoria: false, tiposEvaluacion: ['autoevaluacion', 'ascendente'] },
              { id: 'en-axs002-3', texto: 'Describe un ejemplo reciente en el que coordinó con otra área para cerrar una venta o resolver una petición del cliente.', tipoRespuesta: 'abierta', escala: null, obligatoria: false, tiposEvaluacion: ['autoevaluacion', 'descendente', 'paralela', 'ascendente', 'cliente'] }
            ]
          },
          {
            id: 'comp-axs002-b',
            nombre: 'Coordinación con instalaciones y postventa',
            descripcion: 'Alianza con equipos de campo para cumplir promesas al cliente.',
            enunciados: [
              { id: 'en-axs002-4', texto: 'Traduce bien las necesidades del cliente a requerimientos claros para instalación o servicio.', tipoRespuesta: 'calificacion', escala: 'desempeno', obligatoria: false, tiposEvaluacion: ['descendente', 'cliente'] },
              { id: 'en-axs002-5', texto: 'Da seguimiento oportuno a incidencias después de la venta.', tipoRespuesta: 'calificacion', escala: 'desempeno', obligatoria: false, tiposEvaluacion: ['paralela', 'autoevaluacion'] },
              { id: 'en-axs002-6', texto: '¿Qué tan fluida es la comunicación con instalaciones o reparaciones cuando hay urgencia?', tipoRespuesta: 'abierta', escala: null, obligatoria: false, tiposEvaluacion: ['ascendente', 'cliente', 'paralela'] }
            ]
          }
        ],
        evaluados: {
          tipo: 'libre-asignaciones',
          personas: ['E002', 'E009', 'E010'],
          asignaciones: [{"evaluadoId":"E002","nombre":"Ricardo Ospina Duque","area":"Ventas","avatar":"https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop","evaluadores":[{"id":"E002","nombre":"Ricardo Ospina Duque","area":"Ventas","avatar":"https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop","tipo":"autoevaluacion","tipoNombre":"Autoevaluación"},{"id":"E001","nombre":"Patricia Elena Bermúdez Ríos","area":"Gerencia General","avatar":"https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=100&h=100&fit=crop","tipo":"descendente","tipoNombre":"Descendente"},{"id":"E009","nombre":"Carlos Andrés García López","area":"Ventas","avatar":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop","tipo":"ascendente","tipoNombre":"Ascendente"},{"id":"E010","nombre":"Laura Valentina Rodríguez Martínez","area":"Ventas","avatar":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop","tipo":"ascendente","tipoNombre":"Ascendente"},{"id":"E011","nombre":"Miguel Ángel Hernández Díaz","area":"Ventas","avatar":"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop","tipo":"paralela","tipoNombre":"Paralela"},{"id":"E023","nombre":"José Luis González Pérez","area":"Reparaciones","avatar":"https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=100&h=100&fit=crop","tipo":"cliente","tipoNombre":"Cliente interno"}]},{"evaluadoId":"E009","nombre":"Carlos Andrés García López","area":"Ventas","avatar":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop","evaluadores":[{"id":"E009","nombre":"Carlos Andrés García López","area":"Ventas","avatar":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop","tipo":"autoevaluacion","tipoNombre":"Autoevaluación"},{"id":"E002","nombre":"Ricardo Ospina Duque","area":"Ventas","avatar":"https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop","tipo":"descendente","tipoNombre":"Descendente"},{"id":"E010","nombre":"Laura Valentina Rodríguez Martínez","area":"Ventas","avatar":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop","tipo":"paralela","tipoNombre":"Paralela"},{"id":"E011","nombre":"Miguel Ángel Hernández Díaz","area":"Ventas","avatar":"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop","tipo":"paralela","tipoNombre":"Paralela"},{"id":"E015","nombre":"Juan David López González","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop","tipo":"cliente","tipoNombre":"Cliente interno"}]},{"evaluadoId":"E010","nombre":"Laura Valentina Rodríguez Martínez","area":"Ventas","avatar":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop","evaluadores":[{"id":"E010","nombre":"Laura Valentina Rodríguez Martínez","area":"Ventas","avatar":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop","tipo":"autoevaluacion","tipoNombre":"Autoevaluación"},{"id":"E002","nombre":"Ricardo Ospina Duque","area":"Ventas","avatar":"https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop","tipo":"descendente","tipoNombre":"Descendente"},{"id":"E009","nombre":"Carlos Andrés García López","area":"Ventas","avatar":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop","tipo":"paralela","tipoNombre":"Paralela"},{"id":"E012","nombre":"Natalia Sofía Torres Sánchez","area":"Ventas","avatar":"https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop","tipo":"paralela","tipoNombre":"Paralela"},{"id":"E015","nombre":"Juan David López González","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop","tipo":"cliente","tipoNombre":"Cliente interno"}]}]
        },
        resultados: {
          escala: '5',
          cantidad: 5,
          params: [
            { nombre: 'Por mejorar', desde: 1, hasta: 1.8 },
            { nombre: 'Aceptable', desde: 1.81, hasta: 2.6 },
            { nombre: 'Bueno', desde: 2.61, hasta: 3.4 },
            { nombre: 'Sobresaliente', desde: 3.41, hasta: 4.2 },
            { nombre: 'Excelente', desde: 4.21, hasta: 5 }
          ],
          permitirLideres: true,
          permitirNoSabe: false,
          asegurarAnonimato: true
        }
      }
    },
    {
      id: 'AXS003',
      nombre: 'Evaluación 360 Equipos Técnicos Q3 2026',
      fechaInicio: '2026-07-01',
      fechaFin: '2026-09-30',
      estado: 'borrador',
      activada: false,
      checks: { tipo: true, competencias: true, evaluados: false, resultados: false },
      contenido360: {
        guardado: true,
        tipo: [
          { id: 'autoevaluacion', activo: true, peso: 10 },
          { id: 'descendente', activo: true, peso: 35 },
          { id: 'paralela', activo: true, peso: 25 },
          { id: 'ascendente', activo: true, peso: 15 },
          { id: 'cliente', activo: true, peso: 15 }
        ],
        competencias: [
          {
            id: 'comp-axs003-a',
            nombre: 'Seguridad y calidad en campo',
            descripcion: 'Cumplimiento de protocolos en las instalaciones de la empresa.',
            enunciados: [
              { id: 'en-axs003-1', texto: 'Aplica normas de seguridad y uso correcto de EPP durante el servicio.', tipoRespuesta: 'calificacion', escala: 'desempeno', obligatoria: false, tiposEvaluacion: ['descendente', 'paralela'] },
              { id: 'en-axs003-2', texto: 'Entrega instalaciones limpias, revisadas y alineadas al estándar de la marca.', tipoRespuesta: 'calificacion', escala: 'desempeno', obligatoria: false, tiposEvaluacion: ['autoevaluacion', 'cliente'] },
              { id: 'en-axs003-3', texto: 'Comunica riesgos o desviaciones a su jefe sin demora.', tipoRespuesta: 'calificacion', escala: 'regularidad', obligatoria: false, tiposEvaluacion: ['ascendente', 'descendente'] }
            ]
          },
          {
            id: 'comp-axs003-b',
            nombre: 'Coordinación con ventas y cliente',
            descripcion: 'Puentes entre promesa comercial y ejecución en sitio.',
            enunciados: [
              { id: 'en-axs003-4', texto: 'Aclara dudas del cliente sobre tiempos y alcance de la instalación.', tipoRespuesta: 'calificacion', escala: 'desempeno', obligatoria: false, tiposEvaluacion: ['cliente', 'paralela'] },
              { id: 'en-axs003-5', texto: 'Retroalimenta a ventas cuando hay diferencias entre lo vendido y lo ejecutable.', tipoRespuesta: 'abierta', escala: null, obligatoria: false, tiposEvaluacion: ['paralela', 'descendente', 'cliente'] },
              { id: 'en-axs003-6', texto: '¿Cómo valora la claridad de la información que recibe antes de ir a campo?', tipoRespuesta: 'abierta', escala: null, obligatoria: false, tiposEvaluacion: ['autoevaluacion', 'ascendente'] }
            ]
          }
        ],
        evaluados: {
          tipo: 'libre-asignaciones',
          personas: ['E015', 'E016', 'E017'],
          asignaciones: [{"evaluadoId":"E015","nombre":"Juan David López González","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop","evaluadores":[{"id":"E015","nombre":"Juan David López González","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop","tipo":"autoevaluacion","tipoNombre":"Autoevaluación"},{"id":"E003","nombre":"Fernando Castro Restrepo","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop","tipo":"descendente","tipoNombre":"Descendente"},{"id":"E016","nombre":"Diego Alejandro Martínez Romero","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop","tipo":"paralela","tipoNombre":"Paralela"},{"id":"E017","nombre":"Camilo Ernesto Sánchez Vargas","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1583195764036-6dc248ac07d9?w=100&h=100&fit=crop","tipo":"paralela","tipoNombre":"Paralela"},{"id":"E009","nombre":"Carlos Andrés García López","area":"Ventas","avatar":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop","tipo":"cliente","tipoNombre":"Cliente interno"}]},{"evaluadoId":"E016","nombre":"Diego Alejandro Martínez Romero","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop","evaluadores":[{"id":"E016","nombre":"Diego Alejandro Martínez Romero","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop","tipo":"autoevaluacion","tipoNombre":"Autoevaluación"},{"id":"E003","nombre":"Fernando Castro Restrepo","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop","tipo":"descendente","tipoNombre":"Descendente"},{"id":"E015","nombre":"Juan David López González","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop","tipo":"paralela","tipoNombre":"Paralela"},{"id":"E018","nombre":"Andrés Felipe Ruiz Mendoza","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=100&h=100&fit=crop","tipo":"paralela","tipoNombre":"Paralela"},{"id":"E010","nombre":"Laura Valentina Rodríguez Martínez","area":"Ventas","avatar":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop","tipo":"cliente","tipoNombre":"Cliente interno"}]},{"evaluadoId":"E017","nombre":"Camilo Ernesto Sánchez Vargas","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1583195764036-6dc248ac07d9?w=100&h=100&fit=crop","evaluadores":[{"id":"E017","nombre":"Camilo Ernesto Sánchez Vargas","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1583195764036-6dc248ac07d9?w=100&h=100&fit=crop","tipo":"autoevaluacion","tipoNombre":"Autoevaluación"},{"id":"E003","nombre":"Fernando Castro Restrepo","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop","tipo":"descendente","tipoNombre":"Descendente"},{"id":"E015","nombre":"Juan David López González","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop","tipo":"ascendente","tipoNombre":"Ascendente"},{"id":"E016","nombre":"Diego Alejandro Martínez Romero","area":"Instalaciones","avatar":"https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop","tipo":"paralela","tipoNombre":"Paralela"},{"id":"E023","nombre":"José Luis González Pérez","area":"Reparaciones","avatar":"https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=100&h=100&fit=crop","tipo":"cliente","tipoNombre":"Cliente interno"}]}]
        },
        resultados: null
      }
    },
    {
      id: 'AXS004',
      nombre: 'Evaluación 360 Gerencia y Directores Q2 2026',
      fechaInicio: '2026-04-10',
      fechaFin: '2026-08-15',
      estado: 'activa',
      activada: true,
      checks: { tipo: true, competencias: true, evaluados: true, resultados: true }
    },
    {
      id: 'AXS005',
      nombre: 'Evaluación 360 Cultura Organizacional 2025',
      fechaInicio: '2025-09-01',
      fechaFin: '2025-12-31',
      estado: 'finalizada',
      activada: true,
      checks: { tipo: true, competencias: true, evaluados: true, resultados: true }
    },
    {
      id: 'AXS006',
      nombre: 'Evaluación 360 Talento digital Q1 2027',
      fechaInicio: '2027-01-10',
      fechaFin: '2027-03-31',
      estado: 'activa',
      activada: true,
      checks: { tipo: true, competencias: true, evaluados: true, resultados: true },
      contenido360: {
        guardado: true,
        tipo: [
          { id: 'autoevaluacion', activo: true, peso: 10 },
          { id: 'descendente', activo: true, peso: 35 },
          { id: 'paralela', activo: true, peso: 25 },
          { id: 'ascendente', activo: true, peso: 15 },
          { id: 'cliente', activo: true, peso: 15 }
        ],
        competencias: [
          {
            id: 'comp-axs006-a',
            nombre: 'Contenido y conversión digital',
            descripcion: 'Calidad de piezas y alineación con la voz de marca de la empresa.',
            enunciados: [
              { id: 'en-axs006-1', texto: 'Produce contenidos claros que apoyan objetivos de embudo (awareness, consideración, conversión).', tipoRespuesta: 'calificacion', escala: 'desempeno', obligatoria: false, tiposEvaluacion: ['descendente', 'paralela'] },
              { id: 'en-axs006-2', texto: 'Respeta tiempos de entrega y versiones acordadas con diseño o dirección.', tipoRespuesta: 'calificacion', escala: 'regularidad', obligatoria: false, tiposEvaluacion: ['autoevaluacion', 'ascendente'] },
              { id: 'en-axs006-3', texto: 'Cita un ejemplo en el que el contenido digital impactó un resultado medible.', tipoRespuesta: 'abierta', escala: null, obligatoria: false, tiposEvaluacion: ['autoevaluacion', 'descendente', 'cliente'] }
            ]
          },
          {
            id: 'comp-axs006-b',
            nombre: 'Colaboración con RRHH y ventas',
            descripcion: 'Sinergia con People Excellence y equipos comerciales.',
            enunciados: [
              { id: 'en-axs006-4', texto: 'Acompaña campañas internas o comerciales sin fricción operativa.', tipoRespuesta: 'calificacion', escala: 'desempeno', obligatoria: false, tiposEvaluacion: ['cliente', 'paralela'] },
              { id: 'en-axs006-5', texto: '¿Qué tan proactivo es al pedir contexto a RRHH o ventas antes de publicar?', tipoRespuesta: 'abierta', escala: null, obligatoria: false, tiposEvaluacion: ['ascendente', 'paralela'] },
              { id: 'en-axs006-6', texto: 'Usa datos de desempeño o engagement para ajustar mensajes o formatos.', tipoRespuesta: 'calificacion', escala: 'desempeno', obligatoria: false, tiposEvaluacion: ['descendente', 'cliente'] }
            ]
          }
        ],
        evaluados: {
          tipo: 'libre-asignaciones',
          personas: ['E048', 'E047', 'E051'],
          asignaciones: [{"evaluadoId":"E048","nombre":"David Santiago Gutiérrez Ossa","area":"Marketing","avatar":null,"evaluadores":[{"id":"E048","nombre":"David Santiago Gutiérrez Ossa","area":"Marketing","avatar":null,"tipo":"autoevaluacion","tipoNombre":"Autoevaluación"},{"id":"E008","nombre":"Alejandro Moreno Ruiz","area":"Marketing","avatar":"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop","tipo":"descendente","tipoNombre":"Descendente"},{"id":"E047","nombre":"Alejandra María Saldarriaga Tobón","area":"Marketing","avatar":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop","tipo":"paralela","tipoNombre":"Paralela"},{"id":"E049","nombre":"Sara Valentina Castaño Sierra","area":"Marketing","avatar":"https://images.unsplash.com/photo-1508243771214-6e95d137426b?w=100&h=100&fit=crop","tipo":"paralela","tipoNombre":"Paralela"},{"id":"E054","nombre":"Adriana Lucía Ríos Calle","area":"Recursos Humanos","avatar":"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop","tipo":"cliente","tipoNombre":"Cliente interno"}]},{"evaluadoId":"E047","nombre":"Alejandra María Saldarriaga Tobón","area":"Marketing","avatar":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop","evaluadores":[{"id":"E047","nombre":"Alejandra María Saldarriaga Tobón","area":"Marketing","avatar":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop","tipo":"autoevaluacion","tipoNombre":"Autoevaluación"},{"id":"E008","nombre":"Alejandro Moreno Ruiz","area":"Marketing","avatar":"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop","tipo":"descendente","tipoNombre":"Descendente"},{"id":"E050","nombre":"Mateo José Gómez Cardona","area":"Marketing","avatar":"https://images.unsplash.com/photo-1601412436009-d964bd02edbc?w=100&h=100&fit=crop","tipo":"paralela","tipoNombre":"Paralela"},{"id":"E051","nombre":"María José Aristizábal Correa","area":"Marketing","avatar":"https://images.unsplash.com/photo-1524504388940-b8d87734a5a2?w=100&h=100&fit=crop","tipo":"paralela","tipoNombre":"Paralela"},{"id":"E054","nombre":"Adriana Lucía Ríos Calle","area":"Recursos Humanos","avatar":"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop","tipo":"cliente","tipoNombre":"Cliente interno"}]},{"evaluadoId":"E051","nombre":"María José Aristizábal Correa","area":"Marketing","avatar":"https://images.unsplash.com/photo-1524504388940-b8d87734a5a2?w=100&h=100&fit=crop","evaluadores":[{"id":"E051","nombre":"María José Aristizábal Correa","area":"Marketing","avatar":"https://images.unsplash.com/photo-1524504388940-b8d87734a5a2?w=100&h=100&fit=crop","tipo":"autoevaluacion","tipoNombre":"Autoevaluación"},{"id":"E008","nombre":"Alejandro Moreno Ruiz","area":"Marketing","avatar":"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop","tipo":"descendente","tipoNombre":"Descendente"},{"id":"E048","nombre":"David Santiago Gutiérrez Ossa","area":"Marketing","avatar":null,"tipo":"paralela","tipoNombre":"Paralela"},{"id":"E049","nombre":"Sara Valentina Castaño Sierra","area":"Marketing","avatar":"https://images.unsplash.com/photo-1508243771214-6e95d137426b?w=100&h=100&fit=crop","tipo":"paralela","tipoNombre":"Paralela"},{"id":"E010","nombre":"Laura Valentina Rodríguez Martínez","area":"Ventas","avatar":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop","tipo":"cliente","tipoNombre":"Cliente interno"}]}]
        },
        resultados: {
          escala: '5',
          cantidad: 5,
          params: [
            { nombre: 'Por mejorar', desde: 1, hasta: 1.8 },
            { nombre: 'Aceptable', desde: 1.81, hasta: 2.6 },
            { nombre: 'Bueno', desde: 2.61, hasta: 3.4 },
            { nombre: 'Sobresaliente', desde: 3.41, hasta: 4.2 },
            { nombre: 'Excelente', desde: 4.21, hasta: 5 }
          ],
          permitirLideres: true,
          permitirNoSabe: true,
          asegurarAnonimato: true
        }
      }
    }
  ],

  /* ─── Tipos de evaluación disponibles ─── */
  tiposEvaluacion: [
    { id: 'autoevaluacion', nombre: 'Autoevaluación',  descripcion: 'El colaborador se evalúa a sí mismo.',                                                          pesoSugerido: 10 },
    { id: 'descendente',   nombre: 'Descendente',     descripcion: 'Supervisor evalúa al subordinado.',                                                              pesoSugerido: 40 },
    { id: 'paralela',      nombre: 'Paralela',        descripcion: 'Colaborador evalúa a sus colegas (pares).',                                                      pesoSugerido: 20 },
    { id: 'ascendente',    nombre: 'Ascendente',      descripcion: 'Colaborador evalúa al supervisor.',                                                              pesoSugerido: 20 },
    { id: 'cliente',     nombre: 'Cliente interno',  descripcion: 'Se evalúan usuarios específicos que no tienen relación directa en el organigrama.',              pesoSugerido: 10 }
  ],

  /* ─── 8 competencias base con 3 enunciados c/u ─── */
  competenciasBase: [
    {
      id: 'COMP01', nombre: 'Liderazgo',
      enunciados: [
        'Inspira y motiva a su equipo hacia el logro de objetivos.',
        'Toma decisiones asertivas en situaciones de presión.',
        'Comunica la visión y dirección del equipo con claridad.'
      ]
    },
    {
      id: 'COMP02', nombre: 'Comunicación',
      enunciados: [
        'Expresa sus ideas de forma clara y concisa.',
        'Escucha activamente y muestra interés por las opiniones del equipo.',
        'Adapta su comunicación según el interlocutor y el contexto.'
      ]
    },
    {
      id: 'COMP03', nombre: 'Trabajo en equipo',
      enunciados: [
        'Colabora activamente con otros para alcanzar metas comunes.',
        'Comparte información relevante con su equipo oportunamente.',
        'Valora y respeta la diversidad de perspectivas en el equipo.'
      ]
    },
    {
      id: 'COMP04', nombre: 'Gestión del cambio',
      enunciados: [
        'Se adapta con disposición a nuevas situaciones y entornos.',
        'Impulsa iniciativas de mejora dentro de su área.',
        'Apoya a otros durante los procesos de transformación organizacional.'
      ]
    },
    {
      id: 'COMP05', nombre: 'Resolución de problemas',
      enunciados: [
        'Identifica causas raíz de los problemas antes de actuar.',
        'Propone soluciones viables y evalúa sus consecuencias.',
        'Actúa con rapidez y efectividad frente a situaciones inesperadas.'
      ]
    },
    {
      id: 'COMP06', nombre: 'Gestión de proyectos',
      enunciados: [
        'Planifica y organiza sus actividades para cumplir plazos.',
        'Hace seguimiento al avance de las tareas asignadas.',
        'Gestiona recursos y prioridades con eficiencia.'
      ]
    },
    {
      id: 'COMP07', nombre: 'Innovación',
      enunciados: [
        'Genera ideas creativas para mejorar procesos o resultados.',
        'Experimenta con nuevas formas de abordar los retos.',
        'Promueve una cultura de mejora continua en su entorno.'
      ]
    },
    {
      id: 'COMP08', nombre: 'Experiencia del cliente',
      enunciados: [
        'Anticipa las necesidades del cliente y actúa en consecuencia.',
        'Genera soluciones oportunas ante inconformidades del cliente.',
        'Mide y reflexiona sobre la satisfacción del cliente en su trabajo.'
      ]
    }
  ],

  /* ─── Participantes de evaluaciones mock ─── */
  /* Se referencian a los ids de BD_MASTER_COLABORADORES */
  participantesMock: {
    /* Coherentes con contenido360.evaluados.personas */
    'AXS002': ['E002', 'E009', 'E010'],
    'AXS003': ['E015', 'E016', 'E017'],
    'AXS006': ['E048', 'E047', 'E051'],
    'AXS007': ['E053', 'E054', 'E055']
  },

  /* ─── API de acceso ─── */
  getEvaluaciones: function () {
    return this.evaluaciones;
  },
  getEvaluacionById: function (id) {
    return this.evaluaciones.find(function (e) { return e.id === id; });
  },
  addEvaluacion: function (evaluacion) {
    evaluacion.id = 'AXS' + String(Date.now()).slice(-6);
    if (evaluacion.estado == null || evaluacion.estado === '') {
      evaluacion.estado = 'activa';
    }
    if (typeof evaluacion.activada !== 'boolean') {
      evaluacion.activada = true;
    }
    this.evaluaciones.unshift(evaluacion);
    return evaluacion;
  },
  deleteEvaluacion: function (id) {
    this.evaluaciones = this.evaluaciones.filter(function (e) { return e.id !== id; });
  },

  /** Actualización superficial (mock). Sobrescribe claves de primer nivel en la evaluación. */
  updateEvaluacion: function (id, patch) {
    var ev = this.getEvaluacionById(id);
    if (!ev || !patch) return null;
    Object.keys(patch).forEach(function (k) {
      ev[k] = patch[k];
    });
    return ev;
  },

  /**
   * Para filas mock sin `contenido360` pero con checks completos (legacy).
   * Clon profundo del snapshot de AXS006 (no muta el original).
   */
  cloneContenido360EjemploCompleto: function () {
    var src = this.getEvaluacionById('AXS006');
    if (!src || !src.contenido360) return null;
    return JSON.parse(JSON.stringify(src.contenido360));
  }
};
