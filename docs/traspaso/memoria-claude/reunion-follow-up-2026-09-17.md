---
name: reunion-follow-up-2026-09-17
description: Follow up del 17-sep con Carlos y Nicolás; reparto de tareas (casi todo a Nico), lo que le toca a Cristian y plazo del viernes 18 a las 14:00.
metadata:
  type: project
---

Follow up del 17-sep-2026 (Carlos, Nicolás, Cristian). Plazo: **viernes 18-sep a las 14:00**
(propuesto por Nico; hay reunión 12:00-12:45). Tema de fondo: consistencia y foundations
«transversales»; Carlos está cansado de repetir border radius.

**Flujo de ramas acordado:** develop = público (el que ven stakeholders, luego en la URL oficial
UX Playground, pendiente de que compren Vercel Pro). prueba-fusion se renombra como staging de los
dos; cada uno mantiene su rama; PR a develop cuando esté estable. Ver [[develop-es-el-tronco]].

**Se lo lleva Nico** (Carlos: «todo esto se lo va a llevar Nico»): spacing, color de títulos del
sidebar (muted para Productos/Herramientas, foreground para ítems), migas y centrado a 1140 con
sidebar y agente contextual, header, radios de botones, grises de hover (no en ítem seleccionado),
favicon, CTA Modo IA al extremo derecho, centro de procesos, tooltips más chicos, placeholder en LMS
Creator, CTA invitar a ancho completo, dark mode (violetas), degradé azul transversal, pesos de
fuente a medium. Pesos de iconos: en espera hasta la librería de pago.

**Le toca a Cristian:**
- Design system sin imágenes: cambiar capturas PNG por el componente real (Carlos lo vio en Marco
  en dark mode).
- Estados y feedback: el estado «error no existe»; colores de toast/alertas (éxito verde,
  info azul, advertencia); ejemplo de alertas globales de arriba y si van bajo o sobre el header;
  regla skeleton vs spinner.
- Drawers: el del design system no es igual al que se usa (flotante); unificar.
- Botones IA / componentes custom: secundario igual al de Nico, terciario = secundario sin borde y
  100 % redondo, solo-icono en secundario y terciario, tamaños; luego hablar con Cristian Burbano
  para meterlos a la librería.
- Base de datos temporal para probar con datos reales: hablar con Julio («el profe») y Burbano.
- Revisar con Nico la skill de flux-ui: no está frenando estilos inventados.
- Pantallas preliminares del mapa (su deseo, después).

Ver [[auditoria-unificacion-2026-09-17]] y [[reunion-follow-up-2026-09-16]].
