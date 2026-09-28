#!/usr/bin/env node
// Compare our upcoming paper/commitment deadlines against the community datasets
// (ccfddl/ccf-deadlines and huggingface/ai-deadlines) and print a Markdown
// report of differences. Prints nothing when everything agrees.
//
// Each conference opts in via `upstream: { ccfddl: AI/nips, hf: neurips }` in its YAML.
import yaml from 'js-yaml';
import { listConferenceFiles, loadConference, toEpoch } from './lib.mjs';

const CCFDDL = 'https://raw.githubusercontent.com/ccfddl/ccf-deadlines/main/conference';
const HF = 'https://raw.githubusercontent.com/huggingface/ai-deadlines/main/src/data/conferences';
const NOW = Date.now();
const HORIZON = NOW - 7 * 24 * 3600e3; // ignore deadlines that passed more than a week ago
const TOLERANCE = 5 * 60e3; // absorbs 23:59:00 vs 23:59:59, but not a 1-hour DST / PST-vs-PDT slip

// Timezone aliases seen in upstream data.
const ALIAS = {
  PT: 'America/Los_Angeles',
  ET: 'America/New_York',
  PDT: 'America/Los_Angeles', // as huggingface renders them: DST-aware
  PST: 'America/Los_Angeles',
  AOE: 'AoE',
  'ANYWHERE ON EARTH': 'AoE',
  'UTC-12 (AOE)': 'AoE',
};

// Labels of huggingface `paper`/`submission` entries that are not the main-track paper deadline.
const HF_SIDE = /proposal|workshop|tutorial|volunteer|award|rising star|spotlight|\bart\b|gallery|poster|demo|doctoral|industry|short paper|reproducib|revision|video|\bforms?\b|conflict|festival|talks|course|panel|real-time|appy|frontiers|competition/i;

async function fetchYaml(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return yaml.load(await res.text(), { schema: yaml.CORE_SCHEMA });
}

