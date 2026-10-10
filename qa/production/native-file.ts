import type { CDPSession } from "@playwright/test";

/** Chromium endurance only. Playwright 1.64 setInputFiles retains its retargeted
 * input handle. Own and release this handle while exercising real file input. */
export async function setNativeFile(cdp: CDPSession, path: string) {
  const objectGroup = "saint-shard-qa-file";
  try {
    const { result, exceptionDetails } = await cdp.send("Runtime.evaluate", {
      expression: 'document.querySelectorAll("input[type=file]").length === 1 ? document.querySelector("input[type=file]") : null',
      objectGroup,
    });
    if (exceptionDetails || !result.objectId || result.subtype !== "node") throw new Error("Expected one native save import input");
    await cdp.send("DOM.setFileInputFiles", { objectId: result.objectId, files: [path] });
  } finally {
    await cdp.send("Runtime.releaseObjectGroup", { objectGroup });
  }
}
