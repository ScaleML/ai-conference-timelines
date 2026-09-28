// AI Conference Deadlines — ScaleML Lab
// Static single-page app: loads data/conferences.json (built from data/conferences/*.yml).

const REPO_URL = 'https://github.com/ScaleML/ai-conference-timelines';
const HOUR = 3600e3;
const DAY = 24 * HOUR;
const SUBMIT_TYPES = new Set(['abstract', 'paper', 'commitment']);

const SUBS = [
  { id: 'ML', group: 'ai', zh: '机器学习', en: 'Machine Learning' },
  { id: 'CV', group: 'ai', zh: '计算机视觉', en: 'Computer Vision' },
  { id: 'NLP', group: 'ai', zh: '自然语言处理', en: 'NLP' },
  { id: 'RO', group: 'ai', zh: '机器人', en: 'Robotics' },
  { id: 'CG', group: 'ai', zh: '图形学', en: 'Graphics' },
  { id: 'SP', group: 'ai', zh: '语音与信号', en: 'Speech & Signal' },
  { id: 'DM', group: 'ai', zh: '数据挖掘', en: 'Data Mining' },
  { id: 'AP', group: 'ai', zh: '自动规划', en: 'Planning' },
  { id: 'KR', group: 'ai', zh: '知识表示', en: 'Knowledge Repr.' },
  { id: 'HCI', group: 'ai', zh: '人机交互', en: 'HCI' },
  { id: 'SYS', group: 'cs', zh: '系统与体系结构', en: 'Systems & Arch.' },
  { id: 'NET', group: 'cs', zh: '网络', en: 'Networking' },
  { id: 'SEC', group: 'cs', zh: '安全与密码', en: 'Security & Crypto' },
  { id: 'DB', group: 'cs', zh: '数据库', en: 'Databases' },
  { id: 'SE', group: 'cs', zh: '软件工程与程序语言', en: 'SE & PL' },
  { id: 'TH', group: 'cs', zh: '理论', en: 'Theory' },
  { id: 'MX', group: 'cs', zh: '交叉学科', en: 'Interdisciplinary' },
];
const SUB_GROUPS = [
  { id: 'ai', zh: 'AI', en: 'AI' },
  { id: 'cs', zh: '系统及其他', en: 'Systems & more' },
];

const TYPE_LABEL = {
  zh: {
    abstract: '摘要截止', paper: '论文截止', supplementary: '补充材料', commitment: 'Commitment',
    review_release: '审稿意见', rebuttal_start: 'Rebuttal 开始', rebuttal_end: 'Rebuttal 结束',
    notification: '录用通知', camera_ready: '终稿截止', other: '其他', conference: '会议召开',
  },
  en: {
    abstract: 'Abstract', paper: 'Paper', supplementary: 'Supplementary', commitment: 'Commitment',
    review_release: 'Reviews out', rebuttal_start: 'Rebuttal starts', rebuttal_end: 'Rebuttal ends',
    notification: 'Notification', camera_ready: 'Camera-ready', other: 'Other', conference: 'Conference',
  },
};

const I18N = {
  zh: {
    title: 'AI 会议截稿追踪',
    timezone: '时区',
    subscribe: '订阅',
    subscribeTitle: '订阅日历（.ics，可添加到 Google / Apple / Outlook 日历）',
    searchPlaceholder: '搜索会议名称、年份、全称或地点…',
    viewList: '列表',
    viewTimeline: '时间线',
    any: '全部',
    all: '全部',
    starredOnly: '只看收藏',
    showEstimated: '显示预计截稿',
    showPast: '显示已截稿',
    loading: '加载中…',
    empty: '没有匹配的会议',
    emptyPast: (n) => `有 ${n} 个匹配的会议已截稿，勾选“显示已截稿”即可查看`,
    emptyFiltered: (n) => `有 ${n} 个会议匹配搜索，但被当前的分类 / 等级 / 收藏筛选隐藏了`,
    clearFilters: '清除筛选',
    loadError: '数据加载失败',
    count: (n, total) => `${n} / ${total} 个会议`,
    sectionUpcoming: '即将截稿',
    sectionPast: '已截稿 / 待公布',
    estimated: '预计',
    estimatedTip: (y) => `尚未公布，按 ${y} 年的日期推算，仅供参考`,
    partlyEstimatedTip: (y) => `部分轮次尚未公布，按 ${y} 年的日期推算（表中标“预计”的行）`,
    tomorrow: '明天',
    icsOf: (name) => `.ics 日历文件 – ${name}`,
    googleOf: (name) => `Google 日历 – ${name}`,
    tbd: '待公布',
    until: (label) => `距${label}`,
    days: '天',
    deadlinePassed: '已截稿',
    next: '下一节点',
    confOngoing: '会议进行中',
    confOver: '会议已结束',
    details: '详情',
    hide: '收起',
    google: 'Google 日历',
    star: '收藏',
    sources: '来源',
    checked: '核对于',
    report: '纠错',
    today: '今天',
    inDays: (n) => `${n} 天后`,
    daysAgo: (n) => `${n} 天前`,
    inHours: (n) => `${n} 小时后`,
    hoursAgo: (n) => `${n} 小时前`,
    inMinutes: (n) => `${n} 分钟后`,
    minutesAgo: (n) => `${n} 分钟前`,
    otherCycles: (n) => `另有 ${n} 个投稿轮次，见详情`,
    milestone: '节点',
    time: '时间',
    original: '官方时间',
    local: '本地时间',
    copied: (u) => `已复制日历订阅链接：${u}`,
    copyManual: (u) => `日历订阅链接：${u}`,
    footer: (repo) => `数据来自各会议官网，并参考了 <a href="https://github.com/ccfddl/ccf-deadlines" target="_blank" rel="noopener">ccfddl</a> 与 <a href="https://github.com/huggingface/ai-deadlines" target="_blank" rel="noopener">huggingface/ai-deadlines</a>（MIT）。时间已换算到所选时区，投稿前请以官网为准。发现错误或想添加会议？欢迎在 <a href="${repo}" target="_blank" rel="noopener">GitHub</a> 修改 <code>data/conferences/*.yml</code> 提交 PR。`,
    updated: (s) => `数据最近核对于 ${s}`,
    built: (s) => `构建于 ${s}`,
    view: '视图',
    categories: '分类',
    toggleTheme: '切换深色 / 浅色主题',
    switchLang: 'Switch to English',
    starConf: (name) => `收藏 ${name}`,
    detailsOf: (name) => `${name} 详情`,
    confStarts: '会议',
    toggleGroup: '选中 / 取消整组',
    legendReview: '审稿期',
    legendRebuttal: 'Rebuttal',
    legendConf: '会议',
    legendEst: '预计',
  },
  en: {
    title: 'AI Conference Deadlines',
    timezone: 'Timezone',
    subscribe: 'Subscribe',
    subscribeTitle: 'Subscribe to the calendar (.ics for Google / Apple / Outlook Calendar)',
    searchPlaceholder: 'Search by name, year, full name or place…',
    viewList: 'List',
    viewTimeline: 'Timeline',
    any: 'Any',
    all: 'All',
    starredOnly: 'Starred only',
    showEstimated: 'Show estimates',
    showPast: 'Show passed',
    loading: 'Loading…',
    empty: 'No matching conferences',
    emptyPast: (n) => `${n} matching conference${n === 1 ? ' has' : 's have'} passed — tick “Show passed” to see ${n === 1 ? 'it' : 'them'}`,
    emptyFiltered: (n) => `${n} conference${n === 1 ? ' matches' : 's match'} your search but ${n === 1 ? 'is' : 'are'} hidden by the category / rank / starred filters`,
    clearFilters: 'Clear filters',
    loadError: 'Failed to load data',
    count: (n, total) => `${n} / ${total} conferences`,
    sectionUpcoming: 'Upcoming',
    sectionPast: 'Passed / TBA',
    estimated: 'Estimated',
    estimatedTip: (y) => `Not announced yet — estimated from the ${y} dates`,
    partlyEstimatedTip: (y) => `Some rounds not announced yet — rows marked Estimated use the ${y} dates`,
    tomorrow: 'tomorrow',
    icsOf: (name) => `.ics calendar file – ${name}`,
    googleOf: (name) => `Google Calendar – ${name}`,
    tbd: 'TBA',
    until: (label) => `until ${label.toLowerCase()}`,
    days: 'd',
    deadlinePassed: 'Deadline passed',
    next: 'Next',
    confOngoing: 'Conference ongoing',
    confOver: 'Conference over',
    details: 'Details',
    hide: 'Hide',
    google: 'Google Calendar',
    star: 'Star',
    sources: 'Sources',
    checked: 'checked',
    report: 'Report an error',
    today: 'today',
    inDays: (n) => `in ${n} day${n === 1 ? '' : 's'}`,
    daysAgo: (n) => `${n} day${n === 1 ? '' : 's'} ago`,
    inHours: (n) => `in ${n} h`,
    hoursAgo: (n) => `${n} h ago`,
    inMinutes: (n) => `in ${n} min`,
    minutesAgo: (n) => `${n} min ago`,
    otherCycles: (n) => `${n} more submission round${n === 1 ? '' : 's'} in details`,
    milestone: 'Milestone',
    time: 'Time',
    original: 'Official',
    local: 'Local time',
    copied: (u) => `Calendar URL copied: ${u}`,
    copyManual: (u) => `Calendar URL: ${u}`,
    footer: (repo) => `Dates come from the official conference websites, cross-checked with <a href="https://github.com/ccfddl/ccf-deadlines" target="_blank" rel="noopener">ccfddl</a> and <a href="https://github.com/huggingface/ai-deadlines" target="_blank" rel="noopener">huggingface/ai-deadlines</a> (MIT). Times are converted to the selected timezone — always double-check the official site before submitting. Found a mistake or missing venue? Edit <code>data/conferences/*.yml</code> on <a href="${repo}" target="_blank" rel="noopener">GitHub</a> and open a PR.`,
    updated: (s) => `Data last checked ${s}`,
    built: (s) => `Built ${s}`,
    view: 'View',
    categories: 'Categories',
    toggleTheme: 'Toggle dark / light theme',
    switchLang: '切换到中文',
    starConf: (name) => `Star ${name}`,
    detailsOf: (name) => `Details for ${name}`,
    confStarts: 'Conference',
    toggleGroup: 'Select / clear the whole group',
    legendReview: 'Review period',
    legendRebuttal: 'Rebuttal',
    legendConf: 'Conference',
    legendEst: 'Estimated',
  },
};

