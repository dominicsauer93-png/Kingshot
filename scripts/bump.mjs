// Bump the app version everywhere it appears, so every device loads the new files at once.
// Usage: node scripts/bump.mjs
import { readFileSync, writeFileSync } from "node:fs";
const sw = readFileSync("sw.js", "utf8"), v = +sw.match(/kingshot-v(\d+)/)[1] + 1;
writeFileSync("sw.js", sw.replace(/kingshot-v\d+/, `kingshot-v${v}`));
writeFileSync("index.html", readFileSync("index.html", "utf8").replace(/\?v=\d+"/g, `?v=${v}"`));
console.log(`version ${v}`);
