// Shadow Kingdom balance configuration — adjust values here without touching combat logic.
window.GAME_CONFIG={
  combat:{
    heroAutoBase:1.45, heroAutoRanger:1.1,
    enemyAutoBase:1.8, enemyAutoVariance:0.7,
    manaRegen:2.8, renderInterval:560,
    heroMoveDuration:420, enemyScalePerWin:0.15, terrainDamageMultiplier:0.9, enemyFlankBias:0.55, terrainDamageMultiplier:0.9, enemyFlankBias:0.55
  },
  tactics:{cols:10,rows:6,heroMoveRange:3,enemyMoveRange:1,obstacles:[[4,0],[5,0],[4,2],[5,3],[4,5],[5,5]],cover:[[3,1],[3,4],[6,1],[6,4]],obstacleArt:[{cell:[4,0],asset:'ruined-wall'},{cell:[5,0],asset:'ruined-wall'},{cell:[4,2],asset:'rune-pillar'},{cell:[5,3],asset:'moss-boulder'},{cell:[4,5],asset:'wood-barricade'},{cell:[5,5],asset:'moss-boulder'}],coverArt:[{cell:[3,1],asset:'wood-barricade'},{cell:[3,4],asset:'wood-barricade'},{cell:[6,1],asset:'moss-boulder'},{cell:[6,4],asset:'moss-boulder'}],coverDamageReduction:0.35,lineOfSight:true,destructibles:[{cell:[4,2],hp:180,name:'Рунный обелиск'},{cell:[5,3],hp:145,name:'Замшелый валун'},{cell:[4,5],hp:170,name:'Деревянная баррикада'},{cell:[5,5],hp:145,name:'Замшелый валун'},{cell:[3,1],hp:115,name:'Передовое укрытие'},{cell:[3,4],hp:115,name:'Передовое укрытие'},{cell:[6,1],hp:115,name:'Каменное укрытие'},{cell:[6,4],hp:115,name:'Каменное укрытие'}],effects:{stun:1.45,freeze:1.9,slow:2.4,mark:3.2,markDamageMultiplier:1.25,slowAttackMultiplier:0.48},knockbackDistance:1,boss:{telegraphEvery:7.2,telegraphDuration:1.35,telegraphRadius:1,bossDamageMultiplier:1.55}},
  rewards:{baseGold:100,goldPerWin:35,wood:25,stone:15,crystal:2,xp:65},
  bossUnlockWins:3,
  progression:{dailyGold:90,dailyWood:20,dailyCrystal:1,dailyStone:30,forgeBladeGold:140,forgeBladeOre:2,forgeSealGold:110,forgeSealWood:35,forgeSealOre:1,oreDropChance:0.45,potionDropChance:0.3,gearDropChance:0.38},
  ads:{blockId:'',dailyGold:100,dailyCrystal:1}
};
