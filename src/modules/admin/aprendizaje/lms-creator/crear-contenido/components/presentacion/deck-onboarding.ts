// Cuatro presentaciones curadas (Onboarding comercial de 30 días), una por estilo: Equilibrado, Muy visual,
// Interactivo y Evaluativo. Es el mismo contenido del prototipo de referencia (copy e imágenes del pack de
// fotografía); aquí vive como datos de la maqueta. Si la estructura coincide con un estilo, el borrador sale de aquí.

import type { DatosDiapositiva, EstiloId } from './datos'

export type DeckCurado = { estilo: EstiloId; etiqueta: string; descripcion: string; diapositivas: DatosDiapositiva[] }

export const TEMA_ONBOARDING = "Onboarding comercial de 30 días para un vendedor"

export const DECKS_ONBOARDING: DeckCurado[] = [
  {
    "estilo": "equilibrado",
    "etiqueta": "Equilibrado",
    "descripcion": "Texto, visual e interacción a partes iguales",
    "diapositivas": [
      {
        "type": "intro",
        "icon": "fa-briefcase",
        "tagLabel": "Onboarding comercial",
        "title": "Tus primeros treinta días",
        "subtitle": "Onboarding comercial",
        "body": "De conocer la empresa a cerrar tus primeras oportunidades con autonomía.",
        "badgeTitle": "Treinta días",
        "badgeSubtitle": "Cuatro semanas, cuatro objetivos",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-01.png",
        "imagePosition": "right"
      },
      {
        "type": "content",
        "icon": "fa-compass",
        "tagLabel": "Semana uno",
        "title": "Qué debes entender primero",
        "body": "El contexto antes que el discurso. Sin esto, cualquier pitch suena a folleto.",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-04.png",
        "imagePosition": "right",
        "bullets": [
          "Qué problema resuelve el producto y qué cuesta no resolverlo",
          "Quién nos compra hoy y por qué nos eligió frente a otros",
          "Dónde gana y dónde pierde cada competidor",
          "Cómo se registra el trabajo comercial en el CRM"
        ]
      },
      {
        "type": "steps",
        "icon": "fa-clipboard-check",
        "tagLabel": "Discurso",
        "title": "Tu propuesta de valor en tres frases",
        "bullets": [
          "Qué problema atacas: el dolor concreto que hoy le cuesta al cliente",
          "Cómo lo resuelves: el mecanismo, en lenguaje de negocio y no de producto",
          "Qué resultado obtiene: una cifra o un cambio medible, no un adjetivo"
        ],
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-12.png",
        "imagePosition": "left"
      },
      {
        "type": "split",
        "icon": "fa-users",
        "tagLabel": "En contexto",
        "title": "Los casos de éxito son tu munición",
        "body": "Son la prueba de que la promesa se cumple y la fuente de los datos que vas a usar en cada conversación. Estudia la cifra que resume cada caso, no la historia completa.",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-05.png",
        "imagePosition": "left"
      },
      {
        "type": "one_column",
        "icon": "fa-align-left",
        "tagLabel": "Profundización",
        "title": "El uno a uno es tu mejor herramienta",
        "body": "Llega con preguntas concretas y con tu pipeline abierto. No es una reunión de reporte: es la única hora de la semana en la que alguien con más recorrido revisa tus oportunidades contigo.",
        "quoteHighlight": "Llegar sin preguntas convierte el uno a uno en un informe de estado, que es justo lo que menos te sirve.",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-28.png",
        "imagePosition": "top"
      },
      {
        "type": "two_columns",
        "icon": "fa-table-columns",
        "tagLabel": "Comparativa",
        "title": "Cómo estudiar el producto",
        "body": "Dos formas de prepararte, dos resultados distintos en la primera reunión.",
        "col1Title": "Memorizar funcionalidades",
        "col1Body": "Recitas una lista que el cliente ya vio en la web. La conversación se queda en la demostración y no conecta con su situación.",
        "col2Title": "Entender el problema",
        "col2Body": "Sabes qué le cuesta al cliente no resolverlo. Eliges qué mostrar y qué callar según lo que él necesita hoy."
      },
      {
        "type": "section",
        "icon": "fa-bookmark",
        "tagLabel": "Módulo 03",
        "number": "03",
        "subtitle": "Semana tres",
        "title": "Práctica real",
        "body": "Sales a prospectar acompañado y empiezas a construir tu propio pipeline desde cero.",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-18.png",
        "imagePosition": "background"
      },
      {
        "type": "main_point",
        "icon": "fa-bullseye",
        "tagLabel": "Idea clave",
        "title": "Quien más escucha es quien mejor califica",
        "subtitle": "Descubrimiento",
        "body": "Preguntas abiertas primero, silencio después. La pausa incómoda es donde aparece la información que realmente define si hay oportunidad.",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-13.png",
        "imagePosition": "left"
      },
      {
        "type": "keypoint",
        "icon": "fa-chart-line",
        "tagLabel": "Meta de la semana tres",
        "title": "Tu lista de cuentas objetivo",
        "stat": "50",
        "statement": "empresas que cumplen el perfil ideal, con el contacto correcto identificado",
        "desc": "No es una lista para llenar un archivo: es el punto de partida de cada conversación del resto del año.",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-19.png",
        "imagePosition": "right"
      },
      {
        "type": "accordion",
        "icon": "fa-layer-group",
        "tagLabel": "Profundiza",
        "title": "Las objeciones más frecuentes",
        "items": [
          {
            "title": "Es muy caro",
            "body": "No defiendas el precio: cuantifica el costo de no resolver el problema. Una cifra del caso de éxito cierra la discusión más rápido que cinco minutos de argumentos."
          },
          {
            "title": "La implementación toma mucho tiempo",
            "body": "Trae el cronograma real y un caso comparable. La objeción casi nunca es el tiempo: es el miedo a que el proyecto se atasque."
          },
          {
            "title": "Estamos viendo otra opción",
            "body": "Pregunta qué le gustó de la alternativa antes de diferenciarte. Vas a aprender más de esa respuesta que de cualquier tabla comparativa."
          }
        ]
      },
      {
        "type": "quiz_mc",
        "icon": "fa-circle-question",
        "tagLabel": "Autoevaluación",
        "title": "Chequeo de calificación",
        "questions": [
          {
            "question": "Un contacto muestra interés real y tiene el problema que resolvemos, pero no hay presupuesto asignado ni fecha. ¿Qué es?",
            "options": [
              "Una oportunidad que hay que meter al pipeline",
              "Una conversación agradable que todavía no califica",
              "Una oportunidad perdida que conviene descartar"
            ],
            "correctIndex": 1
          },
          {
            "question": "¿Cuándo debes registrar una reunión en el CRM?",
            "options": [
              "El mismo día en que ocurre",
              "Al cierre de la semana, junto con las demás",
              "Solo si la oportunidad avanzó de etapa"
            ],
            "correctIndex": 0
          }
        ]
      },
      {
        "type": "summary",
        "icon": "fa-flag-checkered",
        "tagLabel": "Cierre",
        "title": "Lo que se evalúa el día treinta",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-29.png",
        "imagePosition": "right",
        "bullets": [
          "Producto: entiendes el problema, no solo las funcionalidades",
          "Discurso: propuesta de valor en tres frases y objeciones preparadas",
          "Prospección: lista de cuentas construida y canales activos",
          "Disciplina: pipeline registrado el mismo día, siempre"
        ]
      }
    ]
  },
  {
    "estilo": "muy-visual",
    "etiqueta": "Muy visual",
    "descripcion": "Prioriza imágenes, diagramas y datos clave",
    "diapositivas": [
      {
        "type": "intro",
        "icon": "fa-briefcase",
        "tagLabel": "Onboarding comercial",
        "title": "Tus primeros treinta días",
        "subtitle": "Onboarding comercial",
        "body": "De conocer la empresa a cerrar tus primeras oportunidades con autonomía.",
        "badgeTitle": "Treinta días",
        "badgeSubtitle": "Cuatro semanas, cuatro objetivos",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-01.png",
        "imagePosition": "right"
      },
      {
        "type": "split",
        "icon": "fa-handshake",
        "tagLabel": "Día uno",
        "title": "Empiezas por entender, no por vender",
        "body": "La semana uno no tiene cuota. Tiene una sola tarea: entender qué vendemos, a quién y por qué nos eligen frente a otros.",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-03.png",
        "imagePosition": "left"
      },
      {
        "type": "caption",
        "icon": "fa-image-portrait",
        "tagLabel": "Observación",
        "title": "El acompañamiento de la semana tres",
        "caption": "Observar a un vendedor senior enseña lo que ningún manual explica: cuánto silencio aguanta antes de llenar el vacío.",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-21.png",
        "imagePosition": "bottom"
      },
      {
        "type": "media",
        "icon": "fa-location-crosshairs",
        "tagLabel": "Anatomía de la reunión",
        "title": "Los cuatro momentos de una reunión comercial",
        "body": "Explora cada punto para ver qué debes observar y practicar.",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-23.png",
        "hotspots": [
          {
            "x": 18,
            "y": 30,
            "title": "La apertura",
            "body": "Los primeros dos minutos definen el tono. Qué dices y, sobre todo, qué no dices todavía."
          },
          {
            "x": 42,
            "y": 58,
            "title": "El descubrimiento",
            "body": "Preguntas abiertas y silencio. Aquí se decide si hay oportunidad o solo conversación."
          },
          {
            "x": 68,
            "y": 36,
            "title": "La objeción",
            "body": "Responde con un dato, no con adjetivos. Una cifra vale más que cinco minutos de defensa."
          },
          {
            "x": 85,
            "y": 64,
            "title": "El siguiente paso",
            "body": "Nadie sale de la reunión sin fecha acordada. Si no hay fecha, no hubo avance."
          }
        ]
      },
      {
        "type": "slider",
        "icon": "fa-sliders",
        "tagLabel": "Evolución",
        "title": "Semana tres frente a semana cuatro",
        "body": "Desliza para ver qué cambia cuando pasas de acompañado a autónomo:",
        "imageBefore": "/images/lms-creator/video-ia-escenas/fotografia/escena-23.png",
        "imageAfter": "/images/lms-creator/video-ia-escenas/fotografia/escena-25.png",
        "labelBefore": "Semana tres: tu líder observa",
        "labelAfter": "Semana cuatro: la reunión es tuya"
      },
      {
        "type": "map",
        "icon": "fa-map-location-dot",
        "tagLabel": "Territorio",
        "title": "Dónde vive tu trabajo comercial",
        "body": "Haz clic en cada zona para ver qué se espera de ti ahí:",
        "regions": [
          {
            "id": "crm",
            "title": "CRM",
            "x": 22,
            "y": 28,
            "body": "El pipeline registrado el mismo día. Si no está aquí, para el equipo no existe."
          },
          {
            "id": "prospeccion",
            "title": "Prospección",
            "x": 68,
            "y": 24,
            "body": "Correo, teléfono y red profesional. Combinados, no por separado."
          },
          {
            "id": "reunion",
            "title": "Reunión",
            "x": 34,
            "y": 68,
            "body": "Descubrimiento, objeciones y cierre del siguiente paso."
          },
          {
            "id": "unoauno",
            "title": "Uno a uno",
            "x": 76,
            "y": 70,
            "body": "Tu hora semanal de aprendizaje. Llega con preguntas y pipeline abierto."
          }
        ]
      },
      {
        "type": "keypoint",
        "icon": "fa-chart-line",
        "tagLabel": "Dato clave",
        "title": "Tu lista de cuentas objetivo",
        "stat": "50",
        "statement": "empresas que cumplen el perfil ideal, con el contacto correcto identificado",
        "desc": "Es el entregable medible de la semana tres y la base del pipeline del resto del año.",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-19.png",
        "imagePosition": "right"
      },
      {
        "type": "big_number",
        "icon": "fa-arrow-trend-up",
        "tagLabel": "Meta de salida",
        "title": "El plazo",
        "number": "30",
        "label": "días para llegar a autonomía",
        "body": "Al día treinta debes tener pipeline construido, reuniones agendadas y al menos una oportunidad avanzada hasta propuesta.",
        "source": "Plan de onboarding comercial"
      },
      {
        "type": "quote",
        "icon": "fa-quote-left",
        "tagLabel": "Principio",
        "title": "Cómo responder una objeción",
        "body": "Una cifra de un caso de éxito vale más que cinco minutos defendiendo el producto.",
        "author": "Principio del equipo comercial",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-16.png",
        "imagePosition": "bottom"
      },
      {
        "type": "timeline",
        "icon": "fa-timeline",
        "tagLabel": "Ruta de treinta días",
        "title": "Las cuatro semanas",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-02.png",
        "items": [
          {
            "label": "Semana 1",
            "title": "Contexto",
            "body": "Producto, casos de éxito, competencia y configuración de herramientas."
          },
          {
            "label": "Semana 2",
            "title": "Discurso",
            "body": "Cliente ideal, propuesta de valor, descubrimiento y objeciones."
          },
          {
            "label": "Semana 3",
            "title": "Práctica",
            "body": "Cuentas objetivo, prospección multicanal y acompañamiento en reuniones."
          },
          {
            "label": "Semana 4",
            "title": "Autonomía",
            "body": "Reuniones propias, métricas personales y revisión formal del día treinta."
          }
        ]
      },
      {
        "type": "compare",
        "icon": "fa-code-compare",
        "tagLabel": "Dos hábitos",
        "title": "Registrar el mismo día o registrar después",
        "leftTag": "Mismo día",
        "rightTag": "Después",
        "leftTitle": "Mismo día",
        "leftBody": "El pipeline refleja la realidad y sirve para decidir.",
        "rightTitle": "Después",
        "rightBody": "El pipeline refleja tu memoria y solo sirve para reportar.",
        "rows": [
          {
            "left": "Detalles frescos y textuales",
            "right": "Detalles reconstruidos de memoria"
          },
          {
            "left": "La proyección del mes es confiable",
            "right": "La proyección se corrige a última hora"
          },
          {
            "left": "Tu líder puede ayudarte a tiempo",
            "right": "Tu líder se entera cuando ya no hay margen"
          }
        ]
      },
      {
        "type": "summary",
        "icon": "fa-flag-checkered",
        "tagLabel": "Cierre",
        "title": "Lo que aprendiste",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-30.png",
        "imagePosition": "right",
        "bullets": [
          "Cuatro semanas con un objetivo medible cada una",
          "Cincuenta cuentas objetivo como base del pipeline",
          "Datos antes que adjetivos frente a cualquier objeción",
          "Registro el mismo día, sin excepciones"
        ]
      }
    ]
  },
  {
    "estilo": "interactivo",
    "etiqueta": "Interactivo",
    "descripcion": "Acordeones, pestañas y elementos para explorar",
    "diapositivas": [
      {
        "type": "intro",
        "icon": "fa-briefcase",
        "tagLabel": "Onboarding comercial",
        "title": "Tus primeros treinta días",
        "subtitle": "Onboarding comercial",
        "body": "De conocer la empresa a cerrar tus primeras oportunidades con autonomía.",
        "badgeTitle": "Treinta días",
        "badgeSubtitle": "Cuatro semanas, cuatro objetivos",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-01.png",
        "imagePosition": "right"
      },
      {
        "type": "accordion",
        "icon": "fa-layer-group",
        "tagLabel": "Profundiza",
        "title": "Las objeciones más frecuentes",
        "items": [
          {
            "title": "Es muy caro",
            "body": "No defiendas el precio: cuantifica el costo de no resolver el problema. Una cifra del caso de éxito cierra la discusión más rápido que cinco minutos de argumentos."
          },
          {
            "title": "La implementación toma mucho tiempo",
            "body": "Trae el cronograma real y un caso comparable. La objeción casi nunca es el tiempo: es el miedo a que el proyecto se atasque."
          },
          {
            "title": "Estamos viendo otra opción",
            "body": "Pregunta qué le gustó de la alternativa antes de diferenciarte. Vas a aprender más de esa respuesta que de cualquier tabla comparativa."
          },
          {
            "title": "Necesito consultarlo internamente",
            "body": "Averigua con quién y para cuándo. Sin nombre y sin fecha, la consulta interna es una forma amable de no decidir."
          }
        ]
      },
      {
        "type": "tabs",
        "icon": "fa-folder-open",
        "tagLabel": "Tres canales",
        "title": "Cómo prospectar por cada canal",
        "tabs": [
          {
            "label": "Correo",
            "body": "Abre la puerta y deja registro de lo que propusiste. Asunto corto, un solo pedido y una razón concreta por la que escribes a esa empresa y no a otra."
          },
          {
            "label": "Teléfono",
            "body": "Acelera la respuesta y califica en una sola conversación. Prepara la primera frase y la pregunta que quieres que te responda antes de colgar."
          },
          {
            "label": "Red profesional",
            "body": "Da contexto del decisor antes del primer contacto. Sirve para saber a quién escribir y con qué referencia, no para vender en el mensaje inicial."
          }
        ]
      },
      {
        "type": "flashcards",
        "icon": "fa-clone",
        "tagLabel": "Repaso",
        "title": "Los cuatro criterios de calificación",
        "cards": [
          {
            "front": "Dolor",
            "back": "Hay algo que hoy le está costando dinero, tiempo o talento. Si no duele, no hay urgencia."
          },
          {
            "front": "Presupuesto",
            "back": "Existe dinero asignado o posibilidad real de asignarlo en el periodo que estás proyectando."
          },
          {
            "front": "Decisor",
            "back": "Estás hablando con quien firma, o tienes acceso claro a esa persona."
          },
          {
            "front": "Tiempo",
            "back": "Hay una fecha definida para resolverlo. Sin fecha, la oportunidad no se puede proyectar."
          }
        ]
      },
      {
        "type": "media",
        "icon": "fa-location-crosshairs",
        "tagLabel": "Anatomía de la reunión",
        "title": "Los cuatro momentos de una reunión comercial",
        "body": "Explora cada punto para ver qué observar y practicar.",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-23.png",
        "hotspots": [
          {
            "x": 18,
            "y": 30,
            "title": "La apertura",
            "body": "Los primeros dos minutos definen el tono. Qué dices y qué no dices todavía."
          },
          {
            "x": 42,
            "y": 58,
            "title": "El descubrimiento",
            "body": "Preguntas abiertas y silencio. Aquí se decide si hay oportunidad."
          },
          {
            "x": 68,
            "y": 36,
            "title": "La objeción",
            "body": "Responde con un dato, no con adjetivos."
          },
          {
            "x": 85,
            "y": 64,
            "title": "El siguiente paso",
            "body": "Si no hay fecha acordada al salir, no hubo avance."
          }
        ]
      },
      {
        "type": "slider",
        "icon": "fa-sliders",
        "tagLabel": "Evolución",
        "title": "Semana tres frente a semana cuatro",
        "body": "Desliza para ver qué cambia cuando pasas de acompañado a autónomo:",
        "imageBefore": "/images/lms-creator/video-ia-escenas/fotografia/escena-23.png",
        "imageAfter": "/images/lms-creator/video-ia-escenas/fotografia/escena-25.png",
        "labelBefore": "Semana tres: tu líder observa",
        "labelAfter": "Semana cuatro: la reunión es tuya"
      },
      {
        "type": "map",
        "icon": "fa-map-location-dot",
        "tagLabel": "Territorio",
        "title": "Dónde vive tu trabajo comercial",
        "body": "Haz clic en cada zona para ver qué se espera de ti ahí:",
        "regions": [
          {
            "id": "crm",
            "title": "CRM",
            "x": 22,
            "y": 28,
            "body": "El pipeline registrado el mismo día. Si no está aquí, para el equipo no existe."
          },
          {
            "id": "prospeccion",
            "title": "Prospección",
            "x": 68,
            "y": 24,
            "body": "Correo, teléfono y red profesional. Combinados, no por separado."
          },
          {
            "id": "reunion",
            "title": "Reunión",
            "x": 34,
            "y": 68,
            "body": "Descubrimiento, objeciones y cierre del siguiente paso."
          },
          {
            "id": "unoauno",
            "title": "Uno a uno",
            "x": 76,
            "y": 70,
            "body": "Tu hora semanal de aprendizaje. Llega con preguntas y pipeline abierto."
          }
        ]
      },
      {
        "type": "timeline",
        "icon": "fa-timeline",
        "tagLabel": "Ruta de treinta días",
        "title": "Las cuatro semanas",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-02.png",
        "items": [
          {
            "label": "Semana 1",
            "title": "Contexto",
            "body": "Producto, casos de éxito, competencia y configuración de herramientas."
          },
          {
            "label": "Semana 2",
            "title": "Discurso",
            "body": "Cliente ideal, propuesta de valor, descubrimiento y objeciones."
          },
          {
            "label": "Semana 3",
            "title": "Práctica",
            "body": "Cuentas objetivo, prospección multicanal y acompañamiento en reuniones."
          },
          {
            "label": "Semana 4",
            "title": "Autonomía",
            "body": "Reuniones propias, métricas personales y revisión formal del día treinta."
          }
        ]
      },
      {
        "type": "agenda",
        "icon": "fa-list-check",
        "tagLabel": "Contenido",
        "title": "Agenda del onboarding",
        "body": "Explora los cuatro bloques del programa:",
        "items": [
          {
            "num": "01",
            "title": "Contexto",
            "desc": "Qué vendemos, a quién y por qué nos eligen",
            "targetSlide": 1
          },
          {
            "num": "02",
            "title": "Discurso",
            "desc": "Convertir el producto en conversaciones de valor",
            "targetSlide": 2
          },
          {
            "num": "03",
            "title": "Práctica",
            "desc": "Prospectar acompañado y construir tu pipeline",
            "targetSlide": 6
          },
          {
            "num": "04",
            "title": "Autonomía",
            "desc": "Reuniones propias y primeras oportunidades",
            "targetSlide": 7
          }
        ]
      },
      {
        "type": "branching",
        "icon": "fa-code-branch",
        "tagLabel": "Toma de decisiones",
        "title": "Dilema: la reunión que no califica",
        "body": "Llevas cuarenta minutos con un contacto entusiasmado. Tiene el problema que resuelves, pero admite que no hay presupuesto asignado ni fecha para decidir. Tu meta de la semana es tener oportunidades en el pipeline. ¿Qué haces?",
        "choices": [
          {
            "text": "A. La registro como oportunidad: hay interés real y el pipeline necesita volumen.",
            "outcomeTitle": "Resultado: pipeline inflado",
            "isOptimal": false,
            "outcomeBody": "En dos semanas tu proyección no cuadra y tu líder pierde referencia de dónde estás parado. El volumen sin calificación cuesta más de lo que aporta."
          },
          {
            "text": "B. La dejo fuera del pipeline y acuerdo una fecha para retomar cuando haya presupuesto.",
            "outcomeTitle": "Resultado: pipeline confiable",
            "isOptimal": true,
            "outcomeBody": "Registras el contacto como seguimiento, no como oportunidad. Tu proyección sigue siendo real y tienes una fecha concreta para volver."
          },
          {
            "text": "C. La descarto por completo y sigo prospectando.",
            "outcomeTitle": "Resultado: contacto perdido",
            "isOptimal": false,
            "outcomeBody": "Descartar no es lo mismo que calificar. Ese contacto tenía el problema; lo que faltaba era el momento."
          }
        ]
      },
      {
        "type": "summary",
        "icon": "fa-flag-checkered",
        "tagLabel": "Cierre",
        "title": "Lo que aprendiste",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-30.png",
        "imagePosition": "right",
        "bullets": [
          "Cuatro criterios para calificar antes de registrar",
          "Tres canales de prospección que funcionan combinados",
          "Cuatro momentos que definen una reunión comercial",
          "Un pipeline confiable vale más que un pipeline lleno"
        ]
      }
    ]
  },
  {
    "estilo": "evaluativo",
    "etiqueta": "Evaluativo",
    "descripcion": "Refuerza con quiz, emparejamiento y retos",
    "diapositivas": [
      {
        "type": "intro",
        "icon": "fa-briefcase",
        "tagLabel": "Onboarding comercial",
        "title": "Tus primeros treinta días",
        "subtitle": "Onboarding comercial",
        "body": "De conocer la empresa a cerrar tus primeras oportunidades con autonomía.",
        "badgeTitle": "Treinta días",
        "badgeSubtitle": "Cuatro semanas, cuatro objetivos",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-01.png",
        "imagePosition": "right"
      },
      {
        "type": "quiz_mc",
        "icon": "fa-circle-question",
        "tagLabel": "Autoevaluación",
        "title": "Chequeo de calificación",
        "questions": [
          {
            "question": "Un contacto tiene el problema que resolvemos y muestra interés, pero no hay presupuesto ni fecha. ¿Qué es?",
            "options": [
              "Una oportunidad que hay que meter al pipeline",
              "Una conversación agradable que todavía no califica",
              "Una oportunidad perdida que conviene descartar"
            ],
            "correctIndex": 1
          },
          {
            "question": "El cliente dice que encontró algo más barato. ¿Cuál es la mejor primera respuesta?",
            "options": [
              "Explicar durante cinco minutos por qué nuestro producto es superior",
              "Traer una cifra de un caso de éxito comparable",
              "Ofrecer un descuento antes de que lo pida"
            ],
            "correctIndex": 1
          }
        ]
      },
      {
        "type": "quiz_tf",
        "icon": "fa-circle-check",
        "tagLabel": "Chequeo rápido",
        "title": "Verdadero o falso",
        "statement": "Si una reunión no avanzó de etapa, no hace falta registrarla en el CRM ese mismo día.",
        "isTrue": false,
        "explanation": "Falso. El registro no depende de que la oportunidad avance: depende de que la información esté fresca. Un pipeline desactualizado engaña a todo el equipo, no solo a ti."
      },
      {
        "type": "quiz_fill",
        "icon": "fa-pen-to-square",
        "tagLabel": "Completar",
        "title": "Completa la afirmación",
        "textBefore": "En el descubrimiento, después de una pregunta abierta lo que más información produce es",
        "blankValue": "el silencio",
        "textAfter": "porque la pausa incómoda empuja al cliente a explicar lo que no había pensado decir.",
        "options": [
          "el silencio",
          "otra pregunta",
          "una demostración",
          "un dato del producto"
        ],
        "explanation": "Quien más escucha es quien mejor califica. Llenar el vacío con otra pregunta corta justo la respuesta más útil."
      },
      {
        "type": "match",
        "icon": "fa-arrows-left-right",
        "tagLabel": "Semanas",
        "title": "Relaciona cada semana con su objetivo",
        "left": [
          "Semana uno",
          "Semana dos",
          "Semana tres",
          "Semana cuatro"
        ],
        "right": [
          "Entender qué vendemos y por qué nos eligen",
          "Convertir el producto en conversaciones de valor",
          "Prospectar acompañado y construir pipeline",
          "Manejar reuniones propias y avanzar oportunidades"
        ],
        "pairs": [
          [
            0,
            0
          ],
          [
            1,
            1
          ],
          [
            2,
            2
          ],
          [
            3,
            3
          ]
        ]
      },
      {
        "type": "sort",
        "icon": "fa-arrow-down-1-9",
        "tagLabel": "Secuencia",
        "title": "Ordena una reunión comercial",
        "body": "Organiza cronológicamente los momentos de una reunión bien llevada:",
        "items": [
          {
            "id": 1,
            "text": "Abrir con contexto y acordar el objetivo de la reunión"
          },
          {
            "id": 2,
            "text": "Descubrir con preguntas abiertas y sostener el silencio"
          },
          {
            "id": 3,
            "text": "Responder objeciones con datos de casos comparables"
          },
          {
            "id": 4,
            "text": "Cerrar el siguiente paso con fecha concreta"
          },
          {
            "id": 5,
            "text": "Registrar todo en el CRM el mismo día"
          }
        ]
      },
      {
        "type": "dragdrop",
        "icon": "fa-layer-group",
        "tagLabel": "Clasificación",
        "title": "Clasifica cada situación",
        "body": "Ubica cada caso según si califica como oportunidad o todavía no:",
        "categories": [
          {
            "id": "califica",
            "label": "Califica"
          },
          {
            "id": "nocalifica",
            "label": "Todavía no"
          }
        ],
        "items": [
          {
            "text": "Dolor claro, presupuesto aprobado, hablas con quien firma y hay fecha",
            "category": "califica"
          },
          {
            "text": "Mucho entusiasmo del contacto pero sin presupuesto asignado",
            "category": "nocalifica"
          },
          {
            "text": "Problema urgente, dinero disponible y decisión prevista para este trimestre",
            "category": "califica"
          },
          {
            "text": "El decisor no ha participado en ninguna conversación",
            "category": "nocalifica"
          },
          {
            "text": "Piden propuesta formal con fecha de arranque",
            "category": "califica"
          }
        ]
      },
      {
        "type": "game",
        "icon": "fa-gamepad",
        "tagLabel": "Desafío",
        "title": "Reto: la objeción de precio",
        "timeSeconds": 30,
        "body": "Responde antes de que se agote el tiempo:",
        "challenge": "El cliente dice que su presupuesto no alcanza. ¿Cuál es la primera acción recomendada?",
        "options": [
          {
            "text": "Cuantificar cuánto le cuesta hoy no resolver el problema",
            "correct": true
          },
          {
            "text": "Ofrecer un descuento para no perder la oportunidad",
            "correct": false
          },
          {
            "text": "Enumerar todas las funcionalidades incluidas en el precio",
            "correct": false
          }
        ],
        "scorePoints": 100
      },
      {
        "type": "compare",
        "icon": "fa-code-compare",
        "tagLabel": "Dos hábitos",
        "title": "Registrar el mismo día o registrar después",
        "leftTag": "Mismo día",
        "rightTag": "Después",
        "leftTitle": "Mismo día",
        "leftBody": "El pipeline refleja la realidad y sirve para decidir.",
        "rightTitle": "Después",
        "rightBody": "El pipeline refleja tu memoria y solo sirve para reportar.",
        "rows": [
          {
            "left": "Detalles frescos y textuales",
            "right": "Detalles reconstruidos de memoria"
          },
          {
            "left": "La proyección del mes es confiable",
            "right": "La proyección se corrige a última hora"
          },
          {
            "left": "Tu líder puede ayudarte a tiempo",
            "right": "Tu líder se entera cuando ya no hay margen"
          }
        ]
      },
      {
        "type": "keypoint",
        "icon": "fa-chart-line",
        "tagLabel": "Meta medible",
        "title": "Tu lista de cuentas objetivo",
        "stat": "50",
        "statement": "empresas que cumplen el perfil ideal, con el contacto correcto identificado",
        "desc": "Es el entregable verificable de la semana tres: se cuenta, no se opina.",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-19.png",
        "imagePosition": "right"
      },
      {
        "type": "summary",
        "icon": "fa-flag-checkered",
        "tagLabel": "Cierre",
        "title": "Los cuatro criterios de la revisión del día treinta",
        "image": "/images/lms-creator/video-ia-escenas/fotografia/escena-29.png",
        "imagePosition": "right",
        "bullets": [
          "Producto: entiendes el problema, no solo las funcionalidades",
          "Discurso: propuesta de valor en tres frases y objeciones preparadas",
          "Prospección: cincuenta cuentas y canales activos",
          "Disciplina: registro en CRM el mismo día, sin excepciones"
        ]
      }
    ]
  }
]
