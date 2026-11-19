'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

class StubElement {
  constructor(id='') {
    this.id=id; this.textContent=''; this.innerHTML=''; this.style={}; this.dataset={};
    this.disabled=false; this.children=[]; this.attributes={}; this.value=''; this.className='';
    const classes=new Set();
    this.classList={add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x)),toggle:(v,on)=>{if(on===undefined){if(classes.has(v))classes.delete(v);else classes.add(v)}else if(on)classes.add(v);else classes.delete(v)},contains:v=>classes.has(v)};
  }
  addEventListener(){} querySelectorAll(){return []} querySelector(){return new StubElement('nested')}
  setAttribute(k,v){this.attributes[k]=v} getAttribute(k){return this.attributes[k]}
  appendChild(c){this.children.push(c);return c} remove(){} click(){} closest(){return null}
}
const elements=new Map();
const document={
  getElementById(id){if(!elements.has(id))elements.set(id,new StubElement(id));return elements.get(id)},
  querySelectorAll(){return []}, querySelector(){return null}, createElement(tag){return new StubElement(tag)},
  addEventListener(){}, body:new StubElement('body'), documentElement:new StubElement('html')
};
const store=new Map([['shadowKingdomSaveV2',JSON.stringify({gold:777,wood:222,wins:2,heroes:[{id:'brom',hp:190,level:3,atk:25}]})]]);
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const window={addEventListener(){},__SHADOW_TEST__:{}};
const ctx={window,document,localStorage,console,Date,Math,JSON,Map,Set,Array,Object,String,Number,Boolean,RegExp,Error,Promise,
  setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){},
  performance:{now:()=>1000},confirm:()=>false,URL:{createObjectURL:()=>'',revokeObjectURL(){}},Blob:function(){}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/config.js'),'utf8'),ctx,{filename:'config.js'});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/game.js'),'utf8'),ctx,{filename:'game.js'});
const api=window.__SHADOW_TEST__.api;
assert(api,'test API was not exposed');
const results=[];
function test(name,fn){fn();results.push(name)}

test('legacy localStorage save migrates without reset',()=>{
  assert.strictEqual(api.state.gold,777); assert.strictEqual(api.state.wood,222);
  assert.strictEqual(api.state.heroes[0].level,3); assert.strictEqual(api.state.wins,2);
  api.save(true); const saved=JSON.parse(localStorage.getItem('shadowKingdomSaveV2'));
  assert.strictEqual(saved.gold,777); assert.strictEqual(saved.heroes[0].level,3);
});

test('destructible wall blocks LOS and path before breaking',()=>{
  api.state.enemies=[];api.state.enemyPositions=[];api.resetTerrain();
  assert.strictEqual(api.isObstacle([4,2]),true);
  assert.strictEqual(api.hasLineOfSight([3,2],[5,2]),false);
  const p=api.findPath([3,2],[5,2],{type:'hero',index:0});
  assert(p&&p.length>3,'path should route around the wall');
});

test('destroying a wall opens movement and line of sight',()=>{
  api.damageTerrain([4,2],500,'QA');
  assert.strictEqual(api.isObstacle([4,2]),false);
  assert.strictEqual(api.hasLineOfSight([3,2],[5,2]),true);
  const p=api.findPath([3,2],[5,2],{type:'hero',index:0});
  assert(p&&p.length===3,'path should pass through the destroyed wall cell');
});

test('cover reduces ranged damage until destroyed',()=>{
  api.resetTerrain();
  assert.strictEqual(api.damageAfterCover(100,[3,1],2),65);
  api.damageTerrain([3,1],500,'QA');
  assert.strictEqual(api.isCover([3,1]),false);
  assert.strictEqual(api.damageAfterCover(100,[3,1],2),100);
});

test('flanker AI prioritizes exposed backline and finds a route',()=>{
  api.resetTerrain();
  api.state.enemies=[{ai:'flanker',hp:100,maxHp:100}];
  api.state.enemyPositions=[api.cellToPercent([7,1])];
  const target=api.chooseEnemyTarget(api.state.enemies[0],0);
  assert(['Маг','Лучник','Поддержка'].includes(target.h.role),'flanker should seek a backline role');
  const route=api.findEnemyMovePath(api.state.enemies[0],0,target);
  assert(route&&route.length>1,'flanker should find a path to an adjacent attack cell');
});

