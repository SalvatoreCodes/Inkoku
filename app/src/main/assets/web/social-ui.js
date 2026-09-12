import {CATALOG,ITEMS,CATEGORIES,DEFAULTS,LEVELS,levelOf,levelProgress,itemById,unlocked} from './progression.js';
export const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function avatar(profile,small=false){
 const eq={...DEFAULTS,...profile.equipped},item=itemById(eq.avatar)||itemById(DEFAULTS.avatar);
 return '<span class="avatar '+escapeHTML(eq.frame)+(small?' avatar-small':'')+'" aria-label="'+escapeHTML(item.name)+' avatar"><span>'+item.glyph+'</span></span>';
}
export function profileCard(profile,username='Guest',compact=false){
 const eq={...DEFAULTS,...profile.equipped},title=itemById(eq.title)?.glyph||'';
 return '<section class="profile-card '+escapeHTML(eq.background)+(compact?' compact':'')+'"><div class="profile-content">'+avatar(profile)+'<div><strong>'+escapeHTML(username)+'</strong><div class="profile-tags"><span>Level '+levelOf(profile.xp)+'</span>'+(title?'<span>'+escapeHTML(title)+'</span>':'')+'</div></div></div></section>';
}
export function progressCard(profile){
 const p=levelProgress(profile.xp);
 return '<div class="card"><div class="row progress-header"><span>Level '+p.level+'</span><b>'+profile.xp.toLocaleString()+' / '+(p.next?.toLocaleString()||'MAX')+' XP</b></div><div class="progress-track" role="progressbar" aria-label="Level progress" aria-valuenow="'+Math.round(p.percent)+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+p.percent+'%"></span></div></div>';
}
export function preview(item){
 if(item.type==='avatar')return '<span class="reward-glyph">'+item.glyph+'</span>';
 if(item.type==='background')return '<span class="background-preview '+item.id+'"></span>';
 if(item.type==='frame')return '<span class="avatar '+item.id+'"><span>◉</span></span>';
 if(item.type==='title')return '<span class="title-preview">'+escapeHTML(item.glyph||'—')+'</span>';
 const name=item.id.replace(/^(theme|icon)-/,'');
 return '<span class="icon-preview color-'+name+'"><span>1</span><span>2</span><span>3</span><span>9</span></span>';
}
export function journeyContent(profile){
 const lv=levelOf(profile.xp);
 return '<h1 class="page-title">Your levels</h1>'+progressCard(profile)+'<div class="level-list">'+LEVELS.map(l=>{
  const rewards=ITEMS.filter(r=>r.level===l.level);
  return '<div class="card level-card '+(l.level===lv?'current':'')+(l.level<=lv?' earned':'')+'"><div class="level-number">'+String(l.level).padStart(2,'0')+'</div><div class="level-info"><strong>'+rewards.map(r=>escapeHTML(r.name)).join(' + ')+'</strong><span>'+l.xp.toLocaleString()+' XP · '+(l.level<=lv?'Unlocked':Object.values(CATEGORIES)[Object.keys(CATEGORIES).indexOf(rewards[0].type)])+'</span></div><div class="level-preview">'+preview(rewards[0])+'</div></div>';
 }).join('')+'</div>';
}
export function collectionContent(profile,category){
 return '<h1 class="page-title">Collection</h1>'+profileCard(profile,profile.displayName||'Guest')+'<div class="category-tabs" role="group" aria-label="Cosmetic type">'+Object.entries(CATEGORIES).map(([id,name])=>'<button class="'+(category===id?'active':'')+'" data-action="category" data-category="'+id+'" aria-pressed="'+(category===id)+'">'+name+'</button>').join('')+'</div><div class="cosmetic-grid">'+CATALOG.filter(i=>i.type===category).map(item=>{
  const available=unlocked(item,profile),selected=(profile.equipped?.[item.type]||DEFAULTS[item.type])===item.id;
  return '<button class="cosmetic '+(selected?'chosen':'')+'" data-action="equip" data-item="'+item.id+'" aria-label="'+escapeHTML(item.name)+(available?'':', unlock at level '+item.level)+'" aria-pressed="'+selected+'"><span class="cosmetic-preview">'+preview(item)+'</span><strong>'+escapeHTML(item.name)+'</strong><span class="cosmetic-label">'+(selected?'Equipped':available?'Unlocked':'Level '+item.level)+(item.animated?' · Animated':'')+'</span></button>';
 }).join('')+'</div>';
}
export function scoreboardContent(state){
 return '<h1 class="page-title">Scoreboard</h1><div class="score-controls"><div class="segmented"><button data-action="period" data-period="all" class="'+(state.period==='all'?'active':'')+'">All time</button><button data-action="period" data-period="week" class="'+(state.period==='week'?'active':'')+'">This week</button></div><label class="sr-only" for="score-difficulty">Difficulty</label><select id="score-difficulty"><option value="-1">All difficulties</option>'+['Beginner','Easy','Medium','Hard','Expert','Master','Legend'].map((n,i)=>'<option value="'+i+'" '+(state.difficulty===i?'selected':'')+'>'+n+'</option>').join('')+'</select></div>'+(state.loading?'<div class="loading" role="status"><div class="spinner"></div>Loading scores</div>':state.error?'<div class="card empty-state"><p>'+escapeHTML(state.error)+'</p><button class="secondary" data-action="refresh-scores">Retry</button></div>':!state.rows.length?'<div class="card empty-state"><span class="empty-symbol">♜</span><h2>No scores yet</h2><button class="primary" data-action="new">Play a ranked puzzle →</button></div>':'<div class="score-labels"><span>Player</span><span>Ranked XP</span></div><div class="score-list">'+state.rows.map(row=>'<div class="score-row '+(row.isMe?'is-me':'')+'"><span class="score-rank">'+row.rank+'</span>'+avatar({equipped:row.equipped},true)+'<div class="score-name">'+escapeHTML(row.display_name)+(row.isMe?' <small>You</small>':'')+'<span>'+row.wins+' wins</span></div><strong>'+Number(row.xp).toLocaleString()+'</strong></div>').join('')+'</div>')+(state.me?'<div class="card personal-rank"><span>Your rank</span><strong>#'+state.me.rank+' · '+Number(state.me.xp).toLocaleString()+' XP</strong></div>':'');
}
