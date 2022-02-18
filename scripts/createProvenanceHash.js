const createHash = require("crypto").createHash;
const fs = require("fs");

const startTime = Date.now();

// Using first arg as convention
const path = process.argv[2];

const files = fs
  .readdirSync(path)
  .filter((filename) => /^\d+\.png$/.test(filename));

console.log("Files: ", files);

const folderHashes = fs
  .readdirSync(path)
  .filter((filename) => /^\d+\.png$/.test(filename))
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
