import http from 'node:http';
import {readFile} from 'node:fs/promises';
import worker from './worker/index.js';
const port=Number(process.env.PORT||3000);
http.createServer(async(req,res)=>{
 try {
 const url=new URL(req.url,'http://localhost:'+port);
 if(!url.pathname.startsWith('/api/')){
 let html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 html=html.replace('/*STYLE*/',await readFile(new URL('./style.css',import.meta.url),'utf8')).replace('/*SCRIPT*/',await readFile(new URL('./ui.js',import.meta.url),'utf8'));
 res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);return;
 }
 const chunks=[];let bytes=0;for await(const c of req){bytes+=c.length;if(bytes>30000){res.writeHead(413);res.end();return;}chunks.push(c);}
 const request=new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});
 const response=await worker.fetch(request,process.env);
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500);res.end('Falha no servidor.');}
}).listen(port,'127.0.0.1',()=>console.log('Local: http://localhost:'+port));
