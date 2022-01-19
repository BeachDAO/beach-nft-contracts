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
  console.log("Beach deployed to:", seafoodToken.address);

  let DAOAddress;

  switch (hre.network.name) {
    case "mainnet":
      // TODO: Set the right address
      DAOAddress = "0xA3546AE4B278C423033c85B6EE0A82BE2455fcc6";
      break;
    case "rinkeby":
    default:
      DAOAddress = "0xA3546AE4B278C423033c85B6EE0A82BE2455fcc6";
      break;
  }

  // TODO: Transfer Ownership to DAO address
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
