// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Consecutive.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC5192.sol";

contract SimonAndYaMin is ERC721Consecutive, Ownable, IERC5192 {
    mapping(uint256 => bool) private _locked;
    uint96 constant MAX_TOKEN_COUNT = 12;

    constructor(address ownerAddress) ERC721("SimonAndYaMin", "SY") {
        _mintConsecutive(ownerAddress, MAX_TOKEN_COUNT);
        if (ownerAddress != owner()) {
            transferOwnership(ownerAddress);
        }
    }

    function _baseURI() internal pure override returns (string memory) {
        return
            "https://raw.githubusercontent.com/diaozheng999/nft/master/assets/tokens/";
    }

    function baseTokenURI() public pure returns (string memory) {
        return _baseURI();
    }

    function lock(uint256 tokenId) external onlyOwner {
        _lock(tokenId);
    }

    function _lock(uint256 tokenId) private {
        if (!_locked[tokenId]) {
            _locked[tokenId] = true;
            emit Locked(tokenId);
        }
    }

    function unlock(uint256 tokenId) external onlyOwner {
        if (_locked[tokenId]) {
            _locked[tokenId] = false;
            emit Unlocked(tokenId);
        }
    }

    function locked(uint256 tokenId) external view returns (bool) {
        return _locked[tokenId];
    }

    function batchTransfer(address[] calldata tokenAddresses) public onlyOwner {
        require(
            tokenAddresses.length <= MAX_TOKEN_COUNT,
            "Cannot transfer to more than MAX_TOKEN_COUNT addresses."
        );
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            _safeTransfer(ownerOf(i), tokenAddresses[i], i, "");
            _lock(i);
        }
    }

    function isApprovedForAll(
        address owner,
        address operator
    ) public view override returns (bool) {
        if (operator == this.owner()) {
            return true;
        }
        return super.isApprovedForAll(owner, operator);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override {
        if (from == address(0)) {
            uint256 lastTokenId = firstTokenId + batchSize;
            for (
                uint256 tokenId = firstTokenId;
                tokenId < lastTokenId;
                tokenId++
            ) {
                _locked[tokenId] = false;
            }
        } else if (to != address(0)) {
            uint256 lastTokenId = firstTokenId + batchSize;
            for (
                uint256 tokenId = firstTokenId;
                tokenId < lastTokenId;
                tokenId++
            ) {
                require(!this.locked(tokenId), "Token is locked");
            }
        }
    }
}
