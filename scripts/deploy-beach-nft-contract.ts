// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// @ts-ignore
import * as dotenv from "dotenv";

const fs = require("fs");

const hre = require("hardhat");

dotenv.config();

const metadataMetadata = JSON.parse(
  fs.readFileSync("./metadata/dist/metadataToUpload.json")
);
const DICT = fs.readFileSync("./metadata/dist/metadataDictionary.json");
const TRAITS = [
  "SAND",
  "WATER",
  "WAVES",
  "SPARKLING",
  "LOCATION",
  "FRAME",
  "FEATURE",
  "SIGN",
];

// @ts-ignore
async function main() {
  // We get the contract to deploy
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  let addressArt, addressDev, addressDAO;
  let lobsterAddress;
  let blocksBeforeMintOpens;

  console.log("Network: ", hre.network.name);

  if (hre.network.name === "rinkeby") {
    const LobsterMock = await hre.ethers.getContractFactory("LobsterMock");
    const lobsterMockOnChain = await LobsterMock.deploy();
    lobsterAddress = lobsterMockOnChain.address;
    console.log("LobsterMock deployed at: ", lobsterAddress);
    blocksBeforeMintOpens = 4800; // roughly 16 hours from now
    addressArt = process.env.ADDRESSES_ART_RINKEBY;
    addressDev = process.env.ADDRESSES_DEV_RINKEBY;
    // addressDesign = process.env.ADDRESSES_DESIGN_RINKEBY;
    addressDAO = process.env.ADDRESSES_DAO_RINKEBY;
  } else {
    throw Error("Only Rinkeby network is supported at this point");

    // TODO: Set this to final values whenever all variables are set
    // blocksBeforeMintOpens = 45818; // Roughly 1 week in the future.
    // lobsterAddress = process.env.ADDRESSES_LOBSTER_CONTRACT_MAINNET;
    // addressArt = process.env.ADDRESSES_ART_MAINNET;
    // addressDev = process.env.ADDRESSES_DEV_MAINNET;
    // addressDesign = process.env.ADDRESSES_DESIGN_MAINNET;
    // addressDAO = process.env.ADDRESSES_DAO_MAINNET;
  }

  const accounts = [addressArt, addressDev, addressDAO];
  const shares = [50, 25, 25];

  console.log("Deploying");
  console.log(lobsterAddress, blocksBeforeMintOpens, TRAITS);

  const Beach = await hre.ethers.getContractFactory("Beach");
  const beach = await Beach.deploy(
    lobsterAddress,
    blocksBeforeMintOpens,
    TRAITS
  );

  await beach.deployed();
  await beach.addPayeesBatch(accounts, shares);

  console.log("Beach deployed to:", beach.address);

  await beach.setDict(DICT);
  await beach.setMetadata([0, 5], metadataMetadata.slice(0, 5));

  // await beach.transferOwnership(addressDAO);

  // hre.ethers.provider.on("Transfer", (...args: any) =>
  //   console.log("Transfer event received", ...args)
  // );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
