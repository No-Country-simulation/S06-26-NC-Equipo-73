-- Catálogo semántico para descubrimiento autónomo de tablas mediante MCP/LLM.
-- Es idempotente: puede ejecutarse nuevamente para actualizar las descripciones base.
--
-- Flujo recomendado para el MCP:
--   1. Incluir SELECT * FROM public.listar_fuentes_datos() en el contexto inicial del LLM.
--   2. El LLM elige tablas y llama describir_tablas_datos(ARRAY['tabla_1', 'tabla_2']).
--   3. El LLM construye y ejecuta únicamente SELECT parametrizados con un rol de solo lectura.

BEGIN;

CREATE TABLE IF NOT EXISTS public.catalogo_tablas_datos (
    esquema                    text        NOT NULL DEFAULT 'public',
    nombre_tabla               text        NOT NULL,
    tipo_tabla                 text        NOT NULL CHECK (tipo_tabla IN ('hechos', 'dimension', 'catalogo', 'agregado')),
    dominio                    text        NOT NULL,
    subdominios                text[]      NOT NULL DEFAULT '{}',
    descripcion                text        NOT NULL,
    granularidad               text        NOT NULL,
    clave_territorial          text,
    columnas_temporales        jsonb       NOT NULL DEFAULT '[]'::jsonb,
    columnas_relevantes        jsonb       NOT NULL DEFAULT '[]'::jsonb,
    relaciones                 jsonb       NOT NULL DEFAULT '[]'::jsonb,
    conceptos                  text[]      NOT NULL DEFAULT '{}',
    sinonimos                  text[]      NOT NULL DEFAULT '{}',
    fuente                     text,
    cobertura                  text,
    advertencias               text[]      NOT NULL DEFAULT '{}',
    prioridad_busqueda         smallint    NOT NULL DEFAULT 50,
    habilitada_mcp             boolean     NOT NULL DEFAULT true,
    actualizado_en             timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (esquema, nombre_tabla),
    CHECK (jsonb_typeof(columnas_temporales) = 'array'),
    CHECK (jsonb_typeof(columnas_relevantes) = 'array'),
    CHECK (jsonb_typeof(relaciones) = 'array')
);

COMMENT ON TABLE public.catalogo_tablas_datos IS
'Metadatos semánticos para que herramientas MCP descubran sólo las tablas útiles para una pregunta.';
COMMENT ON COLUMN public.catalogo_tablas_datos.granularidad IS
'Qué representa exactamente una fila; es esencial para evitar conteos y agregaciones incorrectas.';
COMMENT ON COLUMN public.catalogo_tablas_datos.relaciones IS
'Joins autorizados y su propósito, expresados como objetos JSON.';
COMMENT ON COLUMN public.catalogo_tablas_datos.advertencias IS
'Limitaciones que el LLM debe considerar antes de interpretar o comunicar resultados.';

