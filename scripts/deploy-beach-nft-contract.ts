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

const b34chLibraryABI =
  require("./../artifacts/contracts/BeachLibrary.sol/BeachLibrary.json").abi;
const b34chABI = require("./../artifacts/contracts/Beach.sol/Beach.json").abi;

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

  let beachLibraryAddress, beachAddress;

  if (hre.network.name === "rinkeby") {
    // const LobsterMock = await hre.ethers.getContractFactory("LobsterMock");
    // const lobsterMockOnChain = await LobsterMock.deploy();
    lobsterAddress = "0x9AAd034C9B71B969b67DacB81Fc1aCfe49f1db79"; // lobsterMockOnChain.address;
    console.log("LobsterMock deployed at: ", lobsterAddress);
    blocksBeforeMintOpens = 4800; // roughly 16 hours from now
    addressArt = process.env.ADDRESSES_ART_RINKEBY;
    addressDev = process.env.ADDRESSES_DEV_RINKEBY;
    // addressDesign = process.env.ADDRESSES_DESIGN_RINKEBY;
    addressDAO = process.env.ADDRESSES_DAO_RINKEBY;
    if (process.env.ADDRESSES_BEACHLIBRARY) {
      beachLibraryAddress = process.env.ADDRESSES_BEACHLIBRARY;
    }
    if (process.env.ADDRESSES_BEACH) {
      beachAddress = process.env.ADDRESSES_BEACH;
    }
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

  let beach, beachLibrary;

  console.log("beachLibraryAddress", beachLibraryAddress);
  console.log("beachAddress", beachAddress);

  if (beachLibraryAddress) {
    beachLibrary = await hre.ethers.getContractAt(
      b34chLibraryABI,
      beachLibraryAddress,
      deployer
    );
  } else {
    const BeachLibraryContract = await hre.ethers.getContractFactory(
      "BeachLibrary"
    );
    beachLibrary = await BeachLibraryContract.deploy();
    await beachLibrary.deployed();
  }

  console.log("BeachLibrary contract deployed at", beachLibrary.address);

  if (beachAddress) {
    beach = await hre.ethers.getContractAt(b34chABI, beachAddress, deployer);
  } else {
    const Beach = await hre.ethers.getContractFactory("Beach", {
      libraries: {
        BeachLibrary: beachLibrary.address,
      },
    });
    beach = await Beach.deploy(lobsterAddress, blocksBeforeMintOpens, TRAITS);
    await beach.deployed();
  }

  console.log("BeachLibrary contract deployed at", beachLibrary.address);
  console.log("Writing verification file");

  const verificationFileName = `./scripts/verifications/verification_rinkeby_beach_${beach.address}.js`;
  const verificationFileData = `module.exports = ${JSON.stringify([
    lobsterAddress,
    blocksBeforeMintOpens,
    TRAITS,
  ])};`;

  fs.writeFileSync(verificationFileName, verificationFileData, { flag: "w" });

  console.log("Writing library addresses file");

  const libraryAddressesFileName = `./scripts/verifications/verification_rinkeby_beach_addresses_${beach.address}.js`;
  const libraryAddressesFileData = `module.exports = ${JSON.stringify({
    BeachLibrary: beachLibraryAddress,
  })};`;

  fs.writeFileSync(libraryAddressesFileName, libraryAddressesFileData, {
    flag: "w",
  });

  console.log("Beach deployed to:", beach.address);

  // await beach.setDict(DICT);
  //
  // await beach.setMetadata([0, 5], metadataMetadata.slice(0, 5));

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
