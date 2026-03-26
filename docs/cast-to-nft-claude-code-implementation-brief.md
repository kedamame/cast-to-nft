# Cast-to-NFT Claude Code 実装ブリーフ

## 0. このファイルの目的

このドキュメントは、Claude Code にこのファイルを添付するだけで、Cast-to-NFT MiniApp の MVP 実装を開始して完了まで進めやすくするための実装指示書です。

単なる企画説明ではなく、以下を含みます。

- Claude Code が着手順を迷わないこと
- 実装対象ファイルが明確であること
- API と UI とコントラクトの責務が明確であること
- 完了条件とテスト条件が明確であること

このファイルは、[cast-to-nft-spec-v2.md](./cast-to-nft-spec-v2.md) を実装用に具体化したものです。

## 1. Claude Code への依頼文

Claude Code には次の前提で作業してもらう。

```text
Cast-to-NFT という Farcaster MiniApp / Web アプリを実装してください。

目的:
Farcaster の Cast を、作者本人のみが Base 上の ERC-1155 NFT として mint できる MVP を作ること。

必須要件:
- Next.js App Router + TypeScript で実装
- Web 版と Farcaster MiniApp 版の両対応
- Neynar で Cast 取得と作者確認
- satori + sharp でカード画像生成
- Pinata で画像と metadata を IPFS に保存
- Solidity の ERC-1155 + ERC-2981 コントラクトを実装
- Base Sepolia で動作する mint 導線を作る
- UI は実装し、最低限のスタイリングまで完成させる
- 必要な環境変数、README、セットアップ手順も整える

制約:
- MVP では作者本人のみ mint 可
- 一意キーは castUrl ではなく cast hash を使う
- クライアント側だけで認可を完結させない
- 送金処理は transfer 前提にしない
- エラー状態を UI に明示する

進め方:
- まずプロジェクトを実装可能な形でブートストラップ
- 次にコントラクト、API、UI を順に実装
- 最後にテスト、README、環境変数サンプル、動作確認を整える
- 作業の最後に、実装内容・未解決事項・起動方法をまとめる
```

## 2. これだけでは足りないと Claude Code が迷うポイント

Claude Code が迷いやすい論点を先に固定する。

### 2.1 MVP の責務分離

- 作者確認は MVP ではサーバー側で Neynar を使って判定する
- コントラクトは Farcaster 作者性を直接検証しない
- 将来的に署名ベース認可を足せる構造にする

### 2.2 一意キー

- 永続的な一意判定には `castHash` を使う
- `castUrl` は表示用と外部リンク用に保持する

### 2.3 ミント範囲

- MVP では作者本人が `createAndMint` を実行し、同時に初回 supply を mint する
- 追加 mint も MVP では作者本人のみ
- 第三者による購入フローは実装しない

### 2.4 チェーン

- 実装対象は Base Sepolia を優先
- Mainnet 対応は設定で差し替え可能にしておくが、MVP の動作確認は Sepolia 前提

## 3. 作るもの

最終的に次の成果物をリポジトリに揃える。

- Next.js アプリ一式
- Solidity コントラクト
- Foundry テスト
- API ルート
- Farcaster MiniApp 対応コード
- README
- `.env.example`

## 4. 想定ディレクトリ構成

```text
/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   ├── cast/[hash]/page.tsx
│   └── api/
│       ├── cast/route.ts
│       ├── verify-author/route.ts
│       ├── generate-card/route.ts
│       ├── upload-to-ipfs/route.ts
│       ├── og/route.ts
│       └── frame/route.ts
├── components/
│   ├── cast-url-form.tsx
│   ├── cast-preview.tsx
│   ├── style-selector.tsx
│   ├── mint-form.tsx
│   ├── mint-button.tsx
│   ├── wallet-button.tsx
│   └── status-banner.tsx
├── lib/
│   ├── neynar.ts
│   ├── pinata.ts
│   ├── contract.ts
│   ├── wagmi-config.ts
│   ├── types.ts
│   ├── validations.ts
│   └── utils.ts
├── contracts/
│   └── CastNFT.sol
├── script/
│   └── Deploy.s.sol
├── test/
│   └── CastNFT.t.sol
├── public/
│   └── logo.png
├── docs/
├── README.md
├── .env.example
├── package.json
├── foundry.toml
└── tsconfig.json
```