const TZ_OPTIONS = [
  { id: 'local', zh: '本地时间', en: 'Local time' },
  { id: 'Asia/Shanghai', zh: '北京时间 UTC+8', en: 'Beijing UTC+8' },
  { id: 'America/Chicago', zh: '美国中部时间', en: 'US Central' },
  { id: 'America/Los_Angeles', zh: '美国太平洋时间', en: 'US Pacific' },
  { id: 'America/New_York', zh: '美国东部时间', en: 'US Eastern' },
  { id: 'Europe/London', zh: '伦敦时间', en: 'London' },
  { id: 'Europe/Paris', zh: '中欧时间', en: 'Central Europe' },
  { id: 'UTC', zh: 'UTC', en: 'UTC' },
  { id: 'Etc/GMT+12', zh: 'AoE (UTC-12)', en: 'AoE (UTC-12)' },
];

// ---------------------------------------------------------------------------
// State & persistence

const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem(`aidl:${k}`);
      return v == null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(`aidl:${k}`, JSON.stringify(v));
    } catch { /* private mode */ }
  },
};

const params = new URLSearchParams(location.search);
const pickRank = (v, allowed) => {
  const x = (v || '').trim().toUpperCase();
  return allowed.includes(x) ? x : '';
};
const state = {
  lang: params.get('lang') || store.get('lang', navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en'),
  tz: store.get('tz', 'local'),
  view: params.get('view') === 'timeline' ? 'timeline' : 'list',
  subs: new Set((params.get('sub') || '').split(',').map((s) => s.trim().toUpperCase()).filter((s) => SUBS.some((x) => x.id === s))),
  q: params.get('q') || '',
  ccf: pickRank(params.get('ccf'), ['A', 'B', 'C']),
  core: pickRank(params.get('core'), ['A*', 'A', 'B']),
  thcpl: pickRank(params.get('thcpl'), ['A', 'B']),
  starred: params.get('starred') === '1',
  est: params.get('est') !== '0',
  past: params.get('past') === '1',
  expanded: new Set(),
};
if (!I18N[state.lang]) state.lang = 'en';
if (state.tz !== 'local' && !isValidTz(state.tz)) state.tz = 'local';
const stars = new Set(store.get('stars', []));

let DATA = null;
let items = [];
let nextBoundary = Infinity;

const $ = (sel, root = document) => root.querySelector(sel);
const t = (key, ...args) => {
  const v = I18N[state.lang][key];
  return typeof v === 'function' ? v(...args) : v;
};

function syncUrl() {
  const p = new URLSearchParams();
  if (state.subs.size) p.set('sub', [...state.subs].join(','));
  if (state.q) p.set('q', state.q);
  if (state.view !== 'list') p.set('view', state.view);
  if (state.ccf) p.set('ccf', state.ccf);
  if (state.core) p.set('core', state.core);
  if (state.thcpl) p.set('thcpl', state.thcpl);
  if (state.starred) p.set('starred', '1');
  if (!state.est) p.set('est', '0');
  if (state.past) p.set('past', '1');
  if (params.has('lang')) p.set('lang', state.lang);
  const qs = p.toString().replace(/%2C/g, ',');
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

// ---------------------------------------------------------------------------
// Time helpers

function isValidTz(tz) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function tzOffsetMinutes(tz) {
  if (tz === 'AoE') return -720;
  if (tz === 'UTC') return 0;
  const m = /^UTC([+-])(\d{1,2})(?::(\d{2}))?$/.exec(tz);
  if (!m) return 0;
  const mins = Number(m[2]) * 60 + Number(m[3] || 0);
  return m[1] === '+' ? mins : -mins;
}

function toEpoch(dateTime, tz) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}):(\d{2}))?$/.exec(dateTime);
  if (!m) return NaN;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)) - tzOffsetMinutes(tz) * 60e3;
}

