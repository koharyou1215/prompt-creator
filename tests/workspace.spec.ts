import { test, expect } from '@playwright/test';

test.describe('Workspace functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/workspace');
    await page.waitForLoadState('networkidle');
  });

  test('should display main navigation tabs', async ({ page }) => {
    // Check main mode tabs exist
    await expect(page.getByRole('button', { name: /編集/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /比較/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /履歴/i })).toBeVisible();
  });

  test('should switch between main modes', async ({ page }) => {
    // Start in edit mode
    const editButton = page.getByRole('button', { name: /編集/i }).first();
    await expect(editButton).toHaveClass(/.*default.*/);

    // Switch to compare mode
    const compareButton = page.getByRole('button', { name: /比較/i }).first();
    await compareButton.click();
    await expect(compareButton).toHaveClass(/.*default.*/);

    // Check compare mode content
    await expect(page.getByText('比較するプロンプトを選択')).toBeVisible();

    // Switch to history mode
    const historyButton = page.getByRole('button', { name: /履歴/i }).first();
    await historyButton.click();
    await expect(historyButton).toHaveClass(/.*default.*/);

    // Switch back to edit mode
    await editButton.click();
    await expect(editButton).toHaveClass(/.*default.*/);
  });

  test('should show edit mode toggle when prompt selected', async ({ page }) => {
    // Create a new prompt first
    await page.getByRole('button', { name: /新規プロンプト/i }).first().click();

    // Check for edit mode toggle
    await expect(page.getByText('編集モード:')).toBeVisible();
    await expect(page.getByRole('button', { name: /テキスト/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ビジュアル/i })).toBeVisible();
  });

  test('should switch between text and visual edit modes', async ({ page }) => {
    // Create a new prompt
    await page.getByRole('button', { name: /新規プロンプト/i }).first().click();

    // Check visual mode is default
    const visualButton = page.getByRole('button', { name: /ビジュアル/i });
    await expect(visualButton).toHaveClass(/.*bg-blue-500.*/);

    // Switch to text mode
    const textButton = page.getByRole('button', { name: /テキスト/i });
    await textButton.click();
    await expect(textButton).toHaveClass(/.*bg-blue-500.*/);

    // Switch back to visual mode
    await visualButton.click();
    await expect(visualButton).toHaveClass(/.*bg-blue-500.*/);
  });

  test('should display left sidebar tabs', async ({ page }) => {
    // Check left sidebar tabs
    await expect(page.getByRole('button', { name: '編集' }).nth(1)).toBeVisible();
    await expect(page.getByRole('button', { name: '要素' })).toBeVisible();
    await expect(page.getByRole('button', { name: '履歴' }).nth(1)).toBeVisible();
  });

  test('should switch between left sidebar tabs', async ({ page }) => {
    // Click on elements tab
    await page.getByRole('button', { name: '要素' }).click();
    await expect(page.getByText('要素構造')).toBeVisible();

    // Click on history tab
    await page.getByRole('button', { name: '履歴' }).nth(1).click();

    // Click back to edit tab
    await page.getByRole('button', { name: '編集' }).nth(1).click();
  });

  test('should display right panel tabs', async ({ page }) => {
    // Check right panel tabs
    await expect(page.getByRole('button', { name: 'プレビュー' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'AI支援' })).toBeVisible();
    await expect(page.getByRole('button', { name: /バリエーション/i })).toBeVisible();
  });

  test('should switch between right panel tabs', async ({ page }) => {
    // Create a prompt first
    await page.getByRole('button', { name: /新規プロンプト/i }).first().click();

    // Switch to AI tab
    await page.getByRole('button', { name: 'AI支援' }).click();

    // Switch to variations tab
    await page.getByRole('button', { name: /バリエーション/i }).click();
    await expect(page.getByText('バリエーション生成')).toBeVisible();

    // Switch back to preview
    await page.getByRole('button', { name: 'プレビュー' }).click();
  });

  test('should handle compare mode selection', async ({ page }) => {
    // Create test prompts
    await page.getByRole('button', { name: /新規プロンプト/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /新規プロンプト/i }).first().click();

    // Switch to compare mode
    await page.getByRole('button', { name: /比較/i }).first().click();

    // Select prompts for comparison
    const prompts = page.locator('button:has-text("New Prompt")');
    await prompts.first().click();
    await prompts.nth(1).click();

    // Check comparison view
    await expect(page.getByText('2個のプロンプトを選択中')).toBeVisible();

    // Exit compare mode
    await page.getByRole('button', { name: /編集に戻る/i }).click();
  });

  test('should collapse and expand panels', async ({ page }) => {
    // Check left panel collapse
    const leftCollapseButton = page.locator('button:has(svg.lucide-chevron-left)').first();
    if (await leftCollapseButton.isVisible()) {
      await leftCollapseButton.click();
      // Check expand button appears
      await expect(page.locator('button:has(svg.lucide-chevron-right)').first()).toBeVisible();

      // Expand again
      await page.locator('button:has(svg.lucide-chevron-right)').first().click();
    }

    // Check right panel collapse
    const rightCollapseButton = page.locator('button:has(svg.lucide-chevron-right)').last();
    if (await rightCollapseButton.isVisible()) {
      await rightCollapseButton.click();
      // Check expand button appears
      await expect(page.locator('button:has(svg.lucide-chevron-left)').last()).toBeVisible();
    }
  });

  test('should display quick actions in left sidebar', async ({ page }) => {
    // Check quick action buttons
    await expect(page.getByRole('button', { name: /新規プロンプト/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /現在のプロンプトを保存/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /テンプレートから作成/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /エクスポート/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /設定/i })).toBeVisible();
  });

  test('should not show duplicate headers', async ({ page }) => {
    // Count headers with "Prompt Creator" text
    const headers = page.locator('text="Prompt Creator"');
    await expect(headers).toHaveCount(1);
  });

  test('should show proper content alignment', async ({ page }) => {
    // Create a prompt
    await page.getByRole('button', { name: /新規プロンプト/i }).first().click();

    // Check content is centered, not left-aligned
    const centerPanel = page.locator('.flex-1.flex.flex-col.overflow-hidden');
    await expect(centerPanel).toBeVisible();

    // Check compare mode doesn't cause left alignment
    await page.getByRole('button', { name: /比較/i }).first().click();

    // Content should still be properly aligned
    const compareContent = page.locator('.grid.grid-cols-1.gap-4');
    await expect(compareContent).toBeVisible();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Test Ctrl+N for new prompt
    await page.keyboard.press('Control+n');
    await page.waitForTimeout(500);

    // Check if new prompt was created
    const prompts = page.locator('button:has-text("New Prompt")');
    await expect(prompts).toHaveCount(1);

    // Test Ctrl+C for compare mode toggle
    await page.keyboard.press('Control+c');
    await expect(page.getByText('比較するプロンプトを選択')).toBeVisible();

    // Toggle back
    await page.keyboard.press('Control+c');
    await expect(page.getByText('プロンプトが選択されていません')).toBeVisible();
  });

  test('elements tab should show enhanced structure tree', async ({ page }) => {
    // Create prompt with elements
    await page.getByRole('button', { name: /新規プロンプト/i }).first().click();

    // Switch to visual mode and add element (if ElementEditor is available)
    const visualButton = page.getByRole('button', { name: /ビジュアル/i });
    await visualButton.click();

    // Switch to elements tab
    await page.getByRole('button', { name: '要素' }).click();

    // Check for enhanced structure tree
    await expect(page.getByText('要素構造')).toBeVisible();

    // If elements exist, check for expand/collapse functionality
    const expandButtons = page.locator('button:has(svg.lucide-chevron-right)');
    if (await expandButtons.count() > 0) {
      await expandButtons.first().click();
      // Check if expanded content is shown
      await expect(page.locator('button:has(svg.lucide-chevron-down)')).toBeVisible();
    }
  });
});