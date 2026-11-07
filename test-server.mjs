import assert from 'node:assert/strict';
import {createAppServer} from './server.mjs';

async function withServer(env,check){
 const server=createAppServer(env);
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 try{await check('http://127.0.0.1:'+server.address().port);}
 finally{await new Promise(resolve=>server.close(resolve));}
}
const external='https://aricia-test.onrender.com';
await withServer({RENDER_EXTERNAL_URL:external,APP_PASSWORD:'test-only'},async base=>{
 assert.deepEqual(await (await fetch(base+'/healthz')).json(),{ok:true});
 assert.equal((await fetch(base)).status,200);
 const post=origin=>fetch(base+'/api/generate',{method:'POST',headers:{origin,'x-app-password':'test-only','content-type':'application/json'},body:'{}'});
 const sameOrigin=await post(external);assert.equal(sameOrigin.status,503);assert.match((await sameOrigin.json()).error,/Gemini ainda/);
 assert.equal((await post('https://other.test')).status,403);
});
await withServer({RENDER_EXTERNAL_URL:external,GEMINI_API_KEY:'fake',GEMINI_MODEL:'fake'},async base=>{
 const forged=await fetch(base+'/api/generate',{method:'POST',headers:{origin:external,'oai-authenticated-user-id':'forged','content-type':'application/json'},body:'{}'});
 assert.equal(forged.status,503);assert.match((await forged.json()).error,/APP_PASSWORD/);
});
console.log('OK: servidor HTTP, health check, origem HTTPS do Render e rejeição de identidade forjada.');
