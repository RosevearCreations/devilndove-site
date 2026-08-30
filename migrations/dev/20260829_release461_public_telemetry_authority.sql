-- Devil n Dove Release 461 — Development-only public telemetry authority.
-- Public tracking never creates/repairs schema. No historical replay.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS site_visitors (
  site_visitor_id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_token TEXT NOT NULL UNIQUE,
  country TEXT, user_agent TEXT, referrer_host TEXT, first_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP, visit_count INTEGER NOT NULL DEFAULT 0, is_bot INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS site_visitor_sessions (
  site_visitor_session_id INTEGER PRIMARY KEY AUTOINCREMENT, site_visitor_id INTEGER NOT NULL, session_token TEXT NOT NULL,
  user_id INTEGER, entry_path TEXT, last_path TEXT, country TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT,
  utm_content TEXT, utm_term TEXT, started_at TEXT DEFAULT CURRENT_TIMESTAMP, last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
  page_view_count INTEGER NOT NULL DEFAULT 0, event_count INTEGER NOT NULL DEFAULT 0,
  is_checkout_started INTEGER NOT NULL DEFAULT 0, is_abandoned_cart INTEGER NOT NULL DEFAULT 0,
  UNIQUE(site_visitor_id, session_token)
);
CREATE INDEX IF NOT EXISTS idx_site_visitor_sessions_token ON site_visitor_sessions(session_token);
CREATE TABLE IF NOT EXISTS site_page_views (
  site_page_view_id INTEGER PRIMARY KEY AUTOINCREMENT, site_visitor_id INTEGER, site_visitor_session_id INTEGER, user_id INTEGER,
  path TEXT NOT NULL, query_string TEXT, referrer TEXT, page_title TEXT, page_h1 TEXT, event_type TEXT,
  duration_ms INTEGER, meta_json TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_site_page_views_created ON site_page_views(created_at DESC);
CREATE TABLE IF NOT EXISTS site_search_events (
  site_search_event_id INTEGER PRIMARY KEY AUTOINCREMENT, site_visitor_id INTEGER, site_visitor_session_id INTEGER,
  user_id INTEGER, search_term TEXT, result_count INTEGER NOT NULL DEFAULT 0, path TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_site_search_events_created ON site_search_events(created_at DESC);
CREATE TABLE IF NOT EXISTS cart_activity (
  cart_activity_id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_token TEXT NOT NULL, session_token TEXT, user_id INTEGER,
  order_id INTEGER, event_type TEXT NOT NULL, path TEXT, cart_count INTEGER NOT NULL DEFAULT 0,
  cart_value_cents INTEGER NOT NULL DEFAULT 0, meta_json TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cart_activity_visitor_created ON cart_activity(visitor_token, created_at DESC);
SELECT COUNT(*) AS release461_site_visitors_columns FROM pragma_table_info('site_visitors') WHERE name IN ('site_visitor_id','visitor_token','country','user_agent','referrer_host','first_seen_at','last_seen_at','visit_count','is_bot');
SELECT COUNT(*) AS release461_site_sessions_columns FROM pragma_table_info('site_visitor_sessions') WHERE name IN ('site_visitor_session_id','site_visitor_id','session_token','user_id','entry_path','last_path','country','utm_source','utm_medium','utm_campaign','utm_content','utm_term','started_at','last_seen_at','page_view_count','event_count','is_checkout_started','is_abandoned_cart');
SELECT COUNT(*) AS release461_page_views_columns FROM pragma_table_info('site_page_views') WHERE name IN ('site_page_view_id','site_visitor_id','site_visitor_session_id','user_id','path','query_string','referrer','page_title','page_h1','event_type','duration_ms','meta_json','utm_source','utm_medium','utm_campaign','utm_content','utm_term','created_at');
SELECT COUNT(*) AS release461_search_columns FROM pragma_table_info('site_search_events') WHERE name IN ('site_search_event_id','site_visitor_id','site_visitor_session_id','user_id','search_term','result_count','path','created_at');
SELECT COUNT(*) AS release461_cart_columns FROM pragma_table_info('cart_activity') WHERE name IN ('cart_activity_id','visitor_token','session_token','user_id','order_id','event_type','path','cart_count','cart_value_cents','meta_json','created_at');
SELECT COUNT(*) AS release461_telemetry_indexes FROM sqlite_master WHERE type='index' AND name IN ('idx_site_visitor_sessions_token','idx_site_page_views_created','idx_site_search_events_created','idx_cart_activity_visitor_created');
PRAGMA foreign_key_check;
