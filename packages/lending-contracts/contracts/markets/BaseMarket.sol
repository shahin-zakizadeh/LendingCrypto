// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "../interfaces/IPriceProvider.sol";
import "./interests/InterestMarket.sol";

import "hardhat/console.sol";

/// @title Create a base a base market with deposit, withdraw, borrow, repay and liquidation penalty
contract BaseMarket is ReentrancyGuard, InterestMarket {
    using SafeERC20 for ERC20;

    uint public constant HEALTH_RATIO_DECIMALS = 18;
    uint public constant LIQUIDATION_PENALTY_DECIMALS = 3;
    uint public constant LIQUIDATION_THRESHOLD_DECIMALS = 18;
    uint public constant CLOSING_FEE_DECIMALS = 4;

    IPriceProvider public priceProvider;

    /** Configurations */
    /**
     * @notice Liquidation Threshold is the collaterization factor. 
     * i.e: if your LT is 1.4, for every 1$ borrowed, there will be at least 1.4$ in collateral
     * or the account will get liquidated
     */
    uint256 public liquidationThreshold;
    /**
     * @notice This value prevents liquidating entire accounts.
     */
    uint256 public liquidationMaxHR;
    /**
     * @notice Liquidator cannot leave less than this amount when liquidationg the account. 
     * It should be configured as the minimum amount of principal required to liquidate so
     * the liquidation reward is greater than the gas costs
     */
    uint256 public smallAccountThreshold;
    /**
     * @notice The fee in % transferred in collateral to the treasury on every principal repayment 
     */
    uint256 public closingFee;

    uint256 public treasuryAccountId;

    /**
     * @notice The amount in % transferred to liquidator.
     * i.e: LP = 110%, liquidator would receive 110% value of the liquidated amount
     */
    uint256 public liquidationPenalty;

    ERC20 public collateralToken;
    ERC20 public debtToken;

    event CollateralDeposited(uint256 accountID, uint256 amount);
    event CollateralWithdrawn(uint256 accountID, uint256 amount);
    event TokenBorrowed(uint256 accountID, uint256 amount);
    event TokenRepaid(uint256 accountID, uint256 amount, uint256 closingFee);
    event AccountLiquidated(
        uint256 accountID,
        address owner,
        address buyer,
        uint256 debtRepaid,
        uint256 collateralLiquidated,
        uint256 closingFee
    );

    mapping(address => uint256) public liquidatorRewards;

    constructor(
        address priceProviderAddress,
        uint256 _liquidationThreshold,
        string memory name,
        string memory symbol,
        address _debtToken,
        address _collateralToken,
        string memory baseURI,
        uint _liquidationMaxHR,
        uint _liquidationPenalty,
        uint _closingFee
    ) InterestMarket(name, symbol, baseURI) {
        require(priceProviderAddress != address(0));
        require(_liquidationThreshold > 10 ** LIQUIDATION_THRESHOLD_DECIMALS);
        closingFee = _closingFee;
        priceProvider = IPriceProvider(priceProviderAddress);

        collateralToken = ERC20(_collateralToken);
        debtToken = ERC20(_debtToken);

        liquidationPenalty = _liquidationPenalty;
        liquidationThreshold = _liquidationThreshold;
        liquidationMaxHR = _liquidationMaxHR;
        smallAccountThreshold = 0;
    }

    modifier onlyAccountOwner(uint256 accountID) {
        require(_exists(accountID), "Account does not exist");
        require(
            ownerOf(accountID) == msg.sender,
            "Vault is not owned by caller"
        );
        _;
    }

    /// @notice Returns the maximum available debt
    /// @return maxDebt
    function getAvailableDebt() public view returns (uint256) {
        return debtToken.balanceOf(address(this));
    }

    /// @notice Checks if a vault with the given ID exists
    /// @return exists true if it exists false otherwise
    function exists(uint256 accountID) external view returns (bool) {
        return _exists(accountID);
    }

    /**
     * @notice it will return principal Price. 
     * Principal Price is always 1$ by design to avoid spiraling to 0$ 
     */
    function getDebtPrice() public view returns (uint256) {
        return 10 ** priceProvider.DECIMALS();
    }

    /// @notice returns collateral price
    /// @return ethPrice
    function getCollateralPrice() public view returns (uint256) {
        return priceProvider.getSafePrice(address(collateralToken));
    }

    function principalAmount(
        uint256 accountID
    ) external view virtual returns (uint256) {
        return _principalAmount(accountID);
    }

    function collateralAmount(
        uint256 accountID
    ) external view virtual returns (uint256) {
        return _collateralAmount(accountID);
    }

    /** functions to satisfy the InterestModel abstract contract. The BaseMarket has no interest */
    function _setInterestRate(
        uint256 _yearlyInterestRate
    ) internal virtual override {}

    function _compoundInterest() internal virtual override {}

    function _interestGrace(
        uint256
    ) internal view virtual override returns (uint256) {
        return 0;
    }

    function compoundInterest() external {
        _compoundInterest();
    }

    /// @notice returns the collateral value
    /// @param _collateralAmount The amount of collateral to get valued
    /// @dev Returns the same amount of decimals as the oracle
    /// @return collateralValue Collateral value
    function calculateCollateralValue(
        uint256 _collateralAmount
    ) public view returns (uint256) {
        uint256 collateralPrice = getCollateralPrice();
        require(collateralPrice != 0, "oracle is not ready");
        uint256 collateralValue = (_collateralAmount * collateralPrice) /
            (10 ** collateralToken.decimals());

        return collateralValue;
    }

    /// @notice returns the principal value
    /// @param _principalAmount The amount of principal to get valued
    /// @dev Returns the same amount of decimals as the oracle
    /// @return principalValue principal value
    function calculatePrincipalValue(
        uint256 _principalAmount
    ) public view returns (uint256) {
        uint256 debtPrice = getDebtPrice();
        require(debtPrice != 0, "oracle is not ready");
        uint256 debtValue = (_principalAmount * debtPrice) /
            (10 ** debtToken.decimals());
        return debtValue;
    }

    /// @notice Creates a new vault and returns its id
    /// @return id is the new vault's id
    function openAccount() external returns (uint256) {
        return _openAccount();
    }

    /// @notice deposits the given amount of collateral to the vault
    /// @param accountID is the vault's id
    /// @param amount is the amount to deposit
    function deposit(uint256 accountID, uint256 amount) external {
        require(_exists(accountID), "Account does not exist");
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);
        _increaseCollateralAmount(accountID, amount);

        emit CollateralDeposited(accountID, amount);
    }

    /// @notice Withdrawls collateral from the vault and updates vault with the new amount
    /// @param accountID is the vault's id
    /// @param amount is the amount to withdraw
    /// @dev Modifier: onlyAccountOwner: requires the owner to be the caller of the function, nonReentrant
    function withdraw(
        uint256 accountID,
        uint256 amount
    ) external onlyAccountOwner(accountID) nonReentrant {
        _decreaseCollateralAmount(accountID, amount);
        if (_principalAmount(accountID) != 0) {
            require(
                !isLiquidatable(accountID),
                "Withdrawal would put health ratio below 1"
            );
        }
        collateralToken.safeTransfer(msg.sender, amount);

        emit CollateralWithdrawn(accountID, amount);
    }

    function updateSmallAccountThreshold(
        uint256 _newThreshold
    ) external virtual {
        smallAccountThreshold = _newThreshold;
    }

    /// @notice borrows token from the vault and increases debt
    /// @dev checks to make sure there is no bad debt
    /// @param accountID is the vault's ID
    /// @param amount is the amount to borrow
    function borrow(
        uint256 accountID,
        uint256 amount
    ) public virtual onlyAccountOwner(accountID) {
        require(amount > 0, "Must borrow non-zero amount");
        require(
            amount <= getAvailableDebt(),
            "borrow: Cannot be over available supply."
        );

        _compoundInterest();
        uint256 principal = _increasePrincipalAmount(accountID, amount);
        require(!isLiquidatable(accountID), "borrow: Health ratio below 100");
        require(
            principal >= smallAccountThreshold,
            "Outstanding principal amount is too small."
        );

        debtToken.safeTransfer(msg.sender, amount);

        emit TokenBorrowed(accountID, amount);
    }

    /// @notice pays back the token borrowed previously
    /// @dev the amount should not be too low, or more than the debt itself
    /// @param accountID is the vault's ID
    /// @param amount is the amount to pay back
    function repay(uint256 accountID, uint256 amount) virtual public {
        require(
            debtToken.balanceOf(msg.sender) >= amount,
            "Token balance too low"
        );
        _compoundInterest();
        uint256 principal = _decreasePrincipalAmount(accountID, amount);
        debtToken.safeTransferFrom(msg.sender, address(this), amount);
        uint256 totalClosingFee = _applyClosingFee(accountID, amount);
        require(
            principal >= smallAccountThreshold || principal == 0,
            "Outstanding principal amount is too small."
        );
        emit TokenRepaid(accountID, amount, totalClosingFee);
    }

    function _applyClosingFee(
        uint256 accountID,
        uint amount
    ) internal returns (uint256) {
        uint256 totalClosingFee = _calculateClosingFee(amount);
        _decreaseCollateralAmount(accountID, totalClosingFee);
        _increaseCollateralAmount(treasuryAccountId, totalClosingFee);
        return totalClosingFee;
    }

    function _calculateClosingFee(
        uint256 principalRepaid
    ) internal view returns (uint256) {
        uint256 collateralPrice = getCollateralPrice();
        uint256 principalPrice = getDebtPrice();
        return
            (principalRepaid *
                (10 ** collateralToken.decimals()) *
                closingFee *
                principalPrice) /
            (10 ** (CLOSING_FEE_DECIMALS + debtToken.decimals()) *
                collateralPrice);
    }

    /// @notice Returns if the vault isLiquidatable
    /// @param accountID is the vault's ID
    /// @return isLiquidatable which is a boolean
    function isLiquidatable(uint256 accountID) public view returns (bool) {
        require(_exists(accountID), "Account does not exist");
        return calculateHealthRatio(accountID) < 10 ** HEALTH_RATIO_DECIMALS;
    }

    function isSmallAccount(uint256 accountID) external view returns (bool) {
        return _principalAmount(accountID) <= smallAccountThreshold;
    }

    function isMediumAccount(uint256 accountID) external view returns (bool) {
        return _principalAmount(accountID) <= 2 * smallAccountThreshold;
    }

    /// @notice Liquidates accountID
    /// @param accountID is the vault's ID
    /// @param amountLiquidated amount of debt token liquidated
    function liquidate(
        uint256 accountID,
        uint amountLiquidated
    ) external returns (uint256) {
        _compoundInterest();
        require(
            isLiquidatable(accountID),
            "Vault is not below minimum collateral percentage"
        );
        uint256 pa = _principalAmount(accountID);
        require(
            amountLiquidated <= pa,
            "liquidatateVault: amount liquidated is gt than debt balance"
        );

        require(
            debtToken.balanceOf(msg.sender) >= amountLiquidated,
            "Token balance too low to pay off outstanding debt"
        );

        debtToken.safeTransferFrom(msg.sender, address(this), amountLiquidated);

        uint256 liquidatorReward = calculateLiquidatorReward(amountLiquidated);
        bool smallAccount = pa <= smallAccountThreshold;
        bool mediumAccount = pa <= 2 * smallAccountThreshold;

        uint principalAmountLeft = _decreasePrincipalAmount(
            accountID,
            amountLiquidated
        );
        uint256 totalClosingFee = _applyClosingFee(accountID, amountLiquidated);

        // deduct the amount from the vault's collateral
        _decreaseCollateralAmount(accountID, liquidatorReward);
        bool accountEmpty = principalAmountLeft == 0;
        if (smallAccount) {
            require(
                accountEmpty,
                "Small accounts have to be liquidated entirely"
            );
        } else {
            if (!mediumAccount) {
                bool hrLteMax = calculateHealthRatio(accountID) <=
                    liquidationMaxHR;
                require(hrLteMax, "too much collateral is liquidated");
            }
            require(
                accountEmpty || principalAmountLeft > smallAccountThreshold,
                "Cannot leave a small amount of debt"
            );
        }

        // assign the reward the liquidator's account
        liquidatorRewards[msg.sender] =
            liquidatorRewards[msg.sender] +
            liquidatorReward;

        emit AccountLiquidated(
            accountID,
            ownerOf(accountID),
            msg.sender,
            amountLiquidated,
            liquidatorReward,
            totalClosingFee
        );
        return liquidatorReward;
    }

    /// @notice Calculates the liquidators' reward
    function calculateLiquidatorReward(
        uint256 amountLiquidated
    ) public view returns (uint256) {
        return
            (amountLiquidated *
                (10 ** collateralToken.decimals()) *
                liquidationPenalty *
                getDebtPrice()) /
            (10 ** (LIQUIDATION_PENALTY_DECIMALS + debtToken.decimals()) *
                getCollateralPrice());
    }

    function calculateHealthRatio(
        uint256 _accountID
    ) public view returns (uint256) {
        uint256 principalValue = calculatePrincipalValue(
            _principalAmount(_accountID)
        );
        if (principalValue == 0) {
            return type(uint256).max;
        }
        return ((calculateCollateralValue(_collateralAmount(_accountID)) *
            (10 ** (LIQUIDATION_THRESHOLD_DECIMALS + HEALTH_RATIO_DECIMALS))) /
            (liquidationThreshold * principalValue));
    }

    function claimLiquidationRewards() public nonReentrant returns (uint256) {
        require(
            liquidatorRewards[msg.sender] > 0,
            "Don't have anything for you."
        );
        uint256 amount = liquidatorRewards[msg.sender];
        liquidatorRewards[msg.sender] = 0;
        collateralToken.safeTransfer(msg.sender, amount);
        return amount;
    }
}
