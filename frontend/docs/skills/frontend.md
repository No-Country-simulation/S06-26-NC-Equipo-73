# Frontend Skill

Stack:
- React
- TypeScript
- TailwindCSS
- Vite

Reglas:

- No usar any
- Componentes funcionales
- Mantener separación de responsabilidades
- Usar interfaces
- Carpetas por feature

Reglas de Tailwind para este proyecto


Siempre usar las clases con los tokens del archivo ux.md.
No usar colores built-in de Tailwind para el diseño propio (gris, azul, etc.) —
usar solo los tokens custom del proyecto.
Extender el tailwind.config con los tokens:


jstheme: {
  extend: {
    colors: {
      /* Core Identity & Background */
  --bg-main: #fef8d4; /* Tu Butter como Fondo Principal */
  --text-primary: #5f4a8b; /* Tu Iris para Títulos y Texto Principal */
  --primary-accent: #7d6ac6; /* Iris Eléctrico para Interacción */
  
  /* UI Backgrounds & Surfaces (Light) */
  --bg-surface: #fcf5c9; /* Superficies para Tarjetas */
  --border-subtle: #eddfbd; /* Bordes suaves */
  --text-secondary: #6d6d6d; /* Texto Secundario cómodo */
  
  /* Heatmap Scale (Cold to Hot) on Light */
  --heatmap-cold: #d3c7e9; /* Lavanda suave para Zonas Frías */
  --heatmap-mid: #9d7fe6; /* Lavanda vibrante para Zonas Medias */
  --heatmap-hot: #ec4d63; /* Coral/Rosa para Zonas Calientes */
    }
  }
}

Qué NO hacer
No hardcodear strings de texto visible — preparar para multilingüe desde el inicio.
No mezclar lógica de negocio en los componentes de UI.
No hacer fetch directo en los componentes — siempre via hooks o React Query.