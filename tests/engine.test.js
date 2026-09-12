import test from 'node:test';
import assert from 'node:assert/strict';
import {generate,countSolutions,DIFFICULTIES,newGame,enter,erase,undo,award,profileDefault,rankOf,dateSeed} from '../app/src/main/assets/web/engine.js';
test('Seven tiers produce unique, valid puzzles at target clue counts',()=>{
 for(let level=0;level<7;level++)for(let seed=1;seed<=5;seed++){
  const p=generate(level,seed);
  assert.equal(countSolutions(p.puzzle),1);
  assert.equal(countSolutions(p.solution),1);
  assert.ok(p.clues<=DIFFICULTIES[level].clues+1,level+' clue target');
  assert.ok(p.puzzle.every((v,i)=>!v||v===p.solution[i]));
 }
});
test('Daily generation deterministic',()=>assert.deepEqual(generate(2,dateSeed('2026-09-12')),generate(2,dateSeed('2026-09-12'))));
test('Three mistakes end run; undo cannot restore lives or unlock finished board',()=>{
 const g=newGame(generate(0,2)),i=g.puzzle.indexOf(0),bad=g.solution[i]%9+1;
 enter(g,i,1,true);enter(g,i,bad);undo(g);assert.equal(g.mistakes,1);
 enter(g,i,bad);assert.equal(g.status,'playing');enter(g,i,bad);assert.equal(g.status,'lost');
 const before=JSON.stringify(g);enter(g,i,g.solution[i]);undo(g);erase(g,i);assert.equal(JSON.stringify(g),before);
});
test('Pen toggles candidates without mistakes; erase and undo restore notes',()=>{
 const g=newGame(generate(0,3)),i=g.puzzle.indexOf(0);
 enter(g,i,2,true);enter(g,i,4,true);assert.deepEqual(g.notes[i],[2,4]);assert.equal(g.mistakes,0);
 enter(g,i,2,true);assert.deepEqual(g.notes[i],[4]);erase(g,i);assert.deepEqual(g.notes[i],[]);undo(g);assert.deepEqual(g.notes[i],[4]);
});
test('Givens immutable; win rewards once; daily bonus cannot be farmed',()=>{
 const data=generate(0,7),g=newGame(data,'2026-09-12'),profile=profileDefault(),given=g.puzzle.findIndex(Boolean);
 assert.equal(enter(g,given,9),'ignored');erase(g,given);assert.equal(g.board[given],g.puzzle[given]);
 for(let i=0;i<81;i++)if(!g.puzzle[i])enter(g,i,g.solution[i]);
 assert.equal(g.status,'won');assert.equal(award(g,profile,'2026-09-12').daily,150);
 const xp=profile.xp;assert.equal(award(g,profile,'2026-09-12'),null);assert.equal(profile.xp,xp);
 const second=newGame(data,'2026-09-12');second.status='won';
 assert.equal(award(second,profile,'2026-09-12').daily,0);assert.equal(profile.streak,1);
 const third=newGame(data);third.status='won';award(third,profile,'2026-09-13');assert.equal(profile.streak,2);
 const fourth=newGame(data);fourth.status='won';award(fourth,profile,'2026-09-16');assert.equal(profile.streak,1);
});
test('Ranks respect XP boundaries',()=>{assert.equal(rankOf(199),0);assert.equal(rankOf(200),1);assert.equal(rankOf(8000),6);});
