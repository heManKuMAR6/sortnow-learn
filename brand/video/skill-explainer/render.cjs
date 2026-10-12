// Renders every frame of skill.html as a PNG (with alpha, so the 3D shot can sit underneath).
// Usage: node render.cjs <outdir> [fps=30] [seconds=15.2]
const {chromium}=require('playwright');
(async()=>{const [,,dir,fps='30',secs='15.2']=process.argv;
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
 await p.goto('file://'+process.cwd()+'/skill.html');await p.evaluate(()=>document.fonts.ready);
 const n=Math.round(+fps*+secs);
 for(let i=0;i<n;i++){await p.evaluate(t=>setT(t),i/+fps);
  await p.screenshot({path:`${dir}/f${String(i).padStart(4,'0')}.png`,omitBackground:true});}
 await b.close();console.log('frames',n);})();