INSERT INTO public.catalogo_tablas_datos (
    esquema, nombre_tabla, tipo_tabla, dominio, subdominios, descripcion, granularidad,
    clave_territorial, columnas_temporales, columnas_relevantes, relaciones, conceptos,
    sinonimos, fuente, cobertura, advertencias, prioridad_busqueda, habilitada_mcp
) VALUES
(
    'public', 'tensor_concentracion', 'agregado', 'telecomunicaciones',
    ARRAY['concentracion de usuarios', 'calidad de red', 'consumo digital'],
    'Métricas agregadas de actividad y calidad de red móvil por antena, zona, fecha y periodo del día.',
    'Una fila por ECGI, fecha y periodo del día.', 'codigo_municipio',
    '[{"columna":"fecha","significado":"día de observación"},{"columna":"periodo","significado":"MADRUGADA, MANHA, TARDE o NOITE"}]'::jsonb,
    '[{"columna":"cantidad_usuarios","significado":"usuarios observados; sumar por zona dentro de un periodo y no sumar personas entre periodos"},{"columna":"cantidad_sesiones","significado":"sesiones de red"},{"columna":"bytes_descarga","unidad":"bytes"},{"columna":"bytes_subida","unidad":"bytes"},{"columna":"porcentaje_caidas_promedio","unidad":"fracción; multiplicar por 100 para porcentaje"},{"columna":"congestion_promedio","unidad":"fracción; multiplicar por 100 para porcentaje"},{"columna":"total_llamadas","unidad":"llamadas"},{"columna":"total_mensajes","unidad":"mensajes"}]'::jsonb,
    '[{"tabla":"zonas","condicion":"tensor_concentracion.nombre_zona = zonas.nombre_zona","proposito":"obtener perfil y coordenadas de la zona"},{"tabla":"municipios","condicion":"tensor_concentracion.codigo_municipio = municipios.codigo_municipio_ibge","proposito":"comparar con salud, empleo y educación por municipio"},{"tabla":"antenas","condicion":"tensor_concentracion.ecgi = antenas.ecgi","proposito":"identificar la antena"}]'::jsonb,
    ARRAY['concentracion', 'usuarios', 'personas', 'afluencia', 'actividad movil', 'cobertura', 'caidas', 'congestion', 'trafico', 'sesiones', 'llamadas', 'mensajes'],
    ARRAY['densidad de personas', 'mayor cantidad de gente', 'movimiento de personas', 'network', 'mobile users', 'crowding'],
    'tensor_concentracao.csv', 'Datos VISENT por fecha y periodo disponibles en la tabla.',
    ARRAY['No representa población censal ni personas únicas entre periodos.', 'La tasa de caídas no equivale a cobertura geográfica.', 'Los campos de porcentaje se almacenan como fracciones entre 0 y 1.'],
    100, true
),
(
    'public', 'hospitalizaciones_febrero_2024', 'hechos', 'salud',
    ARRAY['hospitalizaciones', 'mortalidad', 'diagnosticos', 'salud mental', 'costos hospitalarios'],
    'Hospitalizaciones del SIH/SUS con diagnóstico, residencia, atención, permanencia, egreso y valores pagados.',
    'Una fila por autorización de internación hospitalaria (AIH), no necesariamente una persona única.',
    'codigo_municipio_residencia',
    '[{"columna":"anio_competencia","significado":"año de competencia"},{"columna":"mes_competencia","significado":"mes de competencia"},{"columna":"fecha_internacion","significado":"inicio de hospitalización"},{"columna":"fecha_salida","significado":"egreso"}]'::jsonb,
    '[{"columna":"diagnostico_principal","significado":"código CID-10 principal; F00-F99 corresponde al capítulo de trastornos mentales y del comportamiento"},{"columna":"diagnostico_secundario","significado":"código CID-10 secundario"},{"columna":"codigo_municipio_residencia","significado":"municipio de residencia del paciente"},{"columna":"codigo_municipio_movimiento","significado":"municipio donde ocurrió la atención"},{"columna":"dias_permanencia","unidad":"días"},{"columna":"codigo_indicador_muerte","significado":"1 indica defunción y 0 no"},{"columna":"valor_total","unidad":"BRL"},{"columna":"edad","unidad":"según codigo_unidad_edad"}]'::jsonb,
    '[{"tabla":"municipios","condicion":"hospitalizaciones_febrero_2024.codigo_municipio_residencia = municipios.codigo_municipio_ibge","proposito":"agrupar por residencia"},{"tabla":"municipios","condicion":"hospitalizaciones_febrero_2024.codigo_municipio_movimiento = municipios.codigo_municipio_ibge","proposito":"agrupar por lugar de atención"},{"tabla":"codigos_hospitalarios","condicion":"usar variable y codigo para decodificar campos categóricos","proposito":"obtener etiquetas legibles"}]'::jsonb,
    ARRAY['salud', 'enfermos', 'pacientes', 'hospitalizaciones', 'internaciones', 'salud mental', 'trastornos mentales', 'psiquiatria', 'diagnostico', 'cid10', 'mortalidad', 'defunciones', 'costos'],
    ARRAY['enfermedades mentales', 'pacientes psiquiatricos', 'mental health', 'sick people', 'hospital admissions', 'aih', 'sih sus'],
    'RD202402.csv', 'Competencia febrero de 2024.',
    ARRAY['Contar filas mide hospitalizaciones/AIH, no personas únicas.', 'Para salud mental se debe justificar y documentar el filtro CID-10 utilizado.', 'Los datos no representan prevalencia general: sólo hospitalizaciones registradas.', 'Elegir explícitamente municipio de residencia o municipio de atención.'],
    100, true
),
(
    'public', 'movimientos_laborales_201901', 'hechos', 'empleabilidad',
    ARRAY['contrataciones', 'desvinculaciones', 'salarios', 'ocupaciones', 'actividad economica'],
    'Movimientos formales de admisión y desvinculación laboral de CAGED por municipio, ocupación y actividad económica.',
    'Una fila por movimiento laboral declarado.', 'codigo_municipio',
    '[{"columna":"periodo_declarado","significado":"competencia en formato YYYYMM"},{"columna":"anio_declarado","significado":"año declarado"}]'::jsonb,
    '[{"columna":"balance_movimiento","significado":"positivo para ingreso y negativo para salida; sumar para saldo neto"},{"columna":"salario_mensual","unidad":"BRL"},{"columna":"horas_contratadas","unidad":"horas"},{"columna":"codigo_ocupacion_cbo_2002","significado":"ocupación CBO"},{"columna":"codigo_clase_cnae_version_2","significado":"clase de actividad CNAE"},{"columna":"edad","unidad":"años"},{"columna":"sexo","significado":"categoría informada en CAGED"},{"columna":"es_aprendiz","significado":"indicador de aprendiz"},{"columna":"tiene_discapacidad","significado":"indicador de discapacidad"}]'::jsonb,
    '[{"tabla":"municipios","condicion":"movimientos_laborales_201901.codigo_municipio = municipios.codigo_municipio_ibge","proposito":"análisis territorial"},{"tabla":"ocupaciones_cbo","condicion":"movimientos_laborales_201901.codigo_ocupacion_cbo_2002 = ocupaciones_cbo.codigo_ocupacion","proposito":"nombre de ocupación"},{"tabla":"clases_cnae","condicion":"movimientos_laborales_201901.codigo_clase_cnae_version_2 = clases_cnae.codigo_clase","proposito":"actividad económica"},{"tabla":"subclases_cnae","condicion":"movimientos_laborales_201901.codigo_subclase_cnae_version_2 = subclases_cnae.codigo_subclase","proposito":"actividad económica detallada"}]'::jsonb,
    ARRAY['empleo', 'empleabilidad', 'trabajo', 'contrataciones', 'despidos', 'desvinculaciones', 'saldo laboral', 'salario', 'ocupacion', 'actividad economica', 'horas'],
    ARRAY['mercado laboral', 'puestos de trabajo', 'altas laborales', 'bajas laborales', 'jobs', 'employment', 'hires', 'dismissals', 'caged'],
    'CAGEDEST_012019.csv', 'Competencia enero de 2019.',
    ARRAY['Mide flujos del empleo formal, no el total de personas empleadas ni desempleo.', 'No comparar valores monetarios entre periodos sin ajuste inflacionario.', 'El saldo neto se obtiene sumando balance_movimiento.'],
    100, true
),
(
    'public', 'movilidad', 'hechos', 'telecomunicaciones',
    ARRAY['movilidad humana', 'sesiones', 'calidad de red', 'consumo digital', 'segmentos demograficos'],
    'Actividad móvil seudonimizada por suscriptor, fecha, antena, zona y periodo de sesión.',
    'Una fila de actividad por suscriptor, fecha, ECGI y demás dimensiones configuradas en la fuente.',
    'codigo_municipio',
    '[{"columna":"fecha","significado":"día de actividad"},{"columna":"periodo_sesion","significado":"periodo de la sesión"}]'::jsonb,
    '[{"columna":"hash_suscriptor","significado":"identificador seudonimizado; usar COUNT(DISTINCT) para personas aproximadas"},{"columna":"cantidad_sesiones","unidad":"sesiones"},{"columna":"duracion_total_segundos","unidad":"segundos"},{"columna":"bytes_descarga","unidad":"bytes"},{"columna":"bytes_subida","unidad":"bytes"},{"columna":"porcentaje_caidas","unidad":"fracción"},{"columna":"congestion","unidad":"fracción"},{"columna":"segmento_ingresos","significado":"segmento económico"},{"columna":"grupo_edad","significado":"grupo etario"}]'::jsonb,
    '[{"tabla":"suscriptores","condicion":"movilidad.hash_suscriptor = suscriptores.hash_suscriptor","proposito":"perfil residencial del suscriptor"},{"tabla":"antenas","condicion":"movilidad.ecgi = antenas.ecgi","proposito":"ubicación de antena"},{"tabla":"zonas","condicion":"movilidad.nombre_zona = zonas.nombre_zona","proposito":"perfil y coordenadas de zona"},{"tabla":"municipios","condicion":"movilidad.codigo_municipio = municipios.codigo_municipio_ibge","proposito":"comparación territorial"}]'::jsonb,
    ARRAY['movilidad', 'desplazamiento', 'usuarios unicos', 'sesiones', 'consumo', 'trafico movil', 'segmento ingresos', 'edad', 'aplicaciones'],
    ARRAY['personas moviendose', 'actividad celular', 'mobile activity', 'mobility', 'subscriber behavior'],
    'tensor_mobilidade.csv', 'Fechas disponibles en la fuente VISENT.',
    ARRAY['Un hash representa un suscriptor, no garantiza equivalencia exacta con una persona.', 'Es una tabla muy grande: filtrar por fecha y municipio antes de agregar.', 'No seleccionar identificadores individuales si basta con resultados agregados.'],
    95, true
),
(
    'public', 'trayectos_comunes', 'agregado', 'movilidad',
    ARRAY['origen destino', 'viajes', 'desplazamientos', 'distancia'],
    'Trayectos agregados entre zonas y municipios con cantidad de usuarios, viajes y distancia media.',
    'Una fila por combinación de zona origen, zona destino y periodo predominante.', 'codigo_municipio_origen',
    '[{"columna":"periodo_predominante","significado":"periodo del día predominante"}]'::jsonb,
    '[{"columna":"zona_origen","significado":"zona de inicio"},{"columna":"zona_destino","significado":"zona de término"},{"columna":"codigo_municipio_origen","significado":"municipio de origen"},{"columna":"codigo_municipio_destino","significado":"municipio de destino"},{"columna":"cantidad_usuarios","unidad":"usuarios agregados"},{"columna":"cantidad_viajes","unidad":"viajes"},{"columna":"distancia_media_km","unidad":"km"}]'::jsonb,
    '[{"tabla":"zonas","condicion":"trayectos_comunes.zona_origen = zonas.nombre_zona o trayectos_comunes.zona_destino = zonas.nombre_zona","proposito":"describir origen y destino"},{"tabla":"municipios","condicion":"códigos de municipio origen/destino = municipios.codigo_municipio_ibge","proposito":"nombres territoriales"}]'::jsonb,
    ARRAY['trayectos', 'viajes', 'origen', 'destino', 'flujo', 'movilidad', 'distancia', 'desplazamiento'],
    ARRAY['rutas comunes', 'commuting', 'origin destination', 'od matrix', 'travel flows'],
    'trajetos_comuns.csv', 'Periodo agregado disponible en la fuente.',
    ARRAY['Los usuarios y viajes ya están agregados; no aplicar COUNT(*) como cantidad de viajes.', 'Distinguir municipio de origen de municipio de destino.'],
    90, true
),
(
    'public', 'cursos_2024', 'agregado', 'educacion',
    ARRAY['educacion superior', 'oferta academica', 'matriculas', 'vacantes'],
    'Oferta y resultados de cursos de educación superior por institución, curso, municipio y clasificación académica.',
    'Una fila por curso e institución dentro de las dimensiones del censo.', 'codigo_municipio',
    '[{"columna":"anio_censo","significado":"año del censo de educación superior"}]'::jsonb,
    '[{"columna":"nombre_curso","significado":"nombre del programa"},{"columna":"nombre_clasificacion_cine","significado":"clasificación académica CINE"},{"columna":"modalidad_ensenanza","significado":"modalidad"},{"columna":"cantidad_cursos","unidad":"cursos"},{"columna":"vacantes_total","unidad":"vacantes"},{"columna":"inscritos_total","unidad":"postulaciones/inscripciones"},{"columna":"matriculados_total","unidad":"matrículas"},{"columna":"concluyentes_total","unidad":"personas concluyentes"}]'::jsonb,
    '[{"tabla":"municipios","condicion":"cursos_2024.codigo_municipio = municipios.codigo_municipio_ibge","proposito":"análisis territorial"}]'::jsonb,
    ARRAY['educacion', 'cursos', 'universidades', 'instituciones', 'matriculas', 'vacantes', 'estudiantes', 'formacion'],
    ARRAY['oferta educativa', 'educacion superior', 'higher education', 'college courses', 'training'],
    'MICRODADOS_CADASTRO_CURSOS_2024.CSV', 'Censo 2024.',
    ARRAY['Los campos de totales ya son medidas agregadas; sumarlos sólo dentro de dimensiones compatibles.', 'Inscritos, matriculados, ingresantes y concluyentes son conceptos diferentes.'],
    90, true
),
(
    'public', 'suscriptores', 'dimension', 'telecomunicaciones',
    ARRAY['perfil de suscriptores', 'segmentacion', 'demografia'],
    'Perfil seudonimizado del suscriptor con zona de residencia, segmento de ingresos, edad y patrón de movilidad.',
    'Una fila por hash de suscriptor.', 'codigo_municipio_residencia', '[]'::jsonb,
    '[{"columna":"hash_suscriptor","significado":"identificador seudonimizado"},{"columna":"zona_residencia","significado":"zona habitual"},{"columna":"segmento_ingresos","significado":"segmento económico"},{"columna":"grupo_edad","significado":"grupo etario"},{"columna":"patron_movilidad","significado":"clasificación de movilidad"}]'::jsonb,
    '[{"tabla":"movilidad","condicion":"suscriptores.hash_suscriptor = movilidad.hash_suscriptor","proposito":"enriquecer actividad"},{"tabla":"municipios","condicion":"suscriptores.codigo_municipio_residencia = municipios.codigo_municipio_ibge","proposito":"residencia territorial"},{"tabla":"zonas","condicion":"suscriptores.zona_residencia = zonas.nombre_zona","proposito":"perfil de zona"}]'::jsonb,
    ARRAY['suscriptores', 'residentes', 'ingresos', 'edad', 'segmentacion', 'perfil', 'movilidad habitual'],
    ARRAY['abonados', 'clientes moviles', 'subscribers', 'demographics'],
    'assinantes.csv', 'Cobertura de suscriptores presente en la fuente VISENT.',
    ARRAY['Los registros son suscriptores, no población completa.', 'No devolver hashes individuales salvo necesidad explícita y autorización.'],
    75, true
),
(
    'public', 'zonas', 'dimension', 'territorio', ARRAY['zonas visent', 'coordenadas', 'perfil urbano'],
    'Zonas operacionales VISENT con municipio, coordenadas representativas y descripción de perfil.',
    'Una fila por zona.', 'codigo_municipio', '[]'::jsonb,
    '[{"columna":"nombre_zona","significado":"identificador legible de zona"},{"columna":"codigo_municipio","significado":"municipio IBGE"},{"columna":"latitud","unidad":"grados"},{"columna":"longitud","unidad":"grados"},{"columna":"descripcion_perfil","significado":"perfil funcional de la zona"}]'::jsonb,
    '[{"tabla":"municipios","condicion":"zonas.codigo_municipio = municipios.codigo_municipio_ibge","proposito":"nombre y UF del municipio"},{"tabla":"tensor_concentracion","condicion":"zonas.nombre_zona = tensor_concentracion.nombre_zona","proposito":"métricas de red"},{"tabla":"antenas","condicion":"zonas.nombre_zona = antenas.nombre_zona","proposito":"antenas de la zona"}]'::jsonb,
    ARRAY['zona', 'barrio', 'coordenadas', 'latitud', 'longitud', 'mapa', 'perfil urbano'],
    ARRAY['cluster', 'area', 'location', 'geography'], 'clusters.csv', 'Zonas incluidas por VISENT.',
    ARRAY['Una zona VISENT no equivale necesariamente a un límite administrativo oficial.'], 80, true
),
(
    'public', 'municipios', 'dimension', 'territorio', ARRAY['municipios brasil', 'ibge', 'division administrativa'],
    'Catálogo nacional de municipios con códigos IBGE y TOM y unidad federativa.',
    'Una fila por municipio IBGE.', 'codigo_municipio_ibge', '[]'::jsonb,
    '[{"columna":"codigo_municipio_ibge","significado":"código IBGE completo de siete dígitos"},{"columna":"nombre_municipio","significado":"nombre oficial IBGE"},{"columna":"codigo_uf","significado":"sigla de unidad federativa"},{"columna":"codigo_municipio_tom","significado":"código TOM"}]'::jsonb,
    '[{"tabla":"zonas","condicion":"municipios.codigo_municipio_ibge = zonas.codigo_municipio","proposito":"zonas y coordenadas VISENT"},{"tabla":"hospitalizaciones_febrero_2024","condicion":"municipios.codigo_municipio_ibge = codigo_municipio_residencia o codigo_municipio_movimiento","proposito":"salud"},{"tabla":"movimientos_laborales_201901","condicion":"municipios.codigo_municipio_ibge = movimientos_laborales_201901.codigo_municipio","proposito":"empleo"},{"tabla":"cursos_2024","condicion":"municipios.codigo_municipio_ibge = cursos_2024.codigo_municipio","proposito":"educación"}]'::jsonb,
    ARRAY['municipio', 'ciudad', 'territorio', 'ibge', 'estado', 'uf', 'region'],
    ARRAY['localidad', 'city', 'municipality', 'geografia'], 'municipios.csv', '5.571 municipios del catálogo fuente.',
    ARRAY['La tabla no contiene centroides municipales; las coordenadas disponibles provienen de zonas VISENT.'], 85, true
),
(
    'public', 'antenas', 'dimension', 'telecomunicaciones', ARRAY['infraestructura movil', 'ubicacion de red'],
    'Catálogo de antenas/celdas móviles identificadas por ECGI y asociadas a zona, municipio y coordenadas.',
    'Una fila por ECGI.', 'codigo_municipio', '[]'::jsonb,
    '[{"columna":"ecgi","significado":"identificador global de celda"},{"columna":"nombre_zona","significado":"zona VISENT"},{"columna":"codigo_municipio","significado":"municipio IBGE"},{"columna":"latitud","unidad":"grados"},{"columna":"longitud","unidad":"grados"}]'::jsonb,
    '[{"tabla":"zonas","condicion":"antenas.nombre_zona = zonas.nombre_zona","proposito":"perfil de zona"},{"tabla":"municipios","condicion":"antenas.codigo_municipio = municipios.codigo_municipio_ibge","proposito":"territorio"},{"tabla":"tensor_concentracion","condicion":"antenas.ecgi = tensor_concentracion.ecgi","proposito":"métricas agregadas"}]'::jsonb,
    ARRAY['antenas', 'celdas', 'ecgi', 'infraestructura', 'cobertura', 'coordenadas'],
    ARRAY['torres', 'cell sites', 'base stations', 'radio network'], 'antenas_flp.csv', 'Antenas presentes en la fuente VISENT.',
    ARRAY['La existencia de una antena no demuestra por sí sola cobertura efectiva.'], 70, true
),
(
    'public', 'codigos_hospitalarios', 'catalogo', 'salud', ARRAY['diccionario sih sus', 'codigos categoricos'],
    'Diccionario de códigos hospitalarios por variable, código y etiqueta.',
    'Una fila por combinación de variable y código.', NULL, '[]'::jsonb,
    '[{"columna":"variable","significado":"nombre de variable SIH/SUS"},{"columna":"codigo","significado":"valor codificado"},{"columna":"etiqueta","significado":"texto legible"},{"columna":"descripcion","significado":"descripción de la variable"}]'::jsonb,
    '[{"tabla":"hospitalizaciones_febrero_2024","condicion":"codigos_hospitalarios.variable identifica el campo y codigo coincide con su valor","proposito":"decodificar categorías"}]'::jsonb,
    ARRAY['codigos hospitalarios', 'diccionario', 'etiquetas', 'sih sus'],
    ARRAY['codebook', 'lookup', 'hospital codes'], 'dicionario_codigos_hospitalares.csv', 'Variables categóricas configuradas para RD.',
    ARRAY['La clave es compuesta: nunca unir sólo por codigo; incluir siempre variable.'], 60, true
),
(
    'public', 'ocupaciones_cbo', 'catalogo', 'empleabilidad', ARRAY['ocupaciones', 'clasificacion laboral'],
    'Catálogo de códigos y nombres de ocupaciones CBO 2002.', 'Una fila por código de ocupación.', NULL, '[]'::jsonb,
    '[{"columna":"codigo_ocupacion","significado":"código CBO 2002"},{"columna":"nombre_ocupacion","significado":"nombre de ocupación"}]'::jsonb,
    '[{"tabla":"movimientos_laborales_201901","condicion":"ocupaciones_cbo.codigo_ocupacion = movimientos_laborales_201901.codigo_ocupacion_cbo_2002","proposito":"describir ocupación"}]'::jsonb,
    ARRAY['ocupacion', 'profesion', 'puesto', 'cbo'], ARRAY['oficio', 'job title', 'occupation'],
    'CAGEDEST-OCUPACIONES.csv', 'Clasificación CBO utilizada por la fuente.', ARRAY[]::text[], 55, true
),
(
    'public', 'clases_cnae', 'catalogo', 'empleabilidad', ARRAY['actividad economica', 'sectores productivos'],
    'Catálogo de clases CNAE 2.0 para describir actividades económicas.', 'Una fila por código de clase CNAE.', NULL, '[]'::jsonb,
    '[{"columna":"codigo_clase","significado":"código de clase CNAE"},{"columna":"nombre_clase","significado":"actividad económica"}]'::jsonb,
    '[{"tabla":"movimientos_laborales_201901","condicion":"clases_cnae.codigo_clase = movimientos_laborales_201901.codigo_clase_cnae_version_2","proposito":"describir sector económico"}]'::jsonb,
    ARRAY['cnae', 'actividad economica', 'industria', 'sector'], ARRAY['economic activity', 'industry classification'],
    'CAGEDEST-CLASE.csv', 'Clases CNAE 2.0 utilizadas por la fuente.', ARRAY[]::text[], 55, true
),
(
    'public', 'subclases_cnae', 'catalogo', 'empleabilidad', ARRAY['actividad economica detallada', 'sectores productivos'],
    'Catálogo de subclases CNAE 2.0 con mayor detalle de actividad económica.', 'Una fila por código de subclase CNAE.', NULL, '[]'::jsonb,
    '[{"columna":"codigo_subclase","significado":"código de subclase CNAE"},{"columna":"nombre_subclase","significado":"actividad económica detallada"}]'::jsonb,
    '[{"tabla":"movimientos_laborales_201901","condicion":"subclases_cnae.codigo_subclase = movimientos_laborales_201901.codigo_subclase_cnae_version_2","proposito":"describir actividad detallada"}]'::jsonb,
    ARRAY['cnae', 'subclase', 'actividad economica', 'industria', 'sector'], ARRAY['economic activity detail', 'industry subclass'],
    'CAGEDEST-SUBCLASE.csv', 'Subclases CNAE 2.0 utilizadas por la fuente.', ARRAY[]::text[], 55, true
)
ON CONFLICT (esquema, nombre_tabla) DO UPDATE SET
    tipo_tabla = EXCLUDED.tipo_tabla,
    dominio = EXCLUDED.dominio,
    subdominios = EXCLUDED.subdominios,
    descripcion = EXCLUDED.descripcion,
    granularidad = EXCLUDED.granularidad,
    clave_territorial = EXCLUDED.clave_territorial,
    columnas_temporales = EXCLUDED.columnas_temporales,
    columnas_relevantes = EXCLUDED.columnas_relevantes,
    relaciones = EXCLUDED.relaciones,
    conceptos = EXCLUDED.conceptos,
    sinonimos = EXCLUDED.sinonimos,
    fuente = EXCLUDED.fuente,
    cobertura = EXCLUDED.cobertura,
    advertencias = EXCLUDED.advertencias,
    prioridad_busqueda = EXCLUDED.prioridad_busqueda,
    habilitada_mcp = EXCLUDED.habilitada_mcp,
    actualizado_en = now();

