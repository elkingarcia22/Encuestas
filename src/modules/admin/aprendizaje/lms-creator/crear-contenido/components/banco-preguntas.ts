// Banco de preguntas de ejemplo para las evaluaciones: lo usan la semilla demo y el agente de evaluaciones.
// Datos portados del catálogo del playground anterior (evaluaciones-recurso.js); no se editan a mano.

export type TipoBanco = 'multiple_choice_single_answer' | 'multiple_choice_multiple_answers' | 'binary' | 'closed_text' | 'essay' | 'matching'

export type PreguntaBanco = { stmt: string; opts?: string[]; correct?: number | number[]; answer?: string; pairs?: { a: string; b: string }[]; agentType: TipoBanco }

export const BANCO_PREGUNTAS: Record<'basic' | 'intermediate' | 'advanced', PreguntaBanco[]> = {
  "basic": [
    {
      "stmt": "¿Qué es un conflicto en el contexto de un equipo de trabajo?",
      "opts": [
        "Una discusión sin solución",
        "Una situación de tensión entre personas con intereses distintos",
        "Un problema técnico del proyecto",
        "Una falta de recursos"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "El primer paso para resolver un conflicto en un equipo es:",
      "opts": [
        "Ignorar la situación",
        "Identificar y reconocer la existencia del conflicto",
        "Escalar al director",
        "Sancionar al responsable"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? La escucha activa es clave para resolver conflictos.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "¿Qué habilidad es fundamental para resolver conflictos efectivamente?",
      "opts": [
        "Autoridad jerárquica",
        "Empatía y comunicación asertiva",
        "Rapidez en la decisión",
        "Evitar la confrontación"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Qué significa \"resolución colaborativa\" de un conflicto?",
      "opts": [
        "Que una parte gana y la otra cede",
        "Que ambas partes buscan una solución que beneficie a todos",
        "Que el líder decide sin consultar",
        "Que se evita el tema"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? Los conflictos siempre tienen un impacto negativo en los equipos.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 1,
      "agentType": "binary"
    },
    {
      "stmt": "¿Cuál de las siguientes es una señal temprana de conflicto en un equipo?",
      "opts": [
        "Aumento de la productividad",
        "Tensión en comunicaciones y reuniones",
        "Mayor creatividad grupal",
        "Reducción de errores"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "La mediación en un conflicto implica:",
      "opts": [
        "Imponer una solución externa",
        "Ignorar las emociones",
        "Facilitar el diálogo entre las partes con ayuda de un tercero neutral",
        "Separar físicamente a los involucrados"
      ],
      "correct": 2,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? Evitar un conflicto es siempre la mejor estrategia.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 1,
      "agentType": "binary"
    },
    {
      "stmt": "¿Qué tipo de comunicación contribuye más a prevenir conflictos?",
      "opts": [
        "Pasiva",
        "Agresiva",
        "Asertiva",
        "Evasiva"
      ],
      "correct": 2,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Cuál es el objetivo principal de resolver un conflicto en un equipo?",
      "opts": [
        "Determinar quién tiene razón",
        "Restaurar la colaboración y el enfoque en metas comunes",
        "Sancionar a los involucrados",
        "Eliminar las diferencias de opinión"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? La falta de claridad en roles puede generar conflictos.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "Una causa común de conflictos en equipos es:",
      "opts": [
        "El exceso de recursos",
        "La ambigüedad en responsabilidades y expectativas",
        "La alta motivación del equipo",
        "La comunicación clara"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Qué significa \"win-win\" en resolución de conflictos?",
      "opts": [
        "Que solo una parte gana",
        "Que ambas partes obtienen beneficios",
        "Que el conflicto se pospone",
        "Que el conflicto se intensifica"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? La empatía ayuda a desescalar conflictos.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "¿Cuál es la actitud más adecuada al dar retroalimentación en un conflicto?",
      "opts": [
        "Crítica generalizada",
        "Descripción específica del comportamiento sin juicios de valor",
        "Silencio total",
        "Tono agresivo para enfatizar el punto"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "Un ambiente psicológicamente seguro en el equipo:",
      "opts": [
        "Impide que surjan conflictos",
        "Facilita que los conflictos se expresen y resuelvan de forma constructiva",
        "Aumenta la competencia interna",
        "No tiene relación con los conflictos"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? Escuchar sin interrumpir es una técnica de resolución de conflictos.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "¿Cuál de estos no es un estilo de manejo de conflictos?",
      "opts": [
        "Colaboración",
        "Evasión",
        "Competencia",
        "Delegación técnica"
      ],
      "correct": 3,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Qué debe hacer un líder al detectar un conflicto incipiente?",
      "opts": [
        "Esperar a que escale",
        "Intervenir oportunamente para facilitar el diálogo",
        "Ignorarlo si no afecta resultados",
        "Transferir a los involucrados a otros equipos"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? La negociación es una herramienta útil en la resolución de conflictos.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "El estilo \"acomodarse\" en gestión de conflictos implica:",
      "opts": [
        "Imponer la solución propia",
        "Ceder a las demandas del otro para mantener la armonía",
        "Buscar solución conjunta",
        "Ignorar el conflicto"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Cuál de estas prácticas reduce los conflictos por malentendidos?",
      "opts": [
        "Usar lenguaje técnico complejo",
        "Confirmar comprensión al final de cada conversación",
        "Evitar reuniones del equipo",
        "Comunicar solo por email"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? Un conflicto no resuelto puede afectar la moral del equipo.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "¿Qué es la inteligencia emocional en el contexto del conflicto?",
      "opts": [
        "Ignorar las emociones propias",
        "La capacidad de reconocer y gestionar emociones propias y ajenas",
        "Actuar solo con lógica",
        "Suprimir reacciones emocionales"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "Selecciona todas las afirmaciones que describen correctamente el estilo evitativo:",
      "opts": [
        "No cuida ni el resultado ni la relación.",
        "Aplaza el problema y, aunque a veces sirve para enfriar, suele empeorarlo.",
        "Prioriza el resultado sobre la relación y puede generar resistencia.",
        "Ayuda a mantener la armonía, pero si se usa siempre genera frustración."
      ],
      "correct": [
        0,
        1
      ],
      "agentType": "multiple_choice_multiple_answers"
    },
    {
      "stmt": "Selecciona todas las conductas que suelen favorecer una escucha activa en un conflicto:",
      "opts": [
        "Parafrasear lo escuchado para confirmar comprensión.",
        "Planificar la réplica mientras el otro habla.",
        "Hacer preguntas abiertas antes de juzgar.",
        "Interrumpir para corregir hechos al instante."
      ],
      "correct": [
        0,
        2
      ],
      "agentType": "multiple_choice_multiple_answers"
    },
    {
      "stmt": "Completa: el modelo de Thomas-Kilmann identifica __ estilos de manejo de conflictos.",
      "opts": [],
      "answer": "5",
      "agentType": "closed_text"
    },
    {
      "stmt": "Escribe la sigla en inglés que significa “mejor alternativa si no hay acuerdo” en una negociación.",
      "opts": [],
      "answer": "BATNA",
      "agentType": "closed_text"
    },
    {
      "stmt": "Relaciona cada estilo con su descripción principal:",
      "pairs": [
        {
          "a": "Competitivo",
          "b": "Prioriza el resultado sobre la relación y puede generar resistencia."
        },
        {
          "a": "Acomodador",
          "b": "Prioriza la relación sobre el resultado y ayuda a mantener la armonía."
        }
      ],
      "agentType": "matching"
    },
    {
      "stmt": "Relaciona el concepto con su definición breve:",
      "pairs": [
        {
          "a": "Empatía",
          "b": "Reconocer y validar las emociones del otro sin necesidad de estar de acuerdo."
        },
        {
          "a": "Escucha activa",
          "b": "Atención plena, reformulación y clarificación sin interrumpir."
        }
      ],
      "agentType": "matching"
    }
  ],
  "intermediate": [
    {
      "stmt": "¿Cuál es la diferencia entre un conflicto de tarea y uno de relación en un equipo?",
      "opts": [
        "Son exactamente lo mismo",
        "El de tarea se refiere a desacuerdos sobre el trabajo; el de relación involucra tensiones interpersonales",
        "El de relación es más productivo",
        "El de tarea siempre escala más"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "El modelo de Thomas-Kilmann identifica cuántos estilos de manejo de conflictos:",
      "opts": [
        "3",
        "4",
        "5",
        "6"
      ],
      "correct": 2,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Qué estrategia es más efectiva cuando el conflicto involucra valores fundamentales diferentes?",
      "opts": [
        "Competencia directa",
        "Evasión temporal mientras se establece confianza",
        "Compromiso inmediato",
        "Mediación con un facilitador externo"
      ],
      "correct": 3,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? Los conflictos de proceso (cómo se realiza el trabajo) pueden ser beneficiosos si se gestionan bien.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "Al aplicar escucha activa en un conflicto, ¿qué elementos son esenciales?",
      "opts": [
        "Interrupción frecuente y reformulación agresiva",
        "Contacto visual, parafraseo y preguntas abiertas",
        "Hablar más que el interlocutor",
        "Tomar notas sin confirmar comprensión"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Cuál de estas acciones puede escalar un conflicto en vez de resolverlo?",
      "opts": [
        "Usar \"yo\" en lugar de \"tú\"",
        "Establecer un acuerdo de normas de diálogo",
        "Generalizar con frases como \"siempre\" o \"nunca\"",
        "Buscar intereses comunes"
      ],
      "correct": 2,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Cuándo es más apropiado usar el estilo \"compromiso\" en conflictos?",
      "opts": [
        "Cuando el tiempo es crítico y la relación no importa",
        "Cuando ambas partes tienen poder similar y una solución parcial es aceptable",
        "Cuando una parte tiene toda la razón",
        "Cuando el conflicto es de valores fundamentales"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? La retroalimentación basada en hechos es más efectiva que la basada en interpretaciones.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "En un equipo con alta diversidad cultural, los conflictos suelen originarse más frecuentemente por:",
      "opts": [
        "Diferencias salariales",
        "Normas de comunicación y valores culturales diferentes",
        "Exceso de creatividad",
        "Alto desempeño individual"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Cuál es la función del BATNA (Mejor alternativa a un acuerdo negociado) en un conflicto?",
      "opts": [
        "Imponer la solución preferida",
        "Conocer la opción mínima aceptable para mantener poder en la negociación",
        "Evadir el conflicto indefinidamente",
        "Escalar a la gerencia"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Qué técnica ayuda a separar personas del problema en la resolución de conflictos?",
      "opts": [
        "Negociación posicional",
        "Negociación basada en intereses (Fisher y Ury)",
        "Arbitraje unilateral",
        "Evasión sistemática"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? Los conflictos mal gestionados pueden convertirse en oportunidades de innovación.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "¿Cuál es el rol del facilitador en una sesión de resolución de conflictos?",
      "opts": [
        "Decidir quién tiene razón",
        "Guiar el proceso de diálogo de forma neutral sin imponer soluciones",
        "Reemplazar al líder del equipo",
        "Documentar sanciones"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "La comunicación no violenta (CNV) en conflictos incluye:",
      "opts": [
        "Observación, sentimiento, necesidad, petición",
        "Acusación, demanda, sanción, archivo",
        "Juicio, evaluación, corrección, archivo",
        "Amenaza, negación, imposición, cierre"
      ],
      "correct": 0,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Qué distingue a un mediador de un árbitro en la resolución de conflictos?",
      "opts": [
        "El mediador decide; el árbitro facilita",
        "El árbitro decide; el mediador facilita sin imponer",
        "Ambos tienen el mismo rol",
        "El árbitro es siempre externo; el mediador siempre interno"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? La confianza previa entre integrantes del equipo facilita la resolución de conflictos.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "¿Cuál es un síntoma de que un conflicto ha escalado al nivel de crisis?",
      "opts": [
        "Reuniones más frecuentes",
        "Parálisis en la toma de decisiones y ruptura de la comunicación",
        "Mayor claridad en los roles",
        "Incremento en la productividad"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Cuándo es adecuado usar el estilo \"competencia\" para resolver un conflicto?",
      "opts": [
        "Cuando el tiempo no importa",
        "En situaciones de emergencia donde se requiere decisión rápida",
        "Cuando hay tiempo para construir consenso",
        "En conflictos de valores"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "El \"efecto halagador\" en percepciones puede distorsionar la resolución de conflictos porque:",
      "opts": [
        "Hace que se sobrevalore la posición del más querido",
        "Facilita el acuerdo entre partes",
        "Elimina sesgos cognitivos",
        "Reduce la complejidad del conflicto"
      ],
      "correct": 0,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? Documentar los acuerdos alcanzados tras un conflicto reduce la probabilidad de recaída.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "La técnica \"reencuadre\" en conflictos consiste en:",
      "opts": [
        "Cambiar de opinión por presión",
        "Reformular la situación desde una perspectiva diferente para facilitar nuevas soluciones",
        "Ignorar las emociones del otro",
        "Escalar el conflicto a la dirección"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Cuál de los siguientes factores organizacionales contribuye más a la frecuencia de conflictos?",
      "opts": [
        "Claridad en la visión",
        "Ambigüedad de roles y recursos escasos",
        "Retroalimentación continua",
        "Autonomía del equipo"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? El estilo \"colaboración\" siempre requiere más tiempo que otros estilos de gestión de conflictos.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "¿Qué papel juegan los acuerdos de equipo en la prevención de conflictos?",
      "opts": [
        "Ninguno relevante",
        "Establecen expectativas claras que reducen malentendidos futuros",
        "Aumentan la burocracia",
        "Solo sirven en equipos nuevos"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Cuál de estos tipos de conflicto es generalmente más beneficioso para el equipo si se gestiona bien?",
      "opts": [
        "Conflicto de relación",
        "Conflicto de proceso",
        "Conflicto de tarea",
        "Conflicto de valores"
      ],
      "correct": 2,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "Selecciona todas las que son beneficios potenciales del conflicto de tarea bien gestionado:",
      "opts": [
        "Mayor creatividad y calidad de decisiones.",
        "Siempre elimina el conflicto de relación.",
        "Mejor detección temprana de errores en el trabajo.",
        "Reduce por completo las tensiones interpersonales."
      ],
      "correct": [
        0,
        2
      ],
      "agentType": "multiple_choice_multiple_answers"
    },
    {
      "stmt": "Selecciona todas las afirmaciones verdaderas sobre el estilo colaborativo (Thomas-Kilmann):",
      "opts": [
        "Busca soluciones que satisfagan las necesidades de ambas partes.",
        "Es siempre la opción más rápida cuando hay urgencia.",
        "Requiere confianza y tiempo para explorar intereses.",
        "Consiste en imponer la solución más racional."
      ],
      "correct": [
        0,
        2
      ],
      "agentType": "multiple_choice_multiple_answers"
    },
    {
      "stmt": "Selecciona todas las que describen con mayor precisión una mediación efectiva:",
      "opts": [
        "El mediador facilita el diálogo sin imponer la solución.",
        "El mediador decide quién tiene razón.",
        "Busca que las partes mantengan autonomía sobre el acuerdo.",
        "Sustituye por completo la negociación bilateral."
      ],
      "correct": [
        0,
        2
      ],
      "agentType": "multiple_choice_multiple_answers"
    },
    {
      "stmt": "Selecciona todas las señales de que un conflicto está escalando de forma riesgosa:",
      "opts": [
        "Interrupciones constantes y tono personalizado.",
        "Aumento explícito del interés por datos y acuerdos de normas de conversación.",
        "Generalizaciones (“siempre”, “nunca”).",
        "Mayor curiosidad genuina por la perspectiva del otro."
      ],
      "correct": [
        0,
        2
      ],
      "agentType": "multiple_choice_multiple_answers"
    },
    {
      "stmt": "Relaciona cada estilo de Thomas-Kilmann con su postura típica respecto al resultado y la relación:",
      "pairs": [
        {
          "a": "Evitativo",
          "b": "Ni alto interés en resultado ni en relación en el corto plazo; aplaza el enfrentamiento."
        },
        {
          "a": "Colaborativo",
          "b": "Alto interés en resultado y en relación; busca integración de intereses."
        }
      ],
      "agentType": "matching"
    },
    {
      "stmt": "Relaciona practica con efecto esperado en equipos:",
      "pairs": [
        {
          "a": "Normas explícitas de feedback",
          "b": "Reduce malentendidos y tensiones latentes."
        },
        {
          "a": "Roles y expectativas claras",
          "b": "Menos fricción por ambigüedad en responsabilidades."
        }
      ],
      "agentType": "matching"
    },
    {
      "stmt": "Nombre del modelo de cinco estilos de manejo de conflictos (apellidos de los autores, sin tilde).",
      "opts": [],
      "answer": "Thomas-Kilmann",
      "agentType": "closed_text"
    },
    {
      "stmt": "¿Cuántos estilos distingue el modelo Thomas-Kilmann? (solo el número)",
      "opts": [],
      "answer": "5",
      "agentType": "closed_text"
    },
    {
      "stmt": "Siglas en inglés del inventario de estilos de conflicto usado junto al modelo de Thomas-Kilmann.",
      "opts": [],
      "answer": "TKI",
      "agentType": "closed_text"
    }
  ],
  "advanced": [
    {
      "stmt": "¿Cómo influye el sesgo de atribución en la escalada de conflictos interpersonales en equipos?",
      "opts": [
        "No influye en conflictos laborales",
        "Lleva a atribuir causas negativas al comportamiento ajeno mientras se justifica el propio, intensificando el conflicto",
        "Siempre reduce la intensidad del conflicto",
        "Solo afecta conflictos entre pares de distinto nivel jerárquico"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "En equipos de alto rendimiento, ¿cuál es la relación óptima entre conflicto de tarea y conflicto de relación?",
      "opts": [
        "Ambos en niveles altos para maximizar creatividad",
        "Conflicto de tarea moderado y conflicto de relación mínimo",
        "Ambos minimizados para mantener armonía",
        "Conflicto de relación elevado para generar debate"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? La dinámica de pensamiento grupal puede generar conflictos encubiertos que afectan el desempeño a largo plazo.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "Al aplicar el modelo de negociación de Harvard en un conflicto organizacional, ¿qué principio es central?",
      "opts": [
        "Mantener posiciones rígidas hasta llegar a un acuerdo",
        "Separar a las personas del problema y centrarse en intereses, no posiciones",
        "Evitar la comunicación directa entre las partes",
        "Priorizar la ganancia unilateral"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Cuál de los siguientes enfoques sistémicos es más efectivo para transformar culturas organizacionales con conflictos crónicos?",
      "opts": [
        "Sanciones individuales frecuentes",
        "Rediseño de estructuras de incentivos, roles y procesos de comunicación",
        "Mayor vigilancia del comportamiento",
        "Aislamiento de los generadores de conflicto"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Qué impacto tiene el conflicto de proceso no gestionado en la eficiencia de un equipo?",
      "opts": [
        "Genera innovación sostenida",
        "Genera redundancias, ambigüedad y pérdida de tiempo en coordinación",
        "Mejora la distribución de roles",
        "Reduce la burocracia interna"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? La seguridad psicológica del equipo (Edmondson) es un predictor del manejo constructivo de conflictos.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "En conflictos interculturales dentro de equipos globales, ¿qué dimensión de Hofstede es más relevante para predecir la tolerancia al conflicto abierto?",
      "opts": [
        "Orientación al largo plazo",
        "Individualismo vs. colectivismo",
        "Distancia al poder",
        "Indulgencia vs. restricción"
      ],
      "correct": 2,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Cuál es la limitación más significativa del arbitraje como método de resolución de conflictos en equipos?",
      "opts": [
        "Es demasiado lento",
        "La solución impuesta puede generar resentimiento y reducir la apropiación del acuerdo",
        "Solo funciona en contextos legales",
        "No puede aplicarse en conflictos de relación"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Cómo afecta la identidad de grupo (in-group/out-group) a la resolución de conflictos entre subgrupos dentro de un mismo equipo?",
      "opts": [
        "La refuerza positivamente siempre",
        "Puede generar sesgos que favorecen al propio subgrupo y dificultan soluciones imparciales",
        "No tiene impacto medible",
        "Simplifica la mediación al establecer grupos claros"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? El conflicto constructivo en equipos puede ser diseñado intencionalmente mediante técnicas como el \"abogado del diablo\".",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "Al diseñar una intervención para resolver un conflicto organizacional, ¿qué debe priorizarse en el diagnóstico inicial?",
      "opts": [
        "Identificar al responsable del conflicto",
        "Comprender las causas raíz, los intereses de cada parte y el contexto sistémico",
        "Determinar la sanción más apropiada",
        "Consultar solo al líder formal del equipo"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Qué diferencia a la negociación integrativa de la distributiva en el contexto de conflictos laborales?",
      "opts": [
        "La integrativa busca repartir un recurso fijo; la distributiva amplía el valor disponible",
        "La integrativa amplía el valor conjunto; la distributiva asume que los recursos son fijos y uno gana lo que pierde el otro",
        "Ambas son equivalentes en resultados",
        "La distributiva siempre produce mejores resultados a largo plazo"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? Los conflictos de valores requieren estrategias de resolución diferentes a los conflictos de tarea.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "¿Cuál es el riesgo de aplicar la estrategia de \"evasión\" de forma reiterada ante un conflicto recurrente?",
      "opts": [
        "Mejora la cohesión del equipo a largo plazo",
        "El conflicto subyacente se intensifica y puede explotar de manera descontrolada",
        "Reduce la frecuencia total de conflictos",
        "Establece un patrón saludable de autonomía"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "En la práctica de la mediación transformativa, ¿cuál es el objetivo central en contraste con la mediación evaluativa?",
      "opts": [
        "Alcanzar un acuerdo económico rápido",
        "Transformar la calidad de la interacción entre las partes, no solo llegar a un acuerdo",
        "Determinar la culpabilidad de cada parte",
        "Documentar el conflicto para futuros litigios"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Cómo puede el líder de un equipo diseñar estructuras preventivas ante conflictos recurrentes?",
      "opts": [
        "Eliminando la diversidad de perfiles",
        "Creando foros de retroalimentación periódica, roles claros y normas explícitas de comunicación",
        "Reduciendo las interdependencias entre miembros",
        "Aumentando la supervisión directa"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? La conciencia de los propios sesgos cognitivos mejora la calidad de las decisiones durante un conflicto.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "En una negociación multipartes dentro de un equipo, ¿cuál es el mayor desafío estructural?",
      "opts": [
        "Definir el lugar físico de la negociación",
        "Manejar coaliciones cambiantes y alinear intereses divergentes sin excluir voces",
        "Documentar los acuerdos en tiempo real",
        "Seleccionar al facilitador adecuado"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Cuál es la evidencia de que una cultura organizacional promueve la gestión constructiva de conflictos?",
      "opts": [
        "Los conflictos son infrecuentes e invisibles",
        "Los miembros pueden expresar desacuerdos sin miedo a repercusiones y existen canales formales para resolverlos",
        "Las decisiones se toman sin debate",
        "Solo los líderes tienen autoridad para señalar problemas"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Qué relación existe entre la interdependencia de tareas y la frecuencia de conflictos en equipos?",
      "opts": [
        "Mayor interdependencia, menos conflictos",
        "Mayor interdependencia, mayor probabilidad de conflictos si no hay coordinación efectiva",
        "No existe relación demostrable",
        "La interdependencia elimina el conflicto de relación"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Verdadero o falso? El feedback de 360° puede ser una herramienta preventiva ante conflictos de relación en equipos.",
      "opts": [
        "Verdadero",
        "Falso"
      ],
      "correct": 0,
      "agentType": "binary"
    },
    {
      "stmt": "¿Cuál de estos enfoques teóricos explica mejor por qué los conflictos persistentes deterioran el capital social del equipo?",
      "opts": [
        "Teoría de la motivación de Maslow",
        "Teoría del intercambio social y el capital de confianza acumulado",
        "Modelo DISC de comportamiento",
        "Teoría X e Y de McGregor"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "Cuando un conflicto involucra a integrantes de distintos niveles jerárquicos, ¿qué riesgo adicional debe gestionarse?",
      "opts": [
        "Mayor creatividad en la solución",
        "Desequilibrio de poder que puede inhibir la expresión libre del miembro de menor rango",
        "Agilidad en la resolución por claridad de autoridad",
        "Reducción del conflicto por respeto a la jerarquía"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "¿Qué mide el \"Índice de apertura al conflicto\" en un equipo y por qué es relevante?",
      "opts": [
        "La frecuencia de disputas formales",
        "La disposición del equipo a expresar y gestionar desacuerdos de forma productiva, predictor de innovación y adaptabilidad",
        "El número de sanciones aplicadas",
        "El porcentaje de conflictos escalados a recursos humanos"
      ],
      "correct": 1,
      "agentType": "multiple_choice_single_answer"
    },
    {
      "stmt": "Selecciona todas las afirmaciones correctas sobre conflictos de valores en equipos:",
      "opts": [
        "Suelen ser más difíciles de “resolver” que los conflictos de tarea.",
        "Se resuelven mejor ignorando las diferencias hasta que desaparecen.",
        "A menudo requieren marcos de diálogo y facilitación más que una decisión unilateral.",
        "Siempre tienen una única respuesta objetivamente correcta."
      ],
      "correct": [
        0,
        2
      ],
      "agentType": "multiple_choice_multiple_answers"
    },
    {
      "stmt": "Selecciona todas las prácticas alineadas con una cultura de seguridad psicológica frente al conflicto:",
      "opts": [
        "Normalizar el desacuerdo productivo en reuniones.",
        "Castigar en público las opiniones impopulares.",
        "Establecer acuerdos sobre cómo confrontar ideas sin atacar personas.",
        "Evitar hablar de errores para no generar tensión."
      ],
      "correct": [
        0,
        2
      ],
      "agentType": "multiple_choice_multiple_answers"
    },
    {
      "stmt": "Selecciona todos los enfoques que suelen caracterizar la mediación transformadora frente a la evaluativa:",
      "opts": [
        "Priorizar la transformación de la calidad de la interacción entre las partes.",
        "Centrar el proceso solo en cerrar un acuerdo económico rápido.",
        "Fortalecer la capacidad empoderada de las partes para gestionar futuros conflictos.",
        "Determinar de forma autoritativa quién tiene razón."
      ],
      "correct": [
        0,
        2
      ],
      "agentType": "multiple_choice_multiple_answers"
    },
    {
      "stmt": "Relaciona cada concepto avanzado con su idea central:",
      "pairs": [
        {
          "a": "Capital social del equipo",
          "b": "Red de confianza y reciprocidad que puede deteriorarse con conflictos persistentes mal gestionados."
        },
        {
          "a": "Negociación integrativa",
          "b": "Buscar ampliar el valor conjunto frente a repartir un recurso percibido como fijo."
        }
      ],
      "agentType": "matching"
    },
    {
      "stmt": "Relaciona fenómeno con descripción:",
      "pairs": [
        {
          "a": "Sesgo de atribución hostil",
          "b": "Atribuir la conducta ajena a defectos de carácter y la propia a causas externas."
        },
        {
          "a": "Coaliciones cambiantes",
          "b": "En negociaciones multipartes, alianzas que se reorganizan según intereses."
        }
      ],
      "agentType": "matching"
    },
    {
      "stmt": "Autores del libro “Getting to Yes” (apellidos separados por guion, sin tilde).",
      "opts": [],
      "answer": "Fisher-Ury",
      "agentType": "closed_text"
    },
    {
      "stmt": "Apellido de la investigadora asociada de forma habitual al constructo de seguridad psicológica en equipos.",
      "opts": [],
      "answer": "Edmondson",
      "agentType": "closed_text"
    }
  ]
}
