"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const YAML = require("yaml");
const { parse: parseCsv } = require("csv-parse/sync");
const {
  buildValidatedCte,
  normalizeAndValidateRecord,
  normalizeDimensions,
  normalizePrimitiveValue,
  projectedCsvColumns,
  runLoggedOperation,
  sourceNameFromCsvPath,
  targetForeignKeys,
  validateDimensions
} = require("../src/index");

const root = path.resolve(__dirname, "..");

function profile(name) {
  return YAML.parse(fs.readFileSync(path.join(root, "imports", `${name}.yaml`), "utf8"));
}

test("projected staging keeps only configured columns", () => {
  const cursos = profile("cursos");
  const headers = ["NU_ANO_CENSO", "TP_DIMENSAO", "CO_CURSO", "NO_CURSO"];
  const rules = {
    NU_ANO_CENSO: cursos.columns.NU_ANO_CENSO,
    CO_CURSO: cursos.columns.CO_CURSO,
    NO_CURSO: cursos.columns.NO_CURSO
  };
  assert.deepEqual(projectedCsvColumns(headers, rules, {}, false), ["NU_ANO_CENSO", "CO_CURSO", "NO_CURSO"]);
  assert.deepEqual(projectedCsvColumns(headers, rules, {}, true), headers);
});

test("source uses the CSV file name including its extension", () => {
  assert.equal(sourceNameFromCsvPath(path.join("datos", "tensor_mobilidade.csv")), "tensor_mobilidade.csv");
});

test("VISENT municipality dimension rejects missing or ambiguous names", () => {
  const antenas = profile("antenas");
  const dimensions = normalizeDimensions(antenas.dimensions);
  const headers = ["ecgi", "cluster", "municipio", "lat", "lon"];
  validateDimensions(headers, antenas.columns, dimensions);
  const sql = buildValidatedCte(antenas.columns, "public", "temporal_antenas", antenas.target, dimensions);
  assert.match(sql, /municipio dimension inexistente o ambigua/);
  assert.match(sql, /SELECT count\(\*\) FROM "public"\."municipios"/);
  assert.equal(antenas.columns.municipio.lookup, undefined);
});

test("foreign keys are generated for direct references and dimensions", () => {
  const expected = { clusters: 1, antenas: 2, tensor_concentracao: 3, mobilidade: 3, cagedest_012019: 3 };
  for (const [name, count] of Object.entries(expected)) {
    const current = profile(name);
    const specs = targetForeignKeys(current.target, current.columns, normalizeDimensions(current.dimensions));
    assert.equal(specs.length, count, name);
  }
});

test("database tables use the agreed Spanish names", () => {
  const expected = {
    municipios: "municipios",
    clusters: "zonas",
    antenas: "antenas",
    assinantes: "suscriptores",
    tensor_concentracao: "tensor_concentracion",
    mobilidade: "movilidad",
    trajetos_comuns: "trayectos_comunes",
    cursos: "cursos_2024",
    ocupaciones_cbo: "ocupaciones_cbo",
    clases_cnae: "clases_cnae",
    subclases_cnae: "subclases_cnae",
    cagedest_012019: "movimientos_laborales_201901",
    codigos_hospitalares: "codigos_hospitalarios",
    rd_202402: "hospitalizaciones_febrero_2024"
  };

  for (const [name, table] of Object.entries(expected)) {
    const current = profile(name);
    assert.equal(current.target.table, table, name);
    assert.match(current.staging.table, /^temporal_/, name);
    assert.equal(current.errors.table, "errores_importacion", name);
  }
});

test("hospital references use composite foreign keys", () => {
  const rd = profile("rd_202402");
  const specs = targetForeignKeys(rd.target, rd.columns, {});
  assert.equal(specs.length, 13);
  const catalogSpecs = specs.filter((spec) => spec.referencedTable === "codigos_hospitalarios");
  const municipalitySpecs = specs.filter((spec) => spec.referencedTable === "municipios");
  assert.equal(catalogSpecs.length, 11);
  assert.equal(municipalitySpecs.length, 2);
  for (const spec of catalogSpecs) {
    assert.equal(spec.generatedColumns.length, 1);
    assert.equal(spec.localColumns.length, 2);
    assert.deepEqual(spec.referencedColumns, ["variable", "codigo"]);
  }
  for (const spec of municipalitySpecs) {
    assert.equal(spec.generatedColumns.length, 0);
    assert.deepEqual(spec.referencedColumns, ["codigo_municipio_ibge"]);
  }
});

