// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IERC20.sol";
import "./NexaServiceRegistry.sol";

/// @title NexaGateway
/// @notice Direct user-payments gateway - users call pay() so payer is tx.sender and visible in explorer.
/// No owner-gated receipt writes; result anchoring is optional.
contract NexaGateway {
    IERC20 public immutable usdt;
    address public immutable treasury; // where USDT goes (payTo)
    NexaServiceRegistry public immutable services;

    mapping(address => uint256) public nonce;
    mapping(bytes32 => bool) public paid;
    mapping(bytes32 => bool) public resultAnchored;

    error InactiveService();
    error ZeroPrice();
    error AssetMismatch();
    error AlreadyPaid();
    error PayFailed();
    error UnpaidPayment();
    error NotAnchorer();
    error AlreadyAnchored();

    event ServicePaid(
        bytes32 indexed paymentId,
        bytes32 indexed serviceId,
        address indexed payer,
        uint256 amount,
        bytes32 requestHash
    );
    event ResultAnchored(bytes32 indexed paymentId, bytes32 resultHash);

    address public immutable anchorer;

    constructor(address _usdt, address _treasury, address _services, address _anchorer) {
        require(_usdt != address(0), "usdt zero");
        require(_treasury != address(0), "treasury zero");
        require(_services != address(0), "services zero");
        require(_anchorer != address(0), "anchorer zero");
        usdt = IERC20(_usdt);
        treasury = _treasury;
        services = NexaServiceRegistry(_services);
        anchorer = _anchorer;
    }

    function pay(bytes32 serviceId, bytes32 requestHash) external returns (bytes32 paymentId) {
        NexaServiceRegistry.Service memory s = services.getService(serviceId);
        if (!s.active) revert InactiveService();
        if (s.price == 0) revert ZeroPrice();
        if (s.asset != address(usdt)) revert AssetMismatch();
        uint256 n = nonce[msg.sender]++;
        paymentId = keccak256(abi.encode(msg.sender, serviceId, requestHash, n));
        if (paid[paymentId]) revert AlreadyPaid();
        paid[paymentId] = true;
        bool ok = usdt.transferFrom(msg.sender, treasury, s.price);
        if (!ok) revert PayFailed();
        emit ServicePaid(paymentId, serviceId, msg.sender, s.price, requestHash);
    }

    function getPaymentId(address payer, bytes32 serviceId, bytes32 requestHash, uint256 n) external pure returns (bytes32) {
        return keccak256(abi.encode(payer, serviceId, requestHash, n));
    }

    modifier onlyAnchorer() {
        if (msg.sender != anchorer) revert NotAnchorer();
        _;
    }

    function anchorResult(bytes32 paymentId, bytes32 resultHash) external onlyAnchorer {
        if (!paid[paymentId]) revert UnpaidPayment();
        if (resultAnchored[paymentId]) revert AlreadyAnchored();
        resultAnchored[paymentId] = true;
        emit ResultAnchored(paymentId, resultHash);
    }
}
