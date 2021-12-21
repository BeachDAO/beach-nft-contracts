// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import "@openzeppelin/contracts/utils/Strings.sol";

/// @custom:security-contact nemb@hey.com
contract BeachToken is ERC20, ERC20Burnable, IERC721Receiver, Pausable, Ownable {

  uint public MAX_SUPPLY = 1_000_000;
  uint public MAX_STAKING = 30;
  uint public DROP_RATE = 152_788_388_082_506; // (1/6545)*10e18

  event CreedAllowListUpdated(address creed, string name, uint rate, bool allowed);
  event ClaimedBalance(address holder, uint amount);

  struct Staking {
    uint tokenId;
    uint startingBlock;
    uint endingBlock;
    uint claimedAmount;
    address creed;
    address owner;
  }

  struct Balance {
    uint claimableAmount;
    uint claimedAmount;
    uint lastActivity;
  }

  struct Creed {
    string name;
    address creed;
    uint rate;
    bool allowed;
  }

  bytes4 internal _onERC721ReceivedSelector = bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));

  mapping(uint => Staking) private _stakings;
  uint private _stakingId = 0;

  // By Creed contract Address by Creed TokenID
  mapping(address => mapping(uint => uint)) private _stakingByCreed;
  // By Owner Address by Staking ID
  mapping(address => uint[]) private _stakingsByOwner;

  // Balance by owner
  mapping(address => Balance) private _balanceByOwner;

  // Creeds
  mapping(address => Creed) private _creedAllowList;

  constructor() ERC20("B34CH Life Currency", "$BEACH") {
    _mint(msg.sender, MAX_SUPPLY * 10 ** decimals());
    _modifyCreedAllowList(address(this), name(), DROP_RATE, true);
  }

  function pause() public onlyOwner {
    _pause();
  }

  function unpause() public onlyOwner {
    _unpause();
  }

  function _beforeTokenTransfer(address from, address to, uint256 amount)
  internal
  whenNotPaused
  override
  {
    super._beforeTokenTransfer(from, to, amount);
  }

  /**
   * **** STAKING ****
   */

  function _reserveNextStakingId() private returns (uint) {
    uint stakingId_ = _stakingId;
    _stakingId += 1;
    return stakingId_;
  }

  function stake(uint tokenId_, address creed_) public {
    uint[] memory myStakes_ = _getMyStakingInfo();

    require(_creedAllowList[creed_].allowed == true, "$BEACH: This token is not allowed yet");
    require(IERC721(creed_).ownerOf(tokenId_) == msg.sender, "$BEACH: You do not own this token");
    require(myStakes_.length < MAX_STAKING, "$BEACH: You already have too many items staked");

    _transferTokenFromOwner(creed_, tokenId_, msg.sender);

    // Breaking init into multiple statements to optimize for gas
    Staking memory staking;
    staking.tokenId = tokenId_;
    staking.creed = creed_;
    staking.owner = msg.sender;
    staking.startingBlock = block.number;
    staking.claimedAmount = 0;

    uint stakingId = _reserveNextStakingId();

    _stakings[stakingId] = staking;
    // TokenId by creed
    _stakingByCreed[creed_][tokenId_] = stakingId;
    // Adding to sender IDs
    _stakingsByOwner[msg.sender].push(stakingId);
  }

  function stakeByIds(uint[] calldata tokensIds_, address[] calldata creeds_) public {
    require(tokensIds_.length == creeds_.length, "$BEACH: The amount of tokens and creeds are not equal");
    for (uint i = 0; i < tokensIds_.length; i++) {
      stake(tokensIds_[i], creeds_[i]);
    }
  }

  function _getMyStakingInfo() private view returns (uint[] memory) {
    return _stakingsByOwner[msg.sender];
  }

  function _getBalanceForStakingId(uint stakingId_) private view returns (uint) {
    Staking memory _staking = _stakings[stakingId_];
    address creed_ = _staking.creed;
    uint dropRate_ = _creedAllowList[creed_].rate;

    uint lastStakingBlock = _staking.endingBlock > 0 ? _staking.endingBlock : block.number;
    uint blocksSinceStaking = lastStakingBlock - _staking.startingBlock;
    uint balance = blocksSinceStaking * dropRate_ - _staking.claimedAmount;
    return balance;
  }

  function getMyStakingIds() public view returns (uint[] memory) {
    return _getMyStakingInfo();
  }

  function getMyStakingBalance() public view returns (uint) {
    uint[] memory stakingIds = _getMyStakingInfo();
    uint balance = 0;

    for (uint i = 0; i < stakingIds.length; i++) {
      balance += _getBalanceForStakingId(stakingIds[i]);
    }

    balance += _balanceByOwner[msg.sender].claimableAmount;

    return balance;
  }

  function claimAll(bool close) public {
    uint[] memory myStakingsIds = _getMyStakingInfo();

    _freezeBalance(msg.sender);
    uint balance = _balanceByOwner[msg.sender].claimableAmount;

    require(balance > 0, "$BEACH: Nothing to claim");

    for (uint i = 0; i < myStakingsIds.length; i++) {
      uint stakingId_ = myStakingsIds[i];
      //      address creed_ = _stakings[stakingId_].creed;
      //      uint tokenId_ = _stakings[stakingId_].tokenId;
      //      address holder_ = _getOwnerForCreedAndTokenId(creed_, tokenId_);

      _markAsClaimed(stakingId_, close);
    }

    // TODO: Ensure that balance and amount are in the same precision (10e18)
    _transfer(address(this), msg.sender, balance);

    emit ClaimedBalance(msg.sender, balance);
  }

  function _freezeBalanceByStakingId(address holder_, uint stakingId_) private {
    uint _balance = _getBalanceForStakingId(stakingId_);
    _balanceByOwner[holder_].claimableAmount += _balance;
    _stakings[stakingId_].claimedAmount += _balance;
  }

  function _freezeBalance(address holder_) private {
    uint[] memory _stakingIds = _stakingsByOwner[holder_];
    for (uint i = 0; i < _stakingIds.length; i++) {
      _freezeBalanceByStakingId(holder_, _stakingIds[i]);
    }
  }

  function _markAsClaimed(uint stakingId, bool close) private {
    // Marking this Staking as fully reimbursed
    address _holder = _getOwnerForCreedAndTokenId(_stakings[stakingId].creed, _stakings[stakingId].tokenId);

    // TODO: Verify the logic here
    _balanceByOwner[_holder].claimedAmount += _balanceByOwner[_holder].claimableAmount;
    _balanceByOwner[_holder].claimableAmount = 0;

    if (close) {
      _stakings[stakingId].endingBlock = block.number;
    }
  }

  function _getOwnerForCreedAndTokenId(address creed, uint tokenId) private view returns (address) {
    address currentHolder = IERC721(creed).ownerOf(tokenId);
    if (currentHolder == address(this)) {
      uint stakingId = _stakingByCreed[creed][tokenId];
      return _stakings[stakingId].owner;
    }
    return currentHolder;
  }

  function unstakeByCreedByTokenId(address creed, uint tokenId) public {
    address holder_ = _getOwnerForCreedAndTokenId(creed, tokenId);
    require(holder_ == msg.sender, "$BEACH: You do not own this token");
    uint stakingId_ = _stakingByCreed[creed][tokenId];
    _unstakeByStakingId(stakingId_);
  }

  function unstakeAll() public {
    uint[] memory myStakings_ = _getMyStakingInfo();

    for (uint i = 0; i < myStakings_.length; i++) {
      _unstakeByStakingId(myStakings_[i]);
    }
  }

  function _unstakeByStakingId(uint stakingId) private {
    Staking memory staking_ = _stakings[stakingId];
    require(staking_.owner == msg.sender, "$BEACH: You do not own this token");

    // Claim existing funds onto your wallet balance, ready to be transferred
    _freezeBalanceByStakingId(staking_.owner, stakingId);
    _markAsClaimed(stakingId, true);

    _transferTokenBackToOwner(staking_.creed, staking_.tokenId, staking_.owner);
  }

  function _transferTokenBackToOwner(address creed_, uint tokenId_, address owner_) private {
    IERC721(creed_).safeTransferFrom(address(this), owner_, tokenId_);
  }

  function _transferTokenFromOwner(address creed_, uint tokenId_, address owner_) private {
    IERC721(creed_).safeTransferFrom(owner_, address(this), tokenId_);
  }

  function returnTokensToOwners(uint[] calldata stakingIds_) public onlyOwner {
    for (uint i = 0; i < stakingIds_.length; i++) {
      address creed_ = _stakings[stakingIds_[i]].creed;
      uint tokenId_ = _stakings[stakingIds_[i]].tokenId;
      address owner_ = _getOwnerForCreedAndTokenId(creed_, tokenId_);

      _transferTokenBackToOwner(creed_, tokenId_, owner_);
    }
  }

  function modifyCreedAllowList(address creed_, string calldata name_, uint rate_, bool allowed_) public onlyOwner {
    _modifyCreedAllowList(creed_, name_, rate_, allowed_);
  }

  function _modifyCreedAllowList(address creed_, string memory name_, uint rate_, bool allowed_) private {
    Creed memory creedStruct_;
    creedStruct_.creed = creed_;
    creedStruct_.allowed = allowed_;
    creedStruct_.name = name_;
    creedStruct_.rate = rate_;
    _creedAllowList[creed_] = creedStruct_;

    emit CreedAllowListUpdated(creed_, name_, rate_, allowed_);
  }

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external override returns (bytes4) {
    require(_creedAllowList[msg.sender].allowed == true, "$BEACH: This token is not allowed yet");
    return _onERC721ReceivedSelector;
  }
}
