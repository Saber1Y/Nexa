// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title NexaServiceRegistry
/// @notice On-chain directory for machine-payable services.
contract NexaServiceRegistry {
    address public immutable owner;

    struct Service {
        address provider;
        address asset;
        uint256 price;
        bytes32 endpointHash;
        bool active;
    }

    mapping(bytes32 => Service) public services;

    error NotOwner();
    error InvalidService();

    event ServiceRegistered(bytes32 indexed serviceId, address indexed provider, address asset, uint256 price, bytes32 endpointHash);
    event ServiceUpdated(bytes32 indexed serviceId, address indexed provider, address asset, uint256 price, bytes32 endpointHash, bool active);
    event ServiceDeactivated(bytes32 indexed serviceId);

    constructor() {
        owner = msg.sender;
    }

    function registerService(bytes32 serviceId, address provider, address asset, uint256 price, bytes32 endpointHash) external {
        if (msg.sender != owner) revert NotOwner();
        if (serviceId == bytes32(0) || provider == address(0) || asset == address(0) || price == 0) revert InvalidService();
        services[serviceId] = Service(provider, asset, price, endpointHash, true);
        emit ServiceRegistered(serviceId, provider, asset, price, endpointHash);
    }

    function updateService(bytes32 serviceId, address provider, address asset, uint256 price, bytes32 endpointHash, bool active) external {
        if (msg.sender != owner) revert NotOwner();
        if (serviceId == bytes32(0) || provider == address(0) || asset == address(0) || price == 0) revert InvalidService();
        services[serviceId] = Service(provider, asset, price, endpointHash, active);
        emit ServiceUpdated(serviceId, provider, asset, price, endpointHash, active);
    }

    function deactivateService(bytes32 serviceId) external {
        if (msg.sender != owner) revert NotOwner();
        services[serviceId].active = false;
        emit ServiceDeactivated(serviceId);
    }

    function getService(bytes32 serviceId) external view returns (Service memory) {
        return services[serviceId];
    }
}
