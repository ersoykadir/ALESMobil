# Question data contract · v1

The shipped bank contains only newly authored practice questions. Do not add the supplied PDF, embedded images, its reference HTML, or the copyrighted exam to this repository or its deployed output.

## Local source inspection

The uploaded `ALES1_sorular.pdf` was inspected locally. The cover identifies 2021 ALES/1 (2 May 2021) and explicitly prohibits copying, reproduction, publication or use without written permission. PDF page 15 (printed page 13) contains numerical question 44, including its geometry givens and options; the numerical answer key on PDF page 36 lists C for question 44. Text extraction and a rendered view of the relevant question page were checked. This verifies only those observations about the source, not a right to publish the question or a full set of explanations.

The supplied `ALES_44_Sekil_Uzerinde_Cozum.html` demonstrates cumulative overlays, previous/next steps and direct step selection. It embeds an exam image; neither that image nor its source HTML/SVG paths are included here. The prototype applies the interaction pattern to an original isosceles-triangle problem (55°, 70°, 35°). It does not represent that example as official question 44 or claim its text was verified against the PDF.

## Import structure

Top-level fields:

| Field | Value |
| --- | --- |
| `schemaVersion` | `1` |
| `id` | Stable bank ID, up to 100 ASCII letters, digits, `_` or `-` |
| `title` | Nonempty display title, up to 150 characters |
| `license.kind` | `original` or `licensed` |
| `license.statement` | Ownership/permission description, up to 2000 characters |
| `questions` | 1–200 question objects |

Question fields:

| Field | Value |
| --- | --- |
| `id` | Unique within bank, same safe characters as bank ID |
| `section` | `sayisal` or `sozel` |
| `topic` | Nonempty text, up to 100 characters |
| `title` | Nonempty text, up to 150 characters |
| `prompt` | Plain text, up to 6000 characters |
| `passage` | Optional plain text paragraph, up to 6000 characters |
| `options` | Exactly 5 distinct nonempty strings, up to 2000 characters each |
| `answer` | Zero-based correct option index: A=0, B=1, C=2, D=3, E=4 |
| `explanation` | `null`/omitted when absent, or 1–12 plain text steps, each up to 6000 characters |

IDs `__proto__`, `constructor` and `prototype` are reserved. The bundled sample bank ID is also reserved during import. Interactive/diagram identifiers are not accepted in imports. No external URL or executable HTML is fetched from an imported bank. Extra fields are discarded. Licensing is user-asserted; the app is not a legal validator.

The importer always normalizes provenance to `kind: imported, verification: unverified`. It does not accept a self-asserted PDF verification badge. A future editorial workflow should require reviewed source identity, page and question locators, answer-key evidence, permission documentation and a reviewer before publishing verified content. Those capabilities are intentionally not claimed by this prototype.

## Editing shipped samples

Edit `dist/questions.js`. Keep the bank content original or appropriately licensed. `explanation: null` means the detailed solution is missing; do not fill it with an invented attribution. The single built-in SVG interaction is rendered by `dist/app.js`, with step text from `geometrySteps` in `dist/questions.js`. Future interactive types must be explicitly implemented and reviewed, not loaded as arbitrary scripts from question data.

Progress is bound to the normalized complete bank content. Changing questions, options or answer keys invalidates that bank's saved progress. There is no silent regrading of a different content revision.
