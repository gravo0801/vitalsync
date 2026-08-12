import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/server") {
      return nextResolve("next/server.js", context);
    }
    if (!specifier.startsWith("@/")) return nextResolve(specifier, context);

    const relativePath = specifier.slice(2);
    const candidates = [relativePath, `${relativePath}.ts`, `${relativePath}.tsx`];
    const match = candidates.find((candidate) => existsSync(candidate));
    if (!match) return nextResolve(specifier, context);

    return { shortCircuit: true, url: pathToFileURL(match).href };
  },
});
