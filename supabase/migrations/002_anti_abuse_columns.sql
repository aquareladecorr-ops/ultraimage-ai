-- ============================================================================
-- Migration 002: Anti-Abuse Columns
-- Adiciona colunas para controle de fraude nos creditos de boas-vindas.
-- Executar no painel Supabase > SQL Editor.
-- ============================================================================

-- 1. Adicionar colunas na tabela profiles
alter table public.profiles
  add column if not exists signup_ip text,
    add column if not exists welcome_credits_granted boolean not null default false,
      add column if not exists welcome_credits_blocked boolean not null default false;

      -- Indice para busca rapida por IP (usado no auth/callback para contar contas por IP)
      create index if not exists idx_profiles_signup_ip
        on public.profiles(signup_ip)
          where signup_ip is not null;

          -- 2. Atualizar o trigger handle_new_user para:
          --    a) Marcar welcome_credits_granted = true quando creditos sao concedidos
          --    b) Verificar welcome_credits_blocked antes de conceder creditos
          create or replace function public.handle_new_user()
          returns trigger
          language plpgsql
          security definer
          set search_path = public
          as $$
          begin
            insert into public.profiles (id, email, full_name, credits_available, welcome_credits_granted)
              values (
                  new.id,
                      new.email,
                          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
                              5,
                                  true  -- marcado como concedido; o auth/callback pode reverter se IP duplicado
                                    );

                                      -- Log the welcome bonus
                                        insert into public.credit_transactions (user_id, type, amount, balance_after, description)
                                          values (new.id, 'bonus', 5, 5, 'Bonus de boas-vindas');

                                            return new;
                                            end;
                                            $$;

                                            -- 3. Funcao para revogar creditos de boas-vindas (chamada pelo auth/callback
                                            --    quando detecta IP duplicado APOS o trigger ja ter rodado)
                                            create or replace function public.revoke_welcome_credits(p_user_id uuid)
                                            returns void
                                            language plpgsql
                                            security definer
                                            set search_path = public
                                            as $$
                                            declare
                                              v_balance integer;
                                              begin
                                                -- So revoga se os creditos ainda nao foram usados (credits_available >= 5)
                                                  -- e se ainda nao foi bloqueado anteriormente
                                                    update public.profiles
                                                      set
                                                          credits_available = greatest(0, credits_available - 5),
                                                              welcome_credits_granted = false,
                                                                  welcome_credits_blocked = true
                                                                    where id = p_user_id
                                                                        and welcome_credits_blocked = false
                                                                            and credits_available >= 5
                                                                              returning credits_available into v_balance;

                                                                                if found then
                                                                                    insert into public.credit_transactions (user_id, type, amount, balance_after, description)
                                                                                        values (p_user_id, 'manual_adjust', -5, coalesce(v_balance, 0),
                                                                                                    'Credito de boas-vindas revogado (IP duplicado detectado)');
                                                                                                      end if;
                                                                                                      end;
                                                                                                      $$;