pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./BaseMarket.sol";

/**
 * @title OwnableMarket
 * @author 
 * @notice Adds the administrator role to the BaseMarket with functions to 
 * configure the market.
 */
contract OwnableMarket is BaseMarket, AccessControl {
    event AdministratorAdded(address indexed account, address indexed addedBy);
    event AdministratorRemoved(
        address indexed account,
        address indexed removedBy
    );

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
        BaseMarket(
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
        treasuryAccountId = 0;
    }

    modifier onlyAdmin() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Caller is not an administrator"
        );
        _;
    }

    function setLiquidationPenalty(
        uint256 _liquidationPenalty
    ) external onlyAdmin {
        liquidationPenalty = _liquidationPenalty;
    }

    function transferToken(
        address to,
        address token,
        uint256 amountToken
    ) external onlyAdmin {
        ERC20(token).transfer(to, amountToken);
    }

    function changePriceProvider(
        address priceProviderAddress
    ) external onlyAdmin {
        priceProvider = IPriceProvider(priceProviderAddress);
    }

    function setLiquidationThreshold(
        uint256 _liquidationThreshold
    ) external onlyAdmin {
        liquidationThreshold = _liquidationThreshold;
    }

    function setClosingFee(uint256 amount) external onlyAdmin {
        closingFee = amount;
    }

    function setTreasuryAccountId(uint256 _treasury) external onlyAdmin {
        require(_exists(_treasury), "Vault does not exist");
        treasuryAccountId = _treasury;
    }

    function setBaseURI(string memory baseURI) public onlyAdmin {
        _setBaseURI(baseURI);
    }

    function updateSmallAccountThreshold(
        uint256 _smallAccountThreshold
    ) external override onlyAdmin {
        smallAccountThreshold = _smallAccountThreshold;
    }

    function addAdmininstrator(address newAdmin) external onlyAdmin {
        grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        emit AdministratorAdded(newAdmin, msg.sender);
    }

    function removeAdmininstrator(address admin) external onlyAdmin {
        revokeRole(DEFAULT_ADMIN_ROLE, admin);
        emit AdministratorRemoved(admin, msg.sender);
    }

    function isAdmin(address account) external view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, account);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public virtual view override(ERC721Enumerable, AccessControl) returns (bool) {
        return
            ERC721Enumerable.supportsInterface(interfaceId) ||
            AccessControl.supportsInterface(interfaceId);
    }
}
