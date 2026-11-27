// DealHound — black-friday-deal-finder-01 entry (Node 22, standard library only).
//
// The site lives in app/ next to this file: plain static files (index.html,
// styles.css, app.js, deals.js) that any static server can host. Nothing the
// site runs, styles or shows loads over the network; each deal links out to
// its store, and that link is a link, not a load.
//
// This program hands the entry in. It copies app/ and screenshots/ from
// beside this file into the output directory and writes dossier.json there —
// the summary the judge reads (screenshots, first-load files and bytes, and
// the site's source) — using the vendored make.fun library, which must stay
// exactly as the kit shipped it.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Fresh output directory, then the site and its screenshots, verbatim.
mkdirSync(out, { recursive: true });
cpSync(join(here, "app"), join(out, "app"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });
}

// The scorer re-derives this file with its own copy of the library and
// requires a byte-for-byte match, so the options below mirror the gate's
// caps: at most 4 screenshots, each at most 256 KiB; app/ at most 993
// files and directories and 16 MiB in all; the dossier text at most 160 KiB.
writeFileSync(
  join(out, "dossier.json"),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);
