const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const prettyJSON = require("./json-format.js");

const sourceFile = process.argv[2];
const outputFile = process.argv[3];

console.log("Create Merkle Tree");
console.log("Source File", sourceFile);
console.log("Output File", outputFile);

const addresses = require(`./${sourceFile}`);
const fs = require("fs");

const leaves = addresses.map((ad) => keccak256(ad));
const merkleTree = new MerkleTree(leaves, keccak256, {
  sortPairs: true,
  duplicateOdd: false,
});

const output = addresses.map(function (address, index) {
  return {
    address,
    proofs: merkleTree.getHexProof(merkleTree.getLeaf(index)),
  };
});

fs.writeFileSync(outputFile, prettyJSON(output), { flag: "w" });

console.log("Tree (for display): \n", merkleTree.toString());
console.log("Root: \n", merkleTree.getHexRoot());
console.log("JSON: \n", prettyJSON(output));
