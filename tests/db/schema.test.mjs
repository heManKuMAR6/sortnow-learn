import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';
const SQL = () => readFileSync(process.env.SCHEMA||new URL('../../supabase/schema.sql', import.meta.url),'utf8').replace('create extension if not exists pgcrypto;','');
const db = new PGlite();
await db.exec(`
 create role anon nologin; create role authenticated nologin;
 create schema auth; create table auth.users(id uuid primary key, email text, created_at timestamptz default now(), last_sign_in_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.sub', true),'')::uuid $$;
 create schema storage; create table storage.buckets(id text primary key, name text, public boolean);
 create table storage.objects(name text, bucket_id text);
 create function storage.foldername(n text) returns text[] language sql as $$ select string_to_array(n,'/') $$;
 grant usage on schema public, auth to anon, authenticated;
`);
await db.exec(SQL()); await db.exec(SQL());
console.log('schema applied twice OK');
let bad = 0;
const ok = (c,l)=>{ console.log(c?'ok  ':'FAIL', l); if(!c) bad++; };
const as = async (uid, sql, params) => { await db.exec(`set role authenticated; select set_config('request.jwt.sub','${uid}',false)`); try { return await db.query(sql, params); } finally { await db.exec('reset role'); } };
const anonQ = async (sql, params) => { await db.exec("select set_config('request.jwt.sub','',false)"); await db.exec('set role anon'); try { return await db.query(sql, params); } finally { await db.exec('reset role'); } };
const fails = async (label, p) => { try { await p; ok(false, 'should have errored: '+label); } catch(e){ console.log('ok   blocked:', label, '->', e.message.slice(0,70)); } };
const U='11111111-1111-1111-1111-111111111111', V='22222222-2222-2222-2222-222222222222', A='33333333-3333-3333-3333-333333333333';
await db.exec(`insert into auth.users(id) values ('${U}'),('${V}'),('${A}')`);
for (const [id,h,n] of [[U,'hk-123','Hemanth Kumar'],[V,'other-1','Other'],[A,'ada-1','Ada']]) await as(id, `insert into profiles(id,handle,display_name) values ($1,$2,$3)`, [id,h,n]);

// ---- profile tamper-proofing (unchanged guarantees)
await fails('update own points', as(U, `update profiles set points=999 where id=$1`, [U]));
await fails('update own streak', as(U, `update profiles set streak=99 where id=$1`, [U]));
await fails('insert profile with points', as(U, `insert into profiles(id,handle,points) values (gen_random_uuid(),'zz-9',500)`));
await fails('email column does not exist', as(U, `select email from profiles`));

// ---- the old unsafe functions are gone; new check-in takes no date
await fails('old award() is gone', as(U, `select * from award('challenge','invented-challenge',50,current_date,5,5)`));
await fails('checkin(date) is gone (client cannot choose the day)', as(U, `select * from checkin(current_date + 1)`));
await fails('anon cannot check in', anonQ(`select * from checkin()`));

// ---- check-in: +1 point once a day, and it does NOT move the streak
let r = (await as(U, `select * from checkin()`)).rows[0];
ok(r.o_awarded && r.o_streak===0 && r.o_points===1, 'first check-in: +1 point, streak still 0 (showing up is not enough)');
r = (await as(U, `select * from checkin()`)).rows[0];
ok(!r.o_awarded && r.o_points===1, 'second call the same day is a no-op (cannot spam yesterday/today/tomorrow)');

