/**
 * A single place for shell commands
 *
 */
define(['lib/Pipo'], function(Pipo){
  'use strict';
  console.log(Pipo);
  // api to expose to the shell as commands
  var public_api = {
    whoami : function (el, cmd, e, args){ // eslint-disable-line
      this.output('Gebruiker:');
    },

    create : function (el, cmd, e, args){ // eslint-disable-line

      var x = new Pipo('wytern');
      console.log(x);
    }
  };
  return public_api;
});
