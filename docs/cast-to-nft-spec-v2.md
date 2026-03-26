# Cast-to-NFT 仕様書 v2

## 1. このアプリが解くこと

Cast-to-NFT は、Farcaster 上の Cast をそのまま Base 上で NFT として発行できるアプリです。Cast の投稿者本人だけが自分の Cast を NFT 化でき、投稿内容、投稿日時、作者情報、任意のカードデザインをまとめてオンチェーン資産として残せます。

このアプリの価値は、単なる画像 NFT の発行ではなく、Farcaster 上の投稿体験とミント体験を自然につなぐことにあります。MiniApp 内で完結できることを理想としつつ、通常の Web からも同じ体験を提供します。

## 2. 対象ユーザー

- 自分の Cast を記念 NFT として残したい Farcaster ユーザー
- 話題になった Cast を公式にオンチェーン化したい投稿者
- Base 上で軽量にソーシャルコンテンツをミントしたいクリエイター

## 3. プロダクト原則

- 作者本人以外はミントを開始できない
- Cast の内容を尊重し、過度な編集はさせない
- MiniApp でも Web でも迷わず使える
- ミント前に「何が保存されるか」が明確である
- MVP では確実性を優先し、複雑な二次流通機能は後回しにする

## 4. MVP の定義

MVP で必須とするのは次の機能です。

- Cast URL または MiniApp コンテキストから対象 Cast を取得できる
- 接続ウォレットが Cast 作者本人か確認できる
- カード画像を生成し、IPFS に保存できる
- ERC-1155 NFT を Base Sepolia で発行できる
- ミント完了後に NFT 参照リンクと Cast 共有導線を表示できる

MVP では行わないことは次のとおりです。

- 作者以外への一般販売
- 二次流通マーケットとの深い統合
- 複雑なコレクション管理機能
- 管理画面

## 5. ユーザーストーリー

### 5.1 MiniApp から使う場合

1. ユーザーが Farcaster 上で Cast を開く
2. MiniApp を起動すると、対象 Cast の情報が自動で読み込まれる
3. ユーザーがウォレットを接続する
4. アプリが接続ウォレットと Cast 作者の関連を確認する
5. ユーザーがカードデザイン、価格、ミント枚数を設定する
6. 画像生成と metadata 生成の内容を確認する
7. ユーザーが Base 上でトランザクションに署名する
8. ミント完了後、共有導線と外部リンクを表示する

### 5.2 Web から使う場合

1. ユーザーが Cast URL を入力する
2. アプリが Cast を取得してプレビューを表示する
3. 以降は MiniApp と同じ流れで進む

## 6. 機能要件

### 6.1 Cast 取得

- MiniApp では frame context から cast 情報を取得する
- Web では Warpcast URL 入力から Cast を取得する
- 正規化済みの Cast hash を内部の一意キーとして扱う
- URL は表示用途に保持するが、一意判定の主キーには使わない

### 6.2 作者確認

- Cast の作者 FID を Neynar API から取得する
- 接続ウォレットに紐づく FID 一覧を Neynar API から取得する
- 一覧内に Cast 作者 FID が含まれている場合のみミント可能とする
- 一致しない場合は NFT 設定画面へ進ませない

### 6.3 NFT 設定

ユーザーが設定できる項目は次のとおりです。

- カードスタイル
- 添付画像を含めるかどうか
- 初回ミント枚数
- ミント価格
- ロイヤリティ率

制約は次のとおりです。

- ミント価格は 0 以上
- ロイヤリティは 0% 以上 10% 以下
- 初回ミント枚数は 1 から 100 まで

### 6.4 カード画像生成

- Cast 本文
- 作者 username
- 作者 FID
- 投稿日時
- Warpcast への導線
- 選択したスタイル
- 任意で添付画像

上記を含む PNG をサーバー側で生成する。

### 6.5 IPFS 保存

- 画像を IPFS にアップロードする
- 画像 URI を含む ERC-1155 metadata JSON を生成する
- metadata JSON も IPFS にアップロードする
- コントラクトへ渡すのは metadata URI とする

### 6.6 ミント

- 作者本人のみ `createAndMint` を実行できる
- 同一 Cast hash に対する重複登録は不可
- 初回登録時に指定枚数をミントできる
- 追加ミントは MVP では作者本人のみに限定する

### 6.7 完了画面

- トランザクション hash
- Basescan リンク
- NFT metadata URI
- 共有用の Cast 導線

を表示する。

## 7. 非機能要件

### 7.1 パフォーマンス

- Cast 情報取得は通常 3 秒以内を目標とする
- カード生成と IPFS 保存は通常 10 秒以内を目標とする

### 7.2 可観測性

- API エラーはサーバーログに記録する
- 外部 API の失敗理由を最低限分類する
- 画像生成、IPFS 保存、コントラクト送信の各段階を追跡できるようにする

### 7.3 セキュリティ

- Neynar、Pinata の API キーはサーバー側のみで扱う
- クライアントに秘密鍵や秘密情報を渡さない
- MVP の作者確認はサーバー側で行い、将来的に署名検証などでコントラクト側強化を検討する

## 8. 画面仕様

### 8.1 Home

役割:
Cast の入力または自動読込の開始点。

表示内容:

- アプリの一言説明
- Cast URL 入力欄
- MiniApp 起動時は読み込み中表示
- エラー時の再試行導線

### 8.2 Cast Preview

役割:
対象 Cast が正しいか確認する画面。

表示内容:

- Cast 本文
- 投稿者情報
- 投稿日時
- 添付画像の有無
- Warpcast へのリンク

### 8.3 Mint Setup

役割:
NFT として保存する見た目と条件を決める画面。

表示内容:

- スタイル選択 UI
- 添付画像の利用有無
- 価格入力
- ロイヤリティ入力
- 枚数入力
- リアルタイムプレビュー

### 8.4 Confirm

役割:
ミント前の最終確認。

表示内容:

- 対象 Cast
- 設定内容サマリー
- 保存される metadata の要点
- 想定支払い額
- 実行ボタン

### 8.5 Result

役割:
完了確認と次アクション提示。

表示内容:

- 成功または失敗ステータス
- トランザクション hash
- Explorer リンク
- シェア導線

## 9. エラー仕様

最低限、次のケースを個別に扱う。

- Cast が見つからない
- URL 形式が不正
- 投稿者確認に失敗
- 接続ウォレットが作者と一致しない
- Base 以外のチェーンに接続している
- 画像生成に失敗
- IPFS アップロードに失敗
- トランザクションが reject された
- トランザクションが revert した

各ケースで、ユーザーに伝える文言は「何が起きたか」と「次に何をすればよいか」をセットで表示する。

## 10. データモデル

### 10.1 アプリ内部モデル

```ts
type CastRecord = {
  hash: string;
  url: string;
  text: string;
  authorFid: number;
  authorUsername: string;
  authorPfpUrl?: string;
  publishedAt: string;
  embedImageUrl?: string;
};

type MintDraft = {
  castHash: string;
  style: "midnight" | "paper" | "neon" | "minimal";
  includeImage: boolean;
  mintPriceEth: string;
  royaltyBps: number;
  initialSupply: number;
};
```

### 10.2 コントラクトモデル

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

推奨方針:

- `castHash` を一意キーに使う
- URL は表示と参照のために保持する
- メタデータ再生成は MVP では不可とする

## 11. コントラクト要件

### 11.1 規格

- ERC-1155
- ERC-2981

### 11.2 MVP における権限制御の前提

MVP では、Cast 作者確認は Neynar を使ったサーバー側検証で行う。コントラクト単体では Farcaster の作者性を直接検証できないため、将来的に必要であれば、署名付き mint 許可やサーバー署名の検証を追加して権限担保を強める。

### 11.3 ERC-1155 を選ぶ理由

- 同じ Cast に対して複数枚発行しやすい
- 記念 NFT として少量複製の需要に合う
- 将来的に edition 展開しやすい

### 11.4 主要関数

```solidity
function createAndMint(
    bytes32 castHash,
    string calldata castUrl,
    string calldata metadataUri,
    uint256 mintPrice,
    uint96 royaltyBps,
    uint256 amount
) external payable returns (uint256 tokenId);

function mint(
    uint256 tokenId,
    uint256 amount
) external payable;
```

### 11.5 バリデーション

- `castHash` が未登録であること
- `metadataUri` が空でないこと
- `amount > 0`
- `royaltyBps <= 1000`
- `msg.value == mintPrice * amount`

### 11.6 収益処理

MVP ではシンプルさを優先し、売上受取人は作者アドレスとする。ただし送金方式は `transfer` に固定せず、失敗時の安全性を考えて `call` または pull payment を検討対象とする。

## 12. API 仕様

### 12.1 `GET /api/cast`

用途:
Cast URL または cast hash から Cast 情報を取得する。

レスポンス:

```json
{
  "cast": {
    "hash": "0xabc",
    "url": "https://warpcast.com/...",
    "text": "hello",
    "authorFid": 1234,
    "authorUsername": "alice"
  }
}
```

### 12.2 `POST /api/verify-author`

用途:
接続ウォレットが作者本人か確認する。

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
  "verified": true
}
```

### 12.3 `POST /api/generate-card`

用途:
プレビュー用または保存用のカード画像を生成する。

### 12.4 `POST /api/upload-to-ipfs`

用途:
画像と metadata を IPFS に保存し、URI を返す。

レスポンス:

```json
{
  "imageUri": "ipfs://...",
  "metadataUri": "ipfs://..."
}
```

## 13. 外部連携

### 13.1 Neynar

用途:

- Cast 取得
- 作者 FID 取得
- ウォレットアドレスと FID の紐付け確認

### 13.2 Pinata

用途:

- 画像保存
- metadata 保存

### 13.3 Base

用途:

- NFT ミント
- 取引の最終的な公開記録

## 14. 技術構成

- フロントエンド: Next.js 14 + TypeScript
- UI: Tailwind CSS
- ウォレット接続: wagmi v2 + viem
- Web 用ウォレット UI: RainbowKit
- MiniApp SDK: `@farcaster/frame-sdk`
- 画像生成: `satori` + `sharp`
- コントラクト: Solidity + Foundry

## 15. ディレクトリ構成案

```text
cast-to-nft/
├── app/
│   ├── page.tsx
│   ├── cast/[hash]/page.tsx
│   ├── api/
│   │   ├── cast/route.ts
│   │   ├── verify-author/route.ts
│   │   ├── generate-card/route.ts
│   │   ├── upload-to-ipfs/route.ts
│   │   ├── og/route.ts
│   │   └── frame/route.ts
│   ├── components/
│   └── lib/
├── contracts/
│   ├── CastNFT.sol
│   └── test/CastNFT.t.sol
├── public/
└── docs/
```

## 16. 環境変数

```env
NEYNAR_API_KEY=
PINATA_API_KEY=
PINATA_SECRET_API_KEY=
PINATA_GATEWAY_URL=https://gateway.pinata.cloud
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_BASE_CHAIN_ID=8453
NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID=84532
```

## 17. 実装フェーズ

### Phase 1

- Cast 取得
- 作者確認
- カード生成
- IPFS 保存
- Base Sepolia での mint
- Web 版 UI

### Phase 2

- MiniApp 最適化
- フレーム内ウォレット対応の磨き込み
- Base Mainnet 対応

### Phase 3

- ミント済み一覧
- 共有導線の改善
- OpenSea 連携の強化

## 18. 受け入れ基準

- 作者本人の Cast だけがミントできる
- 同じ Cast は二重登録できない
- ミント後に Basescan で確認できる
- metadata URI と image URI が有効
- Web と MiniApp の両方で基本導線が成立する

## 19. 実装時の注意点

- URL ではなく cast hash を主キーにする
- 認可をクライアント側だけで完結させない
- 外部 API エラー時の文言を先に定義する
- `transfer` 前提の送金設計は避ける
- メタデータの不変性をどこまで保証するかを初期段階で決める

## 20. 参照リンク

- Farcaster Frame SDK: https://docs.farcaster.xyz/developers/frames/v2/getting-started
- Neynar Docs: https://docs.neynar.com
- Pinata Docs: https://docs.pinata.cloud
- Base Docs: https://docs.base.org
- wagmi: https://wagmi.sh
- RainbowKit: https://www.rainbowkit.com/docs/introduction
- Satori: https://github.com/vercel/satori
- ERC-1155: https://eips.ethereum.org/EIPS/eip-1155
- ERC-2981: https://eips.ethereum.org/EIPS/eip-2981
