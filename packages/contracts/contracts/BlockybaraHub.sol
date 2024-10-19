// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;

import "@fhenixprotocol/contracts/FHE.sol";
import "./BlockybaraContainer.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@fhenixprotocol/contracts/access/Permissioned.sol";

contract BlockybaraHub is Ownable, Permissioned {
    using FHE for euint64;
    using FHE for address;

    enum Privacy {
        PRIVATE,
        PROTECTED,
        SHARED
    }

    struct User {
        Privacy privacy;
        uint256[] containers;
    }

    struct Container {
        eaddress endpiont;
        bytes manifest;
        bytes endpoint;
        address owner;
    }

    struct Blob {
        bytes data;
        inEuint64 key;
    }

    mapping(address => User) private users;
    mapping(bytes => euint64) private keys;
    Container[] private containers;

    function create2(Blob memory manifest, Blob memory endpoint) public {
        require(keys[manifest.data].isInitialized(), "manifest key already exists");
        require(keys[endpoint.data].isInitialized(), "endpoint key already exists");
        eaddress container = address(new BlockybaraContainer(msg.sender)).asEaddress();
        containers.push(Container(container, manifest.data, endpoint.data, msg.sender));
        keys[manifest.data] = FHE.asEuint64(manifest.key);
        keys[endpoint.data] = FHE.asEuint64(endpoint.key);
        users[msg.sender].containers.push(containers.length - 1);
        emit Create(containers.length - 1, msg.sender);
    }

    function fetch(uint256 id, Permission memory permission) public view returns (string memory) {
        return FHE.sealoutput(containers[id].endpiont, permission.publicKey);
    }

    function fetchAll(Permission memory permission) public view returns (string[] memory) {
        string[] memory result = new string[](containers.length);
        for (uint256 i = 0; i < containers.length; i++) {
            result[i] = FHE.sealoutput(containers[i].endpiont, permission.publicKey);
        }
        return result;
    }

    function fetchKeys(uint256 id, Permission memory permission) public view returns (string memory, string memory) {
        return (
            FHE.sealoutput(keys[containers[id].manifest], permission.publicKey),
            FHE.sealoutput(keys[containers[id].endpoint], permission.publicKey)
        );
    }

    function fetchManifest(uint256 id) public view returns (bytes memory) {
        return containers[id].manifest;
    }

    event Create(uint256 indexed id, address owner);

    constructor(address owner) Ownable(owner) {}
}
