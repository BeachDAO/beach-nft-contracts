const createHash = require("crypto").createHash;
const fs = require("fs");

// This script uses a lot of memory, and is designed to run on small images
// (images matching the pattern).
// If you want to validate the provenance hash, download the 2 IPFS folders,
// flatten them into 1, then run
// $ node --max-old-space-size=16384 createProvenanceHash.js /path/to/ipfs/files
// You should get
// Final hash:  e36178f2da4018955176de7fc70fa1fdc0dc0679f36d42f60d5a6cafe9691ba1
// Keep in mind that it is going to fail if you set the heap memory to less than
// 16Gb.

const startTime = Date.now();

// Using first arg as convention
const path = process.argv[2];

console.log("Path: ", path);

const filesRegex = /^\d+\.png$/;

const files = fs
  .readdirSync(path)
  .filter((filename) => filesRegex.test(filename));

console.log("Files: ", files);

const folderHashes = fs
  .readdirSync(path)
  .filter((filename) => filesRegex.test(filename))
  .map((filename) => fs.readFileSync(`${path}/${filename}`).toString())
  .map((fileContent) =>
    createHash("sha256").update(fileContent, "utf8").digest("hex").toString()
  )
  .join("");

console.log("Joined Files Hash: ", folderHashes);

const folderHash = createHash("sha256")
  .update(folderHashes, "utf8")
  .digest("hex")
  .toString();

console.log("Final hash: ", folderHash);

console.log("Took: ", (Date.now() - startTime) / 1000, "s");
