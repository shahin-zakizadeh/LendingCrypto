// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/security/Pausable.sol";
import "./OwnableMarket.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title PausableMarket
 * @author 
 * @notice Adds pause functionnality to stop users from borrowing, all other functionnalities keep untouched.
 * 
 * The market can be paused and unpaused by administrator.
 * The contract adds a new Circuit Breaker role. This role only has access to pause the market.
 * Circuit Breaker can be triggered in 2 ways:
 * Permissionned: a service calling the triggerCircuitBreaker() from an EOA with the CircuitBreaker role
 * Permissionless: keepers executing a tx to call a contract that verifies on-chain criterias are met to trigger the circuit breaker
 *  The contract needs to be added to the CircuitBreaker role.
 */
contract PausableMarket is OwnableMarket, Pausable {
    bytes32 public constant CIRCUIT_BREAKER_ROLE =
        keccak256("CIRCUIT_BREAKER_ROLE");
    event CircuitBreakerAdded(address indexed account, address indexed admin);
    event CircuitBreakerRemoved(address indexed account, address indexed admin);

    constructor(
        address priceProviderAddress,
        uint256 liquidationThreshold,
        string memory name,
        string memory symbol,
        address _debtToken,
        address _collateralToken,
        string memory baseURI,
        uint _liquidationMaxHR,
        uint _liquidationPenalty,
        uint _closingFee
    )
        OwnableMarket(
            priceProviderAddress,
            liquidationThreshold,
            name,
            symbol,
            _debtToken,
            _collateralToken,
            baseURI,
            _liquidationMaxHR,
            _liquidationPenalty,
            _closingFee
        )
    {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(CIRCUIT_BREAKER_ROLE, msg.sender);
    }

    function borrow(
        uint256 accountID,
        uint256 amount
    ) public virtual override whenNotPaused {
        super.borrow(accountID, amount);
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    function isPaused() external view returns (bool) {
        return paused();
    }

    function addCircuitBreaker(address account) external onlyAdmin {
        grantRole(CIRCUIT_BREAKER_ROLE, account);
        emit CircuitBreakerAdded(account, msg.sender);
    }

    function removeCircuitBreaker(address account) external onlyAdmin {
        revokeRole(CIRCUIT_BREAKER_ROLE, account);
        emit CircuitBreakerRemoved(account, msg.sender);
    }

    function isCircuitBreaker(address account) external view returns (bool) {
        return hasRole(CIRCUIT_BREAKER_ROLE, account);
    }

    function triggerCircuitBreaker() external onlyRole(CIRCUIT_BREAKER_ROLE) {
        _pause();
    }
}
