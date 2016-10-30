/**
 * Creasture definitions
 *
 */
define([], function(){
  'use strict';
  // api to expose to the shell as commands
  const ENVIRONMENT = {
    land : 1,
    air: 2,
    water : 4
  };

  const ARCANE = {
    water :1,
    fire : 2,
    plant : 4
  };

  const PSYCHIC = {
    darkness: 1,
    abnormal: 2,
    light: 4
  };

  const NORMALS = {
    defensive : 1,
    flying : 2,
    ferocious : 4
  };

  var public_api = {
    wytern : {
      environment : ENVIRONMENT.air,
      arcane : ARCANE.water,
      normals : NORMALS.flying,
      psychic : 0,
      hitPoints : 5000,
      damageStat : 125,
      speed : 100,
      specialMoveStat : 75,
      defenceStat : 40
    }
  };
  return public_api;
});