function isLeap(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

// Shift a 'YYYY-MM-DD[ HH:MM:SS]' string by n years (Feb 29 clamps to Feb 28).
function shiftYears(s, n) {
  const y = Number(s.slice(0, 4)) + n;
  let md = s.slice(4, 10);
  if (md === '-02-29' && !isLeap(y)) md = '-02-28';
  return `${y}${md}${s.slice(10)}`;
}

const dayTs = (d) => (d ? toEpoch(d, 'UTC') : NaN);

// Calendar days from today (in the display zone) until a date-only 'YYYY-MM-DD'.
function daysUntil(date, now) {
  const p = parts(now, { year: 'numeric', month: '2-digit', day: '2-digit' });
  return Math.round((dayTs(date) - dayTs(`${p.year}-${p.month}-${p.day}`)) / DAY);
}

const fmtCache = new Map();
// `opts.timeZone`: explicit zone; 'browser' forces the browser's zone; otherwise the selected display zone.
function formatter(opts) {
  const key = `${state.lang}|${state.tz}|${JSON.stringify(opts)}`;
  if (!fmtCache.has(key)) {
    const o = { ...opts };
    if (o.timeZone === 'browser') delete o.timeZone;
    else if (!o.timeZone && state.tz !== 'local') o.timeZone = state.tz;
    fmtCache.set(key, new Intl.DateTimeFormat(state.lang === 'zh' ? 'zh-CN' : 'en-US', o));
  }
  return fmtCache.get(key);
}

function parts(ts, opts) {
  const out = {};
  for (const p of formatter(opts).formatToParts(ts)) out[p.type] = p.value;
  return out;
}

// e.g. "2026-11-13 Fri 19:59"
function fmtDateTime(ts, { weekday = true } = {}) {
  const p = parts(ts, { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return `${p.year}-${p.month}-${p.day}${weekday ? ` ${p.weekday}` : ''} ${p.hour}:${p.minute}`;
}

function tzName(ts) {
  if (state.tz === 'Etc/GMT+12') return 'AoE';
  return parts(ts, { timeZoneName: 'shortOffset', hour: 'numeric' }).timeZoneName || '';
}

function fmtOriginal(entry) {
  const time = entry.date.slice(11, 16);
  return `${entry.date.slice(0, 10)} ${time} ${entry.tz}`;
}

function fmtConfDates(ed) {
  if (ed.dateText) return ed.dateText;
  if (ed.start && ed.end && state.lang === 'zh') {
    const [y1, m1, d1] = ed.start.split('-').map(Number);
    const [y2, m2, d2] = ed.end.split('-').map(Number);
    if (ed.start === ed.end) return `${y1}年${m1}月${d1}日`;
    if (y1 === y2 && m1 === m2) return `${y1}年${m1}月${d1}–${d2}日`;
    if (y1 === y2) return `${y1}年${m1}月${d1}日–${m2}月${d2}日`;
    return `${y1}年${m1}月${d1}日–${y2}年${m2}月${d2}日`;
  }
  if (ed.start && ed.end) {
    const f = formatter({ year: 'numeric', month: state.lang === 'zh' ? 'long' : 'short', day: 'numeric', timeZone: 'UTC' });
    const a = new Date(dayTs(ed.start));
    const b = new Date(dayTs(ed.end));
    try {
      return ed.start === ed.end ? f.format(a) : f.formatRange(a, b);
    } catch {
      return `${ed.start} – ${ed.end}`;
    }
  }
  return ed.date || '';
}

function relTime(ts, now) {
  const diff = ts - now;
  const future = diff > 0; // same predicate as the `.passed` class (ts <= now)
  const abs = Math.abs(diff);
  const f = future ? Math.floor : Math.round; // never overstate the time remaining
  if (abs < HOUR) {
    const m = Math.max(1, f(abs / 60e3));
    return future ? t('inMinutes', m) : t('minutesAgo', m);
  }
  if (abs < DAY) {
    const h = f(abs / HOUR);
    return future ? t('inHours', h) : t('hoursAgo', h);
  }
  const d = f(abs / DAY);
  return future ? t('inDays', d) : t('daysAgo', d);
}

function countdownParts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const pad = (n) => String(n).padStart(2, '0');
  return { d, hms: `${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}` };
}

// ---------------------------------------------------------------------------
// Data analysis

function typeLabel(entry) {
  return TYPE_LABEL[state.lang][entry.type] || entry.type;
}

// Short label for compact places; `long` uses the (English) label from the data when present.
function entryLabel(entry, { long = false } = {}) {
  if (long && state.lang === 'en' && entry.label) return entry.label;
  const base = entry.type === 'other' && entry.label ? entry.label : typeLabel(entry);
  return entry.cycle ? `${base} · ${entry.cycle}` : base;
}

// Estimate the next submission round(s) from the most recent edition (+interval years), unless the
// venue opted out (`estimate: false`, e.g. rolling submissions). If the newest edition has announced
// only some of its rounds (e.g. KDD Cycle 1 but not Cycle 2), the missing rounds are first filled in
// from the previous edition, so the estimate doesn't jump a whole year ahead.
function estimateEdition(conf, now) {
  if (conf.estimate === false) return null;
  const step = conf.interval || 1;
  const [latest, prev] = conf.editions.filter((e) => e.timeline.some((x) => x.type === 'paper'));
  if (!latest) return null;
  const project = (base, n) => {
    const year = base.year + n;
    const ann = conf.editions.find((e) => e.year === year);
    const announced = new Set((ann?.timeline || []).map((x) => x.cycle || ''));
    const bump = (str) => (str ? String(str).replace(/\b(19|20)\d{2}\b/g, (y) => String(Number(y) + n)) : str);
    const shifted = base.timeline
      .map((x) => {
        const date = shiftYears(x.date, n);
        return { ...x, date, ts: toEpoch(date, x.tz), label: bump(x.label), cycle: bump(x.cycle), est: true };
      })
      .filter((x) => !announced.has(x.cycle || '')); // rounds already announced for that year
    return { base, n, year, ann, shifted, target: nextSubmit(shifted, now) };
  };
  let best = null;
  if (prev && latest.year - prev.year === step) {
    const fill = project(prev, step); // same year as `latest`: only its missing rounds survive the filter
    if (fill.target) best = fill;
  }
  for (let k = 1; k <= 2 && !best; k++) {
    const p = project(latest, step * k);
    if (p.target) best = p;
  }
  if (!best) return null;
  const { base, n, year, ann, shifted } = best;
  return {
    year,
    id: ann?.id || `${conf.id}${String(year).slice(-2)}`,
    link: ann?.link || conf.link,
    date: ann?.date || null,
    place: ann?.place || null,
    start: ann?.start || (base.start ? shiftYears(base.start, n) : null),
    end: ann?.end || (base.end ? shiftYears(base.end, n) : null),
    dateText: ann && !ann.start ? ann.date || null : null, // announced free-text dates beat shifted ones
    datesEstimated: !ann?.start && !ann?.date, // no official conference dates at all
    datesShifted: !ann?.start, // start/end (used to draw bars) are shifted from `base`
    note: ann?.note || null,
    sources: ann?.sources || [],
    checked: ann?.checked || null,
    timeline: [...(ann?.timeline || []), ...shifted].sort((a, b) => a.ts - b.ts),
    estimated: true,
    partial: !!ann?.timeline.length,
    basedOn: base.year,
  };
}

function nextSubmit(timeline, now) {
  return timeline.find((x) => SUBMIT_TYPES.has(x.type) && x.ts > now) || null;
}

function analyze(conf, now) {
  let target = null;
  let ed = null;
  for (const e of conf.editions) {
    const n = nextSubmit(e.timeline, now);
    if (n && (!target || n.ts < target.ts)) {
      target = n;
      ed = e;
    }
  }
  const est = target ? null : estimateEdition(conf, now);
  const estTarget = est ? nextSubmit(est.timeline, now) : null;

  // Most recent edition whose submission window has closed (the one "under review" or already held).
  const lastEd = conf.editions.find((e) => e.timeline.some((x) => SUBMIT_TYPES.has(x.type) && x.ts <= now)) || null;
  const lastSubmit = lastEd ? Math.max(...lastEd.timeline.filter((x) => SUBMIT_TYPES.has(x.type) && x.ts <= now).map((x) => x.ts)) : -Infinity;

  return { conf, target, ed, est, estTarget, lastEd, lastSubmit };
}

// The (edition, target) shown for an item under the current toggles.
function display(item) {
  if (item.target) return { ed: item.ed, target: item.target, estimated: false };
  if (state.est && item.estTarget) return { ed: item.est, target: item.estTarget, estimated: true };
  // Earliest announced edition after the last closed one (e.g. an edition recorded with `timeline: []`).
  const next = item.conf.editions.filter((e) => !item.lastEd || e.year > item.lastEd.year).at(-1);
  if (next) return { ed: next, target: null, estimated: false };
  return { ed: item.lastEd || item.conf.editions[0], target: null, estimated: false };
}

// Inclusive bounds of a date-only conference range: from the first zone to reach the start day
// (UTC+14) to the last zone to leave the end day (AoE), since the venue's own zone isn't recorded.
function confBounds(ed) {
  if (!ed?.start || !ed?.end || ed.dateText) return null;
  return { start: dayTs(ed.start) - 14 * HOUR, end: dayTs(ed.end) + DAY + 12 * HOUR };
}

function confStatus(ed, now) {
  const b = confBounds(ed);
  if (!b) return null;
  if (now < b.start) return 'upcoming';
  return now < b.end ? 'ongoing' : 'over';
}

// Review-phase edition to mention alongside the next deadline (e.g. ICLR 2027 under review while ICLR 2028 is estimated).
function phaseEdition(item, shownEd, now) {
  const e = item.lastEd;
  if (!e || !shownEd || e.year === shownEd.year) return null;
  const future = e.timeline.find((x) => x.ts > now);
  const status = confStatus(e, now);
  if (!future && status !== 'upcoming' && status !== 'ongoing') return null;
  return { ed: e, next: future, status };
}

function urgency(ms) {
  if (ms < 3 * DAY) return 'critical';
  if (ms < 14 * DAY) return 'soon';
  if (ms < 30 * DAY) return 'near';
  return 'normal';
}

// ---------------------------------------------------------------------------
// Filtering

const CCF_ORDER = { A: 1, B: 2, C: 3 };
const CORE_ORDER = { 'A*': 1, A: 2, B: 3, C: 4 };
const THCPL_ORDER = { A: 1, B: 2 };

// Explicit filters: categories, ranks, starred.
function passesFilters(item) {
  const c = item.conf;
  if (state.subs.size && !c.subs.some((s) => state.subs.has(s))) return false;
  if (state.ccf && !(CCF_ORDER[c.rank.ccf] <= CCF_ORDER[state.ccf])) return false;
  if (state.core && !(CORE_ORDER[c.rank.core] <= CORE_ORDER[state.core])) return false;
  if (state.thcpl && !(THCPL_ORDER[c.rank.thcpl] <= THCPL_ORDER[state.thcpl])) return false;
  if (state.starred && !stars.has(c.id)) return false;
  return true;
}

function matchesQuery(item) {
  if (!state.q) return true;
  const c = item.conf;
  const hay = [c.id, c.title, c.full_name, ...c.editions.map((e) => `${e.place || ''} ${e.year}`), display(item).ed?.year ?? ''].join(' ').toLowerCase();
  return state.q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

const matches = (item) => passesFilters(item) && matchesQuery(item);

// Passed / TBA venues are listed when "Show passed" is on — and always while searching,
// so that looking a venue up by name never comes back empty just because its deadline passed.
const showPast = () => state.past || !!state.q;

// ---------------------------------------------------------------------------
// Rendering helpers

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

const ICON = {
  cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  ext: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function rankBadges(rank, { compact = false } = {}) {
  const out = [];
  if (rank.ccf && rank.ccf !== 'N') out.push(`<span class="badge ccf-${esc(rank.ccf)}${compact ? ' ccf' : ''}" title="CCF ${esc(rank.ccf)}">CCF-${esc(rank.ccf)}</span>`);
  if (compact) return out.join('');
  if (rank.core && rank.core !== 'N') out.push(`<span class="badge core" title="CORE ${esc(rank.core)}">CORE ${esc(rank.core)}</span>`);
  if (rank.thcpl && rank.thcpl !== 'N') out.push(`<span class="badge thcpl" title="清华大学计算机学科群推荐列表 TH-CPL（2019）${esc(rank.thcpl)} 类">TH-CPL ${esc(rank.thcpl)}</span>`);
  return out.join('');
}

function subName(id) {
  return SUBS.find((s) => s.id === id)?.[state.lang] || id;
}

// Submission round shown on a card: the target's, or (no target) the latest round with a submission.
function shownCycle(ed, target) {
  if (target) return target.cycle || null;
  return ed.timeline.filter((x) => SUBMIT_TYPES.has(x.type) && x.cycle).at(-1)?.cycle || null;
}

// Timeline entries relevant to the shown submission round.
function roundEntries(ed, target) {
  if (!ed.timeline.some((y) => y.cycle)) return ed.timeline;
  const cyc = shownCycle(ed, target);
  return ed.timeline.filter((x) => !x.cycle || x.cycle === cyc);
}

function renderDeadlineRows(ed, target, now) {
  const entries = roundEntries(ed, target);
  const rows = entries.filter((x) => SUBMIT_TYPES.has(x.type) || x.type === 'supplementary' || x.type === 'notification');
  const notif = rows.filter((x) => x.type === 'notification');
  const shown = rows.filter((x) => x.type !== 'notification').concat(notif.slice(0, 1));
  const html = shown.map((x) => {
    const cls = [x.ts <= now ? 'passed' : '', target && x === target ? 'target' : ''].join(' ');
    const localTime = `${fmtDateTime(x.ts)} <span class="muted">${esc(tzName(x.ts))}</span>`;
    const orig = x.est ? '' : `<span class="orig" title="${esc(t('original'))}">${esc(fmtOriginal(x))}</span>`;
    return `<li class="${cls}"><span class="k"${x.label ? ` title="${esc(x.label)}"` : ''}>${esc(entryLabel(x))}</span><span class="v">${localTime}</span>${orig}</li>`;
  }).join('');
  const cycles = new Set(ed.timeline.filter((x) => x.cycle).map((x) => x.cycle));
  const more = shownCycle(ed, target) && cycles.size > 1 ? `<li class="muted">${esc(t('otherCycles', cycles.size - 1))}</li>` : '';
  return html ? `<ul class="dl-list">${html}${more}</ul>` : '';
}

function renderStrip(ed, target, now) {
  const entries = roundEntries(ed, target).filter((x) => x.type !== 'other');
  if (entries.length < 2 && !ed.start) return '';
  const s = ed.start ? dayTs(ed.start) : NaN;
  const e = ed.end ? dayTs(ed.end) + DAY : NaN;
  const pts = entries.map((x) => x.ts).concat(Number.isFinite(s) ? [s, e] : []);
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  if (!(hi > lo)) return '';
  const span = hi - lo;
  const pos = (ts) => `${(((ts - lo) / span) * 100).toFixed(2)}%`;
  const marks = entries.map((x) => {
    const tip = `<b>${esc(entryLabel(x, { long: true }))}</b><br>${esc(fmtDateTime(x.ts))} ${esc(tzName(x.ts))}${x.est ? ` · ${esc(t('estimated'))}` : ''}`;
    return `<span class="m t-${x.type}${x.ts <= now ? ' passed' : ''}" style="left:${pos(x.ts)}" data-tip="${esc(tip)}"></span>`;
  }).join('');
  const conf = Number.isFinite(s)
    ? `<span class="conf-span" style="left:${pos(s)};width:${(((e - s) / span) * 100).toFixed(2)}%" data-tip="${esc(`<b>${t('legendConf')}</b><br>${fmtConfDates(ed)}${ed.place ? `<br>${ed.place}` : ''}`)}"></span>`
    : '';
  const nowPct = Math.min(100, Math.max(0, ((now - lo) / span) * 100));
  const nowMark = now > lo && now < hi ? `<span class="now" style="left:${nowPct.toFixed(2)}%" data-tip="${esc(t('today'))}"></span>` : '';
  return `<div class="strip" aria-hidden="true"><span class="track"></span><span class="fill" style="width:${nowPct.toFixed(2)}%"></span>${conf}${marks}${nowMark}</div>`;
}

function renderDetails(item, shown, now) {
  const eds = [shown.ed];
  const ph = phaseEdition(item, shown.ed, now);
  if (ph) eds.push(ph.ed);
  const tables = eds.filter(Boolean).map((ed) => {
    const rows = ed.timeline.map((x) => `
      <tr class="${x.ts <= now ? 'passed' : ''}">
        <td>${esc(entryLabel(x, { long: true }))}${state.lang === 'zh' && x.label ? `<div class="muted" style="font-size:12px">${esc(x.label)}</div>` : ''}</td>
        <td>${esc(fmtDateTime(x.ts))} <span class="muted">${esc(tzName(x.ts))}</span></td>
        <td class="orig">${x.est ? esc(t('estimated')) : esc(fmtOriginal(x))}</td>
        <td class="rel">${esc(relTime(x.ts, now))}</td>
      </tr>`).join('');
    const title = `${item.conf.title} ${ed.year}${ed.estimated ? ` · ${t(ed.partial ? 'partlyEstimatedTip' : 'estimatedTip', ed.basedOn)}` : ''}`;
    const src = ed.sources?.length
      ? `<div class="sources">${esc(t('sources'))}: ${ed.sources.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\//, '').slice(0, 60))}</a>`).join('')}${ed.checked ? ` · ${esc(t('checked'))} ${esc(ed.checked)}` : ''}</div>`
      : '';
    const note = ed.note ? `<div class="note">${esc(ed.note)}</div>` : '';
    const table = rows
      ? `<table><thead><tr><th>${esc(t('milestone'))}</th><th>${esc(t('time'))} (${esc(tzOptionLabel(state.tz))})</th><th>${esc(t('original'))}</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
      : `<div class="muted">${esc(t('tbd'))}</div>`;
    return `<h4>${esc(title)}</h4>${table}${note}${src}`;
  }).join('');
  const report = `<div class="sources"><a href="${REPO_URL}/edit/main/data/conferences/${esc(item.conf.id)}.yml" target="_blank" rel="noopener">${esc(t('report'))} ↗</a>${item.conf.dblp ? ` <a href="https://dblp.org/db/conf/${esc(item.conf.dblp)}/" target="_blank" rel="noopener">dblp ↗</a>` : ''}</div>`;
  return `<div class="details" id="details-${esc(item.conf.id)}">${tables}${report}</div>`;
}

function renderCard(item, now) {
  const c = item.conf;
  const shown = display(item);
  const { ed, target, estimated } = shown;
  const u = target ? urgency(target.ts - now) : 'past';
  const cls = ['card', target ? `u-${u}` : 'is-past', estimated ? 'is-est' : ''].join(' ');
  const starred = stars.has(c.id);
  const year = ed?.year ?? '';
  const titleLink = ed?.link || c.link;

  const badges = [
    estimated ? `<span class="badge est" data-tip="${esc(t(ed.partial ? 'partlyEstimatedTip' : 'estimatedTip', ed.basedOn))}">${esc(t('estimated'))}</span>` : '',
    !target && !ed?.timeline.length ? `<span class="badge tbd">${esc(t('tbd'))}</span>` : '',
    rankBadges(c.rank),
  ].join('');

  const confDates = ed ? fmtConfDates(ed) : '';
  const meta = [
    confDates ? `<span>${ICON.cal}${esc(confDates)}${estimated && ed.datesEstimated ? ` (${esc(t('estimated'))})` : ''}</span>` : '',
    ed?.place ? `<span>${ICON.pin}${esc(ed.place)}</span>` : '',
  ].join('');

  // What is happening with an edition whose submission window has closed.
  const statusText = (e, next, status) => {
    if (next) return `${t('next')}: ${entryLabel(next)} · ${fmtDateTime(next.ts, { weekday: false })}`;
    if (status === 'ongoing') return t('confOngoing');
    if (status === 'over') return t('confOver');
    const dates = fmtConfDates(e);
    const days = e.start && !e.dateText ? daysUntil(e.start, now) : null;
    const rel = days == null ? '' : days <= 0 ? t('today') : days === 1 ? t('tomorrow') : t('inDays', days);
    return dates ? `${t('confStarts')}: ${dates}${rel ? ` · ${rel}` : ''}` : '';
  };
  let phase = '';
  const ph = phaseEdition(item, ed, now);
  if (ph) {
    phase = `<div class="phase-line"><span class="pill">${esc(c.title)} ${ph.ed.year} · ${esc(t('deadlinePassed'))}</span>${esc(statusText(ph.ed, ph.next, ph.status))}</div>`;
  } else if (!target && ed?.timeline.length) {
    const txt = statusText(ed, ed.timeline.find((x) => x.ts > now), confStatus(ed, now));
    if (txt) phase = `<div class="phase-line">${esc(txt)}</div>`;
  }

  const tags = c.subs.map((s) => `<button type="button" class="tag" style="--c:var(--c-${esc(s)})" data-act="sub" data-sub="${esc(s)}">${esc(subName(s))}</button>`).join('');
  const note = ed?.note ? `<div class="note">${esc(ed.note)}</div>` : '';

  let side;
  if (target) {
    const cd = countdownParts(target.ts - now);
    side = `
      <div>
        <div class="cd-label">${esc(t('until', entryLabel(target)))}</div>
        <div class="cd" data-cd="${target.ts}"><span class="d">${cd.d}<small>${esc(t('days'))}</small></span><span class="hms">${cd.hms}</span></div>
      </div>`;
  } else {
    side = `<div><div class="cd done">${esc(ed?.timeline.length ? t('deadlinePassed') : t('tbd'))}</div></div>`;
  }
  const gcal = target ? googleCalUrl(c, ed, target) : null;
  const actions = `
    <div class="side-actions">
      ${gcal ? `<a class="btn-sm" data-act="gcal" href="${esc(gcal)}" target="_blank" rel="noopener" title="${esc(t('google'))}" aria-label="${esc(t('googleOf', `${c.title} ${year}`))}">${ICON.plus}Google</a>` : ''}
      ${target ? `<button type="button" class="btn-sm" data-act="ics" title=".ics" aria-label="${esc(t('icsOf', `${c.title} ${year}`))}">${ICON.down}.ics</button>` : ''}
      <button type="button" class="btn-sm" data-act="details" aria-expanded="${state.expanded.has(c.id)}" aria-controls="details-${esc(c.id)}" aria-label="${esc(`${state.expanded.has(c.id) ? t('hide') : t('details')} ${c.title} ${year}`)}">${esc(state.expanded.has(c.id) ? t('hide') : t('details'))}</button>
    </div>`;

  return `
    <article class="${cls}" data-id="${esc(c.id)}">
      <div class="main">
        <div class="card-head">
          <button type="button" class="star" data-act="star" aria-pressed="${starred}" aria-label="${esc(t('starConf', c.title))}" title="${esc(t('star'))}">${ICON.star}</button>
          <a class="conf-title" href="${esc(titleLink)}" target="_blank" rel="noopener">${esc(c.title)} ${esc(year)}</a>
          ${badges}
        </div>
        <div class="full-name">${esc(c.full_name)}</div>
        ${meta ? `<div class="meta">${meta}</div>` : ''}
        ${ed ? renderDeadlineRows(ed, target, now) : ''}
        ${phase}
        ${note}
        <div class="tags">${tags}</div>
      </div>
      <div class="side">${side}${actions}</div>
      ${ed ? renderStrip(ed, target, now) : ''}
      ${state.expanded.has(c.id) ? renderDetails(item, shown, now) : ''}
    </article>`;
}

// ---------------------------------------------------------------------------
// List view

function sortItems(list) {
  const key = (it) => display(it).target?.ts ?? Infinity;
  return list.slice().sort((a, b) => key(a) - key(b) || a.conf.title.localeCompare(b.conf.title));
}

function renderList(visible, now) {
  const upcoming = sortItems(visible.filter((it) => display(it).target));
  const past = visible
    .filter((it) => !display(it).target)
    .sort((a, b) => b.lastSubmit - a.lastSubmit || a.conf.title.localeCompare(b.conf.title));
  let html = '';
  if (upcoming.length) html += `<h2 class="section-title">${esc(t('sectionUpcoming'))} · ${upcoming.length}</h2>${upcoming.map((it) => renderCard(it, now)).join('')}`;
  if (showPast() && past.length) html += `<h2 class="section-title">${esc(t('sectionPast'))} · ${past.length}</h2>${past.map((it) => renderCard(it, now)).join('')}`;
  $('#list-view').innerHTML = html;
  return upcoming.length + (showPast() ? past.length : 0);
}

// ---------------------------------------------------------------------------
// Timeline view

let tlScroll = null; // user's horizontal position in the timeline; null = scroll so that today is visible

// UTC offset (ms) of the display zone at instant `ts`.
function zoneOffset(ts) {
  const p = parts(ts, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ts / 1000) * 1000;
}

// First instant of the month `add` months after the one containing `ts`, in the display zone.
function monthStart(ts, add) {
  const p = parts(ts, { year: 'numeric', month: 'numeric' });
  const wall = Date.UTC(+p.year, +p.month - 1 + add, 1);
  const guess = wall - zoneOffset(wall);
  return wall - zoneOffset(guess);
}

function monthLabel(ts, withYear) {
  const p = parts(ts, { year: 'numeric', month: 'numeric' });
  const yy = p.year.slice(-2);
  if (state.lang === 'zh') return withYear ? `${yy}年${p.month}月` : `${p.month}月`;
  const mon = formatter({ month: 'short' }).format(ts);
  return withYear ? `${mon} ’${yy}` : mon;
}

function renderTimeline(visible, now) {
  const rows = sortItems(visible.filter((it) => display(it).target || showPast()));
  const lo = monthStart(now, -2);
  const hi = monthStart(now, 13);
  const span = hi - lo;
  const pct = (ts) => ((ts - lo) / span) * 100;
  const inRange = (ts) => ts >= lo && ts <= hi;

  const months = [];
  for (let m = 0; m < 15; m++) {
    const ts = monthStart(lo, m);
    const isYear = parts(ts, { month: 'numeric' }).month === '1';
    months.push({ left: pct(ts), label: monthLabel(ts, isYear || m === 0), isYear });
  }
  const headLabels = months.map((m) => `<span class="tl-month-label${m.isYear ? ' year' : ''}" style="left:${m.left}%">${esc(m.label)}</span>`).join('');
  const gridLines = months.map((m) => `<span class="tl-month${m.isYear ? ' year' : ''}" style="left:${m.left}%"></span>`).join('');

  const rowHtml = rows.map((it) => {
    const c = it.conf;
    const shown = display(it);
    const color = `var(--c-${c.subs[0]})`;
    const eds = [];
    const ph = phaseEdition(it, shown.ed, now);
    if (ph) eds.push(ph.ed);
    if (shown.ed) eds.push(shown.ed);
    let marks = '';
    for (const ed of eds) {
      const tl = ed.timeline;
      const head = (x) => `${c.title} ${ed.year}${x?.est ? ` · ${t('estimated')}` : ''}`;
      const tipHead = (x) => `<b>${esc(c.title)} ${ed.year}</b>${x?.est ? ` · ${esc(t('estimated'))}` : ''}`;
      // review period: last submission-type deadline → first notification
      const lastSub = tl.filter((x) => SUBMIT_TYPES.has(x.type) && x.type !== 'commitment');
      const notif = tl.find((x) => x.type === 'notification');
      if (lastSub.length && notif) {
        const a = Math.max(lo, lastSub[lastSub.length - 1].ts);
        const b = Math.min(hi, notif.ts);
        if (b > a) marks += `<span class="tl-bar review${notif.est ? ' est' : ''}" style="left:${pct(a)}%;width:${pct(b) - pct(a)}%"></span>`;
      }
      const rs = tl.find((x) => x.type === 'rebuttal_start');
      const re = tl.find((x) => x.type === 'rebuttal_end');
      if (rs && re) {
        const a = Math.max(lo, rs.ts);
        const b = Math.min(hi, re.ts);
        if (b > a) marks += `<span class="tl-bar rebuttal${rs.est ? ' est' : ''}" style="left:${pct(a)}%;width:${pct(b) - pct(a)}%" data-tip="${esc(`${tipHead(rs)}<br>${esc(t('legendRebuttal'))}: ${esc(fmtDateTime(rs.ts, { weekday: false }))} → ${esc(fmtDateTime(re.ts, { weekday: false }))}`)}"></span>`;
      }
      if (ed.start && ed.end) {
        const a = Math.max(lo, dayTs(ed.start));
        const b = Math.min(hi, dayTs(ed.end) + DAY);
        const shiftedDates = ed.estimated && ed.datesShifted;
        if (b > a) marks += `<span class="tl-bar conf${shiftedDates ? ' est' : ''}" style="left:${pct(a)}%;width:${pct(b) - pct(a)}%" data-tip="${esc(`${tipHead(shiftedDates ? { est: true } : null)}<br>${esc(t('legendConf'))}: ${esc(fmtConfDates(ed))}${ed.place ? `<br>${esc(ed.place)}` : ''}`)}"></span>`;
      }
      for (const x of tl) {
        if (!inRange(x.ts) || x.type === 'rebuttal_start' || x.type === 'rebuttal_end') continue;
        const kind = ['paper', 'abstract', 'commitment', 'notification'].includes(x.type) ? x.type : 'minor';
        const when = `${fmtDateTime(x.ts)} ${tzName(x.ts)}`;
        const tip = `${tipHead(x)}<br>${esc(entryLabel(x, { long: true }))}: ${esc(when)}<br><span style="opacity:.7">${esc(relTime(x.ts, now))}</span>`;
        const aria = `${head(x)} – ${entryLabel(x, { long: true })}: ${when}, ${relTime(x.ts, now)}`;
        marks += `<span class="tl-mk ${kind}${x.est ? ' est' : ''}${x.ts <= now ? ' passed' : ''}" style="left:${pct(x.ts)}%" data-ts="${x.ts}" data-tip="${esc(tip)}" role="img" aria-label="${esc(aria)}" tabindex="-1"></span>`;
      }
    }
    const year = shown.ed?.year ?? '';
    return `
      <div class="tl-row" data-id="${esc(c.id)}" style="--c:${color}">
        <div class="tl-name"><a href="${esc(shown.ed?.link || c.link)}" target="_blank" rel="noopener" title="${esc(c.full_name)}">${esc(c.title)}</a><span class="yr">${year ? `’${esc(String(year).slice(-2))}` : ''}</span>${rankBadges(c.rank, { compact: true })}</div>
        <div class="tl-track">${marks}</div>
      </div>`;
  }).join('');

  const legend = `
    <div class="tl-legend">
      <span><span class="leg tl-mk abstract" style="--c:var(--accent)"></span>${esc(TYPE_LABEL[state.lang].abstract)}</span>
      <span><span class="leg tl-mk paper" style="--c:var(--accent)"></span>${esc(TYPE_LABEL[state.lang].paper)}</span>
      <span><span class="leg tl-mk commitment" style="--c:var(--accent)"></span>${esc(TYPE_LABEL[state.lang].commitment)}</span>
      <span><span class="leg tl-mk notification"></span>${esc(TYPE_LABEL[state.lang].notification)}</span>
      <span><span class="leg-bar" style="background:color-mix(in srgb, var(--accent) 20%, transparent)"></span>${esc(t('legendReview'))}</span>
      <span><span class="leg-bar" style="background:color-mix(in srgb, var(--accent) 45%, transparent)"></span>${esc(t('legendRebuttal'))}</span>
      <span><span class="leg-bar" style="background:var(--accent)"></span>${esc(t('legendConf'))}</span>
      <span><span class="leg tl-mk paper est" style="--c:var(--accent)"></span>${esc(t('legendEst'))}</span>
    </div>`;

  const nowPct = pct(now);
  // The month header lives outside the horizontal scroller so it can stick below the filter bar;
  // its scrollLeft is kept in sync with the rows.
  $('#timeline-view').innerHTML = `
    ${legend}
    <div class="tl-headwrap" aria-hidden="true">
      <div class="tl-headinner">
        <div class="tl-head"><div class="tl-name"></div><div class="tl-track">${headLabels}<span class="tl-today-label" style="left:${nowPct}%">${esc(t('today'))}</span></div></div>
      </div>
    </div>
    <div class="tl-scroll">
      <div class="tl">
        <div class="tl-grid">${gridLines}<span class="tl-today" style="left:${nowPct}%"></span></div>
        ${rowHtml}
      </div>
    </div>`;

  // One tab stop per row (the next upcoming marker); arrow keys move within the row.
  for (const track of document.querySelectorAll('#timeline-view .tl-row .tl-track')) {
    const mks = [...track.querySelectorAll('.tl-mk')].sort((a, b) => a.dataset.ts - b.dataset.ts);
    (mks.find((m) => Number(m.dataset.ts) > now) || mks.at(-1))?.setAttribute('tabindex', '0');
  }

  const sc = $('#timeline-view .tl-scroll');
  const hw = $('#timeline-view .tl-headwrap');
  const trackW = sc.querySelector('.tl-row .tl-track, .tl-grid')?.offsetWidth || 0;
  sc.scrollLeft = tlScroll ?? Math.max(0, (nowPct / 100) * trackW - 24);
  hw.scrollLeft = sc.scrollLeft;
  sc.addEventListener('scroll', () => {
    tlScroll = sc.scrollLeft;
    hw.scrollLeft = sc.scrollLeft;
  }, { passive: true });
  return rows.length;
}

// ---------------------------------------------------------------------------
// Calendar export

function icsStamp(ms) {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

const utf8 = new TextEncoder();
// Fold content lines at 75 octets (RFC 5545 §3.1).
function icsFold(line) {
  const out = [];
  let buf = '';
  let bytes = 0;
  for (const ch of line) {
    const n = utf8.encode(ch).length;
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

const icsEsc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

function eventTitle(conf, ed, entry) {
  return `${conf.title} ${ed.year}: ${entry.label || TYPE_LABEL.en[entry.type]}${entry.cycle ? ` (${entry.cycle})` : ''}${entry.est ? ' (estimated)' : ''}`;
}

function googleCalUrl(conf, ed, entry) {
  const details = [conf.full_name, entry.est ? 'Estimated from the previous edition' : `${entry.date} ${entry.tz}`, ed.link || conf.link].join('\n');
  const p = new URLSearchParams({ action: 'TEMPLATE', text: eventTitle(conf, ed, entry), dates: `${icsStamp(entry.ts)}/${icsStamp(entry.ts)}`, details });
  return `https://calendar.google.com/calendar/render?${p}`;
}

function downloadIcs(item) {
  const now = Date.now();
  const { ed } = display(item);
  const c = item.conf;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ScaleML//AI Conference Deadlines//EN', 'CALSCALE:GREGORIAN'];
  // Same UID scheme as the subscribable feed (build.mjs): stable across date changes, unique per entry.
  const seen = new Map();
  for (const x of ed.timeline) {
    let uid = [ed.id, x.type, slug(x.cycle)].filter(Boolean).join('-');
    const n = seen.get(uid) || 0;
    seen.set(uid, n + 1);
    if (n) uid += `-${n + 1}`;
    if (x.ts <= now) continue;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}${x.est ? '-est' : ''}@scaleml-ai-deadlines`,
      `DTSTAMP:${icsStamp(now)}`,
      `DTSTART:${icsStamp(x.ts)}`,
      icsFold(`SUMMARY:${icsEsc(eventTitle(c, ed, x))}`),
      icsFold(`DESCRIPTION:${icsEsc(`${c.full_name}\n${x.est ? 'Estimated from the previous edition' : `${x.date} ${x.tz}`}\n${ed.link || c.link}`)}`),
      icsFold(`URL:${ed.link || c.link}`),
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  const blob = new Blob([`${lines.join('\r\n')}\r\n`], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${ed.id}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------------------------------------------------------------------------
// Controls

function tzOptionLabel(id) {
  const o = TZ_OPTIONS.find((x) => x.id === id);
  if (!o) return id;
  if (id === 'local') {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `${o[state.lang]}${zone ? ` · ${zone}` : ''}`;
  }
  return o[state.lang];
}

function renderStatic() {
  document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  document.title = `${t('title')} · ScaleML`;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
  for (const el of document.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  // The visible text ("EN" / "中文") starts the accessible name so voice control can target it.
  $('#lang').innerHTML = state.lang === 'zh' ? '<span lang="en">EN</span>' : '<span lang="zh-CN">中文</span>';
  $('#lang').setAttribute('aria-label', `${state.lang === 'zh' ? 'EN' : '中文'} – ${t('switchLang')}`);
  $('#tz').innerHTML = TZ_OPTIONS.map((o) => `<option value="${o.id}"${o.id === state.tz ? ' selected' : ''}>${esc(tzOptionLabel(o.id))}</option>`).join('');
  $('#q').value = state.q;
  $('#f-ccf').value = state.ccf;
  $('#f-core').value = state.core;
  $('#f-thcpl').value = state.thcpl;
  $('#f-starred').checked = state.starred;
  $('#f-est').checked = state.est;
  $('#f-past').checked = state.past;
  for (const b of document.querySelectorAll('#view-switch button')) b.setAttribute('aria-pressed', String(b.dataset.view === state.view));
  $('#footer-text').innerHTML = t('footer', REPO_URL);
  if (DATA) {
    // A calendar date: shown as-is, not converted through the display timezone.
    if (DATA.dataUpdated) $('#updated').textContent = t('updated', DATA.dataUpdated);
    else {
      const d = new Date(DATA.generated).getTime();
      $('#updated').textContent = t('built', `${fmtDateTime(d, { weekday: false })} ${tzName(d)}`);
    }
  }
  renderChips();
}

function renderChips() {
  const counts = Object.fromEntries(SUBS.map((s) => [s.id, 0]));
  for (const it of items) for (const s of it.conf.subs) counts[s]++;
  const all = `<button type="button" class="chip all" data-sub="" aria-pressed="${state.subs.size === 0}">${esc(t('all'))}<span class="n">${items.length}</span></button>`;
  // One row per group; the group name toggles the whole group.
  $('#subs').innerHTML = SUB_GROUPS.map((g, i) => {
    const members = SUBS.filter((s) => s.group === g.id);
    const full = members.every((s) => state.subs.has(s.id));
    const chips = members.map((s) => `
      <button type="button" class="chip" style="--c:var(--c-${s.id})" data-sub="${s.id}" aria-pressed="${state.subs.has(s.id)}" title="${esc(s.id)}">
        <span class="dot"></span>${esc(s[state.lang])}<span class="n">${counts[s.id]}</span>
      </button>`).join('');
    return `<div class="chip-row">${i === 0 ? all : ''}<button type="button" class="group-btn" data-group="${g.id}" aria-pressed="${full}" title="${esc(t('toggleGroup'))}">${esc(g[state.lang])}</button>${chips}</div>`;
  }).join('');
}

// Re-rendering replaces the DOM; remember what had keyboard focus so it can be restored.
// `redirect` maps an element to where focus should go instead (e.g. a clicked card tag → its filter chip).
function focusKey() {
  const ae = document.activeElement;
  if (!ae || ae === document.body) return null;
  if (ae.closest('#subs')) {
    return ae.dataset.group ? `#subs [data-group="${ae.dataset.group}"]` : `#subs [data-sub="${CSS.escape(ae.dataset.sub ?? '')}"]`;
  }
  const card = ae.closest('#list-view [data-id]');
  if (card) {
    const base = `#list-view [data-id="${CSS.escape(card.dataset.id)}"]`;
    if (ae.dataset.act === 'sub') return `${base} [data-act="sub"][data-sub="${CSS.escape(ae.dataset.sub)}"]`;
    if (ae.dataset.act) return `${base} [data-act="${ae.dataset.act}"]`;
    if (ae.matches('a[href]')) return `${base} a[href="${CSS.escape(ae.getAttribute('href'))}"]`;
    return `${base} .conf-title`;
  }
  const row = ae.closest('#timeline-view .tl-row[data-id]');
  if (row) {
    const base = `#timeline-view .tl-row[data-id="${CSS.escape(row.dataset.id)}"]`;
    if (ae.dataset.ts) return { sel: `${base} .tl-mk[data-ts="${ae.dataset.ts}"]`, roving: true };
    return `${base} .tl-name a`;
  }
  return null;
}

function restoreFocus(key) {
  if (!key || (document.activeElement && document.activeElement !== document.body && document.activeElement.isConnected)) return;
  const sel = typeof key === 'string' ? key : key.sel;
  const el = document.querySelector(sel);
  if (el && key.roving) {
    for (const m of el.parentElement.querySelectorAll('.tl-mk[tabindex="0"]')) m.tabIndex = -1;
    el.tabIndex = 0;
  }
  (el || $('#count'))?.focus({ preventScroll: true });
}

function render() {
  const fk = focusKey();
  const now = Date.now();
  items = DATA.conferences.map((c) => analyze(c, now));
  const visible = items.filter(matches);
  $('#loading').hidden = true;
  $('#list-view').hidden = state.view !== 'list';
  $('#timeline-view').hidden = state.view !== 'timeline';
  const n = state.view === 'list' ? renderList(visible, now) : renderTimeline(visible, now);
  $('#empty').hidden = n > 0;
  if (!n) {
    // Say why nothing is shown and offer the one-click way out.
    const hiddenPast = showPast() ? 0 : visible.filter((it) => !display(it).target).length;
    const filtered = state.q ? items.filter((it) => matchesQuery(it) && !passesFilters(it)).length : 0;
    $('#empty').innerHTML = hiddenPast
      ? `<p>${esc(t('emptyPast', hiddenPast))}</p><button type="button" class="btn-sm" data-act="show-past">${esc(t('showPast'))}</button>`
      : filtered
        ? `<p>${esc(t('emptyFiltered', filtered))}</p><button type="button" class="btn-sm" data-act="clear-filters">${esc(t('clearFilters'))}</button>`
        : `<p>${esc(t('empty'))}</p>`;
  }
  $('#count').textContent = t('count', n, items.length);
  renderChips();
  restoreFocus(fk);

  // Re-render at the next moment anything on screen changes state: a countdown expiring, an urgency
  // threshold (30/14/3 days) being crossed, a milestone passing, a conference ending — and at least hourly
  // so relative times stay fresh.
  const cands = [now + HOUR];
  for (const it of items) {
    const d = display(it);
    if (d.target) {
      cands.push(d.target.ts);
      for (const days of [30, 14, 3]) {
        const b = d.target.ts - days * DAY + 1;
        if (b > now) cands.push(b);
      }
    }
    for (const e of [it.conf.editions, d.ed ? [d.ed] : []].flat()) {
      const next = e.timeline.find((x) => x.ts > now);
      if (next) cands.push(next.ts);
      const b = confBounds(e);
      if (b) for (const x of [b.start, b.end]) if (x > now) cands.push(x);
    }
  }
  nextBoundary = Math.min(...cands);
}

function tick() {
  const now = Date.now();
  $('#clock').textContent = `${fmtDateTime(now)}:${String(new Date(now).getSeconds()).padStart(2, '0')} ${tzName(now)}`;
  if (!DATA) return;
  if (now >= nextBoundary) {
    render();
    return;
  }
  for (const el of document.querySelectorAll('[data-cd]')) {
    const cd = countdownParts(Number(el.dataset.cd) - now);
    const d = el.querySelector('.d');
    const hms = el.querySelector('.hms');
    if (d.firstChild.nodeValue !== String(cd.d)) d.firstChild.nodeValue = String(cd.d);
    hms.textContent = cd.hms;
  }
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { el.hidden = true; }, 5000);
}

function bindEvents() {
  $('#lang').addEventListener('click', () => {
    state.lang = state.lang === 'zh' ? 'en' : 'zh';
    store.set('lang', state.lang);
    syncUrl();
    fmtCache.clear();
    renderStatic();
    render();
  });
  $('#theme').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('aidl:theme', next);
  });
  $('#tz').addEventListener('change', (e) => {
    state.tz = e.target.value;
    store.set('tz', state.tz);
    fmtCache.clear();
    renderStatic();
    render();
    tick();
  });
  $('#subscribe').addEventListener('click', async () => {
    const url = new URL('deadlines.ics', location.href).href;
    try {
      await navigator.clipboard.writeText(url);
      toast(t('copied', url));
    } catch {
      toast(t('copyManual', url));
    }
  });
  let qTimer;
  $('#q').addEventListener('input', (e) => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => {
      state.q = e.target.value.trim();
      syncUrl();
      render();
    }, 120);
  });
  const onFilter = (id, key, prop = 'value') => $(id).addEventListener('change', (e) => {
    state[key] = e.target[prop];
    syncUrl();
    render();
  });
  onFilter('#f-ccf', 'ccf');
  onFilter('#f-core', 'core');
  onFilter('#f-thcpl', 'thcpl');
  onFilter('#f-starred', 'starred', 'checked');
  onFilter('#f-est', 'est', 'checked');
  onFilter('#f-past', 'past', 'checked');

  $('#view-switch').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-view]');
    if (!b) return;
    state.view = b.dataset.view;
    for (const x of document.querySelectorAll('#view-switch button')) x.setAttribute('aria-pressed', String(x === b));
    syncUrl();
    render();
  });

  $('#subs').addEventListener('click', (e) => {
    const g = e.target.closest('.group-btn');
    if (g) {
      const members = SUBS.filter((x) => x.group === g.dataset.group).map((x) => x.id);
      const full = members.every((id) => state.subs.has(id));
      for (const id of members) {
        if (full) state.subs.delete(id);
        else state.subs.add(id);
      }
      syncUrl();
      render();
      return;
    }
    const b = e.target.closest('.chip');
    if (!b) return;
    const s = b.dataset.sub;
    if (!s) state.subs.clear();
    else if (state.subs.has(s)) state.subs.delete(s);
    else state.subs.add(s);
    syncUrl();
    render();
  });

  $('#main').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const card = b.closest('[data-id]');
    const item = card && items.find((it) => it.conf.id === card.dataset.id);
    switch (b.dataset.act) {
      case 'show-past':
        state.past = true;
        $('#f-past').checked = true;
        syncUrl();
        render();
        $('#f-past').focus({ preventScroll: true });
        break;
      case 'clear-filters':
        state.subs.clear();
        state.ccf = state.core = state.thcpl = '';
        state.starred = false;
        renderStatic();
        syncUrl();
        render();
        $('#q').focus({ preventScroll: true });
        break;
      case 'star':
        if (stars.has(item.conf.id)) stars.delete(item.conf.id);
        else stars.add(item.conf.id);
        store.set('stars', [...stars]);
        if (state.starred) render();
        else b.setAttribute('aria-pressed', String(stars.has(item.conf.id)));
        break;
      case 'details':
        if (state.expanded.has(item.conf.id)) state.expanded.delete(item.conf.id);
        else state.expanded.add(item.conf.id);
        render();
        break;
      case 'ics':
        downloadIcs(item);
        break;
      case 'sub':
        state.subs = new Set([b.dataset.sub]);
        syncUrl();
        render();
        $(`#subs [data-sub="${CSS.escape(b.dataset.sub)}"]`)?.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      default:
    }
  });

  document.addEventListener('keydown', (e) => {
    const q = $('#q');
    if (e.key === '/' && document.activeElement !== q && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)) {
      e.preventDefault();
      q.focus();
      q.select();
    } else if (e.key === 'Escape' && document.activeElement === q && q.value) {
      q.value = '';
      q.dispatchEvent(new Event('input'));
    }
  });

  // Tooltips for [data-tip] (hover, keyboard focus, tap).
  const tip = $('#tooltip');
  const show = (el) => {
    tip.innerHTML = el.dataset.tip;
    tip.hidden = false;
    const r = el.getBoundingClientRect();
    const tr = tip.getBoundingClientRect();
    let x = r.left + r.width / 2 - tr.width / 2;
    x = Math.max(8, Math.min(x, innerWidth - tr.width - 8));
    let y = r.top - tr.height - 8;
    if (y < 8) y = r.bottom + 8;
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
  };
  const hide = () => { tip.hidden = true; };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !tip.hidden) hide();
  });

  // Timeline: arrow keys move between the markers of a row (roving tabindex).
  $('#timeline-view').addEventListener('keydown', (e) => {
    const mk = e.target.closest?.('.tl-mk');
    if (!mk || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const row = [...mk.parentElement.querySelectorAll('.tl-mk')].sort((a, b) => a.dataset.ts - b.dataset.ts);
    const i = row.indexOf(mk);
    const j = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: row.length - 1 }[e.key];
    const next = row[Math.max(0, Math.min(row.length - 1, j))];
    if (!next || next === mk) return;
    e.preventDefault();
    mk.tabIndex = -1;
    next.tabIndex = 0;
    next.focus();
  });
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('[data-tip]');
    if (el) show(el);
    else hide();
  });
  document.addEventListener('focusin', (e) => {
    const el = e.target.closest('[data-tip]');
    if (el) show(el);
  });
  document.addEventListener('focusout', hide);
  document.addEventListener('scroll', hide, { passive: true, capture: true });
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-tip]');
    if (el && matchMedia('(hover: none)').matches) show(el);
  });

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if ((localStorage.getItem('aidl:theme') || 'auto') === 'auto') document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
  });
}

// Height of the sticky filter bar, used for scroll-padding and the sticky timeline header (0 when not sticky).
function trackControlsHeight() {
  const ctl = $('#controls');
  const set = () => document.documentElement.style.setProperty('--controls-h',
    getComputedStyle(ctl).position === 'sticky' ? `${ctl.offsetHeight}px` : '0px');
  new ResizeObserver(set).observe(ctl);
  addEventListener('resize', set);
  set();
}

async function main() {
  trackControlsHeight();
  renderStatic();
  bindEvents();
  tick();
  setInterval(tick, 1000);
  try {
    const res = await fetch('data/conferences.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.statusText);
    DATA = await res.json();
  } catch (err) {
    $('#loading').textContent = `${t('loadError')}: ${err.message}`;
    return;
  }
  renderStatic();
  render();
}

main();
