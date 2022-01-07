//
//  http://davidwalsh.name/javascript-debounce-function
//
//  https://github.com/jashkenas/underscore/blob/master/underscore.js
//
//  http://blog.nimius.net/2014/04/javascript-debounce-throttle/
//  https://remysharp.com/2010/07/21/throttling-function-calls
//


(function (global, Math, Date, Function) {

  const DEFAULT_THROTTLE_THRESHOLD = 200;
  const DEFAULT_DEBOUNCE_DELAY = 100;

  function isFunction(type) {
    return (
         (typeof type === 'function')
      && (typeof type.call === 'function')
      && (typeof type.apply === 'function')
    );
  }
  const fctPrototype = Function.prototype;

  const isSafeInteger = Number.isSafeInteger;
  const parseInt = global.parseInt;

  const setTimeout = global.setTimeout;
  const clearTimeout = global.clearTimeout;

  const dateNow = Date.now;
  const mathMax = Math.max;

  function getSanitizedTarget(target) {
    return target ?? null;
  }

  function getSanitizedInteger(number) {
    return (isSafeInteger(number = parseInt(number, 10)) &&  number) || 0;
  }
  function getSanitizedPositiveInteger(number) {
    return mathMax(getSanitizedInteger(number), 0);
  }

  /**
   * Returns a function, that, as long as being invoked continuously, will trigger
   * just once after a certain parametrized millisecond amount of `threshold` time.
   * It also triggers immediately for its first time being invoked.
   * If this method's 2nd parameter - `isSuppressTrailingCall` - is truthy, the
   * returned function does not trigger any invocation that takes place within
   * the most recent `threshold` time.
   * This method's 3rd parameter - `target` - provides the object/context a
   * throttled method can act upon.
   *
   * @param threshold {Number}                optional, but grater than zero and assuming milliseconds.
   * @param isSuppressTrailingCall {Boolean}  optional
   * @param target {Object}                   optional
   *
   * @returns {Function}
   */
  function throttle(threshold, isSuppressTrailingCall, target) {
    const proceed = this; // {Function} the to be throttled function type.

    // GUARD
    if (!isFunction(proceed)) {

      return proceed;
    }
    target = getSanitizedTarget(target);
    threshold = getSanitizedPositiveInteger(threshold) || DEFAULT_THROTTLE_THRESHOLD;

    isSuppressTrailingCall = !!isSuppressTrailingCall;

    let timeoutId, timeGap;
    let timestampRecent, timestampCurrent;
    let context;
    // let result;

    function trigger(...argsArray) {
      timestampRecent = timestampCurrent;

      proceed.apply(context, argsArray);
      // return (result = proceed.apply(context, argsArray));
    }

    function throttled(...argsArray) {
      clearTimeout(timeoutId);
      /*
       * a throttled method's target can be delegated at call time
       * but only if it was not provided already at composition time.
       */
      context = target || getSanitizedTarget(this);

      timestampCurrent = dateNow();

      if (timestampRecent) {
        timeGap = (timestampCurrent - timestampRecent);

        if (isSuppressTrailingCall && (timeGap >= threshold)) {
          // trailing call will be suppressed.

          trigger(...argsArray);
        } else {
          /*
           * - passing the arguments directly through `setTimeout` makes e.g.
           *   a throttled event handler capable of handling the preserved
           *   event object of the actual trigger time (something which
           *   e.g. underscore's `throttle` method is not capable of).
           * - see ... [https://stackoverflow.com/questions/69809999/settimeout-not-working-for-keyup-function/69810927#69810927]
           */
          timeoutId = setTimeout(trigger, mathMax((threshold - timeGap), 0), ...argsArray);
        }
      } else {
        // initial call.

        trigger(...argsArray);
      }
      // return result;
    }
    return throttled;
  }
  // throttle.toString = () => 'throttle() { [native code] }';

  Object.defineProperty(fctPrototype, 'throttle', {
    configurable: true,
    writable: true,
    value: throttle
  });

  // provide static implementation as well.

  function staticThrottle(proceed, threshold, isSuppressTrailingCall, target) {
    return throttle.call(proceed, threshold, isSuppressTrailingCall, target);
  }
  // staticThrottle.toString = () => 'throttle() { [native code] }';
  // staticThrottle.toString = () => 'staticThrottle() { [native code] }';

  Object.defineProperty(Function, 'throttle', {
    configurable: true,
    writable: true,
    value: staticThrottle
  });

  /**
   * Returns a function, that does not trigger, as long as being invoked continuously.
   * It does trigger immediately after not having been called for a `delay` of a
   * parametrized amount of milliseconds.
   * If this method's 2nd parameter - `isTriggerImmediately` - is truthy, the
   * returned function triggers at a `delay`'s entry point instead of its end.
   * This method's 3rd parameter - `target` - provides the object/context a
   * debounced method can act upon.
   *
   * @param delay {Number}                  optional, but grater than zero and assuming milliseconds.
   * @param isTriggerImmediately {Boolean}  optional
   * @param target {Object}                 optional
   *
   * @returns {Function}
   */
  function debounce(delay, isTriggerImmediately, target) {
    const proceed = this; // {Function} the to be throttled function type.

    // GUARD
    if (!isFunction(proceed)) {

      return proceed;
    }
    target = getSanitizedTarget(target);
    delay = getSanitizedPositiveInteger(delay) || DEFAULT_DEBOUNCE_DELAY;

    isTriggerImmediately = !!isTriggerImmediately;

    let timeoutResetId, timeoutId;
    let context;
    // let result;

    function resetTimeoutId() {
      timeoutId = null;
    }

    function debounceTrigger(...argsArray) {
      resetTimeoutId();

      proceed.apply(context, argsArray);
      // return (result = proceed.apply(context, argsArray));
    }
    function immediateTrigger(...argsArray) {
      // does prevent double triggering (both leading and trailing).
      timeoutResetId = setTimeout(resetTimeoutId, delay);

      proceed.apply(context, argsArray);
      // return (result = proceed.apply(context, argsArray));
    }
    resetTimeoutId();

    function debounced(...argsArray) {
      /*
       * a debounced method's target can be delegated at call time
       * but only if it was not provided already at composition time.
       */
      context = target || getSanitizedTarget(this);

      /*
       * passing the arguments directly through `setTimeout` makes e.g.
       * a debounced event handler capable of handling the preserved
       * event object of the actual trigger time (something which
       * e.g. underscore's `debounce` method is not capable of).
       */
      if (timeoutId) {
        // does support the clean implementation of double triggering prevention.
        clearTimeout(timeoutResetId);

        clearTimeout(timeoutId);
        timeoutId = setTimeout(debounceTrigger, delay, ...argsArray);

      } else {
        if (isTriggerImmediately) {

          // going to prevent double triggering (both leading and trailing).
          timeoutId = setTimeout(immediateTrigger, 0, ...argsArray);
        } else {
          timeoutId = setTimeout(debounceTrigger, delay, ...argsArray);
        }
      }
      // return result;
    }
    return debounced;
  }
  // debounce.toString = () => 'debounce() { [native code] }';

  Object.defineProperty(fctPrototype, 'debounce', {
    configurable: true,
    writable: true,
    value: debounce
  });

  // provide static implementation as well.

  function staticDebounce(proceed, delay, isTriggerImmediately, target) {
    return debounce.call(proceed, delay, isTriggerImmediately, target);
  }
  // staticDebounce.toString = () => 'debounce() { [native code] }';
  // staticDebounce.toString = () => 'staticDebounce() { [native code] }';

  Object.defineProperty(Function, 'debounce', {
    configurable: true,
    writable: true,
    value: staticDebounce
  });

}((window || global || this), Math, Date, Function));


