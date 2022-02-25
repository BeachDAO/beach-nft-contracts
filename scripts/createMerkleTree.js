const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const prettyJSON = require("./json-format.js");

const addresses = [
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
];

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

console.log("Tree (for display): \n", merkleTree.toString());
console.log("Root: \n", merkleTree.getHexRoot());
console.log("JSON: \n", prettyJSON(output));
