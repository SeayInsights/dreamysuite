CREATE TABLE IF NOT EXISTS canva_connection (
  userId TEXT PRIMARY KEY,
  accessToken TEXT NOT NULL,
  refreshToken TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
