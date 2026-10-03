// Tangkapan layar untuk PPT (16:9, tajam). Kredensial dibaca dari .env.e2e, tidak dicetak.
const fs=require('fs');const req=require('module').createRequire(require('path').join(__dirname,'..','..','package.json'));const {chromium}=req('@playwright/test');
const e=Object.fromEntries(fs.readFileSync(require('path').join(__dirname,'..','..','tests','e2e','.env.e2e'),'utf8').split(/\r?\n/).filter(l=>l.includes('=')&&l[0]!='#').map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).replace(/^"|"$/g,'')]}));
const O=__dirname+'/img/';const B='http://localhost:3002';
const sembunyi=async p=>{await p.addStyleTag({content:'nextjs-portal{display:none!important}'}).catch(()=>{})};
const tenang=async(p,ms=1800)=>{await p.waitForLoadState('load').catch(()=>{});await p.waitForTimeout(ms);await sembunyi(p)};
const masuk=async(p,em,pw)=>{await p.goto(B+'/masuk');await p.getByLabel('Email').fill(em);await p.getByLabel('Password').fill(pw);await p.getByRole('button',{name:'Masuk',exact:true}).click();await p.waitForURL(u=>!/masuk/.test(u.pathname),{timeout:30000});};
const konteks=(b,tema,lebar=1440,tinggi=810,dsf=1.5)=>b.newContext({viewport:{width:lebar,height:tinggi},deviceScaleFactor:dsf,colorScheme:tema,reducedMotion:'reduce'});
(async()=>{const b=await chromium.launch({channel:'chrome'});
 // Beranda terang
 let p=await (await konteks(b,'light')).newPage();await p.goto(B+'/');await tenang(p,2500);await p.screenshot({path:O+'beranda.png'});
 // Katalog + Pilihan bisa dicari
 await p.goto(B+'/produk');await tenang(p);await p.locator('#filter-kategori-desktop').click();await p.getByRole('combobox',{name:'Cari pilihan'}).fill('fa');await p.waitForTimeout(500);await p.screenshot({path:O+'katalog.png'});
 // Detail produk
 await p.keyboard.press('Escape');await p.goto(B+'/produk/kaos-polos-premium');await tenang(p);await p.getByRole('radio',{name:'M',exact:true}).click();await p.waitForTimeout(500);await p.evaluate(()=>window.scrollTo(0,100));await p.waitForTimeout(400);await p.screenshot({path:O+'detail.png'});
 // Checkout (pembeli)
 const c=await (await konteks(b,'light')).newPage();await masuk(c,e.E2E_CUSTOMER_EMAIL,e.E2E_CUSTOMER_PASSWORD);
 await c.goto(B+'/produk/kaos-polos-premium');await tenang(c,1200);await c.getByRole('radio',{name:'M',exact:true}).click();await c.getByRole('button',{name:'Masukkan Keranjang'}).click();await c.waitForTimeout(900);await c.keyboard.press('Escape');
 await c.goto(B+'/checkout');await tenang(c,1200);await c.getByRole('button',{name:'Lanjutkan',exact:true}).click();await c.waitForTimeout(900);await c.getByRole('button',{name:/JNE Regular/}).click();await c.waitForTimeout(700);await sembunyi(c);await c.screenshot({path:O+'checkout.png'});
 // Pesanan saya dengan lencana status
 await c.goto(B+'/akun/pesanan');await tenang(c);await c.screenshot({path:O+'pesanan.png'});
 // Admin gelap + modal tambah produk terang
 const a=await (await konteks(b,'dark')).newPage();await masuk(a,e.E2E_ADMIN_EMAIL,e.E2E_ADMIN_PASSWORD);await a.goto(B+'/admin');await tenang(a,1500);await a.screenshot({path:O+'admin-gelap.png'});
 const a2=await (await konteks(b,'light')).newPage();await masuk(a2,e.E2E_ADMIN_EMAIL,e.E2E_ADMIN_PASSWORD);await a2.goto(B+'/admin/produk?edit=1');await tenang(a2,1800);await a2.screenshot({path:O+'admin-modal.png'});
 // HP mode gelap
 const h=await (await konteks(b,'dark',390,844,3)).newPage();await h.goto(B+'/');await tenang(h,2500);await h.screenshot({path:O+'hp-gelap.png'});
 await b.close();console.log('ok')})().catch(x=>{console.error(x.message);process.exit(1)});
