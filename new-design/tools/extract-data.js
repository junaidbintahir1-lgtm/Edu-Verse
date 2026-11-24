const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.route(/supabase|jsdelivr|googleapis|gstatic/,r=>r.abort());
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(2500);
const out=process.argv[2];
for(const k of ['EV_HUB','EV_DB','EV_HUB_DEEP','EV_RESOURCES','EV_PASTPAPERS']){
 const j=await p.evaluate(k=>JSON.stringify(window[k]||null),k);fs.writeFileSync(out+'/'+k+'.json',j);console.log(k,j.length);}
await b.close();})();
