export const DIFFICULTIES = [
 {name:'Beginner',clues:50,xp:60}, {name:'Easy',clues:44,xp:90},
 {name:'Medium',clues:38,xp:130}, {name:'Hard',clues:33,xp:180},
 {name:'Expert',clues:29,xp:250}, {name:'Master',clues:26,xp:340},
 {name:'Legend',clues:24,xp:460}
];
export const RANKS = ['Seed','Sprout','Grove','Bloom','Sage','Master','Legend'];
export const THRESHOLDS = [0,200,600,1400,2800,5000,8000];
export function rng(seed) {
 let a = seed >>> 0;
 return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function shuffle(a,r) { for(let i=a.length-1;i>0;i--){let j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
export function peers(a,b) {
 return a!==b && (Math.floor(a/9)===Math.floor(b/9) || a%9===b%9 || (Math.floor(a/27)===Math.floor(b/27) && Math.floor(a%9/3)===Math.floor(b%9/3)));
}
export function countSolutions(input,limit=2) {
 const board=[...input], rows=new Uint16Array(9), cols=new Uint16Array(9), boxes=new Uint16Array(9);
 for(let i=0;i<81;i++) if(board[i]) {
  const r=Math.floor(i/9), c=i%9, b=Math.floor(r/3)*3+Math.floor(c/3), bit=1<<board[i];
  if ((rows[r]|cols[c]|boxes[b]) & bit) return 0;
  rows[r]|=bit; cols[c]|=bit; boxes[b]|=bit;
 }
 let count=0;
 function visit() {
  let best=-1,mask=0,min=10;
  for(let i=0;i<81;i++) if(!board[i]){
   const r=Math.floor(i/9),c=i%9,b=Math.floor(r/3)*3+Math.floor(c/3);
   const m=1022 & ~(rows[r]|cols[c]|boxes[b]);
   let n=0; for(let x=m;x;x&=x-1)n++;
   if(!n)return;
   if(n<min){ min=n;best=i;mask=m;if(n===1)break; }
  }
  if(best===-1){count++;return;}
  const r=Math.floor(best/9),c=best%9,b=Math.floor(r/3)*3+Math.floor(c/3);
  for(let n=1;n<=9 && count<limit;n++) if(mask & (1<<n)){
   const bit=1<<n; board[best]=n;rows[r]|=bit;cols[c]|=bit;boxes[b]|=bit;
   visit();
   board[best]=0;rows[r]^=bit;cols[c]^=bit;boxes[b]^=bit;
  }
 }
 visit();return count;
}
export function generate(difficulty,seed=Date.now()) {
 const d=DIFFICULTIES[difficulty]; if(!d)throw new Error('Unknown difficulty');
 const rand=rng(seed), seq=()=>shuffle([0,1,2],rand);
 let best=null;
 for(let attempt=0;attempt<40;attempt++){
  const rows=seq().flatMap(b=>seq().map(r=>b*3+r));
  const cols=seq().flatMap(b=>seq().map(c=>b*3+c));
  const digits=shuffle([1,2,3,4,5,6,7,8,9],rand);
  const solution=rows.flatMap(r=>cols.map(c=>digits[(r*3+Math.floor(r/3)+c)%9]));
  const puzzle=[...solution];let clues=81;
  for(const i of shuffle(Array.from({length:81},(_,i)=>i),rand)){
   const old=puzzle[i];puzzle[i]=0;
   if(countSolutions(puzzle)!==1)puzzle[i]=old;else clues--;
   if(clues===d.clues)break;
  }
  if(!best || clues<best.clues)best={puzzle,solution,clues,difficulty,seed};
  if(clues===d.clues)return best;
 }
 return best;
}
export function newGame(data,daily=null) {
 return {...data,board:[...data.puzzle],notes:Array.from({length:81},()=>[]),mistakes:0,seconds:0,status:'playing',history:[],daily,reward:null};
}
export function enter(game,index,value,pencil=false) {
 if(game.status!=='playing'||index<0||index>80||value<1||value>9||game.puzzle[index]||game.board[index])return 'ignored';
 if(pencil) {
  game.history.push({board:[...game.board],notes:game.notes.map(n=>[...n])});
  const notes=game.notes[index];game.notes[index]=notes.includes(value)?notes.filter(n=>n!==value):[...notes,value].sort();
  return 'note';
 }
 if(value!==game.solution[index]){
  game.mistakes++;
  if(game.mistakes>=3)game.status='lost';
  return 'mistake';
 }
 game.history.push({board:[...game.board],notes:game.notes.map(n=>[...n])});
 game.board[index]=value;game.notes[index]=[];
 for(let i=0;i<81;i++)if(peers(i,index))game.notes[i]=game.notes[i].filter(n=>n!==value);
 if(game.board.every((n,i)=>n===game.solution[i]))game.status='won';
 return game.status==='won'?'won':'correct';
}
export function erase(game,index) {
 if(game.status!=='playing'||index<0||game.puzzle[index])return;
 game.history.push({board:[...game.board],notes:game.notes.map(n=>[...n])});
 game.board[index]=0;game.notes[index]=[];
}
export function undo(game) {
 if(game.status!=='playing')return;
 const old=game.history.pop(); if(old){game.board=old.board;game.notes=old.notes;}
}
export function dateKey(date=new Date()) {
 return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
}
export function dateSeed(key) { return [...key].reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0)|0,7)>>>0; }
export function profileDefault() {return {xp:0,wins:0,stars:0,streak:0,lastWin:null,best:Array(7).fill(null),dailyWins:[],theme:'paper',perfect:0};}
export function rankOf(xp) {let rank=0;while(rank<6&&xp>=THRESHOLDS[rank+1])rank++;return rank;}
export function award(game,profile,today=dateKey()) {
 if(game.status!=='won'||game.reward)return null;
 const stars=3-game.mistakes;
 const yesterday=new Date(today+'T12:00:00');yesterday.setDate(yesterday.getDate()-1);
 profile.streak=profile.lastWin===today?profile.streak:profile.lastWin===dateKey(yesterday)?profile.streak+1:1;
 profile.lastWin=today;
 const daily=game.daily&&!profile.dailyWins.includes(game.daily)?150:0;
 if(daily)profile.dailyWins.push(game.daily);
 const bonus=game.mistakes===0?40:0;
 const xp=DIFFICULTIES[game.difficulty].xp+bonus+daily+Math.min(profile.streak,7)*10;
 profile.xp+=xp;profile.wins++;profile.stars+=stars;if(stars===3)profile.perfect++;
 const prev=profile.best[game.difficulty];profile.best[game.difficulty]=prev===null?game.seconds:Math.min(prev,game.seconds);
 game.reward={xp,stars,daily,bonus};return game.reward;
}
