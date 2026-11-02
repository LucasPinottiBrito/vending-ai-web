import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", ".next", ".git"].includes(entry.name)) return [];
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}
const relative = (file) => path.relative(root, file).replaceAll("\\", "/");
const apiRoutes = [];
for (const file of walk(path.join(root, "backend/src/routes"))) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/this\.router\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']\s*,([\s\S]*?)\);/g)) {
    const [, method, route, handlers] = match;
    apiRoutes.push({ method: method.toUpperCase(), path: `/api${route}`,
      compatibilityAlias: route, source: relative(file),
      access: handlers.includes('requireRole("ADMIN")') ? "ADMIN" : handlers.includes("authMiddleware") ? "AUTHENTICATED" : "PUBLIC",
    });
  }
}
const frontendRoutes = walk(path.join(root, "frontend/app"))
  .filter((file) => path.basename(file) === "page.tsx")
  .map((file) => ({ path: '/' + path.relative(path.join(root, 'frontend/app'), path.dirname(file)).replaceAll('\\', '/'),
    source: relative(file), imports: Array.from(fs.readFileSync(file, 'utf8').matchAll(/from ["']([^"']+)["']/g), (m) => m[1]) }));
const apiConsumers = [];
for (const file of walk(path.join(root, "frontend"))) {
  if (!/\.tsx?$/.test(file) || file.includes(`${path.sep}tests${path.sep}`)) continue;
  const endpoints = [...new Set(Array.from(fs.readFileSync(file, 'utf8').matchAll(/["'`]([^"'`]*\/api\/[^"'`]+)["'`]/g), (m) => m[1]))];
  if (endpoints.length) apiConsumers.push({ source: relative(file), endpoints });
}
const inventory = {
  scope: "Stage 1: current routes before module and storage migration. Extracted from source; not a runtime availability claim.",
  apiMounts: ["/api", "/"], apiRoutes, frontendRoutes, apiConsumers,
  backendTests: walk(path.join(root, "backend/tests")).filter((f) => f.endsWith('.test.js')).map(relative),
};
const output = path.join(root, "docs/etapa1/inventario.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(inventory, null, 2) + "\n");
console.log(`${apiRoutes.length} API routes; ${frontendRoutes.length} frontend routes; ${apiConsumers.length} frontend consumers.`);
