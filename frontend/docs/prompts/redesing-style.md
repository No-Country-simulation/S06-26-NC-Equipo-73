Quiero que realices una mejora visual integral de la interfaz manteniendo la estructura y funcionalidad actual. El objetivo es conseguir una estética moderna, premium y consistente basada en la nueva identidad visual azul.

Navbar
Integra correctamente el logo dentro del navbar, asegurándote de que tenga una buena alineación vertical y horizontal con el resto de los elementos.
El logo debe mantener una proporción adecuada y verse nítido en todas las resoluciones.
Cuando el usuario haga scroll, el navbar debe adquirir un ligero efecto de desenfoque (backdrop-filter: blur(...)), sutil y elegante, sin exagerarlo. Debe transmitir una sensación de cristal (glassmorphism) manteniendo una buena legibilidad.


Background del HeroSection / IntelligenceSection / BeforeAfterSection
Quiero modificar completamente el gradiente actual.

No quiero que el gradiente termine en blanco. En su lugar, debe comenzar con un azul oscuro intenso, inspirado en el azul de la bandera de Francia, pasar por un azul ligeramente más claro en el centro y volver al mismo azul oscuro al finalizar.

La transición debe ser completamente suave y equilibrada para dar sensación de profundidad y elegancia, evitando zonas demasiado claras que rompan la continuidad visual.

Sistema de temas para las secciones

Quiero establecer dos tipos de secciones en toda la aplicación:

Secciones Dark

Todas las secciones que utilicen el background con el gradiente deberán seguir una temática oscura.

Para estas secciones:

Títulos en color blanco.
Subtítulos en color blanco o un blanco ligeramente atenuado.
Párrafos con excelente contraste.
Iconos adaptados al tema oscuro.
Botones diseñados específicamente para fondos oscuros.
Mantener una apariencia limpia, moderna y premium.
Secciones Light

Todas las secciones con fondo claro (#DEE5F2) deberán seguir una temática clara.

Para estas secciones:

Títulos en azul principal (#22406F).
Subtítulos también en azul, utilizando un tono ligeramente más suave si mejora la jerarquía visual.
Botones e iconos adaptados al fondo claro utilizando la paleta azul.
Mantener una excelente legibilidad y consistencia con la identidad visual.
Botones

Quiero un sistema de botones consistente entre todas las secciones.

Los botones del <CTASection /> deben ser la referencia del diseño principal.
Los botones del Hero deben tener exactamente el mismo diseño, dimensiones, espaciados, bordes, tipografía, radios y animaciones que los del CTA, pero adaptados a un tema oscuro para generar el contraste adecuado sobre el fondo azul.
No quiero simplemente invertir los colores ni utilizar los mismos botones del CTA sobre el Hero, ya que perderían contraste.
Quiero una variante Dark del mismo componente, manteniendo la misma identidad visual pero optimizada para fondos oscuros.
Ambos estilos deben sentirse parte del mismo sistema de diseño (Design System), diferenciándose únicamente por la adaptación al fondo donde se utilizan.
Los estados hover, active y focus también deben tener su versión Dark y mantener una transición suave y elegante.
Consistencia visual

Revisa toda la interfaz y asegúrate de que cada componente respete el tema (Dark o Light) de la sección donde se encuentra. No deben existir elementos con colores heredados que rompan la armonía visual.

Verifica especialmente:

Navbar.
Hero.
Cards.
Botones.
Iconos.
Inputs.
Badges.
Enlaces.
Hover.
Focus.
Bordes.
Sombras.

El resultado final debe transmitir una identidad visual moderna, profesional y coherente, con una clara diferenciación entre secciones oscuras y claras, manteniendo una excelente experiencia de usuario, un alto nivel de contraste y accesibilidad, y un sistema de componentes consistente en toda la aplicación.