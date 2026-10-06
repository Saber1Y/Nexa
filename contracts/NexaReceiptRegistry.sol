// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title NexaReceiptRegistry
/// @notice Small, append-only proof registry for paid service results.
contract NexaReceiptRegistry {
    address public immutable owner;
    mapping(bytes32 => bool) public recorded;

    error NotOwner();
    error AlreadyRecorded();
    error ZeroPaymentId();

    event PaymentReceiptRecorded(
        bytes32 indexed paymentId,
        bytes32 indexed serviceId,
        address indexed payer,
        address provider,
        address asset,
        uint256 amount,
        bytes32 resultHash
    );

    constructor() {
        owner = msg.sender;
    }

    function recordReceipt(
        bytes32 paymentId,
        bytes32 serviceId,
        address payer,
        address provider,
        address asset,
        uint256 amount,
        bytes32 resultHash
    ) external {
        if (msg.sender != owner) revert NotOwner();
        if (paymentId == bytes32(0)) revert ZeroPaymentId();
        if (recorded[paymentId]) revert AlreadyRecorded();
        recorded[paymentId] = true;
        emit PaymentReceiptRecorded(paymentId, serviceId, payer, provider, asset, amount, resultHash);
    }
}
