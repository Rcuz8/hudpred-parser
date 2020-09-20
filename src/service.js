/** eventsService */
module.exports = {
  callbacks: {},

  createEvent(eventName) {
      if (typeof eventName !== 'string') throw ('(invalid params) Check service params for ' + eventName);
    this.callbacks[eventName] = {};
  },

  /**
   * @param {string} eventName
   * @param {*} data
   */
  triggerEvent(eventName, data = null) {
      if (typeof eventName !== 'string') throw ('(invalid params) Check service params for ' + eventName);
    if (this.callbacks[eventName] != null) {
      Object.keys(this.callbacks[eventName]).forEach(id => {
        this.callbacks[eventName][id](data);
      });
    }
  },
  /**
   * @param {string} eventName
   * @param {string} id callback identifier
   * @param {*} data
   */
  triggerEventWithId(eventName, id, data = null) {
      if (typeof eventName !== 'string' || typeof id !== 'string') throw ('(invalid params) Check service params for ' + eventName);
      if (this.callbacks[eventName] != null) {
        this.callbacks[eventName][id](data);
        // console.log('triggered event with ' + this.getListeners(eventName).length + ' attached listeners');
      } else {
        // console.log('Prior to throwing, callbacks looked like this: ' + JSON.stringify(this.callbacks))
        throw 'Triggering non-existent element!';
      }
  },
  promiseWrappedTrigger(eventName, id, data = null) {
      return new Promise((res, rej) => {
         if (typeof eventName !== 'string' || typeof id !== 'string') {rej('(invalid params) Check service params for ' + eventName); return; }
          if (this.callbacks[eventName] != null) {
            this.callbacks[eventName][id](data);
                    // console.log('triggered event with ' + this.getListeners(eventName).length + ' attached listeners');
            res(null);
          } else {
        console.log('Prior to throwing, callbacks looked like this: ' + JSON.stringify(this.callbacks))
        rej( 'Triggering non-existent element!' );
      }
        
      });
  },

  /**
   * @param {string} eventName name of event
   * @param {string} id callback identifier
   * @param {Function} callback
   */
  listenEventWithId(eventName, id, callback) {
     if (typeof eventName !== 'string' || typeof id !== 'string' || typeof callback !== 'function') throw ('(invalid params) Check service params for ' + eventName);
    if (this.callbacks[eventName] != null) {
      // console.log('creating listener ' + id + ' for event ' + eventName);
      this.callbacks[eventName][id] = callback;
    } else {
      console.log('Cannot create listener for event ' + eventName + ' bc it doesnt exist!');
      throw 'Listener Error: read above note!';
    }
    // console.log(this.callbacks[eventName][id])
  },
  /**
   * NOTE: first available callback is taken
   * @param {string} eventName name of event
   * @param {Function} callback
   */
  listenEvent(eventName, callback) {
      if (typeof eventName !== 'string' || typeof callback !== 'function') throw ('(invalid params) Check service params for ' + eventName);
    if (this.callbacks[eventName] != null) {
        var firstKey = 'key1'; //Object.keys(this.callbacks[eventName])[0];
        this.callbacks[eventName][firstKey] = callback;
    } else console.log('Issue: Cannot listen to event that hasnt been initialized');
  },

  /**
   * @param {string} eventName name of event
   * @param {string} id callback identifier
   */
  unlistenEvent(eventName, id) {
    // console.log('UNLISTEN EVENT CALLED. id=' + id);
    if (this.callbacks[eventName] != null) delete this.callbacks[eventName][id];
  },
  /**
   * @param {string} eventName name of event
   */
  unlistenEvent_All(eventName) {
        // console.log('UNLISTEN EVENT CALLED.');
    if (this.callbacks[eventName] != null) delete this.callbacks[eventName];
  },
  /**
   * @param {string} eventName
   */
  getListeners(eventName) {
    if (typeof eventName !== 'string') throw ('(invalid params) Check service params for ' + eventName);
    if (this.callbacks[eventName] != null) {
      return Object.keys(this.callbacks[eventName]);
    } else return []; 
  },
};
