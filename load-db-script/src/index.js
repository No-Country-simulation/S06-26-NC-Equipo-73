#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");
const readline = require("node:readline");
const { Readable, Transform } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const { parse } = require("csv-parse");
const { Client } = require("pg");
const { from: copyFrom } = require("pg-copy-streams");
const YAML = require("yaml");

const DEFAULT_CONFIG_FILE = "config.yaml";
const DEFAULT_SCHEMA = "public";
const DEFAULT_ERRORS_TABLE = "import_errors";
const SOURCE_COLUMN = "source";

const EMAIL_REGEX = "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$";
const INTEGER_REGEX = "^[+-]?[0-9]+$";
const NUMERIC_REGEX = "^[+-]?[0-9]+([,.][0-9]+)?$";
const DATE_YMD_REGEX = "^[0-9]{4}-[0-9]{2}-[0-9]{2}$";
const DATE_YYYYMMDD_REGEX = "^[0-9]{8}$";

function parseBool(value) {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return false;
  return ["1", "true", "yes", "y", "si", "s"].includes(String(value).trim().toLowerCase());
}

function parseArgs(argv) {
  const args = {
    config: process.env.CONFIG_FILE || DEFAULT_CONFIG_FILE,
    importName: undefined,
    csvFile: undefined,
    databaseUrl: undefined,
    dryRun: false,
    loadOnly: false,
    debug: false,
    all: false,
    mode: undefined
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--config") {
      args.config = requireValue(argv, (index += 1), "--config");
    } else if (arg === "--import") {
      args.importName = requireValue(argv, (index += 1), "--import");
    } else if (arg === "--all") {
      args.all = true;
    } else if (arg === "--database-url") {
      args.databaseUrl = requireValue(argv, (index += 1), "--database-url");
    } else if (arg === "--mode") {
      args.mode = requireValue(argv, (index += 1), "--mode").trim().toLowerCase();
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--load-only") {
      args.loadOnly = true;
    } else if (arg === "--debug") {
      args.debug = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (!args.csvFile) {
      args.csvFile = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (args.all && args.importName) {
    throw new Error("--all cannot be combined with --import.");
  }
  if (args.all && args.csvFile) {
    throw new Error("--all cannot be combined with a CSV file override.");
  }
  if (args.mode && !["test", "production", "prod"].includes(args.mode)) {
    throw new Error("--mode must be 'test' or 'production'.");
  }

  return args;
}

function requireValue(argv, index, optionName) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${optionName} requires a value.`);
  }
  return value;
}

function printHelp() {
  console.log(`
Usage:
  node src/index.js [csv_file] [options]

Options:
  --config <path>        YAML config path. Default: config.yaml
  --import <name>        Import profile under imports
  --all                  Run all imports in config.import_order
  --database-url <url>   PostgreSQL connection URL override
  --mode <mode>          Load mode: test limits rows to 10000; production loads all
  --dry-run              Validate config and CSV without inserting
  --load-only            Load staging without validation/migration
  --debug                Print detailed progress logs
`);
}

function createLogger(enabled) {
  return {
    enabled: Boolean(enabled),
    info(message, details = undefined) {
      if (!enabled) return;
      const prefix = `[${new Date().toISOString()}] [debug]`;
      if (details === undefined) {
        console.log(`${prefix} ${message}`);
      } else {
        console.log(`${prefix} ${message}`, details);
      }
    }
  };
}

function elapsedSeconds(startedAt) {
  return Math.round((Date.now() - startedAt) / 1000);
}

async function createProgressMonitor(databaseUrl, logger) {
  if (!logger.enabled) return undefined;
  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    return client;
  } catch (error) {
    logger.info("PostgreSQL progress monitor unavailable", { error: error.message });
    try { await client.end(); } catch { /* connection was not established */ }
    return undefined;
  }
}

async function readBackendProgress(monitorClient, backendPid, includeIndexProgress) {
  if (!monitorClient || !backendPid) return {};
  const activity = await monitorClient.query(
    `SELECT state, wait_event_type, wait_event, pg_blocking_pids(pid) AS blocking_pids
     FROM pg_stat_activity WHERE pid = $1;`,
    [backendPid]
  );
  const row = activity.rows[0] || {};
  const details = {
    postgresState: row.state,
    waitEventType: row.wait_event_type || undefined,
    waitEvent: row.wait_event || undefined,
    blockingPids: row.blocking_pids?.length ? row.blocking_pids : undefined
  };

  if (includeIndexProgress) {
    const progress = await monitorClient.query(
      `SELECT phase, lockers_total, lockers_done, blocks_total, blocks_done,
              tuples_total, tuples_done
       FROM pg_stat_progress_create_index WHERE pid = $1;`,
      [backendPid]
    );
    const index = progress.rows[0];
    if (index) {
      details.indexPhase = index.phase;
      const candidates = [
        [Number(index.blocks_total), Number(index.blocks_done)],
        [Number(index.tuples_total), Number(index.tuples_done)],
        [Number(index.lockers_total), Number(index.lockers_done)]
      ];
      const [total, done] = candidates.find(([candidateTotal]) => candidateTotal > 0) || [0, 0];
      if (total > 0) details.percent = Number(((done / total) * 100).toFixed(1));
    }
  }
  return details;
}

async function runLoggedOperation({
  logger,
  label,
  operation,
  intervalMs,
  monitorClient,
  backendPid,
  includeIndexProgress = false,
  details = undefined
}) {
  const startedAt = Date.now();
  logger.info(`${label} started`, details);
  let active = true;
  let tickRunning = false;
  let activeTick;
  let monitorErrorReported = false;
  const tick = async () => {
    if (!active || tickRunning) return;
    tickRunning = true;
    try {
      const databaseProgress = await readBackendProgress(monitorClient, backendPid, includeIndexProgress);
      if (active) logger.info(`${label} in progress`, { elapsedSeconds: elapsedSeconds(startedAt), ...databaseProgress });
    } catch (error) {
      if (active && !monitorErrorReported) {
        logger.info(`${label} progress monitor failed`, { error: error.message });
        monitorErrorReported = true;
      }
    } finally {
      tickRunning = false;
    }
  };
  const timer = logger.enabled ? setInterval(() => { activeTick = tick(); }, intervalMs) : undefined;
  timer?.unref();
  try {
    const result = await operation();
    logger.info(`${label} completed`, { elapsedSeconds: elapsedSeconds(startedAt) });
    return result;
  } catch (error) {
    logger.info(`${label} failed`, { elapsedSeconds: elapsedSeconds(startedAt), error: error.message });
    throw error;
  } finally {
    active = false;
    if (timer) clearInterval(timer);
    if (activeTick) await activeTick;
  }
}

function loadConfig(configPath) {
  const absolutePath = path.resolve(configPath || DEFAULT_CONFIG_FILE);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Config file not found: ${absolutePath}`);
  }

  const configDir = path.dirname(absolutePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const config = YAML.parse(raw) || {};
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("The YAML config root must be a mapping/object.");
  }

  if (config.imports_dir) {
    config.imports = {
      ...(config.imports || {}),
      ...loadImportsDir(configDir, String(config.imports_dir))
    };
  }

  return { config, configDir };
}

function loadImportsDir(configDir, importsDir) {
  const absoluteImportsDir = path.resolve(configDir, importsDir);
  if (!fs.existsSync(absoluteImportsDir)) {
    throw new Error(`imports_dir not found: ${absoluteImportsDir}`);
  }
  if (!fs.statSync(absoluteImportsDir).isDirectory()) {
    throw new Error(`imports_dir is not a directory: ${absoluteImportsDir}`);
  }

  const imports = {};
  const files = fs.readdirSync(absoluteImportsDir)
    .filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"))
    .sort((left, right) => left.localeCompare(right));

  for (const file of files) {
    const importName = path.basename(file, path.extname(file));
    if (importName in imports) {
      throw new Error(`Duplicate import profile '${importName}' in imports_dir.`);
    }

    const importPath = path.join(absoluteImportsDir, file);
    const raw = fs.readFileSync(importPath, "utf8");
    const profile = YAML.parse(raw) || {};
    imports[importName] = ensureObject(profile, `imports_dir.${file}`);
  }

  return imports;
}