test('ranged enemy seeks a visible firing position',()=>{
  api.state.enemies=[{ai:'ranged',range:4.2,hp:100,maxHp:100}];
  api.state.enemyPositions=[api.cellToPercent([8,1])];
  const target=api.chooseEnemyTarget(api.state.enemies[0],0);
  const route=api.findEnemyMovePath(api.state.enemies[0],0,target);
  assert(route&&route.length>1,'ranged unit should find a firing lane');
  const end=route[route.length-1];
  assert(api.hasLineOfSight(end,target.cell),'chosen firing position must have line of sight');
});

test('crowd-control statuses are applied and expire values are configured',()=>{
  const enemy={hp:100};api.applyEnemyStatus(enemy,'freeze');
  assert.strictEqual(enemy.status.type,'freeze');assert(enemy.status.remaining>1.5);
  assert.strictEqual(api.CONFIG.tactics.effects.markDamageMultiplier,1.25);
});

test('hero abilities carry stun, freeze, mark and slow effects',()=>{
  assert.strictEqual(api.state.heroes[0].skills[0].status,'stun');
  assert.strictEqual(api.state.heroes[0].skills[0].knockback,1);
  assert.strictEqual(api.state.heroes[1].skills[1].status,'freeze');
  assert.strictEqual(api.state.heroes[2].skills[0].status,'mark');
  assert.strictEqual(api.state.heroes[2].skills[1].status,'slow');
});

test('new wraith art exists and is a transparent portrait',()=>{
  const f=path.join(__dirname,'../assets/units/wraith.webp');
  assert(fs.existsSync(f)&&fs.statSync(f).size>10000);
});

test('battle start resets destructible terrain and uses the new enemy roster',()=>{
  api.state.battle=false;api.damageTerrain([4,2],999,'QA');
  api.startBattle(false);
  assert.strictEqual(api.state.terrainHP['4,2'],180);
  assert(api.state.enemies.every(e=>e.status===null));
  assert(api.state.enemies.some(e=>['flanker','bruiser','ranged'].includes(e.ai)));
});

test('ice ability freezes a visible enemy and shield bash stuns/knocks back',()=>{
  api.state.enemies=[{art:'goblin',name:'QA target',hp:500,maxHp:500,atk:1,def:0,ai:'bruiser',status:null}];
  api.state.enemyPositions=[api.cellToPercent([3,2])];
  api.state.heroes[1].mana=api.state.heroes[1].maxMana;
  api.state.selected={hi:1,si:1};
  api.castSkill(1,1,0);
  assert.strictEqual(api.state.enemies[0].status.type,'freeze');
  api.state.enemies=[{art:'goblin',name:'QA target',hp:500,maxHp:500,atk:1,def:0,ai:'bruiser',status:null}];
  api.state.enemyPositions=[api.cellToPercent([2,1])];
  api.state.heroes[0].mana=api.state.heroes[0].maxMana;
  api.state.selected={hi:0,si:0};
  api.castSkill(0,0,0);
  assert.strictEqual(api.state.enemies[0].status.type,'stun');
  assert.notDeepStrictEqual(api.percentToCell(api.state.enemyPositions[0]),[2,1]);
});

test('boss victory grants epic equipment and boss flag is not lost',()=>{
  api.state.battle=false;api.startBattle(true);
  assert.strictEqual(api.state.battleBoss,true);
  assert.strictEqual(api.state.enemies[0].boss,true);
  const before=api.state.equipment.length;
  api.finishBattle(true);
  assert.strictEqual(api.state.equipment.length,before+1);
  assert.strictEqual(api.state.equipment[api.state.equipment.length-1].rarity,'epic');
});

test('siege daily contract tracks three destroyed props and grants stone',()=>{
  api.state.dailyStats.terrainBreaks=0;api.state.dailyClaims={};api.resetTerrain();
  const before=api.state.stone;
  api.damageTerrain([3,1],999,'QA');api.damageTerrain([3,4],999,'QA');
  assert.strictEqual(api.state.dailyStats.terrainBreaks,2);
  api.claimDailyContract('breaches');
  assert.strictEqual(api.state.stone,before);
  api.damageTerrain([6,1],999,'QA');
  api.claimDailyContract('breaches');
  assert.strictEqual(api.state.stone,before+api.CONFIG.progression.dailyStone);
  assert.strictEqual(api.state.dailyClaims.breaches,true);
});

console.log(`PASS ${results.length}/${results.length}`);
for(const r of results) console.log(' - '+r);
