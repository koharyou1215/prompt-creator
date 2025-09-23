import { NextResponse } from 'next/server';

// GET: Retrieve settings
export async function GET() {
  try {
    // デフォルト設定を返す（実際の設定はクライアント側のlocalStorageで管理）
    const defaultSettings = {
      theme: 'dark',
      defaultLang: 'ja',
      autoTranslate: true,
      autoSave: true,
      preferences: {
        modelOptimize: 'anthropic/claude-sonnet-4',
        modelTranslate: 'google/gemini-2.5-flash',
        modelAnalysis: 'anthropic/claude-sonnet-4'
      }
    };

    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST: Update settings
export async function POST(request: Request) {
  try {
    const settings = await request.json();

    // 設定の検証
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }

    // ここではクライアント側で管理するため、成功レスポンスを返すだけ
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}