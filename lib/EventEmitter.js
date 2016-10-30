/*
 * Cross platform (nodejs, browser) event w */
define(function() {

  /**
   * EventEmitter
   * @class
   * @classdesc Emit events
   */
  class EventEmitter {
    /**
     * constructor
     *
     * @returns {EventEmitter}
     */
    constructor() {
      this._emitter = {
        listeners: {},
        oncelisteners: {},
        counter: 0,
        max: 10
      };
    }
    /**
     * addListener
     *
     * @param {String} type Event type
     * @param {Function} listener Function to execute on event
     * @returns {EventEmitter } self - this
     */
    addListener(type, listener) {
      if (this._emitter.counter > this._emitter.max) {
        throw 'MaxListeners exceeded use: setMaxListeners(n) to raise';
      }
      if (typeof this._emitter.listeners[type] === 'undefined') {
        this._emitter.listeners[type] = [];
      }
      this._emitter.counter++;
      this._emitter.listeners[type].push(listener);
      this.emit('newListener', listener);
      return this;
    }
    /**
     * on
     * addListener
     *
     * @param {String} type Event type
     * @param {Function} listener Function to execute on event
     * @returns {EventEmitter } self - this
     */
    on(type, listener) {
      this.addListener(type, listener);
      return this;
    }
    /**
     * once
     * Only execute this listener once
     *
     * @param {String} type Event type
     * @param {Function} listener Function to execute on event
     * @returns {EventEmitter } self - this
     */
    once(type, listener) {
      if (this._emitter.counter >= this._emitter.max) {
        throw 'MaxListeners exceeded use: setMaxListeners(n) to raise';
      }
      if (typeof this._emitter.oncelisteners[type] === 'undefined') {
        this._emitter.oncelisteners[type] = [];
      }
      this._emitter.counter++;
      this._emitter.oncelisteners[type].push(listener);
      this.emit('newListener', listener);
      return this;
    }
    /**
     * emit
     *
     * @param {String | Object} event Event to throw
     * @returns {EventEmitter} this - self
     */
    emit(event) {

      var i;
      var len;
      var pass_prams = [];
      var listeners;
      if (typeof event === 'string') {
        event = {
          type: event
        };
      }
      if (!event.target) {
        event.target = this;
      }
      if (!event.type) { // Falsy
        throw new Error('Event object missing type property.');
      }
      // Fire NORMAL listeners
      if (this._emitter.listeners[event.type] instanceof Array) {
        i = 0;
        len = arguments.length;
        for (; i < len; i++) {
          if (i > 0) {
            pass_prams.push(arguments[i]);
          }
        }
        listeners = this._emitter.listeners[event.type];
        i = 0;
        len = listeners.length;
        for (; i < len; i++) {
          listeners[i].apply(event.target, pass_prams);
        }
      }
      // Fire ONCE listeners and clear them
      if (this._emitter.oncelisteners[event.type] instanceof Array) {
        pass_prams = [];
        i = 0;
        len = arguments.length;
        for (; i < len; i++) {
          if (i > 0) {
            pass_prams.push(arguments[i]);
          }
        }
        listeners = this._emitter.oncelisteners[event.type];
        i = 0;
        len = listeners.length;
        for (; i < len; i++) {
          listeners[i].apply(event.target, pass_prams);
        }
        // Clear the once listeners
        this._removeAllOnceListeners(event.type);
      }
      return this;
    }
    /**
     * listeners
     *
     * @param {String} type Event type
     * @returns {Array} Array with methods
     */
    listeners(type) {
      if (this._emitter.listeners[type] instanceof Array) {
        return this._emitter.listeners[type];
      }
      return [];
    }
    /**
     * removeListener
     *
     * @param {String} type Event type
     * @param {Function} listener
     * @returns {EventEmitter} this - self
     */
    removeListener(type, listener) {
      // Remove from normal listeners
      var i, len, listeners;
      if (this._emitter.listeners[type] instanceof Array) {
        listeners = this._emitter.listeners[type];
        i = 0;
        len = listeners.length;
        for (; i < len; i++) {
          if (listeners[i] === listener) {
            this._emitter.counter--;
            listeners.splice(i, 1);
            break;
          }
        }
      }
      // Remove from ONCE listeners
      if (this._emitter.oncelisteners[type] instanceof Array) {
        listeners = this._emitter.oncelisteners[type];
        i = 0;
        len = listeners.length;
        for (; i < len; i++) {
          if (listeners[i] === listener) {
            this._emitter.counter--;
            listeners.splice(i, 1);
            break;
          }
        }
      }
      return this;
    }
    /**
     * removeAllListeners
     *
     * @param {String || undefined} type
     * @returns [EventEmitter} self - this
     */
    removeAllListeners(type) {
      if (typeof type === 'string') {
        if (this._emitter.listeners[type] instanceof Array) {
          this._emitter.counter -= this._emitter.listeners[type].length;
          this._emitter.listeners[type] = undefined;
        }
        if (this._emitter.oncelisteners[type] instanceof Array) {
          this._emitter.counter -= this._emitter.oncelisteners[type].length;
          this._emitter.oncelisteners[type] = undefined;
        }
      } else {
        this._emitter.counter = 0;
        this._emitter.listeners = {};
        this._emitter.oncelisteners = {};
      }
      return this;
    }
    /**
     * setMaxListeners
     *
     * @param {Integer} n number of max listeners
     * @returns {EventEmitter} this - self
     */
    setMaxListeners(n) {
      this._emitter.max = n;
      return this;
    }
    /**
     * reset
     *
     * @returns {EventEmitter} empty emitter
     */
    reset(){
      return this.removeAllListeners();
    }
    _removeAllOnceListeners (type) {
      if (typeof type === 'string') {
        if (this._emitter.oncelisteners[type] instanceof Array) {
          this._emitter.counter -= this._emitter.oncelisteners[type].length;
          this._emitter.oncelisteners[type] = undefined;
        }
      }
      return this;
    }
  }
  return EventEmitter;
});
