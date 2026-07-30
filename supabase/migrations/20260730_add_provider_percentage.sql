alter table public.providers
  add column if not exists percentage numeric(5, 2) not null default 60;

alter table public.providers
  drop constraint if exists providers_percentage_range;

alter table public.providers
  add constraint providers_percentage_range
  check (percentage > 0 and percentage <= 100);
