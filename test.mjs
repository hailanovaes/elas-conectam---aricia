import assert from 'node:assert/strict';
import worker,{validCampaign,generateCampaign} from './worker/index.js';
const origin='https://aricia.test';
const req=(path,body,password)=>new Request(origin+path,{method:'POST',headers:{'content-type':'application/json',origin,...(password?{'x-app-password':password}:{})},body:JSON.stringify(body)});
assert.equal((await worker.fetch(new Request(origin+'/api/status'),{})).status,200);
assert.equal((await worker.fetch(req('/api/generate',{}),{})).status,503);
assert.equal((await worker.fetch(req('/api/generate',{},'bad'),{APP_PASSWORD:'correct'})).status,401);
assert.equal((await worker.fetch(req('/api/generate',{},'correct'),{APP_PASSWORD:'correct'})).status,503);
assert.equal((await worker.fetch(req('/api/generate',{},'correct'),{APP_PASSWORD:'correct',GEMINI_API_KEY:'fake',GEMINI_MODEL:'fake'})).status,400);
assert.equal(validCampaign({titulo:'x'}),false);
const campaign={titulo:'t',hipotese:'h',capa:'c',legenda:'l',cta:'c',cards:['1','2','3'],stories:['1','2','3'],capturas:[]};
assert.equal(validCampaign(campaign),true);
assert.equal(validCampaign({...campaign,cards:[null]}),false);
const original=globalThis.fetch;let sent;
globalThis.fetch=async(url,options)=>{sent=JSON.parse(options.body);return Response.json({candidates:[{content:{parts:[{text:JSON.stringify(campaign)}]}}]});};
const brief={produto:'Nanotone',diferencial:'Recheado',regiao:'ABC',objetivo:'Atrair',material:'Fotos',formato:'Carrossel'};
const success=await worker.fetch(req('/api/generate',{brief},'correct'),{APP_PASSWORD:'correct',GEMINI_API_KEY:'fake',GEMINI_MODEL:'fake'});
assert.equal(success.status,200);assert.deepEqual((await success.json()).campaign,campaign);assert.equal(sent.generationConfig.responseMimeType,'application/json');
globalThis.fetch=async()=>new Response('',{status:429});
assert.equal((await worker.fetch(req('/api/generate',{brief},'correct'),{APP_PASSWORD:'correct',GEMINI_API_KEY:'fake',GEMINI_MODEL:'fake'})).status,502);
globalThis.fetch=original;
const env={APP_PASSWORD:'correct',GEMINI_API_KEY:'test-secret',GEMINI_MODEL:'test-model'};
assert.equal((await worker.fetch(req('/api/generate',null,'correct'),env)).status,400);
assert.equal((await worker.fetch(req('/api/generate',[],'correct'),env)).status,400);
const malformed=new Request(origin+'/api/generate',{method:'POST',headers:{origin,'x-app-password':'correct'},body:'{'});
assert.equal((await worker.fetch(malformed,env)).status,400);
const foreign=new Request(origin+'/api/generate',{method:'POST',headers:{origin:'https://other.test'},body:'{}'});
assert.equal((await worker.fetch(foreign,env)).status,403);
let requestBody;
const generated=await generateCampaign(env,brief,Array.from({length:8},()=>({titulo:'Campanha'})),async(url,options)=>{
 assert.ok(url.endsWith('/test-model:generateContent'));
 assert.equal(options.headers['x-goog-api-key'],'test-secret');
 requestBody=JSON.parse(options.body);
 return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'Não incluir raciocínio no JSON.'},{text:JSON.stringify(campaign)}]}}]});
});
assert.deepEqual(generated,campaign);
assert.equal(JSON.parse(requestBody.contents[0].parts[0].text).historico.length,5);
assert.equal(requestBody.generationConfig.responseJsonSchema.properties.stories.maxItems,3);
assert.equal(JSON.stringify(generated).includes('test-secret'),false);
for(const providerResult of [
 {candidates:[]},
 {candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:JSON.stringify(campaign)}]}}]},
 {candidates:[{content:{parts:[{text:'not json'}]}}]},
 {candidates:[{content:{parts:[{text:'{}'}]}}]}
])await assert.rejects(()=>generateCampaign(env,brief,[],async()=>Response.json(providerResult)));
await assert.rejects(()=>generateCampaign(env,brief,[],async()=>{throw new Error('segredo do provedor');}),error=>!error.message.includes('segredo do provedor'));
console.log('OK: geração simulada, formato JSON, validação, origem, acesso, limite de histórico, resposta truncada/bloqueada e falhas do provedor.');