function getConfigValue(config, dottedKey, defaultValue = undefined) {
  return dottedKey.split(".").reduce((current, part) => {
    if (!current || typeof current !== "object" || !(part in current)) return undefined;
    return current[part];
  }, config) ?? defaultValue;
}

function coalesce(...values) {
  return values.find((value) => value !== null && value !== undefined);
}

function parseOptionalPositiveInteger(value, name) {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer when configured.`);
  }
  return parsed;
}

function resolveMaxRows(loadCfg, mode) {
  const configuredMaxRows = parseOptionalPositiveInteger(loadCfg.max_rows, "load.max_rows");
  if (configuredMaxRows !== undefined) return configuredMaxRows;

  const loadMode = String(mode || process.env.LOAD_DB_MODE || "").trim().toLowerCase();
  if (loadMode === "test") return 10000;

  return undefined;
}

function normalizeEncoding(value) {
  const encoding = String(value || "utf8").toLowerCase();
  if (encoding === "utf-8-sig" || encoding === "utf-8") return "utf8";
  return encoding;
}

function buildDatabaseUrl(config) {
  const explicitUrl = getConfigValue(config, "database.url");
  if (explicitUrl) return String(explicitUrl);

  const host = getConfigValue(config, "database.host");
  const database = getConfigValue(config, "database.database");
  const user = getConfigValue(config, "database.user");
  const password = getConfigValue(config, "database.password");
  if (![host, database, user, password].every(Boolean)) return undefined;

  const port = getConfigValue(config, "database.port", 5432);
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

function ensureObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be a mapping/object.`);
  }
  return value;
}

function getImportProfile(config, importName) {
  const imports = config.imports;
  if (imports && typeof imports === "object" && !Array.isArray(imports) && Object.keys(imports).length > 0) {
    const selectedName = importName || config.default_import || Object.keys(imports)[0];
    if (!(selectedName in imports)) {
      throw new Error(`Import profile '${selectedName}' not found. Available: ${Object.keys(imports).join(", ")}`);
    }
    return { importName: selectedName, profile: ensureObject(imports[selectedName], `imports.${selectedName}`) };
  }

  if (importName) throw new Error("config.yaml has no imports section.");
  return { importName: "default", profile: config };
}

function getAllImportNames(config) {
  const imports = ensureObject(config.imports || {}, "imports");
  const available = Object.keys(imports);
  if (available.length === 0) throw new Error("No imports configured.");

  const configuredOrder = config.import_order;
  if (configuredOrder !== undefined) {
    if (!Array.isArray(configuredOrder)) throw new Error("config.import_order must be a list.");
    const names = configuredOrder.map((name) => String(name).trim()).filter(Boolean);
    if (names.length === 0) throw new Error("config.import_order must include at least one import.");
    if (new Set(names).size !== names.length) throw new Error("config.import_order contains duplicate imports.");

    const missing = names.filter((name) => !(name in imports));
    if (missing.length > 0) {
      throw new Error(`config.import_order references unknown imports: ${missing.join(", ")}`);
    }

    const omitted = available.filter((name) => !names.includes(name));
    if (omitted.length > 0) {
      throw new Error(`config.import_order is missing configured imports: ${omitted.join(", ")}`);
    }

    return names;
  }

  return available.sort((left, right) => left.localeCompare(right));
}

function resolveSettings(args, config, configDir, profile) {
  const csvCfg = ensureObject(profile.csv || {}, "csv");
  const stagingCfg = ensureObject(profile.staging || {}, "staging");
  const loadCfg = ensureObject(profile.load || {}, "load");
  const errorsCfg = ensureObject(profile.errors || {}, "errors");

  const configuredCsvFile = coalesce(csvCfg.file_path, process.env.CSV_FILE);
  const csvPath = args.csvFile
    ? path.resolve(String(args.csvFile))
    : configuredCsvFile
      ? path.resolve(configDir, String(configuredCsvFile))
      : undefined;

  const settings = {
    databaseUrl: coalesce(args.databaseUrl, buildDatabaseUrl(config), process.env.DATABASE_URL),
    csvPath,
    encoding: normalizeEncoding(coalesce(csvCfg.encoding, process.env.CSV_ENCODING, "utf8")),
    delimiter: coalesce(csvCfg.delimiter, process.env.CSV_DELIMITER, ","),
    stagingSchema: coalesce(stagingCfg.schema, DEFAULT_SCHEMA),
    stagingTable: stagingCfg.table,
    truncateBeforeLoad: parseBool(coalesce(stagingCfg.truncate_before_load, true)),
    dropStagingAfterLoad: parseBool(coalesce(stagingCfg.drop_after_load, true)),
    dryRun: args.dryRun || parseBool(loadCfg.dry_run),
    loadOnly: args.loadOnly || parseBool(loadCfg.load_only),
    debug: args.debug || parseBool(loadCfg.debug),
    debugEveryRows: Number(coalesce(loadCfg.debug_every_rows, 100000)),
    progressEverySeconds: Number(coalesce(loadCfg.progress_every_seconds, 30)),
    maxRows: resolveMaxRows(loadCfg, args.mode),
    target: profile.target,
    columns: profile.columns,
    dimensions: profile.dimensions,
    errorsSchema: coalesce(errorsCfg.schema, DEFAULT_SCHEMA),
    errorsTable: coalesce(errorsCfg.table, DEFAULT_ERRORS_TABLE)
  };

  if (!settings.csvPath) throw new Error("Missing CSV file. Set csv.file_path in config.yaml or pass it.");
  if (!settings.stagingTable) throw new Error("Missing staging.table in config.yaml.");
  if (!settings.databaseUrl && !settings.dryRun) {
    throw new Error("Missing database URL. Configure database in config.yaml or pass --database-url.");
  }
  if (String(settings.delimiter).length !== 1) throw new Error("CSV delimiter must be exactly one character.");
  if (!Number.isInteger(settings.debugEveryRows) || settings.debugEveryRows < 0) {
    throw new Error("load.debug_every_rows must be a non-negative integer.");
  }
  if (!Number.isInteger(settings.progressEverySeconds) || settings.progressEverySeconds <= 0) {
    throw new Error("load.progress_every_seconds must be a positive integer.");
  }
  return settings;
}

