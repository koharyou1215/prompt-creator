-- Promptsテーブルの作成
CREATE TABLE IF NOT EXISTS prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  content_en TEXT,
  language VARCHAR(10) DEFAULT 'ja',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  parameters JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Charactersテーブルの作成
CREATE TABLE IF NOT EXISTS characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  appearance JSONB DEFAULT '{}',
  personality JSONB DEFAULT '{}',
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt Historyテーブル（バージョン管理用）
CREATE TABLE IF NOT EXISTS prompt_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_en TEXT,
  changed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_language ON prompts(language);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING GIN(tags);

-- Row Level Security (RLS) の設定
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;

-- 公開ポリシー（認証不要でアクセス可能）
CREATE POLICY "Public prompts are viewable by everyone"
ON prompts FOR SELECT
USING (true);

CREATE POLICY "Anyone can create prompts"
ON prompts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update their own prompts"
ON prompts FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete their own prompts"
ON prompts FOR DELETE
USING (true);

-- キャラクターテーブルも同様に公開
CREATE POLICY "Public characters are viewable by everyone"
ON characters FOR SELECT
USING (true);

CREATE POLICY "Anyone can create characters"
ON characters FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update characters"
ON characters FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete characters"
ON characters FOR DELETE
USING (true);

-- 更新時刻を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prompts_updated_at
BEFORE UPDATE ON prompts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at
BEFORE UPDATE ON characters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();