import { chromium } from 'playwright';
const B=process.env.BASE_URL||'http://localhost:3100'; const b=await chromium.launch();
let bad=0; const ok=(c,l)=>{console.log(c?'ok  ':'FAIL',l); if(!c) bad++;};
const signup=async(ctx,email,name)=>{ const pg=await ctx.newPage(); await pg.goto(B+'/signup',{waitUntil:'networkidle'}); await pg.fill('input[name=name]',name); await pg.fill('input[name=email]',email); await pg.fill('input[name=password]','secret12'); await pg.click('button:has-text("Create my account")'); await pg.waitForURL('**/dashboard'); return pg; };

// --- anonymous visitor
const anon=await b.newContext({viewport:{width:1440,height:900}}); const ap=await anon.newPage();
await ap.goto(B+'/jobs',{waitUntil:'networkidle'}); await ap.waitForTimeout(1500);
const html=await (await anon.request.get(B+'/jobs')).text();
ok((await ap.locator('text=8 open roles').count())>0,'public /jobs shows "8 open roles"');
ok((await ap.locator('.card h3').count())===8,'8 job cards rendered');
const emails=[...new Set((html+await (await anon.request.get(B+'/jobs/iam-engineer-humana')).text()).match(/[\w.+-]+@[\w-]+\.[\w.]+/g)||[])].filter(e=>!e.includes('sortnow.co')&&!e.includes('example'));
ok(emails.every(e=>e==='hemanofficial6@gmail.com'),'the only email on jobs pages is hemanofficial6@gmail.com -> '+JSON.stringify(emails));
ok(!/\b\d{3}[-. )]+\d{3}[-. ]\d{4}\b/.test(html),'no phone numbers on the jobs page');
await ap.screenshot({path:(process.env.SHOTS||'/tmp')+'/jobs-public.png'});
await ap.goto(B+'/jobs/ai-architect-hitachi',{waitUntil:'networkidle'}); await ap.waitForTimeout(1000);
const href=await ap.locator('a[data-track=job-email]').getAttribute('href');
ok(href.startsWith('mailto:hemanofficial6@gmail.com?subject=')&&decodeURIComponent(href).includes('AI Architect'),'detail page mailto goes to sortNow with the role in the subject');
ok(!(await ap.locator('text=Manage jobs').count()),'no admin controls for visitors');
await ap.screenshot({path:(process.env.SHOTS||'/tmp')+'/jobs-detail2.png',fullPage:true});
// anonymous admin attempts
ok((await anon.request.get(B+'/admin/jobs')).status()===404,'anonymous GET /admin/jobs -> 404');
for (const [m,d] of [['post',{title:'x',location:'x',mode:'Remote',level:'Mid'}],['patch',{slug:'iam-engineer-humana',status:'closed'}],['delete',{slug:'iam-engineer-humana'}]]) {
  const r=await anon.request[m](B+'/api/admin/jobs',{data:d}); ok(r.status()===404,`anonymous ${m.toUpperCase()} /api/admin/jobs -> ${r.status()}`);
}

// --- ordinary signed-in member
const mem=await b.newContext({viewport:{width:1440,height:900}}); const mp=await signup(mem,`member${Date.now()}@example.com`,'Maya Member');
ok((await mem.request.get(B+'/admin/jobs')).status()===404,'member GET /admin/jobs -> 404');
for (const [m,d] of [['post',{title:'Evil',location:'x',mode:'Remote',level:'Mid'}],['patch',{slug:'iam-engineer-humana',status:'closed'}],['delete',{slug:'iam-engineer-humana'}]]) {
  const r=await mem.request[m](B+'/api/admin/jobs',{data:d}); ok(r.status()===404,`member ${m.toUpperCase()} /api/admin/jobs -> ${r.status()}`);
}
await mp.goto(B+'/jobs',{waitUntil:'networkidle'}); ok(!(await mp.locator('text=Manage jobs').count()),'member sees no "Manage jobs" button');
ok((await anon.request.get(B+'/jobs/iam-engineer-humana')).status()===200,'member attempts changed nothing (role still public)');

// --- admin
const adm=await b.newContext({viewport:{width:1440,height:1000}}); const dp=await signup(adm,'admin@example.com','Ada Admin');
await dp.goto(B+'/jobs',{waitUntil:'networkidle'}); ok((await dp.locator('text=Manage jobs').count())>0,'admin sees "Manage jobs"');
await dp.goto(B+'/admin/jobs',{waitUntil:'networkidle'}); await dp.waitForTimeout(1000);
ok((await dp.locator('[data-testid=admin-job-list] li').count())===8,'admin page lists all 8 roles');
await dp.screenshot({path:(process.env.SHOTS||'/tmp')+'/admin-jobs.png'});
// post
await dp.fill('input[maxlength="120"]','Prompt Engineer'); await dp.fill('input[placeholder^="Dallas"]','Remote'); await dp.fill('input[maxlength="300"]','Write and test prompts for a support assistant.');
await dp.fill('textarea','First paragraph about the role.\n\nSecond paragraph.'); await dp.fill('input[maxlength="80"]','Acme AI');
await dp.fill('label:has-text("Skills") input','Prompting, Evaluation');
await dp.click('button:has-text("Post role")'); await dp.waitForTimeout(1200);
ok((await dp.locator('[data-testid=admin-job-list] li').count())===9,'admin posted a role (9 in admin list)');
ok((await anon.request.get(B+'/jobs')).status()===200 && (await (await anon.request.get(B+'/jobs')).text()).includes('Prompt Engineer'),'new role is visible to the public');
const slug=await dp.locator('[data-testid=admin-job-list] li:has-text("Prompt Engineer") a').getAttribute('href').then(h=>h.split('/').pop());
// close
await dp.locator('li:has-text("Prompt Engineer") button:has-text("Close")').click(); await dp.waitForTimeout(900);
ok(!(await (await anon.request.get(B+'/jobs')).text()).includes('Prompt Engineer'),'closing hides it from the public list');
ok((await anon.request.get(B+'/jobs/'+slug)).status()===404,'closed role is 404 for the public');
await dp.goto(B+'/jobs/'+slug,{waitUntil:'networkidle'}); ok((await dp.locator('text=Closed (only admins see this)').count())>0,'admin can still open the closed role');
// edit
await dp.goto(B+'/admin/jobs',{waitUntil:'networkidle'}); await dp.locator('li:has-text("Prompt Engineer") button:has-text("Edit")').click();
await dp.fill('input[maxlength="120"]','Senior Prompt Engineer'); await dp.selectOption('label:has-text("Status") select','open'); await dp.click('button:has-text("Save changes")'); await dp.waitForTimeout(1200);
ok((await (await anon.request.get(B+'/jobs')).text()).includes('Senior Prompt Engineer'),'edit + reopen shows the new title publicly');
// validation
const badr=await adm.request.post(B+'/api/admin/jobs',{data:{title:'Bad',location:'x',mode:'Moon',level:'Mid'}}); ok(badr.status()===400,'invalid work mode rejected (400)');
// delete
dp.on('dialog',d=>d.accept()); await dp.locator('li:has-text("Senior Prompt Engineer") button:has-text("Delete")').click(); await dp.waitForTimeout(1000);
ok(!(await (await anon.request.get(B+'/jobs')).text()).includes('Senior Prompt Engineer'),'deleted role is gone');
ok((await dp.locator('[data-testid=admin-job-list] li').count())===8,'back to the 8 starter roles');
await b.close(); console.log(bad?'JOBS TESTS FAILED':'ALL JOBS TESTS PASSED');
