// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/CastNFT.sol";

contract CastNFTTest is Test {
    CastNFT public nft;
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);

    bytes32 constant CAST_HASH = keccak256("test-cast-1");
    string constant CAST_URL = "https://warpcast.com/alice/0xabc";
    string constant METADATA_URI = "ipfs://QmTest123";

    function setUp() public {
        nft = new CastNFT();
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function test_createAndMint_success() public {
        vm.prank(alice);
        uint256 tokenId = nft.createAndMint{value: 0.01 ether}(
            CAST_HASH,
            CAST_URL,
            METADATA_URI,
            0.001 ether,
            500, // 5%
            10
        );

        assertEq(tokenId, 1);
        assertEq(nft.balanceOf(alice, tokenId), 10);
        assertEq(nft.castHashToTokenId(CAST_HASH), tokenId);
        assertEq(nft.uri(tokenId), METADATA_URI);
    }

    function test_createAndMint_duplicateCastHash_reverts() public {
        vm.prank(alice);
        nft.createAndMint{value: 0}(
            CAST_HASH, CAST_URL, METADATA_URI, 0, 500, 1
        );

        vm.prank(bob);
        vm.expectRevert(CastNFT.CastAlreadyRegistered.selector);
        nft.createAndMint{value: 0}(
            CAST_HASH, CAST_URL, METADATA_URI, 0, 500, 1
        );
    }

    function test_createAndMint_royaltyTooHigh_reverts() public {
        vm.prank(alice);
        vm.expectRevert(CastNFT.RoyaltyTooHigh.selector);
        nft.createAndMint{value: 0}(
            CAST_HASH, CAST_URL, METADATA_URI, 0, 1001, 1
        );
    }

    function test_createAndMint_amountZero_reverts() public {
        vm.prank(alice);
        vm.expectRevert(CastNFT.AmountZero.selector);
        nft.createAndMint{value: 0}(
            CAST_HASH, CAST_URL, METADATA_URI, 0, 500, 0
        );
    }

    function test_createAndMint_emptyMetadata_reverts() public {
        vm.prank(alice);
        vm.expectRevert(CastNFT.EmptyMetadataUri.selector);
        nft.createAndMint{value: 0}(
            CAST_HASH, CAST_URL, "", 0, 500, 1
        );
    }

    function test_createAndMint_insufficientPayment_reverts() public {
        vm.prank(alice);
        vm.expectRevert(CastNFT.InsufficientPayment.selector);
        nft.createAndMint{value: 0.005 ether}(
            CAST_HASH, CAST_URL, METADATA_URI, 0.001 ether, 500, 10
        );
    }

    function test_mint_success() public {
        vm.prank(alice);
        uint256 tokenId = nft.createAndMint{value: 0}(
            CAST_HASH, CAST_URL, METADATA_URI, 0, 500, 1
        );

        vm.prank(alice);
        nft.mint{value: 0}(tokenId, 5);

        assertEq(nft.balanceOf(alice, tokenId), 6);
    }

    function test_mint_nonCreator_reverts() public {
        vm.prank(alice);
        uint256 tokenId = nft.createAndMint{value: 0}(
            CAST_HASH, CAST_URL, METADATA_URI, 0, 500, 1
        );

        vm.prank(bob);
        vm.expectRevert(CastNFT.OnlyCreator.selector);
        nft.mint{value: 0}(tokenId, 1);
    }

    function test_royaltyInfo() public {
        vm.prank(alice);
        uint256 tokenId = nft.createAndMint{value: 0}(
            CAST_HASH, CAST_URL, METADATA_URI, 0, 500, 1
        );

        (address receiver, uint256 amount) = nft.royaltyInfo(tokenId, 1 ether);
        assertEq(receiver, alice);
        assertEq(amount, 0.05 ether); // 5%
    }

    function test_supportsInterface() public view {
        // ERC-1155
        assertTrue(nft.supportsInterface(0xd9b67a26));
        // ERC-2981
        assertTrue(nft.supportsInterface(0x2a55205a));
    }
}
