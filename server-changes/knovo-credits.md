# Knovo plans and credits: the server steps

The website in this repository already shows the new plans and reads the new credit balances.
The counting itself happens on the Knovo server (a Supabase Edge Function) and in the database.
Neither is in this repository, so these steps are done by hand in Supabase.

Do them in this order. Until both are done, Knovo keeps working with the old limits.

| Step | Where | Time |
|---|---|---|
| 1. Run the SQL below | Supabase → SQL Editor | 1 minute |
| 2. Replace the Knovo function code | Supabase → Edge Functions → Knovo → Code | 3 minutes |
| 3. Check it | The website, signed in as a normal student | 1 minute |

## What the new system does

1 credit = 1 normal Knovo message.

| Plan | Credits |
|---|---|
| Knovo Free | 20 a day, refills 24 hours after the first use |
| Knovo Plus Monthly | 1,500 a month, no daily limit |
| Exam Season Pass | 5,000 in total, usable for 120 days, no refill |
| Knovo Plus Annual | 1,500 a month, refilled each month for 12 months |
| Top-up pack | 300 credits, valid 12 months |

| Action | Credits |
|---|---|
| Chat message | 1 (a very long message: 2) |
| Raised-hand question in a Live Lesson | 1 |
| Live Lesson | 10 |
| Image | 3 |

- **Image price:** the Knovo function generates images with Cloudflare `@cf/black-forest-labs/flux-1-schnell`,
  the small fast model, so an image costs 3 credits.
- **Spending order:** a paid student uses plan credits first, then top-up credits. A free student uses the
  20 daily credits first, then top-up credits.
- **Only the owner is unlimited.** Developers (co-owners) are also not charged, because the function treats
  them like the owner; change `isOwner` in the function if you want them charged.
- **Gifted Pro** (and season winners given Pro) get the Knovo Plus Monthly allowance until `pro_until`.
- Every paid plan keeps `plan = 'pro'` in `user_limits`, so the topical papers stay included.
- If the AI fails to answer, the credits taken for that request are given back.

---

## Step 1. Database (SQL)

Open https://supabase.com/dashboard/project/yazzyldmohngmotiozlj/sql/new, paste everything in the box
below, and press **Run**. It is safe to run more than once.

What it adds:

1. **Columns on `user_limits`:** `plan_type` (free / monthly / season / annual), `pool_credits_left`,
   `pool_size`, `pool_resets_at`, `topup_credits_left`, `topup_expires_at` (and the two daily-credit columns
   `credits_used`, `credits_window_start` if they are not there yet).
2. **`eduverse_my_credits()`**: the student's own balance, which the website shows before the first message.
3. **Gift functions for the owner:** `eduverse_admin_gift_plan(email, plan, days)`,
   `eduverse_admin_gift_topup(email, credits)`, and updates to `eduverse_admin_gift_pro`,
   `eduverse_admin_remove_pro` and `eduverse_my_plan` so they set and clear the plan type and pool.
4. **Cost log:** the `knovo_usage_log` table, a small price table, and a view that shows the average cost per
   action for the last 7 days.

