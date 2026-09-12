import {generate,newGame,enter,erase,undo} from './engine.js';
import {migrateProfile} from './progression.js';
export function replay(run,events){
 if(!Array.isArray(events)||events.length>5000)throw new Error('Invalid move history');
 const game=newGame(generate(run.difficulty,run.seed));
 for(const event of events){
  if(!Array.isArray(event)||event.length!==3)throw new Error('Invalid move');
  const [type,index,value]=event;
  if(game.status!=='playing')throw new Error('Moves after completed game');
  if(type==='undo'){undo(game);continue;}
  if(!Number.isInteger(index)||index<0||index>80)throw new Error('Invalid cell');
  if(type==='erase'){erase(game,index);continue;}
  if(!['enter','note'].includes(type)||!Number.isInteger(value)||value<1||value>9)throw new Error('Invalid entry');
  enter(game,index,value,type==='note');
 }
 if(game.status!=='won')throw new Error('Puzzle not solved');
 return {mistakes:game.mistakes};
}
export function cleanState(raw){
 if(!raw||typeof raw!=='object')throw new Error('Invalid profile');
 const number=(v,max)=>Math.max(0,Math.min(max,Math.floor(Number(v)||0)));
 const p={xp:number(raw.xp,10000000),wins:number(raw.wins,100000),stars:number(raw.stars,300000),streak:number(raw.streak,10000),perfect:number(raw.perfect,100000),
  lastWin:typeof raw.lastWin==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(raw.lastWin)?raw.lastWin:null,
  best:Array.from({length:7},(_,i)=>raw.best?.[i]==null?null:number(raw.best[i],86400)),
  dailyWins:Array.isArray(raw.dailyWins)?[...new Set(raw.dailyWins.filter(x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)))].slice(-366):[],
  equipped:raw.equipped||{},theme:typeof raw.theme==='string'?raw.theme:'paper',
  cosmeticVersion:2,legacyUnlocks:Array.isArray(raw.legacyUnlocks)?raw.legacyUnlocks.filter(x=>['theme-moss','theme-dusk','theme-midnight'].includes(x)):[]};
 return migrateProfile(p);
}
