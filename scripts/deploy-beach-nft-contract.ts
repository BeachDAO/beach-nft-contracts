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
const DICT = [
  "PALE-GOLDEN SAND",
  "GREENISH WATER",
  "GENTLE WAVES",
  "RIPPLE",
  "BONDI BEACH, NEW SOUTH WALES",
  "CREAMY WHITE",
  "NO",
  "FOAM",
  "BRIGHT PINK SAND",
  "LIGHT GREEN WATER",
  "PINK SANDS BEACH, HARBOUR ISLAND",
  "PITCH BLACK SAND",
  "DARK BLUE WATER",
  "HURRICANE",
  "REYNISFJARA BEACH, ICELAND",
  "BLACK",
  "CREAMY WHITE SAND",
  "CRYSTAL-CLEAR GREEN WATER",
  "MANLY BEACH, NEW SOUTH WALES",
  "DARK GREEN",
  "UMBER SAND",
  "DARK GREEN WATER",
  "PLAYA ROJA BEACH, PARACAS",
  "POWDERY WHITE SAND",
  "AZURE WATER ",
  "WHITEHAVEN BEACH, WHITSUNDAY ISLAND",
  "DARK BLUE",
  "BEACH GRASS ",
  "OLIVE-COLORED SAND",
  "SAPPHIRE BLUE WATER",
  "MAHANA BEACH , HAWAII",
  "LIGHT BLUE",
  "RED ORANGE SAND ",
  "EMERALD GREEN WATER",
  "GIBSONS STEPS BEACH, VICTORIA",
  "BURNT ORANGE SAND",
  "LUMINOUS AQUA WATER",
  "RAINBOW BEACH, MELVILLE ISLAND",
  "DARK TURQUOISE",
  "DESERT SAND",
  "GIN-CLEAR WATER",
  "SHARK BAY, WESTERN AUSTRALIA",
  "RED-BROWN",
  "ROCKY SHORE",
  "RED DESERT SAND",
  "TEAL WATER",
  "ROEBUCK BAY, BROOME, WESTERN AUSTRALIA",
  "DARK BROWN",
  "LAWN",
  "VOLCANIC DARK SAND",
  "KILAUEA, HAWAII",
  "LAVA FLOWS",
  "DARK GREY SAND",
  "BRILLIANT BLUE WATER",
  "VAADHOO ISLAND, MALDIVES ",
  "MARINE BIOLUMINESCENCE ",
  "LIGHT PURPLE SAND",
  "BLUE - VIOLET WATER",
  "PFEIFFER BEACH , CALIFORNIA",
  "DARK PURPLE",
  "PURPLE STRIPES",
  "GREENISH",
  "METAVERSE",
  "OIL GREEN",
  "CRYSTAL PURPLE",
  "RED ORANGE",
  "PEACOCK BLUE",
  "GOLDEN",
  "NAVY",
  "BLUE",
  "CRIMSON",
  "DARK MAGENTA SAND",
  "PARMESAN YELLOW WATER",
  "SANDCASTLE YELLOW",
  "LIGHT BLUE SAND",
  "NEON BLUE WATER",
  "SEA OF SIMULATION",
  "LEMON SAND",
  "RADIATION WATER",
  "OKUMA, FUKUSHIMA PREFECTURE",
  "RED",
  "TOXIC GREEN SAND",
  "TOXIC ALGAE INFESTED WATER",
  "SAINT BRIEUC BAY, BRITTANY",
  "CORN YELLOW",
  "NEON PINK SAND",
  "CYBER PUNK TEAL WATER",
  "NEON TEAL",
  "SCARLET RED SAND",
  "MIDNIGHT BLUE WATER",
  "DARK RED",
  "HYPER ORANGE SAND",
  "NEON TURQUOISE WATER",
  "DARK CHARCOAL",
  "PRUSSIAN GREEN SAND",
  "BRASS WATER",
  "MARS SAND",
  "DARK ELECTRIC BLUE WATER",
  "MARS",
  "NEON TURQUOISE SAND",
  "ELECTRIC RED WATER",
  "YES",
];

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

  accounts = [addressArt, addressDev, addressDAO];
  shares = [50, 25, 25];

  console.log("Deploying");
  console.log(lobsterAddress, accounts, shares, blocksBeforeMintOpens);

  const Beach = await hre.ethers.getContractFactory("Beach");
  const beach = await Beach.deploy(
    lobsterAddress,
    "0xF7FE3618A16A8f98198584B046FDbc3D0C2786c5",
    accounts,
    shares,
    blocksBeforeMintOpens
  );

  await beach.deployed();
  console.log("Beach deployed to:", beach.address);

  // TODO: Transfer Ownership to DAO address

  await beach.setDict(DICT);
  await beach.setMetadata([0, 5], metadataMetadata.slice(0, 5));

  await beach.transferOwnership(addressDAO);

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
