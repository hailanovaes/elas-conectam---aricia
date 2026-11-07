import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import worker,{MAX_REQUEST_BYTES} from './worker/index.js';
export function createAppServer(env=process.env){
const port=Number(env.PORT||3000);
return http.createServer(async(req,res)=>{
 try {
 // Render terminates HTTPS before forwarding to Node. Use its canonical URL
 // so the browser Origin check still matches, without trusting client headers.
 const origin=env.PUBLIC_ORIGIN||env.RENDER_EXTERNAL_URL||'http://'+(req.headers.host||'localhost:'+port);
 const url=new URL(req.url,origin);
 if(url.pathname==='/healthz'){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify({ok:true}));return;}
 if(!url.pathname.startsWith('/api/')){
 let html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 html=html.replace('/*STYLE*/',await readFile(new URL('./style.css',import.meta.url),'utf8')).replace('/*SCRIPT*/',await readFile(new URL('./ui.js',import.meta.url),'utf8'));
 res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);return;
 }
 const chunks=[];let bytes=0;for await(const c of req){bytes+=c.length;if(bytes>MAX_REQUEST_BYTES){res.writeHead(413,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'Dados muito grandes. Reduza o tamanho dos anexos.'}));return;}chunks.push(c);}
 const headers=new Headers(req.headers);
 // These identity headers are only trusted inside Sites, never on a public Node server.
 headers.delete('oai-authenticated-user-id');headers.delete('oai-authenticated-user-email');
 const request=new Request(url,{method:req.method,headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});
 const response=await worker.fetch(request,env);
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'Falha no servidor.'}));}
});
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 const port=Number(process.env.PORT||3000);const host=process.env.HOST||'127.0.0.1';
 createAppServer().listen(port,host,()=>console.log('Servidor iniciado em '+host+':'+port));
}
