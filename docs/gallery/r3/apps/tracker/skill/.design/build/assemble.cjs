// Inline the emitted token CSS into the page source and write the deliverable index.html.
// split/join, not String.replace: replacement strings would eat "$$" and "$&".
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "../..");
const src = fs.readFileSync(path.join(root, ".design/build/index.src.html"), "utf8");
const tokens = fs.readFileSync(path.join(root, ".design/tokens.css"), "utf8");
fs.writeFileSync(path.join(root, "index.html"), src.split("/*TOKENS*/").join(tokens));
console.log("assembled index.html");
