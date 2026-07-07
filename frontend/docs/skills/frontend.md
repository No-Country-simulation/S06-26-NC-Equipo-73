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


:root {
  --font-body: "Roboto", sans-serif;

  /* Fondos y texto */
  --bg-main: #f2e3c0;
  --bg-surface: #fcf5c9;
  --border-subtle: #eddfbd;
  --text-primary: #402c2c;
  --text-secondary: #6d6d6d;

  /* Identidad (nombres actuales) */
  --color-primary: #630e06;
  --color-secondary: #e6af00;
  --color-container: #d7f7e1;

  /* Escala territorial (frío → caliente) */
  --heatmap-cold: var(--color-container);
  --heatmap-mid: var(--color-secondary);
  --heatmap-hot: var(--color-primary);

  /* Alias legacy — usados en componentes existentes */
  --primary-accent: var(--color-primary);
  --secondary-accent: var(--color-secondary);
}

@theme inline {
  --color-bg-main: var(--bg-main);
  --color-bg-surface: var(--bg-surface);
  --color-border-subtle: var(--border-subtle);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-primary: var(--color-primary);
  --color-secondary: var(--color-secondary);
  --color-container: var(--color-container);
  --color-primary-accent: var(--primary-accent);
  --color-secondary-accent: var(--secondary-accent);
  --color-heatmap-cold: var(--heatmap-cold);
  --color-heatmap-mid: var(--heatmap-mid);
  --color-heatmap-hot: var(--heatmap-hot);
}

body {
  font-family: var(--font-body);
  background-color: var(--bg-main);
  color: var(--text-primary);
}


Qué NO hacer
No hardcodear strings de texto visible — preparar para multilingüe desde el inicio.
No mezclar lógica de negocio en los componentes de UI.
No hacer fetch directo en los componentes — siempre via hooks o React Query.