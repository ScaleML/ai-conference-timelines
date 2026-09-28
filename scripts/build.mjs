#!/usr/bin/env node
// Build the static site into dist/:
//   dist/index.html, app.js, styles.css, ...   (copied from site/)
//   dist/data/conferences.json                  (all YAML merged, with UTC timestamps)
//   dist/deadlines.ics                          (subscribable calendar of announced deadlines)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, listConferenceFiles, loadConference, toEpoch } from './lib.mjs';

const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

const DIST = path.resolve(process.env.DIST_DIR || path.join(ROOT, 'dist'));
const SITE = path.join(ROOT, 'site');

const DEFAULT_LABELS = {
  abstract: 'Abstract deadline',
  paper: 'Paper deadline',
  supplementary: 'Supplementary deadline',
  commitment: 'Commitment deadline',
  review_release: 'Reviews released',
  rebuttal_start: 'Rebuttal starts',
  rebuttal_end: 'Rebuttal ends',
  notification: 'Notification',
  camera_ready: 'Camera-ready deadline',
  other: 'Milestone',
};

function buildData() {
  const conferences = listConferenceFiles().map((file) => {
    const c = loadConference(file);
    return {
      id: c.id,
      title: c.title,
      full_name: c.full_name,
      link: c.link,
      subs: c.subs,
      rank: c.rank || {},
      dblp: c.dblp || null,
      interval: c.interval || 1,
      estimate: c.estimate !== false,
      editions: c.editions.map((e) => ({
        year: e.year,
        id: e.id,
        link: e.link || c.link,
        date: e.date || null,
        start: e.start || null,
        end: e.end || null,
        place: e.place || null,
        note: e.note || null,
        sources: e.sources || [],
        checked: e.checked || null,
        timeline: (e.timeline || []).map((t) => {
          const tz = t.timezone || e.timezone;
          const ts = toEpoch(t.date, tz);
          if (Number.isNaN(ts)) {
            throw new Error(`${path.relative(ROOT, file)}: ${e.id}: invalid date/timezone ${JSON.stringify(t.date)} ${JSON.stringify(tz)} (${t.type}) — run npm run validate`);
          }
          return {
            type: t.type,
            label: t.label != null ? String(t.label) : null,
            cycle: t.cycle != null ? String(t.cycle) : null,
            date: t.date,
            tz,
            ts,
          };
        }).sort((a, b) => a.ts - b.ts),
      })),
    };
  });
  // Freshness shown on the site = the most recent date an entry was checked against its sources
  // (not the build time, which the daily rebuild would keep resetting).
  const checked = conferences.flatMap((c) => c.editions.map((e) => e.checked)).filter(Boolean).sort();
  return { generated: new Date().toISOString(), dataUpdated: checked.at(-1) || null, conferences };
}

// ---- iCalendar -------------------------------------------------------------

function icsEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function icsStamp(ms) {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Fold lines longer than 75 octets as required by RFC 5545.
function fold(line) {
  const out = [];
  let buf = '';
  let bytes = 0;
  for (const ch of line) {
    const n = Buffer.byteLength(ch);
    if (bytes + n > 74) {
      out.push(buf);
      buf = ' ';
      bytes = 1;
    }
    buf += ch;
    bytes += n;
  }
  out.push(buf);
  return out.join('\r\n');
}

function buildIcs(data) {
  const now = icsStamp(Date.now());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ScaleML//AI Conference Deadlines//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:AI Conference Deadlines',
    'X-WR-CALDESC:Submission deadlines of AI conferences (ScaleML Lab)',
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
    'X-PUBLISHED-TTL:PT12H',
  ];
  const cutoff = Date.now() - 90 * 24 * 3600 * 1000;
  for (const c of data.conferences) {
    for (const e of c.editions) {
      // UIDs are stable across date changes (so calendar clients update events in place)
      // and unique within an edition (type + cycle, with a counter for repeats).
      const seen = new Map();
      for (const t of e.timeline) {
        let uid = [e.id, t.type, slug(t.cycle)].filter(Boolean).join('-');
        const n = seen.get(uid) || 0;
        seen.set(uid, n + 1);
        if (n) uid += `-${n + 1}`;
        if (!['abstract', 'paper', 'commitment'].includes(t.type) || t.ts < cutoff) continue;
        const label = t.label || DEFAULT_LABELS[t.type];
        const summary = `${c.title} ${e.year}: ${label}${t.cycle ? ` (${t.cycle})` : ''}`;
        const desc = [
          c.full_name,
          `${label}: ${t.date} ${t.tz}`,
          e.date && `Conference: ${e.date}${e.place ? `, ${e.place}` : ''}`,
          e.link,
        ].filter(Boolean).join('\n');
        lines.push(
          'BEGIN:VEVENT',
          `UID:${uid}@scaleml-ai-deadlines`,
          `DTSTAMP:${now}`,
          `DTSTART:${icsStamp(t.ts)}`,
          fold(`SUMMARY:${icsEscape(summary)}`),
          fold(`DESCRIPTION:${icsEscape(desc)}`),
          fold(`URL:${e.link}`),
          'BEGIN:VALARM',
          'ACTION:DISPLAY',
          fold(`DESCRIPTION:${icsEscape(summary)}`),
          'TRIGGER:-P7D',
          'END:VALARM',
          'END:VEVENT',
        );
      }
    }
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

// ---- main ------------------------------------------------------------------

// Generate everything first, then swap the output directory in, so a failure never leaves a half-built dist/.
const data = buildData();
const json = JSON.stringify(data);
const ics = buildIcs(data);
const TMP = `${DIST}.tmp`;
fs.rmSync(TMP, { recursive: true, force: true });
fs.cpSync(SITE, TMP, { recursive: true });
fs.mkdirSync(path.join(TMP, 'data'), { recursive: true });
fs.writeFileSync(path.join(TMP, 'data', 'conferences.json'), json);
fs.writeFileSync(path.join(TMP, 'deadlines.ics'), ics);
fs.writeFileSync(path.join(TMP, '.nojekyll'), '');
fs.rmSync(DIST, { recursive: true, force: true });
fs.renameSync(TMP, DIST);

const nEd = data.conferences.reduce((n, c) => n + c.editions.length, 0);
console.log(`built dist/: ${data.conferences.length} conferences, ${nEd} editions`);
