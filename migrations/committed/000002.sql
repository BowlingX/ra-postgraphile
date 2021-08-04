--! Previous: sha1:6bcafce6ca0ba83238a17cab5b7969bc743146a3
--! Hash: sha1:dab308c7224d3cec95bef45d5cf87e620351e52d

-- Enter migration here

-- Tests for #48

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS app_public.profile;

CREATE TABLE app_public.profile
(
    id         uuid      NOT NULL DEFAULT uuid_generate_v1mc(),
    name       text      NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    CONSTRAINT profile_pkey PRIMARY KEY (id)
);

INSERT INTO app_public.profile (name) VALUES ('David')
