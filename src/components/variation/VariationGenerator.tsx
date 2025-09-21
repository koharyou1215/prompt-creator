'use client';

import { useState } from 'react';
import {
  Wand2, Sparkles, Copy, Download, RefreshCw,
  ChevronDown, ChevronUp, Settings, Grid3x3
} from 'lucide-react';
import { Prompt, PromptElement } from '@/types/prompt';
import { VariationEngine } from '@/lib/ai/variation-engine';

interface VariationGeneratorProps {
  prompt: Prompt;
  onVariationSelect?: (variation: string) => void;
  onBatchGenerate?: (variations: string[]) => void;
}

interface VariationParameter {
  id: string;
  name: string;
  type: 'style' | 'detail' | 'mood' | 'composition' | 'custom';
  options: string[];
  selected: string[];
}

export function VariationGenerator({
  prompt,
  onVariationSelect,
  onBatchGenerate
}: VariationGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVariations, setGeneratedVariations] = useState<string[]>([]);
  const [selectedVariations, setSelectedVariations] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewMode, setPreviewMode] = useState<'list' | 'grid'>('grid');

  const [parameters, setParameters] = useState<VariationParameter[]>([
    {
      id: 'hair',
      name: '髪色',
      type: 'custom',
      options: ['金髪', '黒髪', '茶髪', '赤髪', '青髪', '銀髪', '紫髪'],
      selected: []
    },
    {
      id: 'clothing',
      name: '服装',
      type: 'custom',
      options: ['カジュアル', 'フォーマル', '制服', '着物', 'ドレス', 'スポーツウェア'],
      selected: []
    },
    {
      id: 'style',
      name: 'スタイル',
      type: 'style',
      options: ['アニメ調', 'リアル調', '油絵風', '水彩画風', 'デジタルアート', 'ミニマリスト'],
      selected: []
    },
    {
      id: 'mood',
      name: 'ムード',
      type: 'mood',
      options: ['明るい', '暗い', '神秘的', 'ドラマティック', '穏やか', 'エネルギッシュ'],
      selected: []
    },
    {
      id: 'composition',
      name: '構図',
      type: 'composition',
      options: ['クローズアップ', 'ワイドアングル', '鳥瞰図', 'ダッチアングル', '対称', '三分割法'],
      selected: []
    }
  ]);

  const [variationCount, setVariationCount] = useState(5);
  const [includeNegative, setIncludeNegative] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(true);

  const engine = new VariationEngine();

  const handleParameterToggle = (parameterId: string, option: string) => {
    setParameters(params =>
      params.map(param => {
        if (param.id === parameterId) {
          const newSelected = param.selected.includes(option)
            ? param.selected.filter(s => s !== option)
            : [...param.selected, option];
          return { ...param, selected: newSelected };
        }
        return param;
      })
    );
  };

  const generateVariations = async () => {
    setIsGenerating(true);
    setGeneratedVariations([]);

    try {
      const variations: string[] = [];

      // Generate base variations for each parameter
      for (const param of parameters) {
        if (param.selected.length === 0) continue;

        // For each selected option, create a variation
        for (const option of param.selected) {
          const basePromptText = prompt.elements
            ?.map(el => el.content)
            .join(', ') || prompt.content;

          let variation = basePromptText;

          // Apply the variation based on parameter type
          switch (param.id) {
            case 'hair':
              variation = variation.replace(/髪|hair/gi, `${option}`);
              break;
            case 'clothing':
              variation = `${variation}, wearing ${option}`;
              break;
            case 'style':
              variation = `${variation}, ${option} style`;
              break;
            case 'mood':
              variation = `${variation}, ${option} mood`;
              break;
            case 'composition':
              variation = `${variation}, ${option} composition`;
              break;
          }

          variations.push(variation);
        }
      }

      // If no parameters selected, generate smart variations
      if (variations.length === 0) {
        const elements = prompt.elements || [];
        for (let i = 0; i < Math.min(variationCount, elements.length); i++) {
          const smartVariations = await engine.generateSmartVariations(
            elements[i],
            1
          );
          variations.push(...smartVariations);
        }
      }

      // Generate combined variations up to the requested count
      const finalVariations: string[] = [];
      const combinations = Math.min(variationCount, variations.length);

      for (let i = 0; i < combinations; i++) {
        if (i < variations.length) {
          finalVariations.push(variations[i]);
        } else {
          // Generate mixed combinations
          const combo = variations
            .sort(() => Math.random() - 0.5)
            .slice(0, 2)
            .join(', ');
          finalVariations.push(combo);
        }
      }

      setGeneratedVariations(finalVariations);
    } catch (error) {
      console.error('Variation generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVariationClick = (variation: string) => {
    if (selectedVariations.has(variation)) {
      const newSelected = new Set(selectedVariations);
      newSelected.delete(variation);
      setSelectedVariations(newSelected);
    } else {
      setSelectedVariations(new Set([...selectedVariations, variation]));
    }

    if (onVariationSelect) {
      onVariationSelect(variation);
    }
  };

  const handleBatchAction = () => {
    if (onBatchGenerate) {
      onBatchGenerate(Array.from(selectedVariations));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadVariations = () => {
    const content = generatedVariations.join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `variations_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">バリエーション生成</h3>
              <p className="text-sm text-gray-500">
                パラメータを調整して複数のバリエーションを作成
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Settings className="w-4 h-4" />
            詳細設定
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Parameters */}
      <div className="p-6 space-y-4">
        {parameters.map(param => (
          <div key={param.id} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {param.name}
            </label>
            <div className="flex flex-wrap gap-2">
              {param.options.map(option => (
                <button
                  key={option}
                  onClick={() => handleParameterToggle(param.id, option)}
                  className={`
                    px-3 py-1 rounded-lg text-sm transition-colors
                    ${param.selected.includes(option)
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                    border
                  `}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                生成数
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={variationCount}
                  onChange={(e) => setVariationCount(parseInt(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-gray-600 w-8">{variationCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                ネガティブプロンプトを含める
              </label>
              <input
                type="checkbox"
                checked={includeNegative}
                onChange={(e) => setIncludeNegative(e.target.checked)}
                className="w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                自動最適化
              </label>
              <input
                type="checkbox"
                checked={autoOptimize}
                onChange={(e) => setAutoOptimize(e.target.checked)}
                className="w-4 h-4"
              />
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={generateVariations}
          disabled={isGenerating}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              バリエーションを生成
            </>
          )}
        </button>
      </div>

      {/* Generated Variations */}
      {generatedVariations.length > 0 && (
        <div className="border-t">
          <div className="px-6 py-4 flex items-center justify-between">
            <h4 className="font-medium">
              生成されたバリエーション ({generatedVariations.length})
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(previewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={downloadVariations}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`
            px-6 pb-6
            ${previewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}
          `}>
            {generatedVariations.map((variation, index) => (
              <div
                key={index}
                onClick={() => handleVariationClick(variation)}
                className={`
                  p-4 border rounded-lg cursor-pointer transition-colors
                  ${selectedVariations.has(variation)
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 hover:bg-gray-100'}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="text-xs text-gray-500">
                      バリエーション {index + 1}
                    </span>
                    <p className="text-sm mt-1 line-clamp-3">{variation}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(variation);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedVariations.size > 0 && (
            <div className="px-6 py-4 border-t bg-gray-50">
              <button
                onClick={handleBatchAction}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                選択した{selectedVariations.size}個のバリエーションを使用
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}