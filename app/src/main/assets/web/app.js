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
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>'
};
const icon=n=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[n]+'</svg>';
const btn=(action,label,ico,cls='icon-button')=>'<button class="'+cls+'" data-action="'+action+'" aria-label="'+label+'">'+icon(ico)+'</button>';
const themes=[
 {id:'paper',name:'Paper',rank:0,bg:'#f4f1ea',ink:'#262c27',accent:'#c74a28',card:'#fcfaf5',muted:'#74786e',line:'#dcded3',soft:'#f5e1d5',select:'#ead3bd',peer:'#eeece2'},
 {id:'moss',name:'Moss',rank:1,bg:'#e8eddf',ink:'#273c30',accent:'#426344',card:'#f1f5e9',muted:'#63745e',line:'#cbd5c2',soft:'#d3e0c6',select:'#b9d0a9',peer:'#e0e8d7'},
 {id:'dusk',name:'Dusk',rank:3,bg:'#ede7f3',ink:'#392f49',accent:'#795295',card:'#f8f2fc',muted:'#786a85',line:'#d6c9e0',soft:'#e2d4ed',select:'#cfb9df',peer:'#e8dfef'},
 {id:'midnight',name:'Midnight',rank:5,bg:'#202824',ink:'#eceee3',accent:'#ebb68b',card:'#27312c',muted:'#a4b0a5',line:'#465249',soft:'#384238',select:'#53614c',peer:'#303b34'}
];
let profile=profileDefault(), game=null, page='home', selected=-1,pencil=false,paused=false,loading=false,errorCell=-1;
try{
 const saved=JSON.parse(localStorage.getItem('inkoku.v1')||'null');
 if(saved?.profile && Number.isFinite(saved.profile.xp))profile={...profile,...saved.profile};
 if(saved?.game && saved.game.puzzle?.length===81 && saved.game.solution?.length===81 && saved.game.board?.length===81 && saved.game.notes?.length===81)game=saved.game;
}catch{}
function persist(){try{localStorage.setItem('inkoku.v1',JSON.stringify({profile,game}));}catch{toast('Storage unavailable');}}
function applyTheme(){
 const theme=themes.find(t=>t.id===profile.theme&&rankOf(profile.xp)>=t.rank)||themes[0];
 for(const k of ['bg','ink','accent','card','muted','line','soft','select','peer'])document.documentElement.style.setProperty('--'+k,theme[k]);
 document.querySelector('meta[name="theme-color"]').content=theme.bg;
}
applyTheme();
let toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2200);}
const time=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
function streak(){const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);return [dateKey(),dateKey(yesterday)].includes(profile.lastWin)?profile.streak:0;}
function header(){return '<header class="top"><div class="brand">inkoku<i>.</i></div><span class="pill">'+icon('flame')+streak()+'</span></header>';}
function nav(){return '<nav class="nav" aria-label="Main navigation">'+[['home','Play','grid'],['journey','Journey','leaf'],['collection','Collection','palette']].map(([p,label,i])=>'<button data-action="nav" data-page="'+p+'" class="'+(page===p?'active':'')+'" '+(page===p?'aria-current="page"':'')+'>'+icon(i)+label+'</button>').join('')+'</nav>';}
function progress(){
 const rank=rankOf(profile.xp),next=THRESHOLDS[rank+1],pct=next?Math.min(100,(profile.xp-THRESHOLDS[rank])/(next-THRESHOLDS[rank])*100):100;
 return '<div class="card"><div class="row progress-header"><span>'+icon('leaf')+' '+RANKS[rank]+'</span><b>'+profile.xp+' / '+(next||'MAX')+' XP</b></div><div class="progress-track" role="progressbar" aria-label="Rank progress" aria-valuenow="'+Math.round(pct)+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+pct+'%"></span></div></div>';
}
function home(){
 const active=game?.status==='playing';
 return header()+'<main class="enter"><section class="hero"><h1>A little focus.<br><em>A lot of flow.</em></h1><div class="hero-mark" aria-hidden="true">'+Array(9).fill('<span></span>').join('')+'</div><button class="primary" data-action="'+(active?'resume':'new')+'">'+(active?'Continue · '+DIFFICULTIES[game.difficulty].name:'New puzzle')+icon('arrow')+'</button>'+(active?'<button class="secondary" style="width:100%;margin-top:10px" data-action="new">New puzzle</button>':'')+'</section>'+progress()+'<div class="stats"><div class="stat"><strong>'+profile.wins+'</strong><span>Wins</span></div><div class="stat"><strong>'+profile.stars+'</strong><span>Stars</span></div><div class="stat"><strong>'+streak()+'</strong><span>Day streak</span></div></div><h2 class="section-heading">Today’s challenge</h2><button class="card daily" data-action="daily"><span class="daily-icon">'+icon('calendar')+'</span><span class="daily-title">'+new Date().toLocaleDateString('en',{month:'short',day:'numeric'})+'</span><span class="reward">'+(profile.dailyWins.includes(dateKey())?'Completed '+icon('check'):'+150 XP '+icon('arrow'))+'</span></button></main>'+nav();
}
function journey(){
 const rank=rankOf(profile.xp);
 return header()+'<main class="enter"><h1 class="page-title">Small steps.<br>Sharp mind.</h1>'+progress()+'<h2 class="section-heading">Your path</h2><div class="rank-list">'+RANKS.map((r,i)=>'<div class="card rank-card '+(i<=rank?'unlocked ':'')+(i===rank?'current':'')+'"><div class="rank-medal">'+(i<=rank?String(i+1).padStart(2,'0'):icon('lock'))+'</div><div class="rank-info"><div class="rank-name">'+r+'</div><div class="rank-xp">'+THRESHOLDS[i].toLocaleString()+' XP</div></div>'+(i===rank?'<span class="pill">Current</span>':i<rank?icon('check'):'')+'</div>').join('')+'</div></main>'+nav();
}
function collection(){
 const rank=rankOf(profile.xp),badges=[['First win',profile.wins>=1,'star'],['Flawless',profile.perfect>=1,'check'],['7-day fire',streak()>=7,'flame'],['25 wins',profile.wins>=25,'trophy'],['Daily win',profile.dailyWins.length>0,'calendar'],['Legend win',profile.best[6]!==null,'leaf']];
 return header()+'<main class="enter"><h1 class="page-title">Make it yours.</h1><h2 class="section-heading">The palette</h2><div class="theme-grid">'+themes.map(t=>'<button class="theme '+(profile.theme===t.id?'chosen':'')+'" data-action="theme" data-theme="'+t.id+'" aria-label="'+t.name+(rank<t.rank?', unlock at '+RANKS[t.rank]:' theme')+'" aria-pressed="'+(profile.theme===t.id)+'"><div class="swatch" style="background:'+t.bg+';color:'+t.accent+'"><span class="mini-board" aria-hidden="true">'+Array(9).fill('<i></i>').join('')+'</span></div><div class="row"><span class="theme-name">'+t.name+'</span>'+(rank<t.rank?icon('lock'):profile.theme===t.id?icon('check'):'')+'</div><div class="theme-lock">'+(rank<t.rank?RANKS[t.rank]+' · '+THRESHOLDS[t.rank]+' XP':profile.theme===t.id?'Selected':'Unlocked')+'</div></button>').join('')+'</div><h2 class="section-heading">Little victories</h2><div class="badge-grid">'+badges.map(([n,b,i])=>'<div class="badge '+(b?'earned':'')+'" aria-label="'+n+(b?', earned':', locked')+'">'+icon(i)+'<span>'+n+'</span></div>').join('')+'</div><h2 class="section-heading">Personal bests</h2><div class="card">'+DIFFICULTIES.map((d,i)=>'<div class="row" style="padding:9px 0;font-size:13px"><span>'+d.name+'</span><span>'+ (profile.best[i]===null?'—':time(profile.best[i]))+'</span></div>').join('')+'</div></main>'+nav();
}
function gameScreen(){
 return '<header class="top game-top">'+btn('home','Save and exit','back')+'<div class="brand">inkoku<i>.</i></div>'+btn('pause','Pause game','pause')+'</header><main class="enter"><div class="game-meta"><h1 class="game-label">'+DIFFICULTIES[game.difficulty].name+'</h1><span class="timer" id="timer">'+time(game.seconds)+'</span><div class="hearts" role="img" aria-label="'+(3-game.mistakes)+' lives remaining">'+[0,1,2].map(i=>'<span class="'+(i>=3-game.mistakes?'empty':'')+'">'+icon('heart').replace('<svg ','<svg class="'+(i>=3-game.mistakes?'empty':'')+'" ')+'</span>').join('')+'</div></div><div class="board" role="group" aria-label="Sudoku board"></div><div class="board-footer"><span id="filled"></span><span class="dots" aria-label="Difficulty '+(game.difficulty+1)+' of 7">'+Array.from({length:7},(_,i)=>'<i class="'+(i<=game.difficulty?'on':'')+'"></i>').join('')+'</span></div><div class="tools">'+btn('undo','Undo','undo','tool')+btn('erase','Erase','erase','tool')+'<button class="tool '+(pencil?'active':'')+'" data-action="pen" aria-pressed="'+pencil+'">'+icon('pen')+'<span>Pen '+(pencil?'on':'off')+'</span></button></div><div class="keypad" aria-label="Number pad">'+Array.from({length:9},(_,i)=>'<button class="key" data-action="number" data-number="'+(i+1)+'" aria-label="Enter '+(i+1)+'">'+(i+1)+'<small></small></button>').join('')+'</div><div class="game-bottom">'+(game.daily?'DAILY CHALLENGE':'+'+DIFFICULTIES[game.difficulty].xp+' XP')+'</div></main>';
}
function render(){
 $('#app').className=page==='game'?'game-view':'';
 $('#app').innerHTML=page==='home'?home():page==='journey'?journey():page==='collection'?collection():gameScreen();
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
async function start(difficulty,daily=null){
 paused=true;loading=true;
 modal('<div class="loading"><div class="spinner"></div><h2>Finding your puzzle…</h2></div>');
 try{
  const seed=daily?dateSeed(daily):crypto.getRandomValues(new Uint32Array(1))[0];
  const data=await new Promise((resolve,reject)=>{
   worker?.terminate();worker=new Worker('worker.js',{type:'module'});const id=++requestId;
   const timeout=setTimeout(()=>{worker.terminate();reject(new Error('timeout'));},30000);
   worker.onmessage=e=>{if(e.data.id!==id)return;clearTimeout(timeout);e.data.error?reject(new Error(e.data.error)):resolve(e.data.result);};
   worker.onerror=e=>{clearTimeout(timeout);reject(new Error(e.message));};
   worker.postMessage({id,difficulty,seed});
  }).catch(() => generate(difficulty,seed));
  game=newGame(data,daily);selected=game.puzzle.findIndex(n=>!n);pencil=false;paused=false;page='game';persist();loading=false;closeModal();render();
 }catch(e){loading=false;modal('<h2>Try again.</h2><button class="primary" data-action="close">Close</button>');}
}
function result(){
 paused=true;const won=game.status==='won';
 if(won){award(game,profile);persist();}
 modal('<div class="result"><div class="result-icon">'+(won?'✦':'○')+'</div><h2>'+(won?'Beautifully done.':'A fresh start.')+'</h2>'+(won?'<div class="result-stars" aria-label="'+game.reward.stars+' stars">'+ '★'.repeat(game.reward.stars)+'☆'.repeat(3-game.reward.stars)+'</div><div class="result-xp">+'+game.reward.xp+' XP</div><div class="result-stats"><span>'+time(game.seconds)+'</span><span>'+RANKS[rankOf(profile.xp)]+'</span><span>'+streak()+' day streak</span></div>':'<div class="result-stats"><span>3 / 3 mistakes</span><span>'+time(game.seconds)+'</span></div>')+'<div class="modal-actions"><button class="primary accent" data-action="next">Next puzzle '+icon('arrow')+'</button><button class="secondary" data-action="home">Home</button></div></div>');
}
function input(value){
 if(paused||$('#modal').open||game?.status!=='playing')return;
 if(selected<0){toast('Select a cell');return;}
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
function goHome(){if(loading)return;paused=true;closeModal();page='home';persist();render();}
window.pauseGame=pauseGame;window.goHome=goHome;
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b||b.disabled)return;
 const a=b.dataset.action;
 if(a==='nav'){page=b.dataset.page;render();}
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
 if(a==='erase'&&!paused){erase(game,selected);persist();renderBoard();}
 if(a==='undo'&&!paused){undo(game);persist();renderBoard();}
 if(a==='next')pickDifficulty();
 if(a==='theme'){
  const t=themes.find(t=>t.id===b.dataset.theme);
  if(rankOf(profile.xp)<t.rank)return toast('Unlock at '+RANKS[t.rank]);
  profile.theme=t.id;applyTheme();persist();render();
 }
});
document.addEventListener('keydown',e=>{
 if(page!=='game'||paused||$('#modal').open)return;
 if(/^[1-9]$/.test(e.key)){e.preventDefault();input(Number(e.key));}
 if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();erase(game,selected);persist();renderBoard();}
 if(e.key.toLowerCase()==='n')document.querySelector('[data-action="pen"]').click();
 if(e.key.toLowerCase()==='z'){undo(game);persist();renderBoard();}
 const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-9,ArrowDown:9}[e.key];
 if(delta){e.preventDefault();selected=(Math.max(0,selected)+delta+81)%81;renderBoard();document.querySelector('[data-cell="'+selected+'"]').focus();}
});
$('#modal').addEventListener('cancel',e=>{e.preventDefault();if(loading)return;if(game?.status==='won'||game?.status==='lost')goHome();else{closeModal();if(page==='game')paused=false;}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame();});
window.addEventListener('pagehide',persist);
setInterval(()=>{if(page==='game'&&!paused&&!document.hidden&&!$('#modal').open&&game?.status==='playing'){game.seconds++;if($('#timer'))$('#timer').textContent=time(game.seconds);persist();}},1000);
render();
