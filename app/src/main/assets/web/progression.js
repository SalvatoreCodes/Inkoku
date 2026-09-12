export const LEVELS = Array.from({length:30},(_,i)=>({
 level:i+1, xp:1000*i+175*i*(i-1)
}));
export function levelOf(xp=0){let level=1;for(const entry of LEVELS)if(xp>=entry.xp)level=entry.level;return level;}
export function levelProgress(xp){const level=levelOf(xp),current=LEVELS[level-1],next=LEVELS[level];return {level,current:current.xp,next:next?.xp??null,percent:next?Math.max(0,Math.min(100,(xp-current.xp)/(next.xp-current.xp)*100)):100};}
export const ITEMS=[
 ['avatar-pebble','Pebble','avatar',1,'◉'],
 ['avatar-fox','Fox','avatar',2,'🦊'],
 ['background-linen','Linen','background',3,''],
 ['frame-copper','Copper','frame',4,''],
 ['icon-moss','Moss','appIcon',5,''],
 ['theme-moss','Moss','theme',6,''],
 ['title-solver','Solver','title',7,'Solver'],
 ['avatar-owl','Owl','avatar',8,'🦉'],
 ['background-dunes','Dunes','background',9,''],
 ['background-aurora','Aurora','background',10,''],
 ['frame-geometry','Geometry','frame',11,''],
 ['icon-dusk','Dusk','appIcon',12,''],
 ['avatar-koi','Koi','avatar',13,'🐠'],
 ['theme-dusk','Dusk','theme',14,''],
 ['background-stars','Starfield','background',15,''],
 ['title-tactician','Tactician','title',16,'Tactician'],
 ['avatar-lotus','Lotus','avatar',17,'🪷'],
 ['frame-laurel','Laurel','frame',18,''],
 ['icon-ember','Ember','appIcon',19,''],
 ['background-orbit','Orbit','background',20,''],
 ['theme-midnight','Midnight','theme',21,''],
 ['avatar-dragon','Dragon','avatar',22,'🐉'],
 ['frame-neon','Neon','frame',23,''],
 ['title-grandmaster','Grandmaster','title',24,'Grandmaster'],
 ['icon-midnight','Midnight','appIcon',25,''],
 ['background-nebula','Nebula','background',26,''],
 ['avatar-crown','Crown','avatar',27,'♛'],
 ['frame-prism','Prism','frame',28,''],
 ['theme-ocean','Ocean','theme',29,''],
 ['title-legend','Legend','title',30,'Legend'],
 ['icon-gold','Gold','appIcon',30,'']
].map(([id,name,type,level,glyph])=>({id,name,type,level,glyph,animated:['background-aurora','background-stars','background-orbit','background-nebula','frame-prism'].includes(id)}));
export const DEFAULTS={avatar:'avatar-pebble',background:'background-paper',frame:'frame-none',appIcon:'icon-paper',theme:'theme-paper',title:'title-none'};
export const STARTERS=[
 {id:'background-paper',name:'Paper',type:'background',level:1},
 {id:'frame-none',name:'None',type:'frame',level:1},
 {id:'icon-paper',name:'Paper',type:'appIcon',level:1},
 {id:'theme-paper',name:'Paper',type:'theme',level:1},
 {id:'title-none',name:'None',type:'title',level:1,glyph:''}
];
export const CATALOG=[...STARTERS,...ITEMS];
export const CATEGORIES={avatar:'Avatars',background:'Backgrounds',frame:'Frames',appIcon:'App icons',theme:'Themes',title:'Titles'};
export function itemById(id){return CATALOG.find(item=>item.id===id);}
export function unlocked(item,profile){return !!item&&(levelOf(profile.xp)>=item.level||(profile.legacyUnlocks||[]).includes(item.id));}
export function rewardsBetween(before,after){return ITEMS.filter(item=>item.level>levelOf(before)&&item.level<=levelOf(after));}
export function equip(profile,id){const item=itemById(id);if(!unlocked(item,profile))return false;profile.equipped={...DEFAULTS,...profile.equipped,[item.type]:id};if(item.type==='theme')profile.theme=id.replace('theme-','');return true;}
export function migrateProfile(input={}){
 const profile={...input,equipped:{...DEFAULTS,...input.equipped},legacyUnlocks:[...(input.legacyUnlocks||[])]};
 if(!input.cosmeticVersion){
  const oldThresholds={moss:200,dusk:1400,midnight:5000};
  for(const [theme,xp] of Object.entries(oldThresholds))if(input.xp>=xp)profile.legacyUnlocks.push('theme-'+theme);
  if(input.theme&&unlocked(itemById('theme-'+input.theme),profile))profile.equipped.theme='theme-'+input.theme;
 }
 profile.cosmeticVersion=2;
 for(const [type,id] of Object.entries(profile.equipped))if(!unlocked(itemById(id),profile))profile.equipped[type]=DEFAULTS[type];
 return profile;
}
