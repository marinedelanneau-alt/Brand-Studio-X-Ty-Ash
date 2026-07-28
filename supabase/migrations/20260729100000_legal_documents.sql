begin;

create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  stable_key text not null,
  document_type text not null check (document_type in ('terms_of_use','privacy_policy','legal_notice','sales_terms','copyright_notice')),
  version text not null,
  title text not null,
  slug text not null,
  content jsonb not null default '[]'::jsonb check (jsonb_typeof(content) = 'array'),
  status text not null default 'draft' check (status in ('draft','ready','published','archived')),
  is_mandatory boolean not null default false,
  requires_reacceptance boolean not null default false,
  effective_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  published_by uuid references auth.users(id) on delete set null,
  change_summary text,
  unique(document_type, version),
  unique(stable_key, version)
);

create unique index if not exists legal_documents_one_published_type_idx
  on public.legal_documents(document_type) where status = 'published';
create index if not exists legal_documents_type_status_idx
  on public.legal_documents(document_type, status, updated_at desc);

create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  legal_document_id uuid not null references public.legal_documents(id) on delete restrict,
  document_type text not null,
  document_version text not null,
  accepted_at timestamptz not null default now(),
  acceptance_method text not null default 'explicit_checkbox',
  source text not null,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now(),
  unique(user_id, legal_document_id)
);

