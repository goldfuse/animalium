/*
 * Basis creature class
 */
define(['lib/creatures','lib/EventEmitter'], function (creatures, Emitter) {
  'use strict';
  class Pipo extends Emitter {
    /**
     * @constructor
     */
    constructor(type) {
      super();
      if(!creatures.hasOwnProperty(type)){
        throw 'Creature not found';
      }

      this.hitPoints = creatures[type].hitPoints;
      this.damageStat = creatures[type].damageStat;
      this.speed = creatures[type].speed;
      this.specialMoveStat = creatures[type].specialMoveStat;
      this.defenceStat = creatures[type].defenceStat;
      this.environment = creatures[type].environment;
      this.arcane= creatures[type].arcane;
      this.normals= creatures[type].normals;
      this.psychic= creatures[type].psychic;

    }



    attack(){

    }

    evade(){

    }

    walk(){

    }

    saveState(){

    }
    getStats(){

    }

  }


  return Pipo;
});
