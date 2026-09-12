import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS,ITEMS,levelOf,levelProgress,equip,migrateProfile,rewardsBetween} from '../app/src/main/assets/web/progression.js';
test('Thirty harder levels, increasing XP cost, reward at every level',()=>{
 assert.equal(LEVELS.length,30);assert.equal(levelOf(999),1);assert.equal(levelOf(1000),2);
 for(let i=1;i<LEVELS.length;i++){assert.ok(ITEMS.some(r=>r.level===i+1));assert.equal(levelOf(LEVELS[i].xp),i+1);if(i>1)assert.ok(LEVELS[i].xp-LEVELS[i-1].xp>LEVELS[i-1].xp-LEVELS[i-2].xp);}
 assert.equal(levelProgress(999999).percent,100);
});
test('Locked cosmetics cannot equip; rewards cross multiple level boundaries',()=>{
 const p=migrateProfile({xp:0});assert.equal(equip(p,'avatar-fox'),false);
 p.xp=1000;assert.equal(equip(p,'avatar-fox'),true);assert.equal(p.equipped.avatar,'avatar-fox');
 assert.equal(rewardsBetween(0,LEVELS[3].xp).length,3);
});
test('Migration retains earned XP, equipped theme, and previously unlocked themes',()=>{
 const p=migrateProfile({xp:6000,theme:'midnight'});
 assert.equal(p.xp,6000);assert.equal(p.equipped.theme,'theme-midnight');assert.ok(p.legacyUnlocks.includes('theme-dusk'));
 assert.equal(equip(p,'avatar-dragon'),false);assert.deepEqual(migrateProfile(p),p);
});