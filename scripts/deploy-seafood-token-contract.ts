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

  console.log("Network: ", hre.network.name);

  const SeafoodToken = await hre.ethers.getContractFactory("SeafoodToken");
  const seafoodToken = await SeafoodToken.deploy();

  await seafoodToken.deployed();
  console.log("Seafood deployed to:", seafoodToken.address);

  let DAOAddress;

  switch (hre.network.name) {
    case "mainnet":
      DAOAddress = process.env.ADDRESSES_DAO_MAINNET;
      break;
    case "rinkeby":
    default:
      DAOAddress = process.env.ADDRESSES_DAO_RINKEBY;
      break;
  }

  // TODO: add BEACH to the allowlist

  await seafoodToken.transferOwnership(DAOAddress);
}

main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
