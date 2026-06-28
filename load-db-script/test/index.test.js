"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const YAML = require("yaml");
const {
  buildValidatedCte,
  normalizeDimensions,
  projectedCsvColumns,
  runLoggedOperation,
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

test("VISENT municipality dimension rejects missing or ambiguous names", () => {
  const antenas = profile("antenas");
  const dimensions = normalizeDimensions(antenas.dimensions);
  const headers = ["ecgi", "cluster", "municipio", "lat", "lon"];
  validateDimensions(headers, antenas.columns, dimensions);
  const sql = buildValidatedCte(antenas.columns, "public", "stg_antenas", antenas.target, dimensions);
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

test("hospital references use composite foreign keys", () => {
  const rd = profile("rd_202402");
  const specs = targetForeignKeys(rd.target, rd.columns, {});
  assert.equal(specs.length, 11);
  for (const spec of specs) {
    assert.equal(spec.generatedColumns.length, 1);
    assert.equal(spec.localColumns.length, 2);
    assert.deepEqual(spec.referencedColumns, ["variable", "codigo"]);
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
