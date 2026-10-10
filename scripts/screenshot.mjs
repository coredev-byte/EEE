import {chromium} from '@playwright/test';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1040}});page.on('pageerror',e=>console.error(e));
await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:/INICIAR JORNADA/}).waitFor();await page.screenshot({path:'artifacts/menu.png',fullPage:true});
await page.getByRole('button',{name:/INICIAR JORNADA/}).click();await page.getByRole('button',{name:/ENTRAR EM PEDRALTA/}).click();await page.waitForTimeout(500);await page.screenshot({path:'artifacts/gameplay.png',fullPage:true});
console.log(await page.evaluate(()=>window.__DZ.snapshot()));
await page.keyboard.press('Escape');await page.screenshot({path:'artifacts/pause.png',fullPage:true});await browser.close();
