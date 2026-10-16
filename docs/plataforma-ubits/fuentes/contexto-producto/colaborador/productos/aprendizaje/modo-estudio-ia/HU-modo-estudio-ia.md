# HU: Modo estudio IA (tutor en chat)

## Contexto

Los colaboradores necesitan practicar competencias a demanda sin esperar un curso publicado. Un tutor en chat que genera quiz, flashcards y podcast aumenta la práctica autónoma. Meta: iniciar un quiz desde un chip recomendado en menos de un minuto.

## Historia de Usuario

**Como** colaborador de mi empresa,
**quiero** un tutor en modo IA que me salude por nombre, me ofrezca practicar con quiz, flashcards y podcast, y opcionalmente plan de estudio,
**para** aprender a mi ritmo y reforzar competencias.

## Alcance

**Incluye:**
- Saludo “Hola, María Alejandra” y prompt “¿Qué quieres aprender hoy?”.
- Hasta 3 chips “Recomendado para ti”: Liderazgo, Comunicación, Inglés (desaparecen al iniciar chat).
- Chat libre; generación de Quiz, Flashcards y Podcast en panel derecho.
- Cards de recurso en el chat con botón “Abrir” solo si el panel está cerrado.
- Disclaimer de posibles errores del agente tras iniciar el chat.
- Volver hacia Agentes (IA para HR).

**Excluye:**
- Experiencia de estudio de un contenido LMS (páginas, certificado).
- Agente de tu empresa (documentos de empresa).
- Plan de estudio interactivo en panel (al elegirlo, el tutor indica que pruebe Quiz, Flashcards o Podcast; no hay Cancelar/Crear/Ver plan).
- Entrenamiento del modelo con las conversaciones.

## Reglas de Negocio

- **RN-01:** Usuario demo: María Alejandra; chips recomendados: exactamente 3 (Liderazgo, Comunicación, Inglés).
- **RN-02:** Las sugerencias/chips desaparecen en cuanto inicia el chat (primer mensaje o clic en chip).
- **RN-03:** Para Liderazgo, Comunicación, Inglés y Japonés, las opciones de material incluyen Quiz, Plan de estudio, Flashcards y Podcast.
- **RN-04:** Al elegir Plan de estudio, el tutor responde que el plan interactivo no está disponible aquí e invita a probar Quiz, Flashcards o Podcast; no abre panel de plan.
- **RN-05:** Para Hiragana, el plan de estudio con contenidos UBITS no aplica; se invita a usar Quiz o Flashcards.
- **RN-06:** El panel derecho está oculto al cargar; solo se muestra cuando la IA genera un recurso usable (quiz/flashcards/podcast).
- **RN-07:** En quiz, la respuesta da feedback inmediato (acierto o corrección); hay Anterior/Siguiente.
- **RN-08:** El botón Abrir de la card del chat solo es visible con el panel cerrado.
- **RN-09:** “Más preguntas” reinicia el quiz actual en el panel; no inserta un mensaje nuevo en el chat.
- **RN-10:** Modo estudio IA no se presenta como Experiencia de estudio.

## Criterios de Aceptación

**Escenario: Camino feliz — chip Liderazgo y quiz**

**Dado** que María Alejandra abre Modo estudio IA
**Y** ve el saludo con su nombre y 3 chips (Liderazgo, Comunicación, Inglés)
**Cuando** pulsa Liderazgo y luego pide un quiz
**Entonces** las sugerencias ya no están visibles
**Y** el panel derecho se abre con el quiz de Liderazgo

**Escenario: Caso borde — Plan de estudio no interactivo**

**Dado** que María está en Liderazgo y ve las opciones de material
**Cuando** elige Plan de estudio
**Entonces** recibe un mensaje invitando a probar Quiz, Flashcards o Podcast
**Y** no se abre un panel con Cancelar / Crear plan / Ver plan

**Escenario: Camino negativo — Abrir con panel ya abierto**

**Dado** que hay un quiz abierto en el panel derecho
**Cuando** María mira la card del recurso en el chat
**Entonces** el botón Abrir no está visible
**Y** al cerrar el panel con X, el botón Abrir aparece y al pulsarlo reabre el mismo quiz
