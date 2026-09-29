# AI Conference Timelines

**Live site: https://scaleml.github.io/ai-conference-timelines/**

Countdowns and timelines for conference submission deadlines — AI (ML, CV, NLP, Robotics,
Graphics, Speech, Data Mining, Planning, Knowledge Representation, HCI) plus the top venues in
systems & architecture, networking, security & crypto, databases, SE & PL, theory and
interdisciplinary CS (all TH-CPL A-class conferences). Maintained by the [ScaleML Lab](https://github.com/ScaleML).

AI 会议截稿追踪：倒计时、完整时间线（摘要 / 全文 / rebuttal / 录用通知 / 会议）、CCF / CORE / TH-CPL 分级、
时区换算、日历订阅。数据以各会议官网为准。

## Features

- **Countdown list** sorted by the next submission deadline, with abstract / paper / commitment deadlines,
  notification date, conference dates and place.
- **Timeline view**: a 15-month Gantt-style chart of every venue's milestones (abstract, paper,
  rebuttal window, review period, notification, conference).
- **Estimates** for venues that have not announced their next edition yet, derived from the previous
  edition (clearly marked as *estimated*; can be hidden).
- **Filters**: 17 categories in two groups — AI (URL-compatible with aideadlin.es: `?sub=ML,CV,NLP`) and
  systems & more (`SYS NET SEC DB SE TH MX`) — plus CCF, CORE and
  [TH-CPL](https://numbda.cs.tsinghua.edu.cn/~yuwj/TH-CPL.pdf) rank,
  full-text search, starred venues (stored in the browser; **Share stars** copies a `?stars=a,b,c` link that
  imports them on another device or for a colleague).
- **Timezones**: every deadline is shown in the selected zone (local, Beijing, US Central/Pacific/Eastern,
  London, CET, UTC, AoE) next to the official time.
- **Calendar**: subscribe to `deadlines.ics` (Google / Apple / Outlook), or add a single deadline
  via Google Calendar / `.ics` download.
- Chinese / English UI, light / dark theme, mobile friendly. No framework, no tracking.

## Development

```bash
npm install
npm run validate     # check data/conferences/*.yml
npm run build        # validate + build the static site into dist/
npm run dev          # build and serve dist/ on http://localhost:8080
```

## Updating the data

Each venue is one YAML file in [`data/conferences/`](data/conferences). The format and rules are in
[`data/SCHEMA.md`](data/SCHEMA.md). In short:

1. Open the official CFP / important-dates page.
2. Add or edit the edition (newest first) — dates are wall-clock times in the stated timezone
   (`AoE`, `UTC`, `UTC-7`, ...). Never enter guessed dates; the site estimates unannounced editions itself.
3. Update `sources` and `checked`, run `npm run validate`, open a PR.

`scripts/check-upstream.mjs` compares upcoming paper deadlines with
[ccfddl/ccf-deadlines](https://github.com/ccfddl/ccf-deadlines) and
[huggingface/ai-deadlines](https://github.com/huggingface/ai-deadlines); a weekly GitHub Action keeps an
issue titled *Upstream deadline differences* up to date so that changes are noticed quickly.

## Deployment

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on every push to `main`
and once a day (to refresh the calendar feed). Enable it in *Settings → Pages → Source: GitHub Actions*.

## Credits

Dates are collected from official conference websites and cross-checked against
[ccfddl/ccf-deadlines](https://github.com/ccfddl/ccf-deadlines) and
[huggingface/ai-deadlines](https://github.com/huggingface/ai-deadlines) (both MIT).
Inspired by [aideadlin.es](https://aideadlin.es) and [ccfddl.top](https://ccfddl.top).
