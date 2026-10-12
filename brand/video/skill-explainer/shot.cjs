const {chromium}=require('playwright');
(async()=>{const [,,dir,...ts]=process.argv;
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+process.cwd()+'/skill.html');await p.evaluate(()=>document.fonts.ready);
for(const t of ts){await p.evaluate(t=>setT(+t),t);await p.screenshot({path:`${dir}/t${t}.png`});}
await b.close();})();
