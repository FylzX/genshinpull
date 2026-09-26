import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../lib/simulator.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const { runOneSimLogic, runSimulation } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

function seededRandom() {
  let seed = 123456789;
  return () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
}

const cases = [
  { charA: 0, charB: 0, weapA: 0, weapB: 0 },
  { charA: 1, charB: 0, weapA: 0, weapB: 0 },
  { charA: 0, charB: 0, weapA: 0, weapB: 1 },
  { charA: 1, charB: 1, weapA: 1, weapB: 1, charPity: 89, weapPity: 79, isCharGuaranteed: true },
];
const random = Math.random;
const schedulerDescriptor = Object.getOwnPropertyDescriptor(globalThis, "scheduler");
const timeout = globalThis.setTimeout;
let timerCallbacks = 0;
globalThis.setTimeout = (callback, delay, ...args) => timeout(() => {
  timerCallbacks++;
  callback(...args);
}, delay);
try {
  for (const useScheduler of [false, true]) {
    let schedulerYields = 0;
    Object.defineProperty(globalThis, "scheduler", {
      configurable: true,
      value: useScheduler ? {
        yield() {
          assert.equal(this, globalThis.scheduler);
          schedulerYields++;
          return new Promise(resolve => setTimeout(resolve, 0));
        },
      } : undefined,
    });
    for (const targets of cases) {
      for (const count of [0, 1, 99, 100, 4999, 5000, 5001, 100000]) {
        Math.random = seededRandom();
        const expected = Array.from({ length: count }, () => runOneSimLogic(targets));
        Math.random = seededRandom();
        const actual = await runSimulation(targets, count);
        assert.deepEqual(actual, expected, `unchanged results for ${JSON.stringify(targets)}, count ${count}`);
      }
    }
    Math.random = random;

    let timerTicks = 0;
    const timer = setInterval(() => timerTicks++, 0);
    try {
      const results = await runSimulation({ charA: 7, charB: 7, weapA: 5, weapB: 5 }, 5000);
      assert.equal(results.length, 5000);
      assert.ok(timerTicks > 0, "expensive batches yield before 5,000 trajectories finish");
      assert.equal(schedulerYields > 0, useScheduler, "uses scheduler.yield when available");
    } finally {
      clearInterval(timer);
    }
    const callbacksAtCompletion = timerCallbacks;
    await new Promise(resolve => timeout(resolve, 20));
    assert.equal(timerCallbacks, callbacksAtCompletion, "no scheduled work remains after completion");

    const failure = new Error("trial failure");
    Math.random = () => { throw failure; };
    await assert.rejects(runSimulation(cases[1], 5000), error => error === failure);
    Math.random = random;
    const callbacksAtFailure = timerCallbacks;
    await new Promise(resolve => timeout(resolve, 20));
    assert.equal(timerCallbacks, callbacksAtFailure, "no scheduled work remains after failure");
  }
} finally {
  Math.random = random;
  globalThis.setTimeout = timeout;
  if (schedulerDescriptor) Object.defineProperty(globalThis, "scheduler", schedulerDescriptor);
  else delete globalThis.scheduler;
}

console.log("Simulation checks passed. Full 100,000-trial results match in both scheduling paths, and expensive batches yield.");