// ---- timezone: first set free, later changes locked for 7 days, junk rejected
await fails('bad timezone rejected', as(V, `select set_timezone('Mars/Olympus')`));
await fails('anon cannot set timezone', anonQ(`select set_timezone('UTC')`));
let tz = (await as(V, `select set_timezone('Pacific/Kiritimati') t`)).rows[0].t; ok(tz==='Pacific/Kiritimati','first timezone set is free');
const dKir = (await db.query(`select local_day('${V}') d`)).rows[0].d;
const expKir = (await db.query(`select (now() at time zone 'Pacific/Kiritimati')::date d`)).rows[0].d;
ok(String(dKir)===String(expKir), "local_day follows the person's timezone");
tz = (await as(V, `select set_timezone('Pacific/Pago_Pago') t`)).rows[0].t; ok(tz==='Pacific/Kiritimati','changing timezone again within 7 days is refused (cannot farm days)');
await db.exec(`update profile_private set tz_changed_at = now() - interval '8 days' where user_id='${V}'`);
tz = (await as(V, `select set_timezone('Pacific/Pago_Pago') t`)).rows[0].t; ok(tz==='Pacific/Pago_Pago','after 7 days the timezone can change');
await fails('cannot write timezone directly', as(V, `update profile_private set timezone='UTC' where user_id=$1`, [V]));
ok((await as(U, `select user_id from profile_private`)).rows.every(x=>x.user_id===U), 'timezone is private: users only see their own row');
ok((await anonQ(`select count(*)::int c from information_schema.columns where table_name='profiles' and column_name='timezone'`)).rows[0].c===0, 'timezone is not a column of the public profile');

// ---- lessons: catalog only, once
r = (await as(U, `select * from complete_lesson('what-a-neural-network-is')`)).rows[0]; ok(r.o_awarded && r.o_gained===5, 'real lesson pays 5');
r = (await as(U, `select * from complete_lesson('what-a-neural-network-is')`)).rows[0]; ok(!r.o_awarded && r.o_gained===0, 'same lesson pays nothing twice');
await fails('invented lesson cannot be paid', as(U, `select * from complete_lesson('made-up-lesson')`));

// ---- challenges: graded in the database
const correct = async slug => (await db.query(`select array_agg(answer order by idx) a from challenge_answers where slug=$1`, [slug])).rows[0].a;
const slug='write-a-better-prompt'; const good=await correct(slug); const wrong=good.map(x=>(x+1)%4);
await fails('invented challenge cannot be paid', as(U, `select * from submit_challenge('invented-challenge', '{0,1,2,3}')`));
await fails('wrong number of answers rejected', as(U, `select * from submit_challenge($1, '{1,1}')`, [slug]));
r = (await as(U, `select * from submit_challenge($1, $2)`, [slug, wrong])).rows[0]; ok(!r.o_passed && !r.o_awarded && r.o_score===0, 'all-wrong answers: no pass, no points');
const before = (await as(U, `select points from profiles where id=$1`, [U])).rows[0].points;
r = (await as(U, `select * from submit_challenge($1, $2)`, [slug, good])).rows[0]; ok(r.o_passed && r.o_awarded && r.o_gained===20 && r.o_score===4, 'correct answers: pass and +20');
ok((await as(U, `select points from profiles where id=$1`, [U])).rows[0].points===before+20, 'profile points went up by exactly 20');
r = (await as(U, `select * from submit_challenge($1, $2)`, [slug, good])).rows[0]; ok(r.o_passed && !r.o_awarded && r.o_gained===0, 'replay passes but pays nothing');
const three=[...good]; three[0]=(good[0]+1)%4; r=(await as(V, `select * from submit_challenge($1,$2)`,[slug,three])).rows[0]; ok(r.o_passed && r.o_score===3,'3 of 4 passes (60 percent)');
const two=[...good]; two[0]=(good[0]+1)%4; two[1]=(good[1]+1)%4; r=(await as(A, `select * from submit_challenge($1,$2)`,[slug,two])).rows[0]; ok(!r.o_passed && r.o_score===2,'2 of 4 does not pass');
ok(r.o_correct===null && r.o_attempts_left===2, 'a failed try hides the answers and counts down the tries');

// ---- direct access to rewards/catalog is closed
await fails('cannot insert awards directly', as(U, `insert into awards(user_id,kind,ref,points,day) values ($1,'lesson','x',50,current_date)`, [U]));
await fails('cannot read the catalog', as(U, `select * from award_catalog`));
await fails('cannot read the answers', as(U, `select * from challenge_answers`));
await fails('anon cannot read the answers', anonQ(`select * from challenge_answers`));
await fails('cannot write daily_activity', as(U, `insert into daily_activity values ($1, current_date, 99)`, [U]));

// ---- public/anon visibility
ok((await anonQ(`select handle from profiles`)).rows.length===3, 'anon reads public profile columns');
await fails('anon reads awards', anonQ(`select * from awards`));

// ---- portfolio / applications / newsletter (unchanged)
await as(U, `insert into portfolio_items(user_id,title,url,tags) values ($1,'Prompt library','https://example.com','{prompting}')`, [U]);
await fails('javascript: portfolio url', as(U, `insert into portfolio_items(user_id,title,url) values ($1,'x','javascript:alert(1)')`, [U]));
await fails('portfolio as someone else', as(U, `insert into portfolio_items(user_id,title) values ($1,'x')`, [V]));
await as(U, `insert into job_applications(user_id,job_slug) values ($1,'ai-ops')`, [U]);
await fails('duplicate application', as(U, `insert into job_applications(user_id,job_slug) values ($1,'ai-ops')`, [U]));
const CONSENT = "consent, consent_at, consent_text";
await fails('newsletter signup without consent', anonQ(`insert into newsletter_subscribers(email) values ('a@b.co')`));
await anonQ(`insert into newsletter_subscribers(email, consent, consent_at, consent_text) values ('a@b.co', true, now(), 'v1')`);
await fails('newsletter duplicate email', anonQ(`insert into newsletter_subscribers(email, consent, consent_at, consent_text) values ('A@B.co', true, now(), 'v1')`));

// ---- jobs board
await db.exec(`insert into admins values ('${A}')`);
ok((await anonQ(`select slug from jobs`)).rows.length===8, 'anon sees the 8 seeded open jobs');
await fails('non-admin cannot insert a job', as(U, `insert into jobs(slug,title,location,mode,level) values ('x-job','x','x','Remote','Mid')`));
await as(A, `insert into jobs(slug,title,location,mode,level) values ('admin-role','Prompt Engineer','Remote','Remote','Mid')`);
await as(A, `update jobs set status='closed' where slug='admin-role'`);
ok((await anonQ(`select slug from jobs`)).rows.length===8 && (await as(A,`select slug from jobs`)).rows.length===9, 'closed role hidden from public, visible to admin');
await fails('cannot make yourself admin', as(U, `insert into admins values ($1)`, [U]));


// ---- consent: nothing is stored without it
const lead = (name, email, phone, source, consent=true) => anonQ(`insert into leads(name,email,phone,source,consent,consent_at,consent_text) values ($1,$2,$3,$4,$5,case when $5 then now() end,case when $5 then 'v1' end)`, [name,email,phone,source,consent]);
await fails('lead without consent', lead('No Consent','n@c.co','9876543210','site',false));
await fails('reel lead without a phone', lead('No Phone','p@c.co',null,'instagram'));
await fails('reel lead with a too-short phone', lead('Short','s@c.co','123','instagram'));
await lead('Reel Fan','fan@c.co','+1 214 555 0100','instagram');
await lead('Site Visitor','v@c.co',null,'site');
ok((await anonQ(`select count(*)::int c from information_schema.tables where table_name='leads'`)).rows[0].c===1, 'leads table exists');
await fails('anon cannot read leads', anonQ(`select * from leads`));
ok((await as(U, `select * from leads`)).rows.length===0, 'a signed-in non-admin sees no leads');
ok((await as(A, `select * from leads`)).rows.length===2, 'an admin sees the leads');
ok((await as(A, `select * from newsletter_subscribers`)).rows.length===1 && (await as(U, `select * from newsletter_subscribers`)).rows.length===0, 'subscribers readable by admins only');
ok((await as(A, `select * from admin_members()`)).rows.length>=3, 'admin_members lists members for an admin');
await fails('non-admin cannot list members', as(U, `select * from admin_members()`));
await fails('anon cannot list members', anonQ(`select * from admin_members()`));

// ---- unsubscribe by token
const tok = (await db.query(`select unsub_token t from newsletter_subscribers where email='a@b.co'`)).rows[0].t;
ok(tok.length===32, 'each subscriber gets a 32-character unsubscribe token');
ok((await anonQ(`select unsubscribe('short') ok`)).rows[0].ok===false, 'a bad token unsubscribes nobody');
ok((await anonQ(`select unsubscribe($1) ok`,[tok])).rows[0].ok===true, 'the token unsubscribes');
ok((await db.query(`select unsubscribed_at is not null u from newsletter_subscribers where email='a@b.co'`)).rows[0].u===true, 'and records when');

// ---- audit events: members only, never anonymous visitors
const evA = (type, path) => anonQ(`insert into events(user_id,type,path,session_id,seconds) values (null,$1,$2,'sess-1',12)`, [type,path]);
await fails('anon cannot log an event on a reel drop', evA('view','/ig/some-drop'));
await fails('anon cannot log a dwell event', evA('dwell','/ig/some-drop'));
await fails('anon cannot log any event', evA('view','/jobs'));
await as(U, `insert into events(user_id,type,path,seconds,referrer,session_id) values ($1,'dwell','/learn/beginner',40,'/', 's2')`, [U]);
ok((await as(A, `select * from events`)).rows.length>=1 && (await as(U, `select * from events where user_id<>$1`,[U])).rows.length===0, 'admins read the audit trail; members only their own rows');
await fails('a member cannot log an event as someone else', as(U, `insert into events(user_id,type,path) values ($1,'view','/x')`, [V]));
await lead('Tagged','tag@c.co','+1 214 555 0102','instagram');
await anonQ(`insert into leads(name,email,phone,source,consent,consent_at,consent_text,campaign) values ('Tag','tag2@c.co','+1 214 555 0103','site',true,now(),'v','ig-week-41')`);
await fails('a bad campaign tag is refused', anonQ(`insert into leads(name,email,phone,source,consent,consent_at,consent_text,campaign) values ('Tag','tag3@c.co','+1 214 555 0104','site',true,now(),'v','bad tag; drop')`));

// ---- streak: only passing today's daily challenge moves it; three tries a day
const W='44444444-4444-4444-4444-444444444444', X='55555555-5555-5555-5555-555555555555';
await db.exec(`insert into auth.users(id) values ('${W}'),('${X}')`);
for (const [id,h,n] of [[W,'wee-1','Wee'],[X,'ex-1','Ex']]) await as(id, `insert into profiles(id,handle,display_name) values ($1,$2,$3)`, [id,h,n]);
const dayW = (await db.query(`select local_day('${W}') d`)).rows[0].d;
const daily = (await db.query(`select daily_slug($1::date) s`, [dayW])).rows[0].s;
ok(typeof daily==='string' && daily.length>3, 'the database picks a daily challenge');
const other = (await db.query(`select ref from award_catalog where kind='challenge' and ref<>$1 limit 1`,[daily])).rows[0].ref;
const gd = await correct(daily), go = await correct(other);
await as(W, `select * from checkin()`);
await as(W, `select * from complete_lesson('how-a-network-learns')`);
await as(W, `select * from submit_challenge($1,$2)`, [other, go]);
ok((await db.query(`select streak from profiles where id='${W}'`)).rows[0].streak===0, 'check-in, a lesson and an ordinary challenge do not move the streak');
r = (await as(W, `select * from submit_challenge($1,$2)`, [daily, gd])).rows[0];
ok(r.o_passed && r.o_daily && r.o_streak_day && r.o_streak===1, 'passing the daily challenge starts the streak');
r = (await as(W, `select * from submit_challenge($1,$2)`, [daily, gd])).rows[0];
ok(r.o_passed && !r.o_streak_day && r.o_streak===1, 'passing it again the same day does not add a second day');
await db.exec(`update profiles set last_active_day = '${dayW.toISOString?.().slice(0,10) ?? dayW}'::date - 1 where id='${W}'; delete from challenge_attempts where user_id='${W}'`);
r = (await as(W, `select * from submit_challenge($1,$2)`, [daily, gd])).rows[0];
ok(r.o_streak_day && r.o_streak===2, 'the next day continues it (2)');
await db.exec(`update profiles set last_active_day = '${dayW.toISOString?.().slice(0,10) ?? dayW}'::date - 4 where id='${W}'; delete from challenge_attempts where user_id='${W}'`);
r = (await as(W, `select * from submit_challenge($1,$2)`, [daily, gd])).rows[0];
ok(r.o_streak===1 && (await db.query(`select longest_streak l from profiles where id='${W}'`)).rows[0].l===2, 'a missed day resets it, longest is kept');
const bad3 = gd.map(x=>(x+1)%4);
await as(X, `select * from submit_challenge($1,$2)`, [daily, bad3]);
r = (await as(X, `select * from submit_challenge($1,$2)`, [daily, bad3])).rows[0];
ok(r.o_correct===null && r.o_attempts_left===1, 'second miss: still no answers');
r = (await as(X, `select * from submit_challenge($1,$2)`, [daily, bad3])).rows[0];
ok(Array.isArray(r.o_correct) && r.o_attempts_left===0, 'third miss: answers revealed, no tries left');
await fails('a fourth try the same day', as(X, `select * from submit_challenge($1,$2)`, [daily, gd]));

// ---- newsletter issues: admins only
await fails('anon cannot read issues', anonQ(`select * from newsletter_issues`));
await fails('a member cannot create an issue', as(U, `insert into newsletter_issues(subject,body) values ('hi','there')`));
await as(A, `insert into newsletter_issues(subject,body,created_by,recipients) values ('Week 41','Hello there',$1,1)`, [A]);
const issueId=(await as(A, `select id from newsletter_issues limit 1`)).rows[0].id;
await as(A, `insert into newsletter_sends(issue_id,email,status) values ($1,'a@b.co','sent')`, [issueId]);
ok((await as(U, `select * from newsletter_issues`)).rows.length===0 && (await as(U, `select * from newsletter_sends`)).rows.length===0, 'members see no issues or send records');
await fails('a member cannot write send records', as(U, `insert into newsletter_sends(issue_id,email,status) values ($1,'z@b.co','sent')`, [issueId]));
ok((await as(A, `select * from newsletter_sends`)).rows.length===1, 'an admin sees the send records');

// ---- job descriptions are real JDs
ok((await anonQ(`select count(*)::int c from jobs where cardinality(responsibilities)>=4 and cardinality(requirements)>=4 and cardinality(about)>=2`)).rows[0].c===8, 'all 8 starter jobs carry responsibilities, requirements and an overview');

// ---- account deletion removes everything of theirs
await as(V, `select delete_my_account()`);
ok((await db.query(`select count(*)::int c from profiles where id='${V}'`)).rows[0].c===0 && (await db.query(`select count(*)::int c from awards where user_id='${V}'`)).rows[0].c===0 && (await db.query(`select count(*)::int c from profile_private where user_id='${V}'`)).rows[0].c===0, 'delete_my_account removes profile, awards and private settings');
await fails('anon cannot delete accounts', anonQ(`select delete_my_account()`));
ok((await anonQ(`select slug from jobs`)).rows.length===8, 're-running schema is idempotent (jobs not duplicated)');
await db.exec(SQL());
ok((await db.query(`select count(*)::int c from award_catalog`)).rows[0].c===18 && (await db.query(`select count(*)::int c from challenge_answers`)).rows[0].c===56, 'catalog and answers present (18 + 56) after re-run');
console.log(bad ? `${bad} FAILED` : 'ALL SQL CHECKS PASSED'); process.exitCode = bad?1:0;
