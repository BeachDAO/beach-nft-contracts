const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const prettyJSON = require("./json-format.js");

const addresses = [
  "0xEd860e2a761D8B0c83b1c0A1C4b7D5fc1af97d5c",
  "0x4922fa21986EeC7Ee1742fa26d2C9C7e8DA22418",
  "0x520cD8b7337F552C0A4EaB7699A8Afe05bdDbab0",
];
const leaves = addresses.map((ad) => keccak256(ad));
const merkleTree = new MerkleTree(leaves, keccak256, {
  sortPairs: true,
  duplicateOdd: false,
});

console.log(merkleTree.toString());
console.log(prettyJSON(merkleTree.getHexLayers()));
console.log(prettyJSON(merkleTree.getHexProof(leaves[0])));
