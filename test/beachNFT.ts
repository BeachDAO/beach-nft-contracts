// eslint-disable-next-line node/no-extraneous-import
import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { Beach, Beach__factory } from "../typechain";

const fs = require("fs");

const hre = require("hardhat");

let BeachNFT: Beach__factory;
let LobsterMockContract;
let BeachLibraryContract;
let beachLibrary;
let lobsterMock: Contract;
let beachNFT: Beach | Contract,
  beachNFT137: Beach | Contract,
  beachNFT317: Beach | Contract,
  beachNFT713: Beach | Contract,
  beachNFTMint: Beach | Contract;

let multiSigOwner: Signer,
  address1: Signer,
  address2: Signer,
  address3: Signer,
  addressArt: Signer,
  addressDev: Signer,
  addressDAO: Signer,
  addressSupply: Signer;

const royaltiesSharesSplit = [50, 25, 25]; // Art, Dev, DAO
const totalShares = royaltiesSharesSplit.reduce(
  (previousValue, currentValue) => previousValue + currentValue,
  0
);
let royaltiesAccounts: string[]; // Will be set later
let royaltiesAccountsSigners: Signer[];

const priceOverride0037 = {
  value: ethers.utils.parseEther("0.037"),
};
const priceOverride0073 = {
  value: ethers.utils.parseEther("0.073"),
};
const priceOverride0037x3 = {
  value: ethers.utils.parseEther("0.111"),
};
const priceOverride0073x3 = {
  value: ethers.utils.parseEther("0.219"),
};
const priceOverride0037x5 = {
  value: ethers.utils.parseEther("0.185"),
};
const priceOverride1 = {
  value: ethers.utils.parseEther("1"),
};

const blocksUntilMintOpens = 3000;

const metadataMetadata = JSON.parse(
  fs.readFileSync("./metadata/dist/metadataToUpload.json")
);

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

const DICT = JSON.parse(
  fs.readFileSync("./metadata/dist/metadataDictionary.json")
);

// eslint-disable-next-line no-unused-vars
async function mintMany(n: number, address: string, chain = beachNFT) {
  for (let i = 0; i < n; i++) {
    await chain.safeMint(address);
  }
}

async function advanceBlocks(blocks = 1) {
  for (let i = 1; i <= blocks; i++) {
    await hre.network.provider.send("evm_mine");
  }
}

const unrevealedPath: string = "nope";
const revealPath: string[] = [
  "QmbE4SA82GkKHEtqxxnYjtMweN1a3x5e5UwbzAWUkNN3vk",
  "QmbE4SA82GkKHEtqxxnYjtMweN1a3x5e5UwbzAWUkNN3vk",
];
const basePathBase64JSON: string =
  "data:application/json;base64,eyJuYW1lIjogIkJlYWNoICMwIiwiZGVzY3JpcHRpb24iOiAiQkVBQ0giLCAidG9rZW5faWQiOiAwLCAiYXJ0X251bWJlciI6IDEsICJpbWFnZSI6ICJodHRwczovL2lwZnMuaW8vaXBmcy9RbVpjNUhrS3FVZjFVaUw5eHFwYW52YkVUQjgzVGVyMjFBcU1SVW8xbWJ2OVBOIiwiaW1hZ2UiOiAiaHR0cHM6Ly9pcGZzLmlvL2lwZnMvUW1aYzVIa0txVWYxVWlMOXhxcGFudmJFVEI4M1RlcjIxQXFNUlVvMW1idjlQTiIsImF0dHJpYnV0ZXMiOltdfQ==";
const revealedPathBase64JSONNoNameChange: string =
  "data:application/json;base64,eyJuYW1lIjogIkJlYWNoICMwIiwiZGVzY3JpcHRpb24iOiAiQkVBQ0giLCAidG9rZW5faWQiOiAwLCAiYXJ0X251bWJlciI6IDEsICJpbWFnZSI6ICJodHRwczovL2lwZnMuaW8vaXBmcy9RbWJFNFNBODJHa0tIRXRxeHhuWWp0TXdlTjFhM3g1ZTVVd2J6QVdVa05OM3ZrLzAucG5nIiwiaW1hZ2UiOiAiaHR0cHM6Ly9pcGZzLmlvL2lwZnMvUW1iRTRTQTgyR2tLSEV0cXh4bllqdE13ZU4xYTN4NWU1VXdiekFXVWtOTjN2ay8wX2xhcmdlLnBuZyIsImF0dHJpYnV0ZXMiOlt7InRyYWl0X3R5cGUiOiJTQU5EIiwidmFsdWUiOiJQQUxFLUdPTERFTiBTQU5EIn0seyJ0cmFpdF90eXBlIjoiV0FURVIiLCJ2YWx1ZSI6IkdSRUVOSVNIIFdBVEVSIn0seyJ0cmFpdF90eXBlIjoiV0FWRVMiLCJ2YWx1ZSI6IkdFTlRMRSBXQVZFUyJ9LHsidHJhaXRfdHlwZSI6IlNQQVJLTElORyIsInZhbHVlIjoiUklQUExFIn0seyJ0cmFpdF90eXBlIjoiTE9DQVRJT04iLCJ2YWx1ZSI6IkJPTkRJIEJFQUNILCBORVcgU09VVEggV0FMRVMifSx7InRyYWl0X3R5cGUiOiJGUkFNRSIsInZhbHVlIjoiQ1JFQU1ZIFdISVRFIn0seyJ0cmFpdF90eXBlIjoiRkVBVFVSRSIsInZhbHVlIjoiTk8ifSx7InRyYWl0X3R5cGUiOiJTSUdOIiwidmFsdWUiOiJOTyJ9XX0=";
const revealedPathBase64JSONWithNameChange: string =
  "data:application/json;base64,eyJuYW1lIjogIkJlYWNoIEJPT00iLCJkZXNjcmlwdGlvbiI6ICJCRUFDSCIsICJ0b2tlbl9pZCI6IDAsICJhcnRfbnVtYmVyIjogMSwgImltYWdlIjogImh0dHBzOi8vaXBmcy5pby9pcGZzL1FtYkU0U0E4MkdrS0hFdHF4eG5ZanRNd2VOMWEzeDVlNVV3YnpBV1VrTk4zdmsvMC5wbmciLCJpbWFnZSI6ICJodHRwczovL2lwZnMuaW8vaXBmcy9RbWJFNFNBODJHa0tIRXRxeHhuWWp0TXdlTjFhM3g1ZTVVd2J6QVdVa05OM3ZrLzBfbGFyZ2UucG5nIiwiYXR0cmlidXRlcyI6W3sidHJhaXRfdHlwZSI6IlNBTkQiLCJ2YWx1ZSI6IlBBTEUtR09MREVOIFNBTkQifSx7InRyYWl0X3R5cGUiOiJXQVRFUiIsInZhbHVlIjoiR1JFRU5JU0ggV0FURVIifSx7InRyYWl0X3R5cGUiOiJXQVZFUyIsInZhbHVlIjoiR0VOVExFIFdBVkVTIn0seyJ0cmFpdF90eXBlIjoiU1BBUktMSU5HIiwidmFsdWUiOiJSSVBQTEUifSx7InRyYWl0X3R5cGUiOiJMT0NBVElPTiIsInZhbHVlIjoiQk9OREkgQkVBQ0gsIE5FVyBTT1VUSCBXQUxFUyJ9LHsidHJhaXRfdHlwZSI6IkZSQU1FIiwidmFsdWUiOiJDUkVBTVkgV0hJVEUifSx7InRyYWl0X3R5cGUiOiJGRUFUVVJFIiwidmFsdWUiOiJOTyJ9LHsidHJhaXRfdHlwZSI6IlNJR04iLCJ2YWx1ZSI6Ik5PIn1dfQ==";

