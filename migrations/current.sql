-- test migrations

-- Setup
drop schema if exists app_public cascade;
create schema app_public;

grant usage on schema app_public to :DATABASE_VISITOR;
grant usage on schema app_public to :SYSTEM_ROLE;

alter default privileges in schema app_public grant usage, select on sequences to :DATABASE_VISITOR;
alter default privileges in schema app_public grant usage, select on sequences to :SYSTEM_ROLE;
--------------------------------------------------------------------------------------------------------------------