create table if not exists public.legal_system_settings (
  id boolean primary key default true check (id),
  enforcement_mode text not null default 'disabled'
    check (enforcement_mode in ('disabled','admin_only','new_users_only','all_users')),
  existing_user_cutoff timestamptz,
  pdf_notice text not null default 'Document généré par Brand Studio. Toute reproduction ou diffusion non autorisée est interdite. [À FAIRE VALIDER JURIDIQUEMENT]',
  show_pdf_credits_page boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
insert into public.legal_system_settings(id, enforcement_mode) values (true, 'disabled')
on conflict (id) do nothing;

create or replace function public.prevent_published_legal_document_mutation()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status = 'published' and (
    tg_op = 'DELETE' or new.status <> 'archived' or
    new.stable_key is distinct from old.stable_key or new.document_type is distinct from old.document_type or
    new.version is distinct from old.version or new.title is distinct from old.title or
    new.slug is distinct from old.slug or new.content is distinct from old.content or
    new.is_mandatory is distinct from old.is_mandatory or
    new.requires_reacceptance is distinct from old.requires_reacceptance
  ) then
    raise exception 'published legal documents are immutable';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists legal_documents_immutable_published on public.legal_documents;
create trigger legal_documents_immutable_published before update or delete on public.legal_documents
for each row execute function public.prevent_published_legal_document_mutation();

create or replace function public.prevent_legal_acceptance_mutation()
returns trigger language plpgsql as $$
begin raise exception 'legal acceptance evidence is immutable'; end $$;
drop trigger if exists legal_acceptances_immutable on public.legal_acceptances;
create trigger legal_acceptances_immutable before update or delete on public.legal_acceptances
for each row execute function public.prevent_legal_acceptance_mutation();

create or replace function public.publish_legal_document(target_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare target public.legal_documents%rowtype;
begin
  if not public.is_current_user_admin() then raise exception 'admin role required'; end if;
  select * into target from public.legal_documents where id = target_id for update;
  if target.id is null or target.status <> 'ready' then raise exception 'document must be ready'; end if;
  update public.legal_documents set status = 'archived', updated_at = now()
    where document_type = target.document_type and status = 'published';
  update public.legal_documents
    set status = 'published', published_at = now(), published_by = auth.uid(),
        effective_at = coalesce(effective_at, now()), updated_at = now()
    where id = target_id;
  insert into public.admin_audit_logs(admin_user_id, action_type, entity_type, entity_id, metadata)
    values(auth.uid(), 'legal_document_published', 'legal_document', target_id::text,
      jsonb_build_object('type', target.document_type, 'version', target.version));
end $$;

create or replace function public.clone_legal_document(source_id uuid, new_version text)
returns uuid language plpgsql security definer set search_path = public as $$
declare result uuid;
begin
  if not public.is_current_user_admin() then raise exception 'admin role required'; end if;
  insert into public.legal_documents(stable_key,document_type,version,title,slug,content,status,is_mandatory,
    requires_reacceptance,created_by,change_summary)
  select stable_key,document_type,new_version,title,slug,content,'draft',is_mandatory,
    requires_reacceptance,auth.uid(),'Brouillon restauré depuis ' || version
  from public.legal_documents where id = source_id returning id into result;
  insert into public.admin_audit_logs(admin_user_id,action_type,entity_type,entity_id,metadata)
    values(auth.uid(),'legal_document_cloned','legal_document',result::text,jsonb_build_object('source_id',source_id));
  return result;
end $$;

create or replace function public.has_accepted_current_terms(target_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from public.legal_documents d
    where d.document_type = 'terms_of_use' and d.status = 'published' and d.is_mandatory
      and not exists (select 1 from public.legal_acceptances a
        where a.user_id = target_user_id and a.legal_document_id = d.id)
  )
$$;

create or replace function public.set_legal_enforcement(target_mode text, confirmation text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_current_user_admin() then raise exception 'admin role required'; end if;
  if target_mode not in ('disabled','admin_only','new_users_only','all_users') then raise exception 'invalid mode'; end if;
  if target_mode = 'all_users' and confirmation <> 'ACTIVER POUR TOUS LES UTILISATEURS' then
    raise exception 'explicit confirmation required';
  end if;
  update public.legal_system_settings set enforcement_mode=target_mode,updated_at=now(),updated_by=auth.uid() where id;
  insert into public.admin_audit_logs(admin_user_id,action_type,entity_type,entity_id,metadata)
    values(auth.uid(),'legal_enforcement_changed','legal_settings','global',jsonb_build_object('mode',target_mode));
end $$;

alter table public.legal_documents enable row level security;
alter table public.legal_acceptances enable row level security;
alter table public.legal_system_settings enable row level security;
create policy legal_documents_published_read on public.legal_documents for select using (status='published' or public.is_current_user_admin());
create policy legal_documents_admin_all on public.legal_documents for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());
create policy legal_acceptances_own_read on public.legal_acceptances for select using (user_id=auth.uid() or public.is_current_user_admin());
create policy legal_acceptances_own_insert on public.legal_acceptances for insert with check (user_id=auth.uid());
create policy legal_settings_admin_read on public.legal_system_settings for select using (public.is_current_user_admin());
create policy legal_settings_admin_update on public.legal_system_settings for update using (public.is_current_user_admin()) with check (public.is_current_user_admin());

insert into public.legal_documents(stable_key,document_type,version,title,slug,content,status,is_mandatory,requires_reacceptance,change_summary)
select 'brand-studio-terms','terms_of_use','0.1-draft','Conditions Générales d’Utilisation',
  'conditions-generales-utilisation',
  (select jsonb_agg(jsonb_build_object('id','section-'||n,'title',title,'body','[À COMPLÉTER] [À FAIRE VALIDER JURIDIQUEMENT]') order by n)
   from (values
    (1,'Objet'),(2,'Présentation de Brand Studio'),(3,'Conditions d’accès'),(4,'Création et sécurité du compte'),
    (5,'Fonctionnement du service'),(6,'Accès aux modules et exercices'),(7,'Disponibilité du service'),
    (8,'Responsabilité de l’utilisateur'),(9,'Utilisations interdites'),(10,'Propriété intellectuelle'),
    (11,'Licence d’utilisation accordée à l’utilisateur'),(12,'Contenus créés par l’utilisateur'),
    (13,'Exports et Guides de Marque'),(14,'Partage de compte'),(15,'Suspension ou suppression du compte'),
    (16,'Évolution du service'),(17,'Évolution des CGU'),(18,'Données personnelles'),
    (19,'Liens vers la politique de confidentialité'),(20,'Droit applicable et juridiction'),(21,'Contact')
   ) s(n,title)),
  'draft',true,true,'Structure technique initiale — contenu juridique à faire valider'
where not exists (select 1 from public.legal_documents where stable_key='brand-studio-terms');

commit;
