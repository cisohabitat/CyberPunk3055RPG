import { main } from "./browser-ci-core.mjs";

main().catch(error => { console.error(error.message); process.exitCode = 1; });
