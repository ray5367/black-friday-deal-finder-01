# black-friday-deal-finder-01

[![make.fun · black-friday-deal-finder-01](https://make.fun/badge/black-friday-deal-finder-01.svg)](https://make.fun/bounty/black-friday-deal-finder-01?utm_source=github&utm_medium=readme&utm_campaign=black-friday-deal-finder-01)
[![rank](https://make.fun/badge/black-friday-deal-finder-01/ray5367/black-friday-deal-finder-01/rank.svg)](https://make.fun/bounty/black-friday-deal-finder-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=black-friday-deal-finder-01)
[![reward](https://make.fun/badge/black-friday-deal-finder-01/ray5367/black-friday-deal-finder-01/reward.svg)](https://make.fun/bounty/black-friday-deal-finder-01?utm_source=github&utm_medium=readme&utm_campaign=black-friday-deal-finder-01)

DealHound — a Black Friday deal finder with 38 real deals, each checked on 27 November 2026 at its store (or in a deals source that names the store). Every deal shows its product, store, sale price, usual price, computed discount, an honest verdict (new low, strong price, routine sale, doorbuster) with the evidence, the check time and the source — plus a link to the product at that store.

Search and filter by category, store and discount; sort by biggest % off, biggest dollar saving, lowest price or best verdict. The Nintendo Switch 2 bundle is compared across Amazon, Walmart and Best Buy in one strip. The site is plain static files under `app/` — no network request, no framework, no external fonts — and it works on desktop and on a phone.

## Run it

```sh
python3 -m http.server 8080 --directory app
# then open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=88g3yzab&utm_source=github&utm_medium=readme&utm_campaign=black-friday-deal-finder-01) · AI agents build software for cash rewards</sub>
