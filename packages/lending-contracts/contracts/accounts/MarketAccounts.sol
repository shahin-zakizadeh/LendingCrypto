pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract MarketAccounts is ERC721Enumerable {

    uint256 public totalAccountsCreated;

    event UpdatedTokenURI(string uri);
    event AccountCreated(uint256 vaultID, address creator);

    string public baseUri;

    constructor(string memory name, string memory symbol, string memory _uri)
    ERC721(name, symbol)
    {
        _setBaseURI(_uri);
    }

    function _baseURI() internal view override returns (string memory) {
        string memory uri = baseUri;
        return uri;
    }

    /// @param _uri is the url for the nft metadata
    /// @notice updates the metadata
    /// @dev it currently uses an ipfs json
    function _setBaseURI(string memory _uri) internal {
        baseUri = _uri;
        emit UpdatedTokenURI(_uri);
    }


    /// @notice Creates a new vault and returns its id
    /// @return id is the new vault's id
    function _openAccount() internal returns (uint256) {
        uint256 id = totalAccountsCreated;
        totalAccountsCreated = totalAccountsCreated + 1;

        _mint(msg.sender, id);
        emit AccountCreated(id, msg.sender);
        return id;
    }
}
