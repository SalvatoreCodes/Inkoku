import * as Auth from './account.js';
import {LEVELS,levelOf,ITEMS,DEFAULTS,itemById,unlocked,equip,migrateProfile,rewardsBetween} from './progression.js';
import {escapeHTML,avatar,profileCard,progressCard,journeyContent,collectionContent,scoreboardContent,preview} from './social-ui.js';
import {DIFFICULTIES,RANKS,THRESHOLDS,generate,newGame,enter,erase,undo,dateKey,dateSeed,profileDefault,rankOf,award,peers} from './engine.js';
const $=s=>document.querySelector(s);
const icons={
 arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 back:'<path d="m14 6-6 6 6 6"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 play:'<path d="m9 5 11 7-11 7z"/>',
 pause:'<path d="M8 5v14M16 5v14"/>',
 grid:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/>',
 leaf:'<path d="M19 4C5 3 2 10 6 16s14 3 13-12ZM6 18 15 9"/>',
 trophy:'<path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v3c0 3 4 3 4 3m8-6h4v3c0 3-4 3-4 3m-4 2v6m-4 0h8"/>',
 palette:'<circle cx="12" cy="12" r="8"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><path d="M7 16c2-4 8-4 10 0"/>',
 flame:'<path d="M13 3c2 6-4 6-2 10 1-2 3-3 4-5 7 8 1 14-5 12C2 18 5 10 8 8c-1 4 1 4 1 4S8 5 13 3Z"/>',
 calendar:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 10h16m-12 5h3"/>',
 heart:'<path d="M12 20 4 12C-2 5 7 0 12 7c5-7 14-2 8 5z"/>',
 pen:'<path d="m4 20 1-5L16 4a2 2 0 0 1 4 4L9 19zM14 6l4 4M4 20l5-1"/>',
 erase:'<path d="m4 13 9-9a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-8 8H9l-5-4a2 2 0 0 1 0-3ZM9 8l8 8M13 20h8"/>',
 undo:'<path d="M4 10h10a6 6 0 0 1 0 12M4 10l5-5M4 10l5 5"/>',
 lock:'<rect x="6" y="10" width="12" height="11" rx="2"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 star:'<path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>'
};
const icon=n=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[n]+'</svg>';
const btn=(action,label,ico,cls='icon-button')=>'<button class="'+cls+'" data-action="'+action+'" aria-label="'+label+'">'+icon(ico)+'</button>';
const themes=[
 {id:'ocean',bg:'#e1edf2',ink:'#173846',accent:'#186d85',card:'#f1f8fa',muted:'#587580',line:'#bfd3dc',soft:'#c7e1ec',select:'#a4cddc',peer:'#d7e7ed'},
 {id:'paper',name:'Paper',rank:0,bg:'#f4f1ea',ink:'#262c27',accent:'#c74a28',card:'#fcfaf5',muted:'#74786e',line:'#dcded3',soft:'#f5e1d5',select:'#ead3bd',peer:'#eeece2'},
 {id:'moss',name:'Moss',rank:1,bg:'#e8eddf',ink:'#273c30',accent:'#426344',card:'#f1f5e9',muted:'#63745e',line:'#cbd5c2',soft:'#d3e0c6',select:'#b9d0a9',peer:'#e0e8d7'},
 {id:'dusk',name:'Dusk',rank:3,bg:'#ede7f3',ink:'#392f49',accent:'#795295',card:'#f8f2fc',muted:'#786a85',line:'#d6c9e0',soft:'#e2d4ed',select:'#cfb9df',peer:'#e8dfef'},
 {id:'midnight',name:'Midnight',rank:5,bg:'#202824',ink:'#eceee3',accent:'#ebb68b',card:'#27312c',muted:'#a4b0a5',line:'#465249',soft:'#384238',select:'#53614c',peer:'#303b34'}
];
let owner=Auth.user()?.id||null,category='avatar',scoreState={period:'all',difficulty:-1,rows:[],me:null,loading:false,error:null},scoreRequest=0;
let profile=profileDefault(), game=null, page='home', selected=-1,pencil=false,paused=false,loading=false,errorCell=-1;
try{
 const saved=JSON.parse(localStorage.getItem(owner?'sudoku.account.'+owner:'inkoku.v1')||'null');
 if(saved?.profile && Number.isFinite(saved.profile.xp))profile={...profile,...saved.profile};
 if(saved?.game && saved.game.puzzle?.length===81 && saved.game.solution?.length===81 && saved.game.board?.length===81 && saved.game.notes?.length===81)game=saved.game;
}catch{}
profile=migrateProfile(profile);
function persist(){try{localStorage.setItem(owner?'sudoku.account.'+owner:'inkoku.v1',JSON.stringify({profile,game}));}catch{toast('Storage unavailable');}}
function applyTheme(){
 const theme=themes.find(t=>t.id===(profile.equipped.theme||'theme-paper').replace('theme-',''))||themes[0];
 for(const k of ['bg','ink','accent','card','muted','line','soft','select','peer'])document.documentElement.style.setProperty('--'+k,theme[k]);
 document.querySelector('meta[name="theme-color"]').content=theme.bg;
}
applyTheme();
let toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2200);}
const time=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
function streak(){const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);return [dateKey(),dateKey(yesterday)].includes(profile.lastWin)?profile.streak:0;}
function header(){return '<header class="top">'+(page==='home'?'<button class="profile-shortcut" data-action="account" aria-label="Your profile">'+avatar(profile,true)+'</button>':'<div class="brand">sudoku<i>.</i></div>')+'<span class="pill">'+icon('flame')+streak()+'</span></header>';}
function nav(){return '<nav class="nav" aria-label="Main navigation">'+[['home','Play','grid'],['journey','Levels','leaf'],['scores','Scores','trophy'],['collection','Collection','palette'],['account','Profile','user']].map(([p,label,i])=>'<button data-action="nav" data-page="'+p+'" class="'+(page===p?'active':'')+'" '+(page===p?'aria-current="page"':'')+'>'+icon(i)+label+'</button>').join('')+'</nav>';}
function progress(){return progressCard(profile);}
function home(){
 const active=game?.status==='playing';
 return header()+'<main class="enter">'+profileCard(profile,profile.displayName||'Guest',true)+'<section class="hero"><button class="primary" data-action="'+(active?'resume':'new')+'">'+(active?'Continue · '+DIFFICULTIES[game.difficulty].name:'New puzzle')+icon('arrow')+'</button>'+(active?'<button class="secondary" style="width:100%;margin-top:10px" data-action="new">New puzzle</button>':'')+'</section>'+progress()+'<div class="stats"><div class="stat"><strong>'+profile.wins+'</strong><span>Wins</span></div><div class="stat"><strong>'+profile.stars+'</strong><span>Stars</span></div><div class="stat"><strong>'+streak()+'</strong><span>Day streak</span></div></div><h2 class="section-heading">Daily challenge</h2><button class="card daily" data-action="daily"><span class="daily-icon">'+icon('calendar')+'</span><span class="daily-title">'+new Date().toLocaleDateString('en',{month:'short',day:'numeric'})+'</span><span class="reward">'+(profile.dailyWins.includes(dateKey())?'Completed '+icon('check'):'+150 XP '+icon('arrow'))+'</span></button>'+(!owner?'<button class="secondary sign-in-cta" data-action="login">Sign in</button>':'')+'</main>'+nav();
}
function journey(){return header()+'<main class="enter">'+journeyContent(profile)+'</main>'+nav();}
function collection(){return header()+'<main class="enter">'+collectionContent(profile,category)+'</main>'+nav();}
function scores(){return header()+'<main class="enter">'+(owner?scoreboardContent(scoreState):'<h1 class="page-title">Scoreboard</h1><div class="card empty-state"><span class="empty-symbol">♜</span><button class="primary" data-action="login">Sign in to compete →</button></div>')+'</main>'+nav();}
function account(){
 return header()+'<main class="enter"><h1 class="page-title">Profile</h1>'+profileCard(profile,profile.displayName||'Guest')+progress()+
 (owner?'<form id="profile-form" class="account-form"><label>Display name<input name="displayName" minlength="3" maxlength="20" pattern="[A-Za-z0-9_ ]{3,20}" value="'+escapeHTML(profile.displayName||'Player')+'" required autocomplete="nickname"></label><button class="secondary" type="submit">Save name</button><div class="form-status" role="status"></div></form><button class="secondary full-button" data-action="password">Change password</button><button class="secondary full-button" data-action="logout">Sign out</button>':'<div class="account-actions"><button class="primary" data-action="login">Sign in →</button><button class="secondary" data-action="signup">Create account</button></div>')+
 '<h2 class="section-heading">Personal bests</h2><div class="card">'+DIFFICULTIES.map((d,i)=>'<div class="row" style="padding:9px 0;font-size:13px"><span>'+d.name+'</span><span>'+(profile.best[i]===null?'—':time(profile.best[i]))+'</span></div>').join('')+'</div></main>'+nav();
}
function gameScreen(){
 return '<header class="top game-top">'+btn('home','Save and exit','back')+'<div class="brand">sudoku<i>.</i></div>'+btn('pause','Pause game','pause')+'</header><main class="enter"><div class="game-meta"><h1 class="game-label">'+DIFFICULTIES[game.difficulty].name+'</h1><span class="timer" id="timer">'+time(game.seconds)+'</span><div class="hearts" role="img" aria-label="'+(3-game.mistakes)+' lives remaining">'+[0,1,2].map(i=>'<span class="'+(i>=3-game.mistakes?'empty':'')+'">'+icon('heart').replace('<svg ','<svg class="'+(i>=3-game.mistakes?'empty':'')+'" ')+'</span>').join('')+'</div></div><div class="board" role="group" aria-label="Sudoku board"></div><div class="board-footer"><span id="filled"></span><span class="dots" aria-label="Difficulty '+(game.difficulty+1)+' of 7">'+Array.from({length:7},(_,i)=>'<i class="'+(i<=game.difficulty?'on':'')+'"></i>').join('')+'</span></div><div class="tools">'+btn('undo','Undo','undo','tool')+btn('erase','Erase','erase','tool')+'<button class="tool '+(pencil?'active':'')+'" data-action="pen" aria-pressed="'+pencil+'">'+icon('pen')+'<span>Pen '+(pencil?'on':'off')+'</span></button></div><div class="keypad" aria-label="Number pad">'+Array.from({length:9},(_,i)=>'<button class="key" data-action="number" data-number="'+(i+1)+'" aria-label="Enter '+(i+1)+'">'+(i+1)+'<small></small></button>').join('')+'</div><div class="game-bottom">'+(game.runId?'RANKED · +'+DIFFICULTIES[game.difficulty].xp+' XP':game.daily?'DAILY CHALLENGE':'PRACTICE · +'+DIFFICULTIES[game.difficulty].xp+' XP')+'</div></main>';
}
function render(){
 $('#app').className=page==='game'?'game-view':'';
 $('#app').innerHTML=page==='home'?home():page==='journey'?journey():page==='collection'?collection():page==='scores'?scores():page==='account'?account():gameScreen();
 if(page==='game'){
  document.querySelector('[data-action="undo"]').insertAdjacentHTML('beforeend','<span>Undo</span>');
  document.querySelector('[data-action="erase"]').insertAdjacentHTML('beforeend','<span>Erase</span>');
  renderBoard();
 }
}
function renderBoard(){
 if(page!=='game')return;
 const val=game.board[selected], board=$('.board');
 board.innerHTML=game.board.map((n,i)=>{
  const cls=['cell',game.puzzle[i]?'given':'',selected===i?'selected':'',selected>=0&&peers(i,selected)?'peer':'',val&&n===val?'match':'',errorCell===i?'error':''].join(' ');
  return '<button class="'+cls+'" data-action="cell" data-cell="'+i+'" aria-label="Row '+(Math.floor(i/9)+1)+', column '+(i%9+1)+', '+(n?n+(game.puzzle[i]?', given':''):'empty'+(game.notes[i].length?', notes '+game.notes[i].join(', '):''))+'" aria-pressed="'+(selected===i)+'">'+(n||'<span class="notes">'+Array.from({length:9},(_,j)=>'<span>'+(game.notes[i].includes(j+1)?j+1:'')+'</span>').join('')+'</span>')+'</button>';
 }).join('');
 $('#filled').textContent=game.board.filter(Boolean).length+' / 81 filled';
 document.querySelectorAll('.key').forEach(b=>{const n=Number(b.dataset.number),left=9-game.board.filter(x=>x===n).length;b.disabled=!left;b.querySelector('small').textContent=left;});
 document.querySelector('[data-action="undo"]').disabled=!game.history.length;
 document.querySelector('[data-action="erase"]').disabled=selected<0||!!game.puzzle[selected]||(!game.board[selected]&&!game.notes[selected].length);
}
function modal(content){const m=$('#modal');m.innerHTML=content;if(!m.open)m.showModal();}
function closeModal(){if(!loading)$('#modal').close();}
function pickDifficulty(){
 modal('<div class="modal-header"><h2>Find your flow.</h2>'+btn('close','Close','close')+'</div><div class="difficulty-list">'+DIFFICULTIES.map((d,i)=>'<button class="difficulty" data-action="start" data-level="'+i+'"><span>'+String(i+1).padStart(2,'0')+' &nbsp; '+d.name+'</span><small>+'+d.xp+' XP</small></button>').join('')+'</div>');
}
function confirmNew(fn){
 if(game?.status==='playing'){
  paused=true;
  modal('<h2>Start fresh?</h2><div class="confirm-copy">Replace your saved puzzle?</div><div class="modal-actions"><button class="primary" id="confirm-new">New puzzle '+icon('arrow')+'</button><button class="secondary" data-action="close">Keep playing</button></div>');
  $('#confirm-new').onclick=()=>fn();
 }else fn();
}
let worker=null,requestId=0;
async function start(difficulty,daily=null,practice=false){
 paused=true;loading=true;
 modal('<div class="loading"><div class="spinner"></div><h2>Finding your puzzle…</h2></div>');
 try{
  let ticket=null;
  if(owner&&!practice){
   try{ticket=await Auth.cloud('start',{difficulty,daily:!!daily});}
   catch(error){loading=false;modal('<h2>Connection unavailable</h2><div class="form-status">'+escapeHTML(Auth.friendlyError(error))+'</div><div class="modal-actions"><button class="primary" id="offline-play">Play offline →</button><button class="secondary" data-action="close">Close</button></div>');$('#offline-play').onclick=()=>start(difficulty,daily,true);return;}
  }
  if(ticket?.daily)daily=ticket.daily;
  const seed=ticket?.seed??(daily?dateSeed(daily):crypto.getRandomValues(new Uint32Array(1))[0]);
  const data=await new Promise((resolve,reject)=>{
   worker?.terminate();worker=new Worker('worker.js',{type:'module'});const id=++requestId;
   const timeout=setTimeout(()=>{worker.terminate();reject(new Error('timeout'));},30000);
   worker.onmessage=e=>{if(e.data.id!==id)return;clearTimeout(timeout);e.data.error?reject(new Error(e.data.error)):resolve(e.data.result);};
   worker.onerror=e=>{clearTimeout(timeout);reject(new Error(e.message));};
   worker.postMessage({id,difficulty,seed});
  }).catch(() => generate(difficulty,seed));
  game=newGame(data,daily);game.runId=ticket?.id||null;game.events=[];game.owner=owner;selected=game.puzzle.findIndex(n=>!n);pencil=false;paused=false;page='game';persist();loading=false;closeModal();render();
 }catch(e){loading=false;modal('<h2>Try again.</h2><button class="primary" data-action="close">Close</button>');}
}
function result(){
 paused=true;const won=game.status==='won';
 if(won){const before=profile.xp;award(game,profile);game.unlocks=game.unlocks||rewardsBetween(before,profile.xp).map(i=>i.id);persist();queueScore();submitScore();syncProfile();}
 modal('<div class="result"><div class="result-icon">'+(won?'✦':'○')+'</div><h2>'+(won?'Beautifully done.':'A fresh start.')+'</h2>'+(won?'<div class="result-stars" aria-label="'+game.reward.stars+' stars">'+ '★'.repeat(game.reward.stars)+'☆'.repeat(3-game.reward.stars)+'</div><div class="result-xp">+'+game.reward.xp+' XP</div><div class="result-stats"><span>'+time(game.seconds)+'</span><span>'+'Level '+levelOf(profile.xp)+'</span><span>'+streak()+' day streak</span></div>':'<div class="result-stats"><span>3 / 3 mistakes</span><span>'+time(game.seconds)+'</span></div>')+(won&&game.unlocks?.length?'<div class="unlock-reveal">'+game.unlocks.map(id=>'<span>'+preview(itemById(id))+'<b>'+escapeHTML(itemById(id).name)+'</b></span>').join('')+'</div>':'')+'<div class="modal-actions"><button class="primary accent" data-action="next">Next puzzle '+icon('arrow')+'</button><button class="secondary" data-action="home">Home</button></div></div>');
}
function input(value){
 if(paused||$('#modal').open||game?.status!=='playing')return;
 if(selected<0){toast('Select a cell');return;}
 record(pencil?'note':'enter',selected,value);
 const outcome=enter(game,selected,value,pencil);
 if(outcome==='mistake'){
  errorCell=selected;render();navigator.vibrate?.(45);toast(game.status==='lost'?'Run complete':(3-game.mistakes)+' lives left');
  setTimeout(()=>{errorCell=-1;renderBoard();},400);
 }else renderBoard();
 persist();if(game.status!=='playing')result();
}
function pauseGame(){
 if(page==='game'&&game?.status==='playing'&&!loading){
  paused=true;persist();modal('<div class="result"><div class="result-icon">'+icon('pause')+'</div><h2>Take a breath.</h2><div class="result-xp">'+time(game.seconds)+'</div><div class="modal-actions"><button class="primary" data-action="unpause">Resume '+icon('play')+'</button><button class="secondary" data-action="home">Save & exit</button></div></div>');
 }
}
function goHome(){if(loading)return;paused=true;closeModal();page='home';persist();syncProfile();render();}
window.pauseGame=pauseGame;window.goHome=goHome;
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b||b.disabled)return;
 const a=b.dataset.action;
 if(a==='nav'){page=b.dataset.page;render();if(page==='scores')loadScores();}
 if(a==='new')confirmNew(pickDifficulty);
 if(a==='start')start(Number(b.dataset.level));
 if(a==='daily'){
  if(profile.dailyWins.includes(dateKey()))return toast('Today’s challenge complete');
  if(game?.daily===dateKey()&&game.status==='playing'){page='game';paused=false;render();return;}
  confirmNew(()=>start(2,dateKey()));
 }
 if(a==='resume'){page='game';paused=false;render();}
 if(a==='home')goHome();
 if(a==='close'){closeModal();if(page==='game'&&game?.status==='playing')paused=false;}
 if(a==='pause')pauseGame();
 if(a==='unpause'){closeModal();paused=false;}
 if(a==='cell'&&!paused){selected=Number(b.dataset.cell);renderBoard();}
 if(a==='number')input(Number(b.dataset.number));
 if(a==='pen'&&!paused){pencil=!pencil;b.classList.toggle('active',pencil);b.setAttribute('aria-pressed',pencil);b.querySelector('span').textContent='Pen '+(pencil?'on':'off');}
 if(a==='erase'&&!paused){record('erase',selected);erase(game,selected);persist();renderBoard();}
 if(a==='undo'&&!paused){record('undo');undo(game);persist();renderBoard();}
 if(a==='next')pickDifficulty();
 if(a==='account'){page='account';render();}
 if(a==='login'||a==='signup'||a==='recover'||a==='password')authModal(a);
 if(a==='logout')Auth.signOut();
 if(a==='category'){category=b.dataset.category;render();}
 if(a==='equip'){
  if(!equip(profile,b.dataset.item))return toast('Unlock at level '+itemById(b.dataset.item).level);
  applyTheme();persist();syncProfile();render();
  if(itemById(b.dataset.item).type==='appIcon'){
   if(/; wv[);]/.test(navigator.userAgent))window.location.href='sudoku-action://icon/'+profile.equipped.appIcon.replace('icon-','');
   else toast('Icon changes on Android');
  }
 }
 if(a==='period'){scoreState.period=b.dataset.period;loadScores();}
 if(a==='refresh-scores')loadScores();
 if(a==='theme'){
  const t=themes.find(t=>t.id===b.dataset.theme);
  if(rankOf(profile.xp)<t.rank)return toast('Unlock at '+RANKS[t.rank]);
  profile.theme=t.id;applyTheme();persist();render();
 }
});
document.addEventListener('keydown',e=>{
 if(page!=='game'||paused||$('#modal').open)return;
 if(/^[1-9]$/.test(e.key)){e.preventDefault();input(Number(e.key));}
 if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();record('erase',selected);erase(game,selected);persist();renderBoard();}
 if(e.key.toLowerCase()==='n')document.querySelector('[data-action="pen"]').click();
 if(e.key.toLowerCase()==='z'){record('undo');undo(game);persist();renderBoard();}
 const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-9,ArrowDown:9}[e.key];
 if(delta){e.preventDefault();selected=(Math.max(0,selected)+delta+81)%81;renderBoard();document.querySelector('[data-cell="'+selected+'"]').focus();}
});
$('#modal').addEventListener('cancel',e=>{e.preventDefault();if(loading)return;if(game?.status==='won'||game?.status==='lost')goHome();else{closeModal();if(page==='game')paused=false;}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame();});
window.addEventListener('pagehide',persist);
setInterval(()=>{if(page==='game'&&!paused&&!document.hidden&&!$('#modal').open&&game?.status==='playing'){game.seconds++;if($('#timer'))$('#timer').textContent=time(game.seconds);persist();}},1000);
render();

