/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@orange4glace/vs-lib/base/common/errors/index.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@orange4glace/vs-lib/base/common/errors/index.js ***!
  \***********************************************************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({ value: true }));

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// Avoid circular dependency on EventEmitter by implementing a subset of the interface.
class ErrorHandler {
    constructor() {
        this.listeners = [];
        this.unexpectedErrorHandler = function (e) {
            setTimeout(() => {
                if (e.stack) {
                    throw new Error(e.message + '\n\n' + e.stack);
                }
                throw e;
            }, 0);
        };
    }
    addListener(listener) {
        this.listeners.push(listener);
        return () => {
            this._removeListener(listener);
        };
    }
    emit(e) {
        this.listeners.forEach((listener) => {
            listener(e);
        });
    }
    _removeListener(listener) {
        this.listeners.splice(this.listeners.indexOf(listener), 1);
    }
    setUnexpectedErrorHandler(newUnexpectedErrorHandler) {
        this.unexpectedErrorHandler = newUnexpectedErrorHandler;
    }
    getUnexpectedErrorHandler() {
        return this.unexpectedErrorHandler;
    }
    onUnexpectedError(e) {
        this.unexpectedErrorHandler(e);
        this.emit(e);
    }
    // For external errors, we don't want the listeners to be called
    onUnexpectedExternalError(e) {
        this.unexpectedErrorHandler(e);
    }
}
const errorHandler = new ErrorHandler();
function setUnexpectedErrorHandler(newUnexpectedErrorHandler) {
    errorHandler.setUnexpectedErrorHandler(newUnexpectedErrorHandler);
}
function onUnexpectedError(e) {
    // ignore errors from cancelled promises
    if (!isPromiseCanceledError(e)) {
        errorHandler.onUnexpectedError(e);
    }
    return undefined;
}
function onUnexpectedExternalError(e) {
    // ignore errors from cancelled promises
    if (!isPromiseCanceledError(e)) {
        errorHandler.onUnexpectedExternalError(e);
    }
    return undefined;
}
function transformErrorForSerialization(error) {
    if (error instanceof Error) {
        let { name, message } = error;
        const stack = error.stacktrace || error.stack;
        return {
            $isError: true,
            name,
            message,
            stack
        };
    }
    // return as is
    return error;
}
const canceledName = 'Canceled';
/**
 * Checks if the given error is a promise in canceled state
 */
function isPromiseCanceledError(error) {
    return error instanceof Error && error.name === canceledName && error.message === canceledName;
}
/**
 * Returns an error that signals cancellation.
 */
function canceled() {
    const error = new Error(canceledName);
    error.name = error.message;
    return error;
}
function illegalArgument(name) {
    if (name) {
        return new Error(`Illegal argument: ${name}`);
    }
    else {
        return new Error('Illegal argument');
    }
}
function illegalState(name) {
    if (name) {
        return new Error(`Illegal state: ${name}`);
    }
    else {
        return new Error('Illegal state');
    }
}
function readonly(name) {
    return name
        ? new Error(`readonly property '${name} cannot be changed'`)
        : new Error('readonly property cannot be changed');
}
function disposed(what) {
    const result = new Error(`${what} has been disposed`);
    result.name = 'DISPOSED';
    return result;
}
function getErrorMessage(err) {
    if (!err) {
        return 'Error';
    }
    if (err.message) {
        return err.message;
    }
    if (err.stack) {
        return err.stack.split('\n')[0];
    }
    return String(err);
}
class NotImplementedError extends Error {
    constructor(message) {
        super('NotImplemented');
        if (message) {
            this.message = message;
        }
    }
}
class NotSupportedError extends Error {
    constructor(message) {
        super('NotSupported');
        if (message) {
            this.message = message;
        }
    }
}

exports.ErrorHandler = ErrorHandler;
exports.NotImplementedError = NotImplementedError;
exports.NotSupportedError = NotSupportedError;
exports.canceled = canceled;
exports.disposed = disposed;
exports.errorHandler = errorHandler;
exports.getErrorMessage = getErrorMessage;
exports.illegalArgument = illegalArgument;
exports.illegalState = illegalState;
exports.isPromiseCanceledError = isPromiseCanceledError;
exports.onUnexpectedError = onUnexpectedError;
exports.onUnexpectedExternalError = onUnexpectedExternalError;
exports.readonly = readonly;
exports.setUnexpectedErrorHandler = setUnexpectedErrorHandler;
exports.transformErrorForSerialization = transformErrorForSerialization;


/***/ }),

/***/ "./node_modules/@orange4glace/vs-lib/base/common/event/index.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@orange4glace/vs-lib/base/common/event/index.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({ value: true }));

var errors = __webpack_require__(/*! ../../../base/common/errors/index.js */ "./node_modules/@orange4glace/vs-lib/base/common/errors/index.js");
var functional = __webpack_require__(/*! ../../../base/common/functional/index.js */ "./node_modules/@orange4glace/vs-lib/base/common/functional/index.js");
var lifecycle = __webpack_require__(/*! ../../../base/common/lifecycle/index.js */ "./node_modules/@orange4glace/vs-lib/base/common/lifecycle/index.js");
var linkedList = __webpack_require__(/*! ../../../base/common/linkedList/index.js */ "./node_modules/@orange4glace/vs-lib/base/common/linkedList/index.js");

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
(function (Event) {
    Event.None = () => lifecycle.Disposable.None;
    /**
     * Given an event, returns another event which only fires once.
     */
    function once(event) {
        return (listener, thisArgs = null, disposables) => {
            // we need this, in case the event fires during the listener call
            let didFire = false;
            let result;
            result = event(e => {
                if (didFire) {
                    return;
                }
                else if (result) {
                    result.dispose();
                }
                else {
                    didFire = true;
                }
                return listener.call(thisArgs, e);
            }, null, disposables);
            if (didFire) {
                result.dispose();
            }
            return result;
        };
    }
    Event.once = once;
    /**
     * Given an event and a `map` function, returns another event which maps each element
     * through the mapping function.
     */
    function map(event, map) {
        return snapshot((listener, thisArgs = null, disposables) => event(i => listener.call(thisArgs, map(i)), null, disposables));
    }
    Event.map = map;
    /**
     * Given an event and an `each` function, returns another identical event and calls
     * the `each` function per each element.
     */
    function forEach(event, each) {
        return snapshot((listener, thisArgs = null, disposables) => event(i => { each(i); listener.call(thisArgs, i); }, null, disposables));
    }
    Event.forEach = forEach;
    function filter(event, filter) {
        return snapshot((listener, thisArgs = null, disposables) => event(e => filter(e) && listener.call(thisArgs, e), null, disposables));
    }
    Event.filter = filter;
    /**
     * Given an event, returns the same event but typed as `Event<void>`.
     */
    function signal(event) {
        return event;
    }
    Event.signal = signal;
    function any(...events) {
        return (listener, thisArgs = null, disposables) => lifecycle.combinedDisposable(...events.map(event => event(e => listener.call(thisArgs, e), null, disposables)));
    }
    Event.any = any;
    /**
     * Given an event and a `merge` function, returns another event which maps each element
     * and the cumulative result through the `merge` function. Similar to `map`, but with memory.
     */
    function reduce(event, merge, initial) {
        let output = initial;
        return map(event, e => {
            output = merge(output, e);
            return output;
        });
    }
    Event.reduce = reduce;
    /**
     * Given a chain of event processing functions (filter, map, etc), each
     * function will be invoked per event & per listener. Snapshotting an event
     * chain allows each function to be invoked just once per event.
     */
    function snapshot(event) {
        let listener;
        const emitter = new Emitter({
            onFirstListenerAdd() {
                listener = event(emitter.fire, emitter);
            },
            onLastListenerRemove() {
                listener.dispose();
            }
        });
        return emitter.event;
    }
    Event.snapshot = snapshot;
    function debounce(event, merge, delay = 100, leading = false, leakWarningThreshold) {
        let subscription;
        let output = undefined;
        let handle = undefined;
        let numDebouncedCalls = 0;
        const emitter = new Emitter({
            leakWarningThreshold,
            onFirstListenerAdd() {
                subscription = event(cur => {
                    numDebouncedCalls++;
                    output = merge(output, cur);
                    if (leading && !handle) {
                        emitter.fire(output);
                        output = undefined;
                    }
                    clearTimeout(handle);
                    handle = setTimeout(() => {
                        const _output = output;
                        output = undefined;
                        handle = undefined;
                        if (!leading || numDebouncedCalls > 1) {
                            emitter.fire(_output);
                        }
                        numDebouncedCalls = 0;
                    }, delay);
                });
            },
            onLastListenerRemove() {
                subscription.dispose();
            }
        });
        return emitter.event;
    }
    Event.debounce = debounce;
    /**
     * Given an event, it returns another event which fires only once and as soon as
     * the input event emits. The event data is the number of millis it took for the
     * event to fire.
     */
    function stopwatch(event) {
        const start = new Date().getTime();
        return map(once(event), _ => new Date().getTime() - start);
    }
    Event.stopwatch = stopwatch;
    /**
     * Given an event, it returns another event which fires only when the event
     * element changes.
     */
    function latch(event) {
        let firstCall = true;
        let cache;
        return filter(event, value => {
            const shouldEmit = firstCall || value !== cache;
            firstCall = false;
            cache = value;
            return shouldEmit;
        });
    }
    Event.latch = latch;
    /**
     * Buffers the provided event until a first listener comes
     * along, at which point fire all the events at once and
     * pipe the event from then on.
     *
     * ```typescript
     * const emitter = new Emitter<number>();
     * const event = emitter.event;
     * const bufferedEvent = buffer(event);
     *
     * emitter.fire(1);
     * emitter.fire(2);
     * emitter.fire(3);
     * // nothing...
     *
     * const listener = bufferedEvent(num => console.log(num));
     * // 1, 2, 3
     *
     * emitter.fire(4);
     * // 4
     * ```
     */
    function buffer(event, nextTick = false, _buffer = []) {
        let buffer = _buffer.slice();
        let listener = event(e => {
            if (buffer) {
                buffer.push(e);
            }
            else {
                emitter.fire(e);
            }
        });
        const flush = () => {
            if (buffer) {
                buffer.forEach(e => emitter.fire(e));
            }
            buffer = null;
        };
        const emitter = new Emitter({
            onFirstListenerAdd() {
                if (!listener) {
                    listener = event(e => emitter.fire(e));
                }
            },
            onFirstListenerDidAdd() {
                if (buffer) {
                    if (nextTick) {
                        setTimeout(flush);
                    }
                    else {
                        flush();
                    }
                }
            },
            onLastListenerRemove() {
                if (listener) {
                    listener.dispose();
                }
                listener = null;
            }
        });
        return emitter.event;
    }
    Event.buffer = buffer;
    class ChainableEvent {
        constructor(event) {
            this.event = event;
        }
        map(fn) {
            return new ChainableEvent(map(this.event, fn));
        }
        forEach(fn) {
            return new ChainableEvent(forEach(this.event, fn));
        }
        filter(fn) {
            return new ChainableEvent(filter(this.event, fn));
        }
        reduce(merge, initial) {
            return new ChainableEvent(reduce(this.event, merge, initial));
        }
        latch() {
            return new ChainableEvent(latch(this.event));
        }
        debounce(merge, delay = 100, leading = false, leakWarningThreshold) {
            return new ChainableEvent(debounce(this.event, merge, delay, leading, leakWarningThreshold));
        }
        on(listener, thisArgs, disposables) {
            return this.event(listener, thisArgs, disposables);
        }
        once(listener, thisArgs, disposables) {
            return once(this.event)(listener, thisArgs, disposables);
        }
    }
    function chain(event) {
        return new ChainableEvent(event);
    }
    Event.chain = chain;
    function fromNodeEventEmitter(emitter, eventName, map = id => id) {
        const fn = (...args) => result.fire(map(...args));
        const onFirstListenerAdd = () => emitter.on(eventName, fn);
        const onLastListenerRemove = () => emitter.removeListener(eventName, fn);
        const result = new Emitter({ onFirstListenerAdd, onLastListenerRemove });
        return result.event;
    }
    Event.fromNodeEventEmitter = fromNodeEventEmitter;
    function fromDOMEventEmitter(emitter, eventName, map = id => id) {
        const fn = (...args) => result.fire(map(...args));
        const onFirstListenerAdd = () => emitter.addEventListener(eventName, fn);
        const onLastListenerRemove = () => emitter.removeEventListener(eventName, fn);
        const result = new Emitter({ onFirstListenerAdd, onLastListenerRemove });
        return result.event;
    }
    Event.fromDOMEventEmitter = fromDOMEventEmitter;
    function fromPromise(promise) {
        const emitter = new Emitter();
        let shouldEmit = false;
        promise
            .then(undefined, () => null)
            .then(() => {
            if (!shouldEmit) {
                setTimeout(() => emitter.fire(undefined), 0);
            }
            else {
                emitter.fire(undefined);
            }
        });
        shouldEmit = true;
        return emitter.event;
    }
    Event.fromPromise = fromPromise;
    function toPromise(event) {
        return new Promise(c => once(event)(c));
    }
    Event.toPromise = toPromise;
})(exports.Event || (exports.Event = {}));
let _globalLeakWarningThreshold = -1;
function setGlobalLeakWarningThreshold(n) {
    const oldValue = _globalLeakWarningThreshold;
    _globalLeakWarningThreshold = n;
    return {
        dispose() {
            _globalLeakWarningThreshold = oldValue;
        }
    };
}
class LeakageMonitor {
    constructor(customThreshold, name = Math.random().toString(18).slice(2, 5)) {
        this.customThreshold = customThreshold;
        this.name = name;
        this._warnCountdown = 0;
    }
    dispose() {
        if (this._stacks) {
            this._stacks.clear();
        }
    }
    check(listenerCount) {
        let threshold = _globalLeakWarningThreshold;
        if (typeof this.customThreshold === 'number') {
            threshold = this.customThreshold;
        }
        if (threshold <= 0 || listenerCount < threshold) {
            return undefined;
        }
        if (!this._stacks) {
            this._stacks = new Map();
        }
        const stack = new Error().stack.split('\n').slice(3).join('\n');
        const count = (this._stacks.get(stack) || 0);
        this._stacks.set(stack, count + 1);
        this._warnCountdown -= 1;
        if (this._warnCountdown <= 0) {
            // only warn on first exceed and then every time the limit
            // is exceeded by 50% again
            this._warnCountdown = threshold * 0.5;
            // find most frequent listener and print warning
            let topStack;
            let topCount = 0;
            for (const [stack, count] of this._stacks) {
                if (!topStack || topCount < count) {
                    topStack = stack;
                    topCount = count;
                }
            }
            console.warn(`[${this.name}] potential listener LEAK detected, having ${listenerCount} listeners already. MOST frequent listener (${topCount}):`);
            console.warn(topStack);
        }
        return () => {
            const count = (this._stacks.get(stack) || 0);
            this._stacks.set(stack, count - 1);
        };
    }
}
/**
 * The Emitter can be used to expose an Event to the public
 * to fire it from the insides.
 * Sample:
    class Document {

        private readonly _onDidChange = new Emitter<(value:string)=>any>();

        public onDidChange = this._onDidChange.event;

        // getter-style
        // get onDidChange(): Event<(value:string)=>any> {
        // 	return this._onDidChange.event;
        // }

        private _doIt() {
            //...
            this._onDidChange.fire(value);
        }
    }
 */
class Emitter {
    constructor(options) {
        this._disposed = false;
        this._options = options;
        this._leakageMon = _globalLeakWarningThreshold > 0
            ? new LeakageMonitor(this._options && this._options.leakWarningThreshold)
            : undefined;
    }
    /**
     * For the public to allow to subscribe
     * to events from this Emitter
     */
    get event() {
        if (!this._event) {
            this._event = (listener, thisArgs, disposables) => {
                if (!this._listeners) {
                    this._listeners = new linkedList.LinkedList();
                }
                const firstListener = this._listeners.isEmpty();
                if (firstListener && this._options && this._options.onFirstListenerAdd) {
                    this._options.onFirstListenerAdd(this);
                }
                const remove = this._listeners.push(!thisArgs ? listener : [listener, thisArgs]);
                if (firstListener && this._options && this._options.onFirstListenerDidAdd) {
                    this._options.onFirstListenerDidAdd(this);
                }
                if (this._options && this._options.onListenerDidAdd) {
                    this._options.onListenerDidAdd(this, listener, thisArgs);
                }
                // check and record this emitter for potential leakage
                let removeMonitor;
                if (this._leakageMon) {
                    removeMonitor = this._leakageMon.check(this._listeners.size);
                }
                let result;
                result = {
                    dispose: () => {
                        if (removeMonitor) {
                            removeMonitor();
                        }
                        result.dispose = Emitter._noop;
                        if (!this._disposed) {
                            remove();
                            if (this._options && this._options.onLastListenerRemove) {
                                const hasListeners = (this._listeners && !this._listeners.isEmpty());
                                if (!hasListeners) {
                                    this._options.onLastListenerRemove(this);
                                }
                            }
                        }
                    }
                };
                if (disposables instanceof lifecycle.DisposableStore) {
                    disposables.add(result);
                }
                else if (Array.isArray(disposables)) {
                    disposables.push(result);
                }
                return result;
            };
        }
        return this._event;
    }
    /**
     * To be kept private to fire an event to
     * subscribers
     */
    fire(event) {
        if (this._listeners) {
            // put all [listener,event]-pairs into delivery queue
            // then emit all event. an inner/nested event might be
            // the driver of this
            if (!this._deliveryQueue) {
                this._deliveryQueue = new linkedList.LinkedList();
            }
            for (let listener of this._listeners) {
                this._deliveryQueue.push([listener, event]);
            }
            while (this._deliveryQueue.size > 0) {
                const [listener, event] = this._deliveryQueue.shift();
                try {
                    if (typeof listener === 'function') {
                        listener.call(undefined, event);
                    }
                    else {
                        listener[0].call(listener[1], event);
                    }
                }
                catch (e) {
                    errors.onUnexpectedError(e);
                }
            }
        }
    }
    dispose() {
        if (this._listeners) {
            this._listeners.clear();
        }
        if (this._deliveryQueue) {
            this._deliveryQueue.clear();
        }
        if (this._leakageMon) {
            this._leakageMon.dispose();
        }
        this._disposed = true;
    }
}
Emitter._noop = function () { };
class PauseableEmitter extends Emitter {
    constructor(options) {
        super(options);
        this._isPaused = 0;
        this._eventQueue = new linkedList.LinkedList();
        this._mergeFn = options && options.merge;
    }
    pause() {
        this._isPaused++;
    }
    resume() {
        if (this._isPaused !== 0 && --this._isPaused === 0) {
            if (this._mergeFn) {
                // use the merge function to create a single composite
                // event. make a copy in case firing pauses this emitter
                const events = this._eventQueue.toArray();
                this._eventQueue.clear();
                super.fire(this._mergeFn(events));
            }
            else {
                // no merging, fire each event individually and test
                // that this emitter isn't paused halfway through
                while (!this._isPaused && this._eventQueue.size !== 0) {
                    super.fire(this._eventQueue.shift());
                }
            }
        }
    }
    fire(event) {
        if (this._listeners) {
            if (this._isPaused !== 0) {
                this._eventQueue.push(event);
            }
            else {
                super.fire(event);
            }
        }
    }
}
class AsyncEmitter extends Emitter {
    async fireAsync(data, token, promiseJoin) {
        if (!this._listeners) {
            return;
        }
        if (!this._asyncDeliveryQueue) {
            this._asyncDeliveryQueue = new linkedList.LinkedList();
        }
        for (const listener of this._listeners) {
            this._asyncDeliveryQueue.push([listener, data]);
        }
        while (this._asyncDeliveryQueue.size > 0 && !token.isCancellationRequested) {
            const [listener, data] = this._asyncDeliveryQueue.shift();
            const thenables = [];
            const event = Object.assign(Object.assign({}, data), { waitUntil: (p) => {
                    if (Object.isFrozen(thenables)) {
                        throw new Error('waitUntil can NOT be called asynchronous');
                    }
                    if (promiseJoin) {
                        p = promiseJoin(p, typeof listener === 'function' ? listener : listener[0]);
                    }
                    thenables.push(p);
                } });
            try {
                if (typeof listener === 'function') {
                    listener.call(undefined, event);
                }
                else {
                    listener[0].call(listener[1], event);
                }
            }
            catch (e) {
                errors.onUnexpectedError(e);
                continue;
            }
            // freeze thenables-collection to enforce sync-calls to
            // wait until and then wait for all thenables to resolve
            Object.freeze(thenables);
            await Promise.all(thenables).catch(e => errors.onUnexpectedError(e));
        }
    }
}
class EventMultiplexer {
    constructor() {
        this.hasListeners = false;
        this.events = [];
        this.emitter = new Emitter({
            onFirstListenerAdd: () => this.onFirstListenerAdd(),
            onLastListenerRemove: () => this.onLastListenerRemove()
        });
    }
    get event() {
        return this.emitter.event;
    }
    add(event) {
        const e = { event: event, listener: null };
        this.events.push(e);
        if (this.hasListeners) {
            this.hook(e);
        }
        const dispose = () => {
            if (this.hasListeners) {
                this.unhook(e);
            }
            const idx = this.events.indexOf(e);
            this.events.splice(idx, 1);
        };
        return lifecycle.toDisposable(functional.once(dispose));
    }
    onFirstListenerAdd() {
        this.hasListeners = true;
        this.events.forEach(e => this.hook(e));
    }
    onLastListenerRemove() {
        this.hasListeners = false;
        this.events.forEach(e => this.unhook(e));
    }
    hook(e) {
        e.listener = e.event(r => this.emitter.fire(r));
    }
    unhook(e) {
        if (e.listener) {
            e.listener.dispose();
        }
        e.listener = null;
    }
    dispose() {
        this.emitter.dispose();
    }
}
/**
 * The EventBufferer is useful in situations in which you want
 * to delay firing your events during some code.
 * You can wrap that code and be sure that the event will not
 * be fired during that wrap.
 *
 * ```
 * const emitter: Emitter;
 * const delayer = new EventDelayer();
 * const delayedEvent = delayer.wrapEvent(emitter.event);
 *
 * delayedEvent(console.log);
 *
 * delayer.bufferEvents(() => {
 *   emitter.fire(); // event will not be fired yet
 * });
 *
 * // event will only be fired at this point
 * ```
 */
class EventBufferer {
    constructor() {
        this.buffers = [];
    }
    wrapEvent(event) {
        return (listener, thisArgs, disposables) => {
            return event(i => {
                const buffer = this.buffers[this.buffers.length - 1];
                if (buffer) {
                    buffer.push(() => listener.call(thisArgs, i));
                }
                else {
                    listener.call(thisArgs, i);
                }
            }, undefined, disposables);
        };
    }
    bufferEvents(fn) {
        const buffer = [];
        this.buffers.push(buffer);
        const r = fn();
        this.buffers.pop();
        buffer.forEach(flush => flush());
        return r;
    }
}
/**
 * A Relay is an event forwarder which functions as a replugabble event pipe.
 * Once created, you can connect an input event to it and it will simply forward
 * events from that input event through its own `event` property. The `input`
 * can be changed at any point in time.
 */
class Relay {
    constructor() {
        this.listening = false;
        this.inputEvent = exports.Event.None;
        this.inputEventListener = lifecycle.Disposable.None;
        this.emitter = new Emitter({
            onFirstListenerDidAdd: () => {
                this.listening = true;
                this.inputEventListener = this.inputEvent(this.emitter.fire, this.emitter);
            },
            onLastListenerRemove: () => {
                this.listening = false;
                this.inputEventListener.dispose();
            }
        });
        this.event = this.emitter.event;
    }
    set input(event) {
        this.inputEvent = event;
        if (this.listening) {
            this.inputEventListener.dispose();
            this.inputEventListener = event(this.emitter.fire, this.emitter);
        }
    }
    dispose() {
        this.inputEventListener.dispose();
        this.emitter.dispose();
    }
}

exports.AsyncEmitter = AsyncEmitter;
exports.Emitter = Emitter;
exports.EventBufferer = EventBufferer;
exports.EventMultiplexer = EventMultiplexer;
exports.PauseableEmitter = PauseableEmitter;
exports.Relay = Relay;
exports.setGlobalLeakWarningThreshold = setGlobalLeakWarningThreshold;


/***/ }),

/***/ "./node_modules/@orange4glace/vs-lib/base/common/functional/index.js":
/*!***************************************************************************!*\
  !*** ./node_modules/@orange4glace/vs-lib/base/common/functional/index.js ***!
  \***************************************************************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({ value: true }));

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
function once(fn) {
    const _this = this;
    let didCall = false;
    let result;
    return function () {
        if (didCall) {
            return result;
        }
        didCall = true;
        result = fn.apply(_this, arguments);
        return result;
    };
}

exports.once = once;


/***/ }),

/***/ "./node_modules/@orange4glace/vs-lib/base/common/iterator/index.js":
/*!*************************************************************************!*\
  !*** ./node_modules/@orange4glace/vs-lib/base/common/iterator/index.js ***!
  \*************************************************************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({ value: true }));

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
(function (Iterable) {
    function is(thing) {
        return thing && typeof thing === 'object' && typeof thing[Symbol.iterator] === 'function';
    }
    Iterable.is = is;
    const _empty = Object.freeze([]);
    function empty() {
        return _empty;
    }
    Iterable.empty = empty;
    function* single(element) {
        yield element;
    }
    Iterable.single = single;
    function from(iterable) {
        return iterable || _empty;
    }
    Iterable.from = from;
    function first(iterable) {
        return iterable[Symbol.iterator]().next().value;
    }
    Iterable.first = first;
    function some(iterable, predicate) {
        for (const element of iterable) {
            if (predicate(element)) {
                return true;
            }
        }
        return false;
    }
    Iterable.some = some;
    function* filter(iterable, predicate) {
        for (const element of iterable) {
            if (predicate(element)) {
                yield element;
            }
        }
    }
    Iterable.filter = filter;
    function* map(iterable, fn) {
        for (const element of iterable) {
            yield fn(element);
        }
    }
    Iterable.map = map;
    function* concat(...iterables) {
        for (const iterable of iterables) {
            for (const element of iterable) {
                yield element;
            }
        }
    }
    Iterable.concat = concat;
    /**
     * Consumes `atMost` elements from iterable and returns the consumed elements,
     * and an iterable for the rest of the elements.
     */
    function consume(iterable, atMost = Number.POSITIVE_INFINITY) {
        const consumed = [];
        if (atMost === 0) {
            return [consumed, iterable];
        }
        const iterator = iterable[Symbol.iterator]();
        for (let i = 0; i < atMost; i++) {
            const next = iterator.next();
            if (next.done) {
                return [consumed, Iterable.empty()];
            }
            consumed.push(next.value);
        }
        return [consumed, { [Symbol.iterator]() { return iterator; } }];
    }
    Iterable.consume = consume;
})(exports.Iterable || (exports.Iterable = {}));


/***/ }),

/***/ "./node_modules/@orange4glace/vs-lib/base/common/lifecycle/index.js":
/*!**************************************************************************!*\
  !*** ./node_modules/@orange4glace/vs-lib/base/common/lifecycle/index.js ***!
  \**************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({ value: true }));

var functional = __webpack_require__(/*! ../../../base/common/functional/index.js */ "./node_modules/@orange4glace/vs-lib/base/common/functional/index.js");
var iterator = __webpack_require__(/*! ../../../base/common/iterator/index.js */ "./node_modules/@orange4glace/vs-lib/base/common/iterator/index.js");

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
function markTracked(x) {
    {
        return;
    }
}
function trackDisposable(x) {
    {
        return x;
    }
}
function isDisposable(thing) {
    return typeof thing.dispose === 'function' && thing.dispose.length === 0;
}
function dispose(arg) {
    if (iterator.Iterable.is(arg)) {
        for (let d of arg) {
            if (d) {
                d.dispose();
            }
        }
        return Array.isArray(arg) ? [] : arg;
    }
    else if (arg) {
        arg.dispose();
        return arg;
    }
}
function combinedDisposable(...disposables) {
    disposables.forEach(markTracked);
    return trackDisposable({ dispose: () => dispose(disposables) });
}
function toDisposable(fn) {
    const self = trackDisposable({
        dispose: () => {
            fn();
        }
    });
    return self;
}
class DisposableStore {
    constructor() {
        this._toDispose = new Set();
        this._isDisposed = false;
    }
    /**
     * Dispose of all registered disposables and mark this object as disposed.
     *
     * Any future disposables added to this object will be disposed of on `add`.
     */
    dispose() {
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;
        this.clear();
    }
    /**
     * Dispose of all registered disposables but do not mark this object as disposed.
     */
    clear() {
        this._toDispose.forEach(item => item.dispose());
        this._toDispose.clear();
    }
    add(t) {
        if (!t) {
            return t;
        }
        if (t === this) {
            throw new Error('Cannot register a disposable on itself!');
        }
        if (this._isDisposed) {
            if (!DisposableStore.DISABLE_DISPOSED_WARNING) {
                console.warn(new Error('Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!').stack);
            }
        }
        else {
            this._toDispose.add(t);
        }
        return t;
    }
}
DisposableStore.DISABLE_DISPOSED_WARNING = false;
class Disposable {
    constructor() {
        this._store = new DisposableStore();
    }
    dispose() {
        this._store.dispose();
    }
    _register(t) {
        if (t === this) {
            throw new Error('Cannot register a disposable on itself!');
        }
        return this._store.add(t);
    }
}
Disposable.None = Object.freeze({ dispose() { } });
/**
 * Manages the lifecycle of a disposable value that may be changed.
 *
 * This ensures that when the disposable value is changed, the previously held disposable is disposed of. You can
 * also register a `MutableDisposable` on a `Disposable` to ensure it is automatically cleaned up.
 */
class MutableDisposable {
    constructor() {
        this._isDisposed = false;
    }
    get value() {
        return this._isDisposed ? undefined : this._value;
    }
    set value(value) {
        if (this._isDisposed || value === this._value) {
            return;
        }
        if (this._value) {
            this._value.dispose();
        }
        this._value = value;
    }
    clear() {
        this.value = undefined;
    }
    dispose() {
        this._isDisposed = true;
        if (this._value) {
            this._value.dispose();
        }
        this._value = undefined;
    }
}
class ReferenceCollection {
    constructor() {
        this.references = new Map();
    }
    acquire(key, ...args) {
        let reference = this.references.get(key);
        if (!reference) {
            reference = { counter: 0, object: this.createReferencedObject(key, ...args) };
            this.references.set(key, reference);
        }
        const { object } = reference;
        const dispose = functional.once(() => {
            if (--reference.counter === 0) {
                this.destroyReferencedObject(key, reference.object);
                this.references.delete(key);
            }
        });
        reference.counter++;
        return { object, dispose };
    }
}
class ImmortalReference {
    constructor(object) {
        this.object = object;
    }
    dispose() { }
}

exports.Disposable = Disposable;
exports.DisposableStore = DisposableStore;
exports.ImmortalReference = ImmortalReference;
exports.MutableDisposable = MutableDisposable;
exports.ReferenceCollection = ReferenceCollection;
exports.combinedDisposable = combinedDisposable;
exports.dispose = dispose;
exports.isDisposable = isDisposable;
exports.toDisposable = toDisposable;


/***/ }),