```sql
/* =====================================================================
   EDUVERSE — KNOVO PLANS AND CREDITS (run once in Supabase; safe to run again)
   Run this AFTER the main EduVerse database setup.
   ===================================================================== */

/* ---------- 1. New columns on user_limits ---------- */
alter table public.user_limits
  add column if not exists credits_used integer not null default 0,
  add column if not exists credits_window_start timestamptz not null default '2000-01-01',
  add column if not exists plan_type text not null default 'free',
  add column if not exists pool_credits_left integer not null default 0,
  add column if not exists pool_size integer not null default 0,
  add column if not exists pool_resets_at timestamptz,
  add column if not exists topup_credits_left integer not null default 0,
  add column if not exists topup_expires_at timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'user_limits_plan_type_ok') then
    alter table public.user_limits add constraint user_limits_plan_type_ok
      check (plan_type in ('free','monthly','season','annual'));
  end if;
end $$;

/* Accounts that already have Pro (gifts made before today) get the monthly allowance. */
update public.user_limits
   set plan_type = 'monthly', pool_size = 1500, pool_credits_left = 1500, pool_resets_at = now() + interval '1 month'
 where plan = 'pro' and plan_type = 'free';

/* ---------- 2. The student's own balance (the website reads this) ---------- */
create or replace function public.eduverse_my_credits()
returns table (my_plan text, daily_left integer, daily_size integer, daily_resets_at timestamptz,
               pool_left integer, pool_size integer, pool_resets_at timestamptz,
               topup_left integer, plan_until timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare r public.user_limits%rowtype; v_paid boolean; v_type text; v_fresh boolean;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select * into r from public.user_limits where user_id = auth.uid();
  if not found then
    return query select 'free'::text, 20, 20, null::timestamptz, null::integer, null::integer, null::timestamptz, 0, null::timestamptz;
    return;
  end if;
  v_paid := r.plan = 'pro' and (r.pro_until is null or r.pro_until > now());
  v_type := case when r.plan_type in ('monthly','season','annual') then r.plan_type else 'monthly' end;
  v_fresh := now() - r.credits_window_start >= interval '24 hours';
  return query select
    case when v_paid then v_type else 'free' end,
    case when v_fresh then 20 else greatest(0, 20 - r.credits_used) end,
    20,
    case when v_fresh then null else r.credits_window_start + interval '24 hours' end,
    case when not v_paid then null
         when r.pool_size = 0 then case v_type when 'season' then 5000 else 1500 end
         when v_type <> 'season' and (r.pool_resets_at is null or r.pool_resets_at <= now()) then r.pool_size
         else r.pool_credits_left end,
    case when not v_paid then null when r.pool_size = 0 then case v_type when 'season' then 5000 else 1500 end else r.pool_size end,
    case when not v_paid then null when v_type = 'season' then r.pro_until else r.pool_resets_at end,
    case when r.topup_credits_left > 0 and (r.topup_expires_at is null or r.topup_expires_at > now()) then r.topup_credits_left else 0 end,
    case when v_paid then r.pro_until else null end;
end;
$$;
revoke execute on function public.eduverse_my_credits() from public, anon;
grant execute on function public.eduverse_my_credits() to authenticated;

/* ---------- 3. Owner: give a plan or a top-up by email ---------- */
/* p_plan: 'monthly' (1,500 credits a month), 'season' (5,000 credits for 120 days),
           'annual' (1,500 a month for 12 months).
   p_days: how long it lasts. 0 = the usual length (30 / 120 / 365 days). */
create or replace function public.eduverse_admin_gift_plan(p_email text, p_plan text default 'monthly', p_days integer default 0)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid; v_name text; v_days integer; v_pool integer;
begin
  if not public.eduverse_is_admin() then raise exception 'Owner only'; end if;
  if not public.eduverse_admin_code_ok() then raise exception 'Owner code required'; end if;
  if p_plan not in ('monthly','season','annual') then raise exception 'Choose monthly, season or annual'; end if;
  select u.id, left(coalesce(nullif(btrim(u.raw_user_meta_data ->> 'full_name'),''), 'Student'),40)
    into v_uid, v_name from auth.users u where lower(u.email) = lower(btrim(p_email)) limit 1;
  if v_uid is null then raise exception 'No EduVerse account uses that email yet. Ask them to create a free account first.'; end if;
  v_days := case when coalesce(p_days,0) > 0 then p_days when p_plan = 'season' then 120 when p_plan = 'annual' then 365 else 30 end;
  v_pool := case when p_plan = 'season' then 5000 else 1500 end;
  insert into public.user_limits (user_id, plan, pro_until, plan_type, pool_size, pool_credits_left, pool_resets_at)
  values (v_uid, 'pro', now() + make_interval(days => v_days), p_plan, v_pool, v_pool,
          case when p_plan = 'season' then null else now() + interval '1 month' end)
  on conflict (user_id) do update set plan = 'pro', pro_until = excluded.pro_until, plan_type = excluded.plan_type,
    pool_size = excluded.pool_size, pool_credits_left = excluded.pool_credits_left, pool_resets_at = excluded.pool_resets_at;
  return v_name;
end;
$$;

/* The existing "Gift Pro" button keeps working: it now gives the monthly allowance.
   p_days = 0 still means "until I remove it". */
create or replace function public.eduverse_admin_gift_pro(p_email text, p_days integer default 0)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_name text;
begin
  v_name := public.eduverse_admin_gift_plan(p_email, 'monthly', case when coalesce(p_days,0) > 0 then p_days else 30 end);
  if coalesce(p_days,0) <= 0 then
    update public.user_limits l set pro_until = null
      from auth.users u where u.id = l.user_id and lower(u.email) = lower(btrim(p_email));
  end if;
  return v_name;
end;
$$;

/* 300 top-up credits, valid 12 months. Top-ups add up; the 12 months restart with each new pack. */
create or replace function public.eduverse_admin_gift_topup(p_email text, p_credits integer default 300)
returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid; v_left integer;
begin
  if not public.eduverse_is_admin() then raise exception 'Owner only'; end if;
  if not public.eduverse_admin_code_ok() then raise exception 'Owner code required'; end if;
  if coalesce(p_credits,0) < 1 or p_credits > 5000 then raise exception 'Choose between 1 and 5000 credits'; end if;
  select u.id into v_uid from auth.users u where lower(u.email) = lower(btrim(p_email)) limit 1;
  if v_uid is null then raise exception 'No EduVerse account uses that email yet. Ask them to create a free account first.'; end if;
  insert into public.user_limits (user_id, topup_credits_left, topup_expires_at)
  values (v_uid, p_credits, now() + interval '12 months')
  on conflict (user_id) do update set
    topup_credits_left = case when public.user_limits.topup_expires_at is not null and public.user_limits.topup_expires_at <= now()
                              then 0 else public.user_limits.topup_credits_left end + p_credits,
    topup_expires_at = now() + interval '12 months'
  returning topup_credits_left into v_left;
  return v_left;
end;
$$;

/* Taking a plan away also clears its credit pool (top-up credits stay: they were given separately). */
create or replace function public.eduverse_admin_remove_pro(p_user_id uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.eduverse_is_admin() then raise exception 'Owner only'; end if;
  if not public.eduverse_admin_code_ok() then raise exception 'Owner code required'; end if;
  update public.user_limits set plan = 'free', pro_until = null, plan_type = 'free',
    pool_size = 0, pool_credits_left = 0, pool_resets_at = null where user_id = p_user_id;
  return found;
end;
$$;

/* A plan whose time is up goes back to free the next time that student opens EduVerse. */
create or replace function public.eduverse_my_plan()
returns table (my_plan text, my_pro_until timestamptz)
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  update public.user_limits set plan = 'free', pro_until = null, plan_type = 'free',
    pool_size = 0, pool_credits_left = 0, pool_resets_at = null
    where user_id = auth.uid() and plan = 'pro' and pro_until is not null and pro_until < now();
  return query select coalesce((select l.plan from public.user_limits l where l.user_id = auth.uid()),'free'),
                      (select l.pro_until from public.user_limits l where l.user_id = auth.uid());
end;
$$;

revoke execute on function public.eduverse_admin_gift_plan(text,text,integer) from public, anon;
revoke execute on function public.eduverse_admin_gift_topup(text,integer) from public, anon;
grant execute on function public.eduverse_admin_gift_plan(text,text,integer) to authenticated;
grant execute on function public.eduverse_admin_gift_topup(text,integer) to authenticated;
grant execute on function public.eduverse_admin_gift_pro(text,integer) to authenticated;
grant execute on function public.eduverse_admin_remove_pro(uuid) to authenticated;
grant execute on function public.eduverse_my_plan() to authenticated;

/* ---------- 4. Cost log ---------- */
create table if not exists public.knovo_usage_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  mode text not null default 'chat',
  model text not null default '',
  provider text not null default 'gemini' check (provider in ('gemini','grok','cloudflare')),
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  thinking_tokens integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists knovo_usage_log_time_idx on public.knovo_usage_log (created_at);
alter table public.knovo_usage_log enable row level security;
revoke all on public.knovo_usage_log from anon, authenticated;

/* Prices in US dollars per 1,000,000 tokens. Thinking tokens are charged as output.
   '*' is the price used for any model that has no row of its own.
   EDIT THESE to the real prices of the models you use (see the note in knovo-credits.md). */
create table if not exists public.knovo_model_prices (
  model text primary key,
  input_per_million numeric not null,
  output_per_million numeric not null
);
alter table public.knovo_model_prices enable row level security;
revoke all on public.knovo_model_prices from anon, authenticated;
insert into public.knovo_model_prices (model, input_per_million, output_per_million) values
  ('*', 0.30, 2.50),
  ('gemini-2.5-flash', 0.30, 2.50)
on conflict (model) do nothing;

/* Average cost per action, last 7 days. Run it in the SQL editor whenever you want to look. */
create or replace view public.knovo_cost_last_7_days as
select l.mode, l.model, count(*) as requests,
       round(avg(l.input_tokens)) as avg_input_tokens,
       round(avg(l.output_tokens + l.thinking_tokens)) as avg_output_tokens,
       round(avg((l.input_tokens * p.input_per_million + (l.output_tokens + l.thinking_tokens) * p.output_per_million) / 1000000.0)::numeric, 6) as avg_cost_usd,
       round(sum((l.input_tokens * p.input_per_million + (l.output_tokens + l.thinking_tokens) * p.output_per_million) / 1000000.0)::numeric, 4) as total_cost_usd
from public.knovo_usage_log l
join public.knovo_model_prices p on p.model = coalesce((select m.model from public.knovo_model_prices m where m.model = l.model), '*')
where l.created_at >= now() - interval '7 days'
group by l.mode, l.model
order by l.mode, requests desc;
revoke all on public.knovo_cost_last_7_days from anon, authenticated;
```

