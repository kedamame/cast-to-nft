# Cast-to-NFT

Farcaster の Cast を Base 上の ERC-1155 NFT として発行できるデュアルモードアプリ。
Farcaster 内では MiniApp として、通常ブラウザでは Base web app として動作します。

## 動作モード

| 環境 | 動作 |
|------|------|
| Farcaster クライアント内 | MiniApp として起動。Cast embed から自動読込、Farcaster ウォレット自動接続 |
| 通常ブラウザ | Web app として起動。Cast URL 入力、Coinbase / WalletConnect / Browser Wallet から選択 |

## 必要ツール

- Node.js 18+
- npm
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (コントラクト開発・テスト用)

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env.local
```

以下の API キーを取得して `.env.local` に設定:

| 変数 | 取得先 |
|------|--------|
| `NEYNAR_API_KEY` | [Neynar](https://neynar.com) |
| `PINATA_API_KEY` / `PINATA_SECRET_API_KEY` | [Pinata](https://pinata.cloud) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | [WalletConnect Cloud](https://cloud.walletconnect.com) |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | デプロイ後に設定 |
| `FARCASTER_MANIFEST_*` | [Warpcast Manifest Tool](https://warpcast.com/~/developers/mini-apps) で生成 |
| `NEXT_PUBLIC_BUILDER_CODE` | (オプション) Base Build のビルダーコード |

### 3. ローカル起動

```bash
npm run dev
```

http://localhost:3000 でアクセス。

### 4. Farcaster Manifest の設定

1. Warpcast の Mini App Manifest Tool にアクセス
2. デプロイ先ドメイン (例: `cast-to-nft.vercel.app`) を入力
3. 生成された `header`, `payload`, `signature` を `.env.local` に設定
4. `/.well-known/farcaster.json` がブラウザからアクセス可能か確認

## コントラクト

### テスト

```bash
forge test
```

### Base Sepolia へのデプロイ

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  --verify
```

デプロイ後、表示されるコントラクトアドレスを `NEXT_PUBLIC_CONTRACT_ADDRESS` に設定。

## 使い方

### Web 版

1. http://localhost:3000 にアクセス
2. Warpcast の Cast URL を入力
3. ウォレットを接続 (Cast 著者のウォレット)
4. スタイル・価格・ロイヤリティ・枚数を設定
5. 確認してミント実行

### MiniApp 版

Farcaster クライアント内で MiniApp として起動すると、対象 Cast が自動で読み込まれます。
Farcaster ウォレットが `window.ethereum` 経由で自動検出されます。

## アーキテクチャ

```
┌─────────────────────────────────────────────┐
│  Next.js App (デュアルモード)                │
│                                              │
│  /.well-known/farcaster.json  ← manifest     │
│  layout.tsx                                  │
│  ├─ fc:miniapp メタタグ (Farcaster embed用)  │
│  └─ OG メタタグ (Web共有用)                  │
│                                              │
│  page.tsx                                    │
│  ├─ useFarcasterMiniApp() ← 環境検出        │
│  │   ├─ MiniApp: sdk.actions.ready()         │
│  │   │  + Farcaster wallet → window.ethereum │
│  │   └─ Web: 通常のウォレット接続UI          │
│  │                                           │
│  └─ wagmi hooks (共通)                       │
│      ├─ injected()  ← Farcaster/ブラウザ     │
│      ├─ coinbaseWallet()                     │
│      └─ walletConnect()                      │
│                                              │
│  ERC-8021 ビルダーコード (ox/erc8021)        │
│  └─ concatHex でトランザクションに付加       │
└─────────────────────────────────────────────┘
```

## 主要ファイル

| パス | 説明 |
|------|------|
| `contracts/CastNFT.sol` | ERC-1155 + ERC-2981 コントラクト |
| `test/CastNFT.t.sol` | Foundry テスト (10件) |
| `lib/farcaster.ts` | Farcaster MiniApp 環境検出フック |
| `lib/wagmi-config.ts` | wagmi 設定 (injected + Coinbase + WalletConnect) |
| `lib/erc8021.ts` | ERC-8021 ビルダーコードサポート |
| `app/.well-known/farcaster.json/route.ts` | Farcaster manifest 配信 |
| `app/api/cast/route.ts` | Cast 取得 API |
| `app/api/verify-author/route.ts` | 著者確認 API |
| `app/api/generate-card/route.tsx` | カード画像生成 API (4スタイル) |
| `app/api/upload-to-ipfs/route.ts` | IPFS アップロード API |
| `app/api/webhook/route.ts` | MiniApp webhook |
| `app/page.tsx` | メインページ (デュアルモード) |
| `app/icon.png/route.tsx` | アプリアイコン (1024x1024) |
| `app/splash.png/route.tsx` | スプラッシュ画像 (200x200) |
| `app/og-image.png/route.tsx` | OG画像 (1200x630) |
| `app/screenshot[1-3].png/route.tsx` | スクリーンショット (1284x2778) |

## デプロイチェックリスト

- [ ] `/.well-known/farcaster.json` がブラウザからアクセス可能
- [ ] `accountAssociation` をデプロイ先ドメインで生成済み
- [ ] `NEXT_PUBLIC_APP_URL` がデプロイ先URLと一致
- [ ] `NEXT_PUBLIC_CONTRACT_ADDRESS` が設定済み
- [ ] 全 API キーが設定済み
- [ ] アイコン・スプラッシュ・OG・スクリーンショット画像が正しく配信される

## MVP の制約

- 著者本人のみがミント可能
- 著者確認はサーバー側 (Neynar) で実施 (コントラクト側の署名検証は未実装)
- Base Sepolia のみ対応 (Mainnet は設定で切替可能)
- 第三者への販売フローは未実装
- 管理画面なし