function quoteIdent(identifier) {
  if (!identifier || String(identifier).includes("\0")) throw new Error("Invalid SQL identifier.");
  return `"${String(identifier).replaceAll('"', '""')}"`;
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function qualifiedTable(schema, table) {
  return `${quoteIdent(schema)}.${quoteIdent(table)}`;
}

function col(alias, column) {
  return `${quoteIdent(alias)}.${quoteIdent(column)}`;
}

function normalizeDimensions(dimensionsConfig) {
  if (!dimensionsConfig) return {};
  const dimensions = ensureObject(dimensionsConfig, "dimensions");
  const normalized = {};

  for (const [name, rawDimension] of Object.entries(dimensions)) {
    const dimension = ensureObject(rawDimension || {}, `dimensions.${name}`);
    const table = dimension.table;
    const keyColumn = coalesce(dimension.key_column, "id");
    const valueColumn = coalesce(dimension.value_column, dimension.natural_key, "name");

    if (!table) throw new Error(`dimensions.${name}.table is required.`);

    normalized[name] = {
      name,
      schema: String(coalesce(dimension.schema, DEFAULT_SCHEMA)),
      table: String(table),
      keyColumn: String(keyColumn),
      valueColumn: String(valueColumn),
      sourceColumn: dimension.source_column ? String(dimension.source_column) : undefined,
      transform: dimension.transform,
      lookupTransform: dimension.lookup_transform,
      type: dimension.type || "text",
      keyType: dimension.key_type || "bigint",
      createTable: parseBool(coalesce(dimension.create_table, true)),
      createMissing: parseBool(coalesce(dimension.create_missing, true))
    };
  }

  return normalized;
}

function getDimension(dimensions, dimensionName, sourceColumn) {
  if (!dimensions || !(dimensionName in dimensions)) {
    throw new Error(`${sourceColumn}.dimension references unknown dimension '${dimensionName}'.`);
  }
  return dimensions[dimensionName];
}

function normalizeCell(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

function ensureCsvFile(csvPath) {
  if (!fs.existsSync(csvPath)) throw new Error(`CSV file not found: ${csvPath}`);
  if (!fs.statSync(csvPath).isFile()) throw new Error(`CSV path is not a file: ${csvPath}`);
}

function readCsvHeader(csvPath, encoding, delimiter) {
  ensureCsvFile(csvPath);

  return new Promise((resolve, reject) => {
    let settled = false;
    const input = fs.createReadStream(csvPath, { encoding });
    const parser = parse({
      bom: true,
      to_line: 1,
      relax_column_count: true,
      delimiter
    });

    function finish(error, columns) {
      if (settled) return;
      settled = true;
      input.destroy();
      parser.destroy();
      if (error) reject(error);
      else resolve(columns);
    }

    parser.on("readable", () => {
      const record = parser.read();
      if (record) finish(null, validateHeaders(record));
    });
    parser.on("error", finish);
    input.on("error", finish);
    parser.on("end", () => finish(new Error("The CSV file is empty or has no header row.")));

    input.pipe(parser);
  });
}

function createCsvInputStream(csvPath, encoding, maxRows) {
  if (!maxRows) return fs.createReadStream(csvPath, { encoding });

  const fileStream = fs.createReadStream(csvPath, { encoding });
  const lines = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  async function* limitedLines() {
    let lineNumber = 0;
    try {
      for await (const line of lines) {
        lineNumber += 1;
        if (lineNumber > maxRows + 1) break;
        yield `${line}\n`;
      }
    } finally {
      lines.close();
      fileStream.destroy();
    }
  }

  return Readable.from(limitedLines());
}

async function countCsvRows(csvPath, encoding, delimiter, columns, maxRows) {
  let count = 0;
  const parser = parse({
    bom: true,
    columns,
    from_line: 2,
    delimiter,
    skip_empty_lines: false,
    relax_column_count: false
  });

  const counter = new Transform({
    objectMode: true,
    transform(_record, _encoding, callback) {
      count += 1;
      callback();
    }
  });

  await pipeline(createCsvInputStream(csvPath, encoding, maxRows), parser, counter);
  return count;
}

function validateHeaders(headers) {
  if (!headers || headers.length === 0) throw new Error("The CSV file is empty or has no header row.");

  const cleaned = headers.map((header) => String(header || "").trim());
  if (cleaned.some((header) => header === "")) throw new Error("The CSV header contains empty column names.");
  if (new Set(cleaned).size !== cleaned.length) throw new Error("The CSV header contains duplicate column names.");
  if (cleaned.includes(SOURCE_COLUMN)) {
    throw new Error(`The CSV header cannot contain reserved column name '${SOURCE_COLUMN}'.`);
  }
  return cleaned;
}

function stagingColumns(csvColumns) {
  return [...csvColumns, SOURCE_COLUMN];
}

function normalizeLookup(rawLookup, sourceColumn) {
  if (!rawLookup) return undefined;
  const lookup = ensureObject(rawLookup, `columns.${sourceColumn}.lookup`);
  for (const required of ["table", "source_column", "match_column", "value_column"]) {
    if (!lookup[required]) throw new Error(`columns.${sourceColumn}.lookup.${required} is required.`);
  }
  return {
    schema: String(lookup.schema || DEFAULT_SCHEMA),
    table: String(lookup.table),
    sourceColumn: String(lookup.source_column),
    matchColumn: String(lookup.match_column),
    valueColumn: String(lookup.value_column),
    transform: lookup.transform,
    lookupTransform: lookup.lookup_transform,
    type: lookup.type || "text"
  };
}

function projectedCsvColumns(csvColumns, columnsRules, dimensions, loadOnly) {
  if (loadOnly || Object.keys(columnsRules).length === 0) return csvColumns;

  const needed = new Set(Object.keys(columnsRules));
  for (const [sourceColumn, rawRule] of Object.entries(columnsRules)) {
    const rule = ensureObject(rawRule || {}, `columns.${sourceColumn}`);
    const lookup = normalizeLookup(rule.lookup, sourceColumn);
    if (lookup) needed.add(lookup.sourceColumn);
  }
  for (const dimension of Object.values(dimensions)) {
    if (dimension.sourceColumn) needed.add(dimension.sourceColumn);
  }
  return csvColumns.filter((column) => needed.has(column));
}

function sourceNameFromCsvPath(csvPath) {
  return path.basename(csvPath, path.extname(csvPath));
}

async function ensureStagingTable(client, schema, table, csvColumns) {
  const columns = stagingColumns(csvColumns);
  const columnDefs = columns.map((column) => `${quoteIdent(column)} text`).join(",\n                ");
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(schema)};`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${qualifiedTable(schema, table)} (
      ${columnDefs}
    );
  `);

  const result = await client.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = $1
      AND table_name = $2
    ORDER BY ordinal_position;
    `,
    [schema, table]
  );
  const existingColumns = result.rows.map((row) => row.column_name);

  if (JSON.stringify(existingColumns) === JSON.stringify(csvColumns)) {
    await client.query(
      `ALTER TABLE ${qualifiedTable(schema, table)} ADD COLUMN ${quoteIdent(SOURCE_COLUMN)} text;`
    );
    existingColumns.push(SOURCE_COLUMN);
  }

  if (JSON.stringify(existingColumns) !== JSON.stringify(columns)) {
    throw new Error(
      `The existing staging table columns do not match the CSV headers. Expected ${JSON.stringify(columns)}, found ${JSON.stringify(existingColumns)}.`
    );
  }
}

async function truncateStaging(client, schema, table) {
  await client.query(`TRUNCATE TABLE ${qualifiedTable(schema, table)};`);
}

async function dropStaging(client, schema, table) {
  await client.query(`DROP TABLE IF EXISTS ${qualifiedTable(schema, table)};`);
}

async function truncateTarget(client, target) {
  await client.query(
    `TRUNCATE TABLE ${qualifiedTable(String(target.schema || DEFAULT_SCHEMA), String(target.table))};`
  );
}

async function targetTableExists(client, target) {
  if (!target || !target.table) return false;
  const result = await client.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = $1
        AND table_name = $2
    ) AS exists;
    `,
    [String(target.schema || DEFAULT_SCHEMA), String(target.table)]
  );
  return Boolean(result.rows[0]?.exists);
}

