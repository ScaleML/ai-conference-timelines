# Conference data schema

One YAML file per conference series: `data/conferences/<id>.yml`, where `<id>` is the
lowercase slug used everywhere else (e.g. `iclr`, `neurips`, `acl`, `siggraph-asia`).

Run `npm run validate` (or `node scripts/validate.mjs data/conferences/<id>.yml`) after editing.

```yaml
id: iclr                      # must equal the file name (without .yml)
title: ICLR                   # short display name
full_name: International Conference on Learning Representations
link: https://iclr.cc/        # series homepage
subs: [ML]                    # one or more of: ML CV CG NLP RO SP DM AP KR HCI
rank:                         # omit a key (or use N) when unranked
  ccf: A                      # CCF (2022 list): A | B | C | N
  core: A*                    # CORE (latest ICORE/CORE list): A* | A | B | C | N
  thcpl: A                    # Tsinghua TH-CPL (2019 list, https://numbda.cs.tsinghua.edu.cn/~yuwj/TH-CPL.pdf): A | B | N
dblp: iclr                    # optional, dblp conf key (dblp.org/db/conf/<key>)
interval: 1                   # optional, years between editions (2 for biennial venues such as ICCV/ECCV); default 1
estimate: true                # optional; false disables the site's estimated next deadline (e.g. rolling submissions)
upstream:                     # optional, used by scripts/check-upstream.mjs to flag disagreements
  ccfddl: AI/iclr             #   path under ccfddl/ccf-deadlines/conference/ (without .yml)
  hf: iclr                    #   file name under huggingface/ai-deadlines/src/data/conferences/
editions:                     # newest first
  - year: 2027
    id: iclr27                # <id><2-digit year>, unique across the dataset
    link: https://iclr.cc/Conferences/2027
    date: April 26-30, 2027   # human readable conference dates
    start: 2027-04-26         # YYYY-MM-DD (omit if unknown)
    end: 2027-04-30
    place: San Francisco, CA, USA
    timezone: AoE             # default timezone for the timeline entries below
    timeline:                 # chronological
      - type: abstract
        date: '2026-09-18 23:59:59'
      - type: paper
        date: '2026-09-25 23:59:59'
      - type: rebuttal_start
        date: '2026-11-11 23:59:59'
      - type: notification
        date: '2027-01-22 23:59:59'
    note: Abstract registration is mandatory.     # optional, English, one or two sentences
    sources:                  # URLs actually consulted (official CFP / dates page first)
      - https://iclr.cc/Conferences/2027/Dates
    checked: 2026-09-28       # date the entry was last checked against `sources`
```

## Rules

- **Dates** are the wall-clock time *in the entry's timezone*, formatted `'YYYY-MM-DD HH:MM:SS'` (quoted).
  If the CFP gives only a day, use `23:59:59`.
- **Timezone** values: `AoE` (= UTC-12), `UTC`, or `UTC±H` / `UTC±H:MM` (e.g. `UTC-7`, `UTC+8`, `UTC+5:30`).
  Convert named zones yourself: PDT = UTC-7, PST = UTC-8, EDT = UTC-4, EST = UTC-5, CET = UTC+1, CEST = UTC+2,
  BST = UTC+1, JST = UTC+9, KST = UTC+9, CST (China) = UTC+8. If the CFP gives no timezone, use `AoE` and say so in `note`.
  A timeline entry may carry its own `timezone:` to override the edition default.
- **Timeline `type`** values:
  `abstract` (abstract / registration deadline), `paper` (full paper submission), `supplementary`,
  `commitment` (ARR commitment deadline for *ACL venues), `review_release`, `rebuttal_start`, `rebuttal_end`,
  `notification`, `camera_ready`, `other` (requires `label`).
  Any entry may add `label:` (English, overrides the default label) and `cycle:` (e.g. `Cycle 1`, `February ARR`)
  for venues with several submission rounds (KDD, CHI, UIST, ACL/EMNLP via ARR, SIGGRAPH journal track, ...)
  or parallel tracks with their own deadlines (e.g. `Full papers` / `Short papers`). Entries without `cycle` apply to every round.
- Every edition that has a submission deadline must have at least one `paper` entry.
- Only record **officially announced** information. Never invent next year's dates — the site derives
  "estimated" deadlines from the previous edition automatically. If the official site for the next edition
  exists but has no dates yet, include the edition with `year`, `id`, `link` (and `date`/`place` if known)
  and an empty `timeline: []`.
- Keep editions whose conference ends on or after 2025-07-01 (older history is not needed).
