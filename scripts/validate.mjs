#!/usr/bin/env node
// Validate conference YAML files. Usage:
//   node scripts/validate.mjs                 # all files
//   node scripts/validate.mjs path/to/x.yml   # specific files
import path from 'node:path';
import { checkConference, listConferenceFiles, loadConference } from './lib.mjs';

const files = process.argv.slice(2).length
  ? process.argv.slice(2).map((f) => path.resolve(f))
  : listConferenceFiles();

let nErr = 0;
let nWarn = 0;
const editionIds = new Map();

for (const file of files) {
  let conf;
  try {
    conf = loadConference(file);
  } catch (e) {
    console.log(`✗ ${path.basename(file)}\n    error: YAML parse failed: ${e.message.split('\n')[0]}`);
    nErr++;
    continue;
  }
  const { errors, warnings } = checkConference(conf, file);
  for (const ed of Array.isArray(conf?.editions) ? conf.editions : []) {
    if (!ed?.id) continue;
    if (editionIds.has(ed.id)) errors.push(`edition id "${ed.id}" also used in ${editionIds.get(ed.id)}`);
    editionIds.set(ed.id, path.basename(file));
  }
  nErr += errors.length;
  nWarn += warnings.length;
  if (errors.length || warnings.length) {
    console.log(`${errors.length ? '✗' : '⚠'} ${path.basename(file)}`);
    for (const e of errors) console.log(`    error: ${e}`);
    for (const w of warnings) console.log(`    warn:  ${w}`);
  }
}

console.log(`\n${files.length} file(s), ${nErr} error(s), ${nWarn} warning(s)`);
process.exit(nErr ? 1 : 0);
