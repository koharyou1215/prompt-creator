# prompt-creator

AI画像生成プロンプト作成ツール

## 開発環境のセットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成して以下の環境変数を設定してください：

```env
# OpenRouter API Key (必須)
OPENROUTER_API_KEY=your_actual_api_key_here

# Next.js の設定
NEXT_PUBLIC_APP_URL=http://localhost:3020

# WebSocket URL (オプション)
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Redis URL (オプション - Upstash Redis を使用する場合)
UPSTASH_REDIS_REST_URL=your_redis_url_here

# データベース URL (オプション - Prisma を使用する場合)
DATABASE_URL=your_database_url_here
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3020 にアクセスしてください。

## 機能

- ✅ プロンプト作成・編集
- ✅ AI最適化
- ✅ 翻訳機能
- ✅ プロンプト比較
- ✅ キャラクター情報抽出
- ✅ バリエーション生成
- ✅ キャッシュ機能
- ✅ リアルタイム機能
- ✅ セキュリティ検証

## トラブルシューティング

### faviconエラー
faviconファイルが存在しない場合、ブラウザは自動的にデフォルトのfaviconを使用します。エラーは無視してください。

### 500 Internal Server Error
環境変数 `OPENROUTER_API_KEY` が正しく設定されているか確認してください。

### API エラー
OpenRouter API キーが必要です。https://openrouter.ai/ でアカウントを作成してAPIキーを取得してください。