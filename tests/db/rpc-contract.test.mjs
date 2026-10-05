// supabase-js (the real client the app uses) -> fake PostgREST -> real Postgres engine + real schema.sql
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';
import http from 'http';
import { createRequire } from 'module';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { createClient } = require('@supabase/supabase-js');

const db = new PGlite();
await db.exec(`
 create role anon nologin; create role authenticated nologin;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.sub', true),'')::uuid $$;
 create schema storage; create table storage.buckets(id text primary key, name text, public boolean);
 create table storage.objects(name text, bucket_id text);
 create function storage.foldername(n text) returns text[] language sql as $$ select string_to_array(n,'/') $$;
 grant usage on schema public, auth to anon, authenticated;`);
await db.exec(readFileSync(new URL('../../supabase/schema.sql', import.meta.url),'utf8').replace('create extension if not exists pgcrypto;',''));
const U='11111111-1111-1111-1111-111111111111';
await db.exec(`insert into auth.users values ('${U}'); insert into profiles(id,handle,display_name) values ('${U}','hk-1','HK')`);

const b64u=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt=`${b64u({alg:'HS256',typ:'JWT'})}.${b64u({sub:U,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})}.sig`;

// Minimal PostgREST: POST /rest/v1/rpc/<fn> with named args, as the authenticated user.
const server = http.createServer(async (req,res)=>{
  let body=''; for await (const c of req) body+=c;
  res.setHeader('content-type','application/json');
  const m=req.url.match(/^\/rest\/v1\/rpc\/([a-z_]+)/);
  if(!m){ res.statusCode=404; res.end('{}'); return; }
  const fn=m[1]; const args=body?JSON.parse(body):{};
  try {
    await db.exec(`set role authenticated; select set_config('request.jwt.sub','${U}',false)`);
    const meta=(await db.query(`select proretset, array_to_string(proargnames,',') names from pg_proc where proname=$1 and pronamespace='public'::regnamespace`,[fn])).rows[0];
    if(!meta){ res.statusCode=404; res.end(JSON.stringify({code:'PGRST202',message:'not found'})); return; }
    const names=Object.keys(args); const params=names.map((n,i)=>`${n} => $${i+1}`).join(', ');
    const vals=names.map(n=>Array.isArray(args[n])?`{${args[n].join(',')}}`:args[n]);
    const out = meta.proretset
      ? (await db.query(`select to_jsonb(t) j from ${fn}(${params}) t`,vals)).rows.map(r=>r.j)
      : (await db.query(`select to_jsonb(${fn}(${params})) j`,vals)).rows[0].j;
    res.end(JSON.stringify(out));
  } catch(e){ res.statusCode=400; res.end(JSON.stringify({code:e.code||'P0001',message:e.message})); }
  finally { await db.exec('reset role'); }
});
await new Promise(r=>server.listen(54399,r));
const supabase = createClient('http://localhost:54399','a'.repeat(40),{ global:{ headers:{ Authorization:`Bearer ${jwt}` } }, auth:{persistSession:false,autoRefreshToken:false} });

let bad=0; const ok=(c,l)=>{console.log(c?'ok  ':'FAIL',l); if(!c) bad++;};
const rows=d=>Array.isArray(d)?d[0]:d;
// the exact calls supabase-store.ts makes
let { data, error } = await supabase.rpc('set_timezone',{ p_tz:'America/Chicago' }); ok(!error&&data==='America/Chicago','set_timezone returns the timezone as a string');
({ data, error } = await supabase.rpc('checkin')); let r=rows(data); ok(!error&&r.o_awarded===true&&r.o_streak===1&&r.o_points===1&&/^\d{4}-\d{2}-\d{2}$/.test(r.o_day),'checkin: o_awarded/o_streak/o_points and o_day as YYYY-MM-DD');
({ data, error } = await supabase.rpc('checkin')); ok(!error&&rows(data).o_awarded===false,'checkin twice in a day -> not awarded');
({ data, error } = await supabase.rpc('complete_lesson',{ p_slug:'what-a-neural-network-is' })); r=rows(data); ok(!error&&r.o_awarded&&r.o_gained===5&&r.o_points===6,'complete_lesson: awarded, gained 5, points 6');
({ data, error } = await supabase.rpc('complete_lesson',{ p_slug:'nope' })); ok(!!error&&/unknown lesson/i.test(error.message),'complete_lesson(unknown) -> error the store maps to 404: '+error?.message);
({ data, error } = await supabase.rpc('submit_challenge',{ p_slug:'write-a-better-prompt', p_answers:[1,1,1,1] })); r=rows(data);
ok(!error&&r.o_passed&&r.o_awarded&&r.o_gained===20&&Array.isArray(r.o_correct)&&r.o_correct.every(Number.isInteger)&&r.o_correct.length===4,'submit_challenge: passed, +20, o_correct is number[4]');
({ data, error } = await supabase.rpc('submit_challenge',{ p_slug:'write-a-better-prompt', p_answers:[1,1,1,1] })); r=rows(data); ok(!error&&r.o_passed&&!r.o_awarded&&r.o_gained===0,'replay: passed, not paid again');
({ data, error } = await supabase.rpc('submit_challenge',{ p_slug:'write-a-better-prompt', p_answers:[1] })); ok(!!error&&/wrong number of answers/i.test(error.message),'wrong answer count -> error the store maps to 400');
({ data, error } = await supabase.rpc('submit_challenge',{ p_slug:'invented', p_answers:[0,0,0,0] })); ok(!!error&&/unknown challenge/i.test(error.message),'invented challenge -> error');
({ data, error } = await supabase.rpc('delete_my_account')); ok(!error,'delete_my_account runs');
ok((await db.query(`select count(*)::int c from profiles where id='${U}'`)).rows[0].c===0,'... and the profile is gone');
server.close(); console.log(bad?`${bad} FAILED`:'RPC CONTRACT: ALL PASSED'); process.exit(bad?1:0);