/***/ "./node_modules/@orange4glace/vs-lib/base/common/linkedList/index.js":
/*!***************************************************************************!*\
  !*** ./node_modules/@orange4glace/vs-lib/base/common/linkedList/index.js ***!
  \***************************************************************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({ value: true }));

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
class Node {
    constructor(element) {
        this.element = element;
        this.next = Node.Undefined;
        this.prev = Node.Undefined;
    }
}
Node.Undefined = new Node(undefined);
class LinkedList {
    constructor() {
        this._first = Node.Undefined;
        this._last = Node.Undefined;
        this._size = 0;
    }
    get size() {
        return this._size;
    }
    isEmpty() {
        return this._first === Node.Undefined;
    }
    clear() {
        this._first = Node.Undefined;
        this._last = Node.Undefined;
        this._size = 0;
    }
    unshift(element) {
        return this._insert(element, false);
    }
    push(element) {
        return this._insert(element, true);
    }
    _insert(element, atTheEnd) {
        const newNode = new Node(element);
        if (this._first === Node.Undefined) {
            this._first = newNode;
            this._last = newNode;
        }
        else if (atTheEnd) {
            // push
            const oldLast = this._last;
            this._last = newNode;
            newNode.prev = oldLast;
            oldLast.next = newNode;
        }
        else {
            // unshift
            const oldFirst = this._first;
            this._first = newNode;
            newNode.next = oldFirst;
            oldFirst.prev = newNode;
        }
        this._size += 1;
        let didRemove = false;
        return () => {
            if (!didRemove) {
                didRemove = true;
                this._remove(newNode);
            }
        };
    }
    shift() {
        if (this._first === Node.Undefined) {
            return undefined;
        }
        else {
            const res = this._first.element;
            this._remove(this._first);
            return res;
        }
    }
    pop() {
        if (this._last === Node.Undefined) {
            return undefined;
        }
        else {
            const res = this._last.element;
            this._remove(this._last);
            return res;
        }
    }
    _remove(node) {
        if (node.prev !== Node.Undefined && node.next !== Node.Undefined) {
            // middle
            const anchor = node.prev;
            anchor.next = node.next;
            node.next.prev = anchor;
        }
        else if (node.prev === Node.Undefined && node.next === Node.Undefined) {
            // only node
            this._first = Node.Undefined;
            this._last = Node.Undefined;
        }
        else if (node.next === Node.Undefined) {
            // last
            this._last = this._last.prev;
            this._last.next = Node.Undefined;
        }
        else if (node.prev === Node.Undefined) {
            // first
            this._first = this._first.next;
            this._first.prev = Node.Undefined;
        }
        // done
        this._size -= 1;
    }
    *[Symbol.iterator]() {
        let node = this._first;
        while (node !== Node.Undefined) {
            yield node.element;
            node = node.next;
        }
    }
    toArray() {
        const result = [];
        for (let node = this._first; node !== Node.Undefined; node = node.next) {
            result.push(node.element);
        }
        return result;
    }
}

exports.LinkedList = LinkedList;


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./content/screen.scss":
/*!**********************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./content/screen.scss ***!
  \**********************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".__sc_overlay {\n  position: absolute;\n  background: #dfb8ab;\n  border: 1px solid red;\n  box-sizing: border-box;\n  opacity: 0.3;\n}", "",{"version":3,"sources":["webpack://./content/screen.scss"],"names":[],"mappings":"AAAA;EACE,kBAAA;EACA,mBAAA;EACA,qBAAA;EACA,sBAAA;EACA,YAAA;AACF","sourcesContent":[".__sc_overlay {\r\n  position: absolute;\r\n  background: rgb(223, 184, 171);\r\n  border: 1px solid red;\r\n  box-sizing: border-box;\r\n  opacity: .3;\r\n}"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./content/tool/measure.scss":
/*!****************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./content/tool/measure.scss ***!
  \****************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".tool-measure {\n  position: absolute;\n  z-index: 5;\n  top: 0;\n  left: 0;\n}\n.tool-measure .horizontal {\n  position: absolute;\n  top: 0;\n  height: 1px;\n  background-color: cornflowerblue;\n}\n.tool-measure .vertical {\n  position: absolute;\n  left: 0;\n  width: 1px;\n  background-color: cornflowerblue;\n}\n.tool-measure .label {\n  position: absolute;\n  font-size: 11px;\n  background: black;\n  color: white;\n  padding: 3px;\n  box-sizing: border-box;\n  opacity: 1;\n  border-radius: 7px;\n}", "",{"version":3,"sources":["webpack://./content/tool/measure.scss"],"names":[],"mappings":"AAAA;EACE,kBAAA;EACA,UAAA;EACA,MAAA;EACA,OAAA;AACF;AACE;EACE,kBAAA;EACA,MAAA;EACA,WAAA;EACA,gCAAA;AACJ;AAEE;EACE,kBAAA;EACA,OAAA;EACA,UAAA;EACA,gCAAA;AAAJ;AAGE;EACE,kBAAA;EACA,eAAA;EACA,iBAAA;EACA,YAAA;EACA,YAAA;EACA,sBAAA;EACA,UAAA;EACA,kBAAA;AADJ","sourcesContent":[".tool-measure {\r\n  position: absolute;\r\n  z-index: 5;\r\n  top: 0;\r\n  left: 0;\r\n\r\n  .horizontal {\r\n    position: absolute;\r\n    top: 0;\r\n    height: 1px;\r\n    background-color: cornflowerblue;\r\n  }\r\n\r\n  .vertical {\r\n    position: absolute;\r\n    left: 0;\r\n    width: 1px;\r\n    background-color: cornflowerblue;\r\n  }\r\n\r\n  .label {\r\n    position: absolute;\r\n    font-size: 11px;\r\n    background: black;\r\n    color: white;\r\n    padding: 3px;\r\n    box-sizing: border-box;\r\n    opacity: 1;\r\n    border-radius: 7px;\r\n  }\r\n\r\n}"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./content/tool/select.scss":
/*!***************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./content/tool/select.scss ***!
  \***************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".tool-select {\n  position: absolute;\n  z-index: 1;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  pointer-events: auto;\n  cursor: none;\n}\n.tool-select .hovering {\n  position: absolute;\n  background-color: steelblue;\n  border: 1px solid red;\n  box-sizing: border-box;\n  opacity: 0.1;\n}\n.tool-select .selecting {\n  position: absolute;\n  background-color: steelblue;\n  opacity: 0.15;\n}", "",{"version":3,"sources":["webpack://./content/tool/select.scss"],"names":[],"mappings":"AAAA;EACE,kBAAA;EACA,UAAA;EACA,MAAA;EACA,OAAA;EACA,QAAA;EACA,SAAA;EACA,oBAAA;EACA,YAAA;AACF;AACE;EACE,kBAAA;EACA,2BAAA;EACA,qBAAA;EACA,sBAAA;EACA,YAAA;AACJ;AAEE;EACE,kBAAA;EACA,2BAAA;EACA,aAAA;AAAJ","sourcesContent":[".tool-select {\r\n  position: absolute;\r\n  z-index: 1;\r\n  top: 0;\r\n  left: 0;\r\n  right: 0;\r\n  bottom: 0;\r\n  pointer-events: auto;\r\n  cursor: none;\r\n\r\n  .hovering {\r\n    position: absolute;\r\n    background-color: steelblue;\r\n    border: 1px solid red;\r\n    box-sizing: border-box;\r\n    opacity: .1;\r\n  }\r\n\r\n  .selecting {\r\n    position: absolute;\r\n    background-color: steelblue;\r\n    opacity: .15;\r\n  }\r\n\r\n}"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/api.js":
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
/***/ ((module) => {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
// eslint-disable-next-line func-names
module.exports = function (cssWithMappingToString) {
  var list = []; // return the list of modules as css string

  list.toString = function toString() {
    return this.map(function (item) {
      var content = cssWithMappingToString(item);

      if (item[2]) {
        return "@media ".concat(item[2], " {").concat(content, "}");
      }

      return content;
    }).join("");
  }; // import a list of modules into the list
  // eslint-disable-next-line func-names


  list.i = function (modules, mediaQuery, dedupe) {
    if (typeof modules === "string") {
      // eslint-disable-next-line no-param-reassign
      modules = [[null, modules, ""]];
    }

    var alreadyImportedModules = {};

    if (dedupe) {
      for (var i = 0; i < this.length; i++) {
        // eslint-disable-next-line prefer-destructuring
        var id = this[i][0];

        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }

    for (var _i = 0; _i < modules.length; _i++) {
      var item = [].concat(modules[_i]);

      if (dedupe && alreadyImportedModules[item[0]]) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (mediaQuery) {
        if (!item[2]) {
          item[2] = mediaQuery;
        } else {
          item[2] = "".concat(mediaQuery, " and ").concat(item[2]);
        }
      }

      list.push(item);
    }
  };

  return list;
};

/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js":
/*!************************************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/cssWithMappingToString.js ***!
  \************************************************************************/
/***/ ((module) => {



function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

module.exports = function cssWithMappingToString(item) {
  var _item = _slicedToArray(item, 4),
      content = _item[1],
      cssMapping = _item[3];

  if (typeof btoa === "function") {
    // eslint-disable-next-line no-undef
    var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(cssMapping))));
    var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
    var sourceMapping = "/*# ".concat(data, " */");
    var sourceURLs = cssMapping.sources.map(function (source) {
      return "/*# sourceURL=".concat(cssMapping.sourceRoot || "").concat(source, " */");
    });
    return [content].concat(sourceURLs).concat([sourceMapping]).join("\n");
  }

  return [content].join("\n");
};

/***/ }),

/***/ "./content/screen.scss":
/*!*****************************!*\
  !*** ./content/screen.scss ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_screen_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js!../node_modules/sass-loader/dist/cjs.js!./screen.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./content/screen.scss");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_screen_scss__WEBPACK_IMPORTED_MODULE_1__.default, options);



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_screen_scss__WEBPACK_IMPORTED_MODULE_1__.default.locals || {});

/***/ }),

/***/ "./content/tool/measure.scss":
/*!***********************************!*\
  !*** ./content/tool/measure.scss ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_measure_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js!../../node_modules/sass-loader/dist/cjs.js!./measure.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./content/tool/measure.scss");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_measure_scss__WEBPACK_IMPORTED_MODULE_1__.default, options);



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_measure_scss__WEBPACK_IMPORTED_MODULE_1__.default.locals || {});

/***/ }),

/***/ "./content/tool/select.scss":
/*!**********************************!*\
  !*** ./content/tool/select.scss ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_select_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js!../../node_modules/sass-loader/dist/cjs.js!./select.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./content/tool/select.scss");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_select_scss__WEBPACK_IMPORTED_MODULE_1__.default, options);



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_select_scss__WEBPACK_IMPORTED_MODULE_1__.default.locals || {});

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js":
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



var isOldIE = function isOldIE() {
  var memo;
  return function memorize() {
    if (typeof memo === 'undefined') {
      // Test for IE <= 9 as proposed by Browserhacks
      // @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
      // Tests for existence of standard globals is to allow style-loader
      // to operate correctly into non-standard environments
      // @see https://github.com/webpack-contrib/style-loader/issues/177
      memo = Boolean(window && document && document.all && !window.atob);
    }

    return memo;
  };
}();

var getTarget = function getTarget() {
  var memo = {};
  return function memorize(target) {
    if (typeof memo[target] === 'undefined') {
      var styleTarget = document.querySelector(target); // Special case to return head of iframe instead of iframe itself

      if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
        try {
          // This will throw an exception if access to iframe is blocked
          // due to cross-origin restrictions
          styleTarget = styleTarget.contentDocument.head;
        } catch (e) {
          // istanbul ignore next
          styleTarget = null;
        }
      }

      memo[target] = styleTarget;
    }

    return memo[target];
  };
}();

var stylesInDom = [];

function getIndexByIdentifier(identifier) {
  var result = -1;

  for (var i = 0; i < stylesInDom.length; i++) {
    if (stylesInDom[i].identifier === identifier) {
      result = i;
      break;
    }
  }

  return result;
}

function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];

  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var index = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3]
    };

    if (index !== -1) {
      stylesInDom[index].references++;
      stylesInDom[index].updater(obj);
    } else {
      stylesInDom.push({
        identifier: identifier,
        updater: addStyle(obj, options),
        references: 1
      });
    }

    identifiers.push(identifier);
  }

  return identifiers;
}

function insertStyleElement(options) {
  var style = document.createElement('style');
  var attributes = options.attributes || {};

  if (typeof attributes.nonce === 'undefined') {
    var nonce =  true ? __webpack_require__.nc : 0;

    if (nonce) {
      attributes.nonce = nonce;
    }
  }

  Object.keys(attributes).forEach(function (key) {
    style.setAttribute(key, attributes[key]);
  });

  if (typeof options.insert === 'function') {
    options.insert(style);
  } else {
    var target = getTarget(options.insert || 'head');

    if (!target) {
      throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
    }

    target.appendChild(style);
  }

  return style;
}

function removeStyleElement(style) {
  // istanbul ignore if
  if (style.parentNode === null) {
    return false;
  }

  style.parentNode.removeChild(style);
}
/* istanbul ignore next  */


var replaceText = function replaceText() {
  var textStore = [];
  return function replace(index, replacement) {
    textStore[index] = replacement;
    return textStore.filter(Boolean).join('\n');
  };
}();

function applyToSingletonTag(style, index, remove, obj) {
  var css = remove ? '' : obj.media ? "@media ".concat(obj.media, " {").concat(obj.css, "}") : obj.css; // For old IE

  /* istanbul ignore if  */

  if (style.styleSheet) {
    style.styleSheet.cssText = replaceText(index, css);
  } else {
    var cssNode = document.createTextNode(css);
    var childNodes = style.childNodes;

    if (childNodes[index]) {
      style.removeChild(childNodes[index]);
    }

    if (childNodes.length) {
      style.insertBefore(cssNode, childNodes[index]);
    } else {
      style.appendChild(cssNode);
    }
  }
}

function applyToTag(style, options, obj) {
  var css = obj.css;
  var media = obj.media;
  var sourceMap = obj.sourceMap;

  if (media) {
    style.setAttribute('media', media);
  } else {
    style.removeAttribute('media');
  }

  if (sourceMap && typeof btoa !== 'undefined') {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  } // For old IE

  /* istanbul ignore if  */


  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    while (style.firstChild) {
      style.removeChild(style.firstChild);
    }

    style.appendChild(document.createTextNode(css));
  }
}

var singleton = null;
var singletonCounter = 0;

function addStyle(obj, options) {
  var style;
  var update;
  var remove;

  if (options.singleton) {
    var styleIndex = singletonCounter++;
    style = singleton || (singleton = insertStyleElement(options));
    update = applyToSingletonTag.bind(null, style, styleIndex, false);
    remove = applyToSingletonTag.bind(null, style, styleIndex, true);
  } else {
    style = insertStyleElement(options);
    update = applyToTag.bind(null, style, options);

    remove = function remove() {
      removeStyleElement(style);
    };
  }

  update(obj);
  return function updateStyle(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap) {
        return;
      }

      update(obj = newObj);
    } else {
      remove();
    }
  };
}

module.exports = function (list, options) {
  options = options || {}; // Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
  // tags it will allow on a page

  if (!options.singleton && typeof options.singleton !== 'boolean') {
    options.singleton = isOldIE();
  }

  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];

    if (Object.prototype.toString.call(newList) !== '[object Array]') {
      return;
    }

    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDom[index].references--;
    }

    var newLastIdentifiers = modulesToDom(newList, options);

    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];

      var _index = getIndexByIdentifier(_identifier);

      if (stylesInDom[_index].references === 0) {
        stylesInDom[_index].updater();

        stylesInDom.splice(_index, 1);
      }
    }

    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ "./content/boxManager.ts":
/*!*******************************!*\
  !*** ./content/boxManager.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BoxManager": () => (/* binding */ BoxManager)
/* harmony export */ });
var BoxManager = /** @class */ (function () {
    function BoxManager() {
        this.boxes_ = [];
    }
    Object.defineProperty(BoxManager.prototype, "boxes", {
        get: function () { return this.boxes_; },
        enumerable: false,
        configurable: true
    });
    BoxManager.prototype.add = function (dom) {
        if (this.boxes_.indexOf(dom) != -1) {
            return;
        }
        this.boxes_.push(dom);
    };
    BoxManager.prototype.remove = function (dom) {
        var idx = this.boxes_.indexOf(dom);
        if (idx == -1)
            return;
        this.boxes_.splice(idx, 1);
    };
    BoxManager.prototype.has = function (dom) {
        return this.boxes_.indexOf(dom) != -1;
    };
    BoxManager.prototype.validate = function () {
        this.boxes_ = this.boxes_.filter(function (b) { return document.body.contains(b); });
    };
    return BoxManager;
}());



/***/ }),

/***/ "./content/index.ts":
/*!**************************!*\
  !*** ./content/index.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var content_measure__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! content/measure */ "./content/measure.ts");
/* harmony import */ var content_screen__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! content/screen */ "./content/screen.ts");


var screen = new content_screen__WEBPACK_IMPORTED_MODULE_1__.Screen(new content_measure__WEBPACK_IMPORTED_MODULE_0__.Measure());
window.addEventListener('keypress', function (e) {
    if (e.key === 'm') {
        screen.toggle();
    }
}, {
    capture: true
});
function update() {
    screen.update();
    requestAnimationFrame(update);
}
requestAnimationFrame(update);


/***/ }),

/***/ "./content/measure.ts":
/*!****************************!*\
  !*** ./content/measure.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Measure": () => (/* binding */ Measure)
/* harmony export */ });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util */ "./content/util.ts");
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (undefined && undefined.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};

var Measure = /** @class */ (function () {
    function Measure() {
    }
    Measure.prototype.iterateDOMs = function () {
        var all, all_1, all_1_1, el, e_1_1;
        var e_1, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    all = document.getElementsByTagName("*");
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, 7, 8]);
                    all_1 = __values(all), all_1_1 = all_1.next();
                    _b.label = 2;
                case 2:
                    if (!!all_1_1.done) return [3 /*break*/, 5];
                    el = all_1_1.value;
                    if (el.classList.contains(_util__WEBPACK_IMPORTED_MODULE_0__.UNIQUE_ID))
                        return [3 /*break*/, 4];
                    return [4 /*yield*/, el];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    all_1_1 = all_1.next();
                    return [3 /*break*/, 2];
                case 5: return [3 /*break*/, 8];
                case 6:
                    e_1_1 = _b.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 8];
                case 7:
                    try {
                        if (all_1_1 && !all_1_1.done && (_a = all_1.return)) _a.call(all_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    };
    Measure.prototype.getSmallestDOMAt = function (x, y) {
        var e_2, _a;
        var best;
        var bestDim = Infinity;
        var doms = this.iterateDOMs();
        try {
            for (var doms_1 = __values(doms), doms_1_1 = doms_1.next(); !doms_1_1.done; doms_1_1 = doms_1.next()) {
                var el = doms_1_1.value;
                var rect = el.getBoundingClientRect();
                if ((0,_util__WEBPACK_IMPORTED_MODULE_0__.isPointInRect)(x, y, rect)) {
                    var dim = (0,_util__WEBPACK_IMPORTED_MODULE_0__.getRectDim)(rect);
                    if (bestDim > dim) {
                        best = el;
                        bestDim = dim;
                    }
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (doms_1_1 && !doms_1_1.done && (_a = doms_1.return)) _a.call(doms_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return best;
    };
    Measure.prototype.getBestMatchedDOMInside = function (rect) {
        var e_3, _a;
        var best;
        var bestDim = 0;
        var doms = this.iterateDOMs();
        try {
            for (var doms_2 = __values(doms), doms_2_1 = doms_2.next(); !doms_2_1.done; doms_2_1 = doms_2.next()) {
                var el = doms_2_1.value;
                var elRect = this.getBoundingClientRect(el);
                if (!(0,_util__WEBPACK_IMPORTED_MODULE_0__.isRectInRect)(rect, elRect))
                    continue;
                var dim = (0,_util__WEBPACK_IMPORTED_MODULE_0__.getRectDim)(elRect);
                if (bestDim <= dim) {
                    best = el;
                    bestDim = dim;
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (doms_2_1 && !doms_2_1.done && (_a = doms_2.return)) _a.call(doms_2);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return best;
    };
    Measure.prototype.getBoundingClientRect = function (dom) {
        return dom.getBoundingClientRect();
    };
    Measure.prototype.getBestMatchedParentDOM = function (dom) {
        throw new Error('Method not implemented.');
    };
    return Measure;
}());



/***/ }),

/***/ "./content/screen.ts":
/*!***************************!*\
  !*** ./content/screen.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Screen": () => (/* binding */ Screen)
/* harmony export */ });
/* harmony import */ var _screen_scss__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./screen.scss */ "./content/screen.scss");
/* harmony import */ var _orange4glace_vs_lib_base_common_event__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @orange4glace/vs-lib/base/common/event */ "./node_modules/@orange4glace/vs-lib/base/common/event/index.js");
/* harmony import */ var content_boxManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! content/boxManager */ "./content/boxManager.ts");
/* harmony import */ var content_tool_measure__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! content/tool/measure */ "./content/tool/measure.ts");
/* harmony import */ var content_tool_select__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! content/tool/select */ "./content/tool/select.ts");
/* harmony import */ var content_util__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! content/util */ "./content/util.ts");
var __values = (undefined && undefined.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};






var Screen = /** @class */ (function () {
    function Screen(measure) {
        var _this = this;
        this.measure = measure;
        this.onMousemove_ = new _orange4glace_vs_lib_base_common_event__WEBPACK_IMPORTED_MODULE_1__.Emitter();
        this.onMousemove = this.onMousemove_.event;
        this.pageX_ = 0;
        this.pageY_ = 0;
        this.screenX_ = 0;
        this.screenY_ = 0;
        this.clientX_ = 0;
        this.clientY_ = 0;
        this.boxOverlays_ = [];
        this.boxes = new content_boxManager__WEBPACK_IMPORTED_MODULE_2__.BoxManager();
        this.dom_ = document.createElement('div');
        this.dom_.className = "" + content_util__WEBPACK_IMPORTED_MODULE_5__.UNIQUE_ID;
        this.dom_.setAttribute('style', "\n      position: fixed;\n      z-index: 99999999;\n      top: 0;\n      left: 0;\n      bottom: 0;\n      right: 0;\n      pointer-events: none;\n    ");
        document.body.append(this.dom_);
        window.addEventListener('mousemove', function (e) {
            _this.pageX_ = e.pageX;
            _this.pageY_ = e.pageY;
            _this.screenX_ = e.screenX;
            _this.screenY_ = e.screenY;
            _this.clientX_ = e.clientX;
            _this.clientY_ = e.clientY;
            _this.onMousemove_.fire();
        }, {
            capture: true
        });
        window.addEventListener('resize', function () { return _this.resize(); });
        this.resize();
        var measureTool = new content_tool_measure__WEBPACK_IMPORTED_MODULE_3__.ScreenMeasureTool(this);
        var selectTool = new content_tool_select__WEBPACK_IMPORTED_MODULE_4__.ScreenSelectTool(this);
        measureTool.onActivate();
        selectTool.onActivate();
        // this.setTool(selectTool);
    }
    Object.defineProperty(Screen.prototype, "dom", {
        get: function () { return this.dom_; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Screen.prototype, "pageX", {
        get: function () { return this.pageX_; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Screen.prototype, "pageY", {
        get: function () { return this.pageY_; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Screen.prototype, "screenX", {
        get: function () { return this.screenX_; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Screen.prototype, "screenY", {
        get: function () { return this.screenY_; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Screen.prototype, "clientX", {
        get: function () { return this.clientX_; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Screen.prototype, "clientY", {
        get: function () { return this.clientY_; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Screen.prototype, "currentTool", {
        get: function () { return this.currentTool_; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Screen.prototype, "width", {
        get: function () { return this.width_; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Screen.prototype, "height", {
        get: function () { return this.height_; },
        enumerable: false,
        configurable: true
    });
    Screen.prototype.resize = function () {
        this.width_ = this.dom_.offsetWidth;
        this.height_ = this.dom.offsetHeight;
    };
    Screen.prototype.setTool = function (tool) {
        // if (this.currentTool_) {
        //   this.currentTool_.onDeactivate(); 
        // }
        // this.currentTool_ = tool;
        // if (this.currentTool_) {
        //   this.currentTool_.onActivate();
        // }
    };
    Screen.prototype.update = function () {
        var e_1, _a, e_2, _b;
        var _this = this;
        this.boxes.validate();
        var removes = this.boxOverlays_.filter(function (o) { return !_this.boxes.has(o[0]); });
        var newOverlays = this.boxOverlays_.filter(function (o) { return _this.boxes.has(o[0]); });
        removes.forEach(function (rm) { return rm[1].remove(); });
        var appends = this.boxes.boxes.filter(function (b) { return !!!_this.boxOverlays_.find(function (o) { return o[0] === b; }); });
        try {
            for (var appends_1 = __values(appends), appends_1_1 = appends_1.next(); !appends_1_1.done; appends_1_1 = appends_1.next()) {
                var a = appends_1_1.value;
                var overlay = document.createElement('div');
                overlay.className = content_util__WEBPACK_IMPORTED_MODULE_5__.UNIQUE_ID + " __sc_overlay";
                this.dom_.append(overlay);
                newOverlays.push([a, overlay]);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (appends_1_1 && !appends_1_1.done && (_a = appends_1.return)) _a.call(appends_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this.boxOverlays_ = newOverlays;
        try {
            for (var _c = __values(this.boxOverlays_), _d = _c.next(); !_d.done; _d = _c.next()) {
                var o = _d.value;
                (0,content_util__WEBPACK_IMPORTED_MODULE_5__.applyDOMRect)(o[1], this.measure.getBoundingClientRect(o[0]));
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
            }
            finally { if (e_2) throw e_2.error; }
        }
    };
    Screen.prototype.enable = function () {
        this.dom.style.display = 'inherit';
    };
    Screen.prototype.disable = function () {
        this.dom_.style.display = 'none';
    };
    Screen.prototype.toggle = function () {
        if (this.dom.style.display === 'none')
            this.enable();
        else
            this.disable();
    };
    return Screen;
}());



/***/ }),

/***/ "./content/tool/measure.ts":
/*!*********************************!*\
  !*** ./content/tool/measure.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ScreenMeasureTool": () => (/* binding */ ScreenMeasureTool)
/* harmony export */ });
/* harmony import */ var _measure_scss__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./measure.scss */ "./content/tool/measure.scss");
/* harmony import */ var _orange4glace_vs_lib_base_common_lifecycle__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @orange4glace/vs-lib/base/common/lifecycle */ "./node_modules/@orange4glace/vs-lib/base/common/lifecycle/index.js");
/* harmony import */ var content_util__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! content/util */ "./content/util.ts");



var ScreenMeasureTool = /** @class */ (function () {
    function ScreenMeasureTool(screen) {
        var _this = this;
        this.screen = screen;
        this.name = ScreenMeasureTool.NAME;
        this.draw = this.draw.bind(this);
        this.dom_ = document.createElement('canvas');
        this.ctx_ = this.dom_.getContext('2d');
        this.fontSize_ = chrome.storage.sync.get(['measureFontSize'], function (result) {
            _this.fontSize_ = result['measureFontSize'];
        });
        this.fontSize_ = this.fontSize_ || 11;
        window.addEventListener('keypress', function (e) {
            if (e.key === '=') {
                _this.fontSize_ = _this.fontSize_ + 1;
                chrome.storage.sync.set({
                    'measureFontSize': _this.fontSize_
                });
            }
            else if (e.key === '-') {
                _this.fontSize_ = _this.fontSize_ - 1;
                chrome.storage.sync.set({
                    'measureFontSize': _this.fontSize_
                });
            }
        });
        window.addEventListener('resize', function () { return _this.resize(); });
        this.resize();
    }
    ScreenMeasureTool.prototype.resize = function () {
        this.dom_.width = this.screen.dom.offsetWidth;
        this.dom_.height = this.screen.dom.offsetHeight;
    };
    ScreenMeasureTool.prototype.onActivate = function () {
        var _this = this;
        this.disposables_ = new _orange4glace_vs_lib_base_common_lifecycle__WEBPACK_IMPORTED_MODULE_1__.DisposableStore();
        this.horizontalDOM_ = document.createElement('div');
        this.verticalDOM_ = document.createElement('div');
        this.horizontalLabelDOM_ = document.createElement('div');
        this.verticalLabelDOM_ = document.createElement('div');
        this.widthLabelDOM_ = document.createElement('div');
        this.heightLabelDOM_ = document.createElement('div');
        this.dom_.className = content_util__WEBPACK_IMPORTED_MODULE_2__.UNIQUE_ID + " tool-measure";
        this.horizontalDOM_.className = content_util__WEBPACK_IMPORTED_MODULE_2__.UNIQUE_ID + " horizontal";
        this.verticalDOM_.className = content_util__WEBPACK_IMPORTED_MODULE_2__.UNIQUE_ID + " vertical";
        this.horizontalLabelDOM_.className = content_util__WEBPACK_IMPORTED_MODULE_2__.UNIQUE_ID + " label label-horizontal";
        this.verticalLabelDOM_.className = content_util__WEBPACK_IMPORTED_MODULE_2__.UNIQUE_ID + " label label-vertical";
        this.widthLabelDOM_.className = content_util__WEBPACK_IMPORTED_MODULE_2__.UNIQUE_ID + " label label-horizontal";
        this.heightLabelDOM_.className = content_util__WEBPACK_IMPORTED_MODULE_2__.UNIQUE_ID + " label label-vertical";
        this.dom_.append(this.horizontalDOM_);
        this.dom_.append(this.verticalDOM_);
        this.dom_.append(this.horizontalLabelDOM_);
        this.dom_.append(this.verticalLabelDOM_);
        this.dom_.append(this.widthLabelDOM_);
        this.dom_.append(this.heightLabelDOM_);
        this.screen.dom.append(this.dom_);
        this.disposables_.add(this.screen.onMousemove(function () { return _this.draw(); }));
        this.interval_ = setInterval(this.draw, 33);
    };
    ScreenMeasureTool.prototype.onDeactivate = function () {
        this.dom_.remove();
        this.disposables_.dispose();
        clearInterval(this.interval_);
    };
    ScreenMeasureTool.prototype.draw = function () {
        var _this = this;
        var x = this.screen.clientX;
        var y = this.screen.clientY;
        var cast = (0,content_util__WEBPACK_IMPORTED_MODULE_2__.raycast)(x, y, this.screen.boxes.boxes.map(function (b) { return _this.screen.measure.getBoundingClientRect(b); }));
        var left = Math.max(0, cast.left);
        var right = Math.min(this.screen.width, cast.right);
        var top = Math.max(0, cast.top);
        var bottom = Math.min(this.screen.height, cast.bottom);
        this.ctx_.clearRect(0, 0, this.screen.width, this.screen.height);
        this.ctx_.lineWidth = 1;
        this.ctx_.strokeStyle = '#8be0ad';
        this.ctx_.beginPath();
        this.ctx_.moveTo(left, y + 0.5);
        this.ctx_.lineTo(right, y + 0.5);
        this.ctx_.moveTo(x + 0.5, top);
        this.ctx_.lineTo(x + 0.5, bottom);
        this.ctx_.stroke();
        this.ctx_.font = this.fontSize_ + "px Arial";
        {
            var horizontalLabelDim = this.ctx_.measureText("" + (right - left));
            var hly = y + this.fontSize_ / 2;
            var hlx = Math.min(this.screen.width - horizontalLabelDim.width - 5, right + 5);
            this.ctx_.fillStyle = 'black';
            this.ctx_.fillRect(hlx - 2, hly - this.fontSize_, horizontalLabelDim.width + 4, this.fontSize_ + 4);
            this.ctx_.fillStyle = 'white';
            this.ctx_.fillText("" + (right - left), hlx, hly);
        }
        {
            var verticalLabelDim = this.ctx_.measureText("" + (bottom - top));
            var vly = Math.min(this.screen.height - 10, bottom + this.fontSize_ + 4);
            var vlx = x - verticalLabelDim.width / 2;
            this.ctx_.fillStyle = 'black';
            this.ctx_.fillRect(vlx - 2, vly - this.fontSize_, verticalLabelDim.width + 4, this.fontSize_ + 4);
            this.ctx_.fillStyle = 'white';
            this.ctx_.fillText("" + (bottom - top), vlx, vly);
        }
        var candidates = this.screen.boxes.boxes.filter(function (box) {
            var rect = _this.screen.measure.getBoundingClientRect(box);
            return (0,content_util__WEBPACK_IMPORTED_MODULE_2__.isPointInRect)(x, y, rect);
        });
        candidates.sort(function (a, b) { return (0,content_util__WEBPACK_IMPORTED_MODULE_2__.getRectDim)(_this.screen.measure.getBoundingClientRect(a)) - (0,content_util__WEBPACK_IMPORTED_MODULE_2__.getRectDim)(_this.screen.measure.getBoundingClientRect(b)); });
        var hovering = candidates[0];
        if (hovering) {
            var hoveringRect = this.screen.measure.getBoundingClientRect(hovering);
            var horizontalLabelDim = this.ctx_.measureText("" + (hoveringRect.right - hoveringRect.left));
            var hly = hoveringRect.top - 6;
            var hlx = hoveringRect.left + hoveringRect.width / 2 - horizontalLabelDim.width / 2;
            this.ctx_.fillStyle = '#043542';
            this.ctx_.fillRect(hlx - 2, hly - this.fontSize_, horizontalLabelDim.width + 4, this.fontSize_ + 4);
            this.ctx_.fillStyle = 'white';
            this.ctx_.fillText("" + (hoveringRect.right - hoveringRect.left), hlx, hly);
            var verticalLabelDim = this.ctx_.measureText("" + (hoveringRect.bottom - hoveringRect.top));
            var vly = hoveringRect.top + hoveringRect.height / 2 + this.fontSize_ / 2;
            var vlx = hoveringRect.right + 6;
            this.ctx_.fillStyle = '#043542';
            this.ctx_.fillRect(vlx - 2, vly - this.fontSize_, verticalLabelDim.width + 4, this.fontSize_ + 4);
            this.ctx_.fillStyle = 'white';
            this.ctx_.fillText("" + (hoveringRect.bottom - hoveringRect.top), vlx, vly);
        }
        else {
            this.widthLabelDOM_.style.display = 'none';
            this.heightLabelDOM_.style.display = 'none';
        }
    };
    ScreenMeasureTool.prototype.canBeSwitchedTo = function (tool) {
        return true;
    };
    ScreenMeasureTool.NAME = 'ScreenMeasureTool';
    return ScreenMeasureTool;
}());



/***/ }),

/***/ "./content/tool/select.ts":
/*!********************************!*\
  !*** ./content/tool/select.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ScreenSelectTool": () => (/* binding */ ScreenSelectTool)
/* harmony export */ });
/* harmony import */ var _select_scss__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./select.scss */ "./content/tool/select.scss");
/* harmony import */ var content_util__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! content/util */ "./content/util.ts");
var __values = (undefined && undefined.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};


var ScreenSelectTool = /** @class */ (function () {
    function ScreenSelectTool(screen) {
        this.screen = screen;
        this.name = ScreenSelectTool.NAME;
        this.dom_ = document.createElement('div');
        this.dom_.className = content_util__WEBPACK_IMPORTED_MODULE_1__.UNIQUE_ID + " tool-select";
        this.handleMousedown = this.handleMousedown.bind(this);
        this.handleMousemove = this.handleMousemove.bind(this);
        this.handleMouseup = this.handleMouseup.bind(this);
        this.updateHovering = (0,content_util__WEBPACK_IMPORTED_MODULE_1__.throttle)(this.updateHovering.bind(this), 33);
    }
    ScreenSelectTool.prototype.onActivate = function () {
        var _a, _b;
        (_a = this.hoveringDOM_) === null || _a === void 0 ? void 0 : _a.remove();
        (_b = this.selectingDOM_) === null || _b === void 0 ? void 0 : _b.remove();
        this.screen.dom.append(this.dom_);
        this.phase_ = 'OVER';
        this.dom_.addEventListener('contextmenu', function (e) { return e.preventDefault(); });
        this.dom_.addEventListener('mousedown', this.handleMousedown);
        this.dom_.addEventListener('mousemove', this.handleMousemove);
        this.dom_.addEventListener('mouseup', this.handleMouseup);
    };
    ScreenSelectTool.prototype.onDeactivate = function () {
        var _a, _b;
        (_a = this.hoveringDOM_) === null || _a === void 0 ? void 0 : _a.remove();
        (_b = this.selectingDOM_) === null || _b === void 0 ? void 0 : _b.remove();
        this.dom_.remove();
        this.dom_.removeEventListener('mousedown', this.handleMousedown);
        this.dom_.removeEventListener('mousemove', this.handleMousemove);
        this.dom_.removeEventListener('mouseup', this.handleMouseup);
    };
    ScreenSelectTool.prototype.handleMousedown = function (e) {
        e.preventDefault();
        var x = this.screen.clientX;
        var y = this.screen.clientY;
        this.mousedownX_ = x;
        this.mousedownY_ = y;
        if (this.phase_ == 'OVER') {
            this.phase_ = 'THRES';
        }
    };
    ScreenSelectTool.prototype.handleMousemove = function () {
        var x = this.screen.clientX;
        var y = this.screen.clientY;
        if (this.phase_ === 'OVER' || this.phase_ === 'THRES') {
            if (!this.hoveringDOM_) {
                this.hoveringDOM_ = document.createElement('div');
                this.hoveringDOM_.className = content_util__WEBPACK_IMPORTED_MODULE_1__.UNIQUE_ID + " hovering";
                this.dom_.append(this.hoveringDOM_);
            }
            this.updateHovering();
        }
        else if (this.phase_ === 'RANGE') {
            this.right_ = x;
            this.bottom_ = y;
            this.updateSelectinDOM();
        }
        if (this.phase_ === 'THRES') {
            if (Math.abs(this.mousedownX_ - x) + Math.abs(this.mousedownY_ - y) > 3) {
                this.hoveringDOM_.remove();
                this.hoveringDOM_ = undefined;
                this.selectingDOM_ = document.createElement('div');
                this.selectingDOM_.className = content_util__WEBPACK_IMPORTED_MODULE_1__.UNIQUE_ID + " selecting";
                this.dom_.append(this.selectingDOM_);
                this.top_ = y;
                this.right_ = x;
                this.bottom_ = y;
                this.left_ = x;
                this.updateSelectinDOM();
                this.phase_ = 'RANGE';
            }
        }
    };
    ScreenSelectTool.prototype.updateHovering = function () {
        var x = this.screen.clientX;
        var y = this.screen.clientY;
        if (this.phase_ === 'OVER' || this.phase_ === 'THRES') {
            var dom = this.screen.measure.getSmallestDOMAt(x, y);
            this.hoveringTargetDOM_ = dom;
            var rect = this.screen.measure.getBoundingClientRect(dom);
            (0,content_util__WEBPACK_IMPORTED_MODULE_1__.applyDOMRect)(this.hoveringDOM_, rect);
        }
    };
    ScreenSelectTool.prototype.handleMouseup = function (e) {
        var e_1, _a;
        var _this = this;
        var x = this.screen.clientX;
        var y = this.screen.clientY;
        if (this.phase_ === 'RANGE') {
            if (e.button == 0) {
                var best = this.screen.measure.getBestMatchedDOMInside(this.selectingDOM_.getBoundingClientRect());
                if (best) {
                    this.screen.boxes.add(best);
                }
            }
            if (e.button == 2) {
                var removes = this.screen.boxes.boxes.filter(function (box) { return (0,content_util__WEBPACK_IMPORTED_MODULE_1__.isRectInRect)(_this.selectingDOM_.getBoundingClientRect(), _this.screen.measure.getBoundingClientRect(box)); });
                try {
                    for (var removes_1 = __values(removes), removes_1_1 = removes_1.next(); !removes_1_1.done; removes_1_1 = removes_1.next()) {
                        var remove = removes_1_1.value;
                        this.screen.boxes.remove(remove);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (removes_1_1 && !removes_1_1.done && (_a = removes_1.return)) _a.call(removes_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            this.selectingDOM_.remove();
        }
        else {
            if (e.button == 0) {
                if (this.hoveringTargetDOM_) {
                    this.screen.boxes.add(this.hoveringTargetDOM_);
                }
            }
            if (e.button === 2) {
                var removes = this.screen.boxes.boxes.filter(function (box) {
                    var rect = _this.screen.measure.getBoundingClientRect(box);
                    return (0,content_util__WEBPACK_IMPORTED_MODULE_1__.isPointInRect)(x, y, rect);
                });
                removes.sort(function (a, b) { return (0,content_util__WEBPACK_IMPORTED_MODULE_1__.getRectDim)(_this.screen.measure.getBoundingClientRect(a)) - (0,content_util__WEBPACK_IMPORTED_MODULE_1__.getRectDim)(_this.screen.measure.getBoundingClientRect(b)); });
                removes[0] && this.screen.boxes.remove(removes[0]);
            }
        }
        this.phase_ = 'OVER';
    };
    ScreenSelectTool.prototype.updateSelectinDOM = function () {
        var l = Math.min(this.left_, this.right_);
        var r = Math.max(this.left_, this.right_);
        var t = Math.min(this.top_, this.bottom_);
        var b = Math.max(this.top_, this.bottom_);
        this.selectingDOM_.style.left = l + "px";
        this.selectingDOM_.style.top = t + "px";
        this.selectingDOM_.style.width = r - l + "px";
        this.selectingDOM_.style.height = b - t + "px";
    };
    ScreenSelectTool.prototype.canBeSwitchedTo = function (tool) {
        return true;
    };
    ScreenSelectTool.NAME = 'ScreenSelectTool';
    return ScreenSelectTool;
}());



/***/ }),

/***/ "./content/util.ts":
/*!*************************!*\
  !*** ./content/util.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "UNIQUE_ID": () => (/* binding */ UNIQUE_ID),
/* harmony export */   "throttle": () => (/* binding */ throttle),
/* harmony export */   "applyDOMRect": () => (/* binding */ applyDOMRect),
/* harmony export */   "isPointInRect": () => (/* binding */ isPointInRect),
/* harmony export */   "getRectDim": () => (/* binding */ getRectDim),
/* harmony export */   "getOverlappingDim": () => (/* binding */ getOverlappingDim),
/* harmony export */   "isRectInRect": () => (/* binding */ isRectInRect),
/* harmony export */   "raycast": () => (/* binding */ raycast)
/* harmony export */ });
var __values = (undefined && undefined.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var UNIQUE_ID = '______measure';
function throttle(callback, limit) {
    var waiting = false; // Initially, we're not waiting
    return function () {
        if (!waiting) { // If we're not waiting
            callback.apply(this, arguments); // Execute users function
            waiting = true; // Prevent future invocations
            setTimeout(function () {
                waiting = false; // And allow future invocations
            }, limit);
        }
    };
}
function applyDOMRect(src, rect) {
    src.style.left = rect.left + "px";
    src.style.top = rect.top + "px";
    src.style.width = rect.width + "px";
    src.style.height = rect.height + "px";
}
function isPointInRect(x, y, rect) {
    return rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom;
}
function getRectDim(rect) {
    return (rect.right - rect.left) * (rect.bottom - rect.top);
}
function getOverlappingDim(lhs, rhs) {
    var w = Math.min(lhs.right, rhs.right) - Math.max(lhs.left, rhs.left);
    var h = Math.min(lhs.bottom - rhs.bottom) - Math.max(lhs.top - rhs.top);
    if (w >= 0 && h >= 0)
        return w * h;
    return 0;
}
function isRectInRect(outside, inside) {
    return outside.left <= inside.left && outside.right >= inside.right &&
        outside.top <= inside.top && outside.bottom >= inside.bottom;
}
function raycast(x, y, rects) {
    var e_1, _a;
    var left = -Infinity;
    var right = Infinity;
    var top = -Infinity;
    var bottom = Infinity;
    try {
        for (var rects_1 = __values(rects), rects_1_1 = rects_1.next(); !rects_1_1.done; rects_1_1 = rects_1.next()) {
            var rect = rects_1_1.value;
            if (x <= rect.left && rect.top <= y && y <= rect.bottom) {
                right = Math.min(right, rect.left);
            }
            if (rect.right <= x && rect.top <= y && y <= rect.bottom) {
                left = Math.max(left, rect.right);
            }
            if (y <= rect.top && rect.left <= x && x <= rect.right) {
                bottom = Math.min(bottom, rect.top);
            }
            if (rect.bottom <= y && rect.left <= x && x <= rect.right) {
                top = Math.max(top, rect.bottom);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (rects_1_1 && !rects_1_1.done && (_a = rects_1.return)) _a.call(rects_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return {
        left: left, right: right, top: top, bottom: bottom
    };
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	// startup
/******/ 	// Load entry module
/******/ 	__webpack_require__("./content/index.ts");
/******/ 	// This entry module used 'exports' so it can't be inlined
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9waXhkb20vLi9ub2RlX21vZHVsZXMvQG9yYW5nZTRnbGFjZS92cy1saWIvYmFzZS9jb21tb24vZXJyb3JzL2luZGV4LmpzIiwid2VicGFjazovL3BpeGRvbS8uL25vZGVfbW9kdWxlcy9Ab3JhbmdlNGdsYWNlL3ZzLWxpYi9iYXNlL2NvbW1vbi9ldmVudC9pbmRleC5qcyIsIndlYnBhY2s6Ly9waXhkb20vLi9ub2RlX21vZHVsZXMvQG9yYW5nZTRnbGFjZS92cy1saWIvYmFzZS9jb21tb24vZnVuY3Rpb25hbC9pbmRleC5qcyIsIndlYnBhY2s6Ly9waXhkb20vLi9ub2RlX21vZHVsZXMvQG9yYW5nZTRnbGFjZS92cy1saWIvYmFzZS9jb21tb24vaXRlcmF0b3IvaW5kZXguanMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vbm9kZV9tb2R1bGVzL0BvcmFuZ2U0Z2xhY2UvdnMtbGliL2Jhc2UvY29tbW9uL2xpZmVjeWNsZS9pbmRleC5qcyIsIndlYnBhY2s6Ly9waXhkb20vLi9ub2RlX21vZHVsZXMvQG9yYW5nZTRnbGFjZS92cy1saWIvYmFzZS9jb21tb24vbGlua2VkTGlzdC9pbmRleC5qcyIsIndlYnBhY2s6Ly9waXhkb20vLi9jb250ZW50L3NjcmVlbi5zY3NzIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvdG9vbC9tZWFzdXJlLnNjc3MiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vY29udGVudC90b29sL3NlbGVjdC5zY3NzIiwid2VicGFjazovL3BpeGRvbS8uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9hcGkuanMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2Nzc1dpdGhNYXBwaW5nVG9TdHJpbmcuanMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vY29udGVudC9zY3JlZW4uc2Nzcz9mOWFiIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvdG9vbC9tZWFzdXJlLnNjc3M/NTliYyIsIndlYnBhY2s6Ly9waXhkb20vLi9jb250ZW50L3Rvb2wvc2VsZWN0LnNjc3M/ODA3ZiIsIndlYnBhY2s6Ly9waXhkb20vLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbmplY3RTdHlsZXNJbnRvU3R5bGVUYWcuanMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vY29udGVudC9ib3hNYW5hZ2VyLnRzIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vY29udGVudC9tZWFzdXJlLnRzIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvc2NyZWVuLnRzIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvdG9vbC9tZWFzdXJlLnRzIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvdG9vbC9zZWxlY3QudHMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vY29udGVudC91dGlsLnRzIiwid2VicGFjazovL3BpeGRvbS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9waXhkb20vd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vcGl4ZG9tL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9waXhkb20vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9waXhkb20vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9waXhkb20vd2VicGFjay9zdGFydHVwIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBYTs7QUFFYiw4Q0FBNkMsQ0FBQyxjQUFjLEVBQUM7O0FBRTdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLGdCQUFnQjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxLQUFLO0FBQ25EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkNBQTJDLEtBQUs7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQ0FBMEMsS0FBSztBQUMvQztBQUNBO0FBQ0E7QUFDQSxnQ0FBZ0MsS0FBSztBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxvQkFBb0I7QUFDcEIsMkJBQTJCO0FBQzNCLHlCQUF5QjtBQUN6QixnQkFBZ0I7QUFDaEIsZ0JBQWdCO0FBQ2hCLG9CQUFvQjtBQUNwQix1QkFBdUI7QUFDdkIsdUJBQXVCO0FBQ3ZCLG9CQUFvQjtBQUNwQiw4QkFBOEI7QUFDOUIseUJBQXlCO0FBQ3pCLGlDQUFpQztBQUNqQyxnQkFBZ0I7QUFDaEIsaUNBQWlDO0FBQ2pDLHNDQUFzQzs7Ozs7Ozs7Ozs7QUN0S3pCOztBQUViLDhDQUE2QyxDQUFDLGNBQWMsRUFBQzs7QUFFN0QsYUFBYSxtQkFBTyxDQUFDLDZHQUFzQztBQUMzRCxpQkFBaUIsbUJBQU8sQ0FBQyxxSEFBMEM7QUFDbkUsZ0JBQWdCLG1CQUFPLENBQUMsbUhBQXlDO0FBQ2pFLGlCQUFpQixtQkFBTyxDQUFDLHFIQUEwQzs7QUFFbkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdGQUFnRixTQUFTLDRCQUE0QixFQUFFO0FBQ3ZIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9DQUFvQywyQ0FBMkM7QUFDL0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQ0FBb0MsMkNBQTJDO0FBQy9FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxvQkFBb0IsYUFBYSxLQUFLO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCLFVBQVUsNkNBQTZDLGNBQWMsOENBQThDLFNBQVM7QUFDeko7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0RBQXdELFVBQVU7QUFDbEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsRUFBRTtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CO0FBQ3BCLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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Q0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsV0FBQyxJQUFJLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxFQUE1QyxDQUE0QyxDQUFDLENBQUMsQ0FBQztRQUUzRyxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEQsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXpELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVqRSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDdEIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLElBQUks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QUssQ0FBQyxDQUFDO2FBQ25DO1lBQ0QsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDdEQsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNyQztZQUNELElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ3pELEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDbEM7U0FDRjs7Ozs7Ozs7O0lBRUQsT0FBTztRQUNMLElBQUksUUFBRSxLQUFLLFNBQUUsR0FBRyxPQUFFLE1BQU07S0FDekIsQ0FBQztBQUNKLENBQUM7Ozs7Ozs7VUN6RUQ7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDckJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxnQ0FBZ0MsWUFBWTtXQUM1QztXQUNBLEU7Ozs7O1dDUEE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx3Q0FBd0MseUNBQXlDO1dBQ2pGO1dBQ0E7V0FDQSxFOzs7OztXQ1BBLHdGOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHNEQUFzRCxrQkFBa0I7V0FDeEU7V0FDQSwrQ0FBK0MsY0FBYztXQUM3RCxFOzs7O1VDTkE7VUFDQTtVQUNBO1VBQ0EiLCJmaWxlIjoiY29udGVudFNjcmlwdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbi8vIEF2b2lkIGNpcmN1bGFyIGRlcGVuZGVuY3kgb24gRXZlbnRFbWl0dGVyIGJ5IGltcGxlbWVudGluZyBhIHN1YnNldCBvZiB0aGUgaW50ZXJmYWNlLlxyXG5jbGFzcyBFcnJvckhhbmRsZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBbXTtcclxuICAgICAgICB0aGlzLnVuZXhwZWN0ZWRFcnJvckhhbmRsZXIgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChlLnN0YWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGUubWVzc2FnZSArICdcXG5cXG4nICsgZS5zdGFjayk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgICAgICB9LCAwKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgYWRkTGlzdGVuZXIobGlzdGVuZXIpIHtcclxuICAgICAgICB0aGlzLmxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcclxuICAgICAgICByZXR1cm4gKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIGVtaXQoZSkge1xyXG4gICAgICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XHJcbiAgICAgICAgICAgIGxpc3RlbmVyKGUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgX3JlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKSB7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpLCAxKTtcclxuICAgIH1cclxuICAgIHNldFVuZXhwZWN0ZWRFcnJvckhhbmRsZXIobmV3VW5leHBlY3RlZEVycm9ySGFuZGxlcikge1xyXG4gICAgICAgIHRoaXMudW5leHBlY3RlZEVycm9ySGFuZGxlciA9IG5ld1VuZXhwZWN0ZWRFcnJvckhhbmRsZXI7XHJcbiAgICB9XHJcbiAgICBnZXRVbmV4cGVjdGVkRXJyb3JIYW5kbGVyKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVuZXhwZWN0ZWRFcnJvckhhbmRsZXI7XHJcbiAgICB9XHJcbiAgICBvblVuZXhwZWN0ZWRFcnJvcihlKSB7XHJcbiAgICAgICAgdGhpcy51bmV4cGVjdGVkRXJyb3JIYW5kbGVyKGUpO1xyXG4gICAgICAgIHRoaXMuZW1pdChlKTtcclxuICAgIH1cclxuICAgIC8vIEZvciBleHRlcm5hbCBlcnJvcnMsIHdlIGRvbid0IHdhbnQgdGhlIGxpc3RlbmVycyB0byBiZSBjYWxsZWRcclxuICAgIG9uVW5leHBlY3RlZEV4dGVybmFsRXJyb3IoZSkge1xyXG4gICAgICAgIHRoaXMudW5leHBlY3RlZEVycm9ySGFuZGxlcihlKTtcclxuICAgIH1cclxufVxyXG5jb25zdCBlcnJvckhhbmRsZXIgPSBuZXcgRXJyb3JIYW5kbGVyKCk7XHJcbmZ1bmN0aW9uIHNldFVuZXhwZWN0ZWRFcnJvckhhbmRsZXIobmV3VW5leHBlY3RlZEVycm9ySGFuZGxlcikge1xyXG4gICAgZXJyb3JIYW5kbGVyLnNldFVuZXhwZWN0ZWRFcnJvckhhbmRsZXIobmV3VW5leHBlY3RlZEVycm9ySGFuZGxlcik7XHJcbn1cclxuZnVuY3Rpb24gb25VbmV4cGVjdGVkRXJyb3IoZSkge1xyXG4gICAgLy8gaWdub3JlIGVycm9ycyBmcm9tIGNhbmNlbGxlZCBwcm9taXNlc1xyXG4gICAgaWYgKCFpc1Byb21pc2VDYW5jZWxlZEVycm9yKGUpKSB7XHJcbiAgICAgICAgZXJyb3JIYW5kbGVyLm9uVW5leHBlY3RlZEVycm9yKGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxufVxyXG5mdW5jdGlvbiBvblVuZXhwZWN0ZWRFeHRlcm5hbEVycm9yKGUpIHtcclxuICAgIC8vIGlnbm9yZSBlcnJvcnMgZnJvbSBjYW5jZWxsZWQgcHJvbWlzZXNcclxuICAgIGlmICghaXNQcm9taXNlQ2FuY2VsZWRFcnJvcihlKSkge1xyXG4gICAgICAgIGVycm9ySGFuZGxlci5vblVuZXhwZWN0ZWRFeHRlcm5hbEVycm9yKGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxufVxyXG5mdW5jdGlvbiB0cmFuc2Zvcm1FcnJvckZvclNlcmlhbGl6YXRpb24oZXJyb3IpIHtcclxuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XHJcbiAgICAgICAgbGV0IHsgbmFtZSwgbWVzc2FnZSB9ID0gZXJyb3I7XHJcbiAgICAgICAgY29uc3Qgc3RhY2sgPSBlcnJvci5zdGFja3RyYWNlIHx8IGVycm9yLnN0YWNrO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICRpc0Vycm9yOiB0cnVlLFxyXG4gICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICBtZXNzYWdlLFxyXG4gICAgICAgICAgICBzdGFja1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICAvLyByZXR1cm4gYXMgaXNcclxuICAgIHJldHVybiBlcnJvcjtcclxufVxyXG5jb25zdCBjYW5jZWxlZE5hbWUgPSAnQ2FuY2VsZWQnO1xyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBnaXZlbiBlcnJvciBpcyBhIHByb21pc2UgaW4gY2FuY2VsZWQgc3RhdGVcclxuICovXHJcbmZ1bmN0aW9uIGlzUHJvbWlzZUNhbmNlbGVkRXJyb3IoZXJyb3IpIHtcclxuICAgIHJldHVybiBlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmIGVycm9yLm5hbWUgPT09IGNhbmNlbGVkTmFtZSAmJiBlcnJvci5tZXNzYWdlID09PSBjYW5jZWxlZE5hbWU7XHJcbn1cclxuLyoqXHJcbiAqIFJldHVybnMgYW4gZXJyb3IgdGhhdCBzaWduYWxzIGNhbmNlbGxhdGlvbi5cclxuICovXHJcbmZ1bmN0aW9uIGNhbmNlbGVkKCkge1xyXG4gICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoY2FuY2VsZWROYW1lKTtcclxuICAgIGVycm9yLm5hbWUgPSBlcnJvci5tZXNzYWdlO1xyXG4gICAgcmV0dXJuIGVycm9yO1xyXG59XHJcbmZ1bmN0aW9uIGlsbGVnYWxBcmd1bWVudChuYW1lKSB7XHJcbiAgICBpZiAobmFtZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoYElsbGVnYWwgYXJndW1lbnQ6ICR7bmFtZX1gKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoJ0lsbGVnYWwgYXJndW1lbnQnKTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBpbGxlZ2FsU3RhdGUobmFtZSkge1xyXG4gICAgaWYgKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gbmV3IEVycm9yKGBJbGxlZ2FsIHN0YXRlOiAke25hbWV9YCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbmV3IEVycm9yKCdJbGxlZ2FsIHN0YXRlJyk7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gcmVhZG9ubHkobmFtZSkge1xyXG4gICAgcmV0dXJuIG5hbWVcclxuICAgICAgICA/IG5ldyBFcnJvcihgcmVhZG9ubHkgcHJvcGVydHkgJyR7bmFtZX0gY2Fubm90IGJlIGNoYW5nZWQnYClcclxuICAgICAgICA6IG5ldyBFcnJvcigncmVhZG9ubHkgcHJvcGVydHkgY2Fubm90IGJlIGNoYW5nZWQnKTtcclxufVxyXG5mdW5jdGlvbiBkaXNwb3NlZCh3aGF0KSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBuZXcgRXJyb3IoYCR7d2hhdH0gaGFzIGJlZW4gZGlzcG9zZWRgKTtcclxuICAgIHJlc3VsdC5uYW1lID0gJ0RJU1BPU0VEJztcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuZnVuY3Rpb24gZ2V0RXJyb3JNZXNzYWdlKGVycikge1xyXG4gICAgaWYgKCFlcnIpIHtcclxuICAgICAgICByZXR1cm4gJ0Vycm9yJztcclxuICAgIH1cclxuICAgIGlmIChlcnIubWVzc2FnZSkge1xyXG4gICAgICAgIHJldHVybiBlcnIubWVzc2FnZTtcclxuICAgIH1cclxuICAgIGlmIChlcnIuc3RhY2spIHtcclxuICAgICAgICByZXR1cm4gZXJyLnN0YWNrLnNwbGl0KCdcXG4nKVswXTtcclxuICAgIH1cclxuICAgIHJldHVybiBTdHJpbmcoZXJyKTtcclxufVxyXG5jbGFzcyBOb3RJbXBsZW1lbnRlZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xyXG4gICAgY29uc3RydWN0b3IobWVzc2FnZSkge1xyXG4gICAgICAgIHN1cGVyKCdOb3RJbXBsZW1lbnRlZCcpO1xyXG4gICAgICAgIGlmIChtZXNzYWdlKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmNsYXNzIE5vdFN1cHBvcnRlZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xyXG4gICAgY29uc3RydWN0b3IobWVzc2FnZSkge1xyXG4gICAgICAgIHN1cGVyKCdOb3RTdXBwb3J0ZWQnKTtcclxuICAgICAgICBpZiAobWVzc2FnZSkge1xyXG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxuXG5leHBvcnRzLkVycm9ySGFuZGxlciA9IEVycm9ySGFuZGxlcjtcbmV4cG9ydHMuTm90SW1wbGVtZW50ZWRFcnJvciA9IE5vdEltcGxlbWVudGVkRXJyb3I7XG5leHBvcnRzLk5vdFN1cHBvcnRlZEVycm9yID0gTm90U3VwcG9ydGVkRXJyb3I7XG5leHBvcnRzLmNhbmNlbGVkID0gY2FuY2VsZWQ7XG5leHBvcnRzLmRpc3Bvc2VkID0gZGlzcG9zZWQ7XG5leHBvcnRzLmVycm9ySGFuZGxlciA9IGVycm9ySGFuZGxlcjtcbmV4cG9ydHMuZ2V0RXJyb3JNZXNzYWdlID0gZ2V0RXJyb3JNZXNzYWdlO1xuZXhwb3J0cy5pbGxlZ2FsQXJndW1lbnQgPSBpbGxlZ2FsQXJndW1lbnQ7XG5leHBvcnRzLmlsbGVnYWxTdGF0ZSA9IGlsbGVnYWxTdGF0ZTtcbmV4cG9ydHMuaXNQcm9taXNlQ2FuY2VsZWRFcnJvciA9IGlzUHJvbWlzZUNhbmNlbGVkRXJyb3I7XG5leHBvcnRzLm9uVW5leHBlY3RlZEVycm9yID0gb25VbmV4cGVjdGVkRXJyb3I7XG5leHBvcnRzLm9uVW5leHBlY3RlZEV4dGVybmFsRXJyb3IgPSBvblVuZXhwZWN0ZWRFeHRlcm5hbEVycm9yO1xuZXhwb3J0cy5yZWFkb25seSA9IHJlYWRvbmx5O1xuZXhwb3J0cy5zZXRVbmV4cGVjdGVkRXJyb3JIYW5kbGVyID0gc2V0VW5leHBlY3RlZEVycm9ySGFuZGxlcjtcbmV4cG9ydHMudHJhbnNmb3JtRXJyb3JGb3JTZXJpYWxpemF0aW9uID0gdHJhbnNmb3JtRXJyb3JGb3JTZXJpYWxpemF0aW9uO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG52YXIgZXJyb3JzID0gcmVxdWlyZSgnLi4vLi4vLi4vYmFzZS9jb21tb24vZXJyb3JzL2luZGV4LmpzJyk7XG52YXIgZnVuY3Rpb25hbCA9IHJlcXVpcmUoJy4uLy4uLy4uL2Jhc2UvY29tbW9uL2Z1bmN0aW9uYWwvaW5kZXguanMnKTtcbnZhciBsaWZlY3ljbGUgPSByZXF1aXJlKCcuLi8uLi8uLi9iYXNlL2NvbW1vbi9saWZlY3ljbGUvaW5kZXguanMnKTtcbnZhciBsaW5rZWRMaXN0ID0gcmVxdWlyZSgnLi4vLi4vLi4vYmFzZS9jb21tb24vbGlua2VkTGlzdC9pbmRleC5qcycpO1xuXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxyXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuKGZ1bmN0aW9uIChFdmVudCkge1xyXG4gICAgRXZlbnQuTm9uZSA9ICgpID0+IGxpZmVjeWNsZS5EaXNwb3NhYmxlLk5vbmU7XHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGFuIGV2ZW50LCByZXR1cm5zIGFub3RoZXIgZXZlbnQgd2hpY2ggb25seSBmaXJlcyBvbmNlLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBvbmNlKGV2ZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIChsaXN0ZW5lciwgdGhpc0FyZ3MgPSBudWxsLCBkaXNwb3NhYmxlcykgPT4ge1xyXG4gICAgICAgICAgICAvLyB3ZSBuZWVkIHRoaXMsIGluIGNhc2UgdGhlIGV2ZW50IGZpcmVzIGR1cmluZyB0aGUgbGlzdGVuZXIgY2FsbFxyXG4gICAgICAgICAgICBsZXQgZGlkRmlyZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICBsZXQgcmVzdWx0O1xyXG4gICAgICAgICAgICByZXN1bHQgPSBldmVudChlID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChkaWRGaXJlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpZEZpcmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpc3RlbmVyLmNhbGwodGhpc0FyZ3MsIGUpO1xyXG4gICAgICAgICAgICB9LCBudWxsLCBkaXNwb3NhYmxlcyk7XHJcbiAgICAgICAgICAgIGlmIChkaWRGaXJlKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIEV2ZW50Lm9uY2UgPSBvbmNlO1xyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhbiBldmVudCBhbmQgYSBgbWFwYCBmdW5jdGlvbiwgcmV0dXJucyBhbm90aGVyIGV2ZW50IHdoaWNoIG1hcHMgZWFjaCBlbGVtZW50XHJcbiAgICAgKiB0aHJvdWdoIHRoZSBtYXBwaW5nIGZ1bmN0aW9uLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBtYXAoZXZlbnQsIG1hcCkge1xyXG4gICAgICAgIHJldHVybiBzbmFwc2hvdCgobGlzdGVuZXIsIHRoaXNBcmdzID0gbnVsbCwgZGlzcG9zYWJsZXMpID0+IGV2ZW50KGkgPT4gbGlzdGVuZXIuY2FsbCh0aGlzQXJncywgbWFwKGkpKSwgbnVsbCwgZGlzcG9zYWJsZXMpKTtcclxuICAgIH1cclxuICAgIEV2ZW50Lm1hcCA9IG1hcDtcclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gYW4gZXZlbnQgYW5kIGFuIGBlYWNoYCBmdW5jdGlvbiwgcmV0dXJucyBhbm90aGVyIGlkZW50aWNhbCBldmVudCBhbmQgY2FsbHNcclxuICAgICAqIHRoZSBgZWFjaGAgZnVuY3Rpb24gcGVyIGVhY2ggZWxlbWVudC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZm9yRWFjaChldmVudCwgZWFjaCkge1xyXG4gICAgICAgIHJldHVybiBzbmFwc2hvdCgobGlzdGVuZXIsIHRoaXNBcmdzID0gbnVsbCwgZGlzcG9zYWJsZXMpID0+IGV2ZW50KGkgPT4geyBlYWNoKGkpOyBsaXN0ZW5lci5jYWxsKHRoaXNBcmdzLCBpKTsgfSwgbnVsbCwgZGlzcG9zYWJsZXMpKTtcclxuICAgIH1cclxuICAgIEV2ZW50LmZvckVhY2ggPSBmb3JFYWNoO1xyXG4gICAgZnVuY3Rpb24gZmlsdGVyKGV2ZW50LCBmaWx0ZXIpIHtcclxuICAgICAgICByZXR1cm4gc25hcHNob3QoKGxpc3RlbmVyLCB0aGlzQXJncyA9IG51bGwsIGRpc3Bvc2FibGVzKSA9PiBldmVudChlID0+IGZpbHRlcihlKSAmJiBsaXN0ZW5lci5jYWxsKHRoaXNBcmdzLCBlKSwgbnVsbCwgZGlzcG9zYWJsZXMpKTtcclxuICAgIH1cclxuICAgIEV2ZW50LmZpbHRlciA9IGZpbHRlcjtcclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gYW4gZXZlbnQsIHJldHVybnMgdGhlIHNhbWUgZXZlbnQgYnV0IHR5cGVkIGFzIGBFdmVudDx2b2lkPmAuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHNpZ25hbChldmVudCkge1xyXG4gICAgICAgIHJldHVybiBldmVudDtcclxuICAgIH1cclxuICAgIEV2ZW50LnNpZ25hbCA9IHNpZ25hbDtcclxuICAgIGZ1bmN0aW9uIGFueSguLi5ldmVudHMpIHtcclxuICAgICAgICByZXR1cm4gKGxpc3RlbmVyLCB0aGlzQXJncyA9IG51bGwsIGRpc3Bvc2FibGVzKSA9PiBsaWZlY3ljbGUuY29tYmluZWREaXNwb3NhYmxlKC4uLmV2ZW50cy5tYXAoZXZlbnQgPT4gZXZlbnQoZSA9PiBsaXN0ZW5lci5jYWxsKHRoaXNBcmdzLCBlKSwgbnVsbCwgZGlzcG9zYWJsZXMpKSk7XHJcbiAgICB9XHJcbiAgICBFdmVudC5hbnkgPSBhbnk7XHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGFuIGV2ZW50IGFuZCBhIGBtZXJnZWAgZnVuY3Rpb24sIHJldHVybnMgYW5vdGhlciBldmVudCB3aGljaCBtYXBzIGVhY2ggZWxlbWVudFxyXG4gICAgICogYW5kIHRoZSBjdW11bGF0aXZlIHJlc3VsdCB0aHJvdWdoIHRoZSBgbWVyZ2VgIGZ1bmN0aW9uLiBTaW1pbGFyIHRvIGBtYXBgLCBidXQgd2l0aCBtZW1vcnkuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHJlZHVjZShldmVudCwgbWVyZ2UsIGluaXRpYWwpIHtcclxuICAgICAgICBsZXQgb3V0cHV0ID0gaW5pdGlhbDtcclxuICAgICAgICByZXR1cm4gbWFwKGV2ZW50LCBlID0+IHtcclxuICAgICAgICAgICAgb3V0cHV0ID0gbWVyZ2Uob3V0cHV0LCBlKTtcclxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIEV2ZW50LnJlZHVjZSA9IHJlZHVjZTtcclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gYSBjaGFpbiBvZiBldmVudCBwcm9jZXNzaW5nIGZ1bmN0aW9ucyAoZmlsdGVyLCBtYXAsIGV0YyksIGVhY2hcclxuICAgICAqIGZ1bmN0aW9uIHdpbGwgYmUgaW52b2tlZCBwZXIgZXZlbnQgJiBwZXIgbGlzdGVuZXIuIFNuYXBzaG90dGluZyBhbiBldmVudFxyXG4gICAgICogY2hhaW4gYWxsb3dzIGVhY2ggZnVuY3Rpb24gdG8gYmUgaW52b2tlZCBqdXN0IG9uY2UgcGVyIGV2ZW50LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBzbmFwc2hvdChldmVudCkge1xyXG4gICAgICAgIGxldCBsaXN0ZW5lcjtcclxuICAgICAgICBjb25zdCBlbWl0dGVyID0gbmV3IEVtaXR0ZXIoe1xyXG4gICAgICAgICAgICBvbkZpcnN0TGlzdGVuZXJBZGQoKSB7XHJcbiAgICAgICAgICAgICAgICBsaXN0ZW5lciA9IGV2ZW50KGVtaXR0ZXIuZmlyZSwgZW1pdHRlcik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uTGFzdExpc3RlbmVyUmVtb3ZlKCkge1xyXG4gICAgICAgICAgICAgICAgbGlzdGVuZXIuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGVtaXR0ZXIuZXZlbnQ7XHJcbiAgICB9XHJcbiAgICBFdmVudC5zbmFwc2hvdCA9IHNuYXBzaG90O1xyXG4gICAgZnVuY3Rpb24gZGVib3VuY2UoZXZlbnQsIG1lcmdlLCBkZWxheSA9IDEwMCwgbGVhZGluZyA9IGZhbHNlLCBsZWFrV2FybmluZ1RocmVzaG9sZCkge1xyXG4gICAgICAgIGxldCBzdWJzY3JpcHRpb247XHJcbiAgICAgICAgbGV0IG91dHB1dCA9IHVuZGVmaW5lZDtcclxuICAgICAgICBsZXQgaGFuZGxlID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIGxldCBudW1EZWJvdW5jZWRDYWxscyA9IDA7XHJcbiAgICAgICAgY29uc3QgZW1pdHRlciA9IG5ldyBFbWl0dGVyKHtcclxuICAgICAgICAgICAgbGVha1dhcm5pbmdUaHJlc2hvbGQsXHJcbiAgICAgICAgICAgIG9uRmlyc3RMaXN0ZW5lckFkZCgpIHtcclxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbiA9IGV2ZW50KGN1ciA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbnVtRGVib3VuY2VkQ2FsbHMrKztcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXQgPSBtZXJnZShvdXRwdXQsIGN1cik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlYWRpbmcgJiYgIWhhbmRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbWl0dGVyLmZpcmUob3V0cHV0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoaGFuZGxlKTtcclxuICAgICAgICAgICAgICAgICAgICBoYW5kbGUgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgX291dHB1dCA9IG91dHB1dDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGUgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbGVhZGluZyB8fCBudW1EZWJvdW5jZWRDYWxscyA+IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtaXR0ZXIuZmlyZShfb3V0cHV0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBudW1EZWJvdW5jZWRDYWxscyA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgZGVsYXkpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uTGFzdExpc3RlbmVyUmVtb3ZlKCkge1xyXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBlbWl0dGVyLmV2ZW50O1xyXG4gICAgfVxyXG4gICAgRXZlbnQuZGVib3VuY2UgPSBkZWJvdW5jZTtcclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gYW4gZXZlbnQsIGl0IHJldHVybnMgYW5vdGhlciBldmVudCB3aGljaCBmaXJlcyBvbmx5IG9uY2UgYW5kIGFzIHNvb24gYXNcclxuICAgICAqIHRoZSBpbnB1dCBldmVudCBlbWl0cy4gVGhlIGV2ZW50IGRhdGEgaXMgdGhlIG51bWJlciBvZiBtaWxsaXMgaXQgdG9vayBmb3IgdGhlXHJcbiAgICAgKiBldmVudCB0byBmaXJlLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBzdG9wd2F0Y2goZXZlbnQpIHtcclxuICAgICAgICBjb25zdCBzdGFydCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgIHJldHVybiBtYXAob25jZShldmVudCksIF8gPT4gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydCk7XHJcbiAgICB9XHJcbiAgICBFdmVudC5zdG9wd2F0Y2ggPSBzdG9wd2F0Y2g7XHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGFuIGV2ZW50LCBpdCByZXR1cm5zIGFub3RoZXIgZXZlbnQgd2hpY2ggZmlyZXMgb25seSB3aGVuIHRoZSBldmVudFxyXG4gICAgICogZWxlbWVudCBjaGFuZ2VzLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBsYXRjaChldmVudCkge1xyXG4gICAgICAgIGxldCBmaXJzdENhbGwgPSB0cnVlO1xyXG4gICAgICAgIGxldCBjYWNoZTtcclxuICAgICAgICByZXR1cm4gZmlsdGVyKGV2ZW50LCB2YWx1ZSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNob3VsZEVtaXQgPSBmaXJzdENhbGwgfHwgdmFsdWUgIT09IGNhY2hlO1xyXG4gICAgICAgICAgICBmaXJzdENhbGwgPSBmYWxzZTtcclxuICAgICAgICAgICAgY2FjaGUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHNob3VsZEVtaXQ7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBFdmVudC5sYXRjaCA9IGxhdGNoO1xyXG4gICAgLyoqXHJcbiAgICAgKiBCdWZmZXJzIHRoZSBwcm92aWRlZCBldmVudCB1bnRpbCBhIGZpcnN0IGxpc3RlbmVyIGNvbWVzXHJcbiAgICAgKiBhbG9uZywgYXQgd2hpY2ggcG9pbnQgZmlyZSBhbGwgdGhlIGV2ZW50cyBhdCBvbmNlIGFuZFxyXG4gICAgICogcGlwZSB0aGUgZXZlbnQgZnJvbSB0aGVuIG9uLlxyXG4gICAgICpcclxuICAgICAqIGBgYHR5cGVzY3JpcHRcclxuICAgICAqIGNvbnN0IGVtaXR0ZXIgPSBuZXcgRW1pdHRlcjxudW1iZXI+KCk7XHJcbiAgICAgKiBjb25zdCBldmVudCA9IGVtaXR0ZXIuZXZlbnQ7XHJcbiAgICAgKiBjb25zdCBidWZmZXJlZEV2ZW50ID0gYnVmZmVyKGV2ZW50KTtcclxuICAgICAqXHJcbiAgICAgKiBlbWl0dGVyLmZpcmUoMSk7XHJcbiAgICAgKiBlbWl0dGVyLmZpcmUoMik7XHJcbiAgICAgKiBlbWl0dGVyLmZpcmUoMyk7XHJcbiAgICAgKiAvLyBub3RoaW5nLi4uXHJcbiAgICAgKlxyXG4gICAgICogY29uc3QgbGlzdGVuZXIgPSBidWZmZXJlZEV2ZW50KG51bSA9PiBjb25zb2xlLmxvZyhudW0pKTtcclxuICAgICAqIC8vIDEsIDIsIDNcclxuICAgICAqXHJcbiAgICAgKiBlbWl0dGVyLmZpcmUoNCk7XHJcbiAgICAgKiAvLyA0XHJcbiAgICAgKiBgYGBcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gYnVmZmVyKGV2ZW50LCBuZXh0VGljayA9IGZhbHNlLCBfYnVmZmVyID0gW10pIHtcclxuICAgICAgICBsZXQgYnVmZmVyID0gX2J1ZmZlci5zbGljZSgpO1xyXG4gICAgICAgIGxldCBsaXN0ZW5lciA9IGV2ZW50KGUgPT4ge1xyXG4gICAgICAgICAgICBpZiAoYnVmZmVyKSB7XHJcbiAgICAgICAgICAgICAgICBidWZmZXIucHVzaChlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVtaXR0ZXIuZmlyZShlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnN0IGZsdXNoID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoYnVmZmVyKSB7XHJcbiAgICAgICAgICAgICAgICBidWZmZXIuZm9yRWFjaChlID0+IGVtaXR0ZXIuZmlyZShlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnVmZmVyID0gbnVsbDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGNvbnN0IGVtaXR0ZXIgPSBuZXcgRW1pdHRlcih7XHJcbiAgICAgICAgICAgIG9uRmlyc3RMaXN0ZW5lckFkZCgpIHtcclxuICAgICAgICAgICAgICAgIGlmICghbGlzdGVuZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lciA9IGV2ZW50KGUgPT4gZW1pdHRlci5maXJlKGUpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb25GaXJzdExpc3RlbmVyRGlkQWRkKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0VGljaykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsdXNoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbkxhc3RMaXN0ZW5lclJlbW92ZSgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxpc3RlbmVyID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBlbWl0dGVyLmV2ZW50O1xyXG4gICAgfVxyXG4gICAgRXZlbnQuYnVmZmVyID0gYnVmZmVyO1xyXG4gICAgY2xhc3MgQ2hhaW5hYmxlRXZlbnQge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnQgPSBldmVudDtcclxuICAgICAgICB9XHJcbiAgICAgICAgbWFwKGZuKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ2hhaW5hYmxlRXZlbnQobWFwKHRoaXMuZXZlbnQsIGZuKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvckVhY2goZm4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBDaGFpbmFibGVFdmVudChmb3JFYWNoKHRoaXMuZXZlbnQsIGZuKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbHRlcihmbikge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IENoYWluYWJsZUV2ZW50KGZpbHRlcih0aGlzLmV2ZW50LCBmbikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZWR1Y2UobWVyZ2UsIGluaXRpYWwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBDaGFpbmFibGVFdmVudChyZWR1Y2UodGhpcy5ldmVudCwgbWVyZ2UsIGluaXRpYWwpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGF0Y2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ2hhaW5hYmxlRXZlbnQobGF0Y2godGhpcy5ldmVudCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkZWJvdW5jZShtZXJnZSwgZGVsYXkgPSAxMDAsIGxlYWRpbmcgPSBmYWxzZSwgbGVha1dhcm5pbmdUaHJlc2hvbGQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBDaGFpbmFibGVFdmVudChkZWJvdW5jZSh0aGlzLmV2ZW50LCBtZXJnZSwgZGVsYXksIGxlYWRpbmcsIGxlYWtXYXJuaW5nVGhyZXNob2xkKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9uKGxpc3RlbmVyLCB0aGlzQXJncywgZGlzcG9zYWJsZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQobGlzdGVuZXIsIHRoaXNBcmdzLCBkaXNwb3NhYmxlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9uY2UobGlzdGVuZXIsIHRoaXNBcmdzLCBkaXNwb3NhYmxlcykge1xyXG4gICAgICAgICAgICByZXR1cm4gb25jZSh0aGlzLmV2ZW50KShsaXN0ZW5lciwgdGhpc0FyZ3MsIGRpc3Bvc2FibGVzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBjaGFpbihldmVudCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgQ2hhaW5hYmxlRXZlbnQoZXZlbnQpO1xyXG4gICAgfVxyXG4gICAgRXZlbnQuY2hhaW4gPSBjaGFpbjtcclxuICAgIGZ1bmN0aW9uIGZyb21Ob2RlRXZlbnRFbWl0dGVyKGVtaXR0ZXIsIGV2ZW50TmFtZSwgbWFwID0gaWQgPT4gaWQpIHtcclxuICAgICAgICBjb25zdCBmbiA9ICguLi5hcmdzKSA9PiByZXN1bHQuZmlyZShtYXAoLi4uYXJncykpO1xyXG4gICAgICAgIGNvbnN0IG9uRmlyc3RMaXN0ZW5lckFkZCA9ICgpID0+IGVtaXR0ZXIub24oZXZlbnROYW1lLCBmbik7XHJcbiAgICAgICAgY29uc3Qgb25MYXN0TGlzdGVuZXJSZW1vdmUgPSAoKSA9PiBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKGV2ZW50TmFtZSwgZm4pO1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBFbWl0dGVyKHsgb25GaXJzdExpc3RlbmVyQWRkLCBvbkxhc3RMaXN0ZW5lclJlbW92ZSB9KTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0LmV2ZW50O1xyXG4gICAgfVxyXG4gICAgRXZlbnQuZnJvbU5vZGVFdmVudEVtaXR0ZXIgPSBmcm9tTm9kZUV2ZW50RW1pdHRlcjtcclxuICAgIGZ1bmN0aW9uIGZyb21ET01FdmVudEVtaXR0ZXIoZW1pdHRlciwgZXZlbnROYW1lLCBtYXAgPSBpZCA9PiBpZCkge1xyXG4gICAgICAgIGNvbnN0IGZuID0gKC4uLmFyZ3MpID0+IHJlc3VsdC5maXJlKG1hcCguLi5hcmdzKSk7XHJcbiAgICAgICAgY29uc3Qgb25GaXJzdExpc3RlbmVyQWRkID0gKCkgPT4gZW1pdHRlci5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZm4pO1xyXG4gICAgICAgIGNvbnN0IG9uTGFzdExpc3RlbmVyUmVtb3ZlID0gKCkgPT4gZW1pdHRlci5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZm4pO1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBFbWl0dGVyKHsgb25GaXJzdExpc3RlbmVyQWRkLCBvbkxhc3RMaXN0ZW5lclJlbW92ZSB9KTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0LmV2ZW50O1xyXG4gICAgfVxyXG4gICAgRXZlbnQuZnJvbURPTUV2ZW50RW1pdHRlciA9IGZyb21ET01FdmVudEVtaXR0ZXI7XHJcbiAgICBmdW5jdGlvbiBmcm9tUHJvbWlzZShwcm9taXNlKSB7XHJcbiAgICAgICAgY29uc3QgZW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XHJcbiAgICAgICAgbGV0IHNob3VsZEVtaXQgPSBmYWxzZTtcclxuICAgICAgICBwcm9taXNlXHJcbiAgICAgICAgICAgIC50aGVuKHVuZGVmaW5lZCwgKCkgPT4gbnVsbClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIXNob3VsZEVtaXQpIHtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gZW1pdHRlci5maXJlKHVuZGVmaW5lZCksIDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZW1pdHRlci5maXJlKHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBzaG91bGRFbWl0ID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gZW1pdHRlci5ldmVudDtcclxuICAgIH1cclxuICAgIEV2ZW50LmZyb21Qcm9taXNlID0gZnJvbVByb21pc2U7XHJcbiAgICBmdW5jdGlvbiB0b1Byb21pc2UoZXZlbnQpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYyA9PiBvbmNlKGV2ZW50KShjKSk7XHJcbiAgICB9XHJcbiAgICBFdmVudC50b1Byb21pc2UgPSB0b1Byb21pc2U7XHJcbn0pKGV4cG9ydHMuRXZlbnQgfHwgKGV4cG9ydHMuRXZlbnQgPSB7fSkpO1xyXG5sZXQgX2dsb2JhbExlYWtXYXJuaW5nVGhyZXNob2xkID0gLTE7XHJcbmZ1bmN0aW9uIHNldEdsb2JhbExlYWtXYXJuaW5nVGhyZXNob2xkKG4pIHtcclxuICAgIGNvbnN0IG9sZFZhbHVlID0gX2dsb2JhbExlYWtXYXJuaW5nVGhyZXNob2xkO1xyXG4gICAgX2dsb2JhbExlYWtXYXJuaW5nVGhyZXNob2xkID0gbjtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgX2dsb2JhbExlYWtXYXJuaW5nVGhyZXNob2xkID0gb2xkVmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5jbGFzcyBMZWFrYWdlTW9uaXRvciB7XHJcbiAgICBjb25zdHJ1Y3RvcihjdXN0b21UaHJlc2hvbGQsIG5hbWUgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDE4KS5zbGljZSgyLCA1KSkge1xyXG4gICAgICAgIHRoaXMuY3VzdG9tVGhyZXNob2xkID0gY3VzdG9tVGhyZXNob2xkO1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy5fd2FybkNvdW50ZG93biA9IDA7XHJcbiAgICB9XHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9zdGFja3MpIHtcclxuICAgICAgICAgICAgdGhpcy5fc3RhY2tzLmNsZWFyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY2hlY2sobGlzdGVuZXJDb3VudCkge1xyXG4gICAgICAgIGxldCB0aHJlc2hvbGQgPSBfZ2xvYmFsTGVha1dhcm5pbmdUaHJlc2hvbGQ7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmN1c3RvbVRocmVzaG9sZCA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgdGhyZXNob2xkID0gdGhpcy5jdXN0b21UaHJlc2hvbGQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aHJlc2hvbGQgPD0gMCB8fCBsaXN0ZW5lckNvdW50IDwgdGhyZXNob2xkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy5fc3RhY2tzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0YWNrcyA9IG5ldyBNYXAoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgc3RhY2sgPSBuZXcgRXJyb3IoKS5zdGFjay5zcGxpdCgnXFxuJykuc2xpY2UoMykuam9pbignXFxuJyk7XHJcbiAgICAgICAgY29uc3QgY291bnQgPSAodGhpcy5fc3RhY2tzLmdldChzdGFjaykgfHwgMCk7XHJcbiAgICAgICAgdGhpcy5fc3RhY2tzLnNldChzdGFjaywgY291bnQgKyAxKTtcclxuICAgICAgICB0aGlzLl93YXJuQ291bnRkb3duIC09IDE7XHJcbiAgICAgICAgaWYgKHRoaXMuX3dhcm5Db3VudGRvd24gPD0gMCkge1xyXG4gICAgICAgICAgICAvLyBvbmx5IHdhcm4gb24gZmlyc3QgZXhjZWVkIGFuZCB0aGVuIGV2ZXJ5IHRpbWUgdGhlIGxpbWl0XHJcbiAgICAgICAgICAgIC8vIGlzIGV4Y2VlZGVkIGJ5IDUwJSBhZ2FpblxyXG4gICAgICAgICAgICB0aGlzLl93YXJuQ291bnRkb3duID0gdGhyZXNob2xkICogMC41O1xyXG4gICAgICAgICAgICAvLyBmaW5kIG1vc3QgZnJlcXVlbnQgbGlzdGVuZXIgYW5kIHByaW50IHdhcm5pbmdcclxuICAgICAgICAgICAgbGV0IHRvcFN0YWNrO1xyXG4gICAgICAgICAgICBsZXQgdG9wQ291bnQgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtzdGFjaywgY291bnRdIG9mIHRoaXMuX3N0YWNrcykge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0b3BTdGFjayB8fCB0b3BDb3VudCA8IGNvdW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdG9wU3RhY2sgPSBzdGFjaztcclxuICAgICAgICAgICAgICAgICAgICB0b3BDb3VudCA9IGNvdW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgWyR7dGhpcy5uYW1lfV0gcG90ZW50aWFsIGxpc3RlbmVyIExFQUsgZGV0ZWN0ZWQsIGhhdmluZyAke2xpc3RlbmVyQ291bnR9IGxpc3RlbmVycyBhbHJlYWR5LiBNT1NUIGZyZXF1ZW50IGxpc3RlbmVyICgke3RvcENvdW50fSk6YCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybih0b3BTdGFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvdW50ID0gKHRoaXMuX3N0YWNrcy5nZXQoc3RhY2spIHx8IDApO1xyXG4gICAgICAgICAgICB0aGlzLl9zdGFja3Muc2V0KHN0YWNrLCBjb3VudCAtIDEpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn1cclxuLyoqXHJcbiAqIFRoZSBFbWl0dGVyIGNhbiBiZSB1c2VkIHRvIGV4cG9zZSBhbiBFdmVudCB0byB0aGUgcHVibGljXHJcbiAqIHRvIGZpcmUgaXQgZnJvbSB0aGUgaW5zaWRlcy5cclxuICogU2FtcGxlOlxyXG4gICAgY2xhc3MgRG9jdW1lbnQge1xyXG5cclxuICAgICAgICBwcml2YXRlIHJlYWRvbmx5IF9vbkRpZENoYW5nZSA9IG5ldyBFbWl0dGVyPCh2YWx1ZTpzdHJpbmcpPT5hbnk+KCk7XHJcblxyXG4gICAgICAgIHB1YmxpYyBvbkRpZENoYW5nZSA9IHRoaXMuX29uRGlkQ2hhbmdlLmV2ZW50O1xyXG5cclxuICAgICAgICAvLyBnZXR0ZXItc3R5bGVcclxuICAgICAgICAvLyBnZXQgb25EaWRDaGFuZ2UoKTogRXZlbnQ8KHZhbHVlOnN0cmluZyk9PmFueT4ge1xyXG4gICAgICAgIC8vIFx0cmV0dXJuIHRoaXMuX29uRGlkQ2hhbmdlLmV2ZW50O1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBfZG9JdCgpIHtcclxuICAgICAgICAgICAgLy8uLi5cclxuICAgICAgICAgICAgdGhpcy5fb25EaWRDaGFuZ2UuZmlyZSh2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gKi9cclxuY2xhc3MgRW1pdHRlciB7XHJcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl9vcHRpb25zID0gb3B0aW9ucztcclxuICAgICAgICB0aGlzLl9sZWFrYWdlTW9uID0gX2dsb2JhbExlYWtXYXJuaW5nVGhyZXNob2xkID4gMFxyXG4gICAgICAgICAgICA/IG5ldyBMZWFrYWdlTW9uaXRvcih0aGlzLl9vcHRpb25zICYmIHRoaXMuX29wdGlvbnMubGVha1dhcm5pbmdUaHJlc2hvbGQpXHJcbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBGb3IgdGhlIHB1YmxpYyB0byBhbGxvdyB0byBzdWJzY3JpYmVcclxuICAgICAqIHRvIGV2ZW50cyBmcm9tIHRoaXMgRW1pdHRlclxyXG4gICAgICovXHJcbiAgICBnZXQgZXZlbnQoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9ldmVudCkge1xyXG4gICAgICAgICAgICB0aGlzLl9ldmVudCA9IChsaXN0ZW5lciwgdGhpc0FyZ3MsIGRpc3Bvc2FibGVzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2xpc3RlbmVycykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xpc3RlbmVycyA9IG5ldyBsaW5rZWRMaXN0LkxpbmtlZExpc3QoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0TGlzdGVuZXIgPSB0aGlzLl9saXN0ZW5lcnMuaXNFbXB0eSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0TGlzdGVuZXIgJiYgdGhpcy5fb3B0aW9ucyAmJiB0aGlzLl9vcHRpb25zLm9uRmlyc3RMaXN0ZW5lckFkZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX29wdGlvbnMub25GaXJzdExpc3RlbmVyQWRkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVtb3ZlID0gdGhpcy5fbGlzdGVuZXJzLnB1c2goIXRoaXNBcmdzID8gbGlzdGVuZXIgOiBbbGlzdGVuZXIsIHRoaXNBcmdzXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3RMaXN0ZW5lciAmJiB0aGlzLl9vcHRpb25zICYmIHRoaXMuX29wdGlvbnMub25GaXJzdExpc3RlbmVyRGlkQWRkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fb3B0aW9ucy5vbkZpcnN0TGlzdGVuZXJEaWRBZGQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fb3B0aW9ucyAmJiB0aGlzLl9vcHRpb25zLm9uTGlzdGVuZXJEaWRBZGQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9vcHRpb25zLm9uTGlzdGVuZXJEaWRBZGQodGhpcywgbGlzdGVuZXIsIHRoaXNBcmdzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGFuZCByZWNvcmQgdGhpcyBlbWl0dGVyIGZvciBwb3RlbnRpYWwgbGVha2FnZVxyXG4gICAgICAgICAgICAgICAgbGV0IHJlbW92ZU1vbml0b3I7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbGVha2FnZU1vbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZU1vbml0b3IgPSB0aGlzLl9sZWFrYWdlTW9uLmNoZWNrKHRoaXMuX2xpc3RlbmVycy5zaXplKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlzcG9zZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVtb3ZlTW9uaXRvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlTW9uaXRvcigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5kaXNwb3NlID0gRW1pdHRlci5fbm9vcDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9kaXNwb3NlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fb3B0aW9ucyAmJiB0aGlzLl9vcHRpb25zLm9uTGFzdExpc3RlbmVyUmVtb3ZlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaGFzTGlzdGVuZXJzID0gKHRoaXMuX2xpc3RlbmVycyAmJiAhdGhpcy5fbGlzdGVuZXJzLmlzRW1wdHkoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFoYXNMaXN0ZW5lcnMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fb3B0aW9ucy5vbkxhc3RMaXN0ZW5lclJlbW92ZSh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgaWYgKGRpc3Bvc2FibGVzIGluc3RhbmNlb2YgbGlmZWN5Y2xlLkRpc3Bvc2FibGVTdG9yZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpc3Bvc2FibGVzLmFkZChyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShkaXNwb3NhYmxlcykpIHtcclxuICAgICAgICAgICAgICAgICAgICBkaXNwb3NhYmxlcy5wdXNoKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5fZXZlbnQ7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIFRvIGJlIGtlcHQgcHJpdmF0ZSB0byBmaXJlIGFuIGV2ZW50IHRvXHJcbiAgICAgKiBzdWJzY3JpYmVyc1xyXG4gICAgICovXHJcbiAgICBmaXJlKGV2ZW50KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2xpc3RlbmVycykge1xyXG4gICAgICAgICAgICAvLyBwdXQgYWxsIFtsaXN0ZW5lcixldmVudF0tcGFpcnMgaW50byBkZWxpdmVyeSBxdWV1ZVxyXG4gICAgICAgICAgICAvLyB0aGVuIGVtaXQgYWxsIGV2ZW50LiBhbiBpbm5lci9uZXN0ZWQgZXZlbnQgbWlnaHQgYmVcclxuICAgICAgICAgICAgLy8gdGhlIGRyaXZlciBvZiB0aGlzXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5fZGVsaXZlcnlRdWV1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZGVsaXZlcnlRdWV1ZSA9IG5ldyBsaW5rZWRMaXN0LkxpbmtlZExpc3QoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2RlbGl2ZXJ5UXVldWUucHVzaChbbGlzdGVuZXIsIGV2ZW50XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgd2hpbGUgKHRoaXMuX2RlbGl2ZXJ5UXVldWUuc2l6ZSA+IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IFtsaXN0ZW5lciwgZXZlbnRdID0gdGhpcy5fZGVsaXZlcnlRdWV1ZS5zaGlmdCgpO1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyLmNhbGwodW5kZWZpbmVkLCBldmVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lclswXS5jYWxsKGxpc3RlbmVyWzFdLCBldmVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMub25VbmV4cGVjdGVkRXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAgICAgdGhpcy5fbGlzdGVuZXJzLmNsZWFyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9kZWxpdmVyeVF1ZXVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2RlbGl2ZXJ5UXVldWUuY2xlYXIoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2xlYWthZ2VNb24pIHtcclxuICAgICAgICAgICAgdGhpcy5fbGVha2FnZU1vbi5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2VkID0gdHJ1ZTtcclxuICAgIH1cclxufVxyXG5FbWl0dGVyLl9ub29wID0gZnVuY3Rpb24gKCkgeyB9O1xyXG5jbGFzcyBQYXVzZWFibGVFbWl0dGVyIGV4dGVuZHMgRW1pdHRlciB7XHJcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XHJcbiAgICAgICAgc3VwZXIob3B0aW9ucyk7XHJcbiAgICAgICAgdGhpcy5faXNQYXVzZWQgPSAwO1xyXG4gICAgICAgIHRoaXMuX2V2ZW50UXVldWUgPSBuZXcgbGlua2VkTGlzdC5MaW5rZWRMaXN0KCk7XHJcbiAgICAgICAgdGhpcy5fbWVyZ2VGbiA9IG9wdGlvbnMgJiYgb3B0aW9ucy5tZXJnZTtcclxuICAgIH1cclxuICAgIHBhdXNlKCkge1xyXG4gICAgICAgIHRoaXMuX2lzUGF1c2VkKys7XHJcbiAgICB9XHJcbiAgICByZXN1bWUoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2lzUGF1c2VkICE9PSAwICYmIC0tdGhpcy5faXNQYXVzZWQgPT09IDApIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX21lcmdlRm4pIHtcclxuICAgICAgICAgICAgICAgIC8vIHVzZSB0aGUgbWVyZ2UgZnVuY3Rpb24gdG8gY3JlYXRlIGEgc2luZ2xlIGNvbXBvc2l0ZVxyXG4gICAgICAgICAgICAgICAgLy8gZXZlbnQuIG1ha2UgYSBjb3B5IGluIGNhc2UgZmlyaW5nIHBhdXNlcyB0aGlzIGVtaXR0ZXJcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50cyA9IHRoaXMuX2V2ZW50UXVldWUudG9BcnJheSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRRdWV1ZS5jbGVhcigpO1xyXG4gICAgICAgICAgICAgICAgc3VwZXIuZmlyZSh0aGlzLl9tZXJnZUZuKGV2ZW50cykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gbm8gbWVyZ2luZywgZmlyZSBlYWNoIGV2ZW50IGluZGl2aWR1YWxseSBhbmQgdGVzdFxyXG4gICAgICAgICAgICAgICAgLy8gdGhhdCB0aGlzIGVtaXR0ZXIgaXNuJ3QgcGF1c2VkIGhhbGZ3YXkgdGhyb3VnaFxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKCF0aGlzLl9pc1BhdXNlZCAmJiB0aGlzLl9ldmVudFF1ZXVlLnNpemUgIT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBzdXBlci5maXJlKHRoaXMuX2V2ZW50UXVldWUuc2hpZnQoKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmaXJlKGV2ZW50KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2xpc3RlbmVycykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5faXNQYXVzZWQgIT09IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50UXVldWUucHVzaChldmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzdXBlci5maXJlKGV2ZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5jbGFzcyBBc3luY0VtaXR0ZXIgZXh0ZW5kcyBFbWl0dGVyIHtcclxuICAgIGFzeW5jIGZpcmVBc3luYyhkYXRhLCB0b2tlbiwgcHJvbWlzZUpvaW4pIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2xpc3RlbmVycykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy5fYXN5bmNEZWxpdmVyeVF1ZXVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2FzeW5jRGVsaXZlcnlRdWV1ZSA9IG5ldyBsaW5rZWRMaXN0LkxpbmtlZExpc3QoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiB0aGlzLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAgICAgdGhpcy5fYXN5bmNEZWxpdmVyeVF1ZXVlLnB1c2goW2xpc3RlbmVyLCBkYXRhXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdoaWxlICh0aGlzLl9hc3luY0RlbGl2ZXJ5UXVldWUuc2l6ZSA+IDAgJiYgIXRva2VuLmlzQ2FuY2VsbGF0aW9uUmVxdWVzdGVkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IFtsaXN0ZW5lciwgZGF0YV0gPSB0aGlzLl9hc3luY0RlbGl2ZXJ5UXVldWUuc2hpZnQoKTtcclxuICAgICAgICAgICAgY29uc3QgdGhlbmFibGVzID0gW107XHJcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBkYXRhKSwgeyB3YWl0VW50aWw6IChwKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5pc0Zyb3plbih0aGVuYWJsZXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignd2FpdFVudGlsIGNhbiBOT1QgYmUgY2FsbGVkIGFzeW5jaHJvbm91cycpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvbWlzZUpvaW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcCA9IHByb21pc2VKb2luKHAsIHR5cGVvZiBsaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJyA/IGxpc3RlbmVyIDogbGlzdGVuZXJbMF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGVuYWJsZXMucHVzaChwKTtcclxuICAgICAgICAgICAgICAgIH0gfSk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIuY2FsbCh1bmRlZmluZWQsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyWzBdLmNhbGwobGlzdGVuZXJbMV0sIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgZXJyb3JzLm9uVW5leHBlY3RlZEVycm9yKGUpO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gZnJlZXplIHRoZW5hYmxlcy1jb2xsZWN0aW9uIHRvIGVuZm9yY2Ugc3luYy1jYWxscyB0b1xyXG4gICAgICAgICAgICAvLyB3YWl0IHVudGlsIGFuZCB0aGVuIHdhaXQgZm9yIGFsbCB0aGVuYWJsZXMgdG8gcmVzb2x2ZVxyXG4gICAgICAgICAgICBPYmplY3QuZnJlZXplKHRoZW5hYmxlcyk7XHJcbiAgICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHRoZW5hYmxlcykuY2F0Y2goZSA9PiBlcnJvcnMub25VbmV4cGVjdGVkRXJyb3IoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5jbGFzcyBFdmVudE11bHRpcGxleGVyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuaGFzTGlzdGVuZXJzID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5ldmVudHMgPSBbXTtcclxuICAgICAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgRW1pdHRlcih7XHJcbiAgICAgICAgICAgIG9uRmlyc3RMaXN0ZW5lckFkZDogKCkgPT4gdGhpcy5vbkZpcnN0TGlzdGVuZXJBZGQoKSxcclxuICAgICAgICAgICAgb25MYXN0TGlzdGVuZXJSZW1vdmU6ICgpID0+IHRoaXMub25MYXN0TGlzdGVuZXJSZW1vdmUoKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZ2V0IGV2ZW50KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmVtaXR0ZXIuZXZlbnQ7XHJcbiAgICB9XHJcbiAgICBhZGQoZXZlbnQpIHtcclxuICAgICAgICBjb25zdCBlID0geyBldmVudDogZXZlbnQsIGxpc3RlbmVyOiBudWxsIH07XHJcbiAgICAgICAgdGhpcy5ldmVudHMucHVzaChlKTtcclxuICAgICAgICBpZiAodGhpcy5oYXNMaXN0ZW5lcnMpIHtcclxuICAgICAgICAgICAgdGhpcy5ob29rKGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBkaXNwb3NlID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5oYXNMaXN0ZW5lcnMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudW5ob29rKGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IGlkeCA9IHRoaXMuZXZlbnRzLmluZGV4T2YoZSk7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIGxpZmVjeWNsZS50b0Rpc3Bvc2FibGUoZnVuY3Rpb25hbC5vbmNlKGRpc3Bvc2UpKTtcclxuICAgIH1cclxuICAgIG9uRmlyc3RMaXN0ZW5lckFkZCgpIHtcclxuICAgICAgICB0aGlzLmhhc0xpc3RlbmVycyA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5ldmVudHMuZm9yRWFjaChlID0+IHRoaXMuaG9vayhlKSk7XHJcbiAgICB9XHJcbiAgICBvbkxhc3RMaXN0ZW5lclJlbW92ZSgpIHtcclxuICAgICAgICB0aGlzLmhhc0xpc3RlbmVycyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZXZlbnRzLmZvckVhY2goZSA9PiB0aGlzLnVuaG9vayhlKSk7XHJcbiAgICB9XHJcbiAgICBob29rKGUpIHtcclxuICAgICAgICBlLmxpc3RlbmVyID0gZS5ldmVudChyID0+IHRoaXMuZW1pdHRlci5maXJlKHIpKTtcclxuICAgIH1cclxuICAgIHVuaG9vayhlKSB7XHJcbiAgICAgICAgaWYgKGUubGlzdGVuZXIpIHtcclxuICAgICAgICAgICAgZS5saXN0ZW5lci5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGUubGlzdGVuZXIgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmVtaXR0ZXIuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG59XHJcbi8qKlxyXG4gKiBUaGUgRXZlbnRCdWZmZXJlciBpcyB1c2VmdWwgaW4gc2l0dWF0aW9ucyBpbiB3aGljaCB5b3Ugd2FudFxyXG4gKiB0byBkZWxheSBmaXJpbmcgeW91ciBldmVudHMgZHVyaW5nIHNvbWUgY29kZS5cclxuICogWW91IGNhbiB3cmFwIHRoYXQgY29kZSBhbmQgYmUgc3VyZSB0aGF0IHRoZSBldmVudCB3aWxsIG5vdFxyXG4gKiBiZSBmaXJlZCBkdXJpbmcgdGhhdCB3cmFwLlxyXG4gKlxyXG4gKiBgYGBcclxuICogY29uc3QgZW1pdHRlcjogRW1pdHRlcjtcclxuICogY29uc3QgZGVsYXllciA9IG5ldyBFdmVudERlbGF5ZXIoKTtcclxuICogY29uc3QgZGVsYXllZEV2ZW50ID0gZGVsYXllci53cmFwRXZlbnQoZW1pdHRlci5ldmVudCk7XHJcbiAqXHJcbiAqIGRlbGF5ZWRFdmVudChjb25zb2xlLmxvZyk7XHJcbiAqXHJcbiAqIGRlbGF5ZXIuYnVmZmVyRXZlbnRzKCgpID0+IHtcclxuICogICBlbWl0dGVyLmZpcmUoKTsgLy8gZXZlbnQgd2lsbCBub3QgYmUgZmlyZWQgeWV0XHJcbiAqIH0pO1xyXG4gKlxyXG4gKiAvLyBldmVudCB3aWxsIG9ubHkgYmUgZmlyZWQgYXQgdGhpcyBwb2ludFxyXG4gKiBgYGBcclxuICovXHJcbmNsYXNzIEV2ZW50QnVmZmVyZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5idWZmZXJzID0gW107XHJcbiAgICB9XHJcbiAgICB3cmFwRXZlbnQoZXZlbnQpIHtcclxuICAgICAgICByZXR1cm4gKGxpc3RlbmVyLCB0aGlzQXJncywgZGlzcG9zYWJsZXMpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIGV2ZW50KGkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVmZmVyID0gdGhpcy5idWZmZXJzW3RoaXMuYnVmZmVycy5sZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgICAgIGlmIChidWZmZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBidWZmZXIucHVzaCgoKSA9PiBsaXN0ZW5lci5jYWxsKHRoaXNBcmdzLCBpKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lci5jYWxsKHRoaXNBcmdzLCBpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgdW5kZWZpbmVkLCBkaXNwb3NhYmxlcyk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIGJ1ZmZlckV2ZW50cyhmbikge1xyXG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IFtdO1xyXG4gICAgICAgIHRoaXMuYnVmZmVycy5wdXNoKGJ1ZmZlcik7XHJcbiAgICAgICAgY29uc3QgciA9IGZuKCk7XHJcbiAgICAgICAgdGhpcy5idWZmZXJzLnBvcCgpO1xyXG4gICAgICAgIGJ1ZmZlci5mb3JFYWNoKGZsdXNoID0+IGZsdXNoKCkpO1xyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgfVxyXG59XHJcbi8qKlxyXG4gKiBBIFJlbGF5IGlzIGFuIGV2ZW50IGZvcndhcmRlciB3aGljaCBmdW5jdGlvbnMgYXMgYSByZXBsdWdhYmJsZSBldmVudCBwaXBlLlxyXG4gKiBPbmNlIGNyZWF0ZWQsIHlvdSBjYW4gY29ubmVjdCBhbiBpbnB1dCBldmVudCB0byBpdCBhbmQgaXQgd2lsbCBzaW1wbHkgZm9yd2FyZFxyXG4gKiBldmVudHMgZnJvbSB0aGF0IGlucHV0IGV2ZW50IHRocm91Z2ggaXRzIG93biBgZXZlbnRgIHByb3BlcnR5LiBUaGUgYGlucHV0YFxyXG4gKiBjYW4gYmUgY2hhbmdlZCBhdCBhbnkgcG9pbnQgaW4gdGltZS5cclxuICovXHJcbmNsYXNzIFJlbGF5IHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMubGlzdGVuaW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5pbnB1dEV2ZW50ID0gZXhwb3J0cy5FdmVudC5Ob25lO1xyXG4gICAgICAgIHRoaXMuaW5wdXRFdmVudExpc3RlbmVyID0gbGlmZWN5Y2xlLkRpc3Bvc2FibGUuTm9uZTtcclxuICAgICAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgRW1pdHRlcih7XHJcbiAgICAgICAgICAgIG9uRmlyc3RMaXN0ZW5lckRpZEFkZDogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5saXN0ZW5pbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnB1dEV2ZW50TGlzdGVuZXIgPSB0aGlzLmlucHV0RXZlbnQodGhpcy5lbWl0dGVyLmZpcmUsIHRoaXMuZW1pdHRlcik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uTGFzdExpc3RlbmVyUmVtb3ZlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3RlbmluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnB1dEV2ZW50TGlzdGVuZXIuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5ldmVudCA9IHRoaXMuZW1pdHRlci5ldmVudDtcclxuICAgIH1cclxuICAgIHNldCBpbnB1dChldmVudCkge1xyXG4gICAgICAgIHRoaXMuaW5wdXRFdmVudCA9IGV2ZW50O1xyXG4gICAgICAgIGlmICh0aGlzLmxpc3RlbmluZykge1xyXG4gICAgICAgICAgICB0aGlzLmlucHV0RXZlbnRMaXN0ZW5lci5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5wdXRFdmVudExpc3RlbmVyID0gZXZlbnQodGhpcy5lbWl0dGVyLmZpcmUsIHRoaXMuZW1pdHRlcik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmlucHV0RXZlbnRMaXN0ZW5lci5kaXNwb3NlKCk7XHJcbiAgICAgICAgdGhpcy5lbWl0dGVyLmRpc3Bvc2UoKTtcclxuICAgIH1cclxufVxuXG5leHBvcnRzLkFzeW5jRW1pdHRlciA9IEFzeW5jRW1pdHRlcjtcbmV4cG9ydHMuRW1pdHRlciA9IEVtaXR0ZXI7XG5leHBvcnRzLkV2ZW50QnVmZmVyZXIgPSBFdmVudEJ1ZmZlcmVyO1xuZXhwb3J0cy5FdmVudE11bHRpcGxleGVyID0gRXZlbnRNdWx0aXBsZXhlcjtcbmV4cG9ydHMuUGF1c2VhYmxlRW1pdHRlciA9IFBhdXNlYWJsZUVtaXR0ZXI7XG5leHBvcnRzLlJlbGF5ID0gUmVsYXk7XG5leHBvcnRzLnNldEdsb2JhbExlYWtXYXJuaW5nVGhyZXNob2xkID0gc2V0R2xvYmFsTGVha1dhcm5pbmdUaHJlc2hvbGQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5mdW5jdGlvbiBvbmNlKGZuKSB7XHJcbiAgICBjb25zdCBfdGhpcyA9IHRoaXM7XHJcbiAgICBsZXQgZGlkQ2FsbCA9IGZhbHNlO1xyXG4gICAgbGV0IHJlc3VsdDtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKGRpZENhbGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZGlkQ2FsbCA9IHRydWU7XHJcbiAgICAgICAgcmVzdWx0ID0gZm4uYXBwbHkoX3RoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH07XHJcbn1cblxuZXhwb3J0cy5vbmNlID0gb25jZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbihmdW5jdGlvbiAoSXRlcmFibGUpIHtcclxuICAgIGZ1bmN0aW9uIGlzKHRoaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaW5nICYmIHR5cGVvZiB0aGluZyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHRoaW5nW1N5bWJvbC5pdGVyYXRvcl0gPT09ICdmdW5jdGlvbic7XHJcbiAgICB9XHJcbiAgICBJdGVyYWJsZS5pcyA9IGlzO1xyXG4gICAgY29uc3QgX2VtcHR5ID0gT2JqZWN0LmZyZWV6ZShbXSk7XHJcbiAgICBmdW5jdGlvbiBlbXB0eSgpIHtcclxuICAgICAgICByZXR1cm4gX2VtcHR5O1xyXG4gICAgfVxyXG4gICAgSXRlcmFibGUuZW1wdHkgPSBlbXB0eTtcclxuICAgIGZ1bmN0aW9uKiBzaW5nbGUoZWxlbWVudCkge1xyXG4gICAgICAgIHlpZWxkIGVsZW1lbnQ7XHJcbiAgICB9XHJcbiAgICBJdGVyYWJsZS5zaW5nbGUgPSBzaW5nbGU7XHJcbiAgICBmdW5jdGlvbiBmcm9tKGl0ZXJhYmxlKSB7XHJcbiAgICAgICAgcmV0dXJuIGl0ZXJhYmxlIHx8IF9lbXB0eTtcclxuICAgIH1cclxuICAgIEl0ZXJhYmxlLmZyb20gPSBmcm9tO1xyXG4gICAgZnVuY3Rpb24gZmlyc3QoaXRlcmFibGUpIHtcclxuICAgICAgICByZXR1cm4gaXRlcmFibGVbU3ltYm9sLml0ZXJhdG9yXSgpLm5leHQoKS52YWx1ZTtcclxuICAgIH1cclxuICAgIEl0ZXJhYmxlLmZpcnN0ID0gZmlyc3Q7XHJcbiAgICBmdW5jdGlvbiBzb21lKGl0ZXJhYmxlLCBwcmVkaWNhdGUpIHtcclxuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgaXRlcmFibGUpIHtcclxuICAgICAgICAgICAgaWYgKHByZWRpY2F0ZShlbGVtZW50KSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgSXRlcmFibGUuc29tZSA9IHNvbWU7XHJcbiAgICBmdW5jdGlvbiogZmlsdGVyKGl0ZXJhYmxlLCBwcmVkaWNhdGUpIHtcclxuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgaXRlcmFibGUpIHtcclxuICAgICAgICAgICAgaWYgKHByZWRpY2F0ZShlbGVtZW50KSkge1xyXG4gICAgICAgICAgICAgICAgeWllbGQgZWxlbWVudDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIEl0ZXJhYmxlLmZpbHRlciA9IGZpbHRlcjtcclxuICAgIGZ1bmN0aW9uKiBtYXAoaXRlcmFibGUsIGZuKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGl0ZXJhYmxlKSB7XHJcbiAgICAgICAgICAgIHlpZWxkIGZuKGVsZW1lbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIEl0ZXJhYmxlLm1hcCA9IG1hcDtcclxuICAgIGZ1bmN0aW9uKiBjb25jYXQoLi4uaXRlcmFibGVzKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBpdGVyYWJsZSBvZiBpdGVyYWJsZXMpIHtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGl0ZXJhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICB5aWVsZCBlbGVtZW50O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgSXRlcmFibGUuY29uY2F0ID0gY29uY2F0O1xyXG4gICAgLyoqXHJcbiAgICAgKiBDb25zdW1lcyBgYXRNb3N0YCBlbGVtZW50cyBmcm9tIGl0ZXJhYmxlIGFuZCByZXR1cm5zIHRoZSBjb25zdW1lZCBlbGVtZW50cyxcclxuICAgICAqIGFuZCBhbiBpdGVyYWJsZSBmb3IgdGhlIHJlc3Qgb2YgdGhlIGVsZW1lbnRzLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBjb25zdW1lKGl0ZXJhYmxlLCBhdE1vc3QgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkpIHtcclxuICAgICAgICBjb25zdCBjb25zdW1lZCA9IFtdO1xyXG4gICAgICAgIGlmIChhdE1vc3QgPT09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtjb25zdW1lZCwgaXRlcmFibGVdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBpdGVyYXRvciA9IGl0ZXJhYmxlW1N5bWJvbC5pdGVyYXRvcl0oKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0TW9zdDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5leHQgPSBpdGVyYXRvci5uZXh0KCk7XHJcbiAgICAgICAgICAgIGlmIChuZXh0LmRvbmUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBbY29uc3VtZWQsIEl0ZXJhYmxlLmVtcHR5KCldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN1bWVkLnB1c2gobmV4dC52YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbY29uc3VtZWQsIHsgW1N5bWJvbC5pdGVyYXRvcl0oKSB7IHJldHVybiBpdGVyYXRvcjsgfSB9XTtcclxuICAgIH1cclxuICAgIEl0ZXJhYmxlLmNvbnN1bWUgPSBjb25zdW1lO1xyXG59KShleHBvcnRzLkl0ZXJhYmxlIHx8IChleHBvcnRzLkl0ZXJhYmxlID0ge30pKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxudmFyIGZ1bmN0aW9uYWwgPSByZXF1aXJlKCcuLi8uLi8uLi9iYXNlL2NvbW1vbi9mdW5jdGlvbmFsL2luZGV4LmpzJyk7XG52YXIgaXRlcmF0b3IgPSByZXF1aXJlKCcuLi8uLi8uLi9iYXNlL2NvbW1vbi9pdGVyYXRvci9pbmRleC5qcycpO1xuXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxyXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuZnVuY3Rpb24gbWFya1RyYWNrZWQoeCkge1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiB0cmFja0Rpc3Bvc2FibGUoeCkge1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB4O1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIGlzRGlzcG9zYWJsZSh0aGluZykge1xyXG4gICAgcmV0dXJuIHR5cGVvZiB0aGluZy5kaXNwb3NlID09PSAnZnVuY3Rpb24nICYmIHRoaW5nLmRpc3Bvc2UubGVuZ3RoID09PSAwO1xyXG59XHJcbmZ1bmN0aW9uIGRpc3Bvc2UoYXJnKSB7XHJcbiAgICBpZiAoaXRlcmF0b3IuSXRlcmFibGUuaXMoYXJnKSkge1xyXG4gICAgICAgIGZvciAobGV0IGQgb2YgYXJnKSB7XHJcbiAgICAgICAgICAgIGlmIChkKSB7XHJcbiAgICAgICAgICAgICAgICBkLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShhcmcpID8gW10gOiBhcmc7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChhcmcpIHtcclxuICAgICAgICBhcmcuZGlzcG9zZSgpO1xyXG4gICAgICAgIHJldHVybiBhcmc7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gY29tYmluZWREaXNwb3NhYmxlKC4uLmRpc3Bvc2FibGVzKSB7XHJcbiAgICBkaXNwb3NhYmxlcy5mb3JFYWNoKG1hcmtUcmFja2VkKTtcclxuICAgIHJldHVybiB0cmFja0Rpc3Bvc2FibGUoeyBkaXNwb3NlOiAoKSA9PiBkaXNwb3NlKGRpc3Bvc2FibGVzKSB9KTtcclxufVxyXG5mdW5jdGlvbiB0b0Rpc3Bvc2FibGUoZm4pIHtcclxuICAgIGNvbnN0IHNlbGYgPSB0cmFja0Rpc3Bvc2FibGUoe1xyXG4gICAgICAgIGRpc3Bvc2U6ICgpID0+IHtcclxuICAgICAgICAgICAgZm4oKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBzZWxmO1xyXG59XHJcbmNsYXNzIERpc3Bvc2FibGVTdG9yZSB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLl90b0Rpc3Bvc2UgPSBuZXcgU2V0KCk7XHJcbiAgICAgICAgdGhpcy5faXNEaXNwb3NlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBEaXNwb3NlIG9mIGFsbCByZWdpc3RlcmVkIGRpc3Bvc2FibGVzIGFuZCBtYXJrIHRoaXMgb2JqZWN0IGFzIGRpc3Bvc2VkLlxyXG4gICAgICpcclxuICAgICAqIEFueSBmdXR1cmUgZGlzcG9zYWJsZXMgYWRkZWQgdG8gdGhpcyBvYmplY3Qgd2lsbCBiZSBkaXNwb3NlZCBvZiBvbiBgYWRkYC5cclxuICAgICAqL1xyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5faXNEaXNwb3NlZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2lzRGlzcG9zZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuY2xlYXIoKTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogRGlzcG9zZSBvZiBhbGwgcmVnaXN0ZXJlZCBkaXNwb3NhYmxlcyBidXQgZG8gbm90IG1hcmsgdGhpcyBvYmplY3QgYXMgZGlzcG9zZWQuXHJcbiAgICAgKi9cclxuICAgIGNsZWFyKCkge1xyXG4gICAgICAgIHRoaXMuX3RvRGlzcG9zZS5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5kaXNwb3NlKCkpO1xyXG4gICAgICAgIHRoaXMuX3RvRGlzcG9zZS5jbGVhcigpO1xyXG4gICAgfVxyXG4gICAgYWRkKHQpIHtcclxuICAgICAgICBpZiAoIXQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0ID09PSB0aGlzKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHJlZ2lzdGVyIGEgZGlzcG9zYWJsZSBvbiBpdHNlbGYhJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9pc0Rpc3Bvc2VkKSB7XHJcbiAgICAgICAgICAgIGlmICghRGlzcG9zYWJsZVN0b3JlLkRJU0FCTEVfRElTUE9TRURfV0FSTklORykge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKG5ldyBFcnJvcignVHJ5aW5nIHRvIGFkZCBhIGRpc3Bvc2FibGUgdG8gYSBEaXNwb3NhYmxlU3RvcmUgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIGRpc3Bvc2VkIG9mLiBUaGUgYWRkZWQgb2JqZWN0IHdpbGwgYmUgbGVha2VkIScpLnN0YWNrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fdG9EaXNwb3NlLmFkZCh0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICB9XHJcbn1cclxuRGlzcG9zYWJsZVN0b3JlLkRJU0FCTEVfRElTUE9TRURfV0FSTklORyA9IGZhbHNlO1xyXG5jbGFzcyBEaXNwb3NhYmxlIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuX3N0b3JlID0gbmV3IERpc3Bvc2FibGVTdG9yZSgpO1xyXG4gICAgfVxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLl9zdG9yZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcbiAgICBfcmVnaXN0ZXIodCkge1xyXG4gICAgICAgIGlmICh0ID09PSB0aGlzKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHJlZ2lzdGVyIGEgZGlzcG9zYWJsZSBvbiBpdHNlbGYhJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9zdG9yZS5hZGQodCk7XHJcbiAgICB9XHJcbn1cclxuRGlzcG9zYWJsZS5Ob25lID0gT2JqZWN0LmZyZWV6ZSh7IGRpc3Bvc2UoKSB7IH0gfSk7XHJcbi8qKlxyXG4gKiBNYW5hZ2VzIHRoZSBsaWZlY3ljbGUgb2YgYSBkaXNwb3NhYmxlIHZhbHVlIHRoYXQgbWF5IGJlIGNoYW5nZWQuXHJcbiAqXHJcbiAqIFRoaXMgZW5zdXJlcyB0aGF0IHdoZW4gdGhlIGRpc3Bvc2FibGUgdmFsdWUgaXMgY2hhbmdlZCwgdGhlIHByZXZpb3VzbHkgaGVsZCBkaXNwb3NhYmxlIGlzIGRpc3Bvc2VkIG9mLiBZb3UgY2FuXHJcbiAqIGFsc28gcmVnaXN0ZXIgYSBgTXV0YWJsZURpc3Bvc2FibGVgIG9uIGEgYERpc3Bvc2FibGVgIHRvIGVuc3VyZSBpdCBpcyBhdXRvbWF0aWNhbGx5IGNsZWFuZWQgdXAuXHJcbiAqL1xyXG5jbGFzcyBNdXRhYmxlRGlzcG9zYWJsZSB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLl9pc0Rpc3Bvc2VkID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBnZXQgdmFsdWUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzRGlzcG9zZWQgPyB1bmRlZmluZWQgOiB0aGlzLl92YWx1ZTtcclxuICAgIH1cclxuICAgIHNldCB2YWx1ZSh2YWx1ZSkge1xyXG4gICAgICAgIGlmICh0aGlzLl9pc0Rpc3Bvc2VkIHx8IHZhbHVlID09PSB0aGlzLl92YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl92YWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl92YWx1ZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICBjbGVhcigpIHtcclxuICAgICAgICB0aGlzLnZhbHVlID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLl9pc0Rpc3Bvc2VkID0gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5fdmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5fdmFsdWUuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl92YWx1ZSA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxufVxyXG5jbGFzcyBSZWZlcmVuY2VDb2xsZWN0aW9uIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMucmVmZXJlbmNlcyA9IG5ldyBNYXAoKTtcclxuICAgIH1cclxuICAgIGFjcXVpcmUoa2V5LCAuLi5hcmdzKSB7XHJcbiAgICAgICAgbGV0IHJlZmVyZW5jZSA9IHRoaXMucmVmZXJlbmNlcy5nZXQoa2V5KTtcclxuICAgICAgICBpZiAoIXJlZmVyZW5jZSkge1xyXG4gICAgICAgICAgICByZWZlcmVuY2UgPSB7IGNvdW50ZXI6IDAsIG9iamVjdDogdGhpcy5jcmVhdGVSZWZlcmVuY2VkT2JqZWN0KGtleSwgLi4uYXJncykgfTtcclxuICAgICAgICAgICAgdGhpcy5yZWZlcmVuY2VzLnNldChrZXksIHJlZmVyZW5jZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHsgb2JqZWN0IH0gPSByZWZlcmVuY2U7XHJcbiAgICAgICAgY29uc3QgZGlzcG9zZSA9IGZ1bmN0aW9uYWwub25jZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICgtLXJlZmVyZW5jZS5jb3VudGVyID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3lSZWZlcmVuY2VkT2JqZWN0KGtleSwgcmVmZXJlbmNlLm9iamVjdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlZmVyZW5jZXMuZGVsZXRlKGtleSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZWZlcmVuY2UuY291bnRlcisrO1xyXG4gICAgICAgIHJldHVybiB7IG9iamVjdCwgZGlzcG9zZSB9O1xyXG4gICAgfVxyXG59XHJcbmNsYXNzIEltbW9ydGFsUmVmZXJlbmNlIHtcclxuICAgIGNvbnN0cnVjdG9yKG9iamVjdCkge1xyXG4gICAgICAgIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xyXG4gICAgfVxyXG4gICAgZGlzcG9zZSgpIHsgfVxyXG59XG5cbmV4cG9ydHMuRGlzcG9zYWJsZSA9IERpc3Bvc2FibGU7XG5leHBvcnRzLkRpc3Bvc2FibGVTdG9yZSA9IERpc3Bvc2FibGVTdG9yZTtcbmV4cG9ydHMuSW1tb3J0YWxSZWZlcmVuY2UgPSBJbW1vcnRhbFJlZmVyZW5jZTtcbmV4cG9ydHMuTXV0YWJsZURpc3Bvc2FibGUgPSBNdXRhYmxlRGlzcG9zYWJsZTtcbmV4cG9ydHMuUmVmZXJlbmNlQ29sbGVjdGlvbiA9IFJlZmVyZW5jZUNvbGxlY3Rpb247XG5leHBvcnRzLmNvbWJpbmVkRGlzcG9zYWJsZSA9IGNvbWJpbmVkRGlzcG9zYWJsZTtcbmV4cG9ydHMuZGlzcG9zZSA9IGRpc3Bvc2U7XG5leHBvcnRzLmlzRGlzcG9zYWJsZSA9IGlzRGlzcG9zYWJsZTtcbmV4cG9ydHMudG9EaXNwb3NhYmxlID0gdG9EaXNwb3NhYmxlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxyXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuY2xhc3MgTm9kZSB7XHJcbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50KSB7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcclxuICAgICAgICB0aGlzLm5leHQgPSBOb2RlLlVuZGVmaW5lZDtcclxuICAgICAgICB0aGlzLnByZXYgPSBOb2RlLlVuZGVmaW5lZDtcclxuICAgIH1cclxufVxyXG5Ob2RlLlVuZGVmaW5lZCA9IG5ldyBOb2RlKHVuZGVmaW5lZCk7XHJcbmNsYXNzIExpbmtlZExpc3Qge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5fZmlyc3QgPSBOb2RlLlVuZGVmaW5lZDtcclxuICAgICAgICB0aGlzLl9sYXN0ID0gTm9kZS5VbmRlZmluZWQ7XHJcbiAgICAgICAgdGhpcy5fc2l6ZSA9IDA7XHJcbiAgICB9XHJcbiAgICBnZXQgc2l6ZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fc2l6ZTtcclxuICAgIH1cclxuICAgIGlzRW1wdHkoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpcnN0ID09PSBOb2RlLlVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIGNsZWFyKCkge1xyXG4gICAgICAgIHRoaXMuX2ZpcnN0ID0gTm9kZS5VbmRlZmluZWQ7XHJcbiAgICAgICAgdGhpcy5fbGFzdCA9IE5vZGUuVW5kZWZpbmVkO1xyXG4gICAgICAgIHRoaXMuX3NpemUgPSAwO1xyXG4gICAgfVxyXG4gICAgdW5zaGlmdChlbGVtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2luc2VydChlbGVtZW50LCBmYWxzZSk7XHJcbiAgICB9XHJcbiAgICBwdXNoKGVsZW1lbnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faW5zZXJ0KGVsZW1lbnQsIHRydWUpO1xyXG4gICAgfVxyXG4gICAgX2luc2VydChlbGVtZW50LCBhdFRoZUVuZCkge1xyXG4gICAgICAgIGNvbnN0IG5ld05vZGUgPSBuZXcgTm9kZShlbGVtZW50KTtcclxuICAgICAgICBpZiAodGhpcy5fZmlyc3QgPT09IE5vZGUuVW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpcnN0ID0gbmV3Tm9kZTtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdCA9IG5ld05vZGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGF0VGhlRW5kKSB7XHJcbiAgICAgICAgICAgIC8vIHB1c2hcclxuICAgICAgICAgICAgY29uc3Qgb2xkTGFzdCA9IHRoaXMuX2xhc3Q7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3QgPSBuZXdOb2RlO1xyXG4gICAgICAgICAgICBuZXdOb2RlLnByZXYgPSBvbGRMYXN0O1xyXG4gICAgICAgICAgICBvbGRMYXN0Lm5leHQgPSBuZXdOb2RlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gdW5zaGlmdFxyXG4gICAgICAgICAgICBjb25zdCBvbGRGaXJzdCA9IHRoaXMuX2ZpcnN0O1xyXG4gICAgICAgICAgICB0aGlzLl9maXJzdCA9IG5ld05vZGU7XHJcbiAgICAgICAgICAgIG5ld05vZGUubmV4dCA9IG9sZEZpcnN0O1xyXG4gICAgICAgICAgICBvbGRGaXJzdC5wcmV2ID0gbmV3Tm9kZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fc2l6ZSArPSAxO1xyXG4gICAgICAgIGxldCBkaWRSZW1vdmUgPSBmYWxzZTtcclxuICAgICAgICByZXR1cm4gKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIWRpZFJlbW92ZSkge1xyXG4gICAgICAgICAgICAgICAgZGlkUmVtb3ZlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3JlbW92ZShuZXdOb2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBzaGlmdCgpIHtcclxuICAgICAgICBpZiAodGhpcy5fZmlyc3QgPT09IE5vZGUuVW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zdCByZXMgPSB0aGlzLl9maXJzdC5lbGVtZW50O1xyXG4gICAgICAgICAgICB0aGlzLl9yZW1vdmUodGhpcy5fZmlyc3QpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHBvcCgpIHtcclxuICAgICAgICBpZiAodGhpcy5fbGFzdCA9PT0gTm9kZS5VbmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IHRoaXMuX2xhc3QuZWxlbWVudDtcclxuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlKHRoaXMuX2xhc3QpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIF9yZW1vdmUobm9kZSkge1xyXG4gICAgICAgIGlmIChub2RlLnByZXYgIT09IE5vZGUuVW5kZWZpbmVkICYmIG5vZGUubmV4dCAhPT0gTm9kZS5VbmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gbWlkZGxlXHJcbiAgICAgICAgICAgIGNvbnN0IGFuY2hvciA9IG5vZGUucHJldjtcclxuICAgICAgICAgICAgYW5jaG9yLm5leHQgPSBub2RlLm5leHQ7XHJcbiAgICAgICAgICAgIG5vZGUubmV4dC5wcmV2ID0gYW5jaG9yO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChub2RlLnByZXYgPT09IE5vZGUuVW5kZWZpbmVkICYmIG5vZGUubmV4dCA9PT0gTm9kZS5VbmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gb25seSBub2RlXHJcbiAgICAgICAgICAgIHRoaXMuX2ZpcnN0ID0gTm9kZS5VbmRlZmluZWQ7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3QgPSBOb2RlLlVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobm9kZS5uZXh0ID09PSBOb2RlLlVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAvLyBsYXN0XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3QgPSB0aGlzLl9sYXN0LnByZXY7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3QubmV4dCA9IE5vZGUuVW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChub2RlLnByZXYgPT09IE5vZGUuVW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIC8vIGZpcnN0XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpcnN0ID0gdGhpcy5fZmlyc3QubmV4dDtcclxuICAgICAgICAgICAgdGhpcy5fZmlyc3QucHJldiA9IE5vZGUuVW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBkb25lXHJcbiAgICAgICAgdGhpcy5fc2l6ZSAtPSAxO1xyXG4gICAgfVxyXG4gICAgKltTeW1ib2wuaXRlcmF0b3JdKCkge1xyXG4gICAgICAgIGxldCBub2RlID0gdGhpcy5fZmlyc3Q7XHJcbiAgICAgICAgd2hpbGUgKG5vZGUgIT09IE5vZGUuVW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHlpZWxkIG5vZGUuZWxlbWVudDtcclxuICAgICAgICAgICAgbm9kZSA9IG5vZGUubmV4dDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0b0FycmF5KCkge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAobGV0IG5vZGUgPSB0aGlzLl9maXJzdDsgbm9kZSAhPT0gTm9kZS5VbmRlZmluZWQ7IG5vZGUgPSBub2RlLm5leHQpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gobm9kZS5lbGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxufVxuXG5leHBvcnRzLkxpbmtlZExpc3QgPSBMaW5rZWRMaXN0O1xuIiwiLy8gSW1wb3J0c1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18gZnJvbSBcIi4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9jc3NXaXRoTWFwcGluZ1RvU3RyaW5nLmpzXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fIGZyb20gXCIuLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzXCI7XG52YXIgX19fQ1NTX0xPQURFUl9FWFBPUlRfX18gPSBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyk7XG4vLyBNb2R1bGVcbl9fX0NTU19MT0FERVJfRVhQT1JUX19fLnB1c2goW21vZHVsZS5pZCwgXCIuX19zY19vdmVybGF5IHtcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIGJhY2tncm91bmQ6ICNkZmI4YWI7XFxuICBib3JkZXI6IDFweCBzb2xpZCByZWQ7XFxuICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgb3BhY2l0eTogMC4zO1xcbn1cIiwgXCJcIix7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCJ3ZWJwYWNrOi8vLi9jb250ZW50L3NjcmVlbi5zY3NzXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJBQUFBO0VBQ0Usa0JBQUE7RUFDQSxtQkFBQTtFQUNBLHFCQUFBO0VBQ0Esc0JBQUE7RUFDQSxZQUFBO0FBQ0ZcIixcInNvdXJjZXNDb250ZW50XCI6W1wiLl9fc2Nfb3ZlcmxheSB7XFxyXFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxyXFxuICBiYWNrZ3JvdW5kOiByZ2IoMjIzLCAxODQsIDE3MSk7XFxyXFxuICBib3JkZXI6IDFweCBzb2xpZCByZWQ7XFxyXFxuICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcclxcbiAgb3BhY2l0eTogLjM7XFxyXFxufVwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuLy8gRXhwb3J0c1xuZXhwb3J0IGRlZmF1bHQgX19fQ1NTX0xPQURFUl9FWFBPUlRfX187XG4iLCIvLyBJbXBvcnRzXG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2Nzc1dpdGhNYXBwaW5nVG9TdHJpbmcuanNcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18gZnJvbSBcIi4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9hcGkuanNcIjtcbnZhciBfX19DU1NfTE9BREVSX0VYUE9SVF9fXyA9IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fKTtcbi8vIE1vZHVsZVxuX19fQ1NTX0xPQURFUl9FWFBPUlRfX18ucHVzaChbbW9kdWxlLmlkLCBcIi50b29sLW1lYXN1cmUge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgei1pbmRleDogNTtcXG4gIHRvcDogMDtcXG4gIGxlZnQ6IDA7XFxufVxcbi50b29sLW1lYXN1cmUgLmhvcml6b250YWwge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgdG9wOiAwO1xcbiAgaGVpZ2h0OiAxcHg7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiBjb3JuZmxvd2VyYmx1ZTtcXG59XFxuLnRvb2wtbWVhc3VyZSAudmVydGljYWwge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgbGVmdDogMDtcXG4gIHdpZHRoOiAxcHg7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiBjb3JuZmxvd2VyYmx1ZTtcXG59XFxuLnRvb2wtbWVhc3VyZSAubGFiZWwge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgZm9udC1zaXplOiAxMXB4O1xcbiAgYmFja2dyb3VuZDogYmxhY2s7XFxuICBjb2xvcjogd2hpdGU7XFxuICBwYWRkaW5nOiAzcHg7XFxuICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgb3BhY2l0eTogMTtcXG4gIGJvcmRlci1yYWRpdXM6IDdweDtcXG59XCIsIFwiXCIse1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wid2VicGFjazovLy4vY29udGVudC90b29sL21lYXN1cmUuc2Nzc1wiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiQUFBQTtFQUNFLGtCQUFBO0VBQ0EsVUFBQTtFQUNBLE1BQUE7RUFDQSxPQUFBO0FBQ0Y7QUFDRTtFQUNFLGtCQUFBO0VBQ0EsTUFBQTtFQUNBLFdBQUE7RUFDQSxnQ0FBQTtBQUNKO0FBRUU7RUFDRSxrQkFBQTtFQUNBLE9BQUE7RUFDQSxVQUFBO0VBQ0EsZ0NBQUE7QUFBSjtBQUdFO0VBQ0Usa0JBQUE7RUFDQSxlQUFBO0VBQ0EsaUJBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLHNCQUFBO0VBQ0EsVUFBQTtFQUNBLGtCQUFBO0FBREpcIixcInNvdXJjZXNDb250ZW50XCI6W1wiLnRvb2wtbWVhc3VyZSB7XFxyXFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxyXFxuICB6LWluZGV4OiA1O1xcclxcbiAgdG9wOiAwO1xcclxcbiAgbGVmdDogMDtcXHJcXG5cXHJcXG4gIC5ob3Jpem9udGFsIHtcXHJcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcclxcbiAgICB0b3A6IDA7XFxyXFxuICAgIGhlaWdodDogMXB4O1xcclxcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiBjb3JuZmxvd2VyYmx1ZTtcXHJcXG4gIH1cXHJcXG5cXHJcXG4gIC52ZXJ0aWNhbCB7XFxyXFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXHJcXG4gICAgbGVmdDogMDtcXHJcXG4gICAgd2lkdGg6IDFweDtcXHJcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogY29ybmZsb3dlcmJsdWU7XFxyXFxuICB9XFxyXFxuXFxyXFxuICAubGFiZWwge1xcclxcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxyXFxuICAgIGZvbnQtc2l6ZTogMTFweDtcXHJcXG4gICAgYmFja2dyb3VuZDogYmxhY2s7XFxyXFxuICAgIGNvbG9yOiB3aGl0ZTtcXHJcXG4gICAgcGFkZGluZzogM3B4O1xcclxcbiAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcclxcbiAgICBvcGFjaXR5OiAxO1xcclxcbiAgICBib3JkZXItcmFkaXVzOiA3cHg7XFxyXFxuICB9XFxyXFxuXFxyXFxufVwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuLy8gRXhwb3J0c1xuZXhwb3J0IGRlZmF1bHQgX19fQ1NTX0xPQURFUl9FWFBPUlRfX187XG4iLCIvLyBJbXBvcnRzXG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2Nzc1dpdGhNYXBwaW5nVG9TdHJpbmcuanNcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18gZnJvbSBcIi4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9hcGkuanNcIjtcbnZhciBfX19DU1NfTE9BREVSX0VYUE9SVF9fXyA9IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fKTtcbi8vIE1vZHVsZVxuX19fQ1NTX0xPQURFUl9FWFBPUlRfX18ucHVzaChbbW9kdWxlLmlkLCBcIi50b29sLXNlbGVjdCB7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICB6LWluZGV4OiAxO1xcbiAgdG9wOiAwO1xcbiAgbGVmdDogMDtcXG4gIHJpZ2h0OiAwO1xcbiAgYm90dG9tOiAwO1xcbiAgcG9pbnRlci1ldmVudHM6IGF1dG87XFxuICBjdXJzb3I6IG5vbmU7XFxufVxcbi50b29sLXNlbGVjdCAuaG92ZXJpbmcge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogc3RlZWxibHVlO1xcbiAgYm9yZGVyOiAxcHggc29saWQgcmVkO1xcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gIG9wYWNpdHk6IDAuMTtcXG59XFxuLnRvb2wtc2VsZWN0IC5zZWxlY3Rpbmcge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogc3RlZWxibHVlO1xcbiAgb3BhY2l0eTogMC4xNTtcXG59XCIsIFwiXCIse1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wid2VicGFjazovLy4vY29udGVudC90b29sL3NlbGVjdC5zY3NzXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJBQUFBO0VBQ0Usa0JBQUE7RUFDQSxVQUFBO0VBQ0EsTUFBQTtFQUNBLE9BQUE7RUFDQSxRQUFBO0VBQ0EsU0FBQTtFQUNBLG9CQUFBO0VBQ0EsWUFBQTtBQUNGO0FBQ0U7RUFDRSxrQkFBQTtFQUNBLDJCQUFBO0VBQ0EscUJBQUE7RUFDQSxzQkFBQTtFQUNBLFlBQUE7QUFDSjtBQUVFO0VBQ0Usa0JBQUE7RUFDQSwyQkFBQTtFQUNBLGFBQUE7QUFBSlwiLFwic291cmNlc0NvbnRlbnRcIjpbXCIudG9vbC1zZWxlY3Qge1xcclxcbiAgcG9zaXRpb246IGFic29sdXRlO1xcclxcbiAgei1pbmRleDogMTtcXHJcXG4gIHRvcDogMDtcXHJcXG4gIGxlZnQ6IDA7XFxyXFxuICByaWdodDogMDtcXHJcXG4gIGJvdHRvbTogMDtcXHJcXG4gIHBvaW50ZXItZXZlbnRzOiBhdXRvO1xcclxcbiAgY3Vyc29yOiBub25lO1xcclxcblxcclxcbiAgLmhvdmVyaW5nIHtcXHJcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcclxcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiBzdGVlbGJsdWU7XFxyXFxuICAgIGJvcmRlcjogMXB4IHNvbGlkIHJlZDtcXHJcXG4gICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcXHJcXG4gICAgb3BhY2l0eTogLjE7XFxyXFxuICB9XFxyXFxuXFxyXFxuICAuc2VsZWN0aW5nIHtcXHJcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcclxcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiBzdGVlbGJsdWU7XFxyXFxuICAgIG9wYWNpdHk6IC4xNTtcXHJcXG4gIH1cXHJcXG5cXHJcXG59XCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG4vLyBFeHBvcnRzXG5leHBvcnQgZGVmYXVsdCBfX19DU1NfTE9BREVSX0VYUE9SVF9fXztcbiIsIlwidXNlIHN0cmljdFwiO1xuXG4vKlxuICBNSVQgTGljZW5zZSBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuICBBdXRob3IgVG9iaWFzIEtvcHBlcnMgQHNva3JhXG4qL1xuLy8gY3NzIGJhc2UgY29kZSwgaW5qZWN0ZWQgYnkgdGhlIGNzcy1sb2FkZXJcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBmdW5jLW5hbWVzXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjc3NXaXRoTWFwcGluZ1RvU3RyaW5nKSB7XG4gIHZhciBsaXN0ID0gW107IC8vIHJldHVybiB0aGUgbGlzdCBvZiBtb2R1bGVzIGFzIGNzcyBzdHJpbmdcblxuICBsaXN0LnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICB2YXIgY29udGVudCA9IGNzc1dpdGhNYXBwaW5nVG9TdHJpbmcoaXRlbSk7XG5cbiAgICAgIGlmIChpdGVtWzJdKSB7XG4gICAgICAgIHJldHVybiBcIkBtZWRpYSBcIi5jb25jYXQoaXRlbVsyXSwgXCIge1wiKS5jb25jYXQoY29udGVudCwgXCJ9XCIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY29udGVudDtcbiAgICB9KS5qb2luKFwiXCIpO1xuICB9OyAvLyBpbXBvcnQgYSBsaXN0IG9mIG1vZHVsZXMgaW50byB0aGUgbGlzdFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZnVuYy1uYW1lc1xuXG5cbiAgbGlzdC5pID0gZnVuY3Rpb24gKG1vZHVsZXMsIG1lZGlhUXVlcnksIGRlZHVwZSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlcyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICBtb2R1bGVzID0gW1tudWxsLCBtb2R1bGVzLCBcIlwiXV07XG4gICAgfVxuXG4gICAgdmFyIGFscmVhZHlJbXBvcnRlZE1vZHVsZXMgPSB7fTtcblxuICAgIGlmIChkZWR1cGUpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcHJlZmVyLWRlc3RydWN0dXJpbmdcbiAgICAgICAgdmFyIGlkID0gdGhpc1tpXVswXTtcblxuICAgICAgICBpZiAoaWQgIT0gbnVsbCkge1xuICAgICAgICAgIGFscmVhZHlJbXBvcnRlZE1vZHVsZXNbaWRdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBtb2R1bGVzLmxlbmd0aDsgX2krKykge1xuICAgICAgdmFyIGl0ZW0gPSBbXS5jb25jYXQobW9kdWxlc1tfaV0pO1xuXG4gICAgICBpZiAoZGVkdXBlICYmIGFscmVhZHlJbXBvcnRlZE1vZHVsZXNbaXRlbVswXV0pIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnRpbnVlXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAobWVkaWFRdWVyeSkge1xuICAgICAgICBpZiAoIWl0ZW1bMl0pIHtcbiAgICAgICAgICBpdGVtWzJdID0gbWVkaWFRdWVyeTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpdGVtWzJdID0gXCJcIi5jb25jYXQobWVkaWFRdWVyeSwgXCIgYW5kIFwiKS5jb25jYXQoaXRlbVsyXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbGlzdC5wdXNoKGl0ZW0pO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gbGlzdDtcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF9zbGljZWRUb0FycmF5KGFyciwgaSkgeyByZXR1cm4gX2FycmF5V2l0aEhvbGVzKGFycikgfHwgX2l0ZXJhYmxlVG9BcnJheUxpbWl0KGFyciwgaSkgfHwgX3Vuc3VwcG9ydGVkSXRlcmFibGVUb0FycmF5KGFyciwgaSkgfHwgX25vbkl0ZXJhYmxlUmVzdCgpOyB9XG5cbmZ1bmN0aW9uIF9ub25JdGVyYWJsZVJlc3QoKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlLlxcbkluIG9yZGVyIHRvIGJlIGl0ZXJhYmxlLCBub24tYXJyYXkgb2JqZWN0cyBtdXN0IGhhdmUgYSBbU3ltYm9sLml0ZXJhdG9yXSgpIG1ldGhvZC5cIik7IH1cblxuZnVuY3Rpb24gX3Vuc3VwcG9ydGVkSXRlcmFibGVUb0FycmF5KG8sIG1pbkxlbikgeyBpZiAoIW8pIHJldHVybjsgaWYgKHR5cGVvZiBvID09PSBcInN0cmluZ1wiKSByZXR1cm4gX2FycmF5TGlrZVRvQXJyYXkobywgbWluTGVuKTsgdmFyIG4gPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobykuc2xpY2UoOCwgLTEpOyBpZiAobiA9PT0gXCJPYmplY3RcIiAmJiBvLmNvbnN0cnVjdG9yKSBuID0gby5jb25zdHJ1Y3Rvci5uYW1lOyBpZiAobiA9PT0gXCJNYXBcIiB8fCBuID09PSBcIlNldFwiKSByZXR1cm4gQXJyYXkuZnJvbShvKTsgaWYgKG4gPT09IFwiQXJndW1lbnRzXCIgfHwgL14oPzpVaXxJKW50KD86OHwxNnwzMikoPzpDbGFtcGVkKT9BcnJheSQvLnRlc3QobikpIHJldHVybiBfYXJyYXlMaWtlVG9BcnJheShvLCBtaW5MZW4pOyB9XG5cbmZ1bmN0aW9uIF9hcnJheUxpa2VUb0FycmF5KGFyciwgbGVuKSB7IGlmIChsZW4gPT0gbnVsbCB8fCBsZW4gPiBhcnIubGVuZ3RoKSBsZW4gPSBhcnIubGVuZ3RoOyBmb3IgKHZhciBpID0gMCwgYXJyMiA9IG5ldyBBcnJheShsZW4pOyBpIDwgbGVuOyBpKyspIHsgYXJyMltpXSA9IGFycltpXTsgfSByZXR1cm4gYXJyMjsgfVxuXG5mdW5jdGlvbiBfaXRlcmFibGVUb0FycmF5TGltaXQoYXJyLCBpKSB7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcInVuZGVmaW5lZFwiIHx8ICEoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSkgcmV0dXJuOyB2YXIgX2FyciA9IFtdOyB2YXIgX24gPSB0cnVlOyB2YXIgX2QgPSBmYWxzZTsgdmFyIF9lID0gdW5kZWZpbmVkOyB0cnkgeyBmb3IgKHZhciBfaSA9IGFycltTeW1ib2wuaXRlcmF0b3JdKCksIF9zOyAhKF9uID0gKF9zID0gX2kubmV4dCgpKS5kb25lKTsgX24gPSB0cnVlKSB7IF9hcnIucHVzaChfcy52YWx1ZSk7IGlmIChpICYmIF9hcnIubGVuZ3RoID09PSBpKSBicmVhazsgfSB9IGNhdGNoIChlcnIpIHsgX2QgPSB0cnVlOyBfZSA9IGVycjsgfSBmaW5hbGx5IHsgdHJ5IHsgaWYgKCFfbiAmJiBfaVtcInJldHVyblwiXSAhPSBudWxsKSBfaVtcInJldHVyblwiXSgpOyB9IGZpbmFsbHkgeyBpZiAoX2QpIHRocm93IF9lOyB9IH0gcmV0dXJuIF9hcnI7IH1cblxuZnVuY3Rpb24gX2FycmF5V2l0aEhvbGVzKGFycikgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSByZXR1cm4gYXJyOyB9XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3NzV2l0aE1hcHBpbmdUb1N0cmluZyhpdGVtKSB7XG4gIHZhciBfaXRlbSA9IF9zbGljZWRUb0FycmF5KGl0ZW0sIDQpLFxuICAgICAgY29udGVudCA9IF9pdGVtWzFdLFxuICAgICAgY3NzTWFwcGluZyA9IF9pdGVtWzNdO1xuXG4gIGlmICh0eXBlb2YgYnRvYSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG4gICAgdmFyIGJhc2U2NCA9IGJ0b2EodW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KGNzc01hcHBpbmcpKSkpO1xuICAgIHZhciBkYXRhID0gXCJzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04O2Jhc2U2NCxcIi5jb25jYXQoYmFzZTY0KTtcbiAgICB2YXIgc291cmNlTWFwcGluZyA9IFwiLyojIFwiLmNvbmNhdChkYXRhLCBcIiAqL1wiKTtcbiAgICB2YXIgc291cmNlVVJMcyA9IGNzc01hcHBpbmcuc291cmNlcy5tYXAoZnVuY3Rpb24gKHNvdXJjZSkge1xuICAgICAgcmV0dXJuIFwiLyojIHNvdXJjZVVSTD1cIi5jb25jYXQoY3NzTWFwcGluZy5zb3VyY2VSb290IHx8IFwiXCIpLmNvbmNhdChzb3VyY2UsIFwiICovXCIpO1xuICAgIH0pO1xuICAgIHJldHVybiBbY29udGVudF0uY29uY2F0KHNvdXJjZVVSTHMpLmNvbmNhdChbc291cmNlTWFwcGluZ10pLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW2NvbnRlbnRdLmpvaW4oXCJcXG5cIik7XG59OyIsImltcG9ydCBhcGkgZnJvbSBcIiEuLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbmplY3RTdHlsZXNJbnRvU3R5bGVUYWcuanNcIjtcbiAgICAgICAgICAgIGltcG9ydCBjb250ZW50IGZyb20gXCIhIS4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4uL25vZGVfbW9kdWxlcy9zYXNzLWxvYWRlci9kaXN0L2Nqcy5qcyEuL3NjcmVlbi5zY3NzXCI7XG5cbnZhciBvcHRpb25zID0ge307XG5cbm9wdGlvbnMuaW5zZXJ0ID0gXCJoZWFkXCI7XG5vcHRpb25zLnNpbmdsZXRvbiA9IGZhbHNlO1xuXG52YXIgdXBkYXRlID0gYXBpKGNvbnRlbnQsIG9wdGlvbnMpO1xuXG5cblxuZXhwb3J0IGRlZmF1bHQgY29udGVudC5sb2NhbHMgfHwge307IiwiaW1wb3J0IGFwaSBmcm9tIFwiIS4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qc1wiO1xuICAgICAgICAgICAgaW1wb3J0IGNvbnRlbnQgZnJvbSBcIiEhLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi4vLi4vbm9kZV9tb2R1bGVzL3Nhc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4vbWVhc3VyZS5zY3NzXCI7XG5cbnZhciBvcHRpb25zID0ge307XG5cbm9wdGlvbnMuaW5zZXJ0ID0gXCJoZWFkXCI7XG5vcHRpb25zLnNpbmdsZXRvbiA9IGZhbHNlO1xuXG52YXIgdXBkYXRlID0gYXBpKGNvbnRlbnQsIG9wdGlvbnMpO1xuXG5cblxuZXhwb3J0IGRlZmF1bHQgY29udGVudC5sb2NhbHMgfHwge307IiwiaW1wb3J0IGFwaSBmcm9tIFwiIS4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qc1wiO1xuICAgICAgICAgICAgaW1wb3J0IGNvbnRlbnQgZnJvbSBcIiEhLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi4vLi4vbm9kZV9tb2R1bGVzL3Nhc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4vc2VsZWN0LnNjc3NcIjtcblxudmFyIG9wdGlvbnMgPSB7fTtcblxub3B0aW9ucy5pbnNlcnQgPSBcImhlYWRcIjtcbm9wdGlvbnMuc2luZ2xldG9uID0gZmFsc2U7XG5cbnZhciB1cGRhdGUgPSBhcGkoY29udGVudCwgb3B0aW9ucyk7XG5cblxuXG5leHBvcnQgZGVmYXVsdCBjb250ZW50LmxvY2FscyB8fCB7fTsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGlzT2xkSUUgPSBmdW5jdGlvbiBpc09sZElFKCkge1xuICB2YXIgbWVtbztcbiAgcmV0dXJuIGZ1bmN0aW9uIG1lbW9yaXplKCkge1xuICAgIGlmICh0eXBlb2YgbWVtbyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8vIFRlc3QgZm9yIElFIDw9IDkgYXMgcHJvcG9zZWQgYnkgQnJvd3NlcmhhY2tzXG4gICAgICAvLyBAc2VlIGh0dHA6Ly9icm93c2VyaGFja3MuY29tLyNoYWNrLWU3MWQ4NjkyZjY1MzM0MTczZmVlNzE1YzIyMmNiODA1XG4gICAgICAvLyBUZXN0cyBmb3IgZXhpc3RlbmNlIG9mIHN0YW5kYXJkIGdsb2JhbHMgaXMgdG8gYWxsb3cgc3R5bGUtbG9hZGVyXG4gICAgICAvLyB0byBvcGVyYXRlIGNvcnJlY3RseSBpbnRvIG5vbi1zdGFuZGFyZCBlbnZpcm9ubWVudHNcbiAgICAgIC8vIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3dlYnBhY2stY29udHJpYi9zdHlsZS1sb2FkZXIvaXNzdWVzLzE3N1xuICAgICAgbWVtbyA9IEJvb2xlYW4od2luZG93ICYmIGRvY3VtZW50ICYmIGRvY3VtZW50LmFsbCAmJiAhd2luZG93LmF0b2IpO1xuICAgIH1cblxuICAgIHJldHVybiBtZW1vO1xuICB9O1xufSgpO1xuXG52YXIgZ2V0VGFyZ2V0ID0gZnVuY3Rpb24gZ2V0VGFyZ2V0KCkge1xuICB2YXIgbWVtbyA9IHt9O1xuICByZXR1cm4gZnVuY3Rpb24gbWVtb3JpemUodGFyZ2V0KSB7XG4gICAgaWYgKHR5cGVvZiBtZW1vW3RhcmdldF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB2YXIgc3R5bGVUYXJnZXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRhcmdldCk7IC8vIFNwZWNpYWwgY2FzZSB0byByZXR1cm4gaGVhZCBvZiBpZnJhbWUgaW5zdGVhZCBvZiBpZnJhbWUgaXRzZWxmXG5cbiAgICAgIGlmICh3aW5kb3cuSFRNTElGcmFtZUVsZW1lbnQgJiYgc3R5bGVUYXJnZXQgaW5zdGFuY2VvZiB3aW5kb3cuSFRNTElGcmFtZUVsZW1lbnQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBUaGlzIHdpbGwgdGhyb3cgYW4gZXhjZXB0aW9uIGlmIGFjY2VzcyB0byBpZnJhbWUgaXMgYmxvY2tlZFxuICAgICAgICAgIC8vIGR1ZSB0byBjcm9zcy1vcmlnaW4gcmVzdHJpY3Rpb25zXG4gICAgICAgICAgc3R5bGVUYXJnZXQgPSBzdHlsZVRhcmdldC5jb250ZW50RG9jdW1lbnQuaGVhZDtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0XG4gICAgICAgICAgc3R5bGVUYXJnZXQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIG1lbW9bdGFyZ2V0XSA9IHN0eWxlVGFyZ2V0O1xuICAgIH1cblxuICAgIHJldHVybiBtZW1vW3RhcmdldF07XG4gIH07XG59KCk7XG5cbnZhciBzdHlsZXNJbkRvbSA9IFtdO1xuXG5mdW5jdGlvbiBnZXRJbmRleEJ5SWRlbnRpZmllcihpZGVudGlmaWVyKSB7XG4gIHZhciByZXN1bHQgPSAtMTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0eWxlc0luRG9tLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHN0eWxlc0luRG9tW2ldLmlkZW50aWZpZXIgPT09IGlkZW50aWZpZXIpIHtcbiAgICAgIHJlc3VsdCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBtb2R1bGVzVG9Eb20obGlzdCwgb3B0aW9ucykge1xuICB2YXIgaWRDb3VudE1hcCA9IHt9O1xuICB2YXIgaWRlbnRpZmllcnMgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IGxpc3RbaV07XG4gICAgdmFyIGlkID0gb3B0aW9ucy5iYXNlID8gaXRlbVswXSArIG9wdGlvbnMuYmFzZSA6IGl0ZW1bMF07XG4gICAgdmFyIGNvdW50ID0gaWRDb3VudE1hcFtpZF0gfHwgMDtcbiAgICB2YXIgaWRlbnRpZmllciA9IFwiXCIuY29uY2F0KGlkLCBcIiBcIikuY29uY2F0KGNvdW50KTtcbiAgICBpZENvdW50TWFwW2lkXSA9IGNvdW50ICsgMTtcbiAgICB2YXIgaW5kZXggPSBnZXRJbmRleEJ5SWRlbnRpZmllcihpZGVudGlmaWVyKTtcbiAgICB2YXIgb2JqID0ge1xuICAgICAgY3NzOiBpdGVtWzFdLFxuICAgICAgbWVkaWE6IGl0ZW1bMl0sXG4gICAgICBzb3VyY2VNYXA6IGl0ZW1bM11cbiAgICB9O1xuXG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgc3R5bGVzSW5Eb21baW5kZXhdLnJlZmVyZW5jZXMrKztcbiAgICAgIHN0eWxlc0luRG9tW2luZGV4XS51cGRhdGVyKG9iaik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlc0luRG9tLnB1c2goe1xuICAgICAgICBpZGVudGlmaWVyOiBpZGVudGlmaWVyLFxuICAgICAgICB1cGRhdGVyOiBhZGRTdHlsZShvYmosIG9wdGlvbnMpLFxuICAgICAgICByZWZlcmVuY2VzOiAxXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZGVudGlmaWVycy5wdXNoKGlkZW50aWZpZXIpO1xuICB9XG5cbiAgcmV0dXJuIGlkZW50aWZpZXJzO1xufVxuXG5mdW5jdGlvbiBpbnNlcnRTdHlsZUVsZW1lbnQob3B0aW9ucykge1xuICB2YXIgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICB2YXIgYXR0cmlidXRlcyA9IG9wdGlvbnMuYXR0cmlidXRlcyB8fCB7fTtcblxuICBpZiAodHlwZW9mIGF0dHJpYnV0ZXMubm9uY2UgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgdmFyIG5vbmNlID0gdHlwZW9mIF9fd2VicGFja19ub25jZV9fICE9PSAndW5kZWZpbmVkJyA/IF9fd2VicGFja19ub25jZV9fIDogbnVsbDtcblxuICAgIGlmIChub25jZSkge1xuICAgICAgYXR0cmlidXRlcy5ub25jZSA9IG5vbmNlO1xuICAgIH1cbiAgfVxuXG4gIE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgIHN0eWxlLnNldEF0dHJpYnV0ZShrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gIH0pO1xuXG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5pbnNlcnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBvcHRpb25zLmluc2VydChzdHlsZSk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHRhcmdldCA9IGdldFRhcmdldChvcHRpb25zLmluc2VydCB8fCAnaGVhZCcpO1xuXG4gICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkbid0IGZpbmQgYSBzdHlsZSB0YXJnZXQuIFRoaXMgcHJvYmFibHkgbWVhbnMgdGhhdCB0aGUgdmFsdWUgZm9yIHRoZSAnaW5zZXJ0JyBwYXJhbWV0ZXIgaXMgaW52YWxpZC5cIik7XG4gICAgfVxuXG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgfVxuXG4gIHJldHVybiBzdHlsZTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlU3R5bGVFbGVtZW50KHN0eWxlKSB7XG4gIC8vIGlzdGFuYnVsIGlnbm9yZSBpZlxuICBpZiAoc3R5bGUucGFyZW50Tm9kZSA9PT0gbnVsbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHN0eWxlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc3R5bGUpO1xufVxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgICovXG5cblxudmFyIHJlcGxhY2VUZXh0ID0gZnVuY3Rpb24gcmVwbGFjZVRleHQoKSB7XG4gIHZhciB0ZXh0U3RvcmUgPSBbXTtcbiAgcmV0dXJuIGZ1bmN0aW9uIHJlcGxhY2UoaW5kZXgsIHJlcGxhY2VtZW50KSB7XG4gICAgdGV4dFN0b3JlW2luZGV4XSA9IHJlcGxhY2VtZW50O1xuICAgIHJldHVybiB0ZXh0U3RvcmUuZmlsdGVyKEJvb2xlYW4pLmpvaW4oJ1xcbicpO1xuICB9O1xufSgpO1xuXG5mdW5jdGlvbiBhcHBseVRvU2luZ2xldG9uVGFnKHN0eWxlLCBpbmRleCwgcmVtb3ZlLCBvYmopIHtcbiAgdmFyIGNzcyA9IHJlbW92ZSA/ICcnIDogb2JqLm1lZGlhID8gXCJAbWVkaWEgXCIuY29uY2F0KG9iai5tZWRpYSwgXCIge1wiKS5jb25jYXQob2JqLmNzcywgXCJ9XCIpIDogb2JqLmNzczsgLy8gRm9yIG9sZCBJRVxuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAgKi9cblxuICBpZiAoc3R5bGUuc3R5bGVTaGVldCkge1xuICAgIHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IHJlcGxhY2VUZXh0KGluZGV4LCBjc3MpO1xuICB9IGVsc2Uge1xuICAgIHZhciBjc3NOb2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzKTtcbiAgICB2YXIgY2hpbGROb2RlcyA9IHN0eWxlLmNoaWxkTm9kZXM7XG5cbiAgICBpZiAoY2hpbGROb2Rlc1tpbmRleF0pIHtcbiAgICAgIHN0eWxlLnJlbW92ZUNoaWxkKGNoaWxkTm9kZXNbaW5kZXhdKTtcbiAgICB9XG5cbiAgICBpZiAoY2hpbGROb2Rlcy5sZW5ndGgpIHtcbiAgICAgIHN0eWxlLmluc2VydEJlZm9yZShjc3NOb2RlLCBjaGlsZE5vZGVzW2luZGV4XSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlLmFwcGVuZENoaWxkKGNzc05vZGUpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhcHBseVRvVGFnKHN0eWxlLCBvcHRpb25zLCBvYmopIHtcbiAgdmFyIGNzcyA9IG9iai5jc3M7XG4gIHZhciBtZWRpYSA9IG9iai5tZWRpYTtcbiAgdmFyIHNvdXJjZU1hcCA9IG9iai5zb3VyY2VNYXA7XG5cbiAgaWYgKG1lZGlhKSB7XG4gICAgc3R5bGUuc2V0QXR0cmlidXRlKCdtZWRpYScsIG1lZGlhKTtcbiAgfSBlbHNlIHtcbiAgICBzdHlsZS5yZW1vdmVBdHRyaWJ1dGUoJ21lZGlhJyk7XG4gIH1cblxuICBpZiAoc291cmNlTWFwICYmIHR5cGVvZiBidG9hICE9PSAndW5kZWZpbmVkJykge1xuICAgIGNzcyArPSBcIlxcbi8qIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsXCIuY29uY2F0KGJ0b2EodW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KHNvdXJjZU1hcCkpKSksIFwiICovXCIpO1xuICB9IC8vIEZvciBvbGQgSUVcblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgICovXG5cblxuICBpZiAoc3R5bGUuc3R5bGVTaGVldCkge1xuICAgIHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IGNzcztcbiAgfSBlbHNlIHtcbiAgICB3aGlsZSAoc3R5bGUuZmlyc3RDaGlsZCkge1xuICAgICAgc3R5bGUucmVtb3ZlQ2hpbGQoc3R5bGUuZmlyc3RDaGlsZCk7XG4gICAgfVxuXG4gICAgc3R5bGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzKSk7XG4gIH1cbn1cblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG52YXIgc2luZ2xldG9uQ291bnRlciA9IDA7XG5cbmZ1bmN0aW9uIGFkZFN0eWxlKG9iaiwgb3B0aW9ucykge1xuICB2YXIgc3R5bGU7XG4gIHZhciB1cGRhdGU7XG4gIHZhciByZW1vdmU7XG5cbiAgaWYgKG9wdGlvbnMuc2luZ2xldG9uKSB7XG4gICAgdmFyIHN0eWxlSW5kZXggPSBzaW5nbGV0b25Db3VudGVyKys7XG4gICAgc3R5bGUgPSBzaW5nbGV0b24gfHwgKHNpbmdsZXRvbiA9IGluc2VydFN0eWxlRWxlbWVudChvcHRpb25zKSk7XG4gICAgdXBkYXRlID0gYXBwbHlUb1NpbmdsZXRvblRhZy5iaW5kKG51bGwsIHN0eWxlLCBzdHlsZUluZGV4LCBmYWxzZSk7XG4gICAgcmVtb3ZlID0gYXBwbHlUb1NpbmdsZXRvblRhZy5iaW5kKG51bGwsIHN0eWxlLCBzdHlsZUluZGV4LCB0cnVlKTtcbiAgfSBlbHNlIHtcbiAgICBzdHlsZSA9IGluc2VydFN0eWxlRWxlbWVudChvcHRpb25zKTtcbiAgICB1cGRhdGUgPSBhcHBseVRvVGFnLmJpbmQobnVsbCwgc3R5bGUsIG9wdGlvbnMpO1xuXG4gICAgcmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKCkge1xuICAgICAgcmVtb3ZlU3R5bGVFbGVtZW50KHN0eWxlKTtcbiAgICB9O1xuICB9XG5cbiAgdXBkYXRlKG9iaik7XG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGVTdHlsZShuZXdPYmopIHtcbiAgICBpZiAobmV3T2JqKSB7XG4gICAgICBpZiAobmV3T2JqLmNzcyA9PT0gb2JqLmNzcyAmJiBuZXdPYmoubWVkaWEgPT09IG9iai5tZWRpYSAmJiBuZXdPYmouc291cmNlTWFwID09PSBvYmouc291cmNlTWFwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdXBkYXRlKG9iaiA9IG5ld09iaik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZSgpO1xuICAgIH1cbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAobGlzdCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTsgLy8gRm9yY2Ugc2luZ2xlLXRhZyBzb2x1dGlvbiBvbiBJRTYtOSwgd2hpY2ggaGFzIGEgaGFyZCBsaW1pdCBvbiB0aGUgIyBvZiA8c3R5bGU+XG4gIC8vIHRhZ3MgaXQgd2lsbCBhbGxvdyBvbiBhIHBhZ2VcblxuICBpZiAoIW9wdGlvbnMuc2luZ2xldG9uICYmIHR5cGVvZiBvcHRpb25zLnNpbmdsZXRvbiAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgb3B0aW9ucy5zaW5nbGV0b24gPSBpc09sZElFKCk7XG4gIH1cblxuICBsaXN0ID0gbGlzdCB8fCBbXTtcbiAgdmFyIGxhc3RJZGVudGlmaWVycyA9IG1vZHVsZXNUb0RvbShsaXN0LCBvcHRpb25zKTtcbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZShuZXdMaXN0KSB7XG4gICAgbmV3TGlzdCA9IG5ld0xpc3QgfHwgW107XG5cbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG5ld0xpc3QpICE9PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXN0SWRlbnRpZmllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBpZGVudGlmaWVyID0gbGFzdElkZW50aWZpZXJzW2ldO1xuICAgICAgdmFyIGluZGV4ID0gZ2V0SW5kZXhCeUlkZW50aWZpZXIoaWRlbnRpZmllcik7XG4gICAgICBzdHlsZXNJbkRvbVtpbmRleF0ucmVmZXJlbmNlcy0tO1xuICAgIH1cblxuICAgIHZhciBuZXdMYXN0SWRlbnRpZmllcnMgPSBtb2R1bGVzVG9Eb20obmV3TGlzdCwgb3B0aW9ucyk7XG5cbiAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgbGFzdElkZW50aWZpZXJzLmxlbmd0aDsgX2krKykge1xuICAgICAgdmFyIF9pZGVudGlmaWVyID0gbGFzdElkZW50aWZpZXJzW19pXTtcblxuICAgICAgdmFyIF9pbmRleCA9IGdldEluZGV4QnlJZGVudGlmaWVyKF9pZGVudGlmaWVyKTtcblxuICAgICAgaWYgKHN0eWxlc0luRG9tW19pbmRleF0ucmVmZXJlbmNlcyA9PT0gMCkge1xuICAgICAgICBzdHlsZXNJbkRvbVtfaW5kZXhdLnVwZGF0ZXIoKTtcblxuICAgICAgICBzdHlsZXNJbkRvbS5zcGxpY2UoX2luZGV4LCAxKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsYXN0SWRlbnRpZmllcnMgPSBuZXdMYXN0SWRlbnRpZmllcnM7XG4gIH07XG59OyIsImV4cG9ydCBjbGFzcyBCb3hNYW5hZ2VyIHtcclxuXHJcbiAgcHJpdmF0ZSBib3hlc186IEhUTUxFbGVtZW50W10gPSBbXTtcclxuICBnZXQgYm94ZXMoKTogcmVhZG9ubHkgSFRNTEVsZW1lbnRbXSB7IHJldHVybiB0aGlzLmJveGVzXzsgfVxyXG5cclxuICBhZGQoZG9tOiBIVE1MRWxlbWVudCkge1xyXG4gICAgaWYgKHRoaXMuYm94ZXNfLmluZGV4T2YoZG9tKSAhPSAtMSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmJveGVzXy5wdXNoKGRvbSk7XHJcbiAgfVxyXG5cclxuICByZW1vdmUoZG9tOiBIVE1MRWxlbWVudCkge1xyXG4gICAgY29uc3QgaWR4ID0gdGhpcy5ib3hlc18uaW5kZXhPZihkb20pO1xyXG4gICAgaWYgKGlkeCA9PSAtMSkgcmV0dXJuO1xyXG4gICAgdGhpcy5ib3hlc18uc3BsaWNlKGlkeCwgMSk7XHJcbiAgfVxyXG5cclxuICBoYXMoZG9tOiBIVE1MRWxlbWVudCkge1xyXG4gICAgcmV0dXJuIHRoaXMuYm94ZXNfLmluZGV4T2YoZG9tKSAhPSAtMTtcclxuICB9XHJcblxyXG4gIHZhbGlkYXRlKCkge1xyXG4gICAgdGhpcy5ib3hlc18gPSB0aGlzLmJveGVzXy5maWx0ZXIoYiA9PiBkb2N1bWVudC5ib2R5LmNvbnRhaW5zKGIpKTtcclxuICB9XHJcblxyXG59IiwiaW1wb3J0IHsgTWVhc3VyZSB9IGZyb20gJ2NvbnRlbnQvbWVhc3VyZSc7XHJcbmltcG9ydCB7IFNjcmVlbiB9IGZyb20gJ2NvbnRlbnQvc2NyZWVuJztcclxuXHJcbmNvbnN0IHNjcmVlbiA9IG5ldyBTY3JlZW4obmV3IE1lYXN1cmUoKSk7XHJcblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5cHJlc3MnLCBlID0+IHtcclxuICBpZiAoZS5rZXkgPT09ICdtJykge1xyXG4gICAgc2NyZWVuLnRvZ2dsZSgpO1xyXG4gIH1cclxufSwge1xyXG4gIGNhcHR1cmU6IHRydWVcclxufSlcclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZSgpIHtcclxuICBzY3JlZW4udXBkYXRlKCk7XHJcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHVwZGF0ZSk7XHJcbn1cclxucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHVwZGF0ZSk7IiwiaW1wb3J0IHsgZ2V0T3ZlcmxhcHBpbmdEaW0sIGdldFJlY3REaW0sIGlzUG9pbnRJblJlY3QsIGlzUmVjdEluUmVjdCwgUmVjdCwgVU5JUVVFX0lEIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSU1lYXN1cmUge1xyXG4gIGdldFNtYWxsZXN0RE9NQXQoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBIVE1MRWxlbWVudDtcclxuICBnZXRCZXN0TWF0Y2hlZERPTUluc2lkZShyZWN0OiBSZWN0KTogSFRNTEVsZW1lbnQ7XHJcbiAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGRvbTogSFRNTEVsZW1lbnQpOiBET01SZWN0O1xyXG4gIGdldEJlc3RNYXRjaGVkUGFyZW50RE9NKGRvbTogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1lYXN1cmUgaW1wbGVtZW50cyBJTWVhc3VyZSB7XHJcblxyXG4gIHByaXZhdGUgKml0ZXJhdGVET01zKCk6IEdlbmVyYXRvcjxIVE1MRWxlbWVudD4ge1xyXG4gICAgY29uc3QgYWxsID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCIqXCIpO1xyXG4gICAgZm9yIChjb25zdCBlbCBvZiBhbGwpIHtcclxuICAgICAgaWYgKGVsLmNsYXNzTGlzdC5jb250YWlucyhVTklRVUVfSUQpKSBjb250aW51ZTtcclxuICAgICAgeWllbGQgZWwgYXMgSFRNTEVsZW1lbnQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBnZXRTbWFsbGVzdERPTUF0KHg6IG51bWJlciwgeTogbnVtYmVyKTogSFRNTEVsZW1lbnQge1xyXG4gICAgbGV0IGJlc3Q6IEVsZW1lbnQ7XHJcbiAgICBsZXQgYmVzdERpbTogbnVtYmVyID0gSW5maW5pdHk7XHJcbiAgICBjb25zdCBkb21zID0gdGhpcy5pdGVyYXRlRE9NcygpO1xyXG4gICAgZm9yIChjb25zdCBlbCBvZiBkb21zKSB7XHJcbiAgICAgIGNvbnN0IHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgaWYgKGlzUG9pbnRJblJlY3QoeCwgeSwgcmVjdCkpIHtcclxuICAgICAgICBjb25zdCBkaW0gPSBnZXRSZWN0RGltKHJlY3QpO1xyXG4gICAgICAgIGlmIChiZXN0RGltID4gZGltKSB7XHJcbiAgICAgICAgICBiZXN0ID0gZWw7XHJcbiAgICAgICAgICBiZXN0RGltID0gZGltO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJlc3QgYXMgSFRNTEVsZW1lbnQ7XHJcbiAgfVxyXG5cclxuICBnZXRCZXN0TWF0Y2hlZERPTUluc2lkZShyZWN0OiBSZWN0KTogSFRNTEVsZW1lbnQge1xyXG4gICAgbGV0IGJlc3Q6IEVsZW1lbnQ7XHJcbiAgICBsZXQgYmVzdERpbTogbnVtYmVyID0gMDtcclxuICAgIGNvbnN0IGRvbXMgPSB0aGlzLml0ZXJhdGVET01zKCk7XHJcbiAgICBmb3IgKGNvbnN0IGVsIG9mIGRvbXMpIHtcclxuICAgICAgY29uc3QgZWxSZWN0ID0gdGhpcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoZWwpO1xyXG4gICAgICBpZiAoIWlzUmVjdEluUmVjdChyZWN0LCBlbFJlY3QpKSBjb250aW51ZTtcclxuICAgICAgY29uc3QgZGltID0gZ2V0UmVjdERpbShlbFJlY3QpO1xyXG4gICAgICBpZiAoYmVzdERpbSA8PSBkaW0pIHtcclxuICAgICAgICBiZXN0ID0gZWw7XHJcbiAgICAgICAgYmVzdERpbSA9IGRpbTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJlc3QgYXMgSFRNTEVsZW1lbnQ7XHJcbiAgfVxyXG5cclxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3QoZG9tOiBIVE1MRWxlbWVudCk6IERPTVJlY3Qge1xyXG4gICAgcmV0dXJuIGRvbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICB9XHJcblxyXG4gIGdldEJlc3RNYXRjaGVkUGFyZW50RE9NKGRvbTogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XHJcbiAgfVxyXG5cclxufSIsImltcG9ydCAnLi9zY3JlZW4uc2Nzcyc7XHJcbmltcG9ydCB7IEVtaXR0ZXIgfSBmcm9tICdAb3JhbmdlNGdsYWNlL3ZzLWxpYi9iYXNlL2NvbW1vbi9ldmVudCc7XHJcbmltcG9ydCB7IEJveE1hbmFnZXIgfSBmcm9tICdjb250ZW50L2JveE1hbmFnZXInO1xyXG5pbXBvcnQgeyBTY3JlZW5NZWFzdXJlVG9vbCB9IGZyb20gJ2NvbnRlbnQvdG9vbC9tZWFzdXJlJztcclxuaW1wb3J0IHsgU2NyZWVuU2VsZWN0VG9vbCB9IGZyb20gJ2NvbnRlbnQvdG9vbC9zZWxlY3QnO1xyXG5pbXBvcnQgeyBJU2NyZWVuVG9vbCB9IGZyb20gJ2NvbnRlbnQvdG9vbC90b29sJztcclxuaW1wb3J0IHsgYXBwbHlET01SZWN0LCBVTklRVUVfSUQgfSBmcm9tICdjb250ZW50L3V0aWwnO1xyXG5pbXBvcnQgeyBJTWVhc3VyZSB9IGZyb20gJy4vbWVhc3VyZSc7XHJcblxyXG5leHBvcnQgY2xhc3MgU2NyZWVuIHtcclxuXHJcbiAgcHJpdmF0ZSBvbk1vdXNlbW92ZV8gPSBuZXcgRW1pdHRlcjx2b2lkPigpO1xyXG4gIHJlYWRvbmx5IG9uTW91c2Vtb3ZlID0gdGhpcy5vbk1vdXNlbW92ZV8uZXZlbnQ7XHJcblxyXG4gIHByaXZhdGUgZG9tXzogSFRNTEVsZW1lbnQ7XHJcbiAgZ2V0IGRvbSgpIHsgcmV0dXJuIHRoaXMuZG9tXzsgfVxyXG5cclxuICBwcml2YXRlIHBhZ2VYXzogbnVtYmVyID0gMDtcclxuICBnZXQgcGFnZVgoKSB7IHJldHVybiB0aGlzLnBhZ2VYXzsgfVxyXG4gIHByaXZhdGUgcGFnZVlfOiBudW1iZXIgPSAwO1xyXG4gIGdldCBwYWdlWSgpIHsgcmV0dXJuIHRoaXMucGFnZVlfOyB9XHJcblxyXG4gIHByaXZhdGUgc2NyZWVuWF86IG51bWJlciA9IDA7XHJcbiAgZ2V0IHNjcmVlblgoKSB7IHJldHVybiB0aGlzLnNjcmVlblhfOyB9XHJcbiAgcHJpdmF0ZSBzY3JlZW5ZXzogbnVtYmVyID0gMDtcclxuICBnZXQgc2NyZWVuWSgpIHsgcmV0dXJuIHRoaXMuc2NyZWVuWV87IH1cclxuXHJcbiAgcHJpdmF0ZSBjbGllbnRYXzogbnVtYmVyID0gMDtcclxuICBnZXQgY2xpZW50WCgpIHsgcmV0dXJuIHRoaXMuY2xpZW50WF87IH1cclxuICBwcml2YXRlIGNsaWVudFlfOiBudW1iZXIgPSAwO1xyXG4gIGdldCBjbGllbnRZKCkgeyByZXR1cm4gdGhpcy5jbGllbnRZXzsgfVxyXG5cclxuICBwcml2YXRlIGN1cnJlbnRUb29sXzogSVNjcmVlblRvb2w7XHJcbiAgZ2V0IGN1cnJlbnRUb29sKCkgeyByZXR1cm4gdGhpcy5jdXJyZW50VG9vbF87IH1cclxuXHJcbiAgcHJpdmF0ZSB3aWR0aF86IG51bWJlcjtcclxuICBwcml2YXRlIGhlaWdodF86IG51bWJlcjtcclxuICBnZXQgd2lkdGgoKSB7IHJldHVybiB0aGlzLndpZHRoXzsgfVxyXG4gIGdldCBoZWlnaHQoKSB7IHJldHVybiB0aGlzLmhlaWdodF87IH1cclxuXHJcbiAgcmVhZG9ubHkgYm94ZXM6IEJveE1hbmFnZXI7XHJcblxyXG4gIHByaXZhdGUgYm94T3ZlcmxheXNfOiBbSFRNTEVsZW1lbnQsIEhUTUxFbGVtZW50XVtdID0gW107XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcmVhZG9ubHkgbWVhc3VyZTogSU1lYXN1cmVcclxuICApIHtcclxuICAgIHRoaXMuYm94ZXMgPSBuZXcgQm94TWFuYWdlcigpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRvbV8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHRoaXMuZG9tXy5jbGFzc05hbWUgPSBgJHtVTklRVUVfSUR9YFxyXG4gICAgdGhpcy5kb21fLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgXHJcbiAgICAgIHBvc2l0aW9uOiBmaXhlZDtcclxuICAgICAgei1pbmRleDogOTk5OTk5OTk7XHJcbiAgICAgIHRvcDogMDtcclxuICAgICAgbGVmdDogMDtcclxuICAgICAgYm90dG9tOiAwO1xyXG4gICAgICByaWdodDogMDtcclxuICAgICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XHJcbiAgICBgKTtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kKHRoaXMuZG9tXyk7XHJcblxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGUgPT4ge1xyXG4gICAgICB0aGlzLnBhZ2VYXyA9IGUucGFnZVg7XHJcbiAgICAgIHRoaXMucGFnZVlfID0gZS5wYWdlWTtcclxuICAgICAgdGhpcy5zY3JlZW5YXyA9IGUuc2NyZWVuWDtcclxuICAgICAgdGhpcy5zY3JlZW5ZXyA9IGUuc2NyZWVuWTtcclxuICAgICAgdGhpcy5jbGllbnRYXyA9IGUuY2xpZW50WDtcclxuICAgICAgdGhpcy5jbGllbnRZXyA9IGUuY2xpZW50WTtcclxuICAgICAgdGhpcy5vbk1vdXNlbW92ZV8uZmlyZSgpO1xyXG4gICAgfSwge1xyXG4gICAgICBjYXB0dXJlOiB0cnVlXHJcbiAgICB9KTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB0aGlzLnJlc2l6ZSgpKTtcclxuICAgIHRoaXMucmVzaXplKCk7XHJcblxyXG4gICAgY29uc3QgbWVhc3VyZVRvb2wgPSBuZXcgU2NyZWVuTWVhc3VyZVRvb2wodGhpcyk7XHJcbiAgICBjb25zdCBzZWxlY3RUb29sID0gbmV3IFNjcmVlblNlbGVjdFRvb2wodGhpcyk7XHJcbiAgICBtZWFzdXJlVG9vbC5vbkFjdGl2YXRlKCk7XHJcbiAgICBzZWxlY3RUb29sLm9uQWN0aXZhdGUoKTtcclxuICAgIC8vIHRoaXMuc2V0VG9vbChzZWxlY3RUb29sKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVzaXplKCkge1xyXG4gICAgdGhpcy53aWR0aF8gPSB0aGlzLmRvbV8ub2Zmc2V0V2lkdGg7XHJcbiAgICB0aGlzLmhlaWdodF8gPSB0aGlzLmRvbS5vZmZzZXRIZWlnaHQ7XHJcbiAgfVxyXG5cclxuICBzZXRUb29sKHRvb2w6IElTY3JlZW5Ub29sKSB7XHJcbiAgICAvLyBpZiAodGhpcy5jdXJyZW50VG9vbF8pIHtcclxuICAgIC8vICAgdGhpcy5jdXJyZW50VG9vbF8ub25EZWFjdGl2YXRlKCk7IFxyXG4gICAgLy8gfVxyXG4gICAgLy8gdGhpcy5jdXJyZW50VG9vbF8gPSB0b29sO1xyXG4gICAgLy8gaWYgKHRoaXMuY3VycmVudFRvb2xfKSB7XHJcbiAgICAvLyAgIHRoaXMuY3VycmVudFRvb2xfLm9uQWN0aXZhdGUoKTtcclxuICAgIC8vIH1cclxuICB9XHJcblxyXG4gIHVwZGF0ZSgpIHtcclxuICAgIHRoaXMuYm94ZXMudmFsaWRhdGUoKTtcclxuICAgIGNvbnN0IHJlbW92ZXMgPSB0aGlzLmJveE92ZXJsYXlzXy5maWx0ZXIobyA9PiAhdGhpcy5ib3hlcy5oYXMob1swXSkpO1xyXG4gICAgY29uc3QgbmV3T3ZlcmxheXMgPSB0aGlzLmJveE92ZXJsYXlzXy5maWx0ZXIobyA9PiB0aGlzLmJveGVzLmhhcyhvWzBdKSk7XHJcbiAgICByZW1vdmVzLmZvckVhY2gocm0gPT4gcm1bMV0ucmVtb3ZlKCkpO1xyXG4gICAgY29uc3QgYXBwZW5kcyA9IHRoaXMuYm94ZXMuYm94ZXMuZmlsdGVyKGIgPT4gISEhdGhpcy5ib3hPdmVybGF5c18uZmluZChvID0+IG9bMF0gPT09IGIpKTtcclxuICAgIGZvciAoY29uc3QgYSBvZiBhcHBlbmRzKSB7XHJcbiAgICAgIGNvbnN0IG92ZXJsYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgb3ZlcmxheS5jbGFzc05hbWUgPSBgJHtVTklRVUVfSUR9IF9fc2Nfb3ZlcmxheWA7XHJcbiAgICAgIHRoaXMuZG9tXy5hcHBlbmQob3ZlcmxheSk7XHJcbiAgICAgIG5ld092ZXJsYXlzLnB1c2goW2EsIG92ZXJsYXldKTtcclxuICAgIH1cclxuICAgIHRoaXMuYm94T3ZlcmxheXNfID0gbmV3T3ZlcmxheXM7XHJcbiAgICBmb3IgKGNvbnN0IG8gb2YgdGhpcy5ib3hPdmVybGF5c18pIHtcclxuICAgICAgYXBwbHlET01SZWN0KG9bMV0sIHRoaXMubWVhc3VyZS5nZXRCb3VuZGluZ0NsaWVudFJlY3Qob1swXSkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZW5hYmxlKCkge1xyXG4gICAgdGhpcy5kb20uc3R5bGUuZGlzcGxheSA9ICdpbmhlcml0JztcclxuICB9XHJcbiAgXHJcbiAgZGlzYWJsZSgpIHtcclxuICAgIHRoaXMuZG9tXy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gIH1cclxuXHJcbiAgdG9nZ2xlKCkge1xyXG4gICAgaWYgKHRoaXMuZG9tLnN0eWxlLmRpc3BsYXkgPT09ICdub25lJykgdGhpcy5lbmFibGUoKTtcclxuICAgIGVsc2UgdGhpcy5kaXNhYmxlKCk7XHJcbiAgfVxyXG5cclxufSIsImltcG9ydCAnLi9tZWFzdXJlLnNjc3MnO1xyXG5pbXBvcnQgeyBEaXNwb3NhYmxlU3RvcmUgfSBmcm9tICdAb3JhbmdlNGdsYWNlL3ZzLWxpYi9iYXNlL2NvbW1vbi9saWZlY3ljbGUnO1xyXG5pbXBvcnQgeyBTY3JlZW4gfSBmcm9tICcuLi9zY3JlZW4nO1xyXG5pbXBvcnQgeyBJU2NyZWVuVG9vbCB9IGZyb20gJy4vdG9vbCc7XHJcbmltcG9ydCB7IGdldFJlY3REaW0sIGlzUG9pbnRJblJlY3QsIHJheWNhc3QsIFVOSVFVRV9JRCB9IGZyb20gJ2NvbnRlbnQvdXRpbCc7XHJcblxyXG5leHBvcnQgY2xhc3MgU2NyZWVuTWVhc3VyZVRvb2wgaW1wbGVtZW50cyBJU2NyZWVuVG9vbCB7XHJcbiAgc3RhdGljIHJlYWRvbmx5IE5BTUUgPSAnU2NyZWVuTWVhc3VyZVRvb2wnO1xyXG5cclxuICByZWFkb25seSBuYW1lOiBzdHJpbmcgPSBTY3JlZW5NZWFzdXJlVG9vbC5OQU1FO1xyXG5cclxuICBwcml2YXRlIGRpc3Bvc2FibGVzXzogRGlzcG9zYWJsZVN0b3JlO1xyXG5cclxuICBwcml2YXRlIGRvbV86IEhUTUxDYW52YXNFbGVtZW50O1xyXG4gIHByaXZhdGUgY3R4XzogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG4gIHByaXZhdGUgaG9yaXpvbnRhbERPTV86IEhUTUxFbGVtZW50O1xyXG4gIHByaXZhdGUgdmVydGljYWxET01fOiBIVE1MRWxlbWVudDtcclxuXHJcbiAgcHJpdmF0ZSBob3Jpem9udGFsTGFiZWxET01fOiBIVE1MRWxlbWVudDtcclxuICBwcml2YXRlIHZlcnRpY2FsTGFiZWxET01fOiBIVE1MRWxlbWVudDtcclxuXHJcbiAgcHJpdmF0ZSB3aWR0aExhYmVsRE9NXzogSFRNTEVsZW1lbnQ7XHJcbiAgcHJpdmF0ZSBoZWlnaHRMYWJlbERPTV86IEhUTUxFbGVtZW50O1xyXG5cclxuICBwcml2YXRlIGludGVydmFsXzogYW55O1xyXG5cclxuICBwcml2YXRlIGZvbnRTaXplXztcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICByZWFkb25seSBzY3JlZW46IFNjcmVlblxyXG4gICkge1xyXG4gICAgdGhpcy5kcmF3ID0gdGhpcy5kcmF3LmJpbmQodGhpcyk7XHJcblxyXG4gICAgdGhpcy5kb21fID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICB0aGlzLmN0eF8gPSB0aGlzLmRvbV8uZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICB0aGlzLmZvbnRTaXplXyA9IGNocm9tZS5zdG9yYWdlLnN5bmMuZ2V0KFsnbWVhc3VyZUZvbnRTaXplJ10sIHJlc3VsdCA9PiB7XHJcbiAgICAgIHRoaXMuZm9udFNpemVfID0gcmVzdWx0WydtZWFzdXJlRm9udFNpemUnXTtcclxuICAgIH0pO1xyXG4gICAgdGhpcy5mb250U2l6ZV8gPSB0aGlzLmZvbnRTaXplXyB8fCAxMTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIGUgPT4ge1xyXG4gICAgICBpZiAoZS5rZXkgPT09ICc9Jykge1xyXG4gICAgICAgIHRoaXMuZm9udFNpemVfID0gdGhpcy5mb250U2l6ZV8gKyAxO1xyXG4gICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHtcclxuICAgICAgICAgICdtZWFzdXJlRm9udFNpemUnOiB0aGlzLmZvbnRTaXplX1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGUua2V5ID09PSAnLScpIHtcclxuICAgICAgICB0aGlzLmZvbnRTaXplXyA9IHRoaXMuZm9udFNpemVfIC0gMTtcclxuICAgICAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldCh7XHJcbiAgICAgICAgICAnbWVhc3VyZUZvbnRTaXplJzogdGhpcy5mb250U2l6ZV9cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHRoaXMucmVzaXplKCkpO1xyXG4gICAgdGhpcy5yZXNpemUoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVzaXplKCkge1xyXG4gICAgdGhpcy5kb21fLndpZHRoID0gdGhpcy5zY3JlZW4uZG9tLm9mZnNldFdpZHRoO1xyXG4gICAgdGhpcy5kb21fLmhlaWdodCA9IHRoaXMuc2NyZWVuLmRvbS5vZmZzZXRIZWlnaHQ7XHJcbiAgfVxyXG5cclxuICBvbkFjdGl2YXRlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5kaXNwb3NhYmxlc18gPSBuZXcgRGlzcG9zYWJsZVN0b3JlKCk7XHJcblxyXG4gICAgdGhpcy5ob3Jpem9udGFsRE9NXyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGhpcy52ZXJ0aWNhbERPTV8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHRoaXMuaG9yaXpvbnRhbExhYmVsRE9NXyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGhpcy52ZXJ0aWNhbExhYmVsRE9NXyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGhpcy53aWR0aExhYmVsRE9NXyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGhpcy5oZWlnaHRMYWJlbERPTV8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHRoaXMuZG9tXy5jbGFzc05hbWUgPSBgJHtVTklRVUVfSUR9IHRvb2wtbWVhc3VyZWA7XHJcbiAgICB0aGlzLmhvcml6b250YWxET01fLmNsYXNzTmFtZSA9IGAke1VOSVFVRV9JRH0gaG9yaXpvbnRhbGA7XHJcbiAgICB0aGlzLnZlcnRpY2FsRE9NXy5jbGFzc05hbWUgPSBgJHtVTklRVUVfSUR9IHZlcnRpY2FsYDtcclxuICAgIHRoaXMuaG9yaXpvbnRhbExhYmVsRE9NXy5jbGFzc05hbWUgPSBgJHtVTklRVUVfSUR9IGxhYmVsIGxhYmVsLWhvcml6b250YWxgO1xyXG4gICAgdGhpcy52ZXJ0aWNhbExhYmVsRE9NXy5jbGFzc05hbWUgPSBgJHtVTklRVUVfSUR9IGxhYmVsIGxhYmVsLXZlcnRpY2FsYDtcclxuICAgIHRoaXMud2lkdGhMYWJlbERPTV8uY2xhc3NOYW1lID0gYCR7VU5JUVVFX0lEfSBsYWJlbCBsYWJlbC1ob3Jpem9udGFsYDtcclxuICAgIHRoaXMuaGVpZ2h0TGFiZWxET01fLmNsYXNzTmFtZSA9IGAke1VOSVFVRV9JRH0gbGFiZWwgbGFiZWwtdmVydGljYWxgO1xyXG4gICAgdGhpcy5kb21fLmFwcGVuZCh0aGlzLmhvcml6b250YWxET01fKTtcclxuICAgIHRoaXMuZG9tXy5hcHBlbmQodGhpcy52ZXJ0aWNhbERPTV8pO1xyXG4gICAgdGhpcy5kb21fLmFwcGVuZCh0aGlzLmhvcml6b250YWxMYWJlbERPTV8pO1xyXG4gICAgdGhpcy5kb21fLmFwcGVuZCh0aGlzLnZlcnRpY2FsTGFiZWxET01fKTtcclxuICAgIHRoaXMuZG9tXy5hcHBlbmQodGhpcy53aWR0aExhYmVsRE9NXyk7XHJcbiAgICB0aGlzLmRvbV8uYXBwZW5kKHRoaXMuaGVpZ2h0TGFiZWxET01fKTtcclxuICAgIHRoaXMuc2NyZWVuLmRvbS5hcHBlbmQodGhpcy5kb21fKTtcclxuXHJcbiAgICB0aGlzLmRpc3Bvc2FibGVzXy5hZGQodGhpcy5zY3JlZW4ub25Nb3VzZW1vdmUoKCkgPT4gdGhpcy5kcmF3KCkpKTtcclxuICAgIHRoaXMuaW50ZXJ2YWxfID0gc2V0SW50ZXJ2YWwodGhpcy5kcmF3LCAzMyk7XHJcbiAgfVxyXG5cclxuICBvbkRlYWN0aXZhdGUoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRvbV8ucmVtb3ZlKCk7XHJcbiAgICB0aGlzLmRpc3Bvc2FibGVzXy5kaXNwb3NlKCk7XHJcbiAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWxfKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZHJhdygpIHtcclxuICAgIGNvbnN0IHggPSB0aGlzLnNjcmVlbi5jbGllbnRYO1xyXG4gICAgY29uc3QgeSA9IHRoaXMuc2NyZWVuLmNsaWVudFk7XHJcblxyXG4gICAgY29uc3QgY2FzdCA9IHJheWNhc3QoeCwgeSwgdGhpcy5zY3JlZW4uYm94ZXMuYm94ZXMubWFwKGIgPT4gdGhpcy5zY3JlZW4ubWVhc3VyZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoYikpKTtcclxuXHJcbiAgICBjb25zdCBsZWZ0ID0gTWF0aC5tYXgoMCwgY2FzdC5sZWZ0KTtcclxuICAgIGNvbnN0IHJpZ2h0ID0gTWF0aC5taW4odGhpcy5zY3JlZW4ud2lkdGgsIGNhc3QucmlnaHQpO1xyXG4gICAgY29uc3QgdG9wID0gTWF0aC5tYXgoMCwgY2FzdC50b3ApO1xyXG4gICAgY29uc3QgYm90dG9tID0gTWF0aC5taW4odGhpcy5zY3JlZW4uaGVpZ2h0LCBjYXN0LmJvdHRvbSk7XHJcblxyXG4gICAgdGhpcy5jdHhfLmNsZWFyUmVjdCgwLCAwLCB0aGlzLnNjcmVlbi53aWR0aCwgdGhpcy5zY3JlZW4uaGVpZ2h0KTtcclxuXHJcbiAgICB0aGlzLmN0eF8ubGluZVdpZHRoID0gMTtcclxuICAgIHRoaXMuY3R4Xy5zdHJva2VTdHlsZSA9ICcjOGJlMGFkJztcclxuICAgIHRoaXMuY3R4Xy5iZWdpblBhdGgoKTtcclxuICAgIHRoaXMuY3R4Xy5tb3ZlVG8obGVmdCwgeSArIDAuNSk7XHJcbiAgICB0aGlzLmN0eF8ubGluZVRvKHJpZ2h0LCB5ICsgMC41KTtcclxuICAgIHRoaXMuY3R4Xy5tb3ZlVG8oeCArIDAuNSwgdG9wKTtcclxuICAgIHRoaXMuY3R4Xy5saW5lVG8oeCArIDAuNSwgYm90dG9tKTtcclxuICAgIHRoaXMuY3R4Xy5zdHJva2UoKTtcclxuXHJcbiAgICB0aGlzLmN0eF8uZm9udCA9IGAke3RoaXMuZm9udFNpemVffXB4IEFyaWFsYDtcclxuXHJcbiAgICB7XHJcbiAgICAgIGNvbnN0IGhvcml6b250YWxMYWJlbERpbSA9IHRoaXMuY3R4Xy5tZWFzdXJlVGV4dChgJHtyaWdodCAtIGxlZnR9YCk7XHJcbiAgICAgIGNvbnN0IGhseSA9IHkgKyB0aGlzLmZvbnRTaXplXyAvIDI7XHJcbiAgICAgIGNvbnN0IGhseCA9IE1hdGgubWluKHRoaXMuc2NyZWVuLndpZHRoIC0gaG9yaXpvbnRhbExhYmVsRGltLndpZHRoIC0gNSwgcmlnaHQgKyA1KTtcclxuICAgICAgdGhpcy5jdHhfLmZpbGxTdHlsZSA9ICdibGFjayc7XHJcbiAgICAgIHRoaXMuY3R4Xy5maWxsUmVjdChobHggLSAyLCBobHkgLSB0aGlzLmZvbnRTaXplXywgaG9yaXpvbnRhbExhYmVsRGltLndpZHRoICsgNCwgdGhpcy5mb250U2l6ZV8gKyA0KTtcclxuICAgICAgdGhpcy5jdHhfLmZpbGxTdHlsZSA9ICd3aGl0ZSc7XHJcbiAgICAgIHRoaXMuY3R4Xy5maWxsVGV4dChgJHtyaWdodCAtIGxlZnR9YCwgaGx4LCBobHkpO1xyXG4gICAgfVxyXG4gICAgeyBcclxuICAgICAgY29uc3QgdmVydGljYWxMYWJlbERpbSA9IHRoaXMuY3R4Xy5tZWFzdXJlVGV4dChgJHtib3R0b20gLSB0b3B9YCk7XHJcbiAgICAgIGNvbnN0IHZseSA9IE1hdGgubWluKHRoaXMuc2NyZWVuLmhlaWdodCAtIDEwLCBib3R0b20gKyB0aGlzLmZvbnRTaXplXyArIDQpO1xyXG4gICAgICBjb25zdCB2bHggPSB4IC0gdmVydGljYWxMYWJlbERpbS53aWR0aCAvIDI7XHJcbiAgICAgIHRoaXMuY3R4Xy5maWxsU3R5bGUgPSAnYmxhY2snO1xyXG4gICAgICB0aGlzLmN0eF8uZmlsbFJlY3Qodmx4IC0gMiwgdmx5IC0gdGhpcy5mb250U2l6ZV8sIHZlcnRpY2FsTGFiZWxEaW0ud2lkdGggKyA0LCB0aGlzLmZvbnRTaXplXyArIDQpO1xyXG4gICAgICB0aGlzLmN0eF8uZmlsbFN0eWxlID0gJ3doaXRlJztcclxuICAgICAgdGhpcy5jdHhfLmZpbGxUZXh0KGAke2JvdHRvbSAtIHRvcH1gLCB2bHgsIHZseSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY2FuZGlkYXRlcyA9IHRoaXMuc2NyZWVuLmJveGVzLmJveGVzLmZpbHRlcihib3ggPT4ge1xyXG4gICAgICBjb25zdCByZWN0ID0gdGhpcy5zY3JlZW4ubWVhc3VyZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoYm94KTtcclxuICAgICAgcmV0dXJuIGlzUG9pbnRJblJlY3QoeCwgeSwgcmVjdCk7XHJcbiAgICB9KVxyXG4gICAgY2FuZGlkYXRlcy5zb3J0KChhLCBiKSA9PiBnZXRSZWN0RGltKHRoaXMuc2NyZWVuLm1lYXN1cmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGEpKSAtIGdldFJlY3REaW0odGhpcy5zY3JlZW4ubWVhc3VyZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoYikpKTtcclxuICAgIGNvbnN0IGhvdmVyaW5nID0gY2FuZGlkYXRlc1swXTtcclxuICAgIGlmIChob3ZlcmluZykge1xyXG4gICAgICBjb25zdCBob3ZlcmluZ1JlY3QgPSB0aGlzLnNjcmVlbi5tZWFzdXJlLmdldEJvdW5kaW5nQ2xpZW50UmVjdChob3ZlcmluZyk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCBob3Jpem9udGFsTGFiZWxEaW0gPSB0aGlzLmN0eF8ubWVhc3VyZVRleHQoYCR7aG92ZXJpbmdSZWN0LnJpZ2h0IC0gaG92ZXJpbmdSZWN0LmxlZnR9YCk7XHJcbiAgICAgIGNvbnN0IGhseSA9IGhvdmVyaW5nUmVjdC50b3AgLSA2O1xyXG4gICAgICBjb25zdCBobHggPSBob3ZlcmluZ1JlY3QubGVmdCArIGhvdmVyaW5nUmVjdC53aWR0aCAvIDIgLSBob3Jpem9udGFsTGFiZWxEaW0ud2lkdGggLyAyO1xyXG4gICAgICB0aGlzLmN0eF8uZmlsbFN0eWxlID0gJyMwNDM1NDInO1xyXG4gICAgICB0aGlzLmN0eF8uZmlsbFJlY3QoaGx4IC0gMiwgaGx5IC0gdGhpcy5mb250U2l6ZV8sIGhvcml6b250YWxMYWJlbERpbS53aWR0aCArIDQsIHRoaXMuZm9udFNpemVfICsgNCk7XHJcbiAgICAgIHRoaXMuY3R4Xy5maWxsU3R5bGUgPSAnd2hpdGUnO1xyXG4gICAgICB0aGlzLmN0eF8uZmlsbFRleHQoYCR7aG92ZXJpbmdSZWN0LnJpZ2h0IC0gaG92ZXJpbmdSZWN0LmxlZnR9YCwgaGx4LCBobHkpO1xyXG5cclxuICAgICAgY29uc3QgdmVydGljYWxMYWJlbERpbSA9IHRoaXMuY3R4Xy5tZWFzdXJlVGV4dChgJHtob3ZlcmluZ1JlY3QuYm90dG9tIC0gaG92ZXJpbmdSZWN0LnRvcH1gKTtcclxuICAgICAgY29uc3Qgdmx5ID0gaG92ZXJpbmdSZWN0LnRvcCArIGhvdmVyaW5nUmVjdC5oZWlnaHQgLyAyICsgdGhpcy5mb250U2l6ZV8gLyAyO1xyXG4gICAgICBjb25zdCB2bHggPSBob3ZlcmluZ1JlY3QucmlnaHQgKyA2O1xyXG4gICAgICB0aGlzLmN0eF8uZmlsbFN0eWxlID0gJyMwNDM1NDInO1xyXG4gICAgICB0aGlzLmN0eF8uZmlsbFJlY3Qodmx4IC0gMiwgdmx5IC0gdGhpcy5mb250U2l6ZV8sIHZlcnRpY2FsTGFiZWxEaW0ud2lkdGggKyA0LCB0aGlzLmZvbnRTaXplXyArIDQpO1xyXG4gICAgICB0aGlzLmN0eF8uZmlsbFN0eWxlID0gJ3doaXRlJztcclxuICAgICAgdGhpcy5jdHhfLmZpbGxUZXh0KGAke2hvdmVyaW5nUmVjdC5ib3R0b20gLSBob3ZlcmluZ1JlY3QudG9wfWAsIHZseCwgdmx5KTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLndpZHRoTGFiZWxET01fLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgIHRoaXMuaGVpZ2h0TGFiZWxET01fLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjYW5CZVN3aXRjaGVkVG8odG9vbDogSVNjcmVlblRvb2wpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbn0iLCJpbXBvcnQgJy4vc2VsZWN0LnNjc3MnO1xyXG5pbXBvcnQgeyBTY3JlZW4gfSBmcm9tICdjb250ZW50L3NjcmVlbic7XHJcbmltcG9ydCB7IElTY3JlZW5Ub29sIH0gZnJvbSAnY29udGVudC90b29sL3Rvb2wnO1xyXG5pbXBvcnQgeyBhcHBseURPTVJlY3QsIGdldFJlY3REaW0sIGlzUG9pbnRJblJlY3QsIGlzUmVjdEluUmVjdCwgdGhyb3R0bGUsIFVOSVFVRV9JRCB9IGZyb20gJ2NvbnRlbnQvdXRpbCc7XHJcblxyXG5leHBvcnQgY2xhc3MgU2NyZWVuU2VsZWN0VG9vbCBpbXBsZW1lbnRzIElTY3JlZW5Ub29sIHtcclxuICBzdGF0aWMgcmVhZG9ubHkgTkFNRSA9ICdTY3JlZW5TZWxlY3RUb29sJztcclxuXHJcbiAgbmFtZTogc3RyaW5nID0gU2NyZWVuU2VsZWN0VG9vbC5OQU1FO1xyXG5cclxuICBwcml2YXRlIGRvbV86IEhUTUxFbGVtZW50O1xyXG4gIHByaXZhdGUgaG92ZXJpbmdET01fOiBIVE1MRWxlbWVudDtcclxuICBwcml2YXRlIGhvdmVyaW5nVGFyZ2V0RE9NXzogSFRNTEVsZW1lbnQ7XHJcbiAgcHJpdmF0ZSBzZWxlY3RpbmdET01fOiBIVE1MRWxlbWVudDtcclxuXHJcbiAgcHJpdmF0ZSBtb3VzZWRvd25YXzogbnVtYmVyO1xyXG4gIHByaXZhdGUgbW91c2Vkb3duWV86IG51bWJlcjtcclxuXHJcbiAgcHJpdmF0ZSB0b3BfOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSByaWdodF86IG51bWJlcjtcclxuICBwcml2YXRlIGJvdHRvbV86IG51bWJlcjtcclxuICBwcml2YXRlIGxlZnRfOiBudW1iZXI7XHJcblxyXG4gIHByaXZhdGUgcGhhc2VfOiAnT1ZFUicgfCAnVEhSRVMnIHwgJ1JBTkdFJztcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICByZWFkb25seSBzY3JlZW46IFNjcmVlblxyXG4gICkge1xyXG4gICAgdGhpcy5kb21fID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmRvbV8uY2xhc3NOYW1lID0gYCR7VU5JUVVFX0lEfSB0b29sLXNlbGVjdGA7XHJcblxyXG4gICAgdGhpcy5oYW5kbGVNb3VzZWRvd24gPSB0aGlzLmhhbmRsZU1vdXNlZG93bi5iaW5kKHRoaXMpO1xyXG4gICAgdGhpcy5oYW5kbGVNb3VzZW1vdmUgPSB0aGlzLmhhbmRsZU1vdXNlbW92ZS5iaW5kKHRoaXMpO1xyXG4gICAgdGhpcy5oYW5kbGVNb3VzZXVwID0gdGhpcy5oYW5kbGVNb3VzZXVwLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLnVwZGF0ZUhvdmVyaW5nID0gdGhyb3R0bGUodGhpcy51cGRhdGVIb3ZlcmluZy5iaW5kKHRoaXMpLCAzMyk7XHJcbiAgfVxyXG5cclxuICBvbkFjdGl2YXRlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5ob3ZlcmluZ0RPTV8/LnJlbW92ZSgpO1xyXG4gICAgdGhpcy5zZWxlY3RpbmdET01fPy5yZW1vdmUoKTtcclxuICAgIHRoaXMuc2NyZWVuLmRvbS5hcHBlbmQodGhpcy5kb21fKTtcclxuICAgIHRoaXMucGhhc2VfID0gJ09WRVInO1xyXG5cclxuICAgIHRoaXMuZG9tXy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIGUgPT4gZS5wcmV2ZW50RGVmYXVsdCgpKTtcclxuICAgIHRoaXMuZG9tXy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLmhhbmRsZU1vdXNlZG93bik7XHJcbiAgICB0aGlzLmRvbV8uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5oYW5kbGVNb3VzZW1vdmUpO1xyXG4gICAgdGhpcy5kb21fLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLmhhbmRsZU1vdXNldXApO1xyXG4gIH1cclxuXHJcbiAgb25EZWFjdGl2YXRlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5ob3ZlcmluZ0RPTV8/LnJlbW92ZSgpO1xyXG4gICAgdGhpcy5zZWxlY3RpbmdET01fPy5yZW1vdmUoKTtcclxuICAgIHRoaXMuZG9tXy5yZW1vdmUoKTtcclxuICAgIFxyXG4gICAgdGhpcy5kb21fLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuaGFuZGxlTW91c2Vkb3duKTtcclxuICAgIHRoaXMuZG9tXy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLmhhbmRsZU1vdXNlbW92ZSk7XHJcbiAgICB0aGlzLmRvbV8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuaGFuZGxlTW91c2V1cCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZU1vdXNlZG93bihlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBjb25zdCB4ID0gdGhpcy5zY3JlZW4uY2xpZW50WDtcclxuICAgIGNvbnN0IHkgPSB0aGlzLnNjcmVlbi5jbGllbnRZO1xyXG4gICAgdGhpcy5tb3VzZWRvd25YXyA9IHg7XHJcbiAgICB0aGlzLm1vdXNlZG93bllfID0geTtcclxuXHJcbiAgICBpZiAodGhpcy5waGFzZV8gPT0gJ09WRVInKSB7XHJcbiAgICAgIHRoaXMucGhhc2VfID0gJ1RIUkVTJztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlTW91c2Vtb3ZlKCkge1xyXG4gICAgY29uc3QgeCA9IHRoaXMuc2NyZWVuLmNsaWVudFg7XHJcbiAgICBjb25zdCB5ID0gdGhpcy5zY3JlZW4uY2xpZW50WTtcclxuXHJcbiAgICBpZiAodGhpcy5waGFzZV8gPT09ICdPVkVSJyB8fCB0aGlzLnBoYXNlXyA9PT0gJ1RIUkVTJykge1xyXG4gICAgICBpZiAoIXRoaXMuaG92ZXJpbmdET01fKSB7XHJcbiAgICAgICAgdGhpcy5ob3ZlcmluZ0RPTV8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICB0aGlzLmhvdmVyaW5nRE9NXy5jbGFzc05hbWUgPSBgJHtVTklRVUVfSUR9IGhvdmVyaW5nYDtcclxuICAgICAgICB0aGlzLmRvbV8uYXBwZW5kKHRoaXMuaG92ZXJpbmdET01fKTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLnVwZGF0ZUhvdmVyaW5nKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0aGlzLnBoYXNlXyA9PT0gJ1JBTkdFJykge1xyXG4gICAgICB0aGlzLnJpZ2h0XyA9IHg7XHJcbiAgICAgIHRoaXMuYm90dG9tXyA9IHk7XHJcbiAgICAgIHRoaXMudXBkYXRlU2VsZWN0aW5ET00oKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYgKHRoaXMucGhhc2VfID09PSAnVEhSRVMnKSB7XHJcbiAgICAgIGlmIChNYXRoLmFicyh0aGlzLm1vdXNlZG93blhfIC0geCkgKyBNYXRoLmFicyh0aGlzLm1vdXNlZG93bllfIC0geSkgPiAzKSB7XHJcbiAgICAgICAgdGhpcy5ob3ZlcmluZ0RPTV8ucmVtb3ZlKCk7XHJcbiAgICAgICAgdGhpcy5ob3ZlcmluZ0RPTV8gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RpbmdET01fID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RpbmdET01fLmNsYXNzTmFtZSA9IGAke1VOSVFVRV9JRH0gc2VsZWN0aW5nYDtcclxuICAgICAgICB0aGlzLmRvbV8uYXBwZW5kKHRoaXMuc2VsZWN0aW5nRE9NXyk7XHJcbiAgICAgICAgdGhpcy50b3BfID0geTtcclxuICAgICAgICB0aGlzLnJpZ2h0XyA9IHg7XHJcbiAgICAgICAgdGhpcy5ib3R0b21fID0geTtcclxuICAgICAgICB0aGlzLmxlZnRfID0geDtcclxuICAgICAgICB0aGlzLnVwZGF0ZVNlbGVjdGluRE9NKCk7XHJcbiAgICAgICAgdGhpcy5waGFzZV8gPSAnUkFOR0UnO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHVwZGF0ZUhvdmVyaW5nKCkge1xyXG4gICAgY29uc3QgeCA9IHRoaXMuc2NyZWVuLmNsaWVudFg7XHJcbiAgICBjb25zdCB5ID0gdGhpcy5zY3JlZW4uY2xpZW50WTtcclxuICAgIGlmICh0aGlzLnBoYXNlXyA9PT0gJ09WRVInIHx8IHRoaXMucGhhc2VfID09PSAnVEhSRVMnKSB7XHJcbiAgICAgIGNvbnN0IGRvbSA9IHRoaXMuc2NyZWVuLm1lYXN1cmUuZ2V0U21hbGxlc3RET01BdCh4LCB5KTtcclxuICAgICAgdGhpcy5ob3ZlcmluZ1RhcmdldERPTV8gPSBkb207XHJcbiAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLnNjcmVlbi5tZWFzdXJlLmdldEJvdW5kaW5nQ2xpZW50UmVjdChkb20pO1xyXG4gICAgICBhcHBseURPTVJlY3QodGhpcy5ob3ZlcmluZ0RPTV8sIHJlY3QpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVNb3VzZXVwKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgIGNvbnN0IHggPSB0aGlzLnNjcmVlbi5jbGllbnRYO1xyXG4gICAgY29uc3QgeSA9IHRoaXMuc2NyZWVuLmNsaWVudFk7XHJcbiAgICBpZiAodGhpcy5waGFzZV8gPT09ICdSQU5HRScpIHtcclxuICAgICAgaWYgKGUuYnV0dG9uID09IDApIHtcclxuICAgICAgICBjb25zdCBiZXN0ID0gdGhpcy5zY3JlZW4ubWVhc3VyZS5nZXRCZXN0TWF0Y2hlZERPTUluc2lkZSh0aGlzLnNlbGVjdGluZ0RPTV8uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkpO1xyXG4gICAgICAgIGlmIChiZXN0KSB7XHJcbiAgICAgICAgICB0aGlzLnNjcmVlbi5ib3hlcy5hZGQoYmVzdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmIChlLmJ1dHRvbiA9PSAyKSB7XHJcbiAgICAgICAgY29uc3QgcmVtb3ZlcyA9IHRoaXMuc2NyZWVuLmJveGVzLmJveGVzLmZpbHRlcihib3ggPT4gaXNSZWN0SW5SZWN0KHRoaXMuc2VsZWN0aW5nRE9NXy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSwgdGhpcy5zY3JlZW4ubWVhc3VyZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoYm94KSkpO1xyXG4gICAgICAgIGZvciAoY29uc3QgcmVtb3ZlIG9mIHJlbW92ZXMpIHtcclxuICAgICAgICAgIHRoaXMuc2NyZWVuLmJveGVzLnJlbW92ZShyZW1vdmUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB0aGlzLnNlbGVjdGluZ0RPTV8ucmVtb3ZlKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgaWYgKGUuYnV0dG9uID09IDApIHtcclxuICAgICAgICBpZiAodGhpcy5ob3ZlcmluZ1RhcmdldERPTV8pIHtcclxuICAgICAgICAgIHRoaXMuc2NyZWVuLmJveGVzLmFkZCh0aGlzLmhvdmVyaW5nVGFyZ2V0RE9NXyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmIChlLmJ1dHRvbiA9PT0gMikge1xyXG4gICAgICAgIGNvbnN0IHJlbW92ZXMgPSB0aGlzLnNjcmVlbi5ib3hlcy5ib3hlcy5maWx0ZXIoYm94ID0+IHtcclxuICAgICAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLnNjcmVlbi5tZWFzdXJlLmdldEJvdW5kaW5nQ2xpZW50UmVjdChib3gpO1xyXG4gICAgICAgICAgcmV0dXJuIGlzUG9pbnRJblJlY3QoeCwgeSwgcmVjdCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICByZW1vdmVzLnNvcnQoKGEsIGIpID0+IGdldFJlY3REaW0odGhpcy5zY3JlZW4ubWVhc3VyZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoYSkpIC0gZ2V0UmVjdERpbSh0aGlzLnNjcmVlbi5tZWFzdXJlLmdldEJvdW5kaW5nQ2xpZW50UmVjdChiKSkpO1xyXG4gICAgICAgIHJlbW92ZXNbMF0gJiYgdGhpcy5zY3JlZW4uYm94ZXMucmVtb3ZlKHJlbW92ZXNbMF0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnBoYXNlXyA9ICdPVkVSJztcclxuICB9XHJcblxyXG4gIHByaXZhdGUgdXBkYXRlU2VsZWN0aW5ET00oKSB7XHJcbiAgICBjb25zdCBsID0gTWF0aC5taW4odGhpcy5sZWZ0XywgdGhpcy5yaWdodF8pO1xyXG4gICAgY29uc3QgciA9IE1hdGgubWF4KHRoaXMubGVmdF8sIHRoaXMucmlnaHRfKTtcclxuICAgIGNvbnN0IHQgPSBNYXRoLm1pbih0aGlzLnRvcF8sIHRoaXMuYm90dG9tXyk7XHJcbiAgICBjb25zdCBiID0gTWF0aC5tYXgodGhpcy50b3BfLCB0aGlzLmJvdHRvbV8pO1xyXG4gICAgdGhpcy5zZWxlY3RpbmdET01fLnN0eWxlLmxlZnQgPSBgJHtsfXB4YDtcclxuICAgIHRoaXMuc2VsZWN0aW5nRE9NXy5zdHlsZS50b3AgPSBgJHt0fXB4YDtcclxuICAgIHRoaXMuc2VsZWN0aW5nRE9NXy5zdHlsZS53aWR0aCA9IGAke3IgLSBsfXB4YDtcclxuICAgIHRoaXMuc2VsZWN0aW5nRE9NXy5zdHlsZS5oZWlnaHQgPSBgJHtiIC0gdH1weGA7XHJcbiAgfVxyXG5cclxuICBjYW5CZVN3aXRjaGVkVG8odG9vbDogSVNjcmVlblRvb2wpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbn0iLCJleHBvcnQgY29uc3QgVU5JUVVFX0lEID0gJ19fX19fX21lYXN1cmUnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRocm90dGxlIChjYWxsYmFjaywgbGltaXQpIHtcclxuICAgIHZhciB3YWl0aW5nID0gZmFsc2U7ICAgICAgICAgICAgICAgICAgICAgIC8vIEluaXRpYWxseSwgd2UncmUgbm90IHdhaXRpbmdcclxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7ICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIHJldHVybiBhIHRocm90dGxlZCBmdW5jdGlvblxyXG4gICAgICAgIGlmICghd2FpdGluZykgeyAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UncmUgbm90IHdhaXRpbmdcclxuICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTsgIC8vIEV4ZWN1dGUgdXNlcnMgZnVuY3Rpb25cclxuICAgICAgICAgICAgd2FpdGluZyA9IHRydWU7ICAgICAgICAgICAgICAgICAgIC8vIFByZXZlbnQgZnV0dXJlIGludm9jYXRpb25zXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyAgICAgICAgICAvLyBBZnRlciBhIHBlcmlvZCBvZiB0aW1lXHJcbiAgICAgICAgICAgICAgICB3YWl0aW5nID0gZmFsc2U7ICAgICAgICAgICAgICAvLyBBbmQgYWxsb3cgZnV0dXJlIGludm9jYXRpb25zXHJcbiAgICAgICAgICAgIH0sIGxpbWl0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUmVjdCB7XHJcbiAgdG9wOiBudW1iZXI7XHJcbiAgcmlnaHQ6IG51bWJlcjtcclxuICBib3R0b206IG51bWJlcjtcclxuICBsZWZ0OiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhcHBseURPTVJlY3Qoc3JjOiBIVE1MRWxlbWVudCwgcmVjdDogRE9NUmVjdCkge1xyXG4gIHNyYy5zdHlsZS5sZWZ0ID0gYCR7cmVjdC5sZWZ0fXB4YDtcclxuICBzcmMuc3R5bGUudG9wID0gYCR7cmVjdC50b3B9cHhgO1xyXG4gIHNyYy5zdHlsZS53aWR0aCA9IGAke3JlY3Qud2lkdGh9cHhgO1xyXG4gIHNyYy5zdHlsZS5oZWlnaHQgPSBgJHtyZWN0LmhlaWdodH1weGA7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1BvaW50SW5SZWN0KHg6IG51bWJlciwgeTogbnVtYmVyLCByZWN0OiBSZWN0KTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIHJlY3QubGVmdCA8PSB4ICYmIHggPD0gcmVjdC5yaWdodCAmJiByZWN0LnRvcCA8PSB5ICYmIHkgPD0gcmVjdC5ib3R0b207XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRSZWN0RGltKHJlY3Q6IFJlY3QpOiBudW1iZXIge1xyXG4gIHJldHVybiAocmVjdC5yaWdodCAtIHJlY3QubGVmdCkgKiAocmVjdC5ib3R0b20gLSByZWN0LnRvcCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRPdmVybGFwcGluZ0RpbShsaHM6IFJlY3QsIHJoczogUmVjdCk6IG51bWJlciB7XHJcbiAgY29uc3QgdyA9IE1hdGgubWluKGxocy5yaWdodCwgcmhzLnJpZ2h0KSAtIE1hdGgubWF4KGxocy5sZWZ0LCByaHMubGVmdCk7XHJcbiAgY29uc3QgaCA9IE1hdGgubWluKGxocy5ib3R0b20gLSByaHMuYm90dG9tKSAtIE1hdGgubWF4KGxocy50b3AgLSByaHMudG9wKTtcclxuICBpZiAodyA+PSAwICYmIGggPj0gMCkgcmV0dXJuIHcgKiBoO1xyXG4gIHJldHVybiAwO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNSZWN0SW5SZWN0KG91dHNpZGU6IFJlY3QsIGluc2lkZTogUmVjdCk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBvdXRzaWRlLmxlZnQgPD0gaW5zaWRlLmxlZnQgJiYgb3V0c2lkZS5yaWdodCA+PSBpbnNpZGUucmlnaHQgJiZcclxuICAgICAgICAgb3V0c2lkZS50b3AgPD0gaW5zaWRlLnRvcCAmJiBvdXRzaWRlLmJvdHRvbSA+PSBpbnNpZGUuYm90dG9tO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmF5Y2FzdCh4OiBudW1iZXIsIHk6IG51bWJlciwgcmVjdHM6IHJlYWRvbmx5IFJlY3RbXSkge1xyXG4gIGxldCBsZWZ0ID0gLUluZmluaXR5O1xyXG4gIGxldCByaWdodCA9IEluZmluaXR5O1xyXG4gIGxldCB0b3AgPSAtSW5maW5pdHk7XHJcbiAgbGV0IGJvdHRvbSA9IEluZmluaXR5O1xyXG5cclxuICBmb3IgKGNvbnN0IHJlY3Qgb2YgcmVjdHMpIHtcclxuICAgIGlmICh4IDw9IHJlY3QubGVmdCAmJiByZWN0LnRvcCA8PSB5ICYmIHkgPD0gcmVjdC5ib3R0b20pIHtcclxuICAgICAgcmlnaHQgPSBNYXRoLm1pbihyaWdodCwgcmVjdC5sZWZ0KTtcclxuICAgIH1cclxuICAgIGlmIChyZWN0LnJpZ2h0IDw9IHggJiYgcmVjdC50b3AgPD0geSAmJiB5IDw9IHJlY3QuYm90dG9tKSB7XHJcbiAgICAgIGxlZnQgPSBNYXRoLm1heChsZWZ0LCByZWN0LnJpZ2h0KTtcclxuICAgIH1cclxuICAgIGlmICh5IDw9IHJlY3QudG9wICYmIHJlY3QubGVmdCA8PSB4ICYmIHggPD0gcmVjdC5yaWdodCkge1xyXG4gICAgICBib3R0b20gPSBNYXRoLm1pbihib3R0b20sIHJlY3QudG9wKTtcclxuICAgIH1cclxuICAgIGlmIChyZWN0LmJvdHRvbSA8PSB5ICYmIHJlY3QubGVmdCA8PSB4ICYmIHggPD0gcmVjdC5yaWdodCkge1xyXG4gICAgICB0b3AgPSBNYXRoLm1heCh0b3AsIHJlY3QuYm90dG9tKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBsZWZ0LCByaWdodCwgdG9wLCBib3R0b21cclxuICB9O1xyXG59IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0aWYoX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSkge1xuXHRcdHJldHVybiBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0aWQ6IG1vZHVsZUlkLFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZVxuX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vY29udGVudC9pbmRleC50c1wiKTtcbi8vIFRoaXMgZW50cnkgbW9kdWxlIHVzZWQgJ2V4cG9ydHMnIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbiJdLCJzb3VyY2VSb290IjoiIn0=