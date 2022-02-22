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
contract SeafoodToken is ERC20, ERC20Burnable, IERC721Receiver, Pausable, Ownable {

  uint public MAX_SUPPLY = 5_000_000;
  uint public MAX_STAKING = 30;
  uint public DROP_RATE = 152_788_388_082_506 * 5; // (1/6545)*10e18*5

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
    address creed;
    string name;
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
  address[] _creedsAllowed;

  constructor() ERC20("B34CH Life Currency", "SEAFOOD") {
    _mint(address(this), MAX_SUPPLY * 10 ** decimals());
  }

  function pause() public onlyOwner {
    _pause();
  }

  function unpause() public onlyOwner {
    _unpause();
  }

  // Function aimed at governance to pay for grants or such
  // Only callable by multi-sig wallet owning the contract
  function spend(address to, uint256 amount) external onlyOwner {
    _transfer(address(this), to, amount);
  }

  // Function aimed at governance
  // Only callable by multi-sig wallet owning the contract
  function increaseTotalSupply(uint256 amount) external onlyOwner {
    uint256 additionalSupply = amount * 10 ** decimals();
    _mint(address(this), additionalSupply);
    MAX_SUPPLY = MAX_SUPPLY + additionalSupply;
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

  function _reserveNextStakingId() internal returns (uint) {
    return _stakingId++;
  }

  function stake(address creed_, uint tokenId_) public {
    uint[] memory myStakes_ = _getMyStakingInfo();

    require(_creedAllowList[creed_].allowed == true, "SEAFOOD: This token is not allowed yet");
    require(_getOwnerForCreedAndTokenId(creed_, tokenId_) == _msgSender(), "SEAFOOD: You do not own this token");
    require(myStakes_.length < MAX_STAKING, "SEAFOOD: You already have too many items staked");

    _transferTokenFromOwner(creed_, tokenId_, _msgSender());

    // Breaking init into multiple statements to optimize for gas
    Staking memory staking;
    staking.tokenId = tokenId_;
    staking.creed = creed_;
    staking.owner = _msgSender();
    staking.startingBlock = block.number;
    staking.claimedAmount = 0;

    uint stakingId = _reserveNextStakingId();

    _stakings[stakingId] = staking;
    // TokenId by creed
    _stakingByCreed[creed_][tokenId_] = stakingId;
    // Adding to sender IDs
    // TODO: Remove when unstaking
    _stakingsByOwner[_msgSender()].push(stakingId);
  }

  function stakeByIds(address[] calldata creeds_, uint[] calldata tokensIds_) public {
    require(tokensIds_.length == creeds_.length, "SEAFOOD: The amount of tokens and creeds are not equal");
    for (uint i = 0; i < tokensIds_.length; i++) {
      stake(creeds_[i], tokensIds_[i]);
    }
  }

  function _getMyStakingInfo() private view returns (uint[] memory) {
    return _stakingsByOwner[_msgSender()];
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

    balance += _balanceByOwner[_msgSender()].claimableAmount;

    return balance;
  }

  function claimAll(bool close) external {
    uint[] memory myStakingsIds = _getMyStakingInfo();

    _freezeBalance(_msgSender());
    uint balance = _balanceByOwner[_msgSender()].claimableAmount;

    require(balance > 0, "SEAFOOD: Nothing to claim");

    for (uint i = 0; i < myStakingsIds.length; i++) {
      uint stakingId_ = myStakingsIds[i];
      _markAsClaimed(stakingId_, close);
    }

    _transfer(address(this), _msgSender(), balance);

    emit ClaimedBalance(_msgSender(), balance);
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

  function unstakeByCreedByTokenId(address creed, uint tokenId) external {
    address holder_ = _getOwnerForCreedAndTokenId(creed, tokenId);
    require(holder_ == _msgSender(), "SEAFOOD: You do not own this token");
    uint stakingId_ = _stakingByCreed[creed][tokenId];
    _unstakeByStakingId(stakingId_);
  }

  function unstakeAll() external {
    uint[] memory myStakings_ = _getMyStakingInfo();

    for (uint i = 0; i < myStakings_.length; i++) {
      _unstakeByStakingId(myStakings_[i]);
    }
  }

  function _unstakeByStakingId(uint stakingId) private {
    Staking memory staking_ = _stakings[stakingId];
    require(staking_.owner == _msgSender(), "SEAFOOD: You do not own this token");

    // Claim existing funds onto your wallet balance, ready to be transferred
    _freezeBalanceByStakingId(staking_.owner, stakingId);
    _markAsClaimed(stakingId, true);

    _transferTokenBackToOwner(staking_.creed, staking_.owner, staking_.tokenId);
  }

  function _transferTokenBackToOwner(address creed_, address owner_, uint tokenId_) private {
    IERC721(creed_).safeTransferFrom(address(this), owner_, tokenId_);
  }

  function _transferTokenFromOwner(address creed_, uint tokenId_, address owner_) private {
    IERC721(creed_).safeTransferFrom(owner_, address(this), tokenId_);
  }

  function returnTokensToOwners(uint[] calldata stakingIds_) external onlyOwner {
    for (uint i = 0; i < stakingIds_.length; i++) {
      address creed_ = _stakings[stakingIds_[i]].creed;
      uint tokenId_ = _stakings[stakingIds_[i]].tokenId;
      address owner_ = _getOwnerForCreedAndTokenId(creed_, tokenId_);

      _transferTokenBackToOwner(creed_, owner_, tokenId_);
    }
  }

  function isCreedAllowed(address creed_) public view onlyOwner returns (address, string memory, uint, bool) {
    return (_creedAllowList[creed_].creed, _creedAllowList[creed_].name, _creedAllowList[creed_].rate, _creedAllowList[creed_].allowed);
  }

  function getAllCreeds() public view onlyOwner returns (Creed[] memory) {
    Creed[] memory allCreeds = new Creed[](_creedsAllowed.length);

    for (uint i = 0; i < _creedsAllowed.length; i++) {
      Creed memory creed = Creed({creed : _creedAllowList[_creedsAllowed[i]].creed, name : _creedAllowList[_creedsAllowed[i]].name, rate : _creedAllowList[_creedsAllowed[i]].rate, allowed : _creedAllowList[_creedsAllowed[i]].allowed});
      allCreeds[i] = creed;
    }
    return allCreeds;
  }

  function clearCreedAllowList() external onlyOwner {
    for (uint i = 0; i < _creedsAllowed.length; i++) {
      delete _creedAllowList[_creedsAllowed[i]];
    }
    _creedsAllowed = new address[](0);
  }

  function modifyCreedAllowList(address creed_, string calldata name_, uint rate_, bool allowed_) external onlyOwner {
    _modifyCreedAllowList(creed_, name_, rate_, allowed_);
  }

  function _modifyCreedAllowList(address creed_, string memory name_, uint rate_, bool allowed_) private {
    require(keccak256(abi.encodePacked(name_)) != keccak256(""), "SEAFOOD: Creed name must not be empty");
    if (keccak256(abi.encodePacked(_creedAllowList[creed_].name)) == keccak256("")) {
      _creedsAllowed.push(creed_);
    }

    _creedAllowList[creed_] = Creed(creed_, name_, rate_, allowed_);

    emit CreedAllowListUpdated(creed_, name_, rate_, allowed_);
  }

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external override returns (bytes4) {
    require(_creedAllowList[_msgSender()].allowed == true, "SEAFOOD: This token is not allowed yet");
    return _onERC721ReceivedSelector;
  }
}
