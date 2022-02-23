// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// From https://etherscan.io/address/0xbad6186e92002e312078b5a1dafd5ddf63d3f731#code
library BeachLibrary {
  string internal constant TABLE =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  function encode(bytes memory data) internal pure returns (string memory) {
    if (data.length == 0) return "";

    // load the table into memory
    string memory table = TABLE;

    // multiply by 4/3 rounded up
    uint256 encodedLen = 4 * ((data.length + 2) / 3);

    // add some extra buffer at the end required for the writing
    string memory result = new string(encodedLen + 32);

    assembly {
    // set the actual output length
      mstore(result, encodedLen)

    // prepare the lookup table
      let tablePtr := add(table, 1)

    // input ptr
      let dataPtr := data
      let endPtr := add(dataPtr, mload(data))

    // result ptr, jump over length
      let resultPtr := add(result, 32)

    // run over the input, 3 bytes at a time
      for {

      } lt(dataPtr, endPtr) {

      } {
        dataPtr := add(dataPtr, 3)

      // read 3 bytes
        let input := mload(dataPtr)

      // write 4 characters
        mstore(
        resultPtr,
        shl(248, mload(add(tablePtr, and(shr(18, input), 0x3F))))
        )
        resultPtr := add(resultPtr, 1)
        mstore(
        resultPtr,
        shl(248, mload(add(tablePtr, and(shr(12, input), 0x3F))))
        )
        resultPtr := add(resultPtr, 1)
        mstore(
        resultPtr,
        shl(248, mload(add(tablePtr, and(shr(6, input), 0x3F))))
        )
        resultPtr := add(resultPtr, 1)
        mstore(
        resultPtr,
        shl(248, mload(add(tablePtr, and(input, 0x3F))))
        )
        resultPtr := add(resultPtr, 1)
      }

    // padding with '='
      switch mod(mload(data), 3)
      case 1 {
        mstore(sub(resultPtr, 2), shl(240, 0x3d3d))
      }
      case 2 {
        mstore(sub(resultPtr, 1), shl(248, 0x3d))
      }
    }

    return result;
  }

  /**
   * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
  function toString(uint256 value) internal pure returns (string memory) {
    // Inspired by OraclizeAPI's implementation - MIT licence
    // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

    if (value == 0) {
      return "0";
    }
    uint256 temp = value;
    uint256 digits;
    while (temp != 0) {
      digits++;
      temp /= 10;
    }
    bytes memory buffer = new bytes(digits);
    while (value != 0) {
      digits -= 1;
      buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
      value /= 10;
    }
    return string(buffer);
  }


  function isContract(address account) internal view returns (bool) {
    // This method relies on extcodesize, which returns 0 for contracts in
    // construction, since the code is only stored at the end of the
    // constructor execution.

    uint256 size;
    assembly {
      size := extcodesize(account)
    }
    return size > 0;
  }

  function validateName(string memory str) public pure returns (bool){
    bytes memory b = bytes(str);
    if (b.length < 1) return false;
    if (b.length > 25) return false;
    // Cannot be longer than 25 characters
    if (b[0] == 0x20) return false;
    // Leading space
    if (b[b.length - 1] == 0x20) return false;
    // Trailing space

    bytes1 lastChar = b[0];

    for (uint i; i < b.length; i++) {
      bytes1 char = b[i];

      if (char == 0x20 && lastChar == 0x20) return false;
      // Cannot contain continuous spaces

      if (
        !(char >= 0x30 && char <= 0x39) && //9-0
      !(char >= 0x41 && char <= 0x5A) && //A-Z
      !(char >= 0x61 && char <= 0x7A) && //a-z
      !(char == 0x20) //space
      )
        return false;

      lastChar = char;
    }

    return true;
  }

  /**
  * @dev Converts the string to lowercase
	 */
  function toLower(string memory str) internal pure returns (string memory){
    bytes memory bStr = bytes(str);
    bytes memory bLower = new bytes(bStr.length);
    for (uint i = 0; i < bStr.length; i++) {
      // Uppercase character
      if ((uint8(bStr[i]) >= 65) && (uint8(bStr[i]) <= 90)) {
        bLower[i] = bytes1(uint8(bStr[i]) + 32);
      } else {
        bLower[i] = bStr[i];
      }
    }
    return string(bLower);
  }

  /**
 * @dev Hash to metadata function
   */
  function hashToMetadata(uint tokenId_, string[] memory TRAITS_, string[] memory DICT_, mapping(uint256 => uint16[8]) storage beachMetadata_)
  public
  view
  returns (string memory)
  {
    string memory metadataString;

    for (uint8 i = 0; i < beachMetadata_[tokenId_].length; i++) {
      metadataString = string(
        abi.encodePacked(
          metadataString,
          '{"trait_type":"',
          TRAITS_[i],
          '","value":"',
          DICT_[beachMetadata_[tokenId_][i]],
          '"}'
        )
      );

      if (i < beachMetadata_[tokenId_].length - 1)
        metadataString = string(abi.encodePacked(metadataString, ","));
    }

    return string(abi.encodePacked("[", metadataString, "]"));
  }

  // tokenId_,
  // beachName(tokenId_),
  // _revealed,
  // _baseURIPath,
  // getRevealedPath(tokenId_),
  // _placeholderURI,
  // _TRAITS,
  // _DICT,
  // _beachMetadata
  function buildTokenURI(
    uint tokenId_,
    string memory beachName_,
    bytes memory smallImagePath_,
    bytes memory bigImagePath_,
    string memory attributes_
  ) public view returns (string memory) {
    return
    string(
      abi.encodePacked(
        "data:application/json;base64,",
        encode(
          bytes(
            string(
              abi.encodePacked(
                abi.encodePacked('{"name": "', beachName_, '",'),
                '"description": "BEACH", ',
                '"token_id": ', toString(tokenId_), ', ',
                '"art_number": ', toString(tokenId_ + 1), ', ',
                smallImagePath_,
                bigImagePath_,
                '"attributes":',
                attributes_,
                "}"
              )
            )
          )
        )
      )
    );
  }
}