test("long operations emit heartbeat and duration logs", async () => {
  const messages = [];
  const logger = { enabled: true, info: (message, details) => messages.push({ message, details }) };
  await runLoggedOperation({
    logger,
    label: "Test operation",
    intervalMs: 10,
    operation: () => new Promise((resolve) => setTimeout(resolve, 35))
  });
  assert.equal(messages[0].message, "Test operation started");
  assert.ok(messages.some(({ message }) => message === "Test operation in progress"));
  assert.equal(messages.at(-1).message, "Test operation completed");
  assert.equal(typeof messages.at(-1).details.elapsedSeconds, "number");
});

test("streaming validation normalizes a mobility row with O(1) catalogs", () => {
  const mobility = profile("mobilidade");
  const dimensions = normalizeDimensions(mobility.dimensions);
  const file = fs.openSync(path.join(root, "visent", "large", "tensor_mobilidade.csv"), "r");
  const buffer = Buffer.alloc(8192);
  const bytesRead = fs.readSync(file, buffer, 0, buffer.length, 0);
  fs.closeSync(file);
  const sample = buffer.subarray(0, bytesRead).toString("utf8").split(/\r?\n/).slice(0, 2).join("\n");
  const record = parseCsv(sample, { columns: true })[0];
  const runtime = {
    references: new Map([
      ["ecgi", new Map([[record.ecgi, [record.ecgi]]])],
      ["cluster", new Map([[record.cluster, [record.cluster]]])]
    ]),
    dimensions: new Map([
      ["municipio", {
        dimension: dimensions.municipios,
        map: new Map([["florianopolis", ["4205407"]]])
      }]
    ]),
    lookups: new Map(),
    uniqueCsv: new Map()
  };
  const result = normalizeAndValidateRecord(record, mobility.columns, dimensions, runtime);
  assert.deepEqual(result.errors, []);
  assert.equal(result.values.codigo_municipio, "4205407");
  assert.equal(result.values.fecha, "2026-03-01");
  assert.equal(result.values.bytes_descarga, record.download_bytes);
});

test("streaming validation rejects missing references and ambiguous dimensions", () => {
  const antennas = profile("antenas");
  const dimensions = normalizeDimensions(antennas.dimensions);
  const record = { ecgi: "1", cluster: "UNKNOWN", municipio: "Bom Jesus", lat: "-27.5", lon: "-48.5" };
  const runtime = {
    references: new Map([["cluster", new Map()]]),
    dimensions: new Map([["municipio", {
      dimension: dimensions.municipios,
      map: new Map([["bom jesus", ["1", "2"]]])
    }]]),
    lookups: new Map(),
    uniqueCsv: new Map()
  };
  const result = normalizeAndValidateRecord(record, antennas.columns, dimensions, runtime);
  assert.ok(result.errors.includes("cluster referencia inexistente o ambigua"));
  assert.ok(result.errors.includes("municipio dimension inexistente o ambigua"));
});

test("a lookup disambiguates municipality names", () => {
  const subscribers = profile("assinantes");
  const dimensions = normalizeDimensions(subscribers.dimensions);
  const record = {
    assinante_hash: "1",
    home_cluster: "ANTONIO_CARLOS",
    home_municipio: "Antônio Carlos",
    income_cluster: "A",
    age_group: "25-34",
    mobility_pattern: "INTENSA",
    flag_flagship: "0"
  };
  const runtime = {
    references: new Map([["home_cluster", new Map([["ANTONIO_CARLOS", ["ANTONIO_CARLOS"]]])]]),
    dimensions: new Map([["home_municipio", {
      dimension: dimensions.municipios,
      map: new Map([["antonio carlos", ["3102902", "4201208"]]])
    }]]),
    lookups: new Map([["home_municipio", {
      lookup: { sourceColumn: "home_cluster", transform: "ascii_upper_trim", type: "text" },
      map: new Map([["ANTONIO_CARLOS", ["4201208"]]])
    }]]),
    uniqueCsv: new Map()
  };
  const result = normalizeAndValidateRecord(record, subscribers.columns, dimensions, runtime);
  assert.deepEqual(result.errors, []);
  assert.equal(result.values.zona_residencia, "ANTONIO_CARLOS");
  assert.equal(result.values.codigo_municipio_residencia, "4201208");
});

test("streaming primitive normalization validates real dates and decimal commas", () => {
  assert.deepEqual(normalizePrimitiveValue("20240229", "date_yyyymmdd", "date"), { value: "2024-02-29", valid: true });
  assert.equal(normalizePrimitiveValue("20230229", "date_yyyymmdd", "date").valid, false);
  assert.deepEqual(normalizePrimitiveValue("123,45", "numeric_comma", "numeric"), { value: "123.45", valid: true });
  assert.deepEqual(normalizePrimitiveValue("0013", undefined, "integer"), { value: "13", valid: true });
  assert.deepEqual(normalizePrimitiveValue("1200203", "ibge_without_check_digit", "integer"), { value: "120020", valid: true });
  assert.equal(normalizePrimitiveValue("120020", "ibge_without_check_digit", "integer").valid, false);
});
