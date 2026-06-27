# Home Redesign Specification

## Objetivo

Refactorizar únicamente el diseño visual de la Home manteniendo intacta toda la lógica, funcionalidades, estados, hooks, rutas y llamadas a la API.

## Restricciones

* No modificar la lógica de negocio.
* No cambiar nombres de componentes, funciones o props.
* No agregar nuevas dependencias.
* Mantener el código limpio y reutilizable.
* Conservar el diseño responsive.
* Reutilizar componentes existentes siempre que sea posible.

---

# HeroSection

## Layout Desktop

Crear un layout de dos columnas de igual jerarquía visual.

### Columna izquierda

Debe contener:

* H1 principal.
* Una línea divisora horizontal inmediatamente debajo del H1.

  * Debe ocupar aproximadamente un tercio del ancho del contenido.
* Un párrafo descriptivo.

  * Debe ser más pequeño visualmente que el H1.
* Dos botones ubicados uno al lado del otro debajo del párrafo.

Debe existir un buen espaciado entre todos los elementos.

### Columna derecha

Debe contener el componente HeroMap.

Requisitos:

* Debe ocupar visualmente un tamaño proporcional a la columna izquierda.
* Debe estar perfectamente alineado con el contenido.
* Debajo del mapa agregar un párrafo descriptivo (puede utilizar texto Lorem Ipsum por ahora).

## Responsive

En dispositivos móviles NO cambiar la estructura actual.

Debe mantenerse:

* Texto arriba.
* HeroMap debajo.
* Botones adaptados al ancho disponible.

---

# ProblemSection

Modificar únicamente la disposición visual.

Cada problema debe mostrar:

* Icono más grande.
* Icono ubicado a la izquierda.
* A la derecha del icono:

  * título
  * descripción

No colocar el icono encima del contenido.

Mantener una separación uniforme entre todos los elementos.

---

# IntelligenceSection.tsx

Rediseñar completamente esta sección.

## Desktop

Utilizar un layout horizontal.

Cada "Node" debe convertirse en una Card.

Cada Card debe contener:

1. Imagen superior.
2. Título.
3. Descripción.

Requisitos:

* Todas las Cards deben tener exactamente el mismo diseño.
* Mismo color de fondo.
* Mismo ancho.
* Misma altura.
* Mismo espaciado.

## Mobile

Las Cards deben apilarse verticalmente.

## Texto final

Al finalizar la sección, alineado hacia la derecha, agregar el siguiente texto:

> Cada indicador se analiza en relación con los demás, revelando patrones que ningún tablero tradicional puede mostrar.

---

# HowItWorksSection.tsx

Modificar únicamente la disposición visual.

Cada paso debe mostrar:

* Icono grande ubicado a la izquierda.
* A la derecha:

  * título
  * descripción

No colocar el icono encima del texto.

---

# Criterios de calidad

Antes de finalizar comprobar que:

* No se rompió ninguna funcionalidad.
* No se modificó la lógica existente.
* El diseño mantiene consistencia visual.
* Todos los componentes son completamente responsive.
* Se respetan los espacios y alineaciones.
* Se reutilizó el código existente cuando fue posible.
* El resultado tiene una apariencia moderna, limpia y profesional.
