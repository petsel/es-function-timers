/**
 *  refactored version as part of an answer at Stackoverflow
 *
 *  - [https://stackoverflow.com/questions/69204241/javascript-counter-with-timed-intervals/69204495#69204495]
 */
(function (global, Reflect, Math, Number, Array, Function) {

  'use strict';

  /**
   * @typedef {Object} clockedControllerClockData
   *  @param {number} interval  - interval-value in milliseconds.
   *  @param {number} startTime - time of first invocation in milliseconds.
   *  @param {number} timestamp - time of current invocation in milliseconds.
   *  @param {number} count     - current invocation-count since first invocation; `count` value of 1st invocation is `1`.
   */

  /**
   * A data object which holds all the necessary references
   * in order to properly run any controller logic.
   *
   * @typedef {Object} clockedControllerData
   *  @param {clockedControllerClockData} clock
   *  @param {(Object|null)} target
   *  @param {Array} args
   *  @param {Function} proceed
   *  @param {Function} terminate
   */

  /**
   * A callback function which acts like a pre-processor which e.g. can decide
   * whether to proceed with or terminate the original functions `clocked` version.
   *
   * @callback clockedController
   *  @param {clockedControllerData} data
   *   A data object which holds all the necessary references
   *   in order to properly run any controller logic.
   */

  const DEFAULT_INTERVAL = 200;

  const { isFinite, parseInt } = Number;
  const { setInterval, clearInterval } = global;

  function isFunction(value) {
    return (
      typeof value === 'function' &&
      typeof value.call === 'function' &&
      typeof value.apply === 'function'
    );
  }

  function getSanitizedTarget(value) {
    return value ?? null;
  }

  function getSanitizedInteger(value) {
    value = parseInt(value, 10);
    return isFinite(value) ? value : 0;
  }
  function getSanitizedPositiveInteger(value) {
    return Math.max(getSanitizedInteger(value), 0);
  }

  /**
   *  Returns a function, that, invoked initially once, will continuously auto-invoke
   *  the original function every amount of milliseconds, as it was parametrized by
   *  this methods `interval` argument. It does so until the additional `terminate`
   *  method of the returned wrapper function gets called.
   *  This methods second parameter - `target` - provides the object/context a `clocked`
   *  method can act upon.
   *  This methods third parameter - `controller` - enables the even more precise
   *  customized handling of how to run a `clocked` function/method.
   *
   * @param {number=} interval  - The optional interval value; expected to be grater than zero and assuming milliseconds.
   * @param {*=} target         - The function's/method's optional target object.
   * @param {clockedController=} controller
   *  The optional callback function which acts like a pre-processor where additionally
   *  provided program logic might e.g. decide whether to proceed with or terminate
   *  the original functions `clocked` version.
   * @returns {Function}
   *  The original function's/method's `clocked` version.
   */
  function createClockedFunction(interval/*, delay*/, target, controller) {
    const proceed = this;

    let thisArg;
    let argsArr;

    let clockCount = null;
    let clockStart = null;

    let timerId = null;

    target = getSanitizedTarget(target);
    interval = getSanitizedPositiveInteger(interval) || DEFAULT_INTERVAL;

    function triggerController() {
      controller({
        clock: {
          interval,
          startTime: clockStart,
          timestamp: Date.now(),
          count: ++clockCount,
        },
        target: thisArg,
        args: [...argsArr],
        proceed,
        terminate,
      });
    }
    function triggerProceed() {
      proceed.apply(thisArg, argsArr);
    }

    function terminate() {
      clearInterval(timerId);
      timerId = null;

      clockStart = null;
      clockCount = null;
    }

    function isActive() {
      return (timerId !== null);
    }

    function clocked(...argumentsArray) {
      // a `clocked` method's target can be delegated at call time, thus
      // it overrules the target which was provided at composition time.
      thisArg = getSanitizedTarget(this) ?? target;
      argsArr = argumentsArray;

      if (isActive()) {
        terminate();
      }
      clockCount = 0;
      clockStart = Date.now();

      const trigger = isFunction(controller)
        ? triggerController
        : triggerProceed;

      timerId = setInterval(trigger, interval);
    }
    clocked.terminate = terminate;
    clocked.isActive = isActive;

    return (isFunction(proceed) && clocked) || proceed;
  }
  createClockedFunction.toString = () => 'clocked() { [native code] }';

  Reflect.defineProperty(Function.prototype, 'clocked', {
    configurable: true,
    writable: true,
    value: createClockedFunction,
  });

}((window || global || this), Reflect, Math, Number, Array, Function));




function argsAndContextTest01() {
  function test(...argsArr) {
    console.log('argsArr, this : ', argsArr, this);
  }
  function logActiveState() {
    console.log('argsAndContextTest01 :: clockedTest.isActive() ? ', clockedTest.isActive())
  }
  const clockedTest = test.clocked(2000, { id: "test" });

  clockedTest("quick", "brown", "fox");

  setTimeout(() => clockedTest.terminate(), 5000);

  setTimeout(logActiveState, 500);
  setTimeout(logActiveState, 3000);
  setTimeout(logActiveState, 4500);
  setTimeout(logActiveState, 6000);
}

function argsAndContextTest02() {
  function contextualWelcome(name) {
    console.log(`${ this.greeting }, ${ name }.`);
  }
  function logActiveState() {
    console.log('argsAndContextTest02 :: clockedWelcome.isActive() ? ', clockedWelcome.isActive())
  }
  const clockedWelcome = contextualWelcome.clocked(1000);

  clockedWelcome.call({ greeting: 'Good morning' }, 'Mrs Smith');

  setTimeout(() => clockedWelcome.terminate(), 3500);

  setTimeout(logActiveState, 750);
  setTimeout(logActiveState, 1500);
  setTimeout(logActiveState, 2250);
  setTimeout(logActiveState, 3000);
  setTimeout(logActiveState, 3750);
}

function controllerTest() {
  function contextualWelcome(name) {
    console.log(`${ this.greeting }, ${ name }.`);
  }
  function logActiveState() {
    console.log('argsAndContextTest02 :: clockedWelcome.isActive() ? ', clockedWelcome.isActive())
  }

  function controller(data) {
    const { clock: { interval, startTime, timestamp, count }, target, args, proceed, terminate } = data;

    const passedTime = timestamp - startTime;
    const passedSeconds = passedTime / 1000;

    if (count > 5) {

      terminate();
    } else {
      console.log({
        interval,
        startTime,
        timestamp,
        passedSeconds,
        count,
        target,
        args,
        proceed,
      });
      proceed.apply(target, args);
    }
  }
  const clockedWelcome = contextualWelcome.clocked(500, { greeting: 'Good evening' }, controller);

  setTimeout(() => clockedWelcome.terminate(), 3500);
  setTimeout(() => clockedWelcome('Mr Snider'), 200);

  setTimeout(logActiveState, 100);
  setTimeout(logActiveState, 1100);
  setTimeout(logActiveState, 2100);
  setTimeout(logActiveState, 3100);
  setTimeout(logActiveState, 4100);
}

function originalProblemTest() {

  // the OP's former custom callback turned into a clocked controller function.
  function controller(data) {
    const { clock: { count }, terminate } = data;

    if (count > 5) {

      terminate();
    } else {
      console.log({ count });
    }
  }
  (() => {}).clocked(50, null, controller).call();
}