const waveListRoot: string =
  "0x0026d1b0d76b1695e61ac3a4a96a58ca63bfc9d69ef078e59b18e0a050feace3";
// Proofs for address1, address2, address3, multiSigOwner
const waveListProofs: Object[] = [
  {
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    proofs: [
      "0xe9707d0e6171f728f7473c24cc0432a9b07eaaf1efed6a137a4a8c12c79552d9",
      "0x343750465941b29921f50a28e0e43050e5e1c2611a3ea8d7fe1001090d5e1436",
    ],
  },
  {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    proofs: [
      "0x1ebaa930b8e9130423c183bf38b0564b0103180b7dad301013b18e59880541ae",
      "0x343750465941b29921f50a28e0e43050e5e1c2611a3ea8d7fe1001090d5e1436",
    ],
  },
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    proofs: [
      "0x8a3552d60a98e0ade765adddad0a2e420ca9b1eef5f326ba7ab860bb4ea72c94",
      "0xf2c3464474f7edfddc3804cfd77cf8c1037248bf109be334147812e44d63eeaa",
    ],
  },
  {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    proofs: [
      "0x00314e565e0574cb412563df634608d76f5c59d9f817e85966100ec1d48005c0",
      "0xf2c3464474f7edfddc3804cfd77cf8c1037248bf109be334147812e44d63eeaa",
    ],
  },
];

// @ts-ignore
function findAddressAndProofsInMerkleList(address: string) {
  const addressWithProofs = waveListProofs.find(
    // @ts-ignore
    (item: Object) => item.address == address
  );
  if (addressWithProofs) {
    // @ts-ignore
    return addressWithProofs.proofs;
  } else {
    return {};
  }
}

let DollarBeach;
let dollarBeach: Contract;

let creedAllowListParams: any[];

function toWei(amount: number) {
  return BigNumber.from(amount).mul(BigNumber.from(10).pow(18));
}

const DOLLLAR_BEACH_DROP_RATE = BigNumber.from(152_788_388_082_506).mul(5);

const MAX_SUPPLY = 1337;
let _pew; // swallows stuff we don't need