### See what Knovo costs you

Run this in the SQL editor any time:

```sql
select * from public.knovo_cost_last_7_days;
```

It lists each action (chat, lesson_qa, whiteboard, image) and model with the number of requests, the average
tokens and the average cost in US dollars.

**About the prices.** You asked for Gemini 2.5 Flash prices ($0.30 input and $2.50 output per 1M tokens, with
thinking counted as output). The Knovo function does **not** use Gemini 2.5 Flash. It tries, in order,
`gemini-3.5-flash-lite`, `gemini-3.8-flash` and `gemini-3.1-flash-lite`, and falls back to Cloudflare
`@cf/meta/llama-3.3-70b-instruct-fp8-fast`. The current prices of those models were not confirmed when this
file was written, so the view uses the Gemini 2.5 Flash prices as a stand-in for every model (the `*` row).
That makes the result an estimate, most likely too high for the "lite" models. To make it exact, look up the
price of each model on Google's and Cloudflare's pricing pages and add a row for it:

```sql
insert into public.knovo_model_prices (model, input_per_million, output_per_million)
values ('gemini-3.5-flash-lite', 0.00, 0.00)   -- put the real prices here
on conflict (model) do update set input_per_million = excluded.input_per_million,
                                  output_per_million = excluded.output_per_million;
```

