--! Previous: sha1:dab308c7224d3cec95bef45d5cf87e620351e52d
--! Hash: sha1:9eaa1dc431193d5d9406ddbf038afe85db6ad782

-- additional attributes
alter table app_public.favorite_books drop column if exists is_super_favorite;
alter table app_public.favorite_books ADD COLUMN is_super_favorite boolean default false;

grant insert (isbn, is_super_favorite) on table app_public.favorite_books to :DATABASE_VISITOR;
grant update (isbn, is_super_favorite) on table app_public.favorite_books to :DATABASE_VISITOR;