## 5. 実装手順

Claude Code は以下の順序で進める。

### Step 1. Next.js アプリをブートストラップ

- App Router
- TypeScript
- Tailwind CSS
- ESLint

### Step 2. 依存関係を導入

少なくとも次を導入する。

- `wagmi`
- `viem`
- `@rainbow-me/rainbowkit`
- `@farcaster/frame-sdk`
- `zod`
- `satori`
- `sharp`
- `mime`
- `axios` または `fetch` ベースの薄いクライアント

### Step 3. Solidity コントラクトを実装

仕様:

- ERC-1155
- ERC-2981
- `castHash` を一意キーにする
- `createAndMint`
- `mint`
- 売上送金は `call`

### Step 4. Foundry テストを書く

最低限テストする。

- 新規 Cast の登録成功
- 同一 castHash の二重登録失敗
- `royaltyBps > 1000` の失敗
- `amount == 0` の失敗
- 追加 mint 成功
- 作者以外の追加 mint 失敗

### Step 5. Neynar ラッパーを実装

必要関数:

- `getCastByUrl`
- `getCastByHash`
- `getUserFidsByAddress`
- `verifyCastAuthor`

### Step 6. Pinata ラッパーを実装

必要関数:

- `uploadBuffer`
- `uploadJson`

### Step 7. 画像生成 API を実装

入力:

- `cast`
- `style`
- `includeImage`

出力:

- PNG バッファ

スタイルは次の 4 種を実装する。

- `midnight`
- `paper`
- `neon`
- `minimal`

### Step 8. API ルートを実装

#### `GET /api/cast`

- クエリで `url` または `hash` を受け取る
- Cast 情報を返す

#### `POST /api/verify-author`

- `castHash`
- `walletAddress`

を受け取り、`verified` を返す

#### `POST /api/generate-card`

- プレビュー用に画像を返す

#### `POST /api/upload-to-ipfs`

- 画像と metadata を生成して IPFS に保存
- `imageUri` と `metadataUri` を返す

### Step 9. UI を実装

最低限必要な画面:

- Home
- Cast Preview
- Mint Setup
- Confirm
- Result

最低限必要な状態:

- idle
- loading
- error
- success
- wrong network
- unauthorized

### Step 10. MiniApp 対応

- frame context を読める場合は自動で Cast を解決
- 読めない場合は URL 入力にフォールバック
- `sdk.actions.ready()` を適切に呼ぶ

### Step 11. README と `.env.example`

必ず含める。

- セットアップ方法
- 必要な API キー
- Base Sepolia デプロイ方法
- ローカル起動方法
- MiniApp と Web の使い分け

## 6. API の厳密仕様

### 6.1 `GET /api/cast`

クエリ:

- `url?: string`
- `hash?: string`

ルール:

- 少なくとも片方必須
- 両方空なら `400`
- 取得失敗時は `404` または `502`

レスポンス例:

```json
{
  "cast": {
    "hash": "0xabc",
    "url": "https://warpcast.com/alice/0xabc",
    "text": "hello world",
    "authorFid": 1234,
    "authorUsername": "alice",
    "authorPfpUrl": "https://...",
    "publishedAt": "2026-03-22T10:00:00.000Z",
    "embedImageUrl": "https://..."
  }
}
```

### 6.2 `POST /api/verify-author`

リクエスト:

```json
{
  "castHash": "0xabc",
  "walletAddress": "0x1234..."
}
```

レスポンス:

```json
{
  "verified": true,
  "castAuthorFid": 1234,
  "walletFids": [1234]
}
```

### 6.3 `POST /api/upload-to-ipfs`

