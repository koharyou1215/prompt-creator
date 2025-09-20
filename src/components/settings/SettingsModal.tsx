'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SettingsSchema, type SettingsSchema as SettingsInputType } from '@/lib/validation/schemas';
import { useSettingsStore } from '@/stores/settingsStore';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SettingsInput = typeof SettingsSchema['_type'];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: Props) {
  const { settings, load, save, loading } = useSettingsStore();
  const [apiKey, setApiKey] = useState('');

  const form = useForm<SettingsInput>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      defaultLang: 'ja',
      autoTranslate: true,
      autoSave: true,
      theme: 'light',
      modelOptimize: 'anthropic/claude-3-sonnet',
      modelTranslate: 'anthropic/claude-3-haiku',
      modelAnalysis: 'anthropic/claude-3-sonnet',
    },
  });

  useEffect(() => {
    if (!settings) load();
  }, [settings, load]);

  useEffect(() => {
    if (settings) form.reset(settings as unknown as SettingsInputType['_type']);
  }, [settings, form]);

  const onSubmit = async (data: SettingsInput) => {
    // APIキーは個別エンドポイントで送信する想定（ここでは settings.preferences に含められる）
    await save({ ...(data as any), /* openRouterApiKey: apiKey */ } as any);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>アプリ設定</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          {/* 基本設定 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>既定言語</Label>
              <Select
                value={form.watch('defaultLang')}
                onValueChange={(v) => form.setValue('defaultLang', v)}
              >
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>テーマ</Label>
              <Select
                value={form.watch('theme')}
                onValueChange={(v: 'light' | 'dark') => form.setValue('theme', v)}
              >
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between col-span-2">
              <Label className="mr-4">自動翻訳</Label>
              <Switch
                checked={form.watch('autoTranslate')}
                onCheckedChange={(v) => form.setValue('autoTranslate', v)}
              />
            </div>

            <div className="flex items-center justify-between col-span-2">
              <Label className="mr-4">自動保存</Label>
              <Switch
                checked={form.watch('autoSave')}
                onCheckedChange={(v) => form.setValue('autoSave', v)}
              />
            </div>
          </div>

          {/* モデル選択 */}
          <div className="space-y-3">
            <div>
              <Label>最適化モデル</Label>
              <Select
                value={form.watch('modelOptimize')}
                onValueChange={(v) => form.setValue('modelOptimize', v as any)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={'anthropic/claude-3-sonnet'}>Claude 3 Sonnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              保存
            </Button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground">
          注: APIキーはサーバ側で安全に保管されます。Vercel 環境変数がある場合はそちらを優先します。
        </p>
      </DialogContent>
    </Dialog>
  );
}


