const $=s=>document.querySelector(s);
const baseBrand={nome:'Brigadeiros Arícia',regiao:'São Paulo e cidades do ABC Paulista; consultar atendimento para o bairro',tom:'Acolhedor, artesanal, criativo e próximo',diferenciais:'Produtos exclusivos e personalizáveis; esculturas de chantilly. Panetones caseiros e nanotones. Não divulgar preços.'};
let state={brand:baseBrand,campaigns:[]},current=null,currentId=null,currentBrief=null,currentSource=null;
try{const saved=JSON.parse(localStorage.getItem('aricia-v1'));if(saved&&saved.brand&&Array.isArray(saved.campaigns))state=saved;}catch{}
const flash=msg=>{const t=$('#toast');t.textContent=msg;t.hidden=false;setTimeout(()=>t.hidden=true,3000);};
function persist(){try{localStorage.setItem('aricia-v1',JSON.stringify(state));return true;}catch{flash('Não foi possível salvar. Exporte um backup.');return false;}}
function navigate(id){document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!==id);document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===id));if(id==='history')renderHistory();if(id==='brand')fillBrand();}
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>navigate(b.dataset.view));
function fillBrand(){$('#brand-name').value=state.brand.nome;$('#brand-region').value=state.brand.regiao;$('#brand-tone').value=state.brand.tom;$('#brand-diff').value=state.brand.diferenciais;}
$('#regiao').value=state.brand.regiao;
$('#brand-form').onsubmit=e=>{e.preventDefault();state.brand={nome:$('#brand-name').value,regiao:$('#brand-region').value,tom:$('#brand-tone').value,diferenciais:$('#brand-diff').value};if(persist()){ $('#regiao').value=state.brand.regiao;flash('Informações salvas neste navegador.');}};
function getBrief(){return Object.fromEntries(new FormData($('#campaign-form')));}
let selectedFiles=[];
const imageMemory=new Map(),imageURLs=new Map(),fileIds=new WeakMap();
let imageDatabase;
function openImageDatabase(){
 if(!imageDatabase)imageDatabase=new Promise((resolve,reject)=>{const request=indexedDB.open('aricia-images',1);request.onupgradeneeded=()=>request.result.createObjectStore('photos');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
 return imageDatabase;
}
async function storeImage(blob){
 const id=crypto.randomUUID();imageMemory.set(id,blob);
 try{const db=await openImageDatabase();await new Promise((resolve,reject)=>{const tx=db.transaction('photos','readwrite');tx.objectStore('photos').put(blob,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
 catch{flash('A imagem aparece nesta sessão. Baixe uma cópia: o navegador não permitiu salvar a foto.');}
 return id;
}
async function readImage(id){
 if(!id)return null;if(imageMemory.has(id))return imageMemory.get(id);
 try{const db=await openImageDatabase();return await new Promise((resolve,reject)=>{const req=db.transaction('photos').objectStore('photos').get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});}catch{return null;}
}
function fileAsset(file){if(!fileIds.has(file))fileIds.set(file,storeImage(file));return fileIds.get(file);}
async function photoOptions(){
 const photos=new Map((currentBrief?.anexos||[]).filter(f=>f.mimeType?.startsWith('image/')&&f.assetId).map(f=>[f.name,f]));
 for(const file of selectedFiles.filter(f=>attachmentType(f).startsWith('image/')))photos.set(file.name,{name:file.name,mimeType:attachmentType(file),assetId:await fileAsset(file)});
 return [...photos.values()];
}
function imageURL(id,blob){if(!imageURLs.has(id))imageURLs.set(id,URL.createObjectURL(blob));return imageURLs.get(id);}
window.addEventListener('pagehide',()=>{for(const url of imageURLs.values())URL.revokeObjectURL(url);imageURLs.clear();});
function showLargeImage(src,alt){$('#large-image').src=src;$('#large-image').alt=alt;$('#image-dialog').showModal();}
$('#close-image').onclick=()=>$('#image-dialog').close();
$('#image-dialog').onclick=e=>{if(e.target===$('#image-dialog'))$('#image-dialog').close();};
function downloadPhoto(src,name){const a=document.createElement('a');a.href=src;a.download=name;a.click();}
const allowedFiles={'jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png','webp':'image/webp','pdf':'application/pdf','txt':'text/plain','csv':'text/csv'};
function attachmentType(file){return allowedFiles[file.name.split('.').pop().toLowerCase()]||'';}
function renderAttachments(){
 const list=$('#attachment-list');list.replaceChildren();
 selectedFiles.forEach((file,index)=>{
  const row=document.createElement('div');row.className='attachment-row';
  if(attachmentType(file).startsWith('image/')){const image=document.createElement('img');const url=URL.createObjectURL(file);image.src=url;image.alt='Prévia de '+file.name;image.onload=image.onerror=()=>URL.revokeObjectURL(url);row.append(image);}
  const info=document.createElement('span');info.textContent=file.name+' · '+(file.size/1024/1024).toFixed(2)+' MB';
  const remove=document.createElement('button');remove.type='button';remove.className='text-button';remove.textContent='Remover';remove.setAttribute('aria-label','Remover '+file.name);remove.onclick=()=>{selectedFiles.splice(index,1);renderAttachments();};row.append(info,remove);list.append(row);
 });
 $('#attachment-status').textContent=selectedFiles.length?selectedFiles.length+' arquivo(s) selecionado(s). Serão analisados ao gerar a campanha.':'';
 if(current)showResult(current);
}
$('#attachments').onchange=e=>{
 const next=[...selectedFiles];const errors=[];
 for(const file of e.target.files){
  if(!attachmentType(file)){errors.push(file.name+': formato não aceito.');continue;}
  if(!file.size||file.size>4*1024*1024){errors.push(file.name+': deve ter conteúdo e até 4 MB.');continue;}
  if(next.some(f=>f.name===file.name&&f.size===file.size&&f.lastModified===file.lastModified))continue;
  if(next.length>=5){errors.push('O limite é de 5 arquivos.');continue;}
  if(next.reduce((sum,f)=>sum+f.size,0)+file.size>8*1024*1024){errors.push('O total dos anexos deve ser de até 8 MB.');continue;}
  next.push(file);
 }
 selectedFiles=next;e.target.value='';renderAttachments();
 if(errors.length)$('#attachment-status').textContent=errors.join(' ')+' Os demais arquivos aceitos foram mantidos.';
};
function encodeFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({name:file.name,mimeType:attachmentType(file),data:String(reader.result).split(',')[1]});reader.onerror=()=>reject(new Error('Não foi possível ler '+file.name+'. Selecione o arquivo novamente.'));reader.readAsDataURL(file);});}
function historySummary(){return state.campaigns.filter(c=>c.source==='gemini'&&c.published).slice(0,5).map(c=>({produto:c.brief.produto,perfilCliente:c.brief.perfilCliente||'',titulo:c.content.titulo,publicadoEm:c.date,resultados:c.metrics}));}
$('#campaign-form').onsubmit=async e=>{
 e.preventDefault();const button=$('#generate');button.disabled=true;$('#demo').disabled=true;button.textContent='✦ Preparando suas ideias…';$('#feedback').textContent='Preparando os materiais. Isso pode levar alguns segundos.';
 try{
  const files=[...selectedFiles];const brief=getBrief();
  const attachments=await Promise.all(files.map(encodeFile));
  const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json','x-app-password':$('#password').value},body:JSON.stringify({brief:{...brief,marca:state.brand},history:historySummary(),attachments}),signal:AbortSignal.timeout(45000)});
  const data=await res.json();if(!res.ok)throw Error(data.error||'Não foi possível gerar.');
  const anexos=await Promise.all(files.map(async file=>({name:file.name,mimeType:attachmentType(file),size:file.size,...(attachmentType(file).startsWith('image/')?{assetId:await fileAsset(file)}:{})})));
  currentBrief={...brief,anexos};currentSource='gemini';currentId=null;showResult(data.campaign);
  $('#feedback').textContent='Campanha criada'+(files.length?' com '+files.length+' anexo(s) enviado(s) para análise':'')+'. Revise as informações antes de publicar.';
 }catch(err){$('#feedback').textContent=err.name==='TimeoutError'?'A geração demorou mais que o esperado. Tente novamente. Seus anexos continuam selecionados.':err.message;}
 finally{button.disabled=false;$('#demo').disabled=false;button.textContent='✦ Criar minha campanha';}
};
const example={titulo:'Um presente que cabe no bolso',hipotese:'Exemplo fixo, não gerado por IA: apresentar o formato do nanotone pode despertar curiosidade. Teste o interesse e as consultas recebidas.',capa:'Panetone de bolso.\nAfeto que cabe na mão.',cards:['Já conhece o nanotone? Um panetone de bolso recheado e coberto com chocolate.','Nos panetones caseiros da Arícia, o recheio pode ser escolhido pelo cliente. Consulte as opções disponíveis.','Para presentear ou se presentear: conheça as opções de panetones e nanotones.','São Paulo e ABC Paulista: consulte atendimento para seu bairro e disponibilidade pelo WhatsApp.'],legenda:'Tem carinho que cabe na palma da mão. ♡\n\nO nanotone da Brigadeiros Arícia é um panetone de bolso recheado e coberto com chocolate. E os panetones caseiros têm recheios que você pode escolher — consulte as opções disponíveis.\n\nAtendimento em São Paulo e ABC Paulista, mediante consulta para o bairro.\n\nQuer conhecer as opções? Fale com a Arícia pelo link da bio.',cta:'Consulte opções, disponibilidade e atendimento para seu bairro no WhatsApp (11) 95329-6311.',stories:['Uma doçura de bolso: você já conhece o nanotone? Use uma foto real do produto.','Panetones caseiros com recheios escolhidos por você. Consulte as opções disponíveis.','Quer conhecer as opções? Consulte pelo WhatsApp. Atendimento para São Paulo e ABC sujeito à confirmação do bairro.'],capturas:['Escolha uma foto real que mostre o formato do nanotone.','Se possível, registre o interior de uma unidade para mostrar o recheio. Não use imagens que não correspondam ao produto.']};
example.imagemCapa={arquivo:'',orientacao:'Fotografe um nanotone na palma da mão para mostrar o tamanho. Use luz natural, fundo claro e espaço livre na parte superior para o título em tom chocolate.'};
example.imagensCards=[
 {arquivo:'',orientacao:'Fotografe o nanotone inteiro, na altura do produto. Use fundo rosa-claro e deixe uma lateral livre para o texto. Mostre a aparência real da cobertura.'},
 {arquivo:'',orientacao:'Se houver uma unidade disponível para corte, fotografe seu interior de perto. Não encene recheios diferentes dos oferecidos. Reserve uma faixa clara abaixo da foto para o texto.'},
 {arquivo:'',orientacao:'Fotografe a apresentação que a confeitaria realmente utiliza para presentear. Use fundo branco e enquadramento de cima. Não inclua embalagens que não estejam disponíveis.'},
 {arquivo:'',orientacao:'Faça uma composição simples com foto real do produto na metade inferior e área clara na metade superior para região de atendimento e chamada ao WhatsApp.'}
];
example.imagensStories=[
 {arquivo:'',orientacao:'Faça uma foto vertical do nanotone na mão. Mantenha o produto no centro e coloque a pergunta no terço superior.'},
 {arquivo:'',orientacao:'Fotografe um panetone com um recheio realmente oferecido. Use luz lateral suave e espaço para explicar a escolha de recheios.'},
 {arquivo:'',orientacao:'Use uma foto vertical real do produto com fundo limpo. Deixe espaço na parte inferior para o adesivo de link do WhatsApp, sem cobrir o doce.'}
];
$('#demo').onclick=()=>{currentId=null;currentSource='example';currentBrief={...getBrief(),produto:'Panetones recheados e nanotones',formato:'Carrossel'};showResult(structuredClone(example));$('#feedback').textContent='Exemplo fixo dos panetones. Não usa Gemini nem adapta os campos preenchidos.';};
function addEditor(label,key,value,index){const item=document.createElement('div');item.className='editable-item';const head=document.createElement('div');head.className='editable-header';const l=document.createElement('label');const id='edit-'+key+(index??'');l.htmlFor=id;l.textContent=label;const copy=document.createElement('button');copy.type='button';copy.className='text-button';copy.textContent='Copiar';const ta=document.createElement('textarea');ta.id=id;ta.value=value;ta.maxLength=5000;ta.rows=key==='legenda'?7:3;copy.onclick=()=>copyText(ta.value);ta.oninput=()=>{if(index!==undefined)current[key][index]=ta.value;else current[key]=ta.value;if(key==='capa')$('#cover-preview').textContent=ta.value;if(key==='titulo')$('#result-title').textContent=ta.value;};head.append(l,copy);item.append(head,ta);$('#editable').append(item);}
function addImageEditor(label,image,id){
 if(!image || typeof image.orientacao!=='string' || typeof image.arquivo!=='string')return;
 const box=document.createElement('div');box.className='image-suggestion';
 const source=document.createElement('p');source.className='image-source';source.textContent=image.arquivo?'Usar foto anexada: '+image.arquivo:'Nova foto ou tomada a produzir';
 const l=document.createElement('label');l.htmlFor='image-'+id;l.textContent='Imagem sugerida · '+label;
 const ta=document.createElement('textarea');ta.id=l.htmlFor;ta.rows=4;ta.maxLength=1800;ta.value=image.orientacao;ta.oninput=()=>{image.orientacao=ta.value;};
 const copy=document.createElement('button');copy.type='button';copy.className='text-button';copy.textContent='Copiar sugestão';copy.onclick=()=>copyText((image.arquivo?'Foto: '+image.arquivo+'\n':'Nova foto/tomada\n')+ta.value);
 const preview=document.createElement('div');preview.className='photo-preview';
 const chooseLabel=document.createElement('label');chooseLabel.htmlFor='photo-'+id;chooseLabel.textContent='Foto para '+label;
 const select=document.createElement('select');select.id=chooseLabel.htmlFor;const blank=document.createElement('option');blank.value='';blank.textContent='Escolher uma foto anexada';select.append(blank);
 const actions=document.createElement('div');actions.className='photo-actions';
 const generate=document.createElement('button');generate.type='button';generate.className='secondary';generate.textContent='✦ Gerar imagem com IA';
 const feedback=document.createElement('p');feedback.className='hint';feedback.setAttribute('role','status');
 let photos=[];let drawing=0;
 async function draw(){
  const revision=++drawing;const original=photos.find(p=>p.name===image.arquivo);const assetId=image.assetId||original?.assetId;
  const blob=await readImage(assetId);if(revision!==drawing)return;preview.replaceChildren();
  if(blob){const src=imageURL(assetId,blob);const img=document.createElement('img');img.src=src;img.alt=(image.generated?'Imagem gerada por IA para ':'Foto para ')+label;img.className='campaign-photo';
   const enlarge=document.createElement('button');enlarge.type='button';enlarge.className='photo-open';enlarge.setAttribute('aria-label','Ampliar imagem de '+label);enlarge.onclick=()=>showLargeImage(src,img.alt);enlarge.append(img);
   const badge=document.createElement('p');badge.className='photo-badge';badge.textContent=image.generated?'Imagem gerada por IA · confira o produto antes de publicar':'Foto real anexada · '+(image.arquivo||label);
   const downloadButton=document.createElement('button');downloadButton.type='button';downloadButton.className='text-button';downloadButton.textContent='Baixar imagem';downloadButton.onclick=()=>downloadPhoto(src,image.generated?'aricia-'+id+'.'+(blob.type==='image/jpeg'?'jpg':blob.type==='image/webp'?'webp':'png'):(image.arquivo||'foto-aricia.png'));
   preview.append(enlarge,badge,downloadButton);
  }else{const placeholder=document.createElement('p');placeholder.className='photo-placeholder';placeholder.textContent=image.assetId||image.arquivo?'Foto indisponível neste navegador. Anexe o original novamente ou gere outra imagem.':'Escolha uma foto anexada ou gere uma imagem com IA para visualizar aqui.';preview.append(placeholder);}
 }
 photoOptions().then(options=>{photos=options;for(const photo of photos){const option=document.createElement('option');option.value=photo.name;option.textContent=photo.name;select.append(option);}if(image.arquivo)select.value=image.arquivo;draw();});
 select.onchange=()=>{image.arquivo=select.value;const selected=photos.find(photo=>photo.name===select.value);if(selected)image.assetId=selected.assetId;else delete image.assetId;delete image.generated;source.textContent=image.arquivo?'Usar foto anexada: '+image.arquivo:'Nova foto ou tomada a produzir';draw();};
 generate.onclick=async()=>{
  generate.disabled=true;generate.textContent='Gerando imagem…';feedback.textContent='A imagem será criada usando a conta Gemini configurada. Aguarde.';
  try{
   const reference=photos.find(p=>p.name===select.value);const attachments=[];
   const referenceBlob=await readImage(reference?.assetId||image.assetId);
   if(referenceBlob){const ext=referenceBlob.type==='image/jpeg'?'jpg':referenceBlob.type==='image/webp'?'webp':'png';attachments.push(await encodeFile(new File([referenceBlob],reference?.name||'referencia.'+ext,{type:referenceBlob.type})));}
   const prompt=('Produto: '+(currentBrief?.produto||'doce artesanal')+'. Público e ocasião: '+(currentBrief?.perfilCliente||'não especificados')+'. Peça: '+label+'. '+ta.value).slice(0,4000);
   const res=await fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json','x-app-password':$('#password').value},body:JSON.stringify({prompt,attachments}),signal:AbortSignal.timeout(95000)});
   const data=await res.json();if(!res.ok)throw new Error(data.error||'Não foi possível gerar a imagem.');
   if(!data.image?.mimeType?.startsWith('image/')||typeof data.image.data!=='string')throw new Error('A resposta não incluiu uma imagem válida.');
   const bytes=Uint8Array.from(atob(data.image.data),c=>c.charCodeAt(0));const blob=new Blob([bytes],{type:data.image.mimeType});
   image.assetId=await storeImage(blob);image.generated=true;image.arquivo='';select.value='';source.textContent='Imagem criada com IA';await draw();feedback.textContent='Imagem pronta. Confira e salve a campanha para manter a associação.';
  }catch(error){feedback.textContent=error.name==='TimeoutError'?'A geração demorou mais que o esperado. Tente novamente.':error.message;}
  finally{generate.disabled=false;generate.textContent='✦ Gerar imagem com IA';}
 };
 actions.append(generate);box.append(l,source,preview,chooseLabel,select,ta,copy,actions,feedback);$('#editable').append(box);
}
function showResult(data){
 current=data;$('#empty').hidden=true;$('#result').hidden=false;$('#source-label').textContent=currentSource==='example'?'EXEMPLO FIXO · SEM IA':'CAMPANHA GERADA COM GEMINI';$('#result-title').textContent=data.titulo;$('#hypothesis').textContent=data.hipotese;$('#cover-preview').textContent=data.capa;$('#editable').replaceChildren();
 if(currentBrief?.perfilCliente){const audience=document.createElement('p');audience.className='notice';audience.textContent='Público e ocasião: '+currentBrief.perfilCliente;$('#editable').append(audience);}
 addEditor('Título da campanha','titulo',data.titulo);addEditor('Texto de capa','capa',data.capa);addImageEditor('Capa',data.imagemCapa,'capa');
 if(!data.imagemCapa){const hint=document.createElement('p');hint.className='hint';hint.textContent='Campanha anterior à função de sugestões de imagem. Novas campanhas incluem orientações por peça.';$('#editable').append(hint);}
 data.cards.forEach((c,i)=>{const label=(currentBrief.formato.startsWith('Reel')?'Cena ':'Card ')+(i+1);addEditor(label,'cards',c,i);addImageEditor(label,data.imagensCards?.[i],'card-'+i);});
 addEditor('Legenda','legenda',data.legenda);addEditor('Chamada para ação','cta',data.cta);
 data.stories.forEach((c,i)=>{addEditor('Story '+(i+1),'stories',c,i);addImageEditor('Story '+(i+1),data.imagensStories?.[i],'story-'+i);});
 data.capturas.forEach((c,i)=>addEditor('Material sugerido '+(i+1),'capturas',c,i));
}
async function copyText(t){try{await navigator.clipboard.writeText(t);flash('Texto copiado.');}catch{flash('Selecione o texto e copie manualmente.');}}
function imageText(image){return image&&typeof image.orientacao==='string'?'\nIMAGEM SUGERIDA\n'+(image.arquivo?'Usar foto anexada: '+image.arquivo:'Nova foto ou tomada a produzir')+'\n'+image.orientacao:'';}
function fullText(){return [currentSource==='example'?'EXEMPLO FIXO — SEM IA':'CAMPANHA GEMINI',current.titulo,...(currentBrief?.perfilCliente?['PÚBLICO E OCASIÃO',currentBrief.perfilCliente]:[]),'HIPÓTESE A TESTAR',current.hipotese,'CAPA\n'+current.capa+imageText(current.imagemCapa),...current.cards.map((c,i)=>'CARD/CENA '+(i+1)+'\n'+c+imageText(current.imagensCards?.[i])),'LEGENDA',current.legenda,'CHAMADA',current.cta,...current.stories.map((c,i)=>'STORY '+(i+1)+'\n'+c+imageText(current.imagensStories?.[i])),'MATERIAIS',...current.capturas].join('\n\n');}
$('#copy-all').onclick=()=>copyText(fullText());
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#download').onclick=()=>download('campanha-aricia.txt',fullText(),'text/plain;charset=utf-8');
$('#save').onclick=()=>{const old=state.campaigns.find(c=>c.id===currentId);const entry={id:currentId||crypto.randomUUID(),createdAt:old?.createdAt||new Date().toISOString(),brief:currentBrief,source:currentSource,content:structuredClone(current),published:old?.published||false,date:old?.date||'',metrics:old?.metrics||{}};const existing=state.campaigns.findIndex(c=>c.id===entry.id);if(existing>=0)state.campaigns[existing]=entry;else state.campaigns.unshift(entry);currentId=entry.id;if(persist()){updateCount();flash('Campanha salva neste navegador.');}};
function updateCount(){$('#count').textContent=state.campaigns.length;}
function renderHistory(){updateCount();const list=$('#history-list');list.replaceChildren();if(!state.campaigns.length){const p=document.createElement('p');p.textContent='Suas campanhas salvas aparecerão aqui. Crie a primeira no seu ritmo.';list.append(p);return;}
for(const c of state.campaigns){const card=document.createElement('article');card.className='panel history-card';const title=document.createElement('h2');title.textContent=c.content.titulo;const source=document.createElement('p');source.className='hint';source.textContent=(c.source==='example'?'Exemplo sem IA':'Gemini')+' · '+new Date(c.createdAt).toLocaleDateString('pt-BR');const pubLabel=document.createElement('label');const pub=document.createElement('input');pub.type='checkbox';pub.style.width='auto';pub.checked=c.published;pubLabel.append(pub,document.createTextNode(' Já publiquei manualmente'));const dateLabel=document.createElement('label');dateLabel.textContent='Data da publicação';const date=document.createElement('input');date.type='date';date.value=c.date;dateLabel.append(date);const metrics=document.createElement('div');metrics.className='metrics';const inputs={};for(const [key,label]of Object.entries({alcance:'Alcance',compartilhamentos:'Compartilhamentos',consultas:'Consultas',pedidos:'Pedidos confirmados'})){const l=document.createElement('label');l.textContent=label;const i=document.createElement('input');i.type='number';i.min='0';i.max='1000000000';i.step='1';i.placeholder='Não informado';i.value=c.metrics[key]??'';l.append(i);metrics.append(l);inputs[key]=i;}const hint=document.createElement('p');hint.className='hint';hint.textContent='Preenchimento manual. Registre depois de períodos semelhantes. Campo vazio não significa zero.';const actions=document.createElement('div');actions.className='history-actions';const save=document.createElement('button');save.className='primary';save.textContent='Salvar resultados';save.onclick=()=>{if(pub.checked&&!date.value){flash('Informe a data da publicação.');return;}const values={};for(const [k,i]of Object.entries(inputs)){if(!i.checkValidity()){i.reportValidity();return;}values[k]=i.value===''?null:Number(i.value);}c.published=pub.checked;c.date=date.value;c.metrics=values;if(persist())flash('Resultados salvos.');};const open=document.createElement('button');open.className='secondary';open.textContent='Abrir campanha';open.onclick=()=>{currentId=c.id;currentBrief=c.brief;currentSource=c.source;navigate('create');showResult(structuredClone(c.content));};const del=document.createElement('button');del.className='text-button';del.textContent='Excluir';del.onclick=()=>{if(confirm('Excluir esta campanha deste navegador?')){state.campaigns=state.campaigns.filter(x=>x.id!==c.id);persist();renderHistory();}};actions.append(save,open,del);card.append(source,title,pubLabel,dateLabel,metrics,hint,actions);list.append(card);}}
$('#export').onclick=()=>download('aricia-backup.json',JSON.stringify(state,null,2),'application/json');
$('#import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2000000)throw Error();const data=JSON.parse(await file.text());if(!data.brand||!['nome','regiao','tom','diferenciais'].every(k=>typeof data.brand[k]==='string')||!Array.isArray(data.campaigns)||!data.campaigns.every(c=>typeof c.id==='string'&&c.brief&&typeof c.brief.formato==='string'&&c.metrics&&c.content&&['titulo','hipotese','capa','legenda','cta'].every(k=>typeof c.content[k]==='string')&&['cards','stories','capturas'].every(k=>Array.isArray(c.content[k])&&c.content[k].every(t=>typeof t==='string'))))throw Error();if(confirm('Substituir os dados deste navegador pelo backup?')){state=data;if(persist()){renderHistory();$('#regiao').value=state.brand.regiao;flash('Backup importado.');}}}catch{flash('Backup inválido. Use um arquivo exportado por esta ferramenta.');}e.target.value='';};
updateCount();fetch('/api/status').then(r=>r.json()).then(s=>{$('#api-status').textContent=s.configured?'Gemini configurado':'Modo de exemplo · Gemini pendente';}).catch(()=>$('#api-status').textContent='Sem conexão com o servidor');
