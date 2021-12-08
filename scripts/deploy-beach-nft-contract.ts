// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// @ts-ignore
import * as dotenv from "dotenv";

const hre = require("hardhat");

dotenv.config();

// @ts-ignore
async function main() {
  // We get the contract to deploy
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  let addressArt, addressDev, addressDAO;
  let accounts;
  let shares;
  let lobsterAddress;
  let blocksBeforeMintOpens;

  console.log("Network: ", hre.network.name);

  if (hre.network.name === "rinkeby") {
    const LobsterMock = await hre.ethers.getContractFactory("LobsterMock");
    const lobsterMockOnChain = await LobsterMock.deploy();
    lobsterAddress = lobsterMockOnChain.address;
    console.log("LobsterMock deployed at: ", lobsterAddress);
    blocksBeforeMintOpens = 1;
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

  accounts = [addressArt, addressDev, addressDAO];
  shares = [50, 25, 25];

  console.log("Deploying");
  console.log(lobsterAddress, accounts, shares, blocksBeforeMintOpens);

  const Beach = await hre.ethers.getContractFactory("Beach");
  const beach = await Beach.deploy(
    lobsterAddress,
    accounts,
    shares,
    blocksBeforeMintOpens
  );

  await beach.deployed();
  console.log("Beach deployed to:", beach.address);

  // TODO: Transfer Ownership to DAO address

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