describe("Beach NFT", function () {
  this.timeout(300000);

  // *** ERC721 / Minting ***
  //
  // [x] Should have a limit of 1337 max supply
  // [x] Should be unrevealed by default, only allowing to reveal once
  // [x] Should point to default metadata until reveal
  // [x] Should have a reveal function that can be called only by owner
  // [x] I should be able to transfer my NFT
  // [x] Minting should only be possible at a specific block, set at contract creation
  // [x] When the reveal function is called, it should set the proper IPFS base and point metadata to the right file
  // [x] TotalSupply should return the right value
  // [x] Default image and metadata should be visible
  // [x] A method should enable uploading the IPFS metadata to reveal
  // [x] After reveal, all TokenURI should return proper metadata JSON
  //
  // *** Beach Specific behavior ***
  //
  // [x] Each BEACH has a name
  // [ ] I can change my BEACH name against 50 $BEACH
  // [ ] 2 Beaches can't have the same name
  // [ ] Name can be seen in OpenSea
  //
  // *** ERC721 Extensions ***
  //
  // [x] Each NFT should have an ID, starting from 0 and going to 1336
  //
  // *** Security ***
  //
  // [x] Creator can transfer ownership to a new wallet
  // [x] Royalty withdrawing can only be done by a valid account or the owner
  // [ ] Adding a new payee can only be done by the contract owner
  // [ ] Adding a new payee does not break the payment calculations
  //
  // *** Royalties / Payment Splitter ***
  //
  // [x] Art should receive 50 % of the royalties for primary sale
  // [x] Dev should receive 25 % of the royalties for primary sale
  // [x] DAO should receive 25 % of the royalties for primary sale
  // [x] Royalty should be split between parties at mint time
  // [x] Royalty is assigned to a spread of addresses via payment splitter for
  //      secondary sale
  // [x] Royalty payment can be withdrawn
  //
  // [ ] Original Artist should receive 10 % of the royalties for secondary sale
  // [ ] Original Dev should receive 15 % of the royalties for secondary sale
  // [ ] DAO should receive 75 % of the royalties for secondary sale
  //
  // *** Lobster Resolver ***
  //
  // [x] Mock Smart Contract for Lobster
  // [x] The Smart Contract should detect if I hold LobsterDAO NFT
  //
  // *** Pricing ***
  //
  // [x] Price should have 137 items for first wave
  // [x] Price should be free for first wave for Lobster holders
  // [x] Price should have 317 items for second wave
  // [x] Price should be 0.037 for second wave for Lobster holders
  // [x] Price should be 0.073 for second wave for non-Lobster holders
  // [x] Price should have 713 items for third wave
  // [x] Price should be 0.073 for third wave for Lobster holders
  // [x] Price should be 0.1 for third wave for non-Lobster holders
  // [x] Price should have 170 items for fourth wave
  // [x] Price should be 0.1 for fourth wave for Lobster holders
  // [x] Price should be 0.1337 for fourth wave for non-Lobster holders
  //
  // *** Added functions ***
  //
  // [x] Must pass $beach IERC20 address for resolving balances (and mock for tests)
  //
  // *** Refactor ***
  //
  // [ ] All private variables should be underscored
  // [ ] Remove unused imports
  // [ ] Remove unused code
  //

  before(async function () {
    [
      address1, // 1 Lobster
      multiSigOwner, // 0 Lobster, contract owner (transferred)
      address2, // 2 Lobsters
      address3, // No lobsters
      addressArt,
      addressDev,
      addressDAO,
      addressSupply,
    ] = await hre.ethers.getSigners();

    royaltiesAccountsSigners = [addressArt, addressDev, addressDAO];
    royaltiesAccounts = [
      await royaltiesAccountsSigners[0].getAddress(),
      await royaltiesAccountsSigners[1].getAddress(),
      await royaltiesAccountsSigners[2].getAddress(),
    ];

    BeachLibraryContract = await ethers.getContractFactory("BeachLibrary");
    beachLibrary = await BeachLibraryContract.deploy();

    LobsterMockContract = await ethers.getContractFactory("LobsterMock");
    lobsterMock = await LobsterMockContract.deploy();
    await lobsterMock.deployed();
    await lobsterMock.safeMint(await address1.getAddress());
    await lobsterMock.safeMint(await address2.getAddress());
    await lobsterMock.safeMint(await address2.getAddress());

    DollarBeach = await ethers.getContractFactory("SeafoodToken");
    dollarBeach = await DollarBeach.deploy();
    await dollarBeach.deployed();
    await dollarBeach.transferOwnership(await multiSigOwner.getAddress());
    await dollarBeach.increaseAllowance(
      await multiSigOwner.getAddress(),
      toWei(5_000_000)
    );

    BeachNFT = await ethers.getContractFactory("Beach", {
      libraries: {
        BeachLibrary: beachLibrary.address,
      },
    });

    beachNFT137 = await BeachNFT.deploy(lobsterMock.address, 0, TRAITS);
    beachNFT317 = await BeachNFT.deploy(lobsterMock.address, 0, TRAITS);
    beachNFT713 = await BeachNFT.deploy(lobsterMock.address, 0, TRAITS);

    beachNFTMint = await BeachNFT.deploy(
      lobsterMock.address,
      blocksUntilMintOpens,
      TRAITS
    );

    await beachNFT137.deployed();
    await beachNFT317.deployed();
    await beachNFT713.deployed();
    await beachNFTMint.deployed();

    await beachNFT137.setSeafood(dollarBeach.address);
    await beachNFT137.setMerkleRoot(waveListRoot);
    await beachNFT137.addPayeesBatch(royaltiesAccounts, royaltiesSharesSplit);
    // Not setting this so we can test that setName is free until $seafood is set
    // await beachNFT317.setSeafood(dollarBeach.address);
    await beachNFT317.setMerkleRoot(waveListRoot);
    await beachNFT317.addPayeesBatch(royaltiesAccounts, royaltiesSharesSplit);
    await beachNFT713.setSeafood(dollarBeach.address);
    await beachNFT713.setMerkleRoot(waveListRoot);
    await beachNFT713.addPayeesBatch(royaltiesAccounts, royaltiesSharesSplit);
    await beachNFTMint.setSeafood(dollarBeach.address);
    await beachNFTMint.setMerkleRoot(waveListRoot);
    await beachNFTMint.addPayeesBatch(royaltiesAccounts, royaltiesSharesSplit);

    this.timeout(300000);

    await mintMany(137, await multiSigOwner.getAddress(), beachNFT137);
    await mintMany(317, await multiSigOwner.getAddress(), beachNFT317);
    await mintMany(713, await multiSigOwner.getAddress(), beachNFT713);

    await beachNFT137.transferOwnership(await multiSigOwner.getAddress());
    await beachNFT317.transferOwnership(await multiSigOwner.getAddress());
  });

  beforeEach(async function () {
    BeachLibraryContract = await ethers.getContractFactory("BeachLibrary");
    beachLibrary = await BeachLibraryContract.deploy();

    BeachNFT = await ethers.getContractFactory("Beach", {
      libraries: {
        BeachLibrary: beachLibrary.address,
      },
    });
    beachNFT = await BeachNFT.deploy(lobsterMock.address, 0, TRAITS);

    await beachNFT.deployed();
    await beachNFT.setSeafood(dollarBeach.address);
    await beachNFT.setMerkleRoot(waveListRoot);
    await beachNFT.addPayeesBatch(
      [
        await addressArt.getAddress(),
        await addressDev.getAddress(),
        await addressDAO.getAddress(),
      ],
      [50, 25, 25]
    );

    creedAllowListParams = [
      beachNFT.address,
      "BEACH",
      DOLLLAR_BEACH_DROP_RATE,
      true,
    ];

    // Transfer ownership after deployment
    await beachNFT.transferOwnership(await multiSigOwner.getAddress());
  });

  describe("NFT", async function () {
    describe("Supply", function () {
      it("Should have a supply limit to 1337", async function () {
        expect(await beachNFT.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
      });

      // Slow test
      it("Should not allow minting more than 1337 NFTs", async function () {
        // Deploy a new contract to max supply
        const beachSupplyNFT = await BeachNFT.deploy(
          lobsterMock.address,
          0,
          TRAITS
        );

        await beachSupplyNFT.deployed();
        await beachSupplyNFT.setSeafood(dollarBeach.address);
        await beachSupplyNFT.setMerkleRoot(waveListRoot);
        await beachSupplyNFT.addPayeesBatch(
          [
            await addressArt.getAddress(),
            await addressDev.getAddress(),
            await addressDAO.getAddress(),
          ],
          [50, 25, 25]
        );

        // Transfer ownership after deployment
        await beachSupplyNFT.transferOwnership(
          await multiSigOwner.getAddress()
        );

        for (let x = 0; x < 1337; x++) {
          // Use safeMint as a trick to test this
          await beachSupplyNFT
            .connect(multiSigOwner)
            .safeMint(await addressSupply.getAddress());
        }

        expect(await beachSupplyNFT.totalSupply()).to.equal(MAX_SUPPLY);
        await expect(
          beachSupplyNFT
            .connect(multiSigOwner)
            .safeMint(await addressSupply.getAddress())
        ).to.be.reverted;
      });
    });

    it("Should be unrevealed by default", async function () {
      expect(await beachNFT.revealState()).to.equal(false);
    });

    it("Should be able to reveal if owner", async function () {
      await beachNFT.connect(multiSigOwner).reveal(revealPath);
      expect(await beachNFT.revealState()).to.equal(true);
    });

    it("Should not be able to reveal if not owner", async function () {
      await expect(beachNFT.connect(address1).reveal(revealPath)).to.be
        .reverted;
      await expect(beachNFT.connect(address2).reveal(revealPath)).to.be
        .reverted;
    });

    it("Should only enable reveal once", async function () {
      await beachNFT.connect(multiSigOwner).reveal(revealPath);
      await expect(
        beachNFT.connect(multiSigOwner).reveal(revealPath)
      ).to.be.revertedWith("B: already revealed");
    });

    it("Should point to default metadata until reveal", async function () {
      const metadata = await beachNFT.tokenURI(0);
      expect(metadata).to.equal(basePathBase64JSON);
    });

    describe("NFT Metadata", async function () {
      beforeEach(async function () {
        await beachNFT.connect(multiSigOwner).setDict(DICT);
      });

      it("Should set DICT only if reveal has not been set to TRUE", async function () {
        expect(await beachNFT.revealState()).to.be.false;
        await beachNFT.connect(multiSigOwner).setDict(DICT);
      });

      it("Should set all metadata correctly", async function () {
        this.timeout(300000);

        await beachNFT
          .connect(multiSigOwner)
          .setMetadata([0, 167], metadataMetadata.slice(0, 167));
        await beachNFT
          .connect(multiSigOwner)
          .setMetadata([167, 334], metadataMetadata.slice(167, 334));
        await beachNFT
          .connect(multiSigOwner)
          .setMetadata([334, 501], metadataMetadata.slice(334, 501));
        await beachNFT
          .connect(multiSigOwner)
          .setMetadata([501, 668], metadataMetadata.slice(501, 668));
        await beachNFT
          .connect(multiSigOwner)
          .setMetadata([668, 835], metadataMetadata.slice(668, 835));
        await beachNFT
          .connect(multiSigOwner)
          .setMetadata([835, 1002], metadataMetadata.slice(835, 1002));
        await beachNFT
          .connect(multiSigOwner)
          .setMetadata([1002, 1169], metadataMetadata.slice(1002, 1169));
        await beachNFT
          .connect(multiSigOwner)
          .setMetadata([1169, 1337], metadataMetadata.slice(1169, 1337));
      });

      it("Should point to correct metadata after reveal", async function () {
        await beachNFT
          .connect(multiSigOwner)
          .setMetadata([0, 5], metadataMetadata.slice(0, 5));

        expect(await beachNFT.tokenURI(0)).to.equal(basePathBase64JSON);
        await beachNFT.connect(multiSigOwner).reveal(revealPath);
        expect(await beachNFT.tokenURI(0)).to.equal(
          revealedPathBase64JSONNoNameChange
        );
      });

      it("Should point to correct metadata with proper name after reveal", async function () {
        await beachNFT
          .connect(multiSigOwner)
          .setMetadata([0, 5], metadataMetadata.slice(0, 5));

        await beachNFT.connect(address3).gimmeBeaches(1, [], priceOverride1);
        // Transfer enough SEAFOOD to set name
        await dollarBeach
          .connect(multiSigOwner)
          .spend(await address3.getAddress(), toWei(50));
        await dollarBeach
          .connect(address3)
          .increaseAllowance(beachNFT.address, toWei(1_000));
        await beachNFT.connect(address3).setName(0, "BOOM");
        await beachNFT.connect(multiSigOwner).reveal(revealPath);
        expect(await beachNFT.tokenURI(0)).to.equal(
          revealedPathBase64JSONWithNameChange
        );
      });
    });

    it("Should have a first index of 0", async function () {
      // Should equal 0 when nothing has been minted
      expect(await beachNFT.totalSupply()).to.equal(0);
    });

    it("Should increment by 1 for each mint (safeMint)", async function () {
      // Should equal 1 after 1 mint
      await beachNFT
        .connect(multiSigOwner)
        .safeMint(await address1.getAddress());
      expect(await beachNFT.totalSupply()).to.equal(1);
    });

    it("Should have correct totalSupply()", async function () {
      expect(await beachNFT.totalSupply()).to.equal(0);
      // Should equal 1 after 1 mint
      await beachNFT
        .connect(multiSigOwner)
        .safeMint(await address1.getAddress());
      expect(await beachNFT.totalSupply()).to.equal(1);
    });

    it("Should have a name", async function () {
      await beachNFT
        .connect(multiSigOwner)
        .safeMint(await address1.getAddress());
      expect(await beachNFT.beachName(0)).to.equal("Beach #0");
    });

    it("Setting a name should be free is $SEAFOOD contract hasn't been set", async function () {
      await beachNFT317
        .connect(multiSigOwner)
        .safeMint(await multiSigOwner.getAddress());
      const id = (await beachNFT317.connect(multiSigOwner).totalSupply()) - 1;
      await beachNFT317.connect(multiSigOwner).setName(id, "SUP");

      expect(await beachNFT317.beachName(id)).to.equal("Beach SUP");
    });

    it("Should be able to transfer NFT", async function () {
      const address1address = await address3.getAddress();
      const address3address = await address3.getAddress();
      await beachNFT.connect(address3).gimmeBeaches(1, [], priceOverride1);
      expect(
        await beachNFT.ownerOf((await beachNFT.totalSupply()) - 1),
        "Owner of the latest NFT should be the minter"
      ).to.equal(address3address);
      await beachNFT
        .connect(address3)
        .transferFrom(address3address, address1address, 0);
      expect(await beachNFT.ownerOf(0)).to.equal(address1address);
    });
  });

  describe("Security", async function () {
    it("Should be Ownable and Transferable", async function () {
      // For this test, we'll try transferring it from the
      // multiSigOwner to address1
      await beachNFT
        .connect(multiSigOwner)
        .transferOwnership(await address1.getAddress());
      expect(await beachNFT.owner()).to.equal(await address1.getAddress());
      await expect(
        beachNFT.connect(address1).safeMint(await address1.getAddress())
      ).to.be.ok;
      await expect(
        beachNFT.connect(multiSigOwner).safeMint(await address1.getAddress())
      ).to.be.reverted;
    });
  });

  describe("Lobsters", async function () {
    it("Should resolve LobsterMock balance", async function () {
      expect(
        await beachNFT.resolveLobster(await address1.getAddress())
      ).to.equal(1);
      expect(
        await beachNFT.resolveLobster(await address2.getAddress())
      ).to.equal(2);
      expect(
        await beachNFT.resolveLobster(await address3.getAddress())
      ).to.equal(0);
    });
  });

  describe("DAO Functions", async function () {
    it("Should allow withdraw all ETH funds from the smart contract", async function () {
      await beachNFT.connect(address3).gimmeBeaches(1, [], priceOverride1);
      await beachNFT.connect(multiSigOwner).withdrawEthFunds();
      expect(
        await beachNFT.balanceAvailable(),
        "All amounts should have been withdrawn"
      ).to.equal(0);
    });

    it("Should allow withdrawing ERC20", async function () {
      await dollarBeach
        .connect(multiSigOwner)
        .spend(beachNFT.address, toWei(1));
      let balance = await dollarBeach.balanceOf(beachNFT.address);
      expect(balance, "Balance should be greater than 0").to.be.gt(0);
      await beachNFT
        .connect(multiSigOwner)
        .withdrawERC20Funds(dollarBeach.address);
      balance = await dollarBeach.balanceOf(beachNFT.address);
      expect(balance, "Balance should be 0").to.equal(0);
      balance = await dollarBeach.balanceOf(await multiSigOwner.getAddress());
      expect(balance, "Balance should be greater than 0").to.be.gt(0);
    });
  });

  describe("Royalties at mint time", async function () {
    function amountReceived(
      price: number,
      count: number,
      shares: number,
      totalShares_: number = totalShares
    ) {
      const multiplier = 10e18;
      price = price * multiplier;
      return (price * count * (shares / totalShares_)) / multiplier;
    }

    it("Should increase the smart contract balance properly", async function () {
      await beachNFT.connect(address3).gimmeBeaches(1, [], priceOverride1);

      await beachNFT.connect(multiSigOwner).split();

      expect(await ethers.provider.getBalance(beachNFT.address)).to.equal(
        ethers.utils.parseEther("1")
      );
    });

    it("Should handle splitting correctly", async function () {
      await beachNFT.connect(address3).gimmeBeaches(1, [], priceOverride1);

      await beachNFT.connect(multiSigOwner).split();
      await beachNFT.connect(multiSigOwner).split();

      expect(await ethers.provider.getBalance(beachNFT.address)).to.equal(
        ethers.utils.parseEther("1")
      );
    });

    it("Should split the royalties following the correct ratio (artificial)", async function () {
      const amountReceived = 1;
      await beachNFT.connect(address3).gimmeBeaches(1, [], priceOverride1);

      await beachNFT.connect(multiSigOwner).split();

      // At this point, each account balance should have the right split
      for (let i = 0; i < royaltiesAccounts.length; i++) {
        const expectedBalance =
          (amountReceived * royaltiesSharesSplit[i]) / totalShares;
        let actualBalance;
        [_pew, _pew, actualBalance, _pew] = await beachNFT
          .connect(multiSigOwner)
          .accountDetails(royaltiesAccounts[i]);

        expect(actualBalance).to.equal(
          ethers.utils.parseEther(expectedBalance.toString())
        );
      }
    });

    it("Should split the royalties following the correct ratio (real situation)", async function () {
      const amountReceived = 0.037; // Attempting to mint with Lobster at 2nd wave

      await beachNFT137
        .connect(address2)
        .gimmeBeaches(1, [], priceOverride0037);

      await beachNFT137.connect(multiSigOwner).split();

      // At this point, each account balance should have the right split
      for (let i = 0; i < royaltiesAccounts.length; i++) {
        const expectedBalance =
          (amountReceived * royaltiesSharesSplit[i]) / totalShares;
        let actualBalance;
        [_pew, _pew, actualBalance, _pew] = await beachNFT137
          .connect(royaltiesAccounts[i])
          .accountDetails(royaltiesAccounts[i]);

        expect(actualBalance).to.equal(
          ethers.utils.parseEther(expectedBalance.toString())
        );
      }
    });

    it("Should withdraw the balances to accounts and reset account balance", async function () {
      await beachNFT137
        .connect(address2)
        .gimmeBeaches(1, [], priceOverride0037);

      await beachNFT137.connect(multiSigOwner).split();

      // At this point, each account balance should have the right split
      for (let i = 0; i < royaltiesAccounts.length; i++) {
        await beachNFT137
          .connect(royaltiesAccountsSigners[i])
          .release(royaltiesAccounts[i]);

        const actualBalance = await royaltiesAccountsSigners[i].getBalance();
        let accountBalance;
        [_pew, _pew, accountBalance, _pew] = await beachNFT137
          .connect(multiSigOwner)
          .accountDetails(royaltiesAccounts[i]);

        expect(actualBalance.gt(ethers.utils.parseEther("0"))).to.be.ok;
        expect(accountBalance).to.equal(ethers.utils.parseEther("0"));
      }
    });

    it("Should only be withdraw-able (to an account) by the owner or the account itself when there is a balance", async function () {
      // Create a balance
      await beachNFT.connect(address3).gimmeBeaches(1, [], priceOverride1);
      await beachNFT.connect(multiSigOwner).split();
      expect(
        await beachNFT
          .connect(royaltiesAccountsSigners[0])
          .release(royaltiesAccounts[0])
      ).to.be.ok;
      await expect(beachNFT.connect(address3).release(royaltiesAccounts[0])).to
        .be.reverted; // With("Caller is not the owner or a valid account");
    });

    it("Should display consistent behavior under heavy usage", async function () {
      let account0Balance, amountExpected;

      await beachNFT137.connect(multiSigOwner).split();

      [_pew, _pew, account0Balance, _pew] = await beachNFT137
        .connect(royaltiesAccountsSigners[0])
        .accountDetails(royaltiesAccounts[0]);
      // console.log("Account 0 balance #0: ", account0Balance);

      await beachNFT137
        .connect(address3)
        .gimmeBeaches(3, [], priceOverride0073x3);

      await beachNFT137.connect(multiSigOwner).split();

      [_pew, _pew, account0Balance, _pew] = await beachNFT137
        .connect(royaltiesAccountsSigners[0])
        .accountDetails(royaltiesAccounts[0]);
      amountExpected = amountReceived(
        0.073,
        3,
        royaltiesSharesSplit[0]
      ).toString();

      // console.log(
      //   "Account 0 balance #1: ",
      //   account0Balance,
      //   "Account 0 expected balance #1: ",
      //   amountExpected
      // );

      expect(account0Balance).to.equal(
        ethers.utils.parseEther(amountExpected),
        `Amount received should be ${amountExpected}`
      );

      // Checking if re-split works
      await beachNFT137.connect(multiSigOwner).split();
      [_pew, _pew, account0Balance, _pew] = await beachNFT137
        .connect(royaltiesAccountsSigners[0])
        .accountDetails(royaltiesAccounts[0]);
      // console.log(
      //   "Account 0 balance #1.2 (re-split): ",
      //   account0Balance,
      //   "Account 0 expected balance #1.2 (re-split): ",
      //   amountExpected
      // );

      expect(account0Balance).to.equal(
        ethers.utils.parseEther(amountExpected),
        `Amount received should be ${amountExpected}`
      );

      expect(
        await beachNFT137
          .connect(royaltiesAccountsSigners[0])
          .release(royaltiesAccounts[0]),
        "Releasing the funds"
      ).to.be.ok;

      amountExpected = ethers.utils.parseEther("0");
      [_pew, _pew, account0Balance, _pew] = await beachNFT137
        .connect(royaltiesAccountsSigners[0])
        .accountDetails(royaltiesAccounts[0]);
      // console.log("Account 0 balance #2.1 (release funds): ", account0Balance);
      // console.log(
      //   "Account 0 expected balance #2.1 (release funds): ",
      //   amountExpected
      // );
      expect(account0Balance, "Funds should be 0 after release").to.equal(
        amountExpected
      );

      await beachNFT137
        .connect(address3)
        .gimmeBeaches(1, [], priceOverride0073);

      await beachNFT137.connect(multiSigOwner).split();

      amountExpected = ethers.utils.parseEther(
        amountReceived(0.073, 1, royaltiesSharesSplit[0]).toString()
      );

      [_pew, _pew, account0Balance, _pew] = await beachNFT137
        .connect(royaltiesAccountsSigners[0])
        .accountDetails(royaltiesAccounts[0]);
      // console.log("Account 0 balance #3: ", account0Balance);
      // console.log("Account 0 expected balance #3: ", amountExpected);
      expect(account0Balance, "Received price for 3 mint").to.equal(
        amountExpected
      );

      await beachNFT137
        .connect(address1)
        .gimmeBeaches(3, [], priceOverride0037x3);

      await beachNFT137.connect(multiSigOwner).split();

      amountExpected = ethers.utils.parseEther(
        (
          amountReceived(0.037, 3, royaltiesSharesSplit[0]) +
          amountReceived(0.073, 1, royaltiesSharesSplit[0])
        ).toString()
      );

      [_pew, _pew, account0Balance, _pew] = await beachNFT137
        .connect(royaltiesAccountsSigners[0])
        .accountDetails(royaltiesAccounts[0]);
      // console.log("Account 0 balance #4: ", account0Balance);
      // console.log("Account 0 expected balance #4: ", amountExpected);
      expect(account0Balance, "Received price for 3 mints").to.equal(
        amountExpected
      );

      expect(
        await beachNFT137
          .connect(royaltiesAccountsSigners[0])
          .release(royaltiesAccounts[0]),
        "Releasing funds"
      ).to.be.ok;

      amountExpected = ethers.utils.parseEther("0");
      [_pew, _pew, account0Balance, _pew] = await beachNFT137
        .connect(royaltiesAccountsSigners[0])
        .accountDetails(royaltiesAccounts[0]);
      // console.log("Account 0 balance #4.1 (release): ", account0Balance);
      // console.log(
      //   "Account 0 expected balance #4.1 (release): ",
      //   amountExpected
      // );
      expect(account0Balance, "Funds should be 0 after release").to.equal(
        amountExpected
      );
    });

    describe("Payees management", async function () {
      it("Should behave correctly when payees are added", async function () {
        let accountBalance, amountExpected;
        const multiSigAddress = await multiSigOwner.getAddress();

        await beachNFT137
          .connect(address2)
          .gimmeBeaches(1, [], priceOverride0037);
        await beachNFT137.connect(multiSigOwner).addPayee(multiSigAddress, 25);

        amountExpected = ethers.utils.parseEther("0");
        [_pew, _pew, accountBalance, _pew] = await beachNFT137
          .connect(multiSigOwner)
          .accountDetails(multiSigAddress);

        expect(
          accountBalance,
          "Should be 0 since it was added after a payout"
        ).to.equal(amountExpected);

        await beachNFT137
          .connect(address2)
          .gimmeBeaches(1, [], priceOverride0037);

        await beachNFT137.connect(multiSigOwner).split();

        amountExpected = amountReceived(
          0.037,
          1,
          25,
          totalShares + 25
        ).toString();
        [_pew, _pew, accountBalance, _pew] = await beachNFT137
          .connect(multiSigOwner)
          .accountDetails(multiSigAddress);

        expect(
          accountBalance,
          "New addee's balance should be reflected correctly"
        ).to.equal(ethers.utils.parseEther(amountExpected));

        amountExpected = (
          amountReceived(0.037, 1, 50, totalShares) +
          amountReceived(0.037, 1, 50, totalShares + 25)
        ).toFixed(5);
        [_pew, _pew, accountBalance, _pew] = await beachNFT137
          .connect(multiSigOwner)
          .accountDetails(royaltiesAccounts[0]);

        expect(
          accountBalance,
          "Balance of an account prior to the addition should be correct according to shares changes"
        ).to.equal(ethers.utils.parseEther(amountExpected));
      });

      it("Should behave correctly when payees are removed", async function () {
        let accountBalance, amountExpected;
        const multiSigAddress = await multiSigOwner.getAddress();

        await beachNFT137
          .connect(addressSupply)
          .gimmeBeaches(1, [], priceOverride0073);

        let thisAccountShares, thisAccountReleased, thisAccountBalance;

        [thisAccountShares, thisAccountReleased, thisAccountBalance, _pew] =
          await beachNFT137
            .connect(multiSigOwner)
            .accountDetails(multiSigAddress);

        if (
          thisAccountShares === 0 &&
          thisAccountReleased.eq(0) &&
          thisAccountBalance.eq(0)
        ) {
          await beachNFT137
            .connect(multiSigOwner)
            .addPayee(multiSigAddress, 25);

          amountExpected = ethers.utils.parseEther("0");

          [_pew, _pew, accountBalance, _pew] = await beachNFT137
            .connect(multiSigOwner)
            .accountDetails(multiSigAddress);

          expect(
            accountBalance,
            "Should be 0 since it was added after a payout"
          ).to.equal(amountExpected);
        }

        // Release all funds to reset everything
        await beachNFT137.connect(multiSigOwner).split();

        [_pew, _pew, accountBalance, _pew] = await beachNFT137
          .connect(multiSigOwner)
          .accountDetails(royaltiesAccounts[0]);

        if (accountBalance > 0) {
          await beachNFT137
            .connect(multiSigOwner)
            .release(royaltiesAccounts[0]);
        }

        [_pew, _pew, accountBalance, _pew] = await beachNFT137
          .connect(multiSigOwner)
          .accountDetails(royaltiesAccounts[1]);

        if (accountBalance > 0) {
          await beachNFT137
            .connect(multiSigOwner)
            .release(royaltiesAccounts[1]);
        }

        [_pew, _pew, accountBalance, _pew] = await beachNFT137
          .connect(multiSigOwner)
          .accountDetails(royaltiesAccounts[2]);

        if (accountBalance > 0) {
          await beachNFT137
            .connect(multiSigOwner)
            .release(royaltiesAccounts[2]);
        }

        [_pew, _pew, accountBalance, _pew] = await beachNFT137
          .connect(multiSigOwner)
          .accountDetails(multiSigAddress);

        if (accountBalance > 0) {
          await beachNFT137.connect(multiSigOwner).release(multiSigAddress);
        }

        await beachNFT137
          .connect(addressSupply)
          .gimmeBeaches(1, [], priceOverride0073);

        await beachNFT137.connect(multiSigOwner).split();

        amountExpected = amountReceived(0.073, 1, 25, totalShares + 25).toFixed(
          5
        );
        [_pew, _pew, accountBalance, _pew] = await beachNFT137
          .connect(multiSigOwner)
          .accountDetails(multiSigAddress);

        expect(
          accountBalance,
          "New addee's balance should be correctly reflected"
        ).to.equal(ethers.utils.parseEther(amountExpected));

        amountExpected = amountReceived(0.073, 1, 50, totalShares + 25).toFixed(
          // amountReceived(0.037, 1, 50, totalShares) +
          5
        );
        [_pew, _pew, accountBalance, _pew] = await beachNFT137
          .connect(multiSigOwner)
          .accountDetails(royaltiesAccounts[0]);

        expect(
          accountBalance,
          "Balance of an account prior to the addition should be correct according to shares changes"
        ).to.equal(ethers.utils.parseEther(amountExpected));

        await beachNFT137
          .connect(address1)
          .gimmeBeaches(1, [], priceOverride0037);
        await beachNFT137
          .connect(multiSigOwner)
          .updatePayee(multiSigAddress, 50);
        await beachNFT137
          .connect(addressSupply)
          .gimmeBeaches(1, [], priceOverride0073);
        await beachNFT137
          .connect(multiSigOwner)
          .updatePayee(royaltiesAccounts[0], 25);
        await beachNFT137
          .connect(address1)
          .gimmeBeaches(1, [], priceOverride0037);

        await beachNFT137.connect(multiSigOwner).split();

        amountExpected = (
          amountReceived(0.073, 1, 25, totalShares + 25) +
          amountReceived(0.037, 1, 25, totalShares + 25) +
          amountReceived(0.073, 1, 50, totalShares + 50) +
          amountReceived(0.037, 1, 50, totalShares + 50 - 25)
        ).toFixed(5);
        [_pew, _pew, accountBalance, _pew] = await beachNFT137
          .connect(multiSigOwner)
          .accountDetails(multiSigAddress);

        expect(
          accountBalance.div(BigNumber.from(10e12)).mul(BigNumber.from(10e12)),
          "Balance of an account after multiple modifications should reflect correctly"
        ).to.equal(ethers.utils.parseEther(amountExpected));
      });

      it("Should withdraw all funds from the Smart Contract balance if all shareholders release", async function () {
        let balanceAvailable;

        await beachNFT137
          .connect(address3)
          .gimmeBeaches(
            1,
            findAddressAndProofsInMerkleList(await address3.getAddress()),
            priceOverride0037
          );
        await beachNFT137.connect(multiSigOwner).split();
        await beachNFT137.connect(multiSigOwner).release(royaltiesAccounts[0]);
        await beachNFT137.connect(multiSigOwner).release(royaltiesAccounts[1]);
        await beachNFT137.connect(multiSigOwner).release(royaltiesAccounts[2]);
        await beachNFT137
          .connect(multiSigOwner)
          .release(await multiSigOwner.getAddress());
        balanceAvailable = await beachNFT137
          .connect(multiSigOwner)
          .balanceAvailable();
        expect(balanceAvailable).to.equal(ethers.utils.parseEther("0"));
      });
    });
  });

  describe("Wavelist", async function () {
    it("Should validate the wavelist for addresses in the list", async function () {
      const address1Proofs = findAddressAndProofsInMerkleList(
        await address1.getAddress()
      );
      // Attempt to mint for free since it is in the waveList
      await expect(beachNFT.connect(address1).gimmeBeaches(1, address1Proofs))
        .to.not.be.reverted;
    });

    it("Should return true to amIWaveListed for addresses in the list", async function () {
      const address1Proofs = findAddressAndProofsInMerkleList(
        await address1.getAddress()
      );

      await expect(beachNFT.connect(address1).amIWaveListed(address1Proofs)).to
        .be.ok;
    });

    it("Should reject the wavelist for addresses NOT in the list", async function () {
      await expect(
        beachNFT.connect(addressArt).gimmeBeaches(1, [])
      ).to.be.revertedWith("B: Minting amount incorrect");
    });

    it("Should reject the wavelist for incorrect addresses providing incorrect proofs", async function () {
      const address1Proofs = findAddressAndProofsInMerkleList(
        await address1.getAddress()
      );
      // Attempt to mint for free since it is in the waveList
      await expect(
        beachNFT.connect(addressDAO).gimmeBeaches(1, address1Proofs)
      ).to.be.revertedWith("B: Minting amount incorrect");
    });

    // We don't reject empty or wrong waveList merkleProofs anymore but only apply
    // discount price if valid. Anyone can check if they are in the waveList via
    // amIWaveListed()
    // it("Should reject the wavelist for correct addresses providing incorrect proofs", async function () {
    //   const address1Proofs = findAddressAndProofsInMerkleList(
    //     await address1.getAddress()
    //   );
    //   // Attempt to mint for free since it is in the waveList
    //   await expect(
    //     beachNFT.connect(address2).gimmeBeaches(1, address1Proofs)
    //   ).to.be.revertedWith("B: Not found in waveList");
    // });
  });

  describe("Pricing", async function () {
    describe("Lobster owners", async function () {
      it("Should return free (0) if I have Lobsters and the current wave is the first wave", async function () {
        expect(
          await beachNFT.connect(address1).getMyPriceForNextMint([])
        ).to.equal(ethers.utils.parseEther("0"));
      });

      it("Should return 0.037 ether if I have 1 Lobsters or more and the current wave is the second wave", async function () {
        expect(
          await beachNFT137.connect(address2).getMyPriceForNextMint([])
        ).to.equal(ethers.utils.parseEther("0.037"));
      });

      it("Should return 0.073 ether if I have Lobsters and the current wave is the third wave", async function () {
        expect(
          await beachNFT317.connect(address1).getMyPriceForNextMint([])
        ).to.equal(ethers.utils.parseEther("0.073"));
      });

      it("Should return 0.1 ether if I have Lobsters and the current wave is the fourth wave", async function () {
        expect(
          await beachNFT713.connect(address1).getMyPriceForNextMint([])
        ).to.equal(ethers.utils.parseEther("0.1"));
      });
    });

    describe("NON Lobster owners", async function () {
      it("Should return 1 ether if I have Lobsters and the current wave is the first wave", async function () {
        expect(
          await beachNFT.connect(address3).getMyPriceForNextMint([])
        ).to.equal(ethers.utils.parseEther("1"));
      });

      it("Should return 0.037 ether if I have Lobsters and the current wave is the second wave", async function () {
        expect(
          await beachNFT137.connect(address3).getMyPriceForNextMint([])
        ).to.equal(ethers.utils.parseEther("0.073"));
      });

      it("Should return 0.073 ether if I have Lobsters and the current wave is the third wave", async function () {
        expect(
          await beachNFT317.connect(address3).getMyPriceForNextMint([])
        ).to.equal(ethers.utils.parseEther("0.1"));
      });

      it("Should return 0.1 ether if I have Lobsters and the current wave is the fourth wave", async function () {
        expect(
          await beachNFT713.connect(address3).getMyPriceForNextMint([])
        ).to.equal(ethers.utils.parseEther("0.1337"));
      });
    });
  });

  describe("Mint", async function () {
    it("Should only mint passed a certain block time", async function () {
      // Price is 0 for address1 (current owner) because it has 1 Lobster.
      await expect(
        beachNFTMint.connect(address1).gimmeBeaches(1, [])
      ).to.be.revertedWith("B: Mint block not ready");
      await advanceBlocks(blocksUntilMintOpens);
      await beachNFTMint.connect(address1).gimmeBeaches(1, []);
      expect(
        await beachNFTMint.balanceOf(await address1.getAddress())
      ).to.equal(1);
    });
  });

  xdescribe("SEAFOOD ERC20", function () {
    //
    // **** ERC20 ****
    //
    // [x] Should have a MAX SUPPLY of 5,000,000
    // [x] Should have a name of SEAFOOD
    //
    // **** STAKING ****
    //
    // [x] Should have a whitelist for tokens to stake
    // [x] Whitelist should be updateable by owner (add, remove, clear)
    // [x] Should have a staking rewards calculated based off of blocks elapsed
    // [x] Should have a staking "reward rate" per whitelisted token (struct?)
    // [ ] Reward rate should be updateable
    // [ ] Claiming rewards should reset block
    //
    // ******* Staking *******
    //
    // [x] Allows minting, approving staking contract and staking 1 NFT
    // [x] Accrues rewards at each block
    // [x] Freezes balance when claiming
    // [x] Maintains correct balances when I freeze balances
    // [x] Can claim accurate amount
    // [x] Can unstake
    //
    // ******* Adversarial *******
    //
    // [x] Should not be able to stake tokens I don't own
    // [x] Should not be able to withdraw tokens I don't own
    // [ ] Should not be able to claim rewards I don't own
    //
    // ******* Partnership Staking *******
    //
    // [x] Should enable staking for partner staking (LobsterMock)
    // [ ] Should accrue at the right rate
    // [ ] Should enable claiming and unstaking
    //
    // **** CURRENCY ****
    //
    // [ ] Should be able to transfer
    // [ ] Should be pausable
    //

    describe("Basic tests", async function () {
      it("Should be an ERC20 token", async function () {
        expect(await dollarBeach.name()).to.equal("B34CH Life Currency");
        expect(await dollarBeach.symbol()).to.equal("SEAFOOD");
      });

      it("Contract should have a balance of 5000000", async function () {
        expect(await dollarBeach.balanceOf(dollarBeach.address)).to.equal(
          toWei(5_000_000)
        );
      });

      it("Should have a total supply of 5000000", async function () {
        expect(await dollarBeach.totalSupply()).to.equal(toWei(5_000_000));
      });

      it("Should have 18 decimals", async function () {
        expect(await dollarBeach.decimals()).to.equal(18);
      });
    });

    describe("Staking", async function () {
      let token0: any;
      const MOVE_BY_X_BLOCKS = 2;

      beforeEach(async function () {
        // Mint 1 NFT
        await beachNFT.connect(address2).gimmeBeaches(5, []);

        // Approve staking contract
        await beachNFT
          .connect(address2)
          .setApprovalForAll(dollarBeach.address, true);

        // Get the first NFT that got minted
        token0 = await beachNFT.tokenOfOwnerByIndex(
          await address2.getAddress(),
          0
        );

        await dollarBeach.connect(multiSigOwner).clearCreedAllowList();
      });

      describe("Creed Management", async function () {
        beforeEach(async function () {
          // Return all to owners
          await dollarBeach.connect(multiSigOwner).emergencyReturn();

          await dollarBeach.connect(multiSigOwner).clearCreedAllowList();

          await dollarBeach
            .connect(multiSigOwner)
            .modifyCreedAllowList(
              creedAllowListParams[0],
              creedAllowListParams[1],
              creedAllowListParams[2],
              creedAllowListParams[3]
            );
        });

        it("Should not allow staking a creed that wasn't allowed", async function () {
          await dollarBeach.connect(multiSigOwner).clearCreedAllowList();

          await expect(
            dollarBeach.connect(address2).stake(beachNFT.address, token0)
          ).to.be.revertedWith("S: This token is not allowed");
        });

        it("Should allow staking a creed that was allowed", async function () {
          const myStakingIdsBefore = await dollarBeach
            .connect(address2)
            .getMyStakingIds(true);

          // Stake the one token
          await dollarBeach.connect(address2).stake(beachNFT.address, token0);

          const myStakingIdsAfter = await dollarBeach
            .connect(address2)
            .getMyStakingIds(true);
          expect(myStakingIdsAfter).to.be.of.length(1);
        });

        it("Should make sure that similar creeds are only in once", async function () {
          await dollarBeach
            .connect(multiSigOwner)
            .modifyCreedAllowList(
              creedAllowListParams[0],
              creedAllowListParams[1],
              creedAllowListParams[2],
              creedAllowListParams[3]
            );

          const allCreeds = await dollarBeach
            .connect(multiSigOwner)
            .getAllCreeds();

          expect(
            allCreeds,
            "Expect getAllCreeds to return all Creeds"
          ).to.be.of.length(1);
        });

        it("Should return proper enumeration for Creeds", async function () {
          const isCreedAllowed = await dollarBeach
            .connect(multiSigOwner)
            .isCreedAllowed(beachNFT.address);

          expect(
            isCreedAllowed,
            "Expect isCreedAllowed to return correct payload"
          ).deep.equal(creedAllowListParams);

          const allCreeds = await dollarBeach
            .connect(multiSigOwner)
            .getAllCreeds();

          expect(
            allCreeds,
            "Expect getAllCreeds to return all Creeds"
          ).deep.equal([creedAllowListParams]);
        });

        it("Should clear creeds", async function () {
          const isCreedAllowed = await dollarBeach
            .connect(multiSigOwner)
            .isCreedAllowed(beachNFT.address);

          expect(
            isCreedAllowed,
            "Expect isCreedAllowed to return correct payload"
          ).deep.equal(creedAllowListParams);

          await dollarBeach.connect(multiSigOwner).clearCreedAllowList();

          const allCreeds = await dollarBeach
            .connect(multiSigOwner)
            .getAllCreeds();

          expect(allCreeds, "Expect getAllCreeds to be empty").to.deep.equal(
            []
          );
        });
      });

      it("Should allow staking one NFT, transfers and starts staking properly", async function () {
        await dollarBeach
          .connect(multiSigOwner)
          .modifyCreedAllowList(
            creedAllowListParams[0],
            creedAllowListParams[1],
            creedAllowListParams[2],
            creedAllowListParams[3]
          );

        // Stake the one token
        await dollarBeach.connect(address2).stake(beachNFT.address, token0);

        const stakingIds = await dollarBeach
          .connect(address2)
          .getMyStakingIds(true);
        expect(
          await dollarBeach.getStakingIdOwner(stakingIds[0]),
          "Address should match owner's"
        ).to.equal(await address2.getAddress());
        expect(stakingIds, "StakingIds should be of size 1").to.be.of.length(1);
      });

      xit("Should accrue rewards at each block 1", async function () {
        const balance = BigNumber.from(
          await dollarBeach.connect(address2).getMyStakingBalance()
        );
        const expectedBalance = DOLLLAR_BEACH_DROP_RATE.mul(12);
        expect(
          balance,
          `Should equal ${MOVE_BY_X_BLOCKS} blocks value`
        ).to.equal(expectedBalance);
      });

      xit("Should accrue rewards at each block 2", async function () {
        const balance = BigNumber.from(
          await dollarBeach.connect(address2).getMyStakingBalance()
        );
        const expectedBalance = DOLLLAR_BEACH_DROP_RATE.mul(32);
        expect(
          balance,
          `Should equal ${MOVE_BY_X_BLOCKS} blocks value`
        ).to.equal(expectedBalance);
      });

      xit("Should claim, freeze balance and transfer the right amount", async function () {
        await dollarBeach.connect(address2).claimAll(false); // Creates new block
        const ClaimableBalance = await dollarBeach
          .connect(address2)
          .getMyStakingBalance();
        expect(
          ClaimableBalance,
          `Claimable amount should equal 0 as it was all transferred`
        ).to.equal(0);
        const accountBalance = BigNumber.from(
          await dollarBeach.balanceOf(await address2.getAddress())
        );
        const expectedDropClaimed = DOLLLAR_BEACH_DROP_RATE.mul(
          MOVE_BY_X_BLOCKS + 1
        );
        expect(
          expectedDropClaimed.eq(accountBalance),
          `Should equal ${MOVE_BY_X_BLOCKS + 1} blocks value`
        ).to.equal(true);
      });

      xit("Should accumulate right balance after claiming", async function () {
        await dollarBeach.connect(address2).claimAll(false); // Creates new block
        await advanceBlocks(2); // Creates new block
        const expectedClaimable = DOLLLAR_BEACH_DROP_RATE.mul(2);
        const ClaimableBalance = BigNumber.from(
          await dollarBeach.connect(address2).getMyStakingBalance()
        );
        expect(
          ClaimableBalance.eq(expectedClaimable),
          `Claimable amount should equal 2 blocks value`
        ).to.equal(true);
      });

      it("Should unstake correctly", async function () {
        // Unstake one token
        await dollarBeach.connect(address2).unstakeAll(); // Create new block

        expect(
          await beachNFT.ownerOf(token0),
          "Address2 should own the NFT"
        ).to.equal(await address2.getAddress());
      });
    });
  });
});