Images are logged with zero tokens (Cloudflare bills them per image, not per token), so the view shows how
many images were made but not their cost. Grok is not used by the function; the log accepts `provider = 'grok'`
in case it is added later.

---

## Step 2. Knovo edge function

Open https://supabase.com/dashboard/project/yazzyldmohngmotiozlj/functions → **Knovo** → **Code**.

The owner has the complete new file (`Knovo-plans-index.ts`, sent privately, not kept in this public
repository). The easy way is: select all the old code, paste that whole file over it, press **Deploy updates**.

The parts that changed are listed here so the change can also be made by hand.

### 2a. Constants (replace the old CREDITS block near the top)

```ts
/* ---- CREDITS (1 credit = 1 normal Knovo message) ----
   Free:   FREE_DAILY_CREDITS a day (refills 24 hours after the first use), then top-up credits.
   Paid:   a pool of plan credits (no daily cap), then top-up credits.
           monthly / annual: POOL.monthly credits, refilled every month while the plan is active.
           season: POOL.season credits in total, usable until the plan ends (120 days), no refill.
   Owner:  never charged. Nobody else is unlimited. */
const FREE_DAILY_CREDITS = 20;
const CREDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const POOL: Record<string, number> = { monthly: 1500, annual: 1500, season: 5000 };
const CREDIT_COST: Record<string, number> = {
  chat: 1,         // one message (also: mark my answer, flashcards, a scanned question)
  lesson_qa: 1,    // one raised-hand question during a Live Lesson
  whiteboard: 10,  // one full Live Lesson
  image: 3,        // one generated image (Cloudflare flux-1-schnell)
};
const LONG_MESSAGE_CHARS = 4000;                // a very long message (pasted files, zips) costs 1 extra
```

