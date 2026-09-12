-- All app access goes through the authenticated edge API.
-- No client can insert scores, change run ownership, or read another user's save.
create table public.sudoku_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (display_name ~ '^[A-Za-z0-9_ ]{3,20}$'),
 state jsonb not null default '{}'::jsonb,
 ranked_xp bigint not null default 0 check (ranked_xp>=0),
 ranked_wins integer not null default 0,
 ranked_streak integer not null default 0,
 last_ranked_win date,
 created_at timestamptz not null default now()
);
create unique index sudoku_display_name_unique on public.sudoku_profiles(lower(display_name));
create table public.sudoku_runs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.sudoku_profiles(id) on delete cascade,
 seed bigint not null check(seed between 0 and 4294967295),
 difficulty smallint not null check(difficulty between 0 and 6),
 daily date,
 started_at timestamptz not null default now(),
 status text not null default 'playing' check(status in ('playing','won')),
 unique(id,user_id)
);
create index sudoku_runs_user_started on public.sudoku_runs(user_id,started_at desc);
create table public.sudoku_scores (
 run_id uuid primary key references public.sudoku_runs(id) on delete cascade,
 user_id uuid not null references public.sudoku_profiles(id) on delete cascade,
 difficulty smallint not null check(difficulty between 0 and 6),
 xp integer not null check(xp>0 and xp<=1000),
 mistakes smallint not null check(mistakes between 0 and 2),
 duration integer not null check(duration>=0),
 daily date,
 created_at timestamptz not null default now()
);
create index sudoku_scores_period on public.sudoku_scores(created_at desc,difficulty,user_id);
create index sudoku_scores_user on public.sudoku_scores(user_id);
create unique index sudoku_daily_once on public.sudoku_scores(user_id,daily) where daily is not null;
alter table public.sudoku_profiles enable row level security;
alter table public.sudoku_runs enable row level security;
alter table public.sudoku_scores enable row level security;
revoke all on public.sudoku_profiles,public.sudoku_runs,public.sudoku_scores from public,anon,authenticated;
grant all on public.sudoku_profiles,public.sudoku_runs,public.sudoku_scores to service_role;

create function public.sudoku_finish(p_user uuid,p_run uuid,p_mistakes integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
 r public.sudoku_runs; p public.sudoku_profiles; points integer; existing integer;
 today date := (now() at time zone 'UTC')::date; streak integer; seconds integer;
begin
 select * into r from public.sudoku_runs where id=p_run and user_id=p_user for update;
 if not found then raise exception 'Run not found'; end if;
 select xp into existing from public.sudoku_scores where run_id=p_run;
 if found then return jsonb_build_object('xp',existing,'duplicate',true); end if;
 if r.status<>'playing' or r.started_at < now()-interval '24 hours' then raise exception 'Run expired'; end if;
 if p_mistakes not between 0 and 2 then raise exception 'Invalid mistakes'; end if;
 seconds:=greatest(0,extract(epoch from now()-r.started_at)::integer);
 if seconds<5 then raise exception 'Run completed too quickly'; end if;
 select * into p from public.sudoku_profiles where id=p_user for update;
 if r.daily is not null and exists(select 1 from public.sudoku_scores where user_id=p_user and daily=r.daily) then raise exception 'Daily challenge already scored';end if;
 streak:=case when p.last_ranked_win=today then p.ranked_streak when p.last_ranked_win=today-1 then p.ranked_streak+1 else 1 end;
 points:=(array[60,90,130,180,250,340,460])[r.difficulty+1]+case when p_mistakes=0 then 40 else 0 end+least(streak,7)*10+case when r.daily is not null then 150 else 0 end;
 insert into public.sudoku_scores(run_id,user_id,difficulty,xp,mistakes,duration,daily) values(p_run,p_user,r.difficulty,points,p_mistakes,seconds,r.daily);
 update public.sudoku_runs set status='won' where id=p_run;
 update public.sudoku_profiles set ranked_xp=ranked_xp+points,ranked_wins=ranked_wins+1,ranked_streak=streak,last_ranked_win=today where id=p_user;
 return jsonb_build_object('xp',points,'duplicate',false);
end $$;
revoke all on function public.sudoku_finish(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.sudoku_finish(uuid,uuid,integer) to service_role;

create function public.sudoku_save(p_user uuid,p_state jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare old jsonb; merged jsonb;
begin
 select state into old from public.sudoku_profiles where id=p_user for update;
 if not found then raise exception 'Profile not found';end if;
 merged:=old||p_state||jsonb_build_object(
 'xp',greatest(coalesce((old->>'xp')::bigint,0),coalesce((p_state->>'xp')::bigint,0)),
 'wins',greatest(coalesce((old->>'wins')::integer,0),coalesce((p_state->>'wins')::integer,0)),
 'stars',greatest(coalesce((old->>'stars')::integer,0),coalesce((p_state->>'stars')::integer,0)));
 update public.sudoku_profiles set state=merged where id=p_user;
 return merged;
end $$;
revoke all on function public.sudoku_save(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.sudoku_save(uuid,jsonb) to service_role;

create function public.sudoku_board(p_user uuid,p_period text,p_difficulty integer)
returns jsonb language sql stable security invoker set search_path = '' as $$
 with totals as (
  select s.user_id,sum(s.xp)::bigint as xp,count(*)::integer as wins
  from public.sudoku_scores s
  where (p_period='all' or s.created_at>=date_trunc('week',now() at time zone 'UTC') at time zone 'UTC')
   and (p_difficulty=-1 or s.difficulty=p_difficulty)
  group by s.user_id
 ), ranked as (
  select row_number() over(order by t.xp desc,t.wins desc,t.user_id)::integer as rank,
   t.xp,t.wins,p.display_name,p.state->'equipped' as equipped,t.user_id=p_user as "isMe"
  from totals t join public.sudoku_profiles p on p.id=t.user_id
 )
 select jsonb_build_object('rows',coalesce((select jsonb_agg(r order by r.rank) from ranked r where r.rank<=50),'[]'::jsonb),
 'me',(select to_jsonb(r) from ranked r where r."isMe"));
$$;
revoke all on function public.sudoku_board(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.sudoku_board(uuid,text,integer) to service_role;
