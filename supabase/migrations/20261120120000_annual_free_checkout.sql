begin;

-- Stripe does not create a PaymentIntent when a promotion covers the full price.
-- Only the server can execute this function, after validating the Stripe session.
create or replace function public.apply_annual_payment(target_session_id text, target_payment_intent_id text,
  target_customer_id text, target_event_id text, target_paid_at timestamptz, target_live_mode boolean)
returns void language plpgsql security definer set search_path = public as $$
declare p public.annual_payments%rowtype;
begin
  select * into p from public.annual_payments where session_id=target_session_id for update;
  if not found or p.live_mode is distinct from target_live_mode then raise exception 'Unknown checkout'; end if;
  if target_paid_at is null or target_paid_at > now()+interval '5 minutes' then raise exception 'Invalid payment'; end if;
  if p.paid_at is not null then
    if p.payment_intent_id is distinct from target_payment_intent_id then raise exception 'Payment mismatch'; end if;
    return;
  end if;
  update public.annual_payments set payment_intent_id=target_payment_intent_id, customer_id=target_customer_id,
    paid_at=target_paid_at, expires_at=target_paid_at+interval '31536000 seconds', payment_event_id=target_event_id,
    status=case when status in ('refunded','disputed') then status else 'paid' end, updated_at=now()
    where id=p.id;
  update public.client_access_codes set access_started_at=target_paid_at,
    access_expires_at=target_paid_at+interval '31536000 seconds' where id=p.account_id and annual_access_required;
end $$;

revoke all on function public.apply_annual_payment(text,text,text,text,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.apply_annual_payment(text,text,text,text,timestamptz,boolean) to service_role;
commit;