### 2b. Balances taken by this request, and giving them back (replace the old `refund`)

```ts
    let credits: Record<string, unknown> | null = null;
    /* what this request took from each bucket, so a failed AI call can give it all back */
    let took = { daily: 0, pool: 0, topup: 0 };
    /* Give the allowance back when the AI call fails, so students never lose a lesson to a server error. */
    let charged: string | null = null;
    async function refund() {
      if (took.daily + took.pool + took.topup > 0) {
        const back = took; took = { daily: 0, pool: 0, topup: 0 };
        for (let attempt = 0; attempt < 3; attempt++) {
          const { data: row } = await supabaseAdmin.from("user_limits")
            .select("credits_used,pool_credits_left,topup_credits_left").eq("user_id", user.id).single();
          if (!row) break;
          const { data: done } = await supabaseAdmin.from("user_limits").update({
            credits_used: Math.max(0, Number(row.credits_used ?? 0) - back.daily),
            pool_credits_left: Number(row.pool_credits_left ?? 0) + back.pool,
            topup_credits_left: Number(row.topup_credits_left ?? 0) + back.topup,
          }).eq("user_id", user.id).eq("credits_used", row.credits_used).eq("pool_credits_left", row.pool_credits_left)
            .eq("topup_credits_left", row.topup_credits_left).select("user_id");
          if (done && done.length) break;
        }
        return;
      }
      if (!charged) return;
      const col = charged; charged = null;
      const { data: row } = await supabaseAdmin.from("user_limits").select(col).eq("user_id", user.id).single();
      const c = Number(row?.[col] ?? 0);
      if (c > 0) await supabaseAdmin.from("user_limits").update({ [col]: c - 1 }).eq("user_id", user.id).eq(col, c);
    }
```

### 2c. Cost logging (add before `let remaining`)

```ts
    /* Cost log: what each request used, so the owner can see the real cost per action.
       Works for Gemini (usageMetadata) and Cloudflare (usage). If Grok is added later, pass
       { promptTokenCount: usage.prompt_tokens, candidatesTokenCount: usage.completion_tokens,
         thoughtsTokenCount: usage.completion_tokens_details?.reasoning_tokens } and provider "grok". */
    async function logCost(model: string, provider: string, u: any) {
      try {
        await supabaseAdmin.from("knovo_usage_log").insert({
          user_id: user.id, mode, model, provider,
          input_tokens: Number(u?.promptTokenCount ?? 0),
          output_tokens: Number(u?.candidatesTokenCount ?? 0),
          thinking_tokens: Number(u?.thoughtsTokenCount ?? 0),
        });
      } catch (_) { /* never let logging break an answer */ }
    }
```

Call it after a successful answer and after a successful image:

```ts
await logCost(usedModel, usedProvider, data?.usageMetadata);                       // text answers
await logCost("@cf/black-forest-labs/flux-1-schnell", "cloudflare", null);         // images
```

`usedProvider` is `"gemini"` by default and is set to `"cloudflare"` when the backup model answered. For the
Cloudflare backup, the reply's `result.usage.prompt_tokens` and `completion_tokens` are copied into
`usageMetadata` so the same call logs them.

### 2d. Taking credits in the right order (replace the old `takeCredits`)

