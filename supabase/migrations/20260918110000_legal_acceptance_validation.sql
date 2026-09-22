begin;
create or replace function public.validate_legal_acceptance()
returns trigger language plpgsql set search_path = public as $$
declare document public.legal_documents%rowtype;
begin
  select * into document from public.legal_documents where id = new.legal_document_id;
  if document.id is null or document.status <> 'published'
    or document.document_type <> new.document_type or document.version <> new.document_version
    or new.acceptance_method <> 'explicit_checkbox' then
    raise exception 'Invalid legal acceptance evidence';
  end if;
  new.accepted_at := now();
  new.created_at := now();
  return new;
end $$;
drop trigger if exists legal_acceptance_validate_insert on public.legal_acceptances;
create trigger legal_acceptance_validate_insert before insert on public.legal_acceptances
for each row execute function public.validate_legal_acceptance();
commit;
