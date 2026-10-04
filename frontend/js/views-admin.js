Object.assign(VIEWS,{
async ov(){const[s,b,u,f]=await Promise.all([api('/slots'),api('/bookings'),api('/users'),api('/facilities')]);
const c=(a,k,v)=>a.filter(x=>x[k]===v).length;const rev=b.filter(x=>x.status!=='CANCELLED').reduce((t,x)=>t+ +x.totalAmount,0);
const busySlots=s.filter(x=>x.status==='AVAILABLE'&&b.some(bk=>(bk.status==='ACTIVE'||bk.status==='CONFIRMED')&&bk.slotId===x.id)).length;
const freeSlots=Math.max(0,c(s,'status','AVAILABLE')-busySlots);
const bar=(l,n,t,col)=>`<div>${l} <b>${n}</b></div><div class="bar"><i style="background:${col}" data-w="${t?n/t*100:0}"></i></div>`;
return `<h2>Overview</h2><p class="sub">Live facility snapshot</p><div class="stats">${[['Facilities',f.length],['Total Slots',s.length],['🟢 Free Slots',freeSlots],['🔴 Busy Slots',busySlots],['Bookings',b.length],['Revenue ₹',rev]].map(([l,n],i)=>`<div class="card stat" style="--i:${i}"><b data-n="${n}">0</b><span>${l}</span></div>`).join('')}</div>
<div class="row"><div class="card" style="flex:1;min-width:280px"><h3>Slots by live occupancy</h3><br>${bar('🟢 Free / Available',freeSlots,s.length,'var(--ok)')}${bar('🔴 Busy / Occupied',busySlots,s.length,'var(--er)')}${bar('🔧 Maintenance',c(s,'status','MAINTENANCE'),s.length,'var(--wa)')}${bar('⛔ Out of service',c(s,'status','OUT_OF_SERVICE'),s.length,'var(--er)')}</div>
<div class="card" style="flex:1;min-width:280px"><h3>Bookings by status</h3><br>${bar('Confirmed',c(b,'status','CONFIRMED'),b.length,'var(--ac)')}${bar('Active',c(b,'status','ACTIVE'),b.length,'var(--ok)')}${bar('Completed',c(b,'status','COMPLETED'),b.length,'var(--ac2)')}${bar('Cancelled',c(b,'status','CANCELLED'),b.length,'var(--er)')}</div></div>`},
async slots(){const[s,fl,b]=await Promise.all([api('/slots'),api('/floors'),api('/bookings')]);S.d.fl=fl;
const slotBusyMap=new Map();
b.forEach(bk=>{if(bk.status==='ACTIVE'||bk.status==='CONFIRMED'){if(!slotBusyMap.has(bk.slotId)||bk.status==='ACTIVE')slotBusyMap.set(bk.slotId,bk)}});
const getSlotState=x=>{
  if(x.status==='OUT_OF_SERVICE')return{live:'OUT OF SERVICE',cls:'OUT_OF_SERVICE',icon:'⛔',isFree:false,isBusy:true};
  if(x.status==='MAINTENANCE')return{live:'MAINTENANCE',cls:'MAINTENANCE',icon:'🔧',isFree:false,isBusy:true};
  const bk=slotBusyMap.get(x.id);
  if(bk)return{live:bk.status==='ACTIVE'?'BUSY · OCCUPIED':'BUSY · RESERVED',cls:'BUSY',icon:'🔴',isFree:false,isBusy:true,bk};
  return{live:'FREE',cls:'FREE',icon:'🟢',isFree:true,isBusy:false};
};
const filterChips=['ALL','FREE','BUSY',...ST];
const sh=s.filter(x=>{
  if(S.filter==='ALL')return true;
  const st=getSlotState(x);
  if(S.filter==='FREE')return st.isFree;
  if(S.filter==='BUSY')return st.isBusy&&st.bk;
  return x.status===S.filter;
});
const fn=f=>f.facility.name+' · '+(f.name||'Floor '+f.floorNumber);
return `<h2>Slots</h2><p class="sub">Monitor live free/busy occupancy, add slots, and manage their status.</p>
<div class="card"><h3>Add slot</h3><br><div class="row"><label>Floor<select id="sf">${opts(fl,x=>x.id,fn)}</select></label><label>Slot number<input id="sn" placeholder="A-101"></label>
<label>Vehicle<select id="sv">${opts(VT)}</select></label><label>Status<select id="ss">${opts(ST)}</select></label><label class="chk"><input id="se" type="checkbox"> EV charger</label><button class="btn" data-a="addSlot">Add</button></div>${fl.length?'':'<p class="sub">Create a facility and floor first (Facilities tab).</p>'}</div>
<div class="chips">${filterChips.map(x=>`<button class="chip ${S.filter===x?'on':''}" data-a="filter" data-k="${x}">${x==='FREE'?'🟢 FREE':x==='BUSY'?'🔴 BUSY':x}</button>`).join('')}</div>
${sh.length?Object.entries(sh.reduce((m,x)=>((m[fn(x.floor)]??=[]).push(x),m),{})).map(([k,arr])=>`<div class="fh">${esc(k)} <span class="badge">${arr.length}</span></div><div class="grid">${arr.map((x,i)=>{const st=getSlotState(x);return`<div class="slot ${x.status}" style="--i:${i};border-top:3px solid ${st.isFree?'var(--ok)':st.bk?'var(--er)':'var(--wa)'}" id="s${x.id}"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b>${esc(x.slotNumber)}</b><span class="badge ${st.cls}">${st.icon} ${st.live}</span></div><small>${esc(fn(x.floor))}<br>${x.vehicleType}${x.hasEvCharger?' · ⚡EV':''}${st.bk?`<br><span style="color:var(--ac);font-weight:700">🚗 ${esc(st.bk.vehicleNumber)}</span>`:''}</small><br><label style="font-size:11px;color:var(--mu);margin-bottom:4px">Status:<select data-c="status" data-k="${x.id}">${ST.map(t=>`<option ${t===x.status?'selected':''}>${t}</option>`).join('')}</select></label><br><button class="btn d s" data-a="delSlot" data-k="${x.id}">Delete</button></div>`}).join('')}</div>`).join(''):'<div class="card empty">No slots here.</div>'}`},
async fac(){const[f,fl]=await Promise.all([api('/facilities'),api('/floors')]);S.d.fac=f;
return `<h2>Facilities</h2><p class="sub">Facilities and their floors.</p>
<div class="row"><div class="card" style="flex:2;min-width:300px"><h3>New facility</h3><br><div class="row"><label>Name<input id="fnm"></label><label>City<input id="fct"></label></div><br><div class="row"><label>Address<input id="fad"></label><button class="btn" data-a="addFac">Add</button></div></div>
<div class="card" style="flex:1;min-width:260px"><h3>New floor</h3><br><div class="row"><label>Facility<select id="ff">${opts(f,x=>x.id,x=>x.name)}</select></label><label>No.<input id="fnu" type="number" value="1"></label></div><br><div class="row"><label>Name<input id="fna" placeholder="Ground"></label><button class="btn" data-a="addFloor">Add</button></div></div></div>
${f.map((x,i)=>`<div class="card h" style="--i:${i}"><div class="row" style="align-items:center"><div style="flex:1"><b>${esc(x.name)}</b> <span class="badge ${x.active?'AVAILABLE':'CANCELLED'}">${x.active?'ACTIVE':'INACTIVE'}</span><br><small class="sub">${esc(x.address)}, ${esc(x.city)}</small><br>${fl.filter(y=>y.facility.id===x.id).sort((a,b)=>a.floorNumber-b.floorNumber).map(y=>`<span class="badge">${esc(y.name||'Floor '+y.floorNumber)}</span> `).join('')||'<small class="sub">No floors</small>'}</div>
<button class="btn g s" data-a="togFac" data-k="${x.id}">${x.active?'Deactivate':'Activate'}</button><button class="btn d s" data-a="delFac" data-k="${x.id}">Delete</button></div></div>`).join('')||'<div class="card empty">No facilities yet.</div>'}`},
async bk(){const[b,u,s]=await Promise.all([api('/bookings'),api('/users'),api('/slots')]);
const un=Object.fromEntries(u.map(x=>[x.id,x.fullName])),sn=Object.fromEntries(s.map(x=>[x.id,x.slotNumber]));b.sort((x,y)=>new Date(y.createdAt)-new Date(x.createdAt));
const A=(a,k,l,c)=>`<button class="btn ${c} s" data-a="${a}" data-k="${k}">${l}</button> `;
return `<h2>Bookings</h2><p class="sub">Move bookings through their lifecycle.</p><div class="card sc"><table><tr><th>User</th><th>Slot</th><th>Vehicle</th><th>Time</th><th>₹</th><th>Status</th><th></th></tr>
${b.map((x,i)=>`<tr class="r" style="--i:${i}"><td>${esc(un[x.userId]||'?')}</td><td>${esc(sn[x.slotId]||'?')}</td><td>${esc(x.vehicleNumber)}</td><td><small>${fmt(x.startTime)}<br>${fmt(x.endTime)}</small></td><td>${x.totalAmount}</td><td><span class="badge ${x.status}">${x.status}</span></td>
<td>${x.status==='CONFIRMED'?A('act',x.id,'Activate','o')+A('cancel',x.id,'Cancel','g'):''}${x.status==='ACTIVE'?A('done',x.id,'Complete','o'):''}${A('delBk',x.id,'🗑','d')}</td></tr>`).join('')}</table>${b.length?'':'<div class="empty">No bookings.</div>'}</div>`}
});
