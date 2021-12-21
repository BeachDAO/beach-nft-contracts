// eslint-disable-next-line node/no-extraneous-import
import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { Beach, LobsterMock } from "../typechain";
// import { BigNumber } from "ethers";

const hre = require("hardhat");

let BeachNFT;
let LobsterMockContract;
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
  addressDAO: Signer;

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
const priceOverride1 = {
  value: ethers.utils.parseEther("1"),
};

const blocksUntilMintOpens = 250;

// eslint-disable-next-line no-unused-vars
async function mintMany(n: number, address: string, chain = beachNFT) {
  for (let i = 0; i < n; i++) {
    await chain.safeMint(address);
  }
}

async function advanceBlocks(blocks = 1) {
  for (let i = 0; i < blocks; i++) {
    await hre.network.provider.send("evm_mine");
  }
}

const unrevealedPath: string = "nope";
const revealPath: string = "QmbE4SA82GkKHEtqxxnYjtMweN1a3x5e5UwbzAWUkNN3vk";
const basePathURI: string = "https://lobby.mypinata.cloud/ipfs/";

describe("Beach NFT", function () {
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
  // [ ] Default image and metadata should be visible
  // [x] Each BEACH has a name
  // [ ] I can change my BEACH name against 10 $BEACH
  //
  // *** Beach Specific behavior ***
  //
  // [ ] Each beach should have a name
  // [ ] By paying 10 $BEACH I can rename my beach
  // [ ] 2 Beaches can't have the same name
  //
  // *** ERC721 Extensions ***
  //
  // [x] Each NFT should have an ID, starting from 0 and going to 1336
  // [ ] Contract should have provenance information
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
  // [ ] Must pass $beach IERC20 address for resolving balances (and mock for tests)
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
    ] = await hre.ethers.getSigners();

    royaltiesAccountsSigners = [addressArt, addressDev, addressDAO];
    royaltiesAccounts = [
      await royaltiesAccountsSigners[0].getAddress(),
      await royaltiesAccountsSigners[1].getAddress(),
      await royaltiesAccountsSigners[2].getAddress(),
    ];

    LobsterMockContract = await ethers.getContractFactory("LobsterMock");
    lobsterMock = await LobsterMockContract.deploy();
    await lobsterMock.deployed();
    await lobsterMock.safeMint(await address1.getAddress());
    await lobsterMock.safeMint(await address2.getAddress());
    await lobsterMock.safeMint(await address2.getAddress());

    BeachNFT = await ethers.getContractFactory("Beach");

    beachNFT137 = await BeachNFT.deploy(
      lobsterMock.address,
      royaltiesAccounts,
      royaltiesSharesSplit,
      0
    );
    beachNFT317 = await BeachNFT.deploy(
      lobsterMock.address,
      royaltiesAccounts,
      royaltiesSharesSplit,
      0
    );
    beachNFT713 = await BeachNFT.deploy(
      lobsterMock.address,
      royaltiesAccounts,
      royaltiesSharesSplit,
      0
    );
    beachNFTMint = await BeachNFT.deploy(
      lobsterMock.address,
      royaltiesAccounts,
      royaltiesSharesSplit,
      blocksUntilMintOpens
    );
    await beachNFT137.deployed();
    await beachNFT317.deployed();
    await beachNFT713.deployed();
    await beachNFTMint.deployed();

    this.timeout(75000);

    await mintMany(137, await multiSigOwner.getAddress(), beachNFT137);
    // await mintMany(317, await multiSigOwner.getAddress(), beachNFT317);
    // await mintMany(713, await multiSigOwner.getAddress(), beachNFT713);
  });

  beforeEach(async function () {
    BeachNFT = await ethers.getContractFactory("Beach");
    beachNFT = await BeachNFT.deploy(
      lobsterMock.address,
      [
        await addressArt.getAddress(),
        await addressDev.getAddress(),
        await addressDAO.getAddress(),
      ],
      [50, 25, 25],
      0
    );
    await beachNFT.deployed();
    // Transfer ownership after deployment
    await beachNFT.transferOwnership(await multiSigOwner.getAddress());
  });

  describe("NFT", async function () {
    it("Should have a supply limit to 1337", async function () {
      expect(await beachNFT.MAX_SUPPLY()).to.equal(1337);
    });

    it("Should be unrevealed by default", async function () {
      expect(await beachNFT.revealState()).to.equal(false);
    });

    it("Should be able to reveal if owner", async function () {
      await beachNFT.connect(multiSigOwner).reveal(revealPath);
      expect(await beachNFT.revealState()).to.equal(true);
    });

    it("Should not be able to reveal if not owner", async function () {
      await expect(beachNFT.connect(address1).reveal(basePathURI)).to.be
        .reverted;
      await expect(beachNFT.connect(address2).reveal(basePathURI)).to.be
        .reverted;
    });

    it("Should only enable reveal once", async function () {
      await beachNFT.connect(multiSigOwner).reveal(basePathURI);
      await expect(
        beachNFT.connect(multiSigOwner).reveal(basePathURI)
      ).to.be.revertedWith("BEACH: _revealed already set");
    });

    it("Should point to default metadata until reveal", async function () {
      expect(await beachNFT.tokenURI(0)).to.equal(basePathURI);
    });

    it("Should point to correct metadata after reveal", async function () {
      expect(await beachNFT.tokenURI(0)).to.equal(basePathURI);
      await beachNFT.connect(multiSigOwner).reveal(revealPath);
      expect(await beachNFT.tokenURI(0)).to.equal(
        basePathURI.concat(revealPath, "/0.json")
      );
    });

    it("Should have a first index of 0", async function () {
      // Should equal 0 when nothing has been minted
      expect(await beachNFT.currentTokenId()).to.equal(0);
    });

    it("Should increment by 1 for each mint (safeMint)", async function () {
      // Should equal 1 after 1 mint
      await beachNFT
        .connect(multiSigOwner)
        .safeMint(await address1.getAddress());
      expect(await beachNFT.currentTokenId()).to.equal(1);
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
      expect(beachNFT.beachName(0)).to.equal("0");
    });

    it("Should be able to transfer NFT", async function () {
      const address1address = await address3.getAddress();
      const address3address = await address3.getAddress();
      await beachNFT.connect(address3).gimmeBeaches(1, priceOverride1);
      expect(await beachNFT.ownerOf(0)).to.equal(address3address);
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

  describe("Royalties at mint time", async function () {
    it("Should increase the smart contract balance properly", async function () {
      await beachNFT.connect(address3).gimmeBeaches(1, priceOverride1);
      expect(await beachNFT.connect(multiSigOwner).balance()).to.equal(
        ethers.utils.parseEther("1")
      );
    });

    it("Should split the royalties following the correct ratio (artificial)", async function () {
      const amountReceived = 1;
      await beachNFT.connect(address3).gimmeBeaches(1, priceOverride1);
      // At this point, each account balance should have the right split
      for (let i = 0; i < royaltiesAccounts.length; i++) {
        const expectedBalance =
          (amountReceived * royaltiesSharesSplit[i]) / totalShares;
        const actualBalance = await beachNFT
          .connect(multiSigOwner)
          .accountBalance(royaltiesAccounts[i]);

        expect(actualBalance).to.equal(
          ethers.utils.parseEther(expectedBalance.toString())
        );
      }
    });

    it("Should split the royalties following the correct ratio (real situation)", async function () {
      const amountReceived = 0.037; // Attempting to mint with Lobster at 2nd wave
      await beachNFT137.connect(address2).gimmeBeaches(1, priceOverride0037);

      // At this point, each account balance should have the right split
      for (let i = 0; i < royaltiesAccounts.length; i++) {
        const expectedBalance =
          (amountReceived * royaltiesSharesSplit[i]) / totalShares;
        const actualBalance = await beachNFT137
          .connect(addressDAO)
          .accountBalance(royaltiesAccounts[i]);

        expect(actualBalance).to.equal(
          ethers.utils.parseEther(expectedBalance.toString())
        );
      }
    });

    it("Should withdraw the balances to accounts and reset account balance", async function () {
      // const amountReceived = 0.037; // Attempting to mint with Lobster at 2nd wave
      await beachNFT137.connect(address2).gimmeBeaches(1, priceOverride0037);

      // At this point, each account balance should have the right split
      for (let i = 0; i < royaltiesAccounts.length; i++) {
        await beachNFT137
          .connect(royaltiesAccountsSigners[i])
          .release(royaltiesAccounts[i]);

        const actualBalance = await royaltiesAccountsSigners[i].getBalance();

        // Using greater than 10000 because it's hard to know exactly how much
        // will the account receive but it won't be exactly the same amount due
        // to gas fees.
        // eslint-disable-next-line no-unused-expressions
        expect(actualBalance.gt(ethers.utils.parseEther((10000).toString()))).to
          .be.ok;
        expect(await beachNFT137.accountBalance(royaltiesAccounts[i])).to.equal(
          ethers.utils.parseEther("0")
        );
      }
    });

    it("Should only be withdraw-able (to an account) by the owner or the account itself when there is a balance", async function () {
      // Create a balance
      await beachNFT.connect(address3).gimmeBeaches(1, priceOverride1);
      await expect(
        beachNFT
          .connect(royaltiesAccountsSigners[0])
          .release(royaltiesAccounts[0])
      ).to.be.ok;
      await expect(
        beachNFT.connect(address3).release(royaltiesAccounts[0])
      ).to.be.revertedWith("Caller is not the owner or a valid account");
    });
  });

  describe("Pricing", async function () {
    describe("Lobster owners", async function () {
      it("Should return free (0) if I have Lobsters and the current wave is the first wave", async function () {
        expect(
          await beachNFT.connect(address1).getMyPriceForNextMint()
        ).to.equal(ethers.utils.parseEther("0"));
      });

      it("Should return 0.037 ether if I have 2 Lobsters or more and the current wave is the second wave", async function () {
        expect(
          await beachNFT137.connect(address2).getMyPriceForNextMint()
        ).to.equal(ethers.utils.parseEther("0.037"));
      });

      xit("Should return 0.073 ether if I have Lobsters and the current wave is the third wave", async function () {
        expect(
          await beachNFT317.connect(address1).getMyPriceForNextMint()
        ).to.equal(ethers.utils.parseEther("0.073"));
      });

      xit("Should return 0.1 ether if I have Lobsters and the current wave is the fourth wave", async function () {
        expect(
          await beachNFT713.connect(address1).getMyPriceForNextMint()
        ).to.equal(ethers.utils.parseEther("0.1"));
      });
    });

    describe("NON Lobster owners", async function () {
      it("Should return 1 ether if I have Lobsters and the current wave is the first wave", async function () {
        expect(
          await beachNFT.connect(address3).getMyPriceForNextMint()
        ).to.equal(ethers.utils.parseEther("1"));
      });

      it("Should return 0.037 ether if I have Lobsters and the current wave is the second wave", async function () {
        expect(
          await beachNFT137.connect(address3).getMyPriceForNextMint()
        ).to.equal(ethers.utils.parseEther("0.073"));
      });

      xit("Should return 0.073 ether if I have Lobsters and the current wave is the third wave", async function () {
        expect(
          await beachNFT317.connect(address3).getMyPriceForNextMint()
        ).to.equal(ethers.utils.parseEther("0.1"));
      });

      xit("Should return 0.1 ether if I have Lobsters and the current wave is the fourth wave", async function () {
        expect(
          await beachNFT713.connect(address3).getMyPriceForNextMint()
        ).to.equal(ethers.utils.parseEther("0.1337"));
      });
    });
  });

  describe("Mint", async function () {
    it("Should only mint passed a certain block time", async function () {
      // Price is 0 for address1 (current owner) because it has 1 Lobster.
      await expect(
        beachNFTMint.connect(address1).gimmeBeaches(1)
      ).to.be.revertedWith("BEACH: Mint block is not ready yet");
      await advanceBlocks(blocksUntilMintOpens);
      await beachNFTMint.connect(address1).gimmeBeaches(1);
      expect(
        await beachNFTMint.balanceOf(await address1.getAddress())
      ).to.equal(1);
    });
  });
});
