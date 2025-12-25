-- Uncomment if necessary, but this will destroy existing data.
--DROP TABLE IF EXISTS samples;
--DROP TABLE IF EXISTS sample_archive;
--DROP TABLE IF EXISTS repeaters;

CREATE TABLE IF NOT EXISTS samples (
  hash TEXT PRIMARY KEY,
  time INTEGER NOT NULL,
  rssi REAL CHECK (rssi IS NULL OR typeof(rssi) = 'real'),
  snr  REAL CHECK (snr  IS NULL OR typeof(snr)  = 'real'),
  observed  INTEGER NOT NULL DEFAULT 0 CHECK (observed IN (0, 1)),
  repeaters TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_samples_time ON samples(time);

CREATE TABLE IF NOT EXISTS sample_archive (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  time INTEGER NOT NULL,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS repeaters (
  id TEXT NOT NULL,
  hash TEXT NOT NULL,
  time INTEGER NOT NULL,
  name TEXT NOT NULL,
  elevation REAL CHECK (elevation IS NULL OR typeof(elevation) = 'real'),
  PRIMARY KEY (id, hash)
);
CREATE INDEX IF NOT EXISTS idx_repeaters_time ON repeaters(time);