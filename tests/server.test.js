import test from 'node:test';
import assert from 'node:assert/strict';
import {generate} from '../app/src/main/assets/web/engine.js';
import {replay,cleanState} from '../supabase/functions/sudoku-api/validation.js';
test('Server replays valid completion and derives mistakes, ignoring client XP',()=>{
 const run={difficulty:1,seed:123},p=generate(run.difficulty,run.seed),empty=p.puzzle.indexOf(0);
 const events=[['enter',empty,p.solution[empty]%9+1]];
 for(let i=0;i<81;i++)if(!p.puzzle[i])events.push(['enter',i,p.solution[i]]);
 assert.deepEqual(replay(run,events),{mistakes:1});
});
test('Server rejects fabricated, incomplete, invalid, and three-mistake histories',()=>{
 const run={difficulty:0,seed:8},p=generate(0,8),i=p.puzzle.indexOf(0),bad=p.solution[i]%9+1;
 assert.throws(()=>replay(run,[]),/not solved/);
 assert.throws(()=>replay(run,[['enter',99,1]]),/Invalid cell/);
 assert.throws(()=>replay(run,[['enter',i,11]]),/Invalid entry/);
 assert.throws(()=>replay(run,Array(3).fill(['enter',i,bad])),/not solved/);
 const complete=p.puzzle.flatMap((v,i)=>v?[]:[['enter',i,p.solution[i]]]);
 assert.throws(()=>replay(run,[...complete,['undo',null,null]]),/completed/);
});
test('Profile payload strips unknown fields and clamps corrupt data',()=>{
 const p=cleanState({xp:-1,ranked_xp:999999,equipped:{avatar:'avatar-dragon'},best:['x']});
 assert.equal(p.xp,0);assert.equal(p.ranked_xp,undefined);assert.equal(p.equipped.avatar,'avatar-pebble');
});
test('Client and server puzzle and reward modules stay identical',async()=>{
 const fs=await import('node:fs/promises');
 for(const name of ['engine.js','progression.js'])assert.equal(await fs.readFile('app/src/main/assets/web/'+name,'utf8'),await fs.readFile('supabase/functions/sudoku-api/'+name,'utf8'));
});
