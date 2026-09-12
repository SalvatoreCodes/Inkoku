import test from 'node:test';
import assert from 'node:assert/strict';
import {createActivityTracker} from '../app/src/main/assets/web/activity.js';
test('Concurrent requests keep loading until every request ends',()=>{
 const states=[],tracker=createActivityTracker(s=>states.push(s));
 const login=tracker.begin('Signing in…'),profile=tracker.begin('Loading profile…');
 login();assert.deepEqual(states.at(-1),{count:1,label:'Loading profile…'});
 profile();assert.deepEqual(states.at(-1),{count:0,label:''});profile();assert.equal(states.length,4);
});
test('Failed requests clear loading in finally',async()=>{
 let state;const tracker=createActivityTracker(s=>state=s);
 await assert.rejects(async()=>{const end=tracker.begin('Saving…');try{throw Error('network');}finally{end();}});
 assert.equal(state.count,0);
});