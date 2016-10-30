/*

http://youmightnotneedjquery.com/

Copyright 2011 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eric Bidelman (ericbidelman@chromium.org)

ALtered: Jorrit Duin (jorrit.duin@gmail.com)

What about custom elements:
*/


define([], function () {
  'use strict';
  const TAG_NAME = 'shell';
  const VERSION_ = '1.0.0';
  var cmds_ = [];
  var parser = new DOMParser();
  const parseArgs = function (args, opts) {
    if(!opts) opts = {};

    var flags = {
      bools: {},
      strings: {},
      unknownFn: null
    };

    if(typeof opts['unknown'] === 'function') {
      flags.unknownFn = opts['unknown'];
    }

    if(typeof opts['boolean'] === 'boolean' && opts['boolean']) {
      flags.allBools = true;
    } else {
      [].concat(opts['boolean']).filter(Boolean).forEach(function (key) {
        flags.bools[key] = true;
      });
    }

    var aliases = {};
    Object.keys(opts.alias || {}).forEach(function (key) {
      aliases[key] = [].concat(opts.alias[key]);
      aliases[key].forEach(function (x) {
        aliases[x] = [key].concat(aliases[key].filter(function (y) {
          return x !== y;
        }));
      });
    });

    [].concat(opts.string).filter(Boolean).forEach(function (key) {
      flags.strings[key] = true;
      if(aliases[key]) {
        flags.strings[aliases[key]] = true;
      }
    });

    var defaults = opts['default'] || {};

    var argv = {
      _: []
    };
    Object.keys(flags.bools).forEach(function (key) {
      setArg(key, defaults[key] === undefined ? false : defaults[key]);
    });

    var notFlags = [];

    if(args.indexOf('--') !== -1) {
      notFlags = args.slice(args.indexOf('--') + 1);
      args = args.slice(0, args.indexOf('--'));
    }

    function argDefined(key, arg) {
      return(flags.allBools && /^--[^=]+$/.test(arg)) ||
        flags.strings[key] || flags.bools[key] || aliases[key];
    }

    function setArg(key, val, arg) {
      if(arg && flags.unknownFn && !argDefined(key, arg)) {
        if(flags.unknownFn(arg) === false) return;
      }

      var value = val;
      setKey(argv, key.split('.'), value);

      (aliases[key] || []).forEach(function (x) {
        setKey(argv, x.split('.'), value);
      });
    }

    function setKey(obj, keys, value) {
      var o = obj;
      keys.slice(0, -1).forEach(function (key) {
        if(o[key] === undefined) o[key] = {};
        o = o[key];
      });

      var key = keys[keys.length - 1];
      if(o[key] === undefined || flags.bools[key] || typeof o[key] === 'boolean') {
        o[key] = value;
      } else if(Array.isArray(o[key])) {
        o[key].push(value);
      } else {
        o[key] = [o[key], value];
      }
    }

    function aliasIsBoolean(key) {
      return aliases[key].some(function (x) {
        return flags.bools[x];
      });
    }

    for(var i = 0; i < args.length; i++) {
      var arg = args[i];
      var key;
      if(/^--.+=/.test(arg)) {
        // Using [\s\S] instead of . because js doesn't support the
        // 'dotall' regex modifier. See:
        // http://stackoverflow.com/a/1068308/13216
        var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
        key = m[1];
        var value = m[2];
        if(flags.bools[key]) {
          value = value !== 'false';
        }
        setArg(key, value, arg);
      } else if(/^--no-.+/.test(arg)) {
        key = arg.match(/^--no-(.+)/)[1];
        setArg(key, false, arg);
      } else if(/^--.+/.test(arg)) {
        key = arg.match(/^--(.+)/)[1];
        var next = args[i + 1];
        if(next !== undefined && !/^-/.test(next) &&
          !flags.bools[key] &&
          !flags.allBools &&
          (aliases[key] ? !aliasIsBoolean(key) : true)) {
          setArg(key, next, arg);
          i++;
        } else if(/^(true|false)$/.test(next)) {
          setArg(key, next === 'true', arg);
          i++;
        } else {
          setArg(key, flags.strings[key] ? '' : true, arg);
        }
      } else if(/^-[^-]+/.test(arg)) {
        var letters = arg.slice(1, -1).split('');

        var broken = false;
        for(var j = 0; j < letters.length; j++) {
          next = arg.slice(j + 2);

          if(next === '-') {
            setArg(letters[j], next, arg);
            continue;
          }

          if(/[A-Za-z]/.test(letters[j]) && /=/.test(next)) {
            setArg(letters[j], next.split('=')[1], arg);
            broken = true;
            break;
          }

          if(/[A-Za-z]/.test(letters[j]) &&
            /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
            setArg(letters[j], next, arg);
            broken = true;
            break;
          }

          if(letters[j + 1] && letters[j + 1].match(/\W/)) {
            setArg(letters[j], arg.slice(j + 2), arg);
            broken = true;
            break;
          } else {
            setArg(letters[j], flags.strings[letters[j]] ? '' : true, arg);
          }
        }

        key = arg.slice(-1)[0];
        if(!broken && key !== '-') {
          if(args[i + 1] && !/^(-|--)[^-]/.test(args[i + 1]) &&
            !flags.bools[key] &&
            (aliases[key] ? !aliasIsBoolean(key) : true)) {
            setArg(key, args[i + 1], arg);
            i++;
          } else if(args[i + 1] && /true|false/.test(args[i + 1])) {
            setArg(key, args[i + 1] === 'true', arg);
            i++;
          } else {
            setArg(key, flags.strings[key] ? '' : true, arg);
          }
        }
      } else {
        if(!flags.unknownFn || flags.unknownFn(arg) !== false) {
          argv._.push(
            flags.strings['_'] || !isNumber(arg) ? arg : Number(arg)
          );
        }
        if(opts.stopEarly) {
          argv._.push.apply(argv._, args.slice(i + 1));
          break;
        }
      }
    }

    Object.keys(defaults).forEach(function (key) {
      if(!hasKey(argv, key.split('.'))) {
        setKey(argv, key.split('.'), defaults[key]);

        (aliases[key] || []).forEach(function (x) {
          setKey(argv, x.split('.'), defaults[key]);
        });
      }
    });

    if(opts['--']) {
      argv['--'] = new Array();
      notFlags.forEach(function (key) {
        argv['--'].push(key);
      });
    } else {
      notFlags.forEach(function (key) {
        argv._.push(key);
      });
    }

    return argv;
  };

  function hasKey(obj, keys) {
    var o = obj;
    keys.slice(0, -1).forEach(function (key) {
      o = (o[key] || {});
    });

    var key = keys[keys.length - 1];
    return key in o;
  }

  function isNumber(x) {
    if(typeof x === 'number') return true;
    if(/^0x[0-9a-f]+$/i.test(x)) return true;
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
  }

  var el = document.getElementsByTagName(TAG_NAME)[0];
  if(!el) {
    el = parser.parseFromString('<' + TAG_NAME + '/>', 'text/html').body.children[0];
    el.style.width = '100%';
    el.style.height = '100%';
    document.body.appendChild(el);
  }

  // var self = this;
  var history_ = [];
  var histpos_ = 0;
  var histtemp_ = 0;

  // DEFAULT COMMANDS get never overwritten
  // Should be available all of the time
  var default_ctrlr = {
    clear: function (el, cmd, e, args) { // eslint-disable-line
      clear_(this);
      return;
    },
    help: function (el, cmd, e, args) { // eslint-disable-line
      outputhtml('<div class="ls-help">' + cmds_.join('<br>') + '</div>');
    }
  };

  var ctrlr = {};

  // Create a command list for the help
  var createCmdList = function () {
    history_ = [];
    histpos_ = 0;
    histtemp_ = 0;
    cmds_ = [];
    var prop;
    for(prop in ctrlr) {
      if(ctrlr.hasOwnProperty(prop) &&
        jsType(ctrlr[prop]) === 'Function' &&
        // Only chars and numbers
        /^[a-zA-Z0-9-]{1,}$/.test(prop)) {
        cmds_.push(prop);
      }
    }
    // Merge default commands
    for(prop in default_ctrlr) {
      if(default_ctrlr.hasOwnProperty(prop) &&
        jsType(default_ctrlr[prop]) === 'Function' &&
        // Only chars and numbers
        /^[a-z0-9-]{1,}$/.test(prop)) {
        cmds_.push(prop);
      }
    }
  };
  // Obtain a JS object/var type
  var jsType = function (fn) {
    if(typeof fn === 'undefined') return 'undefined';
    return({}).toString.call(fn).match(/\s([a-z|A-Z]+)/)[1];
  };

  var container_ = parser.parseFromString('<div class="shell_container"></div>', 'text/html').body.children[0];
  var interlace_ = parser.parseFromString('<div class="shell_interlace"></div>', 'text/html').body.children[0];
  var cmdLine_ = parser.parseFromString('<div id="shell_cmd_line" class="input-line"></div>', 'text/html').body.children[0];
  var output_ = parser.parseFromString('<stdout></stdout>', 'text/html').body.children[0];
  var prompt_ = parser.parseFromString('<div class="shell_prompt">$></div><input class="cmdline" autofocus spellcheck="false" />', 'text/html').body.children;

  container_.appendChild(output_);
  cmdLine_.appendChild(prompt_[0]);
  cmdLine_.appendChild(prompt_[0]);
  container_.appendChild(cmdLine_);

  el.appendChild(interlace_);
  el.appendChild(container_);

  window.addEventListener('click', function () {
    document.querySelector('input.cmdline:not([readonly])').focus();
  }, false);

  function inputTextClick_() {
    this.value = this.value;
  }

  function historyHandler_(e) { // Tab needs to be keydown.

    if(history_.length) {
      if(e.keyCode == 38 || e.keyCode == 40) {
        if(history_[histpos_]) {
          history_[histpos_] = this.querySelector('input.cmdline').value;
        } else {
          histtemp_ = this.querySelector('input.cmdline').value;
        }
      }
      if(e.keyCode == 38) { // up
        histpos_--;
        if(histpos_ < 0) {
          histpos_ = 0;
        }
      } else if(e.keyCode == 40) { // down
        histpos_++;
        if(histpos_ > history_.length) {
          histpos_ = history_.length;
        }
      }

      if(e.keyCode == 38 || e.keyCode == 40) {
        this.querySelector('input.cmdline').value = history_[histpos_] ? history_[histpos_] : histtemp_;
        this.querySelector('input.cmdline').value = this.querySelector('input.cmdline').value; // Sets cursor to end of input.
      }
    }
  }

  function processNewCommand_(e) {
    var cmd, args;
    // Beep on backspace and no value on command line.
    if(!this.querySelector('input.cmdline').value && e.keyCode == 8) {
      // screen flicker
      return;
    }
    // dev tools
    if(e.ctrlKey && e.shiftKey && e.keyCode == 73) { // crtl+shift+i
      // If we have a window and process
      // then this clould be nw http://nwjs.io/
      if(typeof require !== 'undefined' && typeof process !== 'undefined') {
        require('nw.gui').Window.get().showDevTools();
        e.preventDefault();
        e.stopPropagation();
      }
    }

    if(e.keyCode == 9) { // Tab
      e.preventDefault();
      // TODO(ericbidelman): Implement tab suggest.
    } else if(e.keyCode == 13) { // enter

      // Duplicate current input and append to output section.
      // var line = this.parentNode.parentNode.cloneNode(true);
      var line = this.cloneNode(true);

      line.classList.add('line');
      var input = line.querySelector('input.cmdline');
      input.autofocus = false;
      input.readOnly = true;
      output_.appendChild(line);

      this.querySelector('input.cmdline').value = '';
      var _val = input.value;

      // Save shell history.
      if(_val !== '') {
        history_[history_.length] = _val;
        histpos_ = history_.length;
      }
      // Parse out command, args, and trim off whitespace.
      // TODO(ericbidelman): Support multiple comma separated commands.
      if(_val && _val.trim()) {
        args = _val.split(' ').filter(function (val) {
          return val;
        });
        cmd = args[0];
        args = args.splice(1); // Remove cmd from arg list.
        args = parseArgs(args);
      }

      if(cmd && cmds_.indexOf(cmd) < 0) {
        // Command NOT FOUND
        output(cmd + ': command not found');
      } else if(cmd && cmds_.indexOf(cmd) >= 0) {
        // First try the default command set
        if(default_ctrlr.hasOwnProperty(cmd)) {
          default_ctrlr[cmd].call(el, this, cmd, e, args);
        } else {
          ctrlr[cmd].call(el, this, cmd, e, args);
        }
      }
      this.value = '';
      scrollAdjust();
      return;
    }
  }

  function clear_(input) {
    output_.innerHTML = '';
    input.value = '';
  }

  function prompt(txt) {
    var t = document.getElementsByClassName('shell_prompt');
    t[t.length - 1].innerHTML = txt;
  }


  function scrollAdjust() {
    var h = container_.scrollHeight;
    container_.scrollTop = h;
  }

  function output(text) {
    if(!text) {
      return;
    }
    var pre = document.createElement('pre');
    if(typeof text === 'object') {
      text = JSON.stringify(text);
    }
    pre.appendChild(document.createTextNode(text));
    output_.appendChild(pre);
    scrollAdjust();
  }

  function outputhtml(html) {
    if(!html) {
      return;
    }
    var t = parser.parseFromString(html, 'text/html').body.children[0];
    output_.appendChild(t);
    scrollAdjust();
  }

  // Always force text cursor to end of input line.
  cmdLine_.click(inputTextClick_);

  cmdLine_.addEventListener('keyup', historyHandler_);
  cmdLine_.addEventListener('keydown', processNewCommand_);

  // Set default commands
  createCmdList();
  // Print Welcome message
  el.welcome = function () {
    output('Welcome to ' + document.title +
      '! (v' + VERSION_ + ')');
    output('Documentation: type "help"');
    output(new Date().toLocaleString());
    return this;
  };
  el.clear = function () {
    var cmd = this.getCmdLine();
    clear_(cmd);
    return this;
  },
  el.html = function (str) {
    outputhtml(str);
    return this;
  };
  // Output to terminal
  el.output = output;
  // Get CMD line
  el.getCmdLine = function () {
    return cmdLine_;
  };
  // Get Prompt
  el.prompt = prompt;

  el.setCommandController = function (crtlr) {
    ctrlr = crtlr;
    createCmdList();
    return this;
  };

  el.getCommandController = function () {
    return ctrlr;
  };

  return el;
});
