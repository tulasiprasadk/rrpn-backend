-- SQL schema for category-aware subscription system (Postgres-compatible)

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  frequency INTEGER,
  delivery_days JSONB,
  items JSONB NOT NULL,
  quantities JSONB,
  pricing JSONB,
  next_delivery_date TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE subscription_items (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
  product_id TEXT,
  quantity INTEGER,
  unit_price NUMERIC(12,2)
);

CREATE TABLE subscription_schedule (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMP,
  status TEXT,
  attempt INTEGER DEFAULT 0
);

CREATE TABLE category_rules (
  id SERIAL PRIMARY KEY,
  category TEXT UNIQUE NOT NULL,
  rules JSONB
);

CREATE TABLE product_bundles (
  id SERIAL PRIMARY KEY,
  name TEXT,
  category TEXT,
  items JSONB,
  pricing JSONB
);

CREATE TABLE recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  payload JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_category ON subscriptions(category);

-- Example default category rules (flowers/fruits/vegetables frequency model)
INSERT INTO category_rules (category, rules) VALUES
('flowers', '{"model":"frequency","plans":{"Starter":1,"Smart":2,"Value+":3,"Daily+":7}}'),
('fruits', '{"model":"frequency","plans":{"Starter":1,"Smart":2,"Value+":3,"Daily+":7}}'),
('vegetables', '{"model":"frequency","plans":{"Starter":1,"Smart":2,"Value+":3,"Daily+":7}}'),
('groceries', '{"model":"family","plans":{"Essential":3,"Family":4,"Plus":5,"Premium":5}}'),
('consultancy', '{"model":"time","plans":{"Monthly":1,"Quarterly":3,"Half-Yearly":6,"Yearly":12}}');
