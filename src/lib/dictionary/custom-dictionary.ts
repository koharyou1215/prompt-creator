interface DictionaryEntry {
  id: string;
  original: string;
  translation: string;
  category: string;
  context?: string;
  examples?: string[];
  priority: number;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

interface DictionaryCategory {
  id: string;
  name: string;
  description: string;
  entries: DictionaryEntry[];
}

export class CustomDictionary {
  private entries: Map<string, DictionaryEntry> = new Map();
  private categories: Map<string, DictionaryCategory> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initializeDefaults();
  }

  /**
   * Initialize with default technical terms
   */
  private initializeDefaults() {
    const defaultCategories = [
      {
        id: 'technical',
        name: '技術用語',
        description: '画像生成AI関連の技術用語'
      },
      {
        id: 'style',
        name: 'スタイル',
        description: '画風や芸術スタイルの用語'
      },
      {
        id: 'quality',
        name: '品質',
        description: '画質や品質に関する用語'
      },
      {
        id: 'composition',
        name: '構図',
        description: '構図やレイアウトの用語'
      }
    ];

    const defaultEntries = [
      // Technical terms
      { original: 'masterpiece', translation: '傑作', category: 'technical', priority: 10 },
      { original: 'best quality', translation: '最高品質', category: 'technical', priority: 10 },
      { original: 'high resolution', translation: '高解像度', category: 'technical', priority: 9 },
      { original: 'detailed', translation: '詳細な', category: 'technical', priority: 8 },
      { original: 'realistic', translation: 'リアルな', category: 'technical', priority: 8 },

      // Style terms
      { original: 'anime style', translation: 'アニメ風', category: 'style', priority: 9 },
      { original: 'oil painting', translation: '油絵', category: 'style', priority: 8 },
      { original: 'watercolor', translation: '水彩画', category: 'style', priority: 8 },
      { original: 'digital art', translation: 'デジタルアート', category: 'style', priority: 8 },
      { original: 'photorealistic', translation: 'フォトリアル', category: 'style', priority: 9 },

      // Quality terms
      { original: 'sharp focus', translation: 'シャープフォーカス', category: 'quality', priority: 7 },
      { original: 'bokeh', translation: 'ボケ', category: 'quality', priority: 7 },
      { original: 'depth of field', translation: '被写界深度', category: 'quality', priority: 7 },
      { original: 'HDR', translation: 'HDR', category: 'quality', priority: 6 },
      { original: '8K', translation: '8K', category: 'quality', priority: 8 },

      // Composition terms
      { original: 'centered', translation: '中央配置', category: 'composition', priority: 7 },
      { original: 'rule of thirds', translation: '三分割法', category: 'composition', priority: 8 },
      { original: 'golden ratio', translation: '黄金比', category: 'composition', priority: 8 },
      { original: 'symmetrical', translation: '対称的な', category: 'composition', priority: 7 },
      { original: 'dynamic angle', translation: 'ダイナミックアングル', category: 'composition', priority: 8 }
    ];

    // Initialize categories
    defaultCategories.forEach(cat => {
      this.categories.set(cat.id, {
        ...cat,
        entries: []
      });
    });

    // Add default entries
    defaultEntries.forEach((entry, index) => {
      this.addEntry({
        id: `default_${index}`,
        ...entry,
        context: '',
        examples: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0
      });
    });

    this.initialized = true;
  }

  /**
   * Add new dictionary entry
   */
  addEntry(entry: DictionaryEntry): void {
    this.entries.set(entry.original.toLowerCase(), entry);

    // Add to category
    const category = this.categories.get(entry.category);
    if (category && !category.entries.some(e => e.id === entry.id)) {
      category.entries.push(entry);
    }
  }

  /**
   * Update existing entry
   */
  updateEntry(id: string, updates: Partial<DictionaryEntry>): void {
    const entry = Array.from(this.entries.values()).find(e => e.id === id);
    if (entry) {
      const updatedEntry = {
        ...entry,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.entries.delete(entry.original.toLowerCase());
      this.entries.set(updatedEntry.original.toLowerCase(), updatedEntry);

      // Update in category
      const category = this.categories.get(updatedEntry.category);
      if (category) {
        const index = category.entries.findIndex(e => e.id === id);
        if (index !== -1) {
          category.entries[index] = updatedEntry;
        }
      }
    }
  }

  /**
   * Delete entry
   */
  deleteEntry(id: string): void {
    const entry = Array.from(this.entries.values()).find(e => e.id === id);
    if (entry) {
      this.entries.delete(entry.original.toLowerCase());

      // Remove from category
      const category = this.categories.get(entry.category);
      if (category) {
        category.entries = category.entries.filter(e => e.id !== id);
      }
    }
  }

  /**
   * Translate text using custom dictionary
   */
  translate(text: string, direction: 'toJapanese' | 'toEnglish' = 'toJapanese'): string {
    let result = text;
    const sortedEntries = Array.from(this.entries.values())
      .sort((a, b) => b.priority - a.priority || b.original.length - a.original.length);

    sortedEntries.forEach(entry => {
      if (direction === 'toJapanese') {
        const regex = new RegExp(`\\b${this.escapeRegex(entry.original)}\\b`, 'gi');
        result = result.replace(regex, entry.translation);
      } else {
        const regex = new RegExp(this.escapeRegex(entry.translation), 'gi');
        result = result.replace(regex, entry.original);
      }

      // Increment usage count
      entry.usageCount++;
    });

    return result;
  }

  /**
   * Get suggestions for a term
   */
  getSuggestions(term: string): DictionaryEntry[] {
    const lowerTerm = term.toLowerCase();
    const exact = this.entries.get(lowerTerm);

    const suggestions: DictionaryEntry[] = [];
    if (exact) {
      suggestions.push(exact);
    }

    // Find partial matches
    Array.from(this.entries.values()).forEach(entry => {
      if (entry.original.toLowerCase().includes(lowerTerm) ||
          entry.translation.includes(term)) {
        if (!suggestions.some(s => s.id === entry.id)) {
          suggestions.push(entry);
        }
      }
    });

    return suggestions.slice(0, 5);
  }

  /**
   * Import dictionary from JSON
   */
  importDictionary(data: any): void {
    if (data.entries && Array.isArray(data.entries)) {
      data.entries.forEach((entry: DictionaryEntry) => {
        this.addEntry({
          ...entry,
          id: entry.id || `imported_${Date.now()}_${Math.random()}`,
          createdAt: entry.createdAt || new Date().toISOString(),
          updatedAt: entry.updatedAt || new Date().toISOString(),
          usageCount: entry.usageCount || 0
        });
      });
    }

    if (data.categories && Array.isArray(data.categories)) {
      data.categories.forEach((cat: DictionaryCategory) => {
        if (!this.categories.has(cat.id)) {
          this.categories.set(cat.id, cat);
        }
      });
    }
  }

  /**
   * Export dictionary to JSON
   */
  exportDictionary(): any {
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      entries: Array.from(this.entries.values()),
      categories: Array.from(this.categories.values()).map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description
      }))
    };
  }

  /**
   * Get all entries
   */
  getAllEntries(): DictionaryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Get entries by category
   */
  getEntriesByCategory(categoryId: string): DictionaryEntry[] {
    const category = this.categories.get(categoryId);
    return category ? category.entries : [];
  }

  /**
   * Get all categories
   */
  getAllCategories(): DictionaryCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Search entries
   */
  searchEntries(query: string): DictionaryEntry[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.entries.values()).filter(entry =>
      entry.original.toLowerCase().includes(lowerQuery) ||
      entry.translation.includes(query) ||
      entry.context?.includes(query) ||
      entry.examples?.some(ex => ex.includes(query))
    );
  }

  /**
   * Get most used entries
   */
  getMostUsedEntries(limit: number = 10): DictionaryEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats(): void {
    this.entries.forEach(entry => {
      entry.usageCount = 0;
    });
  }

  // Helper method to escape regex special characters
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Singleton instance
export const customDictionary = new CustomDictionary();