// Wall-clock time in an IANA zone -> epoch ms (two-pass offset correction).
function ianaToEpoch(dateTime, zone) {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(dateTime);
  if (!m) return NaN;
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const offsetAt = (ts) => {
    const p = Object.fromEntries(fmt.formatToParts(ts).map((x) => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ts;
  };
  let ts = asUtc - offsetAt(asUtc);
  ts = asUtc - offsetAt(ts);
  return ts;
}

function anyToEpoch(dateTime, tz) {
  if (typeof dateTime !== 'string') return NaN;
  const dt = dateTime.length === 10 ? `${dateTime} 23:59:59` : dateTime.replace('T', ' ').slice(0, 19);
  const z0 = String(tz || 'AoE').trim();
  const zone = (ALIAS[z0.toUpperCase()] ?? z0).replace(/^GMT/, 'UTC');
  const ours = toEpoch(dt, zone);
  if (!Number.isNaN(ours)) return ours;
  try {
    return ianaToEpoch(dt, zone);
  } catch {
    return NaN;
  }
}

// -> [{ year, ts, raw }]. ccfddl lists ARR submission and *ACL commitment deadlines alike as `deadline`.
function ccfddlDeadlines(doc) {
  const conf = Array.isArray(doc) ? doc[0] : doc;
  const out = [];
  for (const c of conf?.confs || []) {
    for (const t of c.timeline || []) {
      if (!t.deadline || t.deadline === 'TBD') continue;
      out.push({ year: c.year, ts: anyToEpoch(t.deadline, c.timezone), raw: `${t.deadline} ${c.timezone}` });
    }
  }
  return out;
}

function hfDeadlines(doc) {
  const out = [];
  for (const c of Array.isArray(doc) ? doc : [doc]) {
    if (!c) continue;
    if (Array.isArray(c.deadlines)) {
      let cand = c.deadlines.filter((d) => (d.type === 'paper' || d.type === 'submission') && !HF_SIDE.test(d.label || ''));
      if (cand.some((d) => d.type === 'paper')) cand = cand.filter((d) => d.type === 'paper');
      else if (cand.some((d) => /paper/i.test(d.label || ''))) cand = cand.filter((d) => /paper/i.test(d.label || ''));
      for (const d of cand) {
        const tz = d.timezone || c.timezone || 'UTC'; // huggingface treats a missing timezone as UTC
        out.push({ year: c.year, ts: anyToEpoch(d.date, tz), raw: `${d.date} ${tz}` });
      }
    } else if (c.deadline && c.deadline !== 'TBA') {
      const tz = c.timezone || 'UTC';
      out.push({ year: c.year, ts: anyToEpoch(c.deadline, tz), raw: `${c.deadline} ${tz}` });
    }
  }
  return out;
}

// Our paper and commitment deadlines (upstream may list either as "the" deadline).
function ourDeadlines(conf) {
  return conf.editions.flatMap((e) => (e.timeline || [])
    .filter((t) => t.type === 'paper' || t.type === 'commitment')
    .map((t) => {
      const tz = t.timezone || e.timezone;
      return { year: e.year, kind: t.type, ts: toEpoch(t.date, tz), raw: `${t.date} ${tz}` };
    }));
}

const fmt = (ts) => `${new Date(ts).toISOString().slice(0, 16).replace('T', ' ')}Z`;

const lines = [];
for (const file of listConferenceFiles()) {
  const conf = loadConference(file);
  if (!conf.upstream) continue;
  const ours = ourDeadlines(conf);
  for (const [name, getter, url] of [
    ['ccfddl', ccfddlDeadlines, conf.upstream.ccfddl && `${CCFDDL}/${conf.upstream.ccfddl}.yml`],
    ['huggingface', hfDeadlines, conf.upstream.hf && `${HF}/${conf.upstream.hf}.yml`],
  ]) {
    if (!url) continue;
    const link = url.replace('raw.githubusercontent.com', 'github.com').replace('/main/', '/blob/main/');
    let all;
    try {
      all = getter(await fetchYaml(url));
    } catch (e) {
      lines.push(`- **${conf.title}** (${name}): could not fetch/parse upstream — ${e.message}`);
      continue;
    }
    // Report (rather than silently drop) upcoming upstream entries we cannot parse.
    for (const d of all.filter((x) => Number.isNaN(x.ts))) {
      const day = Date.parse(`${String(d.raw).slice(0, 10)}T23:59:59Z`);
      if (Number.isNaN(day) || day + 86400e3 >= HORIZON) lines.push(`- **${conf.title} ${d.year}** (${name}): cannot parse upstream deadline \`${d.raw}\`. [upstream](${link})`);
    }
    all = all.filter((d) => !Number.isNaN(d.ts));
    // Compare per edition year, in both directions, for every year where either side has an upcoming deadline.
    const years = new Set([...all, ...ours].filter((d) => d.ts >= HORIZON).map((d) => d.year));
    for (const year of [...years].sort()) {
      const theirs = all.filter((d) => d.year === year);
      const mine = ours.filter((o) => o.year === year);
      if (!theirs.length) continue; // upstream has not listed this edition yet
      if (!mine.some((o) => o.kind === 'paper')) {
        for (const d of theirs.filter((x) => x.ts >= HORIZON)) {
          lines.push(`- **${conf.title} ${year}**: ${name} has a deadline \`${d.raw}\` (${fmt(d.ts)}) but we have no paper deadline. [upstream](${link})`);
        }
        continue;
      }
      const bad = theirs.filter((d) => d.ts >= HORIZON && !mine.some((o) => Math.abs(o.ts - d.ts) <= TOLERANCE));
      // Our upcoming deadline that upstream considers passed (upstream lists nothing upcoming for that year).
      // Parallel-track entries (e.g. short papers) are not orphans while upstream has an upcoming main deadline.
      const orphan = theirs.some((d) => d.ts >= HORIZON) ? []
        : mine.filter((o) => o.kind === 'paper' && o.ts >= HORIZON && !theirs.some((d) => Math.abs(o.ts - d.ts) <= TOLERANCE));
      if (bad.length || orphan.length) {
        lines.push(`- **${conf.title} ${year}**: ${name} says ${theirs.map((d) => `\`${d.raw}\` (${fmt(d.ts)})`).join(', ')}; we say ${mine.map((o) => `\`${o.raw}\` (${o.kind})`).join(', ')}. [upstream](${link})`);
      }
    }
  }
}

if (lines.length) {
  console.log('Differences between our data and upstream community datasets (upcoming paper / commitment deadlines).');
  console.log('Upstream is not always right — check the official CFP before changing anything.\n');
  console.log(lines.join('\n'));
}
