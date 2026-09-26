# Calculator performance audit

Audited on 2026-09-27 at commit `7ee0b5b`. Three independent subagent passes covered computation, React interactions, and loading. The PR applies the scheduling change to `f1568a5`, the newer main branch. That base fixes the simulation count at 100,000 and adds theme configuration. The shared engine is unchanged between those bases.

## Implemented improvement

`runSimulation` previously completed 5,000 trajectories before returning control to the browser. An expensive target set made those batches last about 100 ms in the calculator UI.

The engine now checks elapsed time every 100 trajectories and yields after an 8 ms budget, while retaining the 5,000-trajectory cap. It uses `scheduler.yield()` when available. The timer fallback schedules the next callback before doing work, so its minimum delay overlaps computation. Completion and failure cancel pending timer work.

The contract remains `SimulationTargets -> Promise<SimResult[]>`. The probability logic, trial order, result fields, and callers are unchanged. No dependencies were added.

## Measurements

Measurements used headless Chrome 154.0.8037.57 on the local Mac, a production static export, and three runs per scenario. Each engine scenario used 100,000 trajectories. Mixed targets mean `charA=7`, `charB=7`, `weapA=5`, and `weapB=5`, with zero starting pity and no guarantee. This is a representative expensive workload, not an enforced maximum.

| Scripted calculator UI measurement | Baseline median | Final median |
| --- | ---: | ---: |
| Citlali run duration | 2,289.5 ms | 1,763.2 ms |
| Citlali long-task count | 21 | 0 |
| Citlali long-task blocking time | 631 ms | 0 ms |

The scripted UI run was 23% shorter. Its duration includes click automation and a fixed 100 ms observation delay after completion. Blocking time sums the portion of each observed task above 50 ms. One of the three final Citlali runs still recorded a 51 ms task. Odette completed all three final runs without page errors, with a median duration of 1,766.1 ms and a median of zero long tasks. An Odette baseline was not captured.

| Isolated browser engine workload | Baseline median | Native yield median | Final timer fallback median |
| --- | ---: | ---: | ---: |
| One character | 140.6 ms | 74.3 ms | 88.6 ms |
| One weapon | 133.3 ms | 70.5 ms | 86.0 ms |
| Mixed targets | 1,663.4 ms | 1,649.4 ms | 1,648.5 ms |
| Mixed targets, 4x CPU throttling | 6,437.0 ms | 6,308.2 ms | 6,350.1 ms |

The native engine column was captured before the final fallback-only revision. Both calculator UI checks used the final implementation. The mixed engine scenario went from 19 observed long tasks per run to zero in both scheduling paths. Under 4x CPU throttling, the median longest timer gap fell from 634.8 ms to 26.3 ms in the fallback path.

The first 8 ms experiment scheduled timers after computation. It removed long tasks but increased mixed runtime to 2,497.2 ms. That version was rejected. Scheduling the fallback timer before computation removed the penalty.

These are local measurements, not a deployment benchmark. CPU throttling is not a real mobile device. Native scheduler continuations can defer ordinary timers, so timer gaps are only compared for the fallback path. Maximum animation-frame gaps did not show a consistent improvement in the full UI probe. No frame-rate improvement is claimed.

## PR validation on the current base

The PR was rebuilt against `f1568a5` and compared with an unmodified production export of that commit. Chrome used the same seeded random generator, inputs, viewport, and theme for each comparison. This seeded capture is a separate experiment from the native-random measurements above.

Three desktop Citlali runs had median durations of 1,533.0 ms before and 1,158.5 ms after, a 24% reduction. Median observed long-task blocking fell from 19 ms to 0 ms. The UI duration includes click automation and a fixed 100 ms observation delay. Desktop and mobile runs completed without page errors in both themes. Screenshots and recordings are attached to the PR. Local capture code and measurements are in `/tmp/genshinpull-pr-evidence/`.

Both production builds passed. The final regression check and focused ESLint check passed. Full lint reported the same existing 21 errors and 16 warnings on the base and PR.

## Remaining findings

| Priority | Finding | Evidence and next action |
| --- | --- | --- |
| Medium | Saved reports use current target names and counts. | The original audit reproduced stale percentages by editing `simCount`. The newer base removes that input, so that reproduction is no longer possible. Target names and per-item cost still use live inputs. Store each report with its run inputs. |
| Medium | Both themes preload every background. | A fresh 390x844 browser view requested all 12 background files, totaling 4,582,486 encoded bytes. Hidden Odette backgrounds account for 3,402,924 bytes. Load the selected image first and decode another image when requested. |
| Medium | Both interfaces load and render together. | `app/page.tsx` mounts both behind `hidden` wrappers. Both consume the changing simulator context and statically import Recharts. The fresh view fetched 1,034,199 encoded JavaScript bytes from the local uncompressed server. Chart deferral and reduced inactive-theme work need separate before/after measurements. |
| Medium | Target sizes have no upper bound. | The newer base fixes UI simulations at 100,000, but target inputs remain unrestricted. The engine retains every result, and each handler sorts pull counts and makes several aggregation passes. A huge individual trajectory can exceed the scheduling budget. Define supported target bounds before promising bounded latency. |
| Low | Report construction exists in three places. | Citlali and Odette each define the active button handler. The provider has another `startSim` that neither interface uses. A provider-only optimization would miss both actual calculators. Consolidation should preserve their validation behavior. |

The chart itself has at most 40 bins. Its bar count does not grow with the number of simulations. This audit did not change or validate the underlying game probability assumptions.

## Verification and evidence

Run the retained regression check with `node scripts/check-simulation.mjs`. It compares exact seeded results across both scheduling paths, empty and nonempty targets, pity and guarantee settings, counts around 100 and 5,000, and full 100,000-trial runs. Each 100,000-trial result array must match 100,000 direct calls to the single-trial engine. It also checks real event-loop yielding and cleanup after completion or a thrown trial.

`npm run build`, focused ESLint checks, and `git diff --check` passed. Full `npm run lint` still reports 21 errors and 16 warnings. Its output is byte-for-byte identical to the baseline.

Session evidence is stored outside git at `/tmp/genshinpull-performance/`:

- `browser.mjs` and `engine-browser.mjs` contain the browser probes. They use the existing local Playwright installation and Chrome executable.
- `baseline-ui.json`, `final-ui.json`, and `final-odette-ui.json` contain full calculator observations.
- `baseline-engine.json`, `budget8-engine.json`, `native-engine.json`, and `final-fallback-engine.json` contain the scheduling experiments.
- `baseline.cpuprofile`, `final.cpuprofile`, and `final-odette.cpuprofile` contain CPU profiles. Matching before/after PNGs show the rendered calculator.
- `loading-and-report.json` contains cold-load resource sizes and the stale-report reproduction.
- `decisions.tsv` records the experiment choices. The lint outputs preserve the pre-existing failures.

## Attention

An independent final review using the inherited model found no blocking issues in the code or measurement claims. This was not a review across different model families. The 8 ms value is a threshold checked after 100 complete trajectories, not a hard latency guarantee. The stale-report issue, eager loading, and existing lint failures remain open.
