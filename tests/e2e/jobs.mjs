import { chromium } from 'playwright';
const B=process.env.BASE_URL||'http://localhost:3100'; const b=await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
let bad=0; const ok=(c,l)=>{console.log(c?'ok  ':'FAIL',l); if(!c) bad++;};
const signup=async(ctx,email,name)=>{ const pg=await ctx.newPage(); await pg.goto(B+'/signup',{waitUntil:'networkidle'}); await pg.fill('input[name=name]',name); await pg.fill('input[name=email]',email); await pg.fill('input[name=password]','secret12'); await pg.check('input[type=checkbox] >> nth=0'); await pg.click('button:has-text("Create my account")'); await pg.waitForURL('**/dashboard'); return pg; };

// --- anonymous visitor: jobs are for members, so they are sent to sign in and see nothing of the roles
const anon=await b.newContext({viewport:{width:1440,height:900}});
const gate=await anon.request.get(B+'/jobs',{maxRedirects:0}); ok(gate.status()===307 && (gate.headers().location||'').includes('/login'),'anonymous /jobs is sent to sign in');
const gateDetail=await anon.request.get(B+'/jobs/iam-engineer-humana',{maxRedirects:0}); ok(gateDetail.status()===307,'anonymous job detail is sent to sign in');
ok(!(await (await anon.request.get(B+'/jobs',{maxRedirects:0})).text()).includes('Hitachi'),'no job text in the redirect response');

// --- signed-in member sees the board
const mem=await b.newContext({viewport:{width:1440,height:900}}); const mp=await signup(mem,`member${Date.now()}@example.com`,'Maya Member');
await mp.goto(B+'/jobs',{waitUntil:'networkidle'}); await mp.waitForTimeout(1500);
const html=await (await mem.request.get(B+'/jobs')).text();
ok((await mp.locator('text=8 open roles').count())>0,'member /jobs shows "8 open roles"');
ok((await mp.locator('.card h3').count())===8,'8 job cards rendered');
const detailHtml=await (await mem.request.get(B+'/jobs/iam-engineer-humana')).text();
const emails=[...new Set((html+detailHtml).match(/[\w.+-]+@[\w-]+\.[\w.]+/g)||[])].filter(e=>!e.includes('sortnow.co')&&!e.includes('example'));
ok(emails.every(e=>e==='hemanofficial6@gmail.com'),'the only email on jobs pages is hemanofficial6@gmail.com -> '+JSON.stringify(emails));
ok(!/\b\d{3}[-. )]+\d{3}[-. ]\d{4}\b/.test(html),'no phone numbers on the jobs page');
await mp.goto(B+'/jobs/ai-architect-hitachi',{waitUntil:'networkidle'}); await mp.waitForTimeout(800);
const href=await mp.locator('a[data-track=job-email]').getAttribute('href');
ok(href.startsWith('mailto:hemanofficial6@gmail.com?subject=')&&decodeURIComponent(href).includes('AI Architect'),'detail page mailto goes to sortNow with the role in the subject');
const jd=await mp.locator('article').innerText();
ok(['About the role','What you will do','What we are looking for','Nice to have'].every(h=>jd.includes(h)),'detail page is a full JD: about, responsibilities, requirements, nice to have');
ok((await mp.locator('article li').count())>=10,'JD has bullet lists, not one sentence');
ok(!(await mp.locator('text=Manage jobs').count()),'no admin controls for members');
await mp.screenshot({path:(process.env.SHOTS||'/tmp')+'/jobs-detail2.png',fullPage:true});
// anonymous admin attempts
ok((await anon.request.get(B+'/admin/jobs')).status()===404,'anonymous GET /admin/jobs -> 404');
for (const [m,d] of [['post',{title:'x',location:'x',mode:'Remote',level:'Mid'}],['patch',{slug:'iam-engineer-humana',status:'closed'}],['delete',{slug:'iam-engineer-humana'}]]) {
  const r=await anon.request[m](B+'/api/admin/jobs',{data:d}); ok(r.status()===404,`anonymous ${m.toUpperCase()} /api/admin/jobs -> ${r.status()}`);
}

