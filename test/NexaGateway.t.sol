// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/NexaGateway.sol";
import "../contracts/NexaServiceRegistry.sol";
import "../contracts/interfaces/IERC20.sol";

contract MockUSDT is IERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "allowance");
        require(balanceOf[from] >= amount, "balance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract NexaGatewayTest is Test {
    MockUSDT private token;
    NexaServiceRegistry private registry;
    NexaGateway private gateway;

    address private constant TREASURY = address(0x1111);
    address private constant ANCHORER = address(0x2222);
    address private constant PAYER = address(0x3333);
    bytes32 private serviceId = keccak256("resume-intelligence-v1");

    function setUp() public {
        token = new MockUSDT();
        registry = new NexaServiceRegistry();
        gateway = new NexaGateway(address(token), TREASURY, address(registry), ANCHORER);
        registry.registerService(serviceId, address(0x4444), address(token), 100_000, keccak256("/api/audit"));
        token.mint(PAYER, 1_000_000);
        vm.prank(PAYER);
        token.approve(address(gateway), type(uint256).max);
    }

    function testPayTransfersExactRegisteredPriceAndEmitsPayer() public {
        bytes32 requestHash = keccak256("private-input-digest");
        bytes32 paymentId = gateway.getPaymentId(PAYER, serviceId, requestHash, 0);
        vm.expectEmit(true, true, true, true, address(gateway));
        emit NexaGateway.ServicePaid(paymentId, serviceId, PAYER, 100_000, requestHash);

        vm.prank(PAYER);
        bytes32 returnedId = gateway.pay(serviceId, requestHash);

        assertEq(returnedId, paymentId);
        assertTrue(gateway.paid(paymentId));
        assertEq(token.balanceOf(TREASURY), 100_000);
        assertEq(token.balanceOf(PAYER), 900_000);
    }

    function testSameRequestCreatesNewPaymentIdAndChargesAgain() public {
        bytes32 requestHash = keccak256("same-request");
        vm.startPrank(PAYER);
        bytes32 first = gateway.pay(serviceId, requestHash);
        bytes32 second = gateway.pay(serviceId, requestHash);
        vm.stopPrank();

        assertTrue(first != second);
        assertEq(token.balanceOf(TREASURY), 200_000);
        assertEq(gateway.nonce(PAYER), 2);
    }

    function testInactiveServiceCannotBePaid() public {
        registry.deactivateService(serviceId);
        vm.prank(PAYER);
        vm.expectRevert(NexaGateway.InactiveService.selector);
        gateway.pay(serviceId, keccak256("request"));
    }

    function testServiceWithDifferentAssetCannotBePaid() public {
        bytes32 otherId = keccak256("other-service");
        registry.registerService(otherId, address(0x4444), address(0x5555), 100_000, keccak256("/other"));
        vm.prank(PAYER);
        vm.expectRevert(NexaGateway.AssetMismatch.selector);
        gateway.pay(otherId, keccak256("request"));
    }

    function testResultCanOnlyBeAnchoredOnceByAnchorerAfterPayment() public {
        bytes32 requestHash = keccak256("request");
        vm.prank(PAYER);
        bytes32 paymentId = gateway.pay(serviceId, requestHash);

        vm.prank(PAYER);
        vm.expectRevert(NexaGateway.NotAnchorer.selector);
        gateway.anchorResult(paymentId, keccak256("result"));

        vm.prank(ANCHORER);
        gateway.anchorResult(paymentId, keccak256("result"));
        assertTrue(gateway.resultAnchored(paymentId));

        vm.prank(ANCHORER);
        vm.expectRevert(NexaGateway.AlreadyAnchored.selector);
        gateway.anchorResult(paymentId, keccak256("different-result"));
    }
}
