begin;

-- Keep historical 55-euro purchases valid while setting the new offer price.
alter table public.annual_payments drop constraint annual_payments_amount_check;
alter table public.annual_payments alter column amount set default 5200;
alter table public.annual_payments add constraint annual_payments_amount_check check (amount in (5200, 5500));

commit;
