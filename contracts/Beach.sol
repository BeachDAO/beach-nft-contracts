// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract Beach is ERC721, Ownable {
  uint256 private _tokenIdCounter = 0;
  uint16 public MAX_SUPPLY = 1337;

  bool private _revealed = false;
  string private _baseURIPath = "https://lobby.mypinata.cloud/ipfs/";
  string private _revealedPath = "nope";

  address private lobster;
  address private beach; // TODO

  uint mintBlock;

  mapping(uint256 => string) _beachNames; // TODO
  mapping(string => bool) _existingNames; // TODO

  mapping(address => uint8) private shares;
  mapping(address => uint256) private released;
  mapping(address => uint256) private balances;
  address[] _payees;
  uint256 private totalShares;
  uint256 private amountReleased;

  event PayeeAdded(address account, uint8 shares_);
  event PaymentReleased(address account, uint256 amount);
  event NFTMinted(uint256 tokenId, address mintedBy);
  event Revealed();
  event PathUpdated(string path_);

  constructor(address _lobster, address[] memory accounts_, uint8[] memory shares_, uint blocksBeforeTheMint) ERC721("Beach", "BEACH") {
    lobster = _lobster;

    for (uint8 i = 0; i < accounts_.length; i++) {
      _addPayee(accounts_[i], shares_[i]);
    }
    mintBlock = block.number + blocksBeforeTheMint;
  }

  function _baseURI() internal view override returns (string memory) {
    return _baseURIPath;
  }

  function tokenURI(uint256 tokenId)
  public
  view
  override(ERC721)
  returns (string memory)
  {
    if (_revealed == false) {
      return _baseURI();
    } else {
      return string(abi.encodePacked(_baseURI(), _revealedPath, "/", Strings.toString(tokenId)));
    }
  }
  modifier mintOpened() {
    require(block.number > mintBlock, "BEACH: Mint block is not ready yet");
    _;
  }

  function gimmeBeaches(uint8 count) external payable mintOpened {
    require(count <= 5, "GetABeach: You can get MAX 5 beaches at once.");
    require(balanceOf(msg.sender) < 10, "GetABeach: Too many beaches in the wallet.");
    require(msg.value == getMyPriceForNextMint(), "GetABeach: The minting amount is incorrect");

    // Split amount received
    _split(msg.value);

    for (uint8 i = 0; i < count; i++) {
      _mintABeach(msg.sender);
    }
  }

  function safeMint(address to) public onlyOwner {
    require(_tokenIdCounter < MAX_SUPPLY, "BEACH: mint reached max supply");
    _safeMint(to, _tokenIdCounter);
  unchecked {
    _tokenIdCounter += 1;
  }
  }

  function _mintABeach(address to) private returns (bool){
    require(_tokenIdCounter < MAX_SUPPLY, "BEACH: mint reached max supply");
    _safeMint(to, _tokenIdCounter);
  unchecked {
    _tokenIdCounter += 1;
  }
    return true;
  }

  // The following functions are overrides required by Solidity.

  function _burn(uint256 tokenId) internal override(ERC721) {}

  function _beforeTokenTransfer(address from, address to, uint256 tokenId)
  internal
  override(ERC721)
  {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function supportsInterface(bytes4 interfaceId)
  public
  view
  override(ERC721)
  returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  // Beach-specific functions

  /***************************
   *      Reveal / Mint      *
   ***************************/

  function revealState() public view returns (bool) {
    return _revealed;
  }

  function reveal(string memory path_) public onlyOwner {
    require(_revealed == false, "BEACH: _revealed already set");
    _revealed = true;
    _updatePath(path_);
    emit Revealed();
  }

  function _updateBaseURI(string memory uri_) private {
    _baseURIPath = uri_;
  }

  // Function intended to be triggered by the DAO in case the Gateway or Network has an issue
  function updateBaseURI(string memory uri_) public {
    _updateBaseURI(uri_);
  }

  // Function intended to be triggered by the DAO at reveal time or in case the Gateway has an issue
  function _updatePath(string memory path_) private {
    _revealedPath = path_;
    emit PathUpdated(_revealedPath);
  }

  function updatePath(string memory path_) public onlyOwner {
    _updatePath(path_);
  }

  function currentTokenId() public view returns (uint) {
    return _tokenIdCounter;
  }

  function resolveLobster(address target) public view returns (uint) {
    return IERC721(lobster).balanceOf(target);
  }

  function getMyPriceForNextMint() public view returns (uint) {
    uint lobsterBalance = resolveLobster(msg.sender);

    if (_tokenIdCounter < 137) {
      if (lobsterBalance >= 1) {
        return 0 ether;
      }
      return 1 ether;
    } else if (_tokenIdCounter >= 137 && _tokenIdCounter < 317) {
      if (lobsterBalance >= 2) {
        return 0.037 ether;
      }
      return 0.073 ether;
    } else if (_tokenIdCounter >= 317 && _tokenIdCounter < 713) {
      if (lobsterBalance >= 1) {
        return 0.073 ether;
      }
      return 0.1 ether;
    } else if (_tokenIdCounter >= 713) {
      if (lobsterBalance >= 1) {
        return 0.1 ether;
      }
      return 0.1337 ether;
    } else {
      return 1 ether;
    }
  }

  /**************************
   *    Payment Splitter    *
   **************************/

  function _addPayee(address account, uint8 shares_) private {
    require(account != address(0), "PaymentSplitter: Address can't be 0");
    require(shares_ > 0, "PaymentSplitter: Shares can't be 0");
    require(shares[account] == 0, "PaymentSplitter: Account already has shares");
    require(released[account] == 0, "PaymentSplitter: Released is non-0 for this account");
    require(balances[account] == 0, "PaymentSplitter: Balances is non-0 for this account");
    require(_payees.length < 256, "PaymentSplitter: There are too many shareholders");

    _payees.push(account);
    shares[account] = shares_;
    released[account] = 0;
    balances[account] = 0;
    totalShares += shares_;

    emit PayeeAdded(account, shares_);
  }

  function _split(uint amount) private {
    for (uint8 i = 0; i < _payees.length; i++) {
      uint256 amountSplit = amount * shares[_payees[i]] / totalShares;
      balances[_payees[i]] = amountSplit;
    }
  }

  function release(address payable account) public onlyAccountOrOwner {
    require(balances[account] > 0, "PaymentSplitter: Account has no balance");

    // Non-re-entrant pre-tx
    uint256 amountToSend = balances[account];
    balances[account] = 0;

    Address.sendValue(account, amountToSend);

    // Post-tx book-keeping
    released[account] = released[account] + amountToSend;
    amountReleased = amountReleased + amountToSend;

    emit PaymentReleased(account, amountToSend);
  }

  function accountBalance(address account) public view onlyAccountOrOwner returns (uint256) {
    return balances[account];
  }

  function totalReceived() public view returns (uint256){
    return address(this).balance + amountReleased;
  }

  function balance() public view onlyOwner returns (uint256) {
    return address(this).balance;
  }

  modifier onlyAccountOrOwner() {
    require(owner() == _msgSender() || shares[_msgSender()] > 0 || balances[_msgSender()] > 0, "Caller is not the owner or a valid account");
    _;
  }
}
