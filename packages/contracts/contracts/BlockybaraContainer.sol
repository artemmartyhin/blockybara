// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;
import "@fhenixprotocol/contracts/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BlockybaraContainer is Ownable {
    using FHE for euint64;
    mapping(uint256 => bytes) private blobs;
    uint256 private counter;

    mapping(address => bool) public permissions;

    constructor(address owner) Ownable(owner) {
        permissions[owner] = true;
    }

    function write(uint256[] memory id, bytes[] memory data) public {
        require(permissions[msg.sender], "permission denied");
        require(id.length == data.length, "id and data length mismatch");
        for (uint256 i = 0; i < id.length; i++) {
            blobs[id[i]] = data[i];
        }
        counter += id.length;
    }

    function remove(uint256[] memory id) public onlyOwner {
        for (uint256 i = 0; i < id.length; i++) {
            delete blobs[id[i]];
        }
        counter -= id.length;
    }

    function fetch(uint256 id) public view returns (bytes memory) {
        return blobs[id];
    }

    function fetchAll() public view returns (bytes[] memory) {
        bytes[] memory result = new bytes[](counter);
        uint256 j = 0;
        for (uint256 i = 0; i < counter; i++) {
            if (blobs[i].length > 0) {
                result[j] = blobs[i];
                j++;
            }
        }
        return result;
    }
}
