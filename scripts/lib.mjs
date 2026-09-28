// Shared helpers for validate.mjs and build.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CONF_DIR = path.join(ROOT, 'data', 'conferences');

export const SUBS = ['ML', 'CV', 'CG', 'NLP', 'RO', 'SP', 'DM', 'AP', 'KR', 'HCI'];
export const RANKS = {
  ccf: ['A', 'B', 'C', 'N'],
  core: ['A*', 'A', 'B', 'C', 'N'],
  thcpl: ['A', 'B', 'N'],
};
export const TYPES = [
  'abstract', 'paper', 'supplementary', 'commitment', 'review_release',
  'rebuttal_start', 'rebuttal_end', 'notification', 'camera_ready', 'other',
];

const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2} ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TZ_RE = /^(AoE|UTC|UTC[+-](0?\d|1[0-4])(:(00|15|30|45))?)$/;

// Allowed keys; anything else is almost certainly a typo (e.g. `timzone:`) and would be silently ignored.
const KEYS = {
  conf: ['id', 'title', 'full_name', 'link', 'subs', 'rank', 'dblp', 'interval', 'estimate', 'upstream', 'editions'],
  edition: ['year', 'id', 'link', 'date', 'start', 'end', 'place', 'timezone', 'timeline', 'note', 'sources', 'checked'],
  entry: ['type', 'date', 'timezone', 'label', 'cycle'],
};
const unknownKeys = (o, allowed) => Object.keys(o).filter((k) => !allowed.includes(k));

// Parse a timezone string into an offset in minutes east of UTC (null if invalid).
export function tzOffsetMinutes(tz) {
  if (tz === 'AoE') return -12 * 60;
  if (tz === 'UTC') return 0;
  const m = /^UTC([+-])(\d{1,2})(?::(\d{2}))?$/.exec(tz);
  if (!m) return null;
  const mins = Number(m[2]) * 60 + Number(m[3] || 0);
  const off = m[1] === '+' ? mins : -mins;
  return off >= -720 && off <= 840 && Number(m[3] || 0) < 60 ? off : null;
}

export const isValidTz = (tz) => typeof tz === 'string' && TZ_RE.test(tz) && tzOffsetMinutes(tz) !== null;

// Convert a wall-clock 'YYYY-MM-DD HH:MM:SS' in `tz` to epoch milliseconds (NaN if anything is invalid).
export function toEpoch(dateTime, tz) {
  const off = tzOffsetMinutes(tz);
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(dateTime);
  if (off === null || !m) return NaN;
  const [y, mo, d, h, mi, s] = m.slice(1).map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi, s);
  const t = new Date(asUtc);
  // Reject values Date.UTC would silently roll over (month 13, Feb 30, 24:00, :60, ...).
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d
    || t.getUTCHours() !== h || t.getUTCMinutes() !== mi || t.getUTCSeconds() !== s) return NaN;
  return asUtc - off * 60 * 1000;
}

