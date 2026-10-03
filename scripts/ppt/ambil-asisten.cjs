const req=require('module').createRequire(require('path').join(__dirname,'..','..','package.json'));const {chromium}=req('@playwright/test');
(async()=>{const b=await chromium.launch({channel:'chrome'});const p=await (await b.newContext({viewport:{width:1440,height:810},deviceScaleFactor:1.5,reducedMotion:'reduce'})).newPage();
await p.goto('https://ecommerce-peach-seven-47.vercel.app/produk',{waitUntil:'load'});await p.waitForTimeout(2000);
await p.getByRole('button',{name:/^Tanya AI/}).click();const panel=p.getByRole('dialog',{name:'Asisten TokoKita'});await panel.waitFor();
await panel.getByLabel('Pertanyaan untuk asisten').fill('Rekomendasikan produk olahraga di bawah 200 ribu');await p.keyboard.press('Enter');
await p.waitForFunction(()=>{const l=document.querySelector('[role=log]');return l&&l.querySelectorAll('.bg-tile').length>=2&&!l.querySelector('[role=status]')},{timeout:45000});
await panel.getByLabel('Pertanyaan untuk asisten').fill('Buatkan fungsi Python untuk mengurutkan list');await p.keyboard.press('Enter');
await p.waitForFunction(()=>{const l=document.querySelector('[role=log]');return l&&l.querySelectorAll('.bg-tile').length>=3&&!l.querySelector('[role=status]')},{timeout:45000});
await p.waitForTimeout(600);await p.screenshot({path:__dirname+'/img/asisten.png'});await b.close();console.log('ok')})().catch(e=>{console.error(e.message);process.exit(1)});
