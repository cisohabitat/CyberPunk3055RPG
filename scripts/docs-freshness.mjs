import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const REQUIRED = ["README.md", "AGENTS.md"];

/** Compare committed content, including the entire push or PR change range.
 * @param {{base: string | null, head?: string, mergeBase?: boolean, repo?: string}} options
 */
export function checkDocumentation({ base, head = "HEAD", mergeBase = false, repo = process.cwd() }) {
  const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const commit = ref => git("rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`).trim();
  const target = commit(head);
  let start = base === null ? null : commit(base);
  if (mergeBase) {
    if (!start) throw new Error("A pull request requires a base commit.");
    start = git("merge-base", start, target).trim();
  }
  const changed = (start ? git("diff", "--name-only", "--no-renames", "-z", start, target, "--")
    : git("ls-tree", "-r", "--name-only", "-z", target)).split("\0").filter(Boolean);
  const blobs = revision => {
    const entries = new Map();
    if (revision) for (const row of git("ls-tree", "-z", revision, "--", ...REQUIRED).split("\0").filter(Boolean)) {
      const tab = row.indexOf("\t"), [, type, sha] = row.slice(0, tab).split(" ");
      if (type === "blob") entries.set(row.slice(tab + 1), sha);
    }
    return entries;
  };
  const before = blobs(start), after = blobs(target);
  const missing = changed.length ? REQUIRED.filter(path => !after.has(path) || before.get(path) === after.get(path)) : [];
  return { ok: missing.length === 0, missing, changedFiles: changed.length, base: start, head: target };
}

export function eventRevisions(name, event) {
  const sha = value => {
    if (typeof value !== "string" || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(value)) throw new Error("Missing or invalid event commit SHA.");
    return value;
  };
  if (name === "push") {
    const before = sha(event.before), head = sha(event.after);
    if (/^0+$/.test(head)) throw new Error("A deleted branch has no revision to verify.");
    return { base: /^0+$/.test(before) ? null : before, head };
  }
  if (name === "pull_request") return { base: sha(event.pull_request?.base?.sha), head: sha(event.pull_request?.head?.sha), mergeBase: true };
  throw new Error("Provide BASE and HEAD commits, or a supported GitHub push/pull_request event.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 2) throw new Error("Usage: node scripts/docs-freshness.mjs BASE [HEAD]");
    if (!args.length && (!process.env.GITHUB_EVENT_NAME || !process.env.GITHUB_EVENT_PATH)) throw new Error("Usage: node scripts/docs-freshness.mjs BASE [HEAD], or supply the GitHub event metadata.");
    const revisions = args.length ? { base: args[0], head: args[1] ?? "HEAD" }
      : eventRevisions(process.env.GITHUB_EVENT_NAME, JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH ?? "", "utf8")));
    const result = checkDocumentation(revisions);
    if (!result.ok) {
      console.error(`Documentation update required: ${result.missing.join(", ")}. Every repository change must update both README.md and AGENTS.md with current information. Permission changes and deleted files do not count.`);
      process.exitCode = 1;
    } else console.log(`Documentation update check passed: ${result.changedFiles} changed files; ${result.changedFiles ? "both documents have updated content" : "no repository content changed"}.`);
  } catch (error) {
    console.error(`Documentation update check failed: ${error instanceof Error ? error.message : String(error)}. Fetch the comparison history; unavailable history never bypasses this check.`);
    process.exitCode = 1;
  }
}
