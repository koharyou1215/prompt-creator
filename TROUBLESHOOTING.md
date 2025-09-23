# トラブルシューティングガイド

## 🔧 修正完了済みの問題

### 1. 設定が永続化されない
✅ **修正済み**: `src/components/settings/SettingsModal.tsx`
- localStorageから保存されたモデル設定を正しく読み込むように修正

### 2. 要素追加がすぐ戻る
✅ **修正済み**:
- `src/stores/promptStore.ts`: 一時的なプロンプトのAPI呼び出しをスキップ
- `app/workspace/page.tsx`: `formatPromptContent`関数を追加

### 3. テンプレート画面から戻れない
✅ **修正済み**: `app/workspace/page.tsx`
- 閉じるボタンを適切に配置

### 4. 翻訳機能の編集
✅ **修正済み**: `src/components/prompt/ElementCard.tsx`
- 翻訳結果の編集機能を追加

### 5. 直接編集機能
✅ **修正済み**: `src/components/prompt/ElementCard.tsx`
- 要素コンテンツをクリックで直接編集可能に

## 🚨 問題が続く場合の対処法

### ブラウザキャッシュの問題

1. **ハードリロードを実行**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **開発者ツールでキャッシュを無効化**
   - F12で開発者ツールを開く
   - Networkタブを開く
   - "Disable cache"にチェック

3. **localStorageをクリア**
   ```javascript
   // ブラウザコンソールで実行
   localStorage.clear();
   location.reload();
   ```

### 開発サーバーの問題

1. **開発サーバーを再起動**
   ```bash
   # Ctrl+C でサーバーを停止
   # .nextフォルダを削除
   rm -rf .next
   # 再起動
   npm run dev
   ```

2. **依存関係の再インストール**
   ```bash
   rm -rf node_modules
   npm install
   ```

## 📝 動作確認チェックリスト

- [ ] 設定画面でモデルを変更 → ページ更新後も保持される
- [ ] 要素を追加 → 正しく追加され、削除されない
- [ ] テンプレート画面 → 閉じるボタンが機能する
- [ ] 翻訳機能 → 結果を編集できる
- [ ] 要素の内容 → クリックで直接編集できる
- [ ] バリエーション生成 → 正常に動作する

## 🔍 デバッグ情報の確認

ブラウザコンソールで以下を確認：

```javascript
// 現在の設定を確認
console.log(localStorage.getItem('modelTranslate'));
console.log(localStorage.getItem('modelOptimize'));
console.log(localStorage.getItem('modelAnalysis'));

// プロンプトストアの状態を確認
const store = usePromptStore.getState();
console.log('Selected Prompt:', store.selectedPrompt);
console.log('All Prompts:', store.prompts);
```

## 💡 既知の問題と回避策

### APIエラー 404 (temp_プロンプト)
- **原因**: 一時的なプロンプトに対してAPIコールを試みている
- **対策**: 修正済み。ブラウザをリロードして新しいコードを読み込む

### ハルシネーションエラー
- **原因**: Claude Codeの幻覚エラー
- **対策**: `IGNORE_ERRORS.md`に記載された対策を実装済み

## 📞 サポート

問題が解決しない場合は、以下の情報を提供してください：

1. ブラウザコンソールのエラーメッセージ
2. ネットワークタブのエラーリクエスト
3. 実行した操作の手順
4. 使用しているブラウザとバージョン