```ts
    /* Take `cost` credits in the right order. Returns ok:false with the wait when there are not enough.
       Returns null when the credit columns do not exist yet (then the old limits are used). */
    async function takeCredits(cost: number): Promise<{ ok: boolean; msLeft: number; info: Record<string, unknown> } | null> {
      for (let attempt = 0; attempt < 4; attempt++) {
        const { data: row, error } = await supabaseAdmin.from("user_limits")
          .select("plan,pro_until,plan_type,pool_credits_left,pool_size,pool_resets_at,topup_credits_left,topup_expires_at,credits_used,credits_window_start")
          .eq("user_id", user.id).single();
        if (error || !row) return null;
        const now = Date.now();
        const iso = (ms: number) => new Date(ms).toISOString();
        const paid = row.plan === "pro" && (!row.pro_until || new Date(row.pro_until).getTime() > now);
        const topupOk = Number(row.topup_credits_left ?? 0) > 0 && (!row.topup_expires_at || new Date(row.topup_expires_at).getTime() > now);
        const topup = topupOk ? Number(row.topup_credits_left) : 0;
        const upd: Record<string, unknown> = { updated_at: iso(now) };
        let take = { daily: 0, pool: 0, topup: 0 };
        let info: Record<string, unknown>;
        let have = 0, msLeft = 0;

        if (paid) {
          /* gifted Pro and old Pro accounts have no plan_type yet: they get the monthly allowance */
          const type = ["monthly", "season", "annual"].includes(row.plan_type) ? row.plan_type : "monthly";
          let pool = Number(row.pool_credits_left ?? 0);
          let size = Number(row.pool_size ?? 0);
          let resets = row.pool_resets_at ? new Date(row.pool_resets_at).getTime() : 0;
          if (!size) { size = POOL[type]; pool = size; upd.pool_size = size; upd.plan_type = type; if (type !== "season") resets = 0; }
          if (type !== "season" && resets <= now) {            // a new month: refill
            pool = size; const d = new Date(now); d.setMonth(d.getMonth() + 1); resets = d.getTime();
            upd.pool_resets_at = iso(resets);
          }
          have = pool + topup;
          const end = row.pro_until ? new Date(row.pro_until).getTime() : 0;
          msLeft = type === "season" ? Math.max(0, end - now) : Math.max(0, resets - now);
          take.pool = Math.min(pool, cost); take.topup = cost - take.pool;
          upd.pool_credits_left = pool - take.pool;
          info = { plan: type, left: pool - take.pool, poolLeft: pool - take.pool, poolSize: size,
                   poolResetsAt: type === "season" ? (end ? iso(end) : null) : iso(resets), daily: FREE_DAILY_CREDITS };
        } else {
          let used = Number(row.credits_used ?? 0);
          let start = new Date(row.credits_window_start ?? 0).getTime();
          if (now - start >= CREDIT_WINDOW_MS) { used = 0; start = now; upd.credits_window_start = iso(now); }
          const daily = Math.max(0, FREE_DAILY_CREDITS - used);
          have = daily + topup;
          msLeft = Math.max(0, CREDIT_WINDOW_MS - (now - start));
          take.daily = Math.min(daily, cost); take.topup = cost - take.daily;
          upd.credits_used = used + take.daily;
          info = { plan: "free", left: daily - take.daily, daily: FREE_DAILY_CREDITS, poolLeft: null, poolSize: null, poolResetsAt: null };
        }
        if (have < cost) return { ok: false, msLeft, info: { ...info, left: have, need: cost, topupLeft: topup } };
        if (take.topup > 0) upd.topup_credits_left = topup - take.topup;
        info.topupLeft = topup - take.topup; info.cost = cost; info.resetMs = msLeft;

        /* only save if nobody else changed the balances in the meantime (two tabs, two devices) */
        let q = supabaseAdmin.from("user_limits").update(upd).eq("user_id", user.id)
          .eq("credits_used", row.credits_used).eq("pool_credits_left", row.pool_credits_left).eq("topup_credits_left", row.topup_credits_left);
        const { data: saved } = await q.select("user_id");
        if (saved && saved.length) { took = take; return { ok: true, msLeft, info }; }
      }
      return { ok: false, msLeft: 60000, info: { left: 0, need: cost, daily: FREE_DAILY_CREDITS, plan: "free", topupLeft: 0 } };
    }
```

