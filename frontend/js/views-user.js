async function callGroqAI(prompt, facilities) {
  const aiEndpoint = globalThis.PARKWISE_AI_API_URL || '/ai/recommend';
  const resp = await fetch(aiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      facilities: facilities.map(f => ({ id: f.id, name: f.name, city: f.city, address: f.address })),
      currentTime: new Date().toISOString()
    })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || 'AI service error — is GROQ_API_KEY set?');
  }
  const json = await resp.json();
  if (!json.success || json.data?.error) throw new Error(json.data?.error || 'AI returned invalid data');
  const d = json.data;
  // Resolve facility
  const fac = facilities.find(f => f.id === d.facilityId) || facilities.find(f => (f.name || '').toLowerCase().includes((d.facilityName || '').toLowerCase())) || facilities[0];
  return {
    facility: fac,
    facilityId: fac?.id,
    vehicleType: d.vehicleType || 'CAR',
    requiresEv: !!d.requiresEv,
    preferGround: d.preferences?.preferGround || false,
    startTime: d.startTime,
    endTime: d.endTime,
    durationHours: d.durationHours || 2,
    reasoning: d.reasoning || '',
    model: json.model || 'llama-3.3-70b',
    usage: json.usage || {}
  };
}


Object.assign(VIEWS,{

async book(){
  const f = (await api('/facilities')).filter(x => x.active); S.d.fac = f;
  const q = S.book.q || { fid: f[0]?.id, vt: 'CAR', s: ago(1), e: ago(2) }; const b = S.book;
  return `<h2>Book a slot</h2><p class="sub">Pick facility, vehicle and time — or try the AI Smart Recommender.</p>
  <div class="card ai-card" style="margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <b style="color:var(--ac2);font-size:15px">🤖 AI Smart Parking Assistant</b>
      <p style="color:var(--mu);font-size:13px;margin:3px 0 0">Describe your vehicle & timing to get optimal slots matched by EV charging, floor level, and proximity.</p>
    </div>
    <button class="btn" style="background:linear-gradient(90deg,var(--ac2),var(--ac));color:#111" data-a="tab" data-k="ai">Open AI Slot Finder →</button>
  </div>
  <div class="card"><div class="row"><label>Facility<select id="bf">${opts(f, x => x.id, x => x.name + ' · ' + x.city)}</select></label>
  <label>Vehicle<select id="bv">${opts(VT)}</select></label><label>From<input id="bs" type="datetime-local" value="${q.s}"></label><label>To<input id="be" type="datetime-local" value="${q.e}"></label>
  <button class="btn" data-a="search">Find slots</button></div></div>
  ${b.res === null ? '' : b.res.length ? `<div class="grid">${b.res.map((s, i) => `<div class="slot pick ${b.sel === s.id ? 'sel' : ''} ${s.status}" style="--i:${i}" data-a="pick" data-k="${s.id}"><span class="car">🚗</span><b>${esc(s.slotNumber)}</b><small>${esc(s.floor.name || 'Floor ' + s.floor.floorNumber)} · ${s.vehicleType}${s.hasEvCharger ? ' · ⚡EV' : ''}</small></div>`).join('')}</div>` : '<div class="card empty">No free slots for that window.</div>'}
`;
},

async ai(){
  const f = (await api('/facilities')).filter(x => x.active); S.d.fac = f;
  const aiState = S.ai || { prompt: '', result: null, loading: false };
  const quickPrompts = [
    '⚡ Need 60kW EV charging for Tesla/Nexon tomorrow 2 PM to 5 PM',
    '🚙 Large SUV parking for 3 hours near Sector 17',
    '🏢 Ground floor easy exit slot tonight 7 PM for 2 hrs',
    '🏍️ Motorcycle/Bike space for today 10 AM to 1 PM'
  ];

  return `<h2>🤖 AI Slot Finder</h2><p class="sub">Powered by <b>Groq Cloud LLM Engine</b> — real neural AI understanding, reasoning & slot scoring.</p>
  <div class="card ai-card">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <span class="ai-score-pill">GROQ AI</span>
      <span style="background:rgba(114,137,218,0.2);color:#7289da;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.5px">⚡ GROQ LPU INFERENCE</span>
      <b style="font-size:14px;color:var(--tx)">Describe your parking needs naturally</b>
    </div>
    <label style="margin-bottom:12px">
      <textarea id="ai-in" rows="2" style="background:#0b0d10;border:1px solid rgba(76,201,240,0.3);color:#fff;border-radius:10px;padding:12px;font:inherit;width:100%" placeholder="e.g. 'I have a Tata Nexon EV and need supercharging tomorrow from 2 PM to 5 PM near Sector 17'">${esc(aiState.prompt)}</textarea>
    </label>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
      ${quickPrompts.map(p => `<span class="ai-tag" data-a="aiQuick" data-k="${esc(p)}">${esc(p)}</span>`).join('')}
    </div>
    <div style="display:flex;justify-content:flex-end;align-items:center;margin-top:10px">
      <button class="btn" style="background:linear-gradient(90deg,var(--ac2),var(--ac));color:#111;padding:10px 24px;font-size:15px" data-a="aiRun"${aiState.loading?' disabled':''}>
        ${aiState.loading ? '<span class="ai-spinner"></span> AI Thinking...' : '🤖 Find Best Match'}
      </button>
    </div>
  </div>

  ${aiState.loading ? `
    <div class="card ai-card" style="text-align:center;padding:40px 20px">
      <div class="ai-spinner" style="width:36px;height:36px;margin:0 auto 16px"></div>
      <b style="color:var(--ac2);font-size:16px">⚡ Groq Cloud AI is analyzing your request...</b>
      <p style="color:var(--mu);font-size:13px;margin-top:6px">Deep reasoning over vehicle specs, EV chargers, slot geometry & time slots</p>
    </div>
  ` : ''}

  ${aiState.result ? `
    <div class="ai-recom-box">
      ${aiState.result.query.reasoning ? `
        <div class="card" style="background:rgba(114,137,218,0.08);border:1px solid rgba(114,137,218,0.25);padding:12px 16px;margin-bottom:14px">
          <div style="display:flex;align-items:flex-start;gap:8px">
            <span style="font-size:18px">🧠</span>
            <div>
              <b style="color:#7289da;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">AI Interpretation</b>
              <p style="color:var(--tx);font-size:14px;margin:4px 0 0;line-height:1.5">${esc(aiState.result.query.reasoning)}</p>
              <small style="color:var(--mu);margin-top:6px;display:flex;gap:12px;flex-wrap:wrap">
                <span>📋 ${aiState.result.query.vehicleType}${aiState.result.query.requiresEv ? ' + ⚡EV' : ''}</span>
                <span>🏢 ${esc(aiState.result.query.facility?.name||'Auto')}</span>
                <span>🕐 ${fmt(aiState.result.query.startTime)} → ${fmt(aiState.result.query.endTime)}</span>
                ${aiState.result.query.model ? `<span>🤖 ${aiState.result.query.model}</span>` : ''}
                ${aiState.result.query.usage?.total_tokens ? `<span>📊 ${aiState.result.query.usage.total_tokens} tokens</span>` : ''}
              </small>
            </div>
          </div>
        </div>
      ` : ''}

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <div>
          <span class="ai-score-pill">MATCH CONFIDENCE: ${aiState.result.topPick ? aiState.result.topPick.score + '%' : '0%'}</span>
          <h3 style="margin:6px 0 2px;color:#fff;font-size:18px">🌟 Top AI Recommended Slot: <b>${esc(aiState.result.topPick?.slot.slotNumber || 'None')}</b></h3>
          <small style="color:var(--mu)">Target Facility: ${esc(aiState.result.query.facility?.name)} · Timing: ${fmt(aiState.result.query.startTime)} → ${fmt(aiState.result.query.endTime)}</small>
        </div>
        ${aiState.result.topPick ? `
          <button class="btn" style="background:linear-gradient(90deg,var(--ok),var(--ac2));color:#111;font-size:15px;padding:10px 20px" data-a="aiPick" data-k="${aiState.result.topPick.slot.id}">⚡ Instant Reserve Now</button>
        ` : ''}
      </div>

      ${aiState.result.topPick ? `
        <div class="card" style="background:rgba(0,0,0,0.4);border:1px solid rgba(76,201,240,0.3);padding:14px;margin-bottom:14px">
          <b style="color:var(--ac2);font-size:13px;display:block;margin-bottom:8px">🧠 Why AI selected this slot for you:</b>
          ${aiState.result.topPick.reasons.map(r => `<div class="ai-reason-item"><span>${r}</span></div>`).join('')}
          <div style="margin-top:10px;padding-top:10px;border-top:1px solid #ffffff12;display:flex;justify-content:space-between;align-items:center">
            <span style="color:var(--mu);font-size:13px">Vehicle Type: <b>${aiState.result.topPick.slot.vehicleType}</b> ${aiState.result.topPick.slot.hasEvCharger ? '· ⚡ 60kW DC Fast Charge' : ''}</span>
            <span style="font-size:15px;color:var(--ac);font-weight:700">Estimated Total: ₹${price(aiState.result.query.startTime, aiState.result.query.endTime)}</span>
          </div>
        </div>
      ` : `<div class="card empty">No slots available matching AI criteria. Try adjusting the timeframe or facility.</div>`}

      ${aiState.result.slots.length > 1 ? `
        <h4 style="margin:16px 0 10px;color:var(--mu);font-size:13px;text-transform:uppercase;letter-spacing:1px">Other Compatible AI Matches (${aiState.result.slots.length - 1})</h4>
        <div class="grid">
          ${aiState.result.slots.slice(1).map((item, i) => `
            <div class="slot pick" style="--i:${i}" data-a="aiPick" data-k="${item.slot.id}">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <b>${esc(item.slot.slotNumber)}</b>
                <span class="badge ${item.slot.hasEvCharger ? 'ACTIVE' : 'CONFIRMED'}">${item.score}% Match</span>
              </div>
              <small>${esc(item.slot.floor.name || 'Floor ' + item.slot.floor.floorNumber)}<br>${item.slot.vehicleType}${item.slot.hasEvCharger ? ' · ⚡EV' : ''}</small>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  ` : ''}
`;
},

async my(){
  const bk = (await api('/bookings/user/' + S.u.id)).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  return `<h2>My bookings</h2><p class="sub">${bk.length} total</p>${bk.length ? bk.map((b, i) => `<div class="card h" style="--i:${i}"><div class="row" style="align-items:center"><div style="flex:1"><b>${esc(b.vehicleNumber)}</b> · ${b.vehicleType}<br><small class="sub">${fmt(b.startTime)} → ${fmt(b.endTime)}</small></div><b>₹${b.totalAmount}</b><span class="badge ${b.status}">${b.status}</span>${b.status === 'CONFIRMED' ? `<button class="btn d s" data-a="cancel" data-k="${b.id}">Cancel</button>` : ''}</div></div>`).join('') : '<div class="card empty">No bookings yet.</div>'}`;
}
});