function escapeCopyCsvValue(value) {
  const normalized = normalizeCell(value);
  if (normalized === null) return "";

  const text = String(normalized);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

async function copyCsvToStaging(
  client,
  schema,
  table,
  csvColumns,
  selectedColumns,
  csvPath,
  encoding,
  delimiter,
  logger,
  debugEveryRows,
  maxRows
) {
  const copyColumns = stagingColumns(selectedColumns);
  const sourceName = sourceNameFromCsvPath(csvPath);
  const columnSql = copyColumns.map(quoteIdent).join(", ");
  const copySql =
    `COPY ${qualifiedTable(schema, table)} (${columnSql}) ` +
    "FROM STDIN WITH (FORMAT csv, DELIMITER ',', QUOTE '\"', ESCAPE '\"', NULL '')";

  let copied = 0;
  let bytesRead = 0;
  const fileSize = fs.statSync(csvPath).size;
  const copyStartedAt = Date.now();
  const selected = new Set(selectedColumns);
  const byteCounter = new Transform({
    decodeStrings: false,
    transform(chunk, _encoding, callback) {
      bytesRead += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk, encoding);
      callback(null, chunk);
    }
  });
  const parser = parse({
    bom: true,
    columns: csvColumns.map((column) => selected.has(column) ? column : false),
    from_line: 2,
    delimiter,
    skip_empty_lines: false,
    relax_column_count: false
  });

  const toCopyCsv = new Transform({
    objectMode: true,
    transform(record, _encoding, callback) {
      copied += 1;
      if (debugEveryRows > 0 && copied % debugEveryRows === 0) {
        const seconds = Math.max((Date.now() - copyStartedAt) / 1000, 0.001);
        const progress = {
          rowsCopied: copied,
          rowsPerSecond: Math.round(copied / seconds),
          elapsedSeconds: Math.round(seconds)
        };
        if (!maxRows && fileSize > 0) {
          const percent = Math.min((bytesRead / fileSize) * 100, 100);
          progress.percent = Number(percent.toFixed(1));
          progress.etaSeconds = percent > 0 ? Math.max(0, Math.round(seconds * (100 - percent) / percent)) : undefined;
        }
        logger.info("COPY progress", progress);
      }
      const values = selectedColumns.map((column) => escapeCopyCsvValue(record[column]));
      values.push(escapeCopyCsvValue(sourceName));
      const line = values.join(",") + "\n";
      callback(null, line);
    }
  });

  await pipeline(
    createCsvInputStream(csvPath, encoding, maxRows),
    byteCounter,
    parser,
    toCopyCsv,
    client.query(copyFrom(copySql))
  );

  return copied;
}

