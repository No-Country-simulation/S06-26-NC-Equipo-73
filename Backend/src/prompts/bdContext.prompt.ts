export const DB_SCHEMA_CONTEXT = `
    ESQUEMA DE LA BASE DE DATOS (PostgreSQL)

    A continuación se detallan las tablas disponibles, sus columnas y tipos de datos.
    Usa ÚNICAMENTE estas tablas y columnas para construir consultas SQL. No inventes nombres de tablas o columnas que no estén aquí.

    ---

    TABLA: antenas
    Descripción: Ubicación geográfica de antenas de telecomunicaciones (ERB).
    - ecgi (bigint) — identificador único de la antena
    - nombre_zona (text)
    - codigo_municipio (integer)
    - latitud (numeric)
    - longitud (numeric)
    - fuente (text)
    
    ---
    
    TABLA: zonas
    Descripción: Catálogo de zonas geográficas con perfil descriptivo.
    - nombre_zona (text)
    - codigo_municipio (integer)
    - latitud (numeric)
    - longitud (numeric)
    - descripcion_perfil (text)
    - fuente (text)

    ---

    TABLA: municipios
    Descripción: Catálogo de municipios.
    - codigo_municipio_tom (integer)
    - codigo_municipio_ibge (integer)
    - nombre_municipio_tom (text)
    - nombre_municipio (text)
    - codigo_uf (text) — estado/provincia
    - fuente (text)

    ---

    TABLA: movilidad
    Descripción: Eventos de uso de red móvil por suscriptor (datos, voz, SMS, congestión) por zona y fecha.
    - hash_suscriptor (bigint)
    - fecha (date)
    - ecgi (bigint) — relaciona con antenas.ecgi
    - nombre_zona (text)
    - codigo_municipio (integer)
    - tipo_rg (text), tipo_rat (text), periodo_sesion (text)
    - cantidad_sesiones (integer)
    - duracion_total_segundos (integer)
    - bytes_descarga (bigint), bytes_subida (bigint)
    - porcentaje_caidas (numeric) — calidad de cobertura
    - congestion (numeric) — nivel de congestión de red
    - cantidad_llamadas (integer), duracion_conversacion_segundos (integer)
    - tasa_completado_voz (numeric), congestion_voz (numeric)
    - cantidad_mensajes (integer), tasa_completado_sms (numeric), congestion_sms (numeric)
    - cantidad_rg_transmision/juegos/social/comunicacion/otros (integer) — uso por categoría de app
    - segmento_ingresos (text), grupo_edad (text)
    - indicador_dispositivo_insignia (integer)
    - fuente (text)

    ---

    TABLA: tensor_concentracion
    Descripción: Concentración agregada de usuarios y actividad de red por zona y fecha/periodo (útil para detectar densidad poblacional y calidad de cobertura).
    - ecgi (bigint), nombre_zona (text), codigo_municipio (integer)
    - fecha (date), periodo (text)
    - cantidad_usuarios (integer) — concentración de personas
    - cantidad_sesiones (integer)
    - bytes_descarga (bigint), bytes_subida (bigint)
    - duracion_promedio_segundos (numeric)
    - porcentaje_caidas_promedio (numeric)
    - congestion_promedio (numeric)
    - total_llamadas (integer), total_mensajes (integer)
    - latitud (numeric), longitud (numeric)
    - fuente (text)

    ---

    TABLA: suscriptores
    Descripción: Perfil de cada suscriptor (sin datos de eventos, datos demográficos y patrón de movilidad).
    - hash_suscriptor (bigint)
    - zona_residencia (text)
    - codigo_municipio_residencia (integer)
    - segmento_ingresos (text)
    - grupo_edad (text)
    - patron_movilidad (text)
    - indicador_dispositivo_insignia (integer)
    - fuente (text)

    ---

    TABLA: trayectos_comunes
    Descripción: Trayectos/desplazamientos frecuentes entre zonas (origen-destino).
    - zona_origen (text), codigo_municipio_origen (integer), latitud_origen (numeric), longitud_origen (numeric)
    - zona_destino (text), codigo_municipio_destino (integer), latitud_destino (numeric), longitud_destino (numeric)
    - misma_zona (integer) — booleano (0/1)
    - cantidad_usuarios (integer), cantidad_viajes (integer)
    - distancia_media_km (numeric)
    - periodo_predominante (text)
    - fuente (text)

    ---

    TABLA: cursos_2024
    Descripción: Oferta de cursos/formación académica por región y municipio, año 2024. Clave para el eje "Formaciones".
    - anio_censo (integer)
    - nombre_region (text), codigo_region (integer)
    - nombre_estado (text), sigla_uf (text), codigo_uf (integer)
    - nombre_municipio (text), codigo_municipio (integer), es_capital (integer)
    - codigo_institucion (integer), codigo_curso (integer), nombre_curso (text)
    - tipo_organizacion_academica (integer), tipo_red (integer), categoria_administrativa (integer)
    - nombre_clasificacion_cine (text), codigo_clasificacion_cine (text)
    - area_general_cine (text), area_especifica_cine (text), area_detallada_cine (text)
    - grado_academico (integer), es_gratuito (integer), modalidad_ensenanza (integer), nivel_academico (integer)
    - cantidad_cursos (integer)
    - vacantes_total (integer), inscritos_total (integer), ingresantes_total (integer)
    - matriculados_total (integer), concluyentes_total (integer)
    - matriculas_suspendidas (integer), desvinculados (integer), transferidos (integer), fallecidos (integer)
    - fuente (text)

    ---

    TABLA: movimientos_laborales_201901
    Descripción: Movimientos de alta/baja laboral (enero 2019). Clave para el eje "Empleabilidad". Solo cubre este período.
    - tipo_alta_baja_laboral (text)
    - periodo_declarado (integer), anio_declarado (integer)
    - codigo_ocupacion_cbo_2002 (text)
    - codigo_clase_cnae_version_1/2 (text), codigo_subclase_cnae_version_2 (text)
    - tramo_empleo_inicio_enero (text)
    - grado_instruccion (text)
    - horas_contratadas (integer)
    - subsector_ibge (text)
    - edad (integer), sexo (text), raza_color (text)
    - es_aprendiz (integer), tiene_discapacidad (integer), tipo_discapacidad (text)
    - salario_mensual (numeric)
    - balance_movimiento (integer) — +1 alta, -1 baja (verificar según datos)
    - tiempo_empleo (numeric)
    - tipo_establecimiento (text)
    - tipo_movimiento_desagregado (text)
    - codigo_uf (integer), mesorregion (text), microrregion (text)
    - trabajo_parcial (integer), trabajo_intermitente (integer)
    - fuente (text)

    ---

    TABLA: hospitalizaciones_febrero_2024
    Descripción: Registros de hospitalización (febrero 2024). Clave para el eje "Salud Mental" (cruzando diagnóstico). Solo cubre este período.
    - codigo_gestor_territorial (integer), anio_competencia (integer), mes_competencia (integer)
    - codigo_especialidad_cama (integer)
    - cnpj_hospital (text), numero_aih (text), codigo_tipo_aih (integer)
    - cep (text), codigo_municipio_residencia (integer)
    - fecha_nacimiento (date), edad (integer), codigo_sexo (integer), nacionalidad (text)
    - procedimiento_solicitado (text), procedimiento_realizado (text)
    - valor_servicios_hospitalarios/profesionales/diagnostico_tratamiento (numeric)
    - valor_total (numeric), valor_unidad_cuidados_intensivos (numeric), valor_total_dolares (numeric)
    - fecha_internacion (date), fecha_salida (date)
    - diagnostico_principal (text), diagnostico_secundario (text) — usar para filtrar temas de salud mental
    - codigo_motivo_salida_permanencia (integer)
    - naturaleza (text), naturaleza_juridica (text)
    - codigo_tipo_gestion_hospital (integer)
    - codigo_municipio_movimiento (integer)
    - codigo_unidad_edad (integer), dias_permanencia (integer)
    - codigo_indicador_muerte (integer)
    - codigo_caracter_hospitalizacion (integer), codigo_instruccion (integer)
    - codigo_anticonceptivo_1 (integer), codigo_raza_color (integer)
    - codigo_cnes (text), codigo_complejidad (text), codigo_financiamiento (text)
    - fuente (text)
    - Nota: columnas "referencia_*" contienen el texto descriptivo de los códigos numéricos de esta misma tabla (ej: referencia_codigo_sexo_variable_4fad5ab4 describe codigo_sexo).

    ---

    TABLA: codigos_hospitalarios
    Descripción: Diccionario de códigos usados en hospitalizaciones_febrero_2024.
    - variable (text), descripcion (text), codigo (integer), etiqueta (text)
    - fuente (text)

    ---

    TABLA: clases_cnae
    Descripción: Catálogo de clases de actividad económica (CNAE), usado en movimientos_laborales_201901.
    - codigo_clase (text), nombre_clase (text)
    - fuente (text)

    ---

    TABLA: subclases_cnae
    Descripción: Catálogo de subclases de actividad económica (CNAE).
    - codigo_subclase (text), nombre_subclase (text)
    - fuente (text)

    ---

    TABLA: ocupaciones_cbo
    Descripción: Catálogo de ocupaciones (CBO), usado en movimientos_laborales_201901.
    - codigo_ocupacion (text), nombre_ocupacion (text)
    - fuente (text)

    ---

    RELACIONES ÚTILES ENTRE TABLAS:
    - antenas.ecgi = movilidad.ecgi = tensor_concentracion.ecgi
    - movilidad.codigo_municipio = municipios.codigo_municipio_ibge = cursos_2024.codigo_municipio = hospitalizaciones_febrero_2024.codigo_municipio_residencia
    - movimientos_laborales_201901.codigo_ocupacion_cbo_2002 = ocupaciones_cbo.codigo_ocupacion
    - movimientos_laborales_201901.codigo_clase_cnae_version_1/2 = clases_cnae.codigo_clase
    - hospitalizaciones_febrero_2024.* códigos numéricos → ver codigos_hospitalarios para su significado

    REGLAS PARA GENERAR SQL:
    1. Genera ÚNICAMENTE sentencias SELECT. Nunca generes INSERT, UPDATE, DELETE, DROP, ALTER ni TRUNCATE.
    2. Siempre incluye un LIMIT razonable (máximo 200 filas) salvo que el usuario pida explícitamente un agregado (COUNT, SUM, AVG) que devuelva pocas filas.
    3. Usa JOIN cuando la pregunta requiera cruzar información de más de una tabla (ej: movilidad con zonas, o empleo con ocupaciones).
    4. Si una columna de fecha está limitada a un único período (como hospitalizaciones_febrero_2024 o movimientos_laborales_201901), acláralo en la respuesta final al usuario para que no asuma que el dato es histórico completo.
    5. Si la pregunta es ambigua respecto a qué tabla usar, prioriza la combinación de tablas que más se ajuste a los 5 ejes del proyecto: Formaciones (cursos_2024), Empleabilidad (movimientos_laborales_201901), Salud Mental (hospitalizaciones_febrero_2024), y Conectividad/Movilidad (antenas, movilidad, tensor_concentracion, trayectos_comunes, suscriptores).
`;