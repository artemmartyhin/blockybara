// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;

import "./BlockybaraContainer.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@fhenixprotocol/contracts/access/Permissioned.sol";

contract BlockybaraHub is Ownable, Permissioned {
    mapping(address => address) public users;
    address[] public containers;

    function create2() public {
        address container = address(new BlockybaraContainer(msg.sender));
        containers.push(container);
        users[msg.sender] = container;
        emit Create(containers.length - 1, msg.sender);
    }

    event Create(uint256 indexed id, address owner);

    constructor(address owner) Ownable(owner) {}
}
