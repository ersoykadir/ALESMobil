# Prototype validation

Checked on 18 November 2026.

## Automated checks

- `npm test`: 8 tests passed. Covers selection/submit locking, scoring across both sections, wrong/saved filters, draft and active-question persistence, stale content invalidation, corrupt/blocked/full storage, invalid imports, and refusing self-asserted PDF verification.
- `npm run check`: JavaScript syntax checks passed.
- Local HTTP preview: successful HTTP 200 response after a development-server path guard fix.
- GitHub Actions runs the same tests and syntax checks on pull requests and pushes to main.

## Browser checks

Performed with the in-app Chromium browser using the real visible controls:

- Initial submit is disabled until an option is selected.
- Correct geometry answer is submitted, marked C / 35°, locked and counted once.
- Interactive solution opens only after submission; four forward steps reach 35°, with direct step navigation and disabled final control.
- A deliberately wrong ratio answer shows both the selected A and correct D / 40; written explanation opens on request.
- Bookmarking and the saved filter show one matching question; removing the last bookmark shows the empty state.
- Wrong filter shows the wrong question.
- Sözel question selection and correct-answer submission work.
- Reload restores selected section, active question, submitted answers and summary totals.
- An example without written steps explicitly shows the explanation is missing.
- Phone and desktop responsive layouts inspected. Document widths of 267, 390 and 1067 CSS pixels matched their scroll widths (no horizontal overflow); intermediate tablet layout also inspected. The narrow summary layout was tightened after the first inspection.

## Verification limits

Native file-picker automation disconnected the browser session while setting the file. End-to-end browser import is therefore unverified. The import parser, schema rejection, provenance normalization, imported-bank persistence and isolation from changed content were tested in the model tests. No completed browser file import is claimed.

No real iOS/Android device, Safari, screen reader or offline behavior was tested. Browser resizing checks do not substitute for real-device testing. All included questions are newly authored samples; none is marked as an official/PDF-verified question.