-- Elimina las funciones de búsqueda lexical de una versión anterior de este archivo.
DROP FUNCTION IF EXISTS public.buscar_tablas_datos(text, integer);
DROP FUNCTION IF EXISTS public.normalizar_texto_catalogo(text);

CREATE OR REPLACE FUNCTION public.listar_fuentes_datos()
RETURNS TABLE (
    esquema text,
    nombre_tabla text,
    tipo_tabla text,
    dominio text,
    descripcion text,
    granularidad text,
    fuente text,
    cobertura text
)
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
    SELECT c.esquema, c.nombre_tabla, c.tipo_tabla, c.dominio, c.descripcion,
           c.granularidad, c.fuente, c.cobertura
    FROM public.catalogo_tablas_datos c
    WHERE c.habilitada_mcp
      AND to_regclass(format('%I.%I', c.esquema, c.nombre_tabla)) IS NOT NULL
    ORDER BY c.prioridad_busqueda DESC, c.dominio, c.nombre_tabla;
$$;

COMMENT ON FUNCTION public.listar_fuentes_datos() IS
'Devuelve el índice compacto de fuentes que debe incluirse en el contexto inicial del LLM.';

CREATE OR REPLACE FUNCTION public.describir_tablas_datos(tablas text[])
RETURNS TABLE (
    esquema text,
    nombre_tabla text,
    tipo_tabla text,
    dominio text,
    subdominios text[],
    descripcion text,
    granularidad text,
    clave_territorial text,
    columnas_temporales jsonb,
    columnas_relevantes jsonb,
    relaciones jsonb,
    fuente text,
    cobertura text,
    advertencias text[]
)
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
    SELECT c.esquema, c.nombre_tabla, c.tipo_tabla, c.dominio, c.subdominios,
           c.descripcion, c.granularidad, c.clave_territorial, c.columnas_temporales,
           c.columnas_relevantes, c.relaciones, c.fuente, c.cobertura, c.advertencias
    FROM public.catalogo_tablas_datos c
    WHERE c.habilitada_mcp
      AND (
          c.nombre_tabla = ANY(coalesce(tablas, ARRAY[]::text[]))
          OR c.esquema || '.' || c.nombre_tabla = ANY(coalesce(tablas, ARRAY[]::text[]))
      )
      AND to_regclass(format('%I.%I', c.esquema, c.nombre_tabla)) IS NOT NULL
    ORDER BY c.prioridad_busqueda DESC, c.nombre_tabla;
$$;

COMMENT ON FUNCTION public.describir_tablas_datos(text[]) IS
'Devuelve columnas, relaciones y advertencias sólo para las tablas elegidas por el LLM.';

COMMIT;

-- Contexto inicial compacto:
-- SELECT * FROM public.listar_fuentes_datos();
--
-- Después de que el LLM elija las fuentes:
-- SELECT * FROM public.describir_tablas_datos(
--   ARRAY['tensor_concentracion', 'hospitalizaciones_febrero_2024', 'municipios']
-- );

-- Seguridad recomendada (ajustar el nombre del rol):
-- GRANT USAGE ON SCHEMA public TO mcp_lector;
-- GRANT SELECT ON public.catalogo_tablas_datos TO mcp_lector;
-- GRANT EXECUTE ON FUNCTION public.listar_fuentes_datos() TO mcp_lector;
-- GRANT EXECUTE ON FUNCTION public.describir_tablas_datos(text[]) TO mcp_lector;
