/* ---------- shell ---------- */
function shell(){
  if(!S.u){$('#app').innerHTML=authView();return}
  const t=TABS[S.u.role];if(!t.some(x=>x[0]===S.tab))S.tab=t[0][0];
  $('#app').innerHTML=`<nav><span class="logo"><b>P</b>ParkWise</span>${t.map(([k,l])=>`<button class="tab ${k===S.tab?'on':''}" data-a="tab" data-k="${k}">${l}</button>`).join('')}<span class="sp"></span><span>${esc(S.u.fullName)}</span> <span class="badge ${S.u.role}">${S.u.role}</span><button class="btn g s" data-a="out">Logout</button></nav><main id="main"><div class="skg">${"<div class=sk></div>".repeat(8)}</div></main>`;
  go()}
const go=safe(async()=>{const m=$('#main');if(!m)return;const h=await VIEWS[S.tab]();m.innerHTML=`<div class="view">${h}</div>`;
  document.querySelectorAll('[data-n]').forEach(e=>{const n=+e.dataset.n,t0=performance.now();(function f(t){const p=Math.min(1,(t-t0)/900);e.textContent=Math.round(n*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)})(t0)});
  requestAnimationFrame(()=>document.querySelectorAll('.bar i').forEach(b=>b.style.width=b.dataset.w+'%'))});

/* ---------- auth ---------- */
function authView(){const up=S.mode==='up';return `<div class="road"><span>🚗</span></div><div class="card auth"><span class="logo"><b>P</b>ParkWise</span><p class="sub" style="text-align:center">Smart multi-level parking</p>
<div class="tg"><button class="${!up?'on':''}" data-a="mode" data-k="in">Sign in</button><button class="${up?'on':''}" data-a="mode" data-k="up">Sign up</button></div>
${up?'<label>Full name<input id="fn"></label>':''}<label>Email<input id="em" type="email"></label><label>Password<input id="pw" type="password"></label>
${up?`<label>Role<select id="ro"><option>CUSTOMER</option><option>ADMIN</option></select></label>`:''}
<button class="btn" style="width:100%" data-a="auth">${up?'Create account':'Sign in'}</button></div>`}

/* ---------- actions ---------- */
const v=id=>$('#'+id).value.trim();
const A={
tab:d=>{S.tab=d.k;shell()},
out:()=>{S.u=null;localStorage.removeItem('pw_u');shell()},
mode:d=>{S.mode=d.k;shell()},
filter:d=>{S.filter=d.k;go()},
auth:safe(async()=>{
  if(S.mode==='up'){S.u=await api('/users',{method:'POST',body:{fullName:v('fn'),email:v('em'),passwordHash:v('pw'),role:v('ro')}})}
  else{const u=(await api('/users')).find(x=>x.email.toLowerCase()===v('em').toLowerCase());if(!u)throw new Error('No account with that email');S.u=u}
  localStorage.setItem('pw_u',JSON.stringify(S.u));S.tab=null;toast('Welcome, '+S.u.fullName);shell()}),
search:safe(async()=>{const q={fid:v('bf'),vt:v('bv'),s:v('bs'),e:v('be')};
  const r=await api(`/slots/available?facilityId=${q.fid}&vehicleType=${q.vt}&startTime=${encodeURIComponent(new Date(q.s).toISOString())}&endTime=${encodeURIComponent(new Date(q.e).toISOString())}`);
  S.book={res:r,sel:null,q};await go();$('#bf').value=q.fid;$('#bv').value=q.vt}),
pick:d=>{S.book.sel=d.k;document.querySelectorAll('.slot.pick').forEach(e=>e.classList.toggle('sel',e.dataset.k===d.k));
  const s=S.book.res.find(x=>x.id===d.k),q=S.book.q;
  modal(`<h3>Slot ${esc(s.slotNumber)} · ${s.vehicleType}${s.hasEvCharger?' ⚡':''}</h3><small class="sub">${fmt(q.s)} → ${fmt(q.e)}</small><br><br>
  <label>Vehicle number<input id="vn" placeholder="PB10AB1234" autofocus></label>
  <div class="row" style="align-items:center"><div style="flex:1">Estimated <b class="mono" style="color:var(--ac);font-size:22px">₹${price(q.s,q.e)}</b></div>
  <button class="btn g" data-a="closeMo">Back</button><button class="btn" data-a="book">Confirm</button></div>`)},
closeMo:()=>closeMo(),
book:safe(async()=>{const q=S.book.q;await api('/bookings',{method:'POST',body:{userId:S.u.id,slotId:S.book.sel,vehicleNumber:v('vn'),vehicleType:q.vt,startTime:new Date(q.s).toISOString(),endTime:new Date(q.e).toISOString()}});
  closeMo();toast('Booking confirmed 🎉');S.book={res:null,sel:null,q:null};S.tab='my';shell()}),
cancel:safe(async d=>{await api(`/bookings/${d.k}/cancel`,{method:'PATCH'});toast('Cancelled');go()}),
act:safe(async d=>{await api(`/bookings/${d.k}/activate`,{method:'PATCH'});toast('Activated');go()}),
done:safe(async d=>{await api(`/bookings/${d.k}/complete`,{method:'PATCH'});toast('Completed');go()}),
  delBk:safe(async d=>{if(!confirm('Delete booking?'))return;await api('/bookings/'+d.k,{method:'DELETE'});toast('Deleted');go()}),
  aiQuick:d=>{const input=$('#ai-in');if(input)input.value=d.k;A.aiRun()},
  aiRun:safe(async()=>{
    const prompt=$('#ai-in')?$('#ai-in').value.trim():'';
    if(!prompt){toast('Please describe your parking needs',1);return;}
    toast('🤖 Sending to Groq LLama 3.3 70B...');
    S.ai={prompt,result:null,loading:true};await go();if($('#ai-in'))$('#ai-in').value=prompt;
    let parsed;
    try{parsed=await callGroqAI(prompt,S.d.fac||[]);}catch(e){
      S.ai={prompt,result:null,loading:false};await go();if($('#ai-in'))$('#ai-in').value=prompt;
      toast('AI Error: '+e.message,1);return;
    }
    toast(`🧠 AI interpreted: ${parsed.vehicleType}${parsed.requiresEv?' + EV':''} at ${parsed.facility?.name||'facility'}`);
    const available=await api(`/slots/available?facilityId=${parsed.facilityId}&vehicleType=${parsed.vehicleType}&startTime=${encodeURIComponent(new Date(parsed.startTime).toISOString())}&endTime=${encodeURIComponent(new Date(parsed.endTime).toISOString())}`);
    if(!available||!available.length){
      S.ai={prompt,result:{slots:[],topPick:null,query:parsed}};
      await go();if($('#ai-in'))$('#ai-in').value=prompt;toast('No available slots for AI-determined window.',1);return;
    }
    const scoredSlots=available.map(slot=>{
      let score=55;const reasons=[];
      if(parsed.requiresEv){
        if(slot.hasEvCharger){score+=38;reasons.push('⚡ 60kW DC EV Supercharger ready');}
        else{score-=15;reasons.push('⚠️ Standard bay (No EV charger)');}
      }else if(slot.hasEvCharger){score+=10;reasons.push('⚡ Optional EV Supercharger available');}
      const flNum=slot.floor?.floorNumber||1;
      if(flNum===1||(slot.floor?.name||'').toLowerCase().includes('ground')){
        score+=20;reasons.push(`🏢 Ground Floor (${slot.floor?.name||'P1'}) — fast entrance & exit`);
      }else{score+=Math.max(0,15-flNum*3);reasons.push(`🏢 ${slot.floor?.name||'Floor '+flNum}`);}
      if(slot.vehicleType===parsed.vehicleType){score+=15;reasons.push(`🚗 Tailored dimensions for ${parsed.vehicleType}`);}
      reasons.push('✅ 100% Free & verified');
      return{slot,score:Math.min(99,Math.max(65,score)),reasons};
    });
    scoredSlots.sort((a,b)=>b.score-a.score);
    S.ai={prompt,result:{slots:scoredSlots,topPick:scoredSlots[0],query:parsed}};
    await go();
    if($('#ai-in'))$('#ai-in').value=prompt;
    toast('🌟 AI matched optimal parking slot!');
  }),
  aiPick:d=>{
    const res=S.ai?.result;if(!res)return;
    const match=res.slots.find(x=>x.slot.id===d.k)||(res.topPick?.slot.id===d.k?res.topPick:null);
    const s=match?match.slot:null;if(!s)return;
    const q=res.query;
    S.book={sel:s.id,q:{fid:q.facilityId,vt:q.vehicleType,s:q.startTime,e:q.endTime}};
    modal(`<h3>🤖 Reserve AI Matched Slot ${esc(s.slotNumber)}</h3>
    <div style="background:rgba(76,201,240,0.08);border:1px solid rgba(76,201,240,0.25);border-radius:8px;padding:8px 12px;margin:8px 0 14px">
      <span class="ai-score-pill">${match.score}% MATCH</span>
      <small style="color:var(--tx);display:block;margin-top:4px">${esc(s.floor.name||'Floor '+s.floor.floorNumber)} · ${s.vehicleType}${s.hasEvCharger?' · ⚡ 60kW DC EV Charger':''}</small>
      <small class="sub">${fmt(q.startTime)} → ${fmt(q.endTime)} (${q.durationHours} hrs)</small>
    </div>
    <label>Vehicle plate number<input id="vn" placeholder="CH01AB1234" value="CH01AB1234" autofocus></label>
    <div class="row" style="align-items:center;margin-top:14px">
      <div style="flex:1">Estimated <b class="mono" style="color:var(--ac);font-size:22px">₹${price(q.startTime,q.endTime)}</b></div>
      <button class="btn g" data-a="closeMo">Back</button>
      <button class="btn" style="background:linear-gradient(90deg,var(--ok),var(--ac2));color:#111" data-a="book">Confirm Reservation</button>
    </div>`);
  },
addSlot:safe(async()=>{await api(`/floors/${v('sf')}/slots`,{method:'POST',body:{slotNumber:v('sn'),vehicleType:v('sv'),hasEvCharger:$('#se').checked,status:v('ss')}});toast('Slot added');go()}),
delSlot:safe(async d=>{if(!confirm('Delete slot?'))return;await api('/slots/'+d.k,{method:'DELETE'});toast('Slot deleted');go()}),
addFac:safe(async()=>{await api('/facilities',{method:'POST',body:{name:v('fnm'),address:v('fad'),city:v('fct'),timezone:'Asia/Kolkata',active:true}});toast('Facility added');go()}),
addFloor:safe(async()=>{await api(`/facilities/${v('ff')}/floors`,{method:'POST',body:{floorNumber:+v('fnu'),name:v('fna')}});toast('Floor added');go()}),
togFac:safe(async d=>{const f=S.d.fac.find(x=>x.id===d.k);await api('/facilities/'+f.id,{method:'PUT',body:{name:f.name,address:f.address,city:f.city,timezone:f.timezone,active:!f.active}});toast('Updated');go()}),
delFac:safe(async d=>{if(!confirm('Delete facility?'))return;await api('/facilities/'+d.k,{method:'DELETE'});toast('Deleted');go()})
};
function modal(h){closeMo();const m=document.createElement('div');m.className='mo';m.innerHTML=`<div class="md">${h}</div>`;m.onclick=e=>{if(e.target===m)closeMo()};document.body.append(m);setTimeout(()=>m.querySelector('input')?.focus(),50)}
function closeMo(){document.querySelector('.mo')?.remove()}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMo()});
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.btn');if(!b)return;const r=b.getBoundingClientRect(),d=Math.max(r.width,r.height)/4,p=document.createElement('i');p.className='rp';
  p.style.cssText=`width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;b.append(p);setTimeout(()=>p.remove(),600)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b)A[b.dataset.a](b.dataset)});
document.addEventListener('change',safe(async e=>{const t=e.target;if(t.dataset.c!=='status')return;
  const s=await api('/slots/'+t.dataset.k);await api('/slots/'+s.id,{method:'PUT',body:{slotNumber:s.slotNumber,vehicleType:s.vehicleType,hasEvCharger:s.hasEvCharger,status:t.value}});
  toast('Slot → '+t.value);go()}));
shell();
