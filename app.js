'use strict';
const el = id => document.getElementById(id);
const rows = [];
const types = {PNG:'image/png',JPEG:'image/jpeg',WebP:'image/webp'};
let busy = false;
function update(){
  el('count').textContent = rows.length ? rows.length+' arquivo(s)' : 'Nenhum arquivo';
  el('clear').hidden = !rows.length;
  for(const id of ['clear','files','format','limit','prefix']) el(id).disabled = busy;
  el('convert').disabled = busy || !el('limit').validity.valid || !rows.some(r=>r.ready);
  el('zip').disabled = busy || !rows.some(r=>r.blob);
  el('quality').disabled = busy || el('format').value==='PNG';
  document.querySelectorAll('.remove').forEach(b=>b.disabled=busy);
}
function dispose(r){
  for(const url of [r.src,r.url]) if(url) URL.revokeObjectURL(url);
  r.node.remove();
}
function clearResult(r){
  if(r.url) URL.revokeObjectURL(r.url);
  r.url=null;r.blob=null;r.link.hidden=true;r.bar.value=0;
}
function add(files){
  if(busy)return;
  let skipped=0;
  for(const file of files){
    if(rows.length>=40){skipped++;continue}
    const node=document.createElement('article');node.className='row';
    node.innerHTML='<img alt=""><div><b></b><small></small><small class="state"></small><progress max="100" value="0" aria-label="Progresso da imagem"></progress></div><a hidden>Baixar</a><button class="remove" aria-label="Remover imagem">×</button>';
    const r={file,node,bar:node.querySelector('progress'),state:node.querySelector('.state'),link:node.querySelector('a')};
    rows.push(r);el('list').append(node);
    node.querySelector('b').textContent=file.name;
    node.querySelector('small').textContent=(file.type.split('/')[1]?.toUpperCase() || 'Desconhecido')+' · '+(file.size/1000000).toLocaleString('pt-BR',{maximumFractionDigits:3})+' MB';
    node.querySelector('button').onclick=()=>{if(!busy){rows.splice(rows.indexOf(r),1);dispose(r);update()}};
    r.ready=Object.values(types).includes(file.type)&&file.size<=15000000;
    if(r.ready){r.src=URL.createObjectURL(file);const img=node.querySelector('img');img.loading='lazy';img.src=r.src;r.state.textContent='Na fila'}
    else r.state.textContent=file.size>15000000?'Excede 15 MB.':'Formato incompatível.';
  }
  el('notice').textContent=skipped?skipped+' arquivo(s) ficaram fora pelo limite de 40.':'';
  update();
}
el('files').onchange=e=>{add(e.target.files);e.target.value=''};
window.ondragover=e=>e.preventDefault();
el('drop').ondragover=()=>el('drop').classList.add('over');
el('drop').ondragleave=()=>el('drop').classList.remove('over');
window.ondrop=e=>{e.preventDefault();el('drop').classList.remove('over');add(e.dataTransfer.files)};
el('clear').onclick=()=>{rows.splice(0).forEach(dispose);el('notice').textContent='';update()};
function options(){
  el('percent').textContent=el('format').value==='PNG'?'Sem perdas':el('quality').value+'%';
  el('help').textContent=el('format').value==='PNG'?'PNG preserva a transparência.':el('format').value==='JPEG'?'Áreas transparentes recebem fundo branco.':'Mais qualidade pode gerar arquivos maiores.';
  for(const r of rows)if(r.ready){clearResult(r);r.state.textContent='Na fila'}
  el('notice').textContent='';update();
}
el('format').onchange=options;el('quality').oninput=options;
el('limit').oninput=options;
el('prefix').oninput=options;
el('convert').onclick=async()=>{
  busy=true;update();el('notice').textContent='';
  const format=el('format').value,mime=types[format],used=new Set();
  let sequence=0;
  for(const r of rows.filter(r=>r.ready)){
    clearResult(r);const canvas=document.createElement('canvas');
    try{
      r.state.textContent='Lendo imagem…';r.bar.value=15;
      const img=new Image();img.src=r.src;await img.decode();
      if(img.naturalWidth*img.naturalHeight>20000000)throw Error('Excede 20 megapixels.');
      const limit=el('limit').valueAsNumber;
      const scale=Number.isFinite(limit)?Math.min(1,limit/Math.max(img.naturalWidth,img.naturalHeight)):1;
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
      canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=canvas.getContext('2d');
      if(format==='JPEG'){ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height)}
      ctx.imageSmoothingQuality="high";ctx.drawImage(img,0,0,canvas.width,canvas.height);r.bar.value=60;r.state.textContent='Convertendo…';
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,mime,Number(el('quality').value)/100));
      if(!blob || blob.type!==mime)throw Error('O navegador não conseguiu gerar '+format+'.');
      const prefix=el('prefix').value.trim().replace(/[^\p{L}\p{N}_ -]/gu,'_');
      const stem=prefix ? prefix+'-'+String(++sequence).padStart(3,'0') : r.file.name.replace(/\.[^.]+$/,'').replace(/[\\/:*?"<>|]/g,'_')||'imagem';
      const ext=format==='JPEG'?'jpg':format.toLowerCase();
      let name=stem+'.'+ext,i=2;while(used.has(name.toLowerCase()))name=stem+' ('+(i++)+').'+ext;
      used.add(name.toLowerCase());r.blob=blob;r.url=URL.createObjectURL(blob);
      r.link.href=r.url;r.link.download=name;r.link.hidden=false;r.bar.value=100;r.state.textContent=name+' · '+canvas.width+' × '+canvas.height+' px · '+Math.ceil(blob.size/1000)+' kB';
    }catch(e){r.state.textContent=e.name==='Error'?e.message:'Falha ao ler ou converter esta imagem.'}
    finally{canvas.width=canvas.height=0}
  }
  busy=false;update();el('notice').textContent=rows.filter(r=>r.blob).length+' de '+rows.length+' arquivo(s) convertidos.';
};
el('zip').onclick=async()=>{
  busy=true;update();
  try{
    const zip=new JSZip();
    for(const r of rows.filter(r=>r.blob))zip.file(r.link.download,r.blob);
    const blob=await zip.generateAsync({type:'blob'},p=>el('notice').textContent='Preparando ZIP · '+Math.round(p.percent)+'%');
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='LoteConvert.zip';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),60000);
    el('notice').textContent='ZIP pronto para download.';
  }catch{el('notice').textContent='Falha ao montar o ZIP. Baixe os resultados individualmente.'}
  finally{busy=false;update()}
};