function record(type,index=null,value=null){if(game?.runId&&game.events.length<5000)game.events.push([type,index,value]);}

let scoreSubmitting=false;
function readQueue(id=owner){try{return JSON.parse(localStorage.getItem('sudoku.pending.'+id)||'[]');}catch{return [];}}
function queueScore(){
 if(!owner||game?.owner!==owner||!game.runId||game.status!=='won'||game.scoreSubmitted)return;
 const queue=readQueue();if(!queue.some(r=>r.id===game.runId)){queue.push({id:game.runId,events:game.events});localStorage.setItem('sudoku.pending.'+owner,JSON.stringify(queue));}
}
async function submitScore(){
 if(!owner||scoreSubmitting)return;const id=owner;scoreSubmitting=true;
 try{
  for(const pending of readQueue(id)){
   if(owner!==id)break;
   try{
    const receipt=await Auth.cloud('finish',pending);
    const latest=readQueue(id).filter(r=>r.id!==pending.id);localStorage.setItem('sudoku.pending.'+id,JSON.stringify(latest));
    if(game?.runId===pending.id){game.scoreSubmitted=true;game.rankedXP=receipt.xp;persist();}
    toast('Score posted · +'+receipt.xp+' ranked XP');
   }catch(error){
    if(/expired after 24 hours|Daily challenge already scored/i.test(error.message)){
     localStorage.setItem('sudoku.pending.'+id,JSON.stringify(readQueue(id).filter(r=>r.id!==pending.id)));toast(error.message);
    }else{toast('Score saved. Sync when online.');break;}
   }
  }
 }finally{scoreSubmitting=false;}
}
let syncing=false,syncAgain=false;
async function syncProfile(){
 if(!owner)return;syncAgain=true;if(syncing)return;syncing=true;
 try{while(syncAgain&&owner){syncAgain=false;const id=owner;const snapshot=JSON.parse(JSON.stringify(profile));try{await Auth.cloud('profile',{state:snapshot});}catch{break;}if(owner!==id)break;}}
 finally{syncing=false;}
}
async function loadScores(){
 if(!owner)return;
 const request=++scoreRequest;scoreState.loading=true;scoreState.error=null;if(page==='scores')render();
 try{const result=await Auth.cloud('scores',{period:scoreState.period,difficulty:scoreState.difficulty});if(request!==scoreRequest)return;scoreState.rows=result.rows;scoreState.me=result.me;}
 catch(error){if(request===scoreRequest)scoreState.error=Auth.friendlyError(error);}
 finally{if(request===scoreRequest){scoreState.loading=false;if(page==='scores')render();}}
}
document.addEventListener('change',e=>{if(e.target.id==='score-difficulty'){scoreState.difficulty=Number(e.target.value);loadScores();}});
function authModal(mode){
 const title={login:'Sign in',signup:'Create account',recover:'Reset password',password:'Change password'}[mode];
 modal('<div class="modal-header"><h2>'+title+'</h2>'+btn('close','Close','close')+'</div><form id="auth-form" data-mode="'+mode+'" class="account-form">'+
 (mode==='signup'?'<label>Display name<input name="username" autocomplete="nickname" minlength="3" maxlength="20" pattern="[A-Za-z0-9_ ]{3,20}" required></label>':'')+
 (mode!=='password'?'<label>Email<input name="email" type="email" autocomplete="email" maxlength="254" required></label>':'')+
 (mode!=='recover'?'<label>Password<input name="password" type="password" autocomplete="'+(mode==='login'?'current-password':'new-password')+'" minlength="8" maxlength="128" required></label>':'')+
 '<div class="form-status" role="status"></div><button class="primary" type="submit">'+title+' →</button></form>'+
 (mode==='login'?'<div class="auth-links"><button data-action="signup">Create account</button><button data-action="recover">Forgot password?</button></div>':''));
}
document.addEventListener('submit',async e=>{
 if(e.target.id!=='auth-form'&&e.target.id!=='profile-form')return;e.preventDefault();
 const form=e.target,button=form.querySelector('[type="submit"]'),status=form.querySelector('.form-status'),data=new FormData(form);
 button.disabled=true;status.textContent='';
 try{
  if(form.id==='profile-form'){
   const displayName=String(data.get('displayName')).trim();
   await Auth.cloud('rename',{displayName});profile.displayName=displayName;persist();render();toast('Profile saved');return;
  }
  const mode=form.dataset.mode,email=String(data.get('email')||'').trim(),password=String(data.get('password')||'');
  if(mode==='login'){await Auth.signIn(email,password);closeModal();toast('Signed in');}
  if(mode==='signup'){const signed=await Auth.signUp(email,password,String(data.get('username')).trim());if(signed){closeModal();toast('Account created');}else{status.textContent='Check your email to confirm your account, then sign in.';form.querySelector('[name="password"]').value='';}}
  if(mode==='recover'){await Auth.recover(email);status.textContent='If this account exists, check your email for the reset link.';}
  if(mode==='password'){await Auth.changePassword(password);closeModal();toast('Password updated');}
 }catch(error){status.textContent=Auth.friendlyError(error);}
 finally{button.disabled=false;}
});
async function loadAccount(){
 const id=owner;if(!id)return;
 try{
  const remote=await Auth.cloud('me');
  if(owner!==id)return;
  if(remote.state){
   const local=profile;profile=migrateProfile({...profile,...remote.state,xp:Math.max(local.xp,remote.state.xp||0),wins:Math.max(local.wins,remote.state.wins||0),stars:Math.max(local.stars,remote.state.stars||0)});
  }
  profile.displayName=remote.display_name;persist();applyTheme();if(page!=='game')render();await syncProfile();submitScore();
 }catch(error){if(page!=='game')toast(Auth.friendlyError(error));}
}
window.addEventListener('sudoku-auth',()=>{
 persist();owner=Auth.user()?.id||null;paused=true;game=null;profile=profileDefault();
 try{let saved=JSON.parse(localStorage.getItem(owner?'sudoku.account.'+owner:'inkoku.v1')||'null');
 if(!saved&&owner){saved=JSON.parse(localStorage.getItem('inkoku.v1')||'null');if(saved)saved={profile:saved.profile,game:null};}
 if(saved){profile={...profile,...saved.profile};game=saved.game;}}catch{}
 profile=migrateProfile(profile);page='account';applyTheme();render();loadAccount();
});
window.addEventListener('sudoku-recovery',()=>authModal('password'));
window.addEventListener('sudoku-auth-error',e=>toast(e.detail));
window.addEventListener('online',()=>{loadAccount();submitScore();});
Auth.initAuth().then(()=>loadAccount());