export function isValidCalendarDate(s) {
  if (!DATE_RE.test(s)) return false;
  const [y, mo, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function loadConference(file) {
  // CORE_SCHEMA keeps dates as plain strings instead of JS Date objects.
  return yaml.load(fs.readFileSync(file, 'utf8'), { schema: yaml.CORE_SCHEMA, filename: path.relative(ROOT, file) });
}

export function listConferenceFiles() {
  return fs.readdirSync(CONF_DIR)
    .filter((f) => f.endsWith('.yml'))
    .sort()
    .map((f) => path.join(CONF_DIR, f));
}

// Returns { errors: string[], warnings: string[] } for one parsed conference.
export function checkConference(conf, file) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);
  const base = path.basename(file, '.yml');

  if (!conf || typeof conf !== 'object') return { errors: ['file is empty or not a mapping'], warnings };
  for (const k of unknownKeys(conf, KEYS.conf)) err(`unknown key "${k}"`);
  if (conf.id !== base) err(`id "${conf.id}" must equal file name "${base}"`);
  for (const k of ['title', 'full_name', 'link']) if (!conf[k] || typeof conf[k] !== 'string') err(`missing ${k}`);
  if (conf.link && !/^https?:\/\//.test(conf.link)) err(`link is not a URL: ${conf.link}`);
  if (!Array.isArray(conf.subs) || conf.subs.length === 0) err('subs must be a non-empty list');
  else for (const s of conf.subs) if (!SUBS.includes(s)) err(`unknown sub "${s}" (allowed: ${SUBS.join(' ')})`);
  if (conf.rank != null) {
    if (typeof conf.rank !== 'object') err('rank must be a mapping');
    else for (const [k, v] of Object.entries(conf.rank)) {
      if (!RANKS[k]) err(`unknown rank system "${k}"`);
      else if (!RANKS[k].includes(String(v))) err(`rank.${k} "${v}" not in ${RANKS[k].join('/')}`);
    }
  }
  if (conf.interval != null && ![1, 2, 3].includes(conf.interval)) err('interval must be 1, 2 or 3 (years between editions)');
  if (conf.estimate != null && typeof conf.estimate !== 'boolean') err('estimate must be true or false');
  if (conf.upstream != null) {
    if (typeof conf.upstream !== 'object') err('upstream must be a mapping');
    else for (const [k, v] of Object.entries(conf.upstream)) {
      if (!['ccfddl', 'hf'].includes(k)) err(`unknown upstream "${k}" (allowed: ccfddl, hf)`);
      else if (typeof v !== 'string' || !v) err(`upstream.${k} must be a non-empty string`);
    }
  }
  if (!Array.isArray(conf.editions) || conf.editions.length === 0) {
    err('editions must be a non-empty list');
    return { errors, warnings };
  }

  let prevYear = Infinity;
  conf.editions.forEach((ed, i) => {
    const where = `editions[${i}]${ed && ed.id ? ` (${ed.id})` : ''}`;
    if (!ed || typeof ed !== 'object') return err(`${where}: not a mapping`);
    for (const k of unknownKeys(ed, KEYS.edition)) err(`${where}: unknown key "${k}"`);
    if (!Number.isInteger(ed.year)) err(`${where}: year must be an integer`);
    else {
      if (ed.year > prevYear) err(`${where}: editions must be ordered newest first`);
      prevYear = ed.year;
      const expect = `${conf.id}${String(ed.year).slice(-2)}`;
      if (ed.id !== expect) warn(`${where}: id "${ed.id}" differs from conventional "${expect}"`);
    }
    if (!ed.id || typeof ed.id !== 'string') err(`${where}: missing id`);
    if (ed.link && !/^https?:\/\//.test(ed.link)) err(`${where}: link is not a URL`);
    for (const k of ['start', 'end']) {
      if (ed[k] != null && !isValidCalendarDate(String(ed[k]))) err(`${where}: ${k} must be YYYY-MM-DD, got "${ed[k]}"`);
    }
    if (ed.start && ed.end && ed.start > ed.end) err(`${where}: start is after end`);
    if (ed.end && ed.end < '2025-07-01') warn(`${where}: ended before 2025-07-01, can be dropped`);
    if (ed.timezone != null && !isValidTz(ed.timezone)) err(`${where}: bad timezone "${ed.timezone}"`);
    if (!Array.isArray(ed.timeline)) return err(`${where}: timeline must be a list (use [] if unknown)`);

    let prev = -Infinity;
    let hasPaper = false;
    ed.timeline.forEach((t, j) => {
      const w = `${where}.timeline[${j}]`;
      if (!t || typeof t !== 'object') return err(`${w}: not a mapping`);
      for (const k of unknownKeys(t, KEYS.entry)) err(`${w}: unknown key "${k}"`);
      if (!TYPES.includes(t.type)) err(`${w}: unknown type "${t.type}"`);
      if (t.type === 'paper') hasPaper = true;
      if (t.type === 'other' && !t.label) err(`${w}: type "other" requires a label`);
      for (const k of ['label', 'cycle']) {
        if (t[k] != null && (typeof t[k] !== 'string' || !t[k].trim())) err(`${w}: ${k} must be a non-empty string (quote it)`);
      }
      const tz = t.timezone ?? ed.timezone;
      if (!tz) err(`${w}: no timezone (set edition.timezone or entry.timezone)`);
      else if (!isValidTz(tz)) err(`${w}: bad timezone "${tz}"`);
      if (typeof t.date !== 'string' || !DATE_TIME_RE.test(t.date) || !isValidCalendarDate(t.date.slice(0, 10))) {
        return err(`${w}: date must be 'YYYY-MM-DD HH:MM:SS', got "${t.date}"`);
      }
      const ms = toEpoch(t.date, tz);
      if (ms < prev && !t.cycle) warn(`${w}: timeline is not chronological`);
      prev = Math.max(prev, ms);
      if (t.type === 'paper' && ed.start && t.date.slice(0, 10) > ed.start) {
        err(`${w}: paper deadline ${t.date} is after the conference start ${ed.start}`);
      }
    });
    if (ed.timeline.length > 0 && !hasPaper) err(`${where}: timeline has entries but no "paper" deadline`);
    if (ed.timeline.length > 0) {
      if (!Array.isArray(ed.sources) || ed.sources.length === 0) warn(`${where}: no sources listed`);
      if (!ed.checked) warn(`${where}: missing checked date`);
    }
    if (ed.sources != null) {
      if (!Array.isArray(ed.sources)) err(`${where}: sources must be a list`);
      else for (const s of ed.sources) if (!/^https?:\/\//.test(s)) err(`${where}: source is not a URL: ${s}`);
    }
    if (ed.checked != null && !isValidCalendarDate(String(ed.checked))) err(`${where}: checked must be YYYY-MM-DD`);
  });
  return { errors, warnings };
}
