# 修正実行計画書

生成日時: 2025-09-23
分析元: DEPENDENCY_ANALYSIS_REPORT.md, IGNORE_ERRORS.md

## 🔴 Priority 1: 即座修正（ユーザー体験への直接影響）

### 1. テンプレート管理機能の実装
**ファイル**: `src/components/template/TemplateManager.tsx`
**問題**: 複製・エクスポート・インポートボタンが機能しない

#### 実装内容:
```typescript
// L103: handleDuplicateTemplate
const handleDuplicateTemplate = async (template: Template) => {
  try {
    const duplicated = await templateStore.duplicate(template.id);
    toast.success('テンプレートを複製しました');
  } catch (error) {
    toast.error('複製に失敗しました');
  }
};

// L119: handleExportTemplate
const handleExportTemplate = (template: Template) => {
  const data = JSON.stringify(template, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `template-${template.id}.json`;
  a.click();
};

// L132: handleImportTemplate
const handleImportTemplate = async (file: File) => {
  const text = await file.text();
  const templateData = JSON.parse(text);
  await templateStore.create(templateData);
  toast.success('テンプレートをインポートしました');
};
```

### 2. Character参照の削除
**ファイル**: `src/lib/supabase.ts`
**行番号**: 25-33

#### 削除内容:
```diff
- export interface Character {
-   id: string;
-   name: string;
-   description: string;
-   appearance: any;
-   personality: any;
-   created_at: string;
-   updated_at: string;
- }
```

## 🟡 Priority 2: コード品質改善

### 3. デバッグログの削除
**ファイル**: `src/components/prompt/ElementCard.tsx`
**行番号**: 126-165, 37-44, 94-100

#### 修正方法:
```typescript
// 開発環境のみログ出力
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  console.log('Translation params:', {...});
}

// または完全削除
```

### 4. バリエーション生成機能の実装
**ファイル**: `src/components/prompt/ElementEditor.tsx`
**行番号**: 108

#### 実装内容:
```typescript
const handleGenerateVariations = async () => {
  try {
    setIsGenerating(true);
    const variations = await variationService.generate(
      element.content,
      {
        count: 3,
        temperature: 0.8,
        style: 'similar'
      }
    );
    onVariationsGenerated?.(variations);
  } catch (error) {
    console.error('Variation generation failed:', error);
    toast.error('バリエーション生成に失敗しました');
  } finally {
    setIsGenerating(false);
  }
};
```

## ✅ Priority 3: 確認のみ（既に対策済み）

### 5. Geminiエラー処理
**ファイル**: `src/lib/error-handler.ts`
**状態**: IGNORE_ERRORS.mdに記載の通り、ハルシネーションエラーとして処理済み

#### 確認内容:
- エラーハンドラーが正しくハルシネーションパターンを検出
- 該当エラーを自動無視している
- 開発環境でのみ警告表示

## 実装順序

### Phase 1: 緊急修正（30分）
1. ✅ Character参照削除（5分）
2. ✅ デバッグログ削除（10分）
3. ✅ テンプレート複製機能実装（15分）

### Phase 2: 機能実装（1時間）
4. ✅ テンプレートエクスポート機能（20分）
5. ✅ テンプレートインポート機能（20分）
6. ✅ バリエーション生成機能（20分）

### Phase 3: テスト・検証（30分）
7. ✅ 各機能の動作確認
8. ✅ エラーハンドリング確認
9. ✅ ビルド確認

## テスト項目

### テンプレート機能
- [ ] 複製: 既存テンプレートが正しく複製される
- [ ] エクスポート: JSONファイルがダウンロードされる
- [ ] インポート: JSONファイルから正しくインポートされる

### バリエーション生成
- [ ] APIコール成功時: バリエーションが表示される
- [ ] APIコール失敗時: エラーメッセージが表示される

### その他
- [ ] console.logが本番ビルドに含まれない
- [ ] Character参照エラーが発生しない

## リスク評価

| 修正項目 | リスクレベル | 影響範囲 | 対策 |
|----------|------------|----------|------|
| Character削除 | 低 | なし（未使用） | 削除のみ |
| ログ削除 | 低 | デバッグのみ | 条件付き出力 |
| テンプレート機能 | 中 | テンプレート管理 | エラーハンドリング追加 |
| バリエーション生成 | 中 | AI機能 | try-catch実装 |

## 成功基準

- すべてのボタンが機能する
- エラーが適切に処理される
- ビルドエラーがない
- ユーザー体験が改善される

---

実行開始時刻: _______________
実行完了時刻: _______________
実行者: _______________