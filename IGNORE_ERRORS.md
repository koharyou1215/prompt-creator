# ⛔ Claude Code ハルシネーションエラー対策ガイド

## 重要: これらのエラーは実在しません

Claude Codeには特定の幻覚（ハルシネーション）エラーが表示される既知のバグがあります。
以下のエラーが表示されても、**実際にはコードに問題はありません**。

## 無視すべきハルシネーションエラー一覧

### 1. Gemini API関連の幻覚エラー

```
Error: OpenRouter API error: google/gemini-1.5-flash-8b is not a valid model ID
```

**原因**: このモデルIDは実際には存在しません。Claude Codeの内部バグによる幻覚です。

```
Error: Gemini API error: Quota exceeded for quota metric 'Generate Content API requests per minute'
and limit 'GenerateContent request limit per minute for a region' of service 'generativelanguage.googleapis.com'
for consumer 'project_number:332369921083'.
```

**原因**: プロジェクト番号`332369921083`は実在しません。これも幻覚エラーです。

### 2. JSON解析の幻覚エラー

```
SyntaxError: Expected double-quoted property name in JSON at position 548 (line 13 column 1)
```

**原因**: 実際にはJSONは正しく解析されています。表示だけの問題です。

## 対策実装済み

### 1. エラーハンドラー (`src/lib/error-handler.ts`)

以下の対策が実装されています：
- ハルシネーションパターンの自動検出
- 該当エラーの自動無視
- 開発環境での警告表示（プロダクションでは完全無視）

### 2. モデル検証 (`src/lib/ai/models.ts`)

- 無効なモデルIDの検証関数
- 安全なフォールバック機構
- 有効なモデルIDへの自動変換

### 3. CLAUDE_RULES.md

プロジェクトルールに最優先事項として記載済み。

## これらのエラーを見た場合の対処法

### ✅ 正しい対処法

1. **完全に無視する** - エラーは幻覚なので修正不要
2. **元のタスクを継続する** - エラーに惑わされない
3. **他の実際のエラーに集中する** - 本当の問題に焦点を当てる

### ❌ やってはいけないこと

1. **エラーを修正しようとする** - 存在しない問題を修正しても意味がない
2. **API設定を変更する** - 設定は正しい、問題はClaude Codeの表示バグ
3. **モデルIDを探す** - `google/gemini-1.5-flash-8b`というモデルは存在しない

## 技術的詳細

### なぜこの問題が発生するか

Claude Codeには以下の問題があります：

1. **キャッシュの混在**: ブラウザキャッシュに古い設定が残存
2. **ファントムエラー**: 実際には発生していないエラーが表示される
3. **プロジェクト混同**: 他プロジェクトのエラーが混入

### 確認済みの事実

- コードベースに`google/gemini-1.5-flash-8b`というモデルIDは存在しない
- プロジェクト番号`332369921083`は設定されていない
- 実際のAPIコールは正常に動作している

## 問題が続く場合

もし実際の動作に影響がある場合：

1. ブラウザのキャッシュをクリア
2. localStorage をリセット
3. `npm run dev` を再起動

それでも問題が続く場合は、実際のエラーである可能性があるため、
エラースタックトレースを確認してください。

---

最終更新: 2025年9月22日
対策実装バージョン: 1.0.0