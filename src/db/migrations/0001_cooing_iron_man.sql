ALTER TABLE "users"
  ADD COLUMN "last_seen_at" timestamptz DEFAULT now() NOT NULL,
  ADD COLUMN "expires_at" timestamptz DEFAULT now() + interval '7 days' NOT NULL;

CREATE TABLE "usage_counters" (
  "scope" varchar(32) NOT NULL,
  "identifier_hash" varchar(128) NOT NULL,
  "bucket_start" timestamptz NOT NULL,
  "count" integer DEFAULT 1 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "usage_counters_pk"
    PRIMARY KEY ("scope", "identifier_hash", "bucket_start"),
  CONSTRAINT "usage_counters_count_positive"
    CHECK ("count" > 0)
);

CREATE INDEX "usage_counters_bucket_idx"
  ON "usage_counters" ("bucket_start");

CREATE TABLE "ai_leases" (
  "user_id" uuid PRIMARY KEY NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "ai_leases_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "ai_leases_expires_idx"
  ON "ai_leases" ("expires_at");
