# Load DB Script

Importador configurable de CSV a PostgreSQL. El script lee perfiles definidos en `config.yaml`,
precarga los catalogos pequeños en memoria y normaliza/valida cada fila mientras transmite el CSV.
PostgreSQL recibe un staging ya normalizado y migra las filas validas con operaciones lineales.

## Requisitos

- Node.js 18 o superior.
- PostgreSQL corriendo.
- Dependencias instaladas:

```powershell
npm install
```

## Configuracion

La configuracion principal esta en `config.yaml`. Ese archivo solo debe contener la conexion, el import por defecto y la carpeta de perfiles:

```yaml
database:
  host: localhost
  port: 5432
  database: loaddb
  user: postgres
  password: password

default_import: municipios
imports_dir: imports
import_order:
  - municipios
  - clusters
  - antenas
```

Cada perfil vive en un archivo dentro de `imports/`. El nombre del archivo es el nombre del import. Por ejemplo:

```text
imports/municipios.yaml      -> --import municipios
imports/rd_202402.yaml       -> --import rd_202402
```

Cada perfil define:

- `csv`: ruta, encoding y delimitador del archivo.
- `staging`: tabla temporal de carga.
- `target`: tabla destino y modo de carga.
- `columns`: columnas del CSV que se validan y migran.
- `dimensions`: tablas de referencia usadas para convertir valores de texto a codigos.
- `load`: opciones de ejecucion, como `dry_run`, `load_only`, `debug` y `max_rows`.

Durante una carga normal, Node resuelve tipos, transformaciones, minimos/maximos, referencias,
lookups y dimensiones mediante mapas en memoria. El staging contiene las columnas destino ya
normalizadas y tres columnas tecnicas: `fuente`, `datos_fila` y `errores_validacion`. `datos_fila` solo
se almacena para filas rechazadas. El encabezado completo sigue validandose, pero los campos no
configurados no se materializan ni se envian a PostgreSQL. En `load_only` se conservan todas las
columnas porque ese modo carga el CSV completo deliberadamente.

Cada fila migrada a una tabla destino incluye tambien la columna `fuente`, cuyo valor es el nombre
del archivo CSV de origen, incluida la extension (por ejemplo, `clusters.csv`).

Este diseño evita consultas correlacionadas por fila y evita calcular las mismas validaciones una
vez para errores y otra vez para la migracion. PostgreSQL conserva las FK como ultima proteccion.

Por defecto, los imports se ejecutan aunque la tabla destino ya exista. En `target` se puede usar
`skip_if_exists: true` para omitir explicitamente un import cuando la tabla destino ya existe:

```yaml
target:
  schema: public
  table: municipios
  mode: replace
  skip_if_exists: true
```

Esta verificacion mira solo si la tabla existe. Una tabla vacia tambien sera omitida si `skip_if_exists` esta activo.

Para consultas frecuentes sobre tablas grandes, `target.indexes` permite crear indices compuestos
despues de terminar la carga y validar las FK:

```yaml
target:
  schema: public
  table: tensor_concentracion
  mode: replace
  indexes:
    - [fecha, periodo, nombre_zona]
```

En cargas por chunks, estos indices se construyen sobre la tabla sombra antes del intercambio final.

Las reglas `references` descartan las filas cuya referencia no existe y crean claves foraneas en
la tabla destino. Cuando `references.where` contiene un discriminador fijo, el importador crea una
columna generada y una FK compuesta. Esto permite, por ejemplo, referenciar
`codigos_hospitalarios(variable, codigo)` desde los campos de RD.

Una columna puede obtener su valor destino mediante `lookup` cuando el valor debe derivarse de otra
columna del CSV. Las dimensiones sin `create_missing` solo aceptan valores que resuelvan exactamente
una fila: una dimension inexistente o ambigua se registra como error y se descarta.

```yaml
categoria:
  target: categoria_codigo
  lookup:
    schema: public
    table: categorias
    source_column: categoria_nombre
    match_column: nombre
    value_column: codigo
    transform: upper_trim
```

En `staging`, `drop_after_load: true` elimina la tabla staging al terminar una importacion exitosa:

```yaml
staging:
  schema: public
  table: temporal_municipios
  truncate_before_load: true
  drop_after_load: true
```

Si la importacion falla, la tabla staging no se elimina.

Tambien puede sobrescribirse por comando:

```powershell
node src\index.js --database-url "postgresql://user:password@localhost:5432/loaddb"
```

## Ejecucion

Ejecutar el import por defecto:

