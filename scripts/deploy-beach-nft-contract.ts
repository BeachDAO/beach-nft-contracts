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
const DICT = fs
  .readFileSync("./metadata/dist/metadataDictionary.json")
  .toJSON();
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

  let addressArt, addressDev, addressDesign, addressDAO;
  let lobsterAddress;
  let blocksBeforeMintOpens;

  console.log("Network: ", hre.network.name);

  let beachLibraryAddress, beachAddress;

  if (hre.network.name === "rinkeby") {
    // const LobsterMock = await hre.ethers.getContractFactory("LobsterMock");
    // const lobsterMockOnChain = await LobsterMock.deploy();
    lobsterAddress = "0x9AAd034C9B71B969b67DacB81Fc1aCfe49f1db79"; // lobsterMockOnChain.address;
    console.log("LobsterMock deployed at: ", lobsterAddress);
    // blocksBeforeMintOpens = 4800; // roughly 16 hours from now
    blocksBeforeMintOpens = 5; // roughly 5 minutes from deployment
    addressArt = process.env.ADDRESSES_ART_RINKEBY;
    addressDev = process.env.ADDRESSES_DEV_RINKEBY;
    addressDesign = process.env.ADDRESSES_DESIGN_RINKEBY;
    addressDAO = process.env.ADDRESSES_DAO_RINKEBY;
    if (process.env.ADDRESSES_BEACHLIBRARY) {
      beachLibraryAddress = process.env.ADDRESSES_BEACHLIBRARY;
    }
    if (process.env.ADDRESSES_BEACH) {
      beachAddress = process.env.ADDRESSES_BEACH;
    }
  } else if (hre.network.name === "mainnet") {
    // throw Error("Only Rinkeby network is supported at this point");

    // TODO: Set this to final values whenever all variables are set
    // Contract is polymorphic on block handling depending on block height
    // blocksBeforeMintOpens = 14622045;
    blocksBeforeMintOpens = 14628520;
    lobsterAddress = process.env.ADDRESSES_LOBSTER_CONTRACT_MAINNET;
    addressArt = process.env.ADDRESSES_ART_MAINNET;
    addressDev = process.env.ADDRESSES_DEV_MAINNET;
    addressDesign = process.env.ADDRESSES_DESIGN_MAINNET;
    addressDAO = process.env.ADDRESSES_DAO_MAINNET;
  }

  const accounts = [addressDesign, addressArt, addressDev, addressDAO];
  const shares = [15, 25, 15, 45];

  console.log("Deploying");
  console.log("Accounts", accounts);

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
    beachLibraryAddress = beachLibrary.address;
  }

  console.log("BeachLibrary contract deployed at", beachLibraryAddress);

  if (beachAddress) {
    beach = await hre.ethers.getContractAt(b34chABI, beachAddress, deployer);
  } else {
    const Beach = await hre.ethers.getContractFactory("Beach", {
      libraries: {
        BeachLibrary: beachLibraryAddress,
      },
    });
    beach = await Beach.deploy(lobsterAddress, blocksBeforeMintOpens, TRAITS);
    await beach.deployed();
    beachAddress = beach.address;
  }

  console.log("Beach contract deployed at", beachAddress);
  console.log("Writing verification file");

  const verificationFileName = `./scripts/verifications/verification_${hre.network.name}_beach_${beachAddress}.js`;
  const verificationFileData = `module.exports = ${JSON.stringify([
    lobsterAddress,
    blocksBeforeMintOpens,
    TRAITS,
  ])};`;

  fs.writeFileSync(verificationFileName, verificationFileData, { flag: "w" });

  console.log("Writing library addresses file");

  const libraryAddressesFileName = `./scripts/verifications/verification_${hre.network.name}_beach_addresses_${beachAddress}.js`;
  const libraryAddressesFileData = `module.exports = ${JSON.stringify({
    BeachLibrary: beachLibraryAddress,
  })};`;

  fs.writeFileSync(libraryAddressesFileName, libraryAddressesFileData, {
    flag: "w",
  });

  console.log("Beach deployed to:", beachAddress);

  console.log("Add Payees batch");
  await beach.addPayeesBatch(accounts, shares);

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
