const API_BASE_URL='https://parkwise-rsor.onrender.com';
const API=`${API_BASE_URL}/api`;
globalThis.PARKWISE_AI_API_URL='https://parkwise-ai-9ed4.onrender.com/ai/recommend';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=d=>new Date(d).toLocaleString([], {dateStyle:'medium',timeStyle:'short'});
const S={u:JSON.parse(localStorage.getItem('pw_u')||'null'),tab:null,mode:'in',d:{},book:{res:null,sel:null,q:null},ai:{prompt:'',result:null,loading:false},filter:'ALL'};
const TABS={CUSTOMER:[['book','Book a slot'],['ai','🤖 AI Slot Finder'],['my','My bookings']],ADMIN:[['ov','Overview'],['slots','Slots'],['fac','Facilities'],['bk','Bookings']]};
const VT=['CAR','BIKE','SUV','VAN'],ST=['AVAILABLE','MAINTENANCE','OUT_OF_SERVICE'];

const VIEWS={};
