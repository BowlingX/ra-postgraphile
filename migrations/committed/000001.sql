--! Previous: -
--! Hash: sha1:d88addcabbd1b35fceb92a8a05f341a2005d2f82

-- test migrations

-- Setup
drop schema if exists app_public cascade;
create schema app_public;

grant usage on schema app_public to :DATABASE_VISITOR;
grant usage on schema app_public to :SYSTEM_ROLE;

alter default privileges in schema app_public grant usage, select on sequences to :DATABASE_VISITOR;
alter default privileges in schema app_public grant usage, select on sequences to :SYSTEM_ROLE;
--------------------------------------------------------------------------------------------------------------------

create table app_public.books
(
    id   serial primary key,
    name character varying NOT NULL,
    isbn character varying NOT NULL
);

grant select on table app_public.books to :DATABASE_VISITOR;
grant delete on table app_public.books to :DATABASE_VISITOR;

grant insert (name, isbn) on table app_public.books to :DATABASE_VISITOR;
grant update (name, isbn) on table app_public.books to :DATABASE_VISITOR;

CREATE INDEX ON app_public.books (name);
CREATE INDEX ON app_public.books (isbn);

INSERT INTO app_public.books (name, isbn) VALUES ('Moby Dick or The Whale', '12345')