```powershell
npm run start
```

Ejecutar un perfil especifico:

```powershell
node src\index.js --import municipios
```

Ejecutar todos los perfiles en el orden definido por `import_order`:

```powershell
node src\index.js --all
```

En cargas `--all`, las tablas con `mode: replace` existentes se truncan juntas antes de comenzar.
Esto permite recargar tablas padre e hijas con claves foraneas sin usar `CASCADE`. La recarga aislada
de una tabla padre puede ser rechazada por PostgreSQL si conserva tablas hijas con datos; en ese caso
debe ejecutarse la carga compuesta.

Validar sin insertar datos:

```powershell
node src\index.js --import municipios --dry-run
```

Cargar solo staging, sin validar ni migrar a destino:

```powershell
node src\index.js --import municipios --load-only
```

Usar otro archivo de configuracion:

```powershell
node src\index.js --config otro-config.yaml --import municipios
```

Sobrescribir el CSV configurado para un perfil:

```powershell
node src\index.js .\ruta\archivo.csv --import municipios
```

## Cargas Compuestas

Hay comandos npm para ejecutar grupos de imports en orden:

```powershell
npm run start:prod
```

Estos comandos son utiles cuando un import depende de tablas cargadas antes, como catalogos o dimensiones.
El orden de carga se define en `config.yaml`, dentro de `import_order`.

## Pruebas Con Muestras

Para probar archivos grandes sin procesarlos completos, configura `max_rows` en el bloque `load` del import:

```yaml
load:
  dry_run: false
  load_only: false
  max_rows: 1000
  debug: true
  debug_every_rows: 100000
  progress_every_seconds: 30
```

Si `max_rows` no esta definido, se procesan todas las filas del CSV.

Con `debug: true`, cada operacion larga informa inicio, heartbeat, duracion y finalizacion. El
heartbeat consulta `pg_stat_activity` para mostrar esperas y PIDs bloqueadores. Durante
`CREATE INDEX`, tambien usa `pg_stat_progress_create_index` para mostrar fase y porcentaje. COPY
informa filas, porcentaje por bytes, filas por segundo y tiempo estimado. La frecuencia del
heartbeat se controla con `progress_every_seconds` y por defecto es 30 segundos.

Para archivos que no caben de forma segura en una sola transaccion, `load.chunk_rows` activa una
carga generica mediante tabla sombra. Cada chunk se confirma por separado y se reintenta con una
conexion nueva cuando ocurre un error recuperable de red o conexion:

```yaml
load:
  chunk_rows: 100000
  chunk_retries: 3
```

Al ejecutar un import individual, la tabla destino se conserva hasta que todos los chunks, indices
y FK terminan correctamente. El intercambio final se hace en una transaccion corta. Esta estrategia
requiere `target.mode: replace` y se rechaza si la tabla destino tiene FK entrantes o vistas
dependientes. Si la carga individual falla, la tabla productiva permanece intacta y la tabla sombra
queda disponible para diagnostico. Con `--all`, la truncacion coordinada conserva el comportamiento
existente y vacia previamente los destinos para poder recargar tablas relacionadas sin bloqueos FK.

Tambien existe un comando de test. En modo test, cualquier import sin `load.max_rows` queda limitado a 10000 filas:

```powershell
npm run start:test
```

Las pruebas unitarias del importador se ejecutan con:

```powershell
npm test
```

Equivale a:

```powershell
node src\index.js --all --mode test
```

En produccion se cargan todas las filas:

```powershell
npm run start:prod
```

`npm run start` es un alias de `npm run start:prod`.

Prioridad del limite de filas:

1. `load.max_rows` en el YAML del import.
2. `--mode test`, que usa 10000 filas.
3. Sin limite, se cargan todas las filas.

## Archivos De Datos

Las rutas de `csv.file_path` son relativas a la carpeta `load-db-script`, aunque el perfil este dentro de `imports/`.

Los archivos VISENT viven bajo `visent/small` y `visent/large`.

Los archivos externos viven bajo `external-sources/small` y `external-sources/large`. Los archivos grandes deben existir localmente con las rutas configuradas en cada perfil.

## Fuentes externas

RD202402: https://www.kaggle.com/datasets/andersonfranca/sistema-de-informaes-hospitalares-sus?select=RD202402.csv

tensor_mobilidade: https://github.com/wongola-bit/appbit/blob/main/dataset-visent/tensores/LARGE_FILES.md

CAGEDEST_012019: ftp://ftp.mtps.gov.br/pdet/microdados/
