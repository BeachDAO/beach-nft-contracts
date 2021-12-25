import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { BeachToken } from "../typechain";
import { BigNumber, Contract } from "ethers";

// import {Contract} from 'ethers';
// import {deployContract, MockProvider, solidity} from 'ethereum-waffle';
// import BasicToken from '../build/BasicToken.json';

let DollarBeach;
let dollarBeach: Contract;

function toWei(amount: number) {
  return BigNumber.from(amount).mul(BigNumber.from(10).pow(18));
}

describe("$BEACH ERC20", function () {
  // **** ERC20 ****
  //
  // [ ] Should have a MAX SUPPLY of 1,000,000
  // [ ] Should have a name of BEACH
  //
  // **** STAKING ****
  //
  // [ ] Should have a whitelist for tokens to stake
  // [ ] Whitelist should be updateable by owner (add, remove, clear)
  // [ ] Should have a staking rewards calculated based off of blocks elapsed
  // [ ] Should have a staking "reward rate" per whitelisted token (struct?)
  // [ ] Reward rate should be updateable
  // [ ] Claiming rewards should reset block
  //
  // **** CURRENCY ****
  //
  // [ ] Should be able to transfer
  // [ ] Should be pausable
  // [ ]

  beforeEach(async function () {
    DollarBeach = await ethers.getContractFactory("BeachToken");
    dollarBeach = await DollarBeach.deploy();
    await dollarBeach.deployed();
  });

  it("Should be an ERC20 token", async function () {
    expect(await dollarBeach.name()).to.equal("BeachToken");
    expect(await dollarBeach.symbol()).to.equal("BEACH");
  });

  it("Owner should have a balance of 1000000", async function () {
    const owner = await dollarBeach.owner();
    expect(await dollarBeach.balanceOf(owner)).to.equal(toWei(1_000_000));
  });

  it("Should have a total supply of 1000000", async function () {
    expect(await dollarBeach.totalSupply()).to.equal(toWei(1_000_000));
  });

  it("Should have 18 decimals", async function () {
    expect(await dollarBeach.decimals()).to.equal(18);
  });
});
