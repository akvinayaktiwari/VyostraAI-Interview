-- Per-interview voice override: {"provider": "deepgram", "voice": "aura-2-thalia-en"}.
-- NULL means "use the organization default" (organizations.ai_settings.voice),
-- which in turn falls back to the server default (TTS_PROVIDER).
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS voice JSONB;