### 2e. Charging each request (replace the old `if (!isOwner) { ... }` block)

```ts
    if (!isOwner) {
      const { data: lim } = await supabaseAdmin
        .from("user_limits").select("plan").eq("user_id", user.id).single();
      if (lim?.plan === "pro") userPlan = "pro";

      {
        const lastTurn = Array.isArray(contents) && contents.length ? String(contents[contents.length - 1]?.parts?.[0]?.text ?? "") : "";
        const cost = (CREDIT_COST[mode] ?? 1) + (mode === "chat" && lastTurn.length > LONG_MESSAGE_CHARS ? 1 : 0);
        const c = await takeCredits(cost);
        if (c) {
          if (!c.ok) return json({ error: "LIMIT_REACHED", mode, msLeft: c.msLeft, credits: c.info }, 429);
          credits = c.info;
          userPlan = String(c.info.plan) === "free" ? "free" : "pro";
          remaining = Number(c.info.left ?? 0) + Number(c.info.topupLeft ?? 0);
        } else if (userPlan === "pro") {
          /* credit columns missing: old behaviour (Pro not counted) until the database step is done */
        } else
        if (mode === "whiteboard") {
          const r = await consume("whiteboard_count", "whiteboard_window_start", WB_LIMIT, WB_WINDOW_MS);
          if (r.n === -1) return json({ error: "LIMIT_REACHED", mode: "whiteboard", msLeft: r.msLeft }, 429);
          remaining = WB_LIMIT - r.n; charged = "whiteboard_count";
        } else if (mode === "image") {
          const r = await consume("image_count", "image_window_start", IMAGE_LIMIT, IMAGE_WINDOW_MS);
          if (r.n === -1) return json({ error: "LIMIT_REACHED", mode: "image", msLeft: r.msLeft }, 429);
          remaining = IMAGE_LIMIT - r.n; charged = "image_count";
        } else {
          const r = await consume("chat_count", "chat_window_start", CHAT_LIMIT, CHAT_WINDOW_MS);
          if (r.n === -1) return json({ error: "LIMIT_REACHED", mode: "chat", msLeft: r.msLeft }, 429);
          remaining = CHAT_LIMIT - r.n; charged = "chat_count";
        }
      }
    }
```

### 2f. What the function sends back to the website

Every successful reply carries:

```ts
usage: {
  plan: "free" | "pro" | "owner",
  remaining,              // plan or daily credits left + top-up credits, or "unlimited" for the owner
  credits: {
    plan,                 // "free" | "monthly" | "season" | "annual"
    left,                 // daily credits left (free) or pool credits left (paid)
    daily,                // 20
    cost,                 // what this request cost
    resetMs,              // milliseconds until the daily refill, the monthly refill, or the pass ending
    poolLeft, poolSize,   // paid plans only (null for free)
    poolResetsAt,         // next monthly refill, or the end date of a Season Pass
    topupLeft
  },
  model
}
```

When there are not enough credits it answers with HTTP 429:

```ts
{ error: "LIMIT_REACHED", mode, msLeft, credits: { plan, left, need, daily, topupLeft, poolSize, poolResetsAt } }
```

Here `left` is everything the student could still spend (own credits plus top-up).

---

## Step 3. Check it

1. Sign in on the website with a normal student account (not the owner account).
2. Open Knovo. Above the message box it should say **20 credits a day**.
3. Send one message. It should change to **19 / 20 credits today**.
4. In the private owner site, give that account a Monthly plan. After the next message it should show
   **1,499 / 1,500 credits this month, refills on …**.
5. Give it a top-up. The line should end with **+ 300 top-up credits**.

## Not done

- **Payments.** Nothing can be bought. A plan or a top-up reaches a student only when the owner gives it.
- **Automatic renewal.** Monthly and Annual plans end on `pro_until`; nothing charges or extends them.
- **Exact model prices** for the cost view (see above).
