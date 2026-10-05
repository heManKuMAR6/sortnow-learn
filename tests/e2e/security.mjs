import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const B=process.env.BASE_URL||'http://localhost:3100'; const b=await chromium.launch();
let bad=0; const ok=(c,l)=>{console.log(c?'ok  ':'FAIL',l); if(!c) bad++;};
const stamp=Date.now()+1;
const ctxOf=()=>b.newContext({viewport:{width:1280,height:900}});
async function signup(ctx,name,email){ const p=await ctx.newPage(); await p.goto(B+'/signup',{waitUntil:'networkidle'}); await p.fill('input[name=name]',name); await p.fill('input[name=email]',email); await p.fill('input[name=password]','secret12'); await p.click('button:has-text("Create my account")'); await p.waitForURL('**/dashboard',{timeout:15000}); await p.waitForTimeout(800); return p; }
async function signin(ctx,email){ const p=await ctx.newPage(); await p.goto(B+'/login',{waitUntil:'networkidle'}); await p.fill('input[name=email]',email); await p.fill('input[name=password]','secret12'); await p.click('button:has-text("Sign in")'); await p.waitForURL('**/dashboard',{timeout:15000}); await p.waitForTimeout(800); return p; }
async function signout(p){ await p.goto(B+'/dashboard',{waitUntil:'networkidle'}); await p.click('.avatar-btn'); await p.click('.menu-foot button:has-text("Sign out")'); await p.waitForURL(B+'/'); await p.waitForTimeout(500); }
const chip=async p=>((await p.locator('.stat-chip').innerText()).replace(/\s+/g,' ').trim());
const LESSON='/learn/beginner/what-a-neural-network-is';

// ===== 1. forged demo session cookie
const victimEmail=`victim${stamp}@example.com`; const vctx=await ctxOf(); const vp=await signup(vctx,'Vic Victim',victimEmail);
const users=JSON.parse(readFileSync(new URL('../../data/demo-users.json', import.meta.url),'utf8')); const vid=users.find(u=>u.email===victimEmail).id;
await vp.goto(B+'/dashboard',{waitUntil:'networkidle'}); const handle=(await vp.evaluate(()=>document.querySelector('.menu-pop')?.textContent||'')) || '';
const hres=await (await vctx.request.get(B+'/settings')).text(); const vhandle=(hres.match(/\/u\/([a-z0-9-]+)/)||[])[1];
const forged=['{"id":"'+vid+'","email":"'+victimEmail+'"}', Buffer.from('{"id":"'+vid+'","email":"'+victimEmail+'"}').toString('base64url')+'.AAAA', Buffer.from('{"id":"'+vid+'","email":"'+victimEmail+'"}').toString('base64url')];
for (const [i,val] of forged.entries()) {
  const f=await ctxOf(); await f.addCookies([{name:'sortnow_learn_demo',value:encodeURIComponent(val),url:B}]);
  const r=await f.request.patch(B+'/api/profile',{data:{headline:'PWNED'}}); ok(r.status()===401,`forged demo cookie #${i+1} cannot edit a profile (HTTP ${r.status()})`);
  const d=await f.request.get(B+'/dashboard',{maxRedirects:0}); ok(d.status()>=300&&d.status()<400,`forged demo cookie #${i+1} cannot open the dashboard`);
  await f.close();
}
const pub=await (await (await ctxOf()).request.get(B+'/u/'+vhandle)).text(); ok(!pub.includes('PWNED'),'victim profile unchanged by forgery');
// real cookie still works
const rr=await vctx.request.patch(B+'/api/profile',{data:{headline:'Real edit'}}); ok(rr.status()===200,'the genuine signed session still works');

// ===== 2. forged lead cookie
for (const val of ['1','1.AAAA','bGVhZDp2MQ.AAAA']) { const f=await ctxOf(); await f.addCookies([{name:'sortnow_learn_lead',value:val,url:B}]); const h=await (await f.request.get(B+'/ig/skills')).text(); ok(!h.includes('Follow this skill one step at a time')&&h.includes('Unlock this drop'),`lead cookie "${val.slice(0,10)}" does not unlock the drop`); await f.close(); }

