-- File: /database_profiles_extension.sql
-- Brief description: Adds full customer/employee profile storage for contact details,
-- verification flags, preferences, and future discount/employee management support.

CREATE TABLE IF NOT EXISTS user_profiles (
  user_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  profile_type TEXT NOT NULL DEFAULT 'customer',
  preferred_name TEXT,
  company_name TEXT,
  phone TEXT,
  phone_verified INTEGER NOT NULL DEFAULT 0,
  email_verified INTEGER NOT NULL DEFAULT 0,
  preferred_contact_method TEXT NOT NULL DEFAULT 'email',
  contact_notes TEXT,
  marketing_opt_in INTEGER NOT NULL DEFAULT 0,
  order_updates_opt_in INTEGER NOT NULL DEFAULT 1,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  employee_code TEXT,
  department TEXT,
  job_title TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_type
ON user_profiles(profile_type);

CREATE INDEX IF NOT EXISTS idx_user_profiles_phone
ON user_profiles(phone);


CREATE TABLE IF NOT EXISTS auth_recovery_requests (
  auth_recovery_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_type TEXT NOT NULL CHECK (request_type IN ('forgot_password','forgot_email')),
  contact_email TEXT NOT NULL,
  possible_email TEXT,
  display_name TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','resolved','closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_auth_recovery_requests_status_created_at ON auth_recovery_requests(status, created_at DESC);
