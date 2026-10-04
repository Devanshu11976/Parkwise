async function api(p,o={}){
  let r;try{r=await fetch(API+p,{headers:{'Content-Type':'application/json'},method:o.method,body:o.body?JSON.stringify(o.body):undefined})}
  catch(e){throw new Error('Cannot reach backend. Is it running + CORS enabled?')}
  if(r.status===204)return null;let j=null;try{j=await r.json()}catch(e){}
  if(!r.ok){const error=new Error((j&&(j.message||j.error))||'Error '+r.status);error.status=r.status;throw error}return j}
function toast(m,e){const t=document.createElement('div');t.className='toast'+(e?' e':'');t.textContent=m;$('#toasts').append(t);setTimeout(()=>{t.style.transition='.4s';t.style.opacity=0;setTimeout(()=>t.remove(),400)},3200)}
const safe=f=>async(...a)=>{try{await f(...a)}catch(e){toast(e.message,1)}};
const opts=(arr,v,l=x=>x)=>arr.map(x=>`<option value="${esc(v?v(x):x)}">${esc(l(x))}</option>`).join('');
const ago=(h)=>{const d=new Date(Date.now()+h*36e5);d.setMinutes(0,0,0);return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,16)};
const price=(a,b)=>Math.max(1,Math.ceil((new Date(b)-new Date(a))/36e5))*30;