// ===== 3. redirects
const sctx=await ctxOf(); const sp=await signup(sctx,'Sam Safe',`sam${stamp}@example.com`);
const evil=['//evil.com','/\\evil.com','/.//evil.com','https://evil.com','javascript:alert(1)','/%5Cevil.com','///evil.com','/\t/evil.com'];
for (const e of evil) { const r=await sctx.request.get(B+'/login?next='+encodeURIComponent(e),{maxRedirects:0}); const loc=r.headers()['location']||''; const sameSite = r.status()>=300 && loc.startsWith('/') && !loc.startsWith('//') && !loc.includes('\\') && !/^https?:/i.test(loc); ok(sameSite,`login?next=${JSON.stringify(e)} stays on this site -> ${loc||r.status()}`); }
const good=await sctx.request.get(B+'/login?next=/challenges',{maxRedirects:0}); ok((good.headers()['location']||'').endsWith('/challenges'),'a normal same-site return path still works');
const anon=await ctxOf(); for (const u of ['/signup?next=/a&next=/b','/login?next=/a&next=/b','/signup?next=x&next=y&next=z']) { const r=await anon.request.get(B+u); ok(r.status()===200,`repeated ?next= params no longer crash (${u} -> ${r.status()})`); }

// ===== 4. coach
ok((await anon.request.post(B+'/api/coach',{data:{lessonSlug:'what-a-neural-network-is',question:'What is a weight?'}})).status()===401,'guest coach call -> 401');
let okCount=0,limited=0; for(let i=0;i<24;i++){ const r=await sctx.request.post(B+'/api/coach',{data:{lessonSlug:'what-a-neural-network-is',question:'What is a weight?'}}); if(r.status()===200) okCount++; if(r.status()===429) limited++; }
ok(okCount===20&&limited===4,`signed-in coach works, then is rate limited (200s: ${okCount}, 429s: ${limited})`);

// ===== 5. forged rewards through the API
const rctx=await ctxOf(); await signup(rctx,'Rae Reward',`rae${stamp}@example.com`);
const c1=await (await rctx.request.post(B+'/api/checkin',{data:{day:'2099-01-01',tz:'UTC',lessons:['fake-lesson','what-a-neural-network-is']}})).json();
ok(c1.checkin.streak===1&&c1.lessonPoints===5,'a forged day adds no streak; invented lesson ignored, real lesson paid 5 (streak '+c1.checkin.streak+', lesson pts '+c1.lessonPoints+')');
for (const d of ['2026-01-01','2099-12-31','1999-01-01']) { const c=await (await rctx.request.post(B+'/api/checkin',{data:{day:d,tz:'UTC'}})).json(); ok(!c.checkin.awarded&&c.checkin.streak===1,`submitting day ${d} cannot add a streak day`); }
ok((await rctx.request.post(B+'/api/progress/lesson',{data:{slug:'made-up'}})).status()===404,'invented lesson slug -> 404');
ok((await rctx.request.post(B+'/api/challenges/made-up',{data:{answers:[0,0,0,0]}})).status()===404,'invented challenge slug -> 404');
ok((await rctx.request.post(B+'/api/challenges/write-a-better-prompt',{data:{answers:[9,9,9,9]}})).status()===400,'out-of-range answers -> 400');
const wrong=await (await rctx.request.post(B+'/api/challenges/write-a-better-prompt',{data:{answers:[0,0,0,0]}})).json(); ok(!wrong.passed&&wrong.gained===0,'wrong answers earn nothing');

// ===== 6. progress: isolation between accounts, server truth across devices, no undo
const pctx=await ctxOf(); const aEmail=`a${stamp}@example.com`; let ap=await signup(pctx,'Account A',aEmail);
await ap.goto(B+LESSON,{waitUntil:'networkidle'}); await ap.click('button:has-text("Mark as complete")'); await ap.waitForSelector('text=✓ Completed',{timeout:8000});
ok(!(await ap.locator('button:has-text("undo")').count()),'signed-in completion has no (fake) undo');
await signout(ap);
const bp=await signup(pctx,'Account B',`b${stamp}@example.com`); await bp.goto(B+LESSON,{waitUntil:'networkidle'}); await bp.waitForTimeout(800);
ok((await bp.locator('button:has-text("Mark as complete")').count())===1,'a second account in the same browser does NOT inherit the first one\'s completed lesson');
await bp.goto(B+'/learn',{waitUntil:'networkidle'}); ok((await bp.locator('text=0 of 2 done').count())>=1,'second account sees 0 progress on the lessons page');
await signout(bp);
const a2=await signin(pctx,aEmail); await a2.goto(B+LESSON,{waitUntil:'networkidle'}); await a2.waitForTimeout(800); ok((await a2.locator('text=✓ Completed').count())>0,'first account is still complete after signing back in');
const dctx=await ctxOf(); const d2=await signin(dctx,aEmail); await d2.goto(B+LESSON,{waitUntil:'networkidle'}); await d2.waitForTimeout(800); ok((await d2.locator('text=✓ Completed').count())>0,'a different browser/device shows the server-completed lesson as complete');

// guest ticks merge into the account once, then do not leak to the next account
const gctx=await ctxOf(); const gp=await gctx.newPage(); await gp.goto(B+LESSON,{waitUntil:'networkidle'}); await gp.click('button:has-text("Mark as complete")'); await gp.waitForTimeout(400);
ok((await gp.locator('button:has-text("undo")').count())===1,'guests can still tick and untick locally');
const cp=await signup(gctx,'Account C',`c${stamp}@example.com`); await cp.waitForTimeout(1500); await cp.reload({waitUntil:'networkidle'});
ok(/6/.test(await chip(cp)),'guest tick was merged into the new account (+1 check-in +5 lesson = 6): '+await chip(cp));
await signout(cp); const dp=await signup(gctx,'Account D',`d${stamp}@example.com`); await dp.goto(B+LESSON,{waitUntil:'networkidle'}); await dp.waitForTimeout(800);
ok((await dp.locator('button:has-text("Mark as complete")').count())===1,'the next account in that browser starts clean (guest ticks were cleared)');

// ===== 7. passing a challenge before signing up is not lost
const ectx=await ctxOf(); const ep=await ectx.newPage(); await ep.goto(B+'/challenges/write-a-better-prompt',{waitUntil:'networkidle'});
for (let i=0;i<4;i++){ await ep.locator('.opt').nth(1).click(); await ep.click(i<3?'button:has-text("Next")':'button:has-text("Check my answers")'); await ep.waitForTimeout(350); }
await ep.waitForSelector('text=Solved'); ok((await ep.locator('text=Create account, earn the points').count())===1,'guest sees the sign-up offer after passing');
await ep.click('text=Create account, earn the points'); await ep.waitForURL('**/signup**');
await ep.fill('input[name=name]','Eve Earner'); await ep.fill('input[name=email]',`eve${stamp}@example.com`); await ep.fill('input[name=password]','secret12'); await ep.click('button:has-text("Create my account")');
await ep.waitForURL('**/challenges/write-a-better-prompt',{timeout:15000}); await ep.waitForSelector('text=You earned 20 points',{timeout:10000});
ok(true,'after sign-up the passed result is claimed automatically (not sent back to Question 1)');
await ep.waitForTimeout(800); await ep.reload({waitUntil:'networkidle'}); ok(/21/.test(await chip(ep)),'account has 21 points (1 check-in + 20): '+await chip(ep));

// ===== 8. account deletion
const xctx=await ctxOf(); const xEmail=`x${stamp}@example.com`; await signup(xctx,'Xena Gone',xEmail);
const xh=((await (await xctx.request.get(B+'/settings')).text()).match(/\/u\/([a-z0-9-]+)/)||[])[1];
ok((await xctx.request.delete(B+'/api/account',{data:{confirm:'nope'}})).status()===400,'delete needs the exact word DELETE');
ok((await xctx.request.delete(B+'/api/account',{data:{confirm:'DELETE'}})).status()===200,'account deleted');
ok((await (await ctxOf()).request.get(B+'/u/'+xh)).status()===404,'deleted profile is gone');
const xp=await (await ctxOf()).newPage(); await xp.goto(B+'/login',{waitUntil:'networkidle'}); await xp.fill('input[name=email]',xEmail); await xp.fill('input[name=password]','secret12'); await xp.click('button:has-text("Sign in")'); await xp.waitForSelector('text=does not match',{timeout:8000}); ok(true,'deleted account can no longer sign in');

// ===== 9. a page left open across midnight checks in again
const mctx=await ctxOf(); const mp0=await signup(mctx,'Mia Midnight',`mia${stamp}@example.com`); await mp0.close();
const mp=await mctx.newPage(); let calls=0; mp.on('request',r=>{ if(r.url().endsWith('/api/checkin')&&r.method()==='POST') calls++; });
await mp.clock.install({time:new Date(2031,0,5,23,59,30)}); await mp.goto(B+'/dashboard',{waitUntil:'networkidle'}); await mp.waitForTimeout(800);
const first=calls; await mp.clock.fastForward('00:10:00'); await mp.waitForTimeout(1500);
ok(first===1&&calls===2,`check-in is retried after midnight without a reload (calls: ${first} then ${calls})`);

await b.close(); console.log(bad?`SECURITY SUITE: ${bad} FAILED`:'SECURITY SUITE: ALL PASSED');