リクエスト:

```json
{
  "castHash": "0xabc",
  "style": "midnight",
  "includeImage": true,
  "mintPriceEth": "0.001"
}
```

レスポンス:

```json
{
  "imageUri": "ipfs://...",
  "metadataUri": "ipfs://..."
}
```

## 7. コントラクトの厳密仕様

```solidity
struct CastToken {
    address creator;
    bytes32 castHash;
    string castUrl;
    string metadataUri;
    uint256 mintPrice;
    uint96 royaltyBps;
}
```

必要 state:

- `mapping(uint256 => CastToken) public castTokens;`
- `mapping(bytes32 => uint256) public castHashToTokenId;`
- `uint256 public nextTokenId;`

必要関数:

```solidity
function createAndMint(
    bytes32 castHash,
    string calldata castUrl,
    string calldata metadataUri,
    uint256 mintPrice,
    uint96 royaltyBps,
    uint256 amount
) external payable returns (uint256 tokenId);

function mint(uint256 tokenId, uint256 amount) external payable;
```

必要 revert 条件:

- 既存 `castHash`
- 空の `metadataUri`
- `amount == 0`
- `royaltyBps > 1000`
- `msg.value != mintPrice * amount`
- 作者以外による `mint`

## 8. UI 要件

### Home

- Hero 文言
- Cast URL 入力欄
- MiniApp の場合は自動読込表示

### Cast Preview

- 本文
- 作者
- 投稿日時
- 添付画像

### Mint Setup

- スタイル選択
- 価格入力
- ロイヤリティ入力
- 枚数入力
- 添付画像の ON/OFF
- リアルタイムプレビュー

### Confirm

- 保存内容の要約
- 支払い金額
- Base Sepolia 表示

### Result

- mint 完了
- Explorer リンク
- metadata URI
- Cast シェア導線

## 9. エラー文言の方針

実装時は、少なくとも以下の文言を UI に出す。

- 「Cast が見つかりませんでした。URL を確認してください。」
- 「このウォレットは Cast 作者と一致しません。」
- 「Base Sepolia に接続してください。」
- 「画像生成に失敗しました。もう一度お試しください。」
- 「IPFS への保存に失敗しました。」
- 「トランザクションがキャンセルされました。」
- 「ミントに失敗しました。設定内容を確認してください。」

## 10. 環境変数

`.env.example` に次を含める。

```env
NEYNAR_API_KEY=
PINATA_API_KEY=
PINATA_SECRET_API_KEY=
PINATA_GATEWAY_URL=https://gateway.pinata.cloud
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_BASE_CHAIN_ID=8453
NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID=84532
```

## 11. README に必ず書くこと

- 必要ツール
- Node.js バージョン
- Foundry のセットアップ
- 環境変数の設定方法
- `npm install`
- `npm run dev`
- `forge test`
- デプロイ方法
- MiniApp メタタグの確認方法

## 12. 完了条件

Claude Code は次を満たしたら完了とみなす。

- アプリがローカル起動できる
- `forge test` が通る
- Web 版で Cast URL から mint 導線に進める
- API ルートが実装済み
- コントラクトが実装済み
- README と `.env.example` が存在する
- 主要エラー状態が UI で扱われる

## 13. 未解決事項として残してよいもの

MVP では以下は TODO でよい。

- コントラクト単体での作者性検証
- Mainnet 最終デプロイ
- OpenSea 最適化 metadata
- 第三者販売
- 管理画面

## 14. Claude Code が最後に報告すべき内容

作業完了時には次をまとめて報告する。

- 追加・変更した主要ファイル
- 実装した機能
- まだ未実装の項目
- セットアップ手順
- テスト結果
- 実運用前に必要な次の作業

## 15. 結論

Claude Code に 1 ファイルだけ渡すなら、このファイルを優先して添付する。企画説明としては `cast-to-nft-spec-v2.md` も有用だが、実装開始の精度と速度を上げるには、この実装ブリーフのほうが適している。
