export const CAST_NFT_ABI = [
  {
    type: "function",
    name: "createAndMint",
    inputs: [
      { name: "castHash", type: "bytes32" },
      { name: "castUrl", type: "string" },
      { name: "metadataUri", type: "string" },
      { name: "mintPrice", type: "uint256" },
      { name: "royaltyBps", type: "uint96" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "castTokens",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "castHash", type: "bytes32" },
      { name: "castUrl", type: "string" },
      { name: "metadataUri", type: "string" },
      { name: "mintPrice", type: "uint256" },
      { name: "royaltyBps", type: "uint96" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "castHashToTokenId",
    inputs: [{ name: "castHash", type: "bytes32" }],
    outputs: [{ name: "tokenId", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextTokenId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "uri",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "CastMinted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "castHash", type: "bytes32", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

export function getContractAddress(): `0x${string}` {
  const addr = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!addr) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not set");
  return addr as `0x${string}`;
}
