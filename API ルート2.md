画像生成プロンプト用に次のテキストを翻訳し、カンマ区切りと専門用語を維持してください。日本語の場合は英語に、英語の場合は日本語に翻訳します。芸術用語、品質指標、スタイル記述子は画像生成で一般的に使用される形式で保持してください。

プロンプト最適化プロンプト
このテキストを画像生成プロンプトとして最適化します：冗長性の除去、カンマ区切りの標準化、重要度順（被写体→スタイル→品質→詳細）での整理、関連する記述タグの追加、元の意図を維持しながら用語の一貫性を確保します。

画像からプロンプト抽出プロンプト
この画像を分析し、再現可能な詳細なプロンプトを抽出します。被写体、構図、スタイル、照明、色彩、雰囲気、品質指標、芸術的技法を含め、カンマ区切りのタグとしてフォーマットします。

🚀 アプリ搭載用・進化版プロンプト
翻訳機能用
日本語と英語の間でAI画像生成用の翻訳を行い、プロンプト構造、芸術用語、カンマ区切りを維持し、標準的な画像生成用語を使用します。

最適化機能用
最適化された画像プロンプトとして再構築します：重複の排除、優先順位（被写体＞スタイル＞品質＞詳細）での並べ替え、区切りの標準化、関連タグの追加、洗練されたプロンプトのみを出力します。

プロンプト抽出機能用
この画像から包括的な画像生成プロンプトを抽出します：すべての視覚要素、芸術的スタイル、技術的参数を識別し、カンマ区切りのタグのみを返します。





 API ルート —
1) src/app/api/prompts/route.ts
// src/app/api/prompts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { PromptCreateSchema } from '@/lib/validation/schemas';
import { badRequest, unauthorized } from '@/lib/api/errors';
import { PromptParser } from '@/lib/ai/prompt-parser';

export async function GET(request: NextRequest) {
  const user = await auth(request);
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const search = searchParams.get('search') || undefined;
  const tags = searchParams.get('tags')?.split(',').filter(Boolean);

  const where: any = { userId: user.id };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (tags?.length) {
    where.tags = { some: { name: { in: tags } } };
  }

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      include: {
        elements: true,
        tags: true,
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
        images: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.prompt.count({ where }),
  ]);

  return NextResponse.json({
    prompts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const user = await auth(request);
  if (!user) return unauthorized();

  const json = await request.json();
  const parsed = PromptCreateSchema.safeParse(json);
  if (!parsed.success) return badRequest('Invalid payload', parsed.error.flatten());

  const { title, content, language, parameters, metadata, tags } = parsed.data;

  // 入力サニタイズとセキュリティ検証（設計書内で実装済みの SecurityValidator を想定）
  // const sanitized = SecurityValidator.sanitizeInput(content);
  // const validation = SecurityValidator.validatePromptContent(sanitized);
  // if (!validation.isValid) return badRequest('Invalid prompt content', { issues: validation.issues });

  // 要素解析はキャッシュを活用する（cacheService を利用）
  // const cachedElements = await cacheService.getCachedPromptElements(sanitized);
  // const elements = cachedElements ?? (await PromptParser.parseElements(sanitized));
  // if (!cachedElements) await cacheService.cachePromptElements(sanitized, elements as any[]);

  // データベースに保存
  const prompt = await prisma.prompt.create({
    data: {
      title,
      content,
      language,
      parameters,
      metadata,
      userId: user.id,
      // elements: { create: elements.map(e => ({ ...e })) },
      versions: {
        create: {
          versionNumber: 1,
          content,
          // elements,
          changes: [],
        },
      },
      ...(tags?.length
        ? {
            tags: {
              connectOrCreate: tags.map(name => ({ where: { name }, create: { name } })),
            },
          }
        : {}),
    },
    include: { elements: true, tags: true, versions: true },
  });

  return NextResponse.json(prompt, { status: 201 });
}
​
2) src/app/api/prompts/[id]/route.ts
// src/app/api/prompts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { PromptUpdateSchema } from '@/lib/validation/schemas';
import { badRequest, unauthorized, notFound, conflict } from '@/lib/api/errors';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await auth(request);
  if (!user) return unauthorized();

  const { id } = params;
  const body = await request.json();
  const parsed = PromptUpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid payload', parsed.error.flatten());

  const ifUnmod = request.headers.get('X-If-Unmodified-Since');
  const existing = await prisma.prompt.findFirst({ where: { id, userId: user.id } });
  if (!existing) return notFound('Prompt not found');

  if (ifUnmod && new Date(ifUnmod).getTime() < existing.updatedAt.getTime()) {
    return conflict('Version conflict');
  }

  const updated = await prisma.prompt.update({
    where: { id },
    data: { ...parsed.data },
  });

  return NextResponse.json(updated);
}
​
3) src/app/api/settings/route.ts
// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { SettingsSchema } from '@/lib/validation/schemas';
import { badRequest, unauthorized } from '@/lib/api/errors';