async function ensureImportErrorsTable(client, schema, table) {
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(schema)};`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${qualifiedTable(schema, table)} (
      id bigserial PRIMARY KEY,
      import_name text NOT NULL,
      staging_table text NOT NULL,
      row_data jsonb NOT NULL,
      error_reason text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function clearPreviousImportErrors(client, schema, table, importName, stagingSchema, stagingTable) {
  await client.query(
    `
    DELETE FROM ${qualifiedTable(schema, table)}
    WHERE import_name = $1
      AND staging_table = $2;
    `,
    [importName, `${stagingSchema}.${stagingTable}`]
  );
}

function emptyCondition(alias, sourceColumn) {
  const source = col(alias, sourceColumn);
  return `(${source} IS NULL OR btrim(${source}) = '')`;
}

function nonEmptyCondition(alias, sourceColumn) {
  const source = col(alias, sourceColumn);
  return `(${source} IS NOT NULL AND btrim(${source}) <> '')`;
}

function transformExpr(alias, sourceColumn, transform, valueType) {
  const source = col(alias, sourceColumn);
  return transformSqlExpr(source, transform, valueType);
}

function transformSqlExpr(expression, transform, valueType) {
  const trimmed = `btrim(${expression})`;
  const nullIfEmpty = `NULLIF(${trimmed}, '')`;
  const asciiChars = "ÁÀÂÃÄÅáàâãäåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ";
  const plainChars = "AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn";

  if (transform === "raw") return expression;
  if (transform === "trim") return trimmed;
  if (transform === "lower_trim") return `lower(${trimmed})`;
  if (transform === "upper_trim") return `upper(${trimmed})`;
  if (transform === "initcap_trim") return `initcap(${trimmed})`;
  if (transform === "ascii_lower_trim") {
    return `translate(lower(${trimmed}), ${sqlLiteral(asciiChars)}, ${sqlLiteral(plainChars)})`;
  }
  if (transform === "numeric_comma") return `replace(${nullIfEmpty}, ',', '.')::numeric`;
  if (transform === "integer") return `${nullIfEmpty}::integer`;
  if (transform === "bigint") return `${nullIfEmpty}::bigint`;
  if (transform === "date_ymd") return `to_date(${nullIfEmpty}, 'YYYY-MM-DD')`;
  if (transform === "date_yyyymmdd") return `to_date(${nullIfEmpty}, 'YYYYMMDD')`;

  if (valueType === "numeric") return `replace(${nullIfEmpty}, ',', '.')::numeric`;
  if (valueType === "integer") return `${nullIfEmpty}::integer`;
  if (valueType === "bigint") return `${nullIfEmpty}::bigint`;
  if (valueType === "date") return `to_date(${nullIfEmpty}, 'YYYY-MM-DD')`;

  if (!transform) return expression;

  throw new Error(`Unsupported transform: ${transform}`);
}

function dimensionValueExpr(alias, sourceColumn, rule, dimensions) {
  if (!rule.dimension) return undefined;
  const dimension = getDimension(dimensions, String(rule.dimension), sourceColumn);
  return transformExpr(alias, sourceColumn, rule.transform || dimension.transform, rule.type || dimension.type);
}

function dimensionLookupCondition(dimension, dimensionAlias, valueExpr) {
  const dimensionValue = col(dimensionAlias, dimension.valueColumn);
  const comparableDimensionValue = dimension.lookupTransform
    ? transformSqlExpr(dimensionValue, dimension.lookupTransform, dimension.type)
    : dimensionValue;
  return `${comparableDimensionValue} = ${valueExpr}`;
}

function lookupCondition(lookup, lookupAlias, valueExpr) {
  const lookupValue = col(lookupAlias, lookup.matchColumn);
  const comparableLookupValue = lookup.lookupTransform
    ? transformSqlExpr(lookupValue, lookup.lookupTransform, lookup.type)
    : lookupValue;
  return `${comparableLookupValue} = ${valueExpr}`;
}

function lookupValueExpr(alias, sourceColumn, rule) {
  const lookup = normalizeLookup(rule.lookup, sourceColumn);
  if (!lookup) return undefined;
  const sourceValue = transformExpr(alias, lookup.sourceColumn, lookup.transform, lookup.type);
  return `(
        SELECT ${col("lookup", lookup.valueColumn)}
        FROM ${qualifiedTable(lookup.schema, lookup.table)} ${quoteIdent("lookup")}
        WHERE ${lookupCondition(lookup, "lookup", sourceValue)}
      )`;
}

function validationErrorCases(sourceColumn, rule, stagingSchema, stagingTable, target, dimensions) {
  const alias = "s";
  const source = col(alias, sourceColumn);
  const trimmed = `btrim(${source})`;
  const targetColumn = String(rule.target || sourceColumn);
  const errors = [];

  if (parseBool(rule.required)) {
    errors.push(`CASE WHEN ${emptyCondition(alias, sourceColumn)} THEN ${sqlLiteral(`${sourceColumn} requerido`)} END`);
  }

  if (rule.type === "email") {
    errors.push(
      `CASE WHEN ${nonEmptyCondition(alias, sourceColumn)} AND ${trimmed} !~* ${sqlLiteral(EMAIL_REGEX)} THEN ${sqlLiteral(`${sourceColumn} email invalido`)} END`
    );
  } else if (rule.type === "numeric") {
    errors.push(
      `CASE WHEN ${nonEmptyCondition(alias, sourceColumn)} AND ${trimmed} !~ ${sqlLiteral(NUMERIC_REGEX)} THEN ${sqlLiteral(`${sourceColumn} numerico invalido`)} END`
    );
  } else if (rule.type === "integer" || rule.type === "bigint") {
    errors.push(
      `CASE WHEN ${nonEmptyCondition(alias, sourceColumn)} AND ${trimmed} !~ ${sqlLiteral(INTEGER_REGEX)} THEN ${sqlLiteral(`${sourceColumn} entero invalido`)} END`
    );
  } else if (rule.type === "date") {
    const dateRegex = rule.transform === "date_yyyymmdd" ? DATE_YYYYMMDD_REGEX : DATE_YMD_REGEX;
    errors.push(
      `CASE WHEN ${nonEmptyCondition(alias, sourceColumn)} AND ${trimmed} !~ ${sqlLiteral(dateRegex)} THEN ${sqlLiteral(`${sourceColumn} fecha invalida`)} END`
    );
  } else if (rule.type && rule.type !== "text") {
    throw new Error(`Unsupported type for ${sourceColumn}: ${rule.type}`);
  }

  if (rule.regex) {
    errors.push(
      `CASE WHEN ${nonEmptyCondition(alias, sourceColumn)} AND ${source} !~ ${sqlLiteral(rule.regex)} THEN ${sqlLiteral(`${sourceColumn} formato invalido`)} END`
    );
  }

  if ("min" in rule) {
    errors.push(
      `CASE WHEN ${source} ~ ${sqlLiteral(NUMERIC_REGEX)} AND replace(btrim(${source}), ',', '.')::numeric < ${Number(rule.min)} THEN ${sqlLiteral(`${sourceColumn} menor que minimo`)} END`
    );
  }

  if ("max" in rule) {
    errors.push(
      `CASE WHEN ${source} ~ ${sqlLiteral(NUMERIC_REGEX)} AND replace(btrim(${source}), ',', '.')::numeric > ${Number(rule.max)} THEN ${sqlLiteral(`${sourceColumn} mayor que maximo`)} END`
    );
  }

  if (parseBool(rule.unique_csv)) {
    const stagingSql = qualifiedTable(stagingSchema, stagingTable);
    errors.push(
      `CASE WHEN ${nonEmptyCondition(alias, sourceColumn)} AND (` +
        `SELECT count(*) FROM ${stagingSql} ${quoteIdent("d")} ` +
        `WHERE btrim(${col("d", sourceColumn)}) = btrim(${source})` +
        `) > 1 THEN ${sqlLiteral(`${sourceColumn} duplicado en csv`)} END`
    );
  }

  if (parseBool(rule.unique_target)) {
    if (!target) throw new Error(`${sourceColumn}.unique_target requires a target section.`);
    const targetSql = qualifiedTable(String(target.schema || DEFAULT_SCHEMA), String(target.table));
    const transformed = transformExpr(alias, sourceColumn, rule.transform, rule.type);
    errors.push(
      `CASE WHEN ${nonEmptyCondition(alias, sourceColumn)} AND EXISTS (` +
        `SELECT 1 FROM ${targetSql} ${quoteIdent("t")} ` +
        `WHERE ${col("t", targetColumn)} = ${transformed}` +
        `) THEN ${sqlLiteral(`${sourceColumn} ya existe en destino`)} END`
    );
  }

  if (rule.references) {
    const ref = ensureObject(rule.references, `${sourceColumn}.references`);
    const refSql = qualifiedTable(String(ref.schema || DEFAULT_SCHEMA), String(ref.table));
    const transformed = transformExpr(alias, sourceColumn, rule.transform, rule.type);
    const fixedConditions = Object.entries(ensureObject(ref.where || {}, `${sourceColumn}.references.where`))
      .map(([column, value]) => `${col("r", column)} = ${sqlLiteral(value)}`);
    const conditions = [`${col("r", String(ref.column))} = ${transformed}`, ...fixedConditions];
    errors.push(
      `CASE WHEN ${nonEmptyCondition(alias, sourceColumn)} AND NOT EXISTS (` +
        `SELECT 1 FROM ${refSql} ${quoteIdent("r")} ` +
        `WHERE ${conditions.join(" AND ")}` +
        `) THEN ${sqlLiteral(`${sourceColumn} referencia inexistente`)} END`
    );
  }

  const lookup = normalizeLookup(rule.lookup, sourceColumn);
  if (lookup) {
    const lookupSql = qualifiedTable(lookup.schema, lookup.table);
    const lookupSourceValue = transformExpr(alias, lookup.sourceColumn, lookup.transform, lookup.type);
    errors.push(
      `CASE WHEN ${nonEmptyCondition(alias, lookup.sourceColumn)} AND NOT EXISTS (` +
        `SELECT 1 FROM ${lookupSql} ${quoteIdent("lookup")} ` +
        `WHERE ${lookupCondition(lookup, "lookup", lookupSourceValue)}` +
        `) THEN ${sqlLiteral(`${sourceColumn} lookup inexistente`)} END`
    );

    if (rule.dimension) {
      const dimension = getDimension(dimensions, String(rule.dimension), sourceColumn);
      const dimensionSql = qualifiedTable(dimension.schema, dimension.table);
      const dimensionValue = dimensionValueExpr(alias, sourceColumn, rule, dimensions);
      errors.push(
        `CASE WHEN ${nonEmptyCondition(alias, sourceColumn)} AND ${nonEmptyCondition(alias, lookup.sourceColumn)} AND NOT EXISTS (` +
          `SELECT 1 FROM ${lookupSql} ${quoteIdent("lookup")} ` +
          `JOIN ${dimensionSql} ${quoteIdent("dim")} ` +
          `ON ${col("dim", dimension.keyColumn)} = ${col("lookup", lookup.valueColumn)} ` +
          `WHERE ${lookupCondition(lookup, "lookup", lookupSourceValue)} ` +
          `AND ${dimensionLookupCondition(dimension, "dim", dimensionValue)}` +
          `) THEN ${sqlLiteral(`${sourceColumn} inconsistente con ${lookup.sourceColumn}`)} END`
      );
    }
  }

  if (rule.dimension) {
    const dimension = getDimension(dimensions, String(rule.dimension), sourceColumn);
    if (!dimension.createMissing) {
      const dimensionSql = qualifiedTable(dimension.schema, dimension.table);
      const transformed = dimensionValueExpr(alias, sourceColumn, rule, dimensions);
      errors.push(
        `CASE WHEN ${nonEmptyCondition(alias, sourceColumn)} AND (` +
          `SELECT count(*) FROM ${dimensionSql} ${quoteIdent("dim")} ` +
          `WHERE ${dimensionLookupCondition(dimension, "dim", transformed)}` +
          `) <> 1 THEN ${sqlLiteral(`${sourceColumn} dimension inexistente o ambigua`)} END`
      );
    }
  }

  return errors;
}

function buildValidatedCte(columnsRules, stagingSchema, stagingTable, target, dimensions) {
  const cases = [];
  for (const [sourceColumn, rawRule] of Object.entries(columnsRules)) {
    const rule = ensureObject(rawRule || {}, `columns.${sourceColumn}`);
    cases.push(...validationErrorCases(sourceColumn, rule, stagingSchema, stagingTable, target, dimensions));
  }

  const errorExpr =
    cases.length === 0
      ? "ARRAY[]::text[]"
      : `array_remove(ARRAY[\n        ${cases.join(",\n        ")}\n      ], NULL)`;

  return `
    WITH validated AS (
      SELECT
        ${quoteIdent("s")}.*,
        ${errorExpr} AS validation_errors
      FROM ${qualifiedTable(stagingSchema, stagingTable)} ${quoteIdent("s")}
    )
  `;
}

async function insertValidationErrors(client, importName, stagingSchema, stagingTable, errorsSchema, errorsTable, columnsRules, target, dimensions) {
  const cte = buildValidatedCte(columnsRules, stagingSchema, stagingTable, target, dimensions);
  const stagingName = `${stagingSchema}.${stagingTable}`;
  const result = await client.query(`
    ${cte}
    INSERT INTO ${qualifiedTable(errorsSchema, errorsTable)}
      (import_name, staging_table, row_data, error_reason)
    SELECT
      ${sqlLiteral(importName)},
      ${sqlLiteral(stagingName)},
      to_jsonb(validated) - 'validation_errors',
      array_to_string(validation_errors, '; ')
    FROM validated
    WHERE cardinality(validation_errors) > 0;
  `);
  return result.rowCount;
}

async function ensureDimensionTable(client, dimension) {
  if (!dimension.createTable) return;

  await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(dimension.schema)};`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${qualifiedTable(dimension.schema, dimension.table)} (
      ${quoteIdent(dimension.keyColumn)} bigserial PRIMARY KEY,
      ${quoteIdent(dimension.valueColumn)} text NOT NULL UNIQUE
    );
  `);
}

async function populateDimensions(client, stagingSchema, stagingTable, columnsRules, dimensions, logger) {
  let inserted = 0;
  const dimensionsBySource = new Map();

  for (const [sourceColumn, rawRule] of Object.entries(columnsRules)) {
    const rule = ensureObject(rawRule || {}, `columns.${sourceColumn}`);
    if (!rule.dimension) continue;
    const dimension = getDimension(dimensions, String(rule.dimension), sourceColumn);
    dimensionsBySource.set(`${sourceColumn}:${dimension.name}`, { sourceColumn, rule, dimension });
  }

  for (const dimension of Object.values(dimensions)) {
    if (dimension.sourceColumn) {
      dimensionsBySource.set(`${dimension.sourceColumn}:${dimension.name}`, {
        sourceColumn: dimension.sourceColumn,
        rule: {},
        dimension
      });
    }
  }

  for (const { sourceColumn, rule, dimension } of dimensionsBySource.values()) {
    await ensureDimensionTable(client, dimension);
    if (!dimension.createMissing) continue;

    const valueExpr = transformExpr("s", sourceColumn, rule.transform || dimension.transform, rule.type || dimension.type);
    const result = await client.query(`
      INSERT INTO ${qualifiedTable(dimension.schema, dimension.table)}
        (${quoteIdent(dimension.valueColumn)})
      SELECT DISTINCT ${valueExpr}
      FROM ${qualifiedTable(stagingSchema, stagingTable)} ${quoteIdent("s")}
      WHERE ${nonEmptyCondition("s", sourceColumn)}
      ON CONFLICT (${quoteIdent(dimension.valueColumn)}) DO NOTHING;
    `);
    inserted += result.rowCount;
    logger.info("Dimension populated", {
      dimension: dimension.name,
      table: `${dimension.schema}.${dimension.table}`,
      sourceColumn,
      inserted: result.rowCount
    });
  }

  return inserted;
}

function targetColumnType(sourceColumn, rule, dimensions) {
  if (rule.dimension) {
    const dimension = getDimension(dimensions, String(rule.dimension), sourceColumn);
    return String(rule.type || dimension.keyType);
  }

  if (rule.type === "integer") return "integer";
  if (rule.type === "bigint") return "bigint";
  if (rule.type === "numeric") return "numeric";
  if (rule.type === "date") return "date";
  return "text";
}

function normalizePrimaryKey(target) {
  if (!target || target.primary_key === undefined || target.primary_key === null) return [];

  const primaryKey = Array.isArray(target.primary_key)
    ? target.primary_key
    : [target.primary_key];

  const normalized = primaryKey.map((column) => String(column).trim()).filter(Boolean);
  if (normalized.length === 0) throw new Error("target.primary_key must include at least one column.");
  if (new Set(normalized).size !== normalized.length) {
    throw new Error("target.primary_key contains duplicate columns.");
  }
  return normalized;
}

function configuredTargetColumns(columnsRules) {
  const targetColumns = new Set();
  for (const [sourceColumn, rawRule] of Object.entries(columnsRules)) {
    const rule = ensureObject(rawRule || {}, `columns.${sourceColumn}`);
    if (rule.target) targetColumns.add(String(rule.target));
  }
  return targetColumns;
}

function validateTargetConfig(target, columnsRules) {
  if (!target) return;
  const targetObject = ensureObject(target, "target");
  const targetColumns = configuredTargetColumns(columnsRules);
  const primaryKey = normalizePrimaryKey(targetObject);
  const missingPrimaryKeyColumns = primaryKey.filter((column) => !targetColumns.has(column));
  if (missingPrimaryKeyColumns.length > 0) {
    throw new Error(`target.primary_key references unknown target columns: ${missingPrimaryKeyColumns.join(", ")}`);
  }
}

async function ensureTargetTable(client, target, columnsRules, dimensions) {
  if (!target.table) throw new Error("target.table is required when columns are configured.");

  const targetSchema = String(target.schema || DEFAULT_SCHEMA);
  const targetTable = String(target.table);
  const columnDefs = [];
  const targetColumns = configuredTargetColumns(columnsRules);

  for (const [sourceColumn, rawRule] of Object.entries(columnsRules)) {
    const rule = ensureObject(rawRule || {}, `columns.${sourceColumn}`);
    if (!rule.target) continue;

    const targetColumn = String(rule.target);
    const dataType = targetColumnType(sourceColumn, rule, dimensions);
    const nullable = parseBool(rule.required) ? " NOT NULL" : "";
    const unique = parseBool(rule.unique) ? " UNIQUE" : "";
    columnDefs.push(`${quoteIdent(targetColumn)} ${dataType}${nullable}${unique}`);
  }

  if (columnDefs.length === 0) return;

  const primaryKey = normalizePrimaryKey(target);
  const missingPrimaryKeyColumns = primaryKey.filter((column) => !targetColumns.has(column));
  if (missingPrimaryKeyColumns.length > 0) {
    throw new Error(`target.primary_key references unknown target columns: ${missingPrimaryKeyColumns.join(", ")}`);
  }
  if (primaryKey.length > 0) {
    columnDefs.push(`PRIMARY KEY (${primaryKey.map(quoteIdent).join(", ")})`);
  }

  await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(targetSchema)};`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${qualifiedTable(targetSchema, targetTable)} (
      ${columnDefs.join(",\n      ")}
    );
  `);
}

function databaseObjectName(prefix, parts) {
  const raw = `${prefix}_${parts.join("_")}`.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  const hash = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 8);
  return `${raw.slice(0, 54)}_${hash}`;
}

function targetForeignKeys(target, columnsRules, dimensions) {
  const specs = [];
  const targetTable = String(target.table);

  for (const [sourceColumn, rawRule] of Object.entries(columnsRules)) {
    const rule = ensureObject(rawRule || {}, `columns.${sourceColumn}`);
    if (!rule.target) continue;
    const targetColumn = String(rule.target);

    if (rule.dimension) {
      const dimension = getDimension(dimensions, String(rule.dimension), sourceColumn);
      specs.push({
        name: databaseObjectName("fk", [targetTable, targetColumn, dimension.table, dimension.keyColumn]),
        localColumns: [targetColumn],
        referencedSchema: dimension.schema,
        referencedTable: dimension.table,
        referencedColumns: [dimension.keyColumn],
        generatedColumns: []
      });
    }

    if (rule.references) {
      const ref = ensureObject(rule.references, `${sourceColumn}.references`);
      const fixed = Object.entries(ensureObject(ref.where || {}, `${sourceColumn}.references.where`));
      const generatedColumns = fixed.map(([column, value]) => ({
        name: databaseObjectName("ref", [targetColumn, column]),
        value
      }));
      specs.push({
        name: databaseObjectName("fk", [targetTable, targetColumn, String(ref.table), String(ref.column), ...fixed.map(([column]) => column)]),
        localColumns: [...generatedColumns.map((column) => column.name), targetColumn],
        referencedSchema: String(ref.schema || DEFAULT_SCHEMA),
        referencedTable: String(ref.table),
        referencedColumns: [...fixed.map(([column]) => String(column)), String(ref.column)],
        generatedColumns
      });
    }
  }

  return specs;
}

async function constraintExists(client, schema, table, constraintName) {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT 1
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       WHERE n.nspname = $1 AND t.relname = $2 AND c.conname = $3
     ) AS exists;`,
    [schema, table, constraintName]
  );
  return Boolean(result.rows[0]?.exists);
}

async function ensureTargetForeignKeys(client, target, columnsRules, dimensions, progress) {
  const targetSchema = String(target.schema || DEFAULT_SCHEMA);
  const targetTable = String(target.table);
  const targetSql = qualifiedTable(targetSchema, targetTable);
  const specs = targetForeignKeys(target, columnsRules, dimensions);

  for (const [index, spec] of specs.entries()) {
    for (const generated of spec.generatedColumns) {
      await runLoggedOperation({
        ...progress,
        label: `Generated FK column ${generated.name}`,
        operation: () => client.query(
          `ALTER TABLE ${targetSql} ADD COLUMN IF NOT EXISTS ${quoteIdent(generated.name)} text ` +
          `GENERATED ALWAYS AS (${sqlLiteral(generated.value)}::text) STORED;`
        )
      });
    }
    if (await constraintExists(client, targetSchema, targetTable, spec.name)) {
      progress.logger.info(`FK ${index + 1}/${specs.length} already exists`, { constraint: spec.name });
      continue;
    }
    await runLoggedOperation({
      ...progress,
      label: `Creating FK ${index + 1}/${specs.length}`,
      details: { constraint: spec.name },
      operation: () => client.query(
        `ALTER TABLE ${targetSql} ADD CONSTRAINT ${quoteIdent(spec.name)} ` +
        `FOREIGN KEY (${spec.localColumns.map(quoteIdent).join(", ")}) ` +
        `REFERENCES ${qualifiedTable(spec.referencedSchema, spec.referencedTable)} ` +
        `(${spec.referencedColumns.map(quoteIdent).join(", ")}) NOT VALID;`
      )
    });
  }
  return specs;
}

async function validateTargetForeignKeys(client, target, specs, progress) {
  const targetSchema = String(target.schema || DEFAULT_SCHEMA);
  const targetTable = String(target.table);
  const targetSql = qualifiedTable(targetSchema, targetTable);
  for (const [index, spec] of specs.entries()) {
    await runLoggedOperation({
      ...progress,
      label: `Validating FK ${index + 1}/${specs.length}`,
      details: { constraint: spec.name },
      operation: () => client.query(`ALTER TABLE ${targetSql} VALIDATE CONSTRAINT ${quoteIdent(spec.name)};`)
    });
    const indexName = databaseObjectName("idx", [targetTable, ...spec.localColumns]);
    await runLoggedOperation({
      ...progress,
      label: `Creating FK index ${index + 1}/${specs.length}`,
      details: { index: indexName },
      includeIndexProgress: true,
      operation: () => client.query(
        `CREATE INDEX IF NOT EXISTS ${quoteIdent(indexName)} ON ${targetSql} ` +
        `(${spec.localColumns.map(quoteIdent).join(", ")});`
      )
    });
  }
}

function dimensionLookupExpr(sourceColumn, rule, dimensions) {
  const dimension = getDimension(dimensions, String(rule.dimension), sourceColumn);
  const valueExpr = dimensionValueExpr("validated", sourceColumn, rule, dimensions);
  return `(
        SELECT ${col("dim", dimension.keyColumn)}
        FROM ${qualifiedTable(dimension.schema, dimension.table)} ${quoteIdent("dim")}
        WHERE ${dimensionLookupCondition(dimension, "dim", valueExpr)}
      )`;
}

function migratedValueExpr(sourceColumn, rule, dimensions) {
  if (rule.lookup) return lookupValueExpr("validated", sourceColumn, rule);
  if (rule.dimension) return dimensionLookupExpr(sourceColumn, rule, dimensions);
  return transformExpr("validated", sourceColumn, rule.transform, rule.type);
}

async function migrateValidRows(client, stagingSchema, stagingTable, target, columnsRules, dimensions) {
  if (!target.table) throw new Error("target.table is required when columns are configured.");

  const targetColumns = [];
  const selectExprs = [];
  for (const [sourceColumn, rawRule] of Object.entries(columnsRules)) {
    const rule = ensureObject(rawRule || {}, `columns.${sourceColumn}`);
    if (!rule.target) continue;
    targetColumns.push(String(rule.target));
    selectExprs.push(migratedValueExpr(sourceColumn, rule, dimensions));
  }

  if (targetColumns.length === 0) return 0;

  const cte = buildValidatedCte(columnsRules, stagingSchema, stagingTable, target, dimensions);
  const result = await client.query(`
    ${cte}
    INSERT INTO ${qualifiedTable(String(target.schema || DEFAULT_SCHEMA), String(target.table))}
      (${targetColumns.map(quoteIdent).join(", ")})
    SELECT
      ${selectExprs.join(",\n      ")}
    FROM validated
    WHERE cardinality(validation_errors) = 0;
  `);
  return result.rowCount;
}

function validateProfileColumns(csvColumns, columnsRules) {
  if (!columnsRules) return {};
  const rules = ensureObject(columnsRules, "columns");
  const missing = Object.keys(rules).filter((column) => !csvColumns.includes(column));
  if (missing.length > 0) throw new Error(`Configured columns are missing from CSV headers: ${missing.join(", ")}`);
  return rules;
}

function validateDimensions(csvColumns, columnsRules, dimensions) {
  for (const [sourceColumn, rawRule] of Object.entries(columnsRules)) {
    const rule = ensureObject(rawRule || {}, `columns.${sourceColumn}`);
    if (rule.dimension) getDimension(dimensions, String(rule.dimension), sourceColumn);
    const lookup = normalizeLookup(rule.lookup, sourceColumn);
    if (lookup && !csvColumns.includes(lookup.sourceColumn)) {
      throw new Error(`columns.${sourceColumn}.lookup.source_column is missing from CSV headers: ${lookup.sourceColumn}`);
    }
  }

  for (const [name, dimension] of Object.entries(dimensions)) {
    if (dimension.sourceColumn && !csvColumns.includes(dimension.sourceColumn)) {
      throw new Error(`dimensions.${name}.source_column is missing from CSV headers: ${dimension.sourceColumn}`);
    }
  }
}

