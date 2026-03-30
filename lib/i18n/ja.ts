import type { Translations } from "./en";

const ja: Translations = {
  // Common
  loading: "読み込み中...",
  back: "← 戻る",
  castToNft: "Cast-to-NFT",
  builtOnBase: "Cast-to-NFT — Built on Base",
  miniApp: "MiniApp",

  // Home
  heroTitle: "Cast を NFT にしよう",
  heroDescription:
    "Farcaster の Cast を Base 上の ERC-1155 NFT として発行できます。著者本人のみがミント可能です。",
  loadingCast: "Cast を読み込み中...",

  // Cast URL Form
  urlPlaceholder: "https://warpcast.com/username/0x... を入力",
  fetchButton: "取得",

  // Cast Preview
  viewOnWarpcast: "Warpcast で見る →",
  makeNft: "NFTにする",

  // Errors
  castNotFound: "Cast が見つかりませんでした。URL を確認してください。",
  connectWalletPrompt: "ウォレットを接続してミントに進みましょう。",
  connectWalletRequired: "ウォレットを接続してください。",

  // Mint Form
  styleLabel: "スタイル",
  includeImage: "添付画像を含める",
  mintPriceLabel: "ミント価格 (ETH)",
  royaltyLabel: (pct: string) => `ロイヤリティ (${pct}%)`,
  initialSupplyLabel: "初回ミント枚数",
  previewLabel: "プレビュー",
  generating: "生成中...",
  previewFailed: "プレビューを読み込めませんでした",
  toConfirm: "確認画面へ",

  // Mint Button - Confirm
  confirmTitle: "ミント内容の確認",
  castLabel: "Cast",
  styleConfirmLabel: "スタイル",
  quantityLabel: "枚数",
  mintPriceConfirmLabel: "ミント価格",
  royaltyConfirmLabel: "ロイヤリティ",
  totalPaymentLabel: "支払い合計",
  chainLabel: "チェーン",
  switchToBaseSepolia: "Base Sepolia に切り替え",
  connectToBaseSepolia: "Base Sepolia に接続してください。",
  verifyingAuthor: "著者を確認中...",
  uploadingToIpfs: "IPFS にアップロード中...",
  sendingTransaction: "トランザクション送信中...",
  executeMint: "ミント実行",

  // Mint Button - Errors
  authorMismatch: "このウォレットは Cast 著者と一致しません。",
  ipfsUploadFailed: "IPFS への保存に失敗しました。",
  transactionCancelled: "トランザクションがキャンセルされました。",
  mintFailed: "ミントに失敗しました。",

  // Mint Button - Success
  mintComplete: "ミント完了！",
  transactionHash: "トランザクション Hash",
  viewOnBasescan: "Basescan で確認",
  shareOnWarpcast: "Warpcast でシェア",
  shareText: "My Cast is now an NFT on Base!",

  // Wallet
  disconnect: "切断",
  connectWallet: "ウォレット接続",

  // Validation
  invalidWarpcastUrl: "有効な Warpcast URL を入力してください",
  invalidCastHash: "有効な Cast hash ではありません",
  priceMinZero: "価格は0以上にしてください",
  invalidWalletAddress: "有効なウォレットアドレスではありません",

  // API Errors
  urlOrHashRequired: "url または hash パラメータが必要です",
  castFetchError: "Cast が見つかりませんでした。URL を確認してください。",
  authorVerifyError: "著者の確認に失敗しました。",
  ipfsSaveError: "IPFS への保存に失敗しました。",

  // Connection Status
  farcasterConnected: "Farcaster: 接続済み",
  farcasterNotDetected: "Farcaster: 未検出（MiniAppで開いてください）",
  walletConnected: "ウォレット: 接続済み",
  walletNotConnected: "ウォレット: 未接続",
  walletMatchesFarcaster: "Farcasterと連携済み",
  walletNotMatchFarcaster: "Farcasterアカウントと未連携",
  cancel: "キャンセル",

  // Language
  language: "言語",
};

export default ja;
