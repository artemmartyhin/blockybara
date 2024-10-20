// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;
import {FHE, euint128, inEuint128} from "@fhenixprotocol/contracts/FHE.sol";
import "@fhenixprotocol/contracts/access/Permissioned.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


error Unauthorized();
error LengthMismatch();
contract BlockybaraContainer is Ownable, Permissioned {
    using FHE for euint128;

    struct Blob {
        bytes32 entry;
        euint128 key;
        uint256 timestamp;
    }

    Blob[] public blobs;
    mapping(address => bool) public permissions;

    event PermissionChanged(address indexed user, bool permission);
    event WriteBlob(bytes32 entry, euint128 key);
    event RemoveBlob(bytes32 entry, euint128 key);


    modifier onlyAuthorized() {
        if (!permissions[msg.sender]) {
            revert Unauthorized();
        }
        _;
    }

    constructor(address owner) Ownable(owner) {}

    function write(bytes32[] memory entries, inEuint128[] memory keys) public onlyOwner{
        if(entries.length != keys.length){
            revert LengthMismatch();
        }
        for (uint256 i = 0; i < entries.length; i++) {
            blobs.push(Blob(entries[i], FHE.asEuint128(keys[i]), block.timestamp));
            emit WriteBlob(entries[i], FHE.asEuint128(keys[i]));
        }
    }

    function remove(uint256[] memory ids) public onlyOwner {
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            require(id < blobs.length, "Invalid ID");

            uint256 lastIndex = blobs.length - 1;
            if (id != lastIndex) {
                blobs[id] = blobs[lastIndex];
            }
            blobs.pop();
            emit RemoveBlob(blobs[id].entry, blobs[id].key);
        }
    }


    function fetch(uint256 id) public view returns (bytes32) {
        return blobs[id].entry;
    }

    function fetchAll() public view returns (bytes32[] memory) {
        bytes32[] memory result = new bytes32[](blobs.length);
        uint256 j = 0;
        for (uint256 i = 0; i < blobs.length; i++) {
            if (blobs[i].entry != 0) {
                result[j] = bytes32(blobs[i].entry);
                j++;
            }
        }
        return result;
    }

    function access(uint256 id, Permission memory perm) onlySender(perm) onlyAuthorized() public view returns (string memory) {
        return blobs[id].key.sealoutput(perm.publicKey);
    }

    function accessBatch(uint256[] memory ids, Permission memory perm) onlySender(perm) public view returns (string[] memory) {
        string[] memory result = new string[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = access(ids[i], perm);
        }
        return result;
    }

    function permit(address user, bool permission) public onlyOwner {
        permissions[user] = permission;
        emit PermissionChanged(user, permission);
    }

    function count() public view returns (uint256) {
        return blobs.length;
    }

}