/*


  [http://closure-compiler.appspot.com/home]


- Simple          -  2375 byte

var $jscomp=$jscomp||{};$jscomp.scope={};$jscomp.arrayIteratorImpl=function(c){var g=0;return function(){return g<c.length?{done:!1,value:c[g++]}:{done:!0}}};$jscomp.arrayIterator=function(c){return{next:$jscomp.arrayIteratorImpl(c)}};$jscomp.makeIterator=function(c){var g="undefined"!=typeof Symbol&&Symbol.iterator&&c[Symbol.iterator];return g?g.call(c):$jscomp.arrayIterator(c)};$jscomp.arrayFromIterator=function(c){for(var g,r=[];!(g=c.next()).done;)r.push(g.value);return r};
$jscomp.arrayFromIterable=function(c){return c instanceof Array?c:$jscomp.arrayFromIterator($jscomp.makeIterator(c))};
(function(c,g,r,v){function y(b){return"function"===typeof b&&"function"===typeof b.call&&"function"===typeof b.apply}function z(b){return D(b=E(b,10))&&b||0}function A(b,f,e){function h(t){for(var d=[],a=0;a<arguments.length;++a)d[a-0]=arguments[a];n=m;p.apply(k,d)}var p=this;if(!y(p))return p;e=null!=e?e:null;b=w(z(b),0)||200;f=!!f;var u,l,n,m,k;return function(t){for(var d=[],a=0;a<arguments.length;++a)d[a-0]=arguments[a];x(u);k=e||(null!=this?this:null);m=F();n?(l=m-n,f&&l>=b?h.apply(null,$jscomp.arrayFromIterable(d)):
u=q.apply(null,[h,w(b-l,0)].concat($jscomp.arrayFromIterable(d)))):h.apply(null,$jscomp.arrayFromIterable(d))}}function B(b,f,e){function h(){k=null}function p(t){for(var d=[],a=0;a<arguments.length;++a)d[a-0]=arguments[a];k=null;l.apply(m,d)}function u(t){for(var d=[],a=0;a<arguments.length;++a)d[a-0]=arguments[a];n=q(h,b);l.apply(m,d)}var l=this;if(!y(l))return l;e=null!=e?e:null;b=w(z(b),0)||100;f=!!f;var n,m;var k=null;return function(t){for(var d=[],a=0;a<arguments.length;++a)d[a-0]=arguments[a];
m=e||(null!=this?this:null);k?(x(n),x(k),k=q.apply(null,[p,b].concat($jscomp.arrayFromIterable(d)))):k=f?q.apply(null,[u,0].concat($jscomp.arrayFromIterable(d))):q.apply(null,[p,b].concat($jscomp.arrayFromIterable(d)))}}var C=v.prototype,D=Number.isSafeInteger,E=c.parseInt,q=c.setTimeout,x=c.clearTimeout,F=r.now,w=g.max;Object.defineProperty(C,"throttle",{configurable:!0,writable:!0,value:A});Object.defineProperty(v,"throttle",{configurable:!0,writable:!0,value:function(b,f,e,h){return A.call(b,f,
e,h)}});Object.defineProperty(C,"debounce",{configurable:!0,writable:!0,value:B});Object.defineProperty(v,"debounce",{configurable:!0,writable:!0,value:function(b,f,e,h){return B.call(b,f,e,h)}})})(window||global||this,Math,Date,Function);

*/



/*
  isTriggerImmediately    / isTriggerEntering
  isTriggerAfterwards     / isTriggerExiting

  isSuppressTrailingCall  / isSuppressLastTrigger / isSuppressTriggerExiting
*/



function logKeyDown(evt) {
  console.log("logKeyDown :: evt : ", evt);
}
let onKeyEvent;



onKeyEvent = logKeyDown.throttle(3000);

window.addEventListener("keydown", onKeyEvent);
// press any key - inspect log
window.removeEventListener("keydown", onKeyEvent);



onKeyEvent = logKeyDown.throttle(2000, true);

window.addEventListener("keydown", onKeyEvent);
// press any key - inspect log
window.removeEventListener("keydown", onKeyEvent);



onKeyEvent = logKeyDown.debounce(1000);

window.addEventListener("keydown", onKeyEvent);
// press any key - inspect log
window.removeEventListener("keydown", onKeyEvent);



onKeyEvent = logKeyDown.debounce(3000, true);

window.addEventListener("keydown", onKeyEvent);
// press any key - inspect log
window.removeEventListener("keydown", onKeyEvent);
