# Load DB Script

Importador configurable de CSV a PostgreSQL. El script lee perfiles definidos en `config.yaml`, carga el CSV a una tabla de staging y, si hay reglas de columnas, valida y migra las filas válidas a una tabla destino.

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

En `staging`, `drop_after_load: true` elimina la tabla staging al terminar una importacion exitosa:

```yaml
staging:
  schema: public
  table: stg_municipios
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
```

Si `max_rows` no esta definido, se procesan todas las filas del CSV.

Tambien existe un comando de test. En modo test, cualquier import sin `load.max_rows` queda limitado a 10000 filas:

```powershell
npm run start:test
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