async function processImport(args) {
  const earlyLogger = createLogger(args.debug);
  earlyLogger.info("Loading config", { config: path.resolve(args.config) });

  const { config, configDir } = loadConfig(args.config);
  const { importName, profile } = getImportProfile(config, args.importName);
  earlyLogger.info("Selected import profile", { import: importName });

  const settings = resolveSettings(args, config, configDir, profile);
  const logger = createLogger(settings.debug);
  logger.info("Resolved settings", {
    csvPath: settings.csvPath,
    encoding: settings.encoding,
    delimiter: settings.delimiter,
    staging: `${settings.stagingSchema}.${settings.stagingTable}`,
    truncateBeforeLoad: settings.truncateBeforeLoad,
    dropStagingAfterLoad: settings.dropStagingAfterLoad,
    loadOnly: settings.loadOnly,
    dryRun: settings.dryRun,
    maxRows: settings.maxRows || "all",
    hasTarget: Boolean(settings.target),
    dimensions: settings.dimensions ? Object.keys(settings.dimensions) : [],
    errorsTable: `${settings.errorsSchema}.${settings.errorsTable}`,
    databaseConfigured: Boolean(settings.databaseUrl)
  });

  logger.info("Reading CSV header");
  const columns = await readCsvHeader(settings.csvPath, settings.encoding, settings.delimiter);
  logger.info("CSV header loaded", { columns });

  const rules = validateProfileColumns(columns, settings.columns);
  const dimensions = normalizeDimensions(settings.dimensions);
  validateDimensions(columns, rules, dimensions);
  validateTargetConfig(settings.target, rules);
  const selectedColumns = projectedCsvColumns(columns, rules, dimensions, settings.loadOnly);
  logger.info("Validation rules loaded", { columnsWithRules: Object.keys(rules) });
  logger.info("Dimensions loaded", { dimensions: Object.keys(dimensions) });
  logger.info("Projected staging columns", { columns: selectedColumns });

  if (settings.dryRun) {
    logger.info("Counting CSV rows for dry run");
    const count = await countCsvRows(settings.csvPath, settings.encoding, settings.delimiter, columns, settings.maxRows);
    console.log(`Dry run OK. import=${importName} rows=${count} columns=${JSON.stringify(columns)}`);
    if (Object.keys(rules).length > 0) {
      console.log(`Configured validation columns=${JSON.stringify(Object.keys(rules))}`);
    }
    if (Object.keys(dimensions).length > 0) {
      console.log(`Configured dimensions=${JSON.stringify(Object.keys(dimensions))}`);
    }
    return;
  }

  const target = settings.target ? ensureObject(settings.target, "target") : undefined;
  logger.info("Connecting to PostgreSQL");
  const client = new Client({ connectionString: settings.databaseUrl });
  await client.connect();
  logger.info("Connected to PostgreSQL");
  const monitorClient = await createProgressMonitor(settings.databaseUrl, logger);
  const progress = {
    logger,
    intervalMs: settings.progressEverySeconds * 1000,
    monitorClient,
    backendPid: client.processID
  };

  try {
    logger.info("Beginning transaction");
    await client.query("BEGIN");

    if (target && parseBool(target.skip_if_exists) && await targetTableExists(client, target)) {
      await client.query("COMMIT");
      console.log(`Import skipped. import=${importName} target=${target.schema || DEFAULT_SCHEMA}.${target.table} already exists`);
      return;
    }

    logger.info("Ensuring staging table");
    await ensureStagingTable(client, settings.stagingSchema, settings.stagingTable, selectedColumns);
    if (settings.truncateBeforeLoad) {
      await runLoggedOperation({
        ...progress,
        label: "Truncating staging table",
        operation: () => truncateStaging(client, settings.stagingSchema, settings.stagingTable)
      });
    }

    const staged = await runLoggedOperation({
      ...progress,
      label: "COPY to staging",
      details: { file: settings.csvPath },
      operation: () => copyCsvToStaging(
        client,
        settings.stagingSchema,
        settings.stagingTable,
        columns,
        selectedColumns,
        settings.csvPath,
        settings.encoding,
        settings.delimiter,
        logger,
        settings.debugEveryRows,
        settings.maxRows
      )
    });
    logger.info("COPY result", { staged });

    let rejected = 0;
    let migrated = 0;

    if (Object.keys(rules).length > 0 && !settings.loadOnly) {
      if (Object.keys(dimensions).length > 0) {
        const dimensionsInserted = await runLoggedOperation({
          ...progress,
          label: "Populating dimensions from staging",
          operation: () => populateDimensions(
            client,
            settings.stagingSchema,
            settings.stagingTable,
            rules,
            dimensions,
            logger
          )
        });
        logger.info("Dimensions populated", { inserted: dimensionsInserted });
      }

      logger.info("Ensuring import errors table");
      await ensureImportErrorsTable(client, settings.errorsSchema, settings.errorsTable);
      await runLoggedOperation({
        ...progress,
        label: "Clearing previous validation errors",
        operation: () => clearPreviousImportErrors(
          client,
          settings.errorsSchema,
          settings.errorsTable,
          importName,
          settings.stagingSchema,
          settings.stagingTable
        )
      });
      rejected = await runLoggedOperation({
        ...progress,
        label: "Validating rows and recording errors",
        operation: () => insertValidationErrors(
          client,
          importName,
          settings.stagingSchema,
          settings.stagingTable,
          settings.errorsSchema,
          settings.errorsTable,
          rules,
          target,
          dimensions
        )
      });
      logger.info("Validation errors inserted", { rejected });

      if (target) {
        logger.info("Ensuring target table", {
          target: `${target.schema || DEFAULT_SCHEMA}.${target.table}`
        });
        await runLoggedOperation({
          ...progress,
          label: "Ensuring target table structure",
          operation: () => ensureTargetTable(client, target, rules, dimensions)
        });
        const foreignKeys = await ensureTargetForeignKeys(client, target, rules, dimensions, progress);

        const targetMode = target.mode || "replace";
        if (targetMode === "replace") {
          if (!args.targetsPreTruncated) {
            await runLoggedOperation({
              ...progress,
              label: "Truncating target table before migration",
              details: { target: `${target.schema || DEFAULT_SCHEMA}.${target.table}` },
              operation: () => truncateTarget(client, target)
            });
          }
        } else if (targetMode !== "append") {
          throw new Error(`Unsupported target.mode: ${targetMode}`);
        }

        migrated = await runLoggedOperation({
          ...progress,
          label: "Migrating valid rows to target",
          details: { target: `${target.schema || DEFAULT_SCHEMA}.${target.table}` },
          operation: () => migrateValidRows(client, settings.stagingSchema, settings.stagingTable, target, rules, dimensions)
        });
        logger.info("Valid rows migrated", { migrated });
        await validateTargetForeignKeys(client, target, foreignKeys, progress);
      }
    } else if (settings.loadOnly) {
      logger.info("Skipping validation and migration because loadOnly=true");
    } else {
      logger.info("Skipping validation and migration because no column rules are configured");
    }

    await runLoggedOperation({
      ...progress,
      label: "Committing transaction",
      operation: () => client.query("COMMIT")
    });
    if (settings.dropStagingAfterLoad) {
      await runLoggedOperation({
        ...progress,
        label: "Dropping staging table after successful import",
        operation: () => dropStaging(client, settings.stagingSchema, settings.stagingTable)
      });
    }
    console.log(`Import complete. import=${importName} staged=${staged} rejected=${rejected} migrated=${migrated}`);
  } catch (error) {
    logger.info("Rolling back transaction", { error: error.message });
    await client.query("ROLLBACK");
    throw error;
  } finally {
    logger.info("Closing PostgreSQL connection");
    try {
      if (monitorClient) await monitorClient.end();
    } finally {
      await client.end();
    }
  }
}

async function processAllImports(args) {
  const { config } = loadConfig(args.config);
  const importNames = getAllImportNames(config);
  let targetsPreTruncated = false;

  if (!args.dryRun && !args.loadOnly) {
    const databaseUrl = coalesce(args.databaseUrl, buildDatabaseUrl(config), process.env.DATABASE_URL);
    if (!databaseUrl) throw new Error("Missing database URL for coordinated target truncation.");
    const debugEnabled = args.debug || importNames.some((name) => parseBool(config.imports[name]?.load?.debug));
    const logger = createLogger(debugEnabled);
    const progressIntervals = importNames.map((name) => Number(config.imports[name]?.load?.progress_every_seconds || 30));
    if (progressIntervals.some((value) => !Number.isInteger(value) || value <= 0)) {
      throw new Error("load.progress_every_seconds must be a positive integer.");
    }
    const intervalSeconds = Math.min(...progressIntervals);
    logger.info("Connecting for coordinated target truncation");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    const monitorClient = await createProgressMonitor(databaseUrl, logger);
    const progress = {
      logger,
      intervalMs: intervalSeconds * 1000,
      monitorClient,
      backendPid: client.processID
    };
    try {
      const targets = [];
      for (const importName of importNames) {
        const profile = ensureObject(config.imports[importName], `imports.${importName}`);
        const target = profile.target ? ensureObject(profile.target, `imports.${importName}.target`) : undefined;
        const load = ensureObject(profile.load || {}, `imports.${importName}.load`);
        if (!target || parseBool(load.dry_run) || parseBool(load.load_only) ||
            (target.mode || "replace") !== "replace" || parseBool(target.skip_if_exists)) continue;
        if (await targetTableExists(client, target)) {
          targets.push(qualifiedTable(String(target.schema || DEFAULT_SCHEMA), String(target.table)));
        }
      }
      if (targets.length > 0) {
        logger.info("Targets selected for coordinated truncation", { count: targets.length, targets });
        await client.query("BEGIN");
        await runLoggedOperation({
          ...progress,
          label: "Coordinated target truncation",
          operation: () => client.query(`TRUNCATE TABLE ${targets.join(", ")};`)
        });
        await runLoggedOperation({
          ...progress,
          label: "Committing coordinated truncation",
          operation: () => client.query("COMMIT")
        });
      } else {
        logger.info("No existing targets require coordinated truncation");
      }
      targetsPreTruncated = true;
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch { /* connection may already be closed */ }
      throw error;
    } finally {
      try {
        if (monitorClient) await monitorClient.end();
      } finally {
        await client.end();
      }
    }
  }

  for (const importName of importNames) {
    console.log(`\n== Import ${importName} ==`);
    await processImport({ ...args, all: false, importName, targetsPreTruncated });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.all) {
    await processAllImports(args);
  } else {
    await processImport(args);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  buildValidatedCte,
  databaseObjectName,
  normalizeDimensions,
  projectedCsvColumns,
  runLoggedOperation,
  targetForeignKeys,
  validateDimensions
};
