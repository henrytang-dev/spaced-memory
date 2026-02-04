-- Create Image table to store uploaded pictures (non-OCR)
CREATE TABLE IF NOT EXISTS "Image" (
    "id"        TEXT        NOT NULL,
    "userId"    TEXT        NOT NULL,
    "mimeType"  TEXT        NOT NULL,
    "data"      BYTEA       NOT NULL,
    "size"      INTEGER     NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Image_userId_idx" ON "Image"("userId");

-- Foreign key to user (Postgres lacks IF NOT EXISTS for FK, so rely on clean migration run)
ALTER TABLE "Image"
  ADD CONSTRAINT "Image_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Source"
  ADD COLUMN IF NOT EXISTS "imageId" TEXT;

-- Enforce one-to-one uniqueness on Source.imageId (skip IF NOT EXISTS on constraint)
ALTER TABLE "Source" ADD CONSTRAINT "Source_imageId_key" UNIQUE ("imageId");

-- FK from Source to Image, allowing null and clearing on delete
ALTER TABLE "Source"
  ADD CONSTRAINT "Source_imageId_fkey"
  FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;
