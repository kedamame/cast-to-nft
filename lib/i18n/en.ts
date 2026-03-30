const en = {
  // Common
  loading: "Loading...",
  back: "← Back",
  castToNft: "Cast-to-NFT",
  builtOnBase: "Cast-to-NFT — Built on Base",
  miniApp: "MiniApp",

  // Home
  heroTitle: "Turn your Cast into NFT",
  heroDescription:
    "Issue your Farcaster Casts as ERC-1155 NFTs on Base. Only the original author can mint.",
  loadingCast: "Loading Cast...",

  // Cast URL Form
  urlPlaceholder: "Enter https://warpcast.com/username/0x...",
  fetchButton: "Fetch",

  // Cast Preview
  viewOnWarpcast: "View on Warpcast →",
  makeNft: "Make NFT",

  // Errors
  castNotFound: "Cast not found. Please check the URL.",
  connectWalletPrompt: "Connect your wallet to proceed with minting.",
  connectWalletRequired: "Please connect your wallet.",

  // Mint Form
  styleLabel: "Style",
  includeImage: "Include attached image",
  mintPriceLabel: "Mint Price (ETH)",
  royaltyLabel: (pct: string) => `Royalty (${pct}%)`,
  initialSupplyLabel: "Initial Mint Quantity",
  previewLabel: "Preview",
  generating: "Generating...",
  previewFailed: "Failed to load preview",
  toConfirm: "Proceed to Confirmation",

  // Mint Button - Confirm
  confirmTitle: "Confirm Mint Details",
  castLabel: "Cast",
  styleConfirmLabel: "Style",
  quantityLabel: "Quantity",
  mintPriceConfirmLabel: "Mint Price",
  royaltyConfirmLabel: "Royalty",
  totalPaymentLabel: "Total Payment",
  chainLabel: "Chain",
  switchToBaseSepolia: "Switch to Base Sepolia",
  connectToBaseSepolia: "Please connect to Base Sepolia.",
  verifyingAuthor: "Verifying author...",
  uploadingToIpfs: "Uploading to IPFS...",
  sendingTransaction: "Sending transaction...",
  executeMint: "Mint",

  // Mint Button - Errors
  authorMismatch: "This wallet does not match the Cast author.",
  ipfsUploadFailed: "Failed to save to IPFS.",
  transactionCancelled: "Transaction cancelled.",
  mintFailed: "Mint failed.",

  // Mint Button - Success
  mintComplete: "Mint Complete!",
  transactionHash: "Transaction Hash",
  viewOnBasescan: "View on Basescan",
  shareOnWarpcast: "Share on Warpcast",
  shareText: "My Cast is now an NFT on Base!",

  // Wallet
  disconnect: "Disconnect",
  connectWallet: "Connect Wallet",

  // Validation
  invalidWarpcastUrl: "Please enter a valid Warpcast URL",
  invalidCastHash: "Invalid Cast hash",
  priceMinZero: "Price must be 0 or greater",
  invalidWalletAddress: "Invalid wallet address",

  // API Errors
  urlOrHashRequired: "url or hash parameter is required",
  castFetchError: "Cast not found. Please check the URL.",
  authorVerifyError: "Failed to verify author.",
  ipfsSaveError: "Failed to save to IPFS.",

  // Connection Status
  farcasterConnected: "Farcaster: Connected",
  farcasterNotDetected: "Farcaster: Not detected (open as MiniApp)",
  walletConnected: "Wallet: Connected",
  walletNotConnected: "Wallet: Not connected",
  walletMatchesFarcaster: "Linked to Farcaster",
  walletNotMatchFarcaster: "Not linked to Farcaster account",
  cancel: "Cancel",

  // Language
  language: "Language",
};

export default en;

export type Translations = {
  [K in keyof typeof en]: (typeof en)[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : string;
};
