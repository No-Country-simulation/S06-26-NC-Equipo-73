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
npm run start:data
```

Estos comandos son utiles cuando un import depende de tablas cargadas antes, como catalogos o dimensiones.

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

## Archivos De Datos

Las rutas de `csv.file_path` son relativas a la carpeta `load-db-script`, aunque el perfil este dentro de `imports/`.

Los archivos VISENT viven bajo `visent/small` y `visent/large`.

Los archivos externos viven bajo `external-sources/small` y `external-sources/large`. Los archivos grandes deben existir localmente con las rutas configuradas en cada perfil.

## Fuentes

RD202402: https://www.kaggle.com/datasets/andersonfranca/sistema-de-informaes-hospitalares-sus?select=RD202402.csv

tensor_mobilidade: https://github.com/wongola-bit/appbit/blob/main/dataset-visent/tensores/LARGE_FILES.md

CAGEDEST_012019: ftp://ftp.mtps.gov.br/pdet/microdados/