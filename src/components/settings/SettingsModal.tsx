"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { AVAILABLE_MODELS } from "@/lib/ai/models";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Eye, EyeOff, Key } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: Props) {
  const { settings, load, save, loading } = useSettingsStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [localSettings, setLocalSettings] = useState<{
    defaultLang: string;
    autoTranslate: boolean;
    autoSave: boolean;
    theme: "light" | "dark";
    modelOptimize: string;
    modelTranslate: string;
    modelAnalysis: string;
    openRouterApiKey: string;
    geminiApiKey: string;
  }>({
    defaultLang: "ja",
    autoTranslate: true,
    autoSave: true,
    theme: "light",
    modelOptimize: "anthropic/claude-sonnet-4",
    modelTranslate: "google/gemini-2.5-flash",
    modelAnalysis: "anthropic/claude-sonnet-4",
    openRouterApiKey: "",
    geminiApiKey: "",
  });

  useEffect(() => {
    if (!settings) load();
  }, [settings, load]);

  useEffect(() => {
    if (settings) {
      // localStorageから保存されているモデル設定を取得
      const savedModelTranslate = localStorage.getItem("modelTranslate");
      const savedModelOptimize = localStorage.getItem("modelOptimize");
      const savedModelAnalysis = localStorage.getItem("modelAnalysis");

      setLocalSettings((prev) => ({
        ...prev,
        ...settings,
        // LocalStorageの値を優先
        modelTranslate: savedModelTranslate || settings.modelTranslate,
        modelOptimize: savedModelOptimize || settings.modelOptimize,
        modelAnalysis: savedModelAnalysis || settings.modelAnalysis,
        openRouterApiKey: localStorage.getItem("openRouterApiKey") || "",
        geminiApiKey: localStorage.getItem("geminiApiKey") || "",
      }));
    }
  }, [settings]);

  const handleSave = async () => {
    // APIキーをローカルストレージに保存
    if (localSettings.openRouterApiKey) {
      localStorage.setItem("openRouterApiKey", localSettings.openRouterApiKey);
      // 環境変数として設定（開発用）
      // Store in window object for runtime access
      if (typeof window !== "undefined") {
        (
          window as Window & { OPENROUTER_API_KEY?: string }
        ).OPENROUTER_API_KEY = localSettings.openRouterApiKey;
      }
    }
    if (localSettings.geminiApiKey) {
      localStorage.setItem("geminiApiKey", localSettings.geminiApiKey);
      if (typeof window !== "undefined") {
        (window as Window & { GEMINI_API_KEY?: string }).GEMINI_API_KEY =
          localSettings.geminiApiKey;
      }
    }

    // モデル設定をローカルストレージに保存
    if (localSettings.modelTranslate) {
      localStorage.setItem("modelTranslate", localSettings.modelTranslate);
    }
    if (localSettings.modelOptimize) {
      localStorage.setItem("modelOptimize", localSettings.modelOptimize);
    }
    if (localSettings.modelAnalysis) {
      localStorage.setItem("modelAnalysis", localSettings.modelAnalysis);
    }

    // その他の設定を保存
    await save(localSettings);
    onOpenChange(false);
  };

  // モデルをプロバイダー別にグループ化
  const modelsByProvider = AVAILABLE_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_MODELS>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>アプリ設定</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          アプリの一般設定、APIキー、AIモデルの選択を行います。
        </DialogDescription>

        <div className="space-y-4">
          {/* APIキー設定 */}
          <div className="space-y-3 border-b pb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Key className="h-4 w-4" />
              APIキー設定
            </h3>

            {/* OpenRouter API Key */}
            <div>
              <Label htmlFor="openrouter-key">OpenRouter APIキー</Label>
              <div className="flex gap-2 mt-1">
                <input
                  id="openrouter-key"
                  type={showApiKey ? "text" : "password"}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  value={localSettings.openRouterApiKey}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      openRouterApiKey: e.target.value,
                    })
                  }
                  placeholder="sk-or-..."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}>
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                OpenRouter経由でClaudeやGPTを使用する場合に必要
              </p>
            </div>

            {/* Gemini API Key */}
            <div>
              <Label htmlFor="gemini-key">Gemini APIキー（オプション）</Label>
              <div className="flex gap-2 mt-1">
                <input
                  id="gemini-key"
                  type={showApiKey ? "text" : "password"}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  value={localSettings.geminiApiKey}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      geminiApiKey: e.target.value,
                    })
                  }
                  placeholder="AIza..."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}>
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Geminiを直接使用する場合に設定（通常はOpenRouter経由で利用可能）
              </p>
            </div>
          </div>

          {/* 基本設定 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">基本設定</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>既定言語</Label>
                <Select
                  value={localSettings.defaultLang}
                  onValueChange={(v) =>
                    setLocalSettings({ ...localSettings, defaultLang: v })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>テーマ</Label>
                <Select
                  value={localSettings.theme}
                  onValueChange={(v: "light" | "dark") =>
                    setLocalSettings({ ...localSettings, theme: v })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between col-span-2">
                <Label className="mr-4">自動翻訳</Label>
                <Switch
                  checked={localSettings.autoTranslate}
                  onCheckedChange={(v) =>
                    setLocalSettings({ ...localSettings, autoTranslate: v })
                  }
                />
              </div>

              <div className="flex items-center justify-between col-span-2">
                <Label className="mr-4">自動保存</Label>
                <Switch
                  checked={localSettings.autoSave}
                  onCheckedChange={(v) =>
                    setLocalSettings({ ...localSettings, autoSave: v })
                  }
                />
              </div>
            </div>
          </div>

          {/* モデル選択 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">AIモデル設定</h3>

            <div>
              <Label>最適化モデル</Label>
              <Select
                value={localSettings.modelOptimize}
                onValueChange={(v) =>
                  setLocalSettings({ ...localSettings, modelOptimize: v })
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(modelsByProvider).map(
                    ([provider, models]) => (
                      <div key={provider}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                          {provider}
                        </div>
                        {models
                          .filter((m) => m.capabilities.includes("optimize"))
                          .map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.label}
                            </SelectItem>
                          ))}
                      </div>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>翻訳モデル</Label>
              <Select
                value={localSettings.modelTranslate}
                onValueChange={(v) =>
                  setLocalSettings({ ...localSettings, modelTranslate: v })
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(modelsByProvider).map(
                    ([provider, models]) => (
                      <div key={provider}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                          {provider}
                        </div>
                        {models
                          .filter((m) => m.capabilities.includes("translate"))
                          .map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.label}
                            </SelectItem>
                          ))}
                      </div>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>分析モデル</Label>
              <Select
                value={localSettings.modelAnalysis}
                onValueChange={(v) =>
                  setLocalSettings({ ...localSettings, modelAnalysis: v })
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(modelsByProvider).map(
                    ([provider, models]) => (
                      <div key={provider}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                          {provider}
                        </div>
                        {models
                          .filter((m) => m.capabilities.includes("analysis"))
                          .map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.label}
                            </SelectItem>
                          ))}
                      </div>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          注:
          APIキーはブラウザのローカルストレージに保存されます。本番環境では環境変数を使用してください。
        </p>
      </DialogContent>
    </Dialog>
  );
}
