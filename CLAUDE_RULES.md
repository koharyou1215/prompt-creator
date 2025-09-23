# Claude Code 開発ルール - Prompt Creator Project

## 🔴 最優先事項 - ハルシネーションエラー対策

### ⛔ 絶対無視必須エラー（存在しない幻覚エラー）
以下のエラーメッセージは**実際には存在しません**。Claude Codeのシステムバグによる幻覚です：

```
1. OpenRouter API error: google/gemini-1.5-flash-8b is not a valid model ID
2. Gemini API error: Quota exceeded for quota metric 'Generate Content API requests per minute'
3. SyntaxError: Expected double-quoted property name in JSON at position 548
```

**これらを見ても絶対に：**
- 修正しない
- 調査しない
- コードを変更しない
- 元のタスクから逸脱しない

詳細は `IGNORE_ERRORS.md` を参照

## 🚫 厳重注意事項（絶対遵守）

### ディレクトリ固定ルール
- **作業ディレクトリ**: `C:\projects\prompt-creator` で固定
- **絶対に移動禁止**: `C:\ai-chat-v3\ai-chat-app-new` への移動は厳禁
- **プロジェクト混同禁止**: 他プロジェクトの設定やエラーと混同しない

### 型安全性の確保
- ✅ **推奨**: `unknown`型 + 型ガード
  - メリット: 実行時エラーを防ぎ、型の整合性を保証
  - デメリット: 初期実装コストがやや高い
- ❌ **避けるべき**: `any`型の使用
  - 型チェックが無効化され、実行時エラーの温床になる

### コード品質ルール
- **Read Before Edit**: ファイル編集前に必ず内容を確認
- **型定義優先**: 新機能追加前に型定義を整備
- **エラーハンドリング統一**: 一貫したエラーレスポンス形式を維持
- **テスト必須**: 変更後は必ずビルドとlintを実行

## 📋 プロジェクト固有の注意事項

### 現在のプロジェクト状態
- **プロジェクト名**: Prompt Creator
- **技術スタック**: Next.js 14, TypeScript, Supabase, Zustand
- **主要機能**: AI画像生成プロンプト作成・管理ツール

### 既知の問題点
1. **UsageTracker**: Prisma依存（Supabaseに移行必要）
2. **型安全性**: 一部で`any`型が使用されている
3. **モデルID**: 一部で無効なモデルIDが残存している可能性

### 修正優先順位
1. Supabase統合の完全化
2. 型安全性の強化
3. エラーハンドリングの改善
4. ビルド最適化

## ✅ ビルド前チェックリスト
- [ ] `npm run lint` でエラーなし
- [ ] `npm run build` で警告なし
- [ ] TypeScript型エラーなし
- [ ] Supabase接続確認
- [ ] 環境変数設定確認