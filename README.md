# es-function-timers (timed operations / time controlled functions)

Prototypal and non-prototypal implementations of possibly desirable time controlled JavaScript/ECMAScript functions/methods like `throttle` and `debounce` but also `clocked` which enables even more complex interval controlled tasks.

The latter does wrap functions/methods which need to be time and/or condition based and thus repeatedly invoked, into cyclically running (or better _**clocked**_) functions/methods which either can be actively terminated or even be provided with self controlling logic based on internally provided interval data.
