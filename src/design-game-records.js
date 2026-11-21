const KEY='portfolio:design-city:v2';
export const cleanName=value=>String(value??'').normalize('NFKC').replace(/[\p{Cc}\p{Cf}<>]/gu,'').trim().replace(/\s+/g,' ').slice(0,20);
const id=()=>globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
export function createRecords(storage){
  let data={version:2,players:[],runs:[],active:null,sound:false},persistent=true;
  try{
    storage ||= globalThis.localStorage;
    const saved=JSON.parse(storage.getItem(KEY)||'null');
    if(saved?.version===2){
      const ids=new Set();
      data.players=(Array.isArray(saved.players)?saved.players:[]).filter(p=>p&&typeof p.id==='string'&&p.id.length<100&&cleanName(p.name)&&!ids.has(p.id)&&ids.add(p.id)).slice(0,50).map(p=>({id:p.id,name:cleanName(p.name),created:Number(p.created)||Date.now()}));
      const keptIds=new Set(data.players.map(p=>p.id));
      data.runs=(Array.isArray(saved.runs)?saved.runs:[]).filter(r=>r&&keptIds.has(r.playerId)&&['colour','alignment','repair','valet','patterns'].includes(r.mode)&&Number.isInteger(r.score)&&r.score>=0&&r.score<=100000&&typeof r.id==='string'&&r.id.length<100&&Number.isFinite(r.date)&&r.date>=0&&r.date<=Date.now()+60000).slice(-500);
      data.active=data.players.some(p=>p.id===saved.active)?saved.active:null;data.sound=saved.sound===true;
    }
  }catch{persistent=false;}
  const save=()=>{try{storage.setItem(KEY,JSON.stringify(data));persistent=true;}catch{persistent=false;}return persistent;};
  return {
    get persistent(){return persistent;},get players(){return data.players.map(p=>({...p}));},get active(){return data.players.find(p=>p.id===data.active)||null;},get sound(){return data.sound;},
    setSound(value){data.sound=!!value;save();},
    select(playerId){if(!data.players.some(p=>p.id===playerId))throw new Error('Choose an existing player.');data.active=playerId;save();return this.active;},
    create(name){name=cleanName(name);if(name.length<2)throw new Error('Enter a name with 2–20 characters.');const existing=data.players.find(p=>p.name.toLocaleLowerCase()===name.toLocaleLowerCase());if(existing)return this.select(existing.id);if(data.players.length>=50)throw new Error('This device has 50 players. Delete an unused profile first.');const player={id:id(),name,created:Date.now()};data.players.push(player);data.active=player.id;save();return player;},
    rename(playerId,name){name=cleanName(name);if(name.length<2)throw new Error('Enter a name with 2–20 characters.');if(data.players.some(p=>p.id!==playerId&&p.name.toLocaleLowerCase()===name.toLocaleLowerCase()))throw new Error('That name already belongs to another player on this device.');const player=data.players.find(p=>p.id===playerId);if(!player)throw new Error('Player not found.');player.name=name;save();},
    remove(playerId){data.players=data.players.filter(p=>p.id!==playerId);data.runs=data.runs.filter(r=>r.playerId!==playerId);if(data.active===playerId)data.active=null;save();},
    addRun(mode,score){if(!this.active||!['colour','alignment','repair','valet','patterns'].includes(mode)||!Number.isInteger(score)||score<0||score>100000)throw new Error('Invalid game result.');const run={id:id(),playerId:data.active,mode,score,date:Date.now()};data.runs.push(run);data.runs=data.runs.slice(-500);save();return {...run};},
    deleteRun(runId,playerId){data.runs=data.runs.filter(r=>!(r.id===runId&&r.playerId===playerId));save();},
    history(playerId=data.active){return data.runs.filter(r=>r.playerId===playerId).sort((a,b)=>b.date-a.date).map(r=>({...r}));},
    rankings(mode){return data.players.map(p=>{const runs=data.runs.filter(r=>r.playerId===p.id&&(!mode||r.mode===mode));return {...p,best:runs.length?Math.max(...runs.map(r=>r.score)):0,plays:runs.length};}).filter(p=>p.plays).sort((a,b)=>b.best-a.best||b.plays-a.plays||a.created-b.created);},
    stats(){return {players:data.players.length,runs:data.runs.length};}
  };
}
