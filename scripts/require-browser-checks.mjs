import { requiredMatrixPassed } from "./ci-gate.mjs";

if (!requiredMatrixPassed(process.env.TEST_RESULT, process.env.BROWSER_RESULT)) {
  console.error("Source tests and every required browser project must succeed.");
  process.exitCode = 1;
} else console.log("Source tests and every required browser project passed.");