export async function GET(req: NextRequest) {
  const user = await auth(req);
  if (!user) return unauthorized();

  const s = await prisma.userSettings.findUnique({ where: { userId: user.id } });
  return NextResponse.json(s ?? {});
}

export async function PATCH(req: NextRequest) {
  const user = await auth(req);
  if (!user) return unauthorized();

  const json = await req.json();
  const parsed = SettingsSchema.safeParse(json);
  if (!parsed.success) {
    return badRequest('Invalid payload', parsed.error.flatten());
  }

  const { defaultLang, autoTranslate, autoSave, theme, modelOptimize, modelTranslate, modelAnalysis } = parsed.data;

  const updated = await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {
      defaultLang,
      autoTranslate,
      autoSave,
      theme,
      preferences: { modelOptimize, modelTranslate, modelAnalysis },
    },
    create: {
      userId: user.id,
      defaultLang,
      autoTranslate,
      autoSave,
      theme,
      preferences: { modelOptimize, modelTranslate, modelAnalysis },
    },
  });

  return NextResponse.json(updated);
}
​
4) src/app/api/translate/route.ts
// src/app/api/translate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TranslateRequestSchema } from '@/lib/validation/schemas';
import { badRequest, unauthorized, serverError } from '@/lib/api/errors';
import { PromptTranslator } from '@/lib/translation/translator';
import { env } from '@/lib/env';

export async function POST(request: NextRequest) {
  const user = await auth(request);
  if (!user) return unauthorized();

  const json = await request.json();
  const parsed = TranslateRequestSchema.safeParse(json);
  if (!parsed.success) return badRequest('Invalid payload', parsed.error.flatten());

  try {
    const translator = new PromptTranslator(env.OPENROUTER_API_KEY);
    if (parsed.data.useCustomDict) {
      await translator.loadCustomDictionary(user.id);
    }
    const translated = await translator.translate(parsed.data);
    return NextResponse.json({ translated });
  } catch (e: any) {
    return serverError(e?.message || 'Translation failed');
  }
}
​
5) src/app/api/ai-suggest/route.ts
// src/app/api/ai-suggest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AISuggestRequestSchema } from '@/lib/validation/schemas';
import { badRequest, unauthorized, serverError } from '@/lib/api/errors';
import { OpenRouterClient } from '@/lib/ai/openrouter';
import { DEFAULT_MODELS } from '@/lib/ai/models';

export async function POST(request: NextRequest) {
  const user = await auth(request);
  if (!user) return unauthorized();

  const json = await request.json();
  const parsed = AISuggestRequestSchema.safeParse(json);
  if (!parsed.success) return badRequest('Invalid payload', parsed.error.flatten());

  const { prompt, type, options } = parsed.data;

  const systemMap: Record<typeof type, string> = {
    optimize:
      'You are an expert prompt engineer. Optimize the given prompt for better image generation results. Focus on clarity, specificity, and artistic quality. Maintain the original intent while improving structure.',
    variations:
      `Generate creative variations of the given prompt while maintaining its core essence. Provide ${options?.count ?? 3} different versions with varying styles, moods, or details.`,
    enhance:
      'Enhance the given prompt by adding relevant details, better descriptions, and quality modifiers. Make it more specific and likely to produce high-quality results.',
  };

  const systemPrompt = systemMap[type];
  const userPrompt = `Input:\n${prompt}`;

  try {
    const client = new OpenRouterClient();
    const model = DEFAULT_MODELS.optimize;
    const result = await client.complete(`${systemPrompt}\n\n${userPrompt}`, model);
    return NextResponse.json({ result });
  } catch (e: any) {
    return serverError(e?.message || 'AI suggestion failed');
  }
}