// --- ordinary signed-in member
ok((await mem.request.get(B+'/admin/jobs')).status()===404,'member GET /admin/jobs -> 404');
for (const [m,d] of [['post',{title:'Evil',location:'x',mode:'Remote',level:'Mid'}],['patch',{slug:'iam-engineer-humana',status:'closed'}],['delete',{slug:'iam-engineer-humana'}]]) {
  const r=await mem.request[m](B+'/api/admin/jobs',{data:d}); ok(r.status()===404,`member ${m.toUpperCase()} /api/admin/jobs -> ${r.status()}`);
}
await mp.goto(B+'/jobs',{waitUntil:'networkidle'}); ok(!(await mp.locator('text=Manage jobs').count()),'member sees no "Manage jobs" button');
ok((await mem.request.get(B+'/jobs/iam-engineer-humana')).status()===200,'member attempts changed nothing (role still listed)');

// --- admin
const adm=await b.newContext({viewport:{width:1440,height:1000}}); const dp=await signup(adm,'admin@example.com','Ada Admin');
await dp.goto(B+'/jobs',{waitUntil:'networkidle'}); ok((await dp.locator('text=Manage jobs').count())>0,'admin sees "Manage jobs"');
await dp.goto(B+'/admin/jobs',{waitUntil:'networkidle'}); await dp.waitForTimeout(1000);
ok((await dp.locator('[data-testid=admin-job-list] li').count())===8,'admin page lists all 8 roles');
await dp.screenshot({path:(process.env.SHOTS||'/tmp')+'/admin-jobs.png'});
// post
await dp.fill('input[maxlength="120"]','Prompt Engineer'); await dp.fill('input[placeholder^="Dallas"]','Remote'); await dp.fill('input[maxlength="300"]','Write and test prompts for a support assistant.');
await dp.locator('label:has-text("About the role") textarea').fill('First paragraph about the role.\n\nSecond paragraph.');
await dp.locator('label:has-text("Responsibilities") textarea').fill('Write prompts\nTest them against real tickets\nReport quality weekly');
await dp.locator('label:has-text("Requirements") textarea').fill('Clear writing\nComfort with data'); await dp.fill('input[maxlength="80"]','Acme AI');
await dp.fill('label:has-text("Skills") input','Prompting, Evaluation');
await dp.click('button:has-text("Post role")'); await dp.waitForTimeout(1200);
ok((await dp.locator('[data-testid=admin-job-list] li').count())===9,'admin posted a role (9 in admin list)');
ok((await mem.request.get(B+'/jobs')).status()===200 && (await (await mem.request.get(B+'/jobs')).text()).includes('Prompt Engineer'),'new role is visible to members');
const slug=await dp.locator('[data-testid=admin-job-list] li:has-text("Prompt Engineer") a').getAttribute('href').then(h=>h.split('/').pop());
// close
await dp.locator('li:has-text("Prompt Engineer") button:has-text("Close")').click(); await dp.waitForTimeout(900);
ok(!(await (await mem.request.get(B+'/jobs')).text()).includes('Prompt Engineer'),'closing hides it from the list');
ok((await mem.request.get(B+'/jobs/'+slug)).status()===404,'closed role is 404 for members');
await dp.goto(B+'/jobs/'+slug,{waitUntil:'networkidle'}); ok((await dp.locator('text=Closed (only admins see this)').count())>0,'admin can still open the closed role');
// edit
await dp.goto(B+'/admin/jobs',{waitUntil:'networkidle'}); await dp.locator('li:has-text("Prompt Engineer") button:has-text("Edit")').click();
await dp.fill('input[maxlength="120"]','Senior Prompt Engineer'); await dp.selectOption('label:has-text("Status") select','open'); await dp.click('button:has-text("Save changes")'); await dp.waitForTimeout(1200);
ok((await (await mem.request.get(B+'/jobs')).text()).includes('Senior Prompt Engineer'),'edit + reopen shows the new title publicly');
// validation
const badr=await adm.request.post(B+'/api/admin/jobs',{data:{title:'Bad',location:'x',mode:'Moon',level:'Mid'}}); ok(badr.status()===400,'invalid work mode rejected (400)');
// delete
dp.on('dialog',d=>d.accept()); await dp.locator('li:has-text("Senior Prompt Engineer") button:has-text("Delete")').click(); await dp.waitForTimeout(1000);
ok(!(await (await mem.request.get(B+'/jobs')).text()).includes('Senior Prompt Engineer'),'deleted role is gone');
ok((await dp.locator('[data-testid=admin-job-list] li').count())===8,'back to the 8 starter roles');
await b.close(); console.log(bad?'JOBS TESTS FAILED':'ALL JOBS TESTS PASSED');
