// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract CastNFT is ERC1155, IERC2981 {
    struct CastToken {
        address creator;
        bytes32 castHash;
        string castUrl;
        string metadataUri;
        uint256 mintPrice;
        uint96 royaltyBps;
    }

    mapping(uint256 => CastToken) public castTokens;
    mapping(bytes32 => uint256) public castHashToTokenId;
    uint256 public nextTokenId = 1;

    event CastMinted(
        uint256 indexed tokenId,
        address indexed creator,
        bytes32 castHash,
        uint256 amount
    );

    error CastAlreadyRegistered();
    error EmptyMetadataUri();
    error AmountZero();
    error RoyaltyTooHigh();
    error InsufficientPayment();
    error TokenDoesNotExist();
    error OnlyCreator();
    error TransferFailed();

    constructor() ERC1155("") {}

    function createAndMint(
        bytes32 castHash,
        string calldata castUrl,
        string calldata metadataUri,
        uint256 mintPrice,
        uint96 royaltyBps,
        uint256 amount
    ) external payable returns (uint256 tokenId) {
        if (castHashToTokenId[castHash] != 0) revert CastAlreadyRegistered();
        if (bytes(metadataUri).length == 0) revert EmptyMetadataUri();
        if (amount == 0) revert AmountZero();
        if (royaltyBps > 1000) revert RoyaltyTooHigh();
        if (msg.value != mintPrice * amount) revert InsufficientPayment();

        tokenId = nextTokenId++;
        castHashToTokenId[castHash] = tokenId;
        castTokens[tokenId] = CastToken({
            creator: msg.sender,
            castHash: castHash,
            castUrl: castUrl,
            metadataUri: metadataUri,
            mintPrice: mintPrice,
            royaltyBps: royaltyBps
        });

        _mint(msg.sender, tokenId, amount, "");

        if (msg.value > 0) {
            (bool success, ) = payable(msg.sender).call{value: msg.value}("");
            if (!success) revert TransferFailed();
        }

        emit CastMinted(tokenId, msg.sender, castHash, amount);
    }

    function mint(uint256 tokenId, uint256 amount) external payable {
        CastToken storage token = castTokens[tokenId];
        if (token.creator == address(0)) revert TokenDoesNotExist();
        if (msg.sender != token.creator) revert OnlyCreator();
        if (amount == 0) revert AmountZero();
        if (msg.value != token.mintPrice * amount) revert InsufficientPayment();

        _mint(msg.sender, tokenId, amount, "");

        if (msg.value > 0) {
            (bool success, ) = payable(token.creator).call{value: msg.value}("");
            if (!success) revert TransferFailed();
        }

        emit CastMinted(tokenId, msg.sender, token.castHash, amount);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        CastToken storage token = castTokens[tokenId];
        if (token.creator == address(0)) revert TokenDoesNotExist();
        return token.metadataUri;
    }

    function royaltyInfo(
        uint256 tokenId,
        uint256 salePrice
    ) external view override returns (address receiver, uint256 royaltyAmount) {
        CastToken storage token = castTokens[tokenId];
        if (token.creator == address(0)) revert TokenDoesNotExist();
        receiver = token.creator;
        royaltyAmount = (salePrice * token.royaltyBps) / 10000;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, IERC165) returns (bool) {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
