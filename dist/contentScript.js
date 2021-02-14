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
___CSS_LOADER_EXPORT___.push([module.id, ".tool-measure {\n  position: absolute;\n  top: 0;\n  left: 0;\n}\n.tool-measure .horizontal {\n  position: absolute;\n  top: 0;\n  height: 1px;\n  background-color: cornflowerblue;\n}\n.tool-measure .vertical {\n  position: absolute;\n  left: 0;\n  width: 1px;\n  background-color: cornflowerblue;\n}\n.tool-measure .label {\n  position: absolute;\n  font-size: 11px;\n  background: black;\n  color: white;\n  padding: 3px;\n  box-sizing: border-box;\n  opacity: 1;\n  border-radius: 7px;\n}", "",{"version":3,"sources":["webpack://./content/tool/measure.scss"],"names":[],"mappings":"AAAA;EACE,kBAAA;EACA,MAAA;EACA,OAAA;AACF;AACE;EACE,kBAAA;EACA,MAAA;EACA,WAAA;EACA,gCAAA;AACJ;AAEE;EACE,kBAAA;EACA,OAAA;EACA,UAAA;EACA,gCAAA;AAAJ;AAGE;EACE,kBAAA;EACA,eAAA;EACA,iBAAA;EACA,YAAA;EACA,YAAA;EACA,sBAAA;EACA,UAAA;EACA,kBAAA;AADJ","sourcesContent":[".tool-measure {\r\n  position: absolute;\r\n  top: 0;\r\n  left: 0;\r\n\r\n  .horizontal {\r\n    position: absolute;\r\n    top: 0;\r\n    height: 1px;\r\n    background-color: cornflowerblue;\r\n  }\r\n\r\n  .vertical {\r\n    position: absolute;\r\n    left: 0;\r\n    width: 1px;\r\n    background-color: cornflowerblue;\r\n  }\r\n\r\n  .label {\r\n    position: absolute;\r\n    font-size: 11px;\r\n    background: black;\r\n    color: white;\r\n    padding: 3px;\r\n    box-sizing: border-box;\r\n    opacity: 1;\r\n    border-radius: 7px;\r\n  }\r\n\r\n}"],"sourceRoot":""}]);
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
___CSS_LOADER_EXPORT___.push([module.id, ".tool-select {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  pointer-events: auto;\n  cursor: none;\n}\n.tool-select .hovering {\n  position: absolute;\n  background-color: steelblue;\n  border: 1px solid red;\n  box-sizing: border-box;\n  opacity: 0.1;\n}\n.tool-select .selecting {\n  position: absolute;\n  background-color: steelblue;\n  opacity: 0.15;\n}", "",{"version":3,"sources":["webpack://./content/tool/select.scss"],"names":[],"mappings":"AAAA;EACE,kBAAA;EACA,MAAA;EACA,OAAA;EACA,QAAA;EACA,SAAA;EACA,oBAAA;EACA,YAAA;AACF;AACE;EACE,kBAAA;EACA,2BAAA;EACA,qBAAA;EACA,sBAAA;EACA,YAAA;AACJ;AAEE;EACE,kBAAA;EACA,2BAAA;EACA,aAAA;AAAJ","sourcesContent":[".tool-select {\r\n  position: absolute;\r\n  top: 0;\r\n  left: 0;\r\n  right: 0;\r\n  bottom: 0;\r\n  pointer-events: auto;\r\n  cursor: none;\r\n\r\n  .hovering {\r\n    position: absolute;\r\n    background-color: steelblue;\r\n    border: 1px solid red;\r\n    box-sizing: border-box;\r\n    opacity: .1;\r\n  }\r\n\r\n  .selecting {\r\n    position: absolute;\r\n    background-color: steelblue;\r\n    opacity: .15;\r\n  }\r\n\r\n}"],"sourceRoot":""}]);
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
        this.ctx_.beginPath();
        this.ctx_.moveTo(left, y + 0.5);
        this.ctx_.lineTo(right, y + 0.5);
        this.ctx_.moveTo(x + 0.5, top);
        this.ctx_.lineTo(x + 0.5, bottom);
        this.ctx_.stroke();
        this.ctx_.font = '11px';
        {
            var horizontalLabelDim = this.ctx_.measureText("" + (right - left));
            var hly = y + 5;
            var hlx = Math.min(this.screen.width - horizontalLabelDim.width - 5, right + 5);
            this.ctx_.fillStyle = 'black';
            this.ctx_.fillRect(hlx - 2, hly - 12, horizontalLabelDim.width + 4, 11 + 4);
            this.ctx_.fillStyle = 'white';
            this.ctx_.fillText("" + (right - left), hlx, hly);
        }
        {
            var verticalLabelDim = this.ctx_.measureText("" + (bottom - top));
            var vly = Math.min(this.screen.height - 10, bottom + 15);
            var vlx = x - verticalLabelDim.width / 2;
            this.ctx_.fillStyle = 'black';
            this.ctx_.fillRect(vlx - 2, vly - 12, verticalLabelDim.width + 4, 11 + 4);
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
            this.ctx_.fillStyle = '#474747';
            this.ctx_.fillRect(hlx - 2, hly - 12, horizontalLabelDim.width + 4, 11 + 4);
            this.ctx_.fillStyle = 'white';
            this.ctx_.fillText("" + (hoveringRect.right - hoveringRect.left), hlx, hly);
            var verticalLabelDim = this.ctx_.measureText("" + (hoveringRect.bottom - hoveringRect.top));
            var vly = hoveringRect.top + hoveringRect.height / 2 + 11 / 2;
            var vlx = hoveringRect.right + 6;
            this.ctx_.fillStyle = '#474747';
            this.ctx_.fillRect(vlx - 2, vly - 12, verticalLabelDim.width + 4, 11 + 4);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9waXhkb20vLi9ub2RlX21vZHVsZXMvQG9yYW5nZTRnbGFjZS92cy1saWIvYmFzZS9jb21tb24vZXJyb3JzL2luZGV4LmpzIiwid2VicGFjazovL3BpeGRvbS8uL25vZGVfbW9kdWxlcy9Ab3JhbmdlNGdsYWNlL3ZzLWxpYi9iYXNlL2NvbW1vbi9ldmVudC9pbmRleC5qcyIsIndlYnBhY2s6Ly9waXhkb20vLi9ub2RlX21vZHVsZXMvQG9yYW5nZTRnbGFjZS92cy1saWIvYmFzZS9jb21tb24vZnVuY3Rpb25hbC9pbmRleC5qcyIsIndlYnBhY2s6Ly9waXhkb20vLi9ub2RlX21vZHVsZXMvQG9yYW5nZTRnbGFjZS92cy1saWIvYmFzZS9jb21tb24vaXRlcmF0b3IvaW5kZXguanMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vbm9kZV9tb2R1bGVzL0BvcmFuZ2U0Z2xhY2UvdnMtbGliL2Jhc2UvY29tbW9uL2xpZmVjeWNsZS9pbmRleC5qcyIsIndlYnBhY2s6Ly9waXhkb20vLi9ub2RlX21vZHVsZXMvQG9yYW5nZTRnbGFjZS92cy1saWIvYmFzZS9jb21tb24vbGlua2VkTGlzdC9pbmRleC5qcyIsIndlYnBhY2s6Ly9waXhkb20vLi9jb250ZW50L3NjcmVlbi5zY3NzIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvdG9vbC9tZWFzdXJlLnNjc3MiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vY29udGVudC90b29sL3NlbGVjdC5zY3NzIiwid2VicGFjazovL3BpeGRvbS8uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9hcGkuanMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2Nzc1dpdGhNYXBwaW5nVG9TdHJpbmcuanMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vY29udGVudC9zY3JlZW4uc2Nzcz9mOWFiIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvdG9vbC9tZWFzdXJlLnNjc3M/NTliYyIsIndlYnBhY2s6Ly9waXhkb20vLi9jb250ZW50L3Rvb2wvc2VsZWN0LnNjc3M/ODA3ZiIsIndlYnBhY2s6Ly9waXhkb20vLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbmplY3RTdHlsZXNJbnRvU3R5bGVUYWcuanMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vY29udGVudC9ib3hNYW5hZ2VyLnRzIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vY29udGVudC9tZWFzdXJlLnRzIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvc2NyZWVuLnRzIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvdG9vbC9tZWFzdXJlLnRzIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvdG9vbC9zZWxlY3QudHMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vY29udGVudC91dGlsLnRzIiwid2VicGFjazovL3BpeGRvbS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9waXhkb20vd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vcGl4ZG9tL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9waXhkb20vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9waXhkb20vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9waXhkb20vd2VicGFjay9zdGFydHVwIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBYTs7QUFFYiw4Q0FBNkMsQ0FBQyxjQUFjLEVBQUM7O0FBRTdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9DQUFvQywyQ0FBMkM7QUFDL0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQ0FBb0MsMkNBQTJDO0FBQy9FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxvQkFBb0IsYUFBYSxLQUFLO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCLFVBQVUsNkNBQTZDLGNBQWMsOENBQThDLFNBQVM7QUFDeko7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0RBQXdELFVBQVU7QUFDbEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsRUFBRTtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CO0FBQ3BCLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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SUFBSSxHQUFNLElBQUksQ0FBQyxJQUFJLE9BQUksQ0FBQztJQUNsQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBTSxJQUFJLENBQUMsR0FBRyxPQUFJLENBQUM7SUFDaEMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQU0sSUFBSSxDQUFDLEtBQUssT0FBSSxDQUFDO0lBQ3BDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFNLElBQUksQ0FBQyxNQUFNLE9BQUksQ0FBQztBQUN4QyxDQUFDO0FBRU0sU0FBUyxhQUFhLENBQUMsQ0FBUyxFQUFFLENBQVMsRUFBRSxJQUFVO0lBQzVELE9BQU8sSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDaEYsQ0FBQztBQUVNLFNBQVMsVUFBVSxDQUFDLElBQVU7SUFDbkMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDN0QsQ0FBQztBQUVNLFNBQVMsaUJBQWlCLENBQUMsR0FBUyxFQUFFLEdBQVM7SUFDcEQsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hFLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMxRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbkMsT0FBTyxDQUFDLENBQUM7QUFDWCxDQUFDO0FBRU0sU0FBUyxZQUFZLENBQUMsT0FBYSxFQUFFLE1BQVk7SUFDdEQsT0FBTyxPQUFPLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLEtBQUssSUFBSSxNQUFNLENBQUMsS0FBSztRQUM1RCxPQUFPLENBQUMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ3RFLENBQUM7QUFFTSxTQUFTLE9BQU8sQ0FBQyxDQUFTLEVBQUUsQ0FBUyxFQUFFLEtBQXNCOztJQUNsRSxJQUFJLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQztJQUNyQixJQUFJLEtBQUssR0FBRyxRQUFRLENBQUM7SUFDckIsSUFBSSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUM7SUFDcEIsSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDOztRQUV0QixLQUFtQiw0QkFBSyw0RUFBRTtZQUFyQixJQUFNLElBQUk7WUFDYixJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUN2RCxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3BDO1lBQ0QsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDeEQsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUNuQztZQUNELElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ3RELE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDckM7WUFDRCxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUN6RCxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ2xDO1NBQ0Y7Ozs7Ozs7OztJQUVELE9BQU87UUFDTCxJQUFJLFFBQUUsS0FBSyxTQUFFLEdBQUcsT0FBRSxNQUFNO0tBQ3pCLENBQUM7QUFDSixDQUFDOzs7Ozs7O1VDekVEO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3JCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsZ0NBQWdDLFlBQVk7V0FDNUM7V0FDQSxFOzs7OztXQ1BBO1dBQ0E7V0FDQTtXQUNBO1dBQ0Esd0NBQXdDLHlDQUF5QztXQUNqRjtXQUNBO1dBQ0EsRTs7Ozs7V0NQQSx3Rjs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSxzREFBc0Qsa0JBQWtCO1dBQ3hFO1dBQ0EsK0NBQStDLGNBQWM7V0FDN0QsRTs7OztVQ05BO1VBQ0E7VUFDQTtVQUNBIiwiZmlsZSI6ImNvbnRlbnRTY3JpcHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG4vLyBBdm9pZCBjaXJjdWxhciBkZXBlbmRlbmN5IG9uIEV2ZW50RW1pdHRlciBieSBpbXBsZW1lbnRpbmcgYSBzdWJzZXQgb2YgdGhlIGludGVyZmFjZS5cclxuY2xhc3MgRXJyb3JIYW5kbGVyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gW107XHJcbiAgICAgICAgdGhpcy51bmV4cGVjdGVkRXJyb3JIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZS5zdGFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlLm1lc3NhZ2UgKyAnXFxuXFxuJyArIGUuc3RhY2spO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgICAgfSwgMCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIGFkZExpc3RlbmVyKGxpc3RlbmVyKSB7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XHJcbiAgICAgICAgcmV0dXJuICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBlbWl0KGUpIHtcclxuICAgICAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xyXG4gICAgICAgICAgICBsaXN0ZW5lcihlKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIF9yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge1xyXG4gICAgICAgIHRoaXMubGlzdGVuZXJzLnNwbGljZSh0aGlzLmxpc3RlbmVycy5pbmRleE9mKGxpc3RlbmVyKSwgMSk7XHJcbiAgICB9XHJcbiAgICBzZXRVbmV4cGVjdGVkRXJyb3JIYW5kbGVyKG5ld1VuZXhwZWN0ZWRFcnJvckhhbmRsZXIpIHtcclxuICAgICAgICB0aGlzLnVuZXhwZWN0ZWRFcnJvckhhbmRsZXIgPSBuZXdVbmV4cGVjdGVkRXJyb3JIYW5kbGVyO1xyXG4gICAgfVxyXG4gICAgZ2V0VW5leHBlY3RlZEVycm9ySGFuZGxlcigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy51bmV4cGVjdGVkRXJyb3JIYW5kbGVyO1xyXG4gICAgfVxyXG4gICAgb25VbmV4cGVjdGVkRXJyb3IoZSkge1xyXG4gICAgICAgIHRoaXMudW5leHBlY3RlZEVycm9ySGFuZGxlcihlKTtcclxuICAgICAgICB0aGlzLmVtaXQoZSk7XHJcbiAgICB9XHJcbiAgICAvLyBGb3IgZXh0ZXJuYWwgZXJyb3JzLCB3ZSBkb24ndCB3YW50IHRoZSBsaXN0ZW5lcnMgdG8gYmUgY2FsbGVkXHJcbiAgICBvblVuZXhwZWN0ZWRFeHRlcm5hbEVycm9yKGUpIHtcclxuICAgICAgICB0aGlzLnVuZXhwZWN0ZWRFcnJvckhhbmRsZXIoZSk7XHJcbiAgICB9XHJcbn1cclxuY29uc3QgZXJyb3JIYW5kbGVyID0gbmV3IEVycm9ySGFuZGxlcigpO1xyXG5mdW5jdGlvbiBzZXRVbmV4cGVjdGVkRXJyb3JIYW5kbGVyKG5ld1VuZXhwZWN0ZWRFcnJvckhhbmRsZXIpIHtcclxuICAgIGVycm9ySGFuZGxlci5zZXRVbmV4cGVjdGVkRXJyb3JIYW5kbGVyKG5ld1VuZXhwZWN0ZWRFcnJvckhhbmRsZXIpO1xyXG59XHJcbmZ1bmN0aW9uIG9uVW5leHBlY3RlZEVycm9yKGUpIHtcclxuICAgIC8vIGlnbm9yZSBlcnJvcnMgZnJvbSBjYW5jZWxsZWQgcHJvbWlzZXNcclxuICAgIGlmICghaXNQcm9taXNlQ2FuY2VsZWRFcnJvcihlKSkge1xyXG4gICAgICAgIGVycm9ySGFuZGxlci5vblVuZXhwZWN0ZWRFcnJvcihlKTtcclxuICAgIH1cclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuZnVuY3Rpb24gb25VbmV4cGVjdGVkRXh0ZXJuYWxFcnJvcihlKSB7XHJcbiAgICAvLyBpZ25vcmUgZXJyb3JzIGZyb20gY2FuY2VsbGVkIHByb21pc2VzXHJcbiAgICBpZiAoIWlzUHJvbWlzZUNhbmNlbGVkRXJyb3IoZSkpIHtcclxuICAgICAgICBlcnJvckhhbmRsZXIub25VbmV4cGVjdGVkRXh0ZXJuYWxFcnJvcihlKTtcclxuICAgIH1cclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuZnVuY3Rpb24gdHJhbnNmb3JtRXJyb3JGb3JTZXJpYWxpemF0aW9uKGVycm9yKSB7XHJcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xyXG4gICAgICAgIGxldCB7IG5hbWUsIG1lc3NhZ2UgfSA9IGVycm9yO1xyXG4gICAgICAgIGNvbnN0IHN0YWNrID0gZXJyb3Iuc3RhY2t0cmFjZSB8fCBlcnJvci5zdGFjaztcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAkaXNFcnJvcjogdHJ1ZSxcclxuICAgICAgICAgICAgbmFtZSxcclxuICAgICAgICAgICAgbWVzc2FnZSxcclxuICAgICAgICAgICAgc3RhY2tcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgLy8gcmV0dXJuIGFzIGlzXHJcbiAgICByZXR1cm4gZXJyb3I7XHJcbn1cclxuY29uc3QgY2FuY2VsZWROYW1lID0gJ0NhbmNlbGVkJztcclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gZXJyb3IgaXMgYSBwcm9taXNlIGluIGNhbmNlbGVkIHN0YXRlXHJcbiAqL1xyXG5mdW5jdGlvbiBpc1Byb21pc2VDYW5jZWxlZEVycm9yKGVycm9yKSB7XHJcbiAgICByZXR1cm4gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiBlcnJvci5uYW1lID09PSBjYW5jZWxlZE5hbWUgJiYgZXJyb3IubWVzc2FnZSA9PT0gY2FuY2VsZWROYW1lO1xyXG59XHJcbi8qKlxyXG4gKiBSZXR1cm5zIGFuIGVycm9yIHRoYXQgc2lnbmFscyBjYW5jZWxsYXRpb24uXHJcbiAqL1xyXG5mdW5jdGlvbiBjYW5jZWxlZCgpIHtcclxuICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGNhbmNlbGVkTmFtZSk7XHJcbiAgICBlcnJvci5uYW1lID0gZXJyb3IubWVzc2FnZTtcclxuICAgIHJldHVybiBlcnJvcjtcclxufVxyXG5mdW5jdGlvbiBpbGxlZ2FsQXJndW1lbnQobmFtZSkge1xyXG4gICAgaWYgKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gbmV3IEVycm9yKGBJbGxlZ2FsIGFyZ3VtZW50OiAke25hbWV9YCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbmV3IEVycm9yKCdJbGxlZ2FsIGFyZ3VtZW50Jyk7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gaWxsZWdhbFN0YXRlKG5hbWUpIHtcclxuICAgIGlmIChuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihgSWxsZWdhbCBzdGF0ZTogJHtuYW1lfWApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBFcnJvcignSWxsZWdhbCBzdGF0ZScpO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIHJlYWRvbmx5KG5hbWUpIHtcclxuICAgIHJldHVybiBuYW1lXHJcbiAgICAgICAgPyBuZXcgRXJyb3IoYHJlYWRvbmx5IHByb3BlcnR5ICcke25hbWV9IGNhbm5vdCBiZSBjaGFuZ2VkJ2ApXHJcbiAgICAgICAgOiBuZXcgRXJyb3IoJ3JlYWRvbmx5IHByb3BlcnR5IGNhbm5vdCBiZSBjaGFuZ2VkJyk7XHJcbn1cclxuZnVuY3Rpb24gZGlzcG9zZWQod2hhdCkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IEVycm9yKGAke3doYXR9IGhhcyBiZWVuIGRpc3Bvc2VkYCk7XHJcbiAgICByZXN1bHQubmFtZSA9ICdESVNQT1NFRCc7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcbmZ1bmN0aW9uIGdldEVycm9yTWVzc2FnZShlcnIpIHtcclxuICAgIGlmICghZXJyKSB7XHJcbiAgICAgICAgcmV0dXJuICdFcnJvcic7XHJcbiAgICB9XHJcbiAgICBpZiAoZXJyLm1lc3NhZ2UpIHtcclxuICAgICAgICByZXR1cm4gZXJyLm1lc3NhZ2U7XHJcbiAgICB9XHJcbiAgICBpZiAoZXJyLnN0YWNrKSB7XHJcbiAgICAgICAgcmV0dXJuIGVyci5zdGFjay5zcGxpdCgnXFxuJylbMF07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gU3RyaW5nKGVycik7XHJcbn1cclxuY2xhc3MgTm90SW1wbGVtZW50ZWRFcnJvciBleHRlbmRzIEVycm9yIHtcclxuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2UpIHtcclxuICAgICAgICBzdXBlcignTm90SW1wbGVtZW50ZWQnKTtcclxuICAgICAgICBpZiAobWVzc2FnZSkge1xyXG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5jbGFzcyBOb3RTdXBwb3J0ZWRFcnJvciBleHRlbmRzIEVycm9yIHtcclxuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2UpIHtcclxuICAgICAgICBzdXBlcignTm90U3VwcG9ydGVkJyk7XHJcbiAgICAgICAgaWYgKG1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cblxuZXhwb3J0cy5FcnJvckhhbmRsZXIgPSBFcnJvckhhbmRsZXI7XG5leHBvcnRzLk5vdEltcGxlbWVudGVkRXJyb3IgPSBOb3RJbXBsZW1lbnRlZEVycm9yO1xuZXhwb3J0cy5Ob3RTdXBwb3J0ZWRFcnJvciA9IE5vdFN1cHBvcnRlZEVycm9yO1xuZXhwb3J0cy5jYW5jZWxlZCA9IGNhbmNlbGVkO1xuZXhwb3J0cy5kaXNwb3NlZCA9IGRpc3Bvc2VkO1xuZXhwb3J0cy5lcnJvckhhbmRsZXIgPSBlcnJvckhhbmRsZXI7XG5leHBvcnRzLmdldEVycm9yTWVzc2FnZSA9IGdldEVycm9yTWVzc2FnZTtcbmV4cG9ydHMuaWxsZWdhbEFyZ3VtZW50ID0gaWxsZWdhbEFyZ3VtZW50O1xuZXhwb3J0cy5pbGxlZ2FsU3RhdGUgPSBpbGxlZ2FsU3RhdGU7XG5leHBvcnRzLmlzUHJvbWlzZUNhbmNlbGVkRXJyb3IgPSBpc1Byb21pc2VDYW5jZWxlZEVycm9yO1xuZXhwb3J0cy5vblVuZXhwZWN0ZWRFcnJvciA9IG9uVW5leHBlY3RlZEVycm9yO1xuZXhwb3J0cy5vblVuZXhwZWN0ZWRFeHRlcm5hbEVycm9yID0gb25VbmV4cGVjdGVkRXh0ZXJuYWxFcnJvcjtcbmV4cG9ydHMucmVhZG9ubHkgPSByZWFkb25seTtcbmV4cG9ydHMuc2V0VW5leHBlY3RlZEVycm9ySGFuZGxlciA9IHNldFVuZXhwZWN0ZWRFcnJvckhhbmRsZXI7XG5leHBvcnRzLnRyYW5zZm9ybUVycm9yRm9yU2VyaWFsaXphdGlvbiA9IHRyYW5zZm9ybUVycm9yRm9yU2VyaWFsaXphdGlvbjtcbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxudmFyIGVycm9ycyA9IHJlcXVpcmUoJy4uLy4uLy4uL2Jhc2UvY29tbW9uL2Vycm9ycy9pbmRleC5qcycpO1xudmFyIGZ1bmN0aW9uYWwgPSByZXF1aXJlKCcuLi8uLi8uLi9iYXNlL2NvbW1vbi9mdW5jdGlvbmFsL2luZGV4LmpzJyk7XG52YXIgbGlmZWN5Y2xlID0gcmVxdWlyZSgnLi4vLi4vLi4vYmFzZS9jb21tb24vbGlmZWN5Y2xlL2luZGV4LmpzJyk7XG52YXIgbGlua2VkTGlzdCA9IHJlcXVpcmUoJy4uLy4uLy4uL2Jhc2UvY29tbW9uL2xpbmtlZExpc3QvaW5kZXguanMnKTtcblxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbihmdW5jdGlvbiAoRXZlbnQpIHtcclxuICAgIEV2ZW50Lk5vbmUgPSAoKSA9PiBsaWZlY3ljbGUuRGlzcG9zYWJsZS5Ob25lO1xyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhbiBldmVudCwgcmV0dXJucyBhbm90aGVyIGV2ZW50IHdoaWNoIG9ubHkgZmlyZXMgb25jZS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gb25jZShldmVudCkge1xyXG4gICAgICAgIHJldHVybiAobGlzdGVuZXIsIHRoaXNBcmdzID0gbnVsbCwgZGlzcG9zYWJsZXMpID0+IHtcclxuICAgICAgICAgICAgLy8gd2UgbmVlZCB0aGlzLCBpbiBjYXNlIHRoZSBldmVudCBmaXJlcyBkdXJpbmcgdGhlIGxpc3RlbmVyIGNhbGxcclxuICAgICAgICAgICAgbGV0IGRpZEZpcmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgbGV0IHJlc3VsdDtcclxuICAgICAgICAgICAgcmVzdWx0ID0gZXZlbnQoZSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGlkRmlyZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBkaWRGaXJlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBsaXN0ZW5lci5jYWxsKHRoaXNBcmdzLCBlKTtcclxuICAgICAgICAgICAgfSwgbnVsbCwgZGlzcG9zYWJsZXMpO1xyXG4gICAgICAgICAgICBpZiAoZGlkRmlyZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBFdmVudC5vbmNlID0gb25jZTtcclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gYW4gZXZlbnQgYW5kIGEgYG1hcGAgZnVuY3Rpb24sIHJldHVybnMgYW5vdGhlciBldmVudCB3aGljaCBtYXBzIGVhY2ggZWxlbWVudFxyXG4gICAgICogdGhyb3VnaCB0aGUgbWFwcGluZyBmdW5jdGlvbi5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gbWFwKGV2ZW50LCBtYXApIHtcclxuICAgICAgICByZXR1cm4gc25hcHNob3QoKGxpc3RlbmVyLCB0aGlzQXJncyA9IG51bGwsIGRpc3Bvc2FibGVzKSA9PiBldmVudChpID0+IGxpc3RlbmVyLmNhbGwodGhpc0FyZ3MsIG1hcChpKSksIG51bGwsIGRpc3Bvc2FibGVzKSk7XHJcbiAgICB9XHJcbiAgICBFdmVudC5tYXAgPSBtYXA7XHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGFuIGV2ZW50IGFuZCBhbiBgZWFjaGAgZnVuY3Rpb24sIHJldHVybnMgYW5vdGhlciBpZGVudGljYWwgZXZlbnQgYW5kIGNhbGxzXHJcbiAgICAgKiB0aGUgYGVhY2hgIGZ1bmN0aW9uIHBlciBlYWNoIGVsZW1lbnQuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGZvckVhY2goZXZlbnQsIGVhY2gpIHtcclxuICAgICAgICByZXR1cm4gc25hcHNob3QoKGxpc3RlbmVyLCB0aGlzQXJncyA9IG51bGwsIGRpc3Bvc2FibGVzKSA9PiBldmVudChpID0+IHsgZWFjaChpKTsgbGlzdGVuZXIuY2FsbCh0aGlzQXJncywgaSk7IH0sIG51bGwsIGRpc3Bvc2FibGVzKSk7XHJcbiAgICB9XHJcbiAgICBFdmVudC5mb3JFYWNoID0gZm9yRWFjaDtcclxuICAgIGZ1bmN0aW9uIGZpbHRlcihldmVudCwgZmlsdGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHNuYXBzaG90KChsaXN0ZW5lciwgdGhpc0FyZ3MgPSBudWxsLCBkaXNwb3NhYmxlcykgPT4gZXZlbnQoZSA9PiBmaWx0ZXIoZSkgJiYgbGlzdGVuZXIuY2FsbCh0aGlzQXJncywgZSksIG51bGwsIGRpc3Bvc2FibGVzKSk7XHJcbiAgICB9XHJcbiAgICBFdmVudC5maWx0ZXIgPSBmaWx0ZXI7XHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGFuIGV2ZW50LCByZXR1cm5zIHRoZSBzYW1lIGV2ZW50IGJ1dCB0eXBlZCBhcyBgRXZlbnQ8dm9pZD5gLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBzaWduYWwoZXZlbnQpIHtcclxuICAgICAgICByZXR1cm4gZXZlbnQ7XHJcbiAgICB9XHJcbiAgICBFdmVudC5zaWduYWwgPSBzaWduYWw7XHJcbiAgICBmdW5jdGlvbiBhbnkoLi4uZXZlbnRzKSB7XHJcbiAgICAgICAgcmV0dXJuIChsaXN0ZW5lciwgdGhpc0FyZ3MgPSBudWxsLCBkaXNwb3NhYmxlcykgPT4gbGlmZWN5Y2xlLmNvbWJpbmVkRGlzcG9zYWJsZSguLi5ldmVudHMubWFwKGV2ZW50ID0+IGV2ZW50KGUgPT4gbGlzdGVuZXIuY2FsbCh0aGlzQXJncywgZSksIG51bGwsIGRpc3Bvc2FibGVzKSkpO1xyXG4gICAgfVxyXG4gICAgRXZlbnQuYW55ID0gYW55O1xyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhbiBldmVudCBhbmQgYSBgbWVyZ2VgIGZ1bmN0aW9uLCByZXR1cm5zIGFub3RoZXIgZXZlbnQgd2hpY2ggbWFwcyBlYWNoIGVsZW1lbnRcclxuICAgICAqIGFuZCB0aGUgY3VtdWxhdGl2ZSByZXN1bHQgdGhyb3VnaCB0aGUgYG1lcmdlYCBmdW5jdGlvbi4gU2ltaWxhciB0byBgbWFwYCwgYnV0IHdpdGggbWVtb3J5LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiByZWR1Y2UoZXZlbnQsIG1lcmdlLCBpbml0aWFsKSB7XHJcbiAgICAgICAgbGV0IG91dHB1dCA9IGluaXRpYWw7XHJcbiAgICAgICAgcmV0dXJuIG1hcChldmVudCwgZSA9PiB7XHJcbiAgICAgICAgICAgIG91dHB1dCA9IG1lcmdlKG91dHB1dCwgZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBFdmVudC5yZWR1Y2UgPSByZWR1Y2U7XHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGEgY2hhaW4gb2YgZXZlbnQgcHJvY2Vzc2luZyBmdW5jdGlvbnMgKGZpbHRlciwgbWFwLCBldGMpLCBlYWNoXHJcbiAgICAgKiBmdW5jdGlvbiB3aWxsIGJlIGludm9rZWQgcGVyIGV2ZW50ICYgcGVyIGxpc3RlbmVyLiBTbmFwc2hvdHRpbmcgYW4gZXZlbnRcclxuICAgICAqIGNoYWluIGFsbG93cyBlYWNoIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQganVzdCBvbmNlIHBlciBldmVudC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gc25hcHNob3QoZXZlbnQpIHtcclxuICAgICAgICBsZXQgbGlzdGVuZXI7XHJcbiAgICAgICAgY29uc3QgZW1pdHRlciA9IG5ldyBFbWl0dGVyKHtcclxuICAgICAgICAgICAgb25GaXJzdExpc3RlbmVyQWRkKCkge1xyXG4gICAgICAgICAgICAgICAgbGlzdGVuZXIgPSBldmVudChlbWl0dGVyLmZpcmUsIGVtaXR0ZXIpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbkxhc3RMaXN0ZW5lclJlbW92ZSgpIHtcclxuICAgICAgICAgICAgICAgIGxpc3RlbmVyLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBlbWl0dGVyLmV2ZW50O1xyXG4gICAgfVxyXG4gICAgRXZlbnQuc25hcHNob3QgPSBzbmFwc2hvdDtcclxuICAgIGZ1bmN0aW9uIGRlYm91bmNlKGV2ZW50LCBtZXJnZSwgZGVsYXkgPSAxMDAsIGxlYWRpbmcgPSBmYWxzZSwgbGVha1dhcm5pbmdUaHJlc2hvbGQpIHtcclxuICAgICAgICBsZXQgc3Vic2NyaXB0aW9uO1xyXG4gICAgICAgIGxldCBvdXRwdXQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgbGV0IGhhbmRsZSA9IHVuZGVmaW5lZDtcclxuICAgICAgICBsZXQgbnVtRGVib3VuY2VkQ2FsbHMgPSAwO1xyXG4gICAgICAgIGNvbnN0IGVtaXR0ZXIgPSBuZXcgRW1pdHRlcih7XHJcbiAgICAgICAgICAgIGxlYWtXYXJuaW5nVGhyZXNob2xkLFxyXG4gICAgICAgICAgICBvbkZpcnN0TGlzdGVuZXJBZGQoKSB7XHJcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24gPSBldmVudChjdXIgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIG51bURlYm91bmNlZENhbGxzKys7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0ID0gbWVyZ2Uob3V0cHV0LCBjdXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsZWFkaW5nICYmICFoYW5kbGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW1pdHRlci5maXJlKG91dHB1dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGhhbmRsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IF9vdXRwdXQgPSBvdXRwdXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWxlYWRpbmcgfHwgbnVtRGVib3VuY2VkQ2FsbHMgPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbWl0dGVyLmZpcmUoX291dHB1dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgbnVtRGVib3VuY2VkQ2FsbHMgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIGRlbGF5KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbkxhc3RMaXN0ZW5lclJlbW92ZSgpIHtcclxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gZW1pdHRlci5ldmVudDtcclxuICAgIH1cclxuICAgIEV2ZW50LmRlYm91bmNlID0gZGVib3VuY2U7XHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGFuIGV2ZW50LCBpdCByZXR1cm5zIGFub3RoZXIgZXZlbnQgd2hpY2ggZmlyZXMgb25seSBvbmNlIGFuZCBhcyBzb29uIGFzXHJcbiAgICAgKiB0aGUgaW5wdXQgZXZlbnQgZW1pdHMuIFRoZSBldmVudCBkYXRhIGlzIHRoZSBudW1iZXIgb2YgbWlsbGlzIGl0IHRvb2sgZm9yIHRoZVxyXG4gICAgICogZXZlbnQgdG8gZmlyZS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gc3RvcHdhdGNoKGV2ZW50KSB7XHJcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICByZXR1cm4gbWFwKG9uY2UoZXZlbnQpLCBfID0+IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnQpO1xyXG4gICAgfVxyXG4gICAgRXZlbnQuc3RvcHdhdGNoID0gc3RvcHdhdGNoO1xyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhbiBldmVudCwgaXQgcmV0dXJucyBhbm90aGVyIGV2ZW50IHdoaWNoIGZpcmVzIG9ubHkgd2hlbiB0aGUgZXZlbnRcclxuICAgICAqIGVsZW1lbnQgY2hhbmdlcy5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gbGF0Y2goZXZlbnQpIHtcclxuICAgICAgICBsZXQgZmlyc3RDYWxsID0gdHJ1ZTtcclxuICAgICAgICBsZXQgY2FjaGU7XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlcihldmVudCwgdmFsdWUgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBzaG91bGRFbWl0ID0gZmlyc3RDYWxsIHx8IHZhbHVlICE9PSBjYWNoZTtcclxuICAgICAgICAgICAgZmlyc3RDYWxsID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGNhY2hlID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiBzaG91bGRFbWl0O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgRXZlbnQubGF0Y2ggPSBsYXRjaDtcclxuICAgIC8qKlxyXG4gICAgICogQnVmZmVycyB0aGUgcHJvdmlkZWQgZXZlbnQgdW50aWwgYSBmaXJzdCBsaXN0ZW5lciBjb21lc1xyXG4gICAgICogYWxvbmcsIGF0IHdoaWNoIHBvaW50IGZpcmUgYWxsIHRoZSBldmVudHMgYXQgb25jZSBhbmRcclxuICAgICAqIHBpcGUgdGhlIGV2ZW50IGZyb20gdGhlbiBvbi5cclxuICAgICAqXHJcbiAgICAgKiBgYGB0eXBlc2NyaXB0XHJcbiAgICAgKiBjb25zdCBlbWl0dGVyID0gbmV3IEVtaXR0ZXI8bnVtYmVyPigpO1xyXG4gICAgICogY29uc3QgZXZlbnQgPSBlbWl0dGVyLmV2ZW50O1xyXG4gICAgICogY29uc3QgYnVmZmVyZWRFdmVudCA9IGJ1ZmZlcihldmVudCk7XHJcbiAgICAgKlxyXG4gICAgICogZW1pdHRlci5maXJlKDEpO1xyXG4gICAgICogZW1pdHRlci5maXJlKDIpO1xyXG4gICAgICogZW1pdHRlci5maXJlKDMpO1xyXG4gICAgICogLy8gbm90aGluZy4uLlxyXG4gICAgICpcclxuICAgICAqIGNvbnN0IGxpc3RlbmVyID0gYnVmZmVyZWRFdmVudChudW0gPT4gY29uc29sZS5sb2cobnVtKSk7XHJcbiAgICAgKiAvLyAxLCAyLCAzXHJcbiAgICAgKlxyXG4gICAgICogZW1pdHRlci5maXJlKDQpO1xyXG4gICAgICogLy8gNFxyXG4gICAgICogYGBgXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGJ1ZmZlcihldmVudCwgbmV4dFRpY2sgPSBmYWxzZSwgX2J1ZmZlciA9IFtdKSB7XHJcbiAgICAgICAgbGV0IGJ1ZmZlciA9IF9idWZmZXIuc2xpY2UoKTtcclxuICAgICAgICBsZXQgbGlzdGVuZXIgPSBldmVudChlID0+IHtcclxuICAgICAgICAgICAgaWYgKGJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgYnVmZmVyLnB1c2goZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBlbWl0dGVyLmZpcmUoZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zdCBmbHVzaCA9ICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKGJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgYnVmZmVyLmZvckVhY2goZSA9PiBlbWl0dGVyLmZpcmUoZSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJ1ZmZlciA9IG51bGw7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBjb25zdCBlbWl0dGVyID0gbmV3IEVtaXR0ZXIoe1xyXG4gICAgICAgICAgICBvbkZpcnN0TGlzdGVuZXJBZGQoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWxpc3RlbmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIgPSBldmVudChlID0+IGVtaXR0ZXIuZmlyZShlKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uRmlyc3RMaXN0ZW5lckRpZEFkZCgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChidWZmZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dFRpY2spIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmbHVzaCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb25MYXN0TGlzdGVuZXJSZW1vdmUoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lci5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBsaXN0ZW5lciA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gZW1pdHRlci5ldmVudDtcclxuICAgIH1cclxuICAgIEV2ZW50LmJ1ZmZlciA9IGJ1ZmZlcjtcclxuICAgIGNsYXNzIENoYWluYWJsZUV2ZW50IHtcclxuICAgICAgICBjb25zdHJ1Y3RvcihldmVudCkge1xyXG4gICAgICAgICAgICB0aGlzLmV2ZW50ID0gZXZlbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG1hcChmbikge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IENoYWluYWJsZUV2ZW50KG1hcCh0aGlzLmV2ZW50LCBmbikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3JFYWNoKGZuKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ2hhaW5hYmxlRXZlbnQoZm9yRWFjaCh0aGlzLmV2ZW50LCBmbikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaWx0ZXIoZm4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBDaGFpbmFibGVFdmVudChmaWx0ZXIodGhpcy5ldmVudCwgZm4pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVkdWNlKG1lcmdlLCBpbml0aWFsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ2hhaW5hYmxlRXZlbnQocmVkdWNlKHRoaXMuZXZlbnQsIG1lcmdlLCBpbml0aWFsKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxhdGNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IENoYWluYWJsZUV2ZW50KGxhdGNoKHRoaXMuZXZlbnQpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZGVib3VuY2UobWVyZ2UsIGRlbGF5ID0gMTAwLCBsZWFkaW5nID0gZmFsc2UsIGxlYWtXYXJuaW5nVGhyZXNob2xkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ2hhaW5hYmxlRXZlbnQoZGVib3VuY2UodGhpcy5ldmVudCwgbWVyZ2UsIGRlbGF5LCBsZWFkaW5nLCBsZWFrV2FybmluZ1RocmVzaG9sZCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBvbihsaXN0ZW5lciwgdGhpc0FyZ3MsIGRpc3Bvc2FibGVzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmV2ZW50KGxpc3RlbmVyLCB0aGlzQXJncywgZGlzcG9zYWJsZXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBvbmNlKGxpc3RlbmVyLCB0aGlzQXJncywgZGlzcG9zYWJsZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG9uY2UodGhpcy5ldmVudCkobGlzdGVuZXIsIHRoaXNBcmdzLCBkaXNwb3NhYmxlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gY2hhaW4oZXZlbnQpIHtcclxuICAgICAgICByZXR1cm4gbmV3IENoYWluYWJsZUV2ZW50KGV2ZW50KTtcclxuICAgIH1cclxuICAgIEV2ZW50LmNoYWluID0gY2hhaW47XHJcbiAgICBmdW5jdGlvbiBmcm9tTm9kZUV2ZW50RW1pdHRlcihlbWl0dGVyLCBldmVudE5hbWUsIG1hcCA9IGlkID0+IGlkKSB7XHJcbiAgICAgICAgY29uc3QgZm4gPSAoLi4uYXJncykgPT4gcmVzdWx0LmZpcmUobWFwKC4uLmFyZ3MpKTtcclxuICAgICAgICBjb25zdCBvbkZpcnN0TGlzdGVuZXJBZGQgPSAoKSA9PiBlbWl0dGVyLm9uKGV2ZW50TmFtZSwgZm4pO1xyXG4gICAgICAgIGNvbnN0IG9uTGFzdExpc3RlbmVyUmVtb3ZlID0gKCkgPT4gZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihldmVudE5hbWUsIGZuKTtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgRW1pdHRlcih7IG9uRmlyc3RMaXN0ZW5lckFkZCwgb25MYXN0TGlzdGVuZXJSZW1vdmUgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5ldmVudDtcclxuICAgIH1cclxuICAgIEV2ZW50LmZyb21Ob2RlRXZlbnRFbWl0dGVyID0gZnJvbU5vZGVFdmVudEVtaXR0ZXI7XHJcbiAgICBmdW5jdGlvbiBmcm9tRE9NRXZlbnRFbWl0dGVyKGVtaXR0ZXIsIGV2ZW50TmFtZSwgbWFwID0gaWQgPT4gaWQpIHtcclxuICAgICAgICBjb25zdCBmbiA9ICguLi5hcmdzKSA9PiByZXN1bHQuZmlyZShtYXAoLi4uYXJncykpO1xyXG4gICAgICAgIGNvbnN0IG9uRmlyc3RMaXN0ZW5lckFkZCA9ICgpID0+IGVtaXR0ZXIuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGZuKTtcclxuICAgICAgICBjb25zdCBvbkxhc3RMaXN0ZW5lclJlbW92ZSA9ICgpID0+IGVtaXR0ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGZuKTtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgRW1pdHRlcih7IG9uRmlyc3RMaXN0ZW5lckFkZCwgb25MYXN0TGlzdGVuZXJSZW1vdmUgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5ldmVudDtcclxuICAgIH1cclxuICAgIEV2ZW50LmZyb21ET01FdmVudEVtaXR0ZXIgPSBmcm9tRE9NRXZlbnRFbWl0dGVyO1xyXG4gICAgZnVuY3Rpb24gZnJvbVByb21pc2UocHJvbWlzZSkge1xyXG4gICAgICAgIGNvbnN0IGVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpO1xyXG4gICAgICAgIGxldCBzaG91bGRFbWl0ID0gZmFsc2U7XHJcbiAgICAgICAgcHJvbWlzZVxyXG4gICAgICAgICAgICAudGhlbih1bmRlZmluZWQsICgpID0+IG51bGwpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgaWYgKCFzaG91bGRFbWl0KSB7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGVtaXR0ZXIuZmlyZSh1bmRlZmluZWQpLCAwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVtaXR0ZXIuZmlyZSh1bmRlZmluZWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgc2hvdWxkRW1pdCA9IHRydWU7XHJcbiAgICAgICAgcmV0dXJuIGVtaXR0ZXIuZXZlbnQ7XHJcbiAgICB9XHJcbiAgICBFdmVudC5mcm9tUHJvbWlzZSA9IGZyb21Qcm9taXNlO1xyXG4gICAgZnVuY3Rpb24gdG9Qcm9taXNlKGV2ZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGMgPT4gb25jZShldmVudCkoYykpO1xyXG4gICAgfVxyXG4gICAgRXZlbnQudG9Qcm9taXNlID0gdG9Qcm9taXNlO1xyXG59KShleHBvcnRzLkV2ZW50IHx8IChleHBvcnRzLkV2ZW50ID0ge30pKTtcclxubGV0IF9nbG9iYWxMZWFrV2FybmluZ1RocmVzaG9sZCA9IC0xO1xyXG5mdW5jdGlvbiBzZXRHbG9iYWxMZWFrV2FybmluZ1RocmVzaG9sZChuKSB7XHJcbiAgICBjb25zdCBvbGRWYWx1ZSA9IF9nbG9iYWxMZWFrV2FybmluZ1RocmVzaG9sZDtcclxuICAgIF9nbG9iYWxMZWFrV2FybmluZ1RocmVzaG9sZCA9IG47XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIF9nbG9iYWxMZWFrV2FybmluZ1RocmVzaG9sZCA9IG9sZFZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuY2xhc3MgTGVha2FnZU1vbml0b3Ige1xyXG4gICAgY29uc3RydWN0b3IoY3VzdG9tVGhyZXNob2xkLCBuYW1lID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygxOCkuc2xpY2UoMiwgNSkpIHtcclxuICAgICAgICB0aGlzLmN1c3RvbVRocmVzaG9sZCA9IGN1c3RvbVRocmVzaG9sZDtcclxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgICAgIHRoaXMuX3dhcm5Db3VudGRvd24gPSAwO1xyXG4gICAgfVxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5fc3RhY2tzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0YWNrcy5jbGVhcigpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGNoZWNrKGxpc3RlbmVyQ291bnQpIHtcclxuICAgICAgICBsZXQgdGhyZXNob2xkID0gX2dsb2JhbExlYWtXYXJuaW5nVGhyZXNob2xkO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5jdXN0b21UaHJlc2hvbGQgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIHRocmVzaG9sZCA9IHRoaXMuY3VzdG9tVGhyZXNob2xkO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhyZXNob2xkIDw9IDAgfHwgbGlzdGVuZXJDb3VudCA8IHRocmVzaG9sZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXRoaXMuX3N0YWNrcykge1xyXG4gICAgICAgICAgICB0aGlzLl9zdGFja3MgPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHN0YWNrID0gbmV3IEVycm9yKCkuc3RhY2suc3BsaXQoJ1xcbicpLnNsaWNlKDMpLmpvaW4oJ1xcbicpO1xyXG4gICAgICAgIGNvbnN0IGNvdW50ID0gKHRoaXMuX3N0YWNrcy5nZXQoc3RhY2spIHx8IDApO1xyXG4gICAgICAgIHRoaXMuX3N0YWNrcy5zZXQoc3RhY2ssIGNvdW50ICsgMSk7XHJcbiAgICAgICAgdGhpcy5fd2FybkNvdW50ZG93biAtPSAxO1xyXG4gICAgICAgIGlmICh0aGlzLl93YXJuQ291bnRkb3duIDw9IDApIHtcclxuICAgICAgICAgICAgLy8gb25seSB3YXJuIG9uIGZpcnN0IGV4Y2VlZCBhbmQgdGhlbiBldmVyeSB0aW1lIHRoZSBsaW1pdFxyXG4gICAgICAgICAgICAvLyBpcyBleGNlZWRlZCBieSA1MCUgYWdhaW5cclxuICAgICAgICAgICAgdGhpcy5fd2FybkNvdW50ZG93biA9IHRocmVzaG9sZCAqIDAuNTtcclxuICAgICAgICAgICAgLy8gZmluZCBtb3N0IGZyZXF1ZW50IGxpc3RlbmVyIGFuZCBwcmludCB3YXJuaW5nXHJcbiAgICAgICAgICAgIGxldCB0b3BTdGFjaztcclxuICAgICAgICAgICAgbGV0IHRvcENvdW50ID0gMDtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBbc3RhY2ssIGNvdW50XSBvZiB0aGlzLl9zdGFja3MpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdG9wU3RhY2sgfHwgdG9wQ291bnQgPCBjb3VudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRvcFN0YWNrID0gc3RhY2s7XHJcbiAgICAgICAgICAgICAgICAgICAgdG9wQ291bnQgPSBjb3VudDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFske3RoaXMubmFtZX1dIHBvdGVudGlhbCBsaXN0ZW5lciBMRUFLIGRldGVjdGVkLCBoYXZpbmcgJHtsaXN0ZW5lckNvdW50fSBsaXN0ZW5lcnMgYWxyZWFkeS4gTU9TVCBmcmVxdWVudCBsaXN0ZW5lciAoJHt0b3BDb3VudH0pOmApO1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4odG9wU3RhY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBjb3VudCA9ICh0aGlzLl9zdGFja3MuZ2V0KHN0YWNrKSB8fCAwKTtcclxuICAgICAgICAgICAgdGhpcy5fc3RhY2tzLnNldChzdGFjaywgY291bnQgLSAxKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcbi8qKlxyXG4gKiBUaGUgRW1pdHRlciBjYW4gYmUgdXNlZCB0byBleHBvc2UgYW4gRXZlbnQgdG8gdGhlIHB1YmxpY1xyXG4gKiB0byBmaXJlIGl0IGZyb20gdGhlIGluc2lkZXMuXHJcbiAqIFNhbXBsZTpcclxuICAgIGNsYXNzIERvY3VtZW50IHtcclxuXHJcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBfb25EaWRDaGFuZ2UgPSBuZXcgRW1pdHRlcjwodmFsdWU6c3RyaW5nKT0+YW55PigpO1xyXG5cclxuICAgICAgICBwdWJsaWMgb25EaWRDaGFuZ2UgPSB0aGlzLl9vbkRpZENoYW5nZS5ldmVudDtcclxuXHJcbiAgICAgICAgLy8gZ2V0dGVyLXN0eWxlXHJcbiAgICAgICAgLy8gZ2V0IG9uRGlkQ2hhbmdlKCk6IEV2ZW50PCh2YWx1ZTpzdHJpbmcpPT5hbnk+IHtcclxuICAgICAgICAvLyBcdHJldHVybiB0aGlzLl9vbkRpZENoYW5nZS5ldmVudDtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgX2RvSXQoKSB7XHJcbiAgICAgICAgICAgIC8vLi4uXHJcbiAgICAgICAgICAgIHRoaXMuX29uRGlkQ2hhbmdlLmZpcmUodmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICovXHJcbmNsYXNzIEVtaXR0ZXIge1xyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2VkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fb3B0aW9ucyA9IG9wdGlvbnM7XHJcbiAgICAgICAgdGhpcy5fbGVha2FnZU1vbiA9IF9nbG9iYWxMZWFrV2FybmluZ1RocmVzaG9sZCA+IDBcclxuICAgICAgICAgICAgPyBuZXcgTGVha2FnZU1vbml0b3IodGhpcy5fb3B0aW9ucyAmJiB0aGlzLl9vcHRpb25zLmxlYWtXYXJuaW5nVGhyZXNob2xkKVxyXG4gICAgICAgICAgICA6IHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogRm9yIHRoZSBwdWJsaWMgdG8gYWxsb3cgdG8gc3Vic2NyaWJlXHJcbiAgICAgKiB0byBldmVudHMgZnJvbSB0aGlzIEVtaXR0ZXJcclxuICAgICAqL1xyXG4gICAgZ2V0IGV2ZW50KCkge1xyXG4gICAgICAgIGlmICghdGhpcy5fZXZlbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5fZXZlbnQgPSAobGlzdGVuZXIsIHRoaXNBcmdzLCBkaXNwb3NhYmxlcykgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9saXN0ZW5lcnMgPSBuZXcgbGlua2VkTGlzdC5MaW5rZWRMaXN0KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmaXJzdExpc3RlbmVyID0gdGhpcy5fbGlzdGVuZXJzLmlzRW1wdHkoKTtcclxuICAgICAgICAgICAgICAgIGlmIChmaXJzdExpc3RlbmVyICYmIHRoaXMuX29wdGlvbnMgJiYgdGhpcy5fb3B0aW9ucy5vbkZpcnN0TGlzdGVuZXJBZGQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9vcHRpb25zLm9uRmlyc3RMaXN0ZW5lckFkZCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlbW92ZSA9IHRoaXMuX2xpc3RlbmVycy5wdXNoKCF0aGlzQXJncyA/IGxpc3RlbmVyIDogW2xpc3RlbmVyLCB0aGlzQXJnc10pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0TGlzdGVuZXIgJiYgdGhpcy5fb3B0aW9ucyAmJiB0aGlzLl9vcHRpb25zLm9uRmlyc3RMaXN0ZW5lckRpZEFkZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX29wdGlvbnMub25GaXJzdExpc3RlbmVyRGlkQWRkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX29wdGlvbnMgJiYgdGhpcy5fb3B0aW9ucy5vbkxpc3RlbmVyRGlkQWRkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fb3B0aW9ucy5vbkxpc3RlbmVyRGlkQWRkKHRoaXMsIGxpc3RlbmVyLCB0aGlzQXJncyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBhbmQgcmVjb3JkIHRoaXMgZW1pdHRlciBmb3IgcG90ZW50aWFsIGxlYWthZ2VcclxuICAgICAgICAgICAgICAgIGxldCByZW1vdmVNb25pdG9yO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2xlYWthZ2VNb24pIHtcclxuICAgICAgICAgICAgICAgICAgICByZW1vdmVNb25pdG9yID0gdGhpcy5fbGVha2FnZU1vbi5jaGVjayh0aGlzLl9saXN0ZW5lcnMuc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpc3Bvc2U6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlbW92ZU1vbml0b3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZU1vbml0b3IoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuZGlzcG9zZSA9IEVtaXR0ZXIuX25vb3A7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fZGlzcG9zZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX29wdGlvbnMgJiYgdGhpcy5fb3B0aW9ucy5vbkxhc3RMaXN0ZW5lclJlbW92ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhc0xpc3RlbmVycyA9ICh0aGlzLl9saXN0ZW5lcnMgJiYgIXRoaXMuX2xpc3RlbmVycy5pc0VtcHR5KCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaGFzTGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX29wdGlvbnMub25MYXN0TGlzdGVuZXJSZW1vdmUodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGlmIChkaXNwb3NhYmxlcyBpbnN0YW5jZW9mIGxpZmVjeWNsZS5EaXNwb3NhYmxlU3RvcmUpIHtcclxuICAgICAgICAgICAgICAgICAgICBkaXNwb3NhYmxlcy5hZGQocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGlzcG9zYWJsZXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlzcG9zYWJsZXMucHVzaChyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2V2ZW50O1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBUbyBiZSBrZXB0IHByaXZhdGUgdG8gZmlyZSBhbiBldmVudCB0b1xyXG4gICAgICogc3Vic2NyaWJlcnNcclxuICAgICAqL1xyXG4gICAgZmlyZShldmVudCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAgICAgLy8gcHV0IGFsbCBbbGlzdGVuZXIsZXZlbnRdLXBhaXJzIGludG8gZGVsaXZlcnkgcXVldWVcclxuICAgICAgICAgICAgLy8gdGhlbiBlbWl0IGFsbCBldmVudC4gYW4gaW5uZXIvbmVzdGVkIGV2ZW50IG1pZ2h0IGJlXHJcbiAgICAgICAgICAgIC8vIHRoZSBkcml2ZXIgb2YgdGhpc1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2RlbGl2ZXJ5UXVldWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2RlbGl2ZXJ5UXVldWUgPSBuZXcgbGlua2VkTGlzdC5MaW5rZWRMaXN0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5fbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9kZWxpdmVyeVF1ZXVlLnB1c2goW2xpc3RlbmVyLCBldmVudF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHdoaWxlICh0aGlzLl9kZWxpdmVyeVF1ZXVlLnNpemUgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBbbGlzdGVuZXIsIGV2ZW50XSA9IHRoaXMuX2RlbGl2ZXJ5UXVldWUuc2hpZnQoKTtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lci5jYWxsKHVuZGVmaW5lZCwgZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJbMF0uY2FsbChsaXN0ZW5lclsxXSwgZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLm9uVW5leHBlY3RlZEVycm9yKGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5fbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xpc3RlbmVycy5jbGVhcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fZGVsaXZlcnlRdWV1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9kZWxpdmVyeVF1ZXVlLmNsZWFyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9sZWFrYWdlTW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xlYWthZ2VNb24uZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9kaXNwb3NlZCA9IHRydWU7XHJcbiAgICB9XHJcbn1cclxuRW1pdHRlci5fbm9vcCA9IGZ1bmN0aW9uICgpIHsgfTtcclxuY2xhc3MgUGF1c2VhYmxlRW1pdHRlciBleHRlbmRzIEVtaXR0ZXIge1xyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xyXG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xyXG4gICAgICAgIHRoaXMuX2lzUGF1c2VkID0gMDtcclxuICAgICAgICB0aGlzLl9ldmVudFF1ZXVlID0gbmV3IGxpbmtlZExpc3QuTGlua2VkTGlzdCgpO1xyXG4gICAgICAgIHRoaXMuX21lcmdlRm4gPSBvcHRpb25zICYmIG9wdGlvbnMubWVyZ2U7XHJcbiAgICB9XHJcbiAgICBwYXVzZSgpIHtcclxuICAgICAgICB0aGlzLl9pc1BhdXNlZCsrO1xyXG4gICAgfVxyXG4gICAgcmVzdW1lKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9pc1BhdXNlZCAhPT0gMCAmJiAtLXRoaXMuX2lzUGF1c2VkID09PSAwKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9tZXJnZUZuKSB7XHJcbiAgICAgICAgICAgICAgICAvLyB1c2UgdGhlIG1lcmdlIGZ1bmN0aW9uIHRvIGNyZWF0ZSBhIHNpbmdsZSBjb21wb3NpdGVcclxuICAgICAgICAgICAgICAgIC8vIGV2ZW50LiBtYWtlIGEgY29weSBpbiBjYXNlIGZpcmluZyBwYXVzZXMgdGhpcyBlbWl0dGVyXHJcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudHMgPSB0aGlzLl9ldmVudFF1ZXVlLnRvQXJyYXkoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50UXVldWUuY2xlYXIoKTtcclxuICAgICAgICAgICAgICAgIHN1cGVyLmZpcmUodGhpcy5fbWVyZ2VGbihldmVudHMpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIG5vIG1lcmdpbmcsIGZpcmUgZWFjaCBldmVudCBpbmRpdmlkdWFsbHkgYW5kIHRlc3RcclxuICAgICAgICAgICAgICAgIC8vIHRoYXQgdGhpcyBlbWl0dGVyIGlzbid0IHBhdXNlZCBoYWxmd2F5IHRocm91Z2hcclxuICAgICAgICAgICAgICAgIHdoaWxlICghdGhpcy5faXNQYXVzZWQgJiYgdGhpcy5fZXZlbnRRdWV1ZS5zaXplICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VwZXIuZmlyZSh0aGlzLl9ldmVudFF1ZXVlLnNoaWZ0KCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZmlyZShldmVudCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2lzUGF1c2VkICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9ldmVudFF1ZXVlLnB1c2goZXZlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc3VwZXIuZmlyZShldmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuY2xhc3MgQXN5bmNFbWl0dGVyIGV4dGVuZHMgRW1pdHRlciB7XHJcbiAgICBhc3luYyBmaXJlQXN5bmMoZGF0YSwgdG9rZW4sIHByb21pc2VKb2luKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXRoaXMuX2FzeW5jRGVsaXZlcnlRdWV1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9hc3luY0RlbGl2ZXJ5UXVldWUgPSBuZXcgbGlua2VkTGlzdC5MaW5rZWRMaXN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5fbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2FzeW5jRGVsaXZlcnlRdWV1ZS5wdXNoKFtsaXN0ZW5lciwgZGF0YV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB3aGlsZSAodGhpcy5fYXN5bmNEZWxpdmVyeVF1ZXVlLnNpemUgPiAwICYmICF0b2tlbi5pc0NhbmNlbGxhdGlvblJlcXVlc3RlZCkge1xyXG4gICAgICAgICAgICBjb25zdCBbbGlzdGVuZXIsIGRhdGFdID0gdGhpcy5fYXN5bmNEZWxpdmVyeVF1ZXVlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHRoZW5hYmxlcyA9IFtdO1xyXG4gICAgICAgICAgICBjb25zdCBldmVudCA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgZGF0YSksIHsgd2FpdFVudGlsOiAocCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QuaXNGcm96ZW4odGhlbmFibGVzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3dhaXRVbnRpbCBjYW4gTk9UIGJlIGNhbGxlZCBhc3luY2hyb25vdXMnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb21pc2VKb2luKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHAgPSBwcm9taXNlSm9pbihwLCB0eXBlb2YgbGlzdGVuZXIgPT09ICdmdW5jdGlvbicgPyBsaXN0ZW5lciA6IGxpc3RlbmVyWzBdKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhlbmFibGVzLnB1c2gocCk7XHJcbiAgICAgICAgICAgICAgICB9IH0pO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyLmNhbGwodW5kZWZpbmVkLCBldmVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lclswXS5jYWxsKGxpc3RlbmVyWzFdLCBldmVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGVycm9ycy5vblVuZXhwZWN0ZWRFcnJvcihlKTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGZyZWV6ZSB0aGVuYWJsZXMtY29sbGVjdGlvbiB0byBlbmZvcmNlIHN5bmMtY2FsbHMgdG9cclxuICAgICAgICAgICAgLy8gd2FpdCB1bnRpbCBhbmQgdGhlbiB3YWl0IGZvciBhbGwgdGhlbmFibGVzIHRvIHJlc29sdmVcclxuICAgICAgICAgICAgT2JqZWN0LmZyZWV6ZSh0aGVuYWJsZXMpO1xyXG4gICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0aGVuYWJsZXMpLmNhdGNoKGUgPT4gZXJyb3JzLm9uVW5leHBlY3RlZEVycm9yKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuY2xhc3MgRXZlbnRNdWx0aXBsZXhlciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmhhc0xpc3RlbmVycyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZXZlbnRzID0gW107XHJcbiAgICAgICAgdGhpcy5lbWl0dGVyID0gbmV3IEVtaXR0ZXIoe1xyXG4gICAgICAgICAgICBvbkZpcnN0TGlzdGVuZXJBZGQ6ICgpID0+IHRoaXMub25GaXJzdExpc3RlbmVyQWRkKCksXHJcbiAgICAgICAgICAgIG9uTGFzdExpc3RlbmVyUmVtb3ZlOiAoKSA9PiB0aGlzLm9uTGFzdExpc3RlbmVyUmVtb3ZlKClcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGdldCBldmVudCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbWl0dGVyLmV2ZW50O1xyXG4gICAgfVxyXG4gICAgYWRkKGV2ZW50KSB7XHJcbiAgICAgICAgY29uc3QgZSA9IHsgZXZlbnQ6IGV2ZW50LCBsaXN0ZW5lcjogbnVsbCB9O1xyXG4gICAgICAgIHRoaXMuZXZlbnRzLnB1c2goZSk7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzTGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaG9vayhlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgZGlzcG9zZSA9ICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaGFzTGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVuaG9vayhlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBpZHggPSB0aGlzLmV2ZW50cy5pbmRleE9mKGUpO1xyXG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBsaWZlY3ljbGUudG9EaXNwb3NhYmxlKGZ1bmN0aW9uYWwub25jZShkaXNwb3NlKSk7XHJcbiAgICB9XHJcbiAgICBvbkZpcnN0TGlzdGVuZXJBZGQoKSB7XHJcbiAgICAgICAgdGhpcy5oYXNMaXN0ZW5lcnMgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuZXZlbnRzLmZvckVhY2goZSA9PiB0aGlzLmhvb2soZSkpO1xyXG4gICAgfVxyXG4gICAgb25MYXN0TGlzdGVuZXJSZW1vdmUoKSB7XHJcbiAgICAgICAgdGhpcy5oYXNMaXN0ZW5lcnMgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmV2ZW50cy5mb3JFYWNoKGUgPT4gdGhpcy51bmhvb2soZSkpO1xyXG4gICAgfVxyXG4gICAgaG9vayhlKSB7XHJcbiAgICAgICAgZS5saXN0ZW5lciA9IGUuZXZlbnQociA9PiB0aGlzLmVtaXR0ZXIuZmlyZShyKSk7XHJcbiAgICB9XHJcbiAgICB1bmhvb2soZSkge1xyXG4gICAgICAgIGlmIChlLmxpc3RlbmVyKSB7XHJcbiAgICAgICAgICAgIGUubGlzdGVuZXIuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlLmxpc3RlbmVyID0gbnVsbDtcclxuICAgIH1cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5lbWl0dGVyLmRpc3Bvc2UoKTtcclxuICAgIH1cclxufVxyXG4vKipcclxuICogVGhlIEV2ZW50QnVmZmVyZXIgaXMgdXNlZnVsIGluIHNpdHVhdGlvbnMgaW4gd2hpY2ggeW91IHdhbnRcclxuICogdG8gZGVsYXkgZmlyaW5nIHlvdXIgZXZlbnRzIGR1cmluZyBzb21lIGNvZGUuXHJcbiAqIFlvdSBjYW4gd3JhcCB0aGF0IGNvZGUgYW5kIGJlIHN1cmUgdGhhdCB0aGUgZXZlbnQgd2lsbCBub3RcclxuICogYmUgZmlyZWQgZHVyaW5nIHRoYXQgd3JhcC5cclxuICpcclxuICogYGBgXHJcbiAqIGNvbnN0IGVtaXR0ZXI6IEVtaXR0ZXI7XHJcbiAqIGNvbnN0IGRlbGF5ZXIgPSBuZXcgRXZlbnREZWxheWVyKCk7XHJcbiAqIGNvbnN0IGRlbGF5ZWRFdmVudCA9IGRlbGF5ZXIud3JhcEV2ZW50KGVtaXR0ZXIuZXZlbnQpO1xyXG4gKlxyXG4gKiBkZWxheWVkRXZlbnQoY29uc29sZS5sb2cpO1xyXG4gKlxyXG4gKiBkZWxheWVyLmJ1ZmZlckV2ZW50cygoKSA9PiB7XHJcbiAqICAgZW1pdHRlci5maXJlKCk7IC8vIGV2ZW50IHdpbGwgbm90IGJlIGZpcmVkIHlldFxyXG4gKiB9KTtcclxuICpcclxuICogLy8gZXZlbnQgd2lsbCBvbmx5IGJlIGZpcmVkIGF0IHRoaXMgcG9pbnRcclxuICogYGBgXHJcbiAqL1xyXG5jbGFzcyBFdmVudEJ1ZmZlcmVyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuYnVmZmVycyA9IFtdO1xyXG4gICAgfVxyXG4gICAgd3JhcEV2ZW50KGV2ZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIChsaXN0ZW5lciwgdGhpc0FyZ3MsIGRpc3Bvc2FibGVzKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBldmVudChpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuYnVmZmVyc1t0aGlzLmJ1ZmZlcnMubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgICAgICAgICBpZiAoYnVmZmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyLnB1c2goKCkgPT4gbGlzdGVuZXIuY2FsbCh0aGlzQXJncywgaSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIuY2FsbCh0aGlzQXJncywgaSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIHVuZGVmaW5lZCwgZGlzcG9zYWJsZXMpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBidWZmZXJFdmVudHMoZm4pIHtcclxuICAgICAgICBjb25zdCBidWZmZXIgPSBbXTtcclxuICAgICAgICB0aGlzLmJ1ZmZlcnMucHVzaChidWZmZXIpO1xyXG4gICAgICAgIGNvbnN0IHIgPSBmbigpO1xyXG4gICAgICAgIHRoaXMuYnVmZmVycy5wb3AoKTtcclxuICAgICAgICBidWZmZXIuZm9yRWFjaChmbHVzaCA9PiBmbHVzaCgpKTtcclxuICAgICAgICByZXR1cm4gcjtcclxuICAgIH1cclxufVxyXG4vKipcclxuICogQSBSZWxheSBpcyBhbiBldmVudCBmb3J3YXJkZXIgd2hpY2ggZnVuY3Rpb25zIGFzIGEgcmVwbHVnYWJibGUgZXZlbnQgcGlwZS5cclxuICogT25jZSBjcmVhdGVkLCB5b3UgY2FuIGNvbm5lY3QgYW4gaW5wdXQgZXZlbnQgdG8gaXQgYW5kIGl0IHdpbGwgc2ltcGx5IGZvcndhcmRcclxuICogZXZlbnRzIGZyb20gdGhhdCBpbnB1dCBldmVudCB0aHJvdWdoIGl0cyBvd24gYGV2ZW50YCBwcm9wZXJ0eS4gVGhlIGBpbnB1dGBcclxuICogY2FuIGJlIGNoYW5nZWQgYXQgYW55IHBvaW50IGluIHRpbWUuXHJcbiAqL1xyXG5jbGFzcyBSZWxheSB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmxpc3RlbmluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuaW5wdXRFdmVudCA9IGV4cG9ydHMuRXZlbnQuTm9uZTtcclxuICAgICAgICB0aGlzLmlucHV0RXZlbnRMaXN0ZW5lciA9IGxpZmVjeWNsZS5EaXNwb3NhYmxlLk5vbmU7XHJcbiAgICAgICAgdGhpcy5lbWl0dGVyID0gbmV3IEVtaXR0ZXIoe1xyXG4gICAgICAgICAgICBvbkZpcnN0TGlzdGVuZXJEaWRBZGQ6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5wdXRFdmVudExpc3RlbmVyID0gdGhpcy5pbnB1dEV2ZW50KHRoaXMuZW1pdHRlci5maXJlLCB0aGlzLmVtaXR0ZXIpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbkxhc3RMaXN0ZW5lclJlbW92ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5saXN0ZW5pbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5wdXRFdmVudExpc3RlbmVyLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZXZlbnQgPSB0aGlzLmVtaXR0ZXIuZXZlbnQ7XHJcbiAgICB9XHJcbiAgICBzZXQgaW5wdXQoZXZlbnQpIHtcclxuICAgICAgICB0aGlzLmlucHV0RXZlbnQgPSBldmVudDtcclxuICAgICAgICBpZiAodGhpcy5saXN0ZW5pbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5pbnB1dEV2ZW50TGlzdGVuZXIuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmlucHV0RXZlbnRMaXN0ZW5lciA9IGV2ZW50KHRoaXMuZW1pdHRlci5maXJlLCB0aGlzLmVtaXR0ZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5pbnB1dEV2ZW50TGlzdGVuZXIuZGlzcG9zZSgpO1xyXG4gICAgICAgIHRoaXMuZW1pdHRlci5kaXNwb3NlKCk7XHJcbiAgICB9XHJcbn1cblxuZXhwb3J0cy5Bc3luY0VtaXR0ZXIgPSBBc3luY0VtaXR0ZXI7XG5leHBvcnRzLkVtaXR0ZXIgPSBFbWl0dGVyO1xuZXhwb3J0cy5FdmVudEJ1ZmZlcmVyID0gRXZlbnRCdWZmZXJlcjtcbmV4cG9ydHMuRXZlbnRNdWx0aXBsZXhlciA9IEV2ZW50TXVsdGlwbGV4ZXI7XG5leHBvcnRzLlBhdXNlYWJsZUVtaXR0ZXIgPSBQYXVzZWFibGVFbWl0dGVyO1xuZXhwb3J0cy5SZWxheSA9IFJlbGF5O1xuZXhwb3J0cy5zZXRHbG9iYWxMZWFrV2FybmluZ1RocmVzaG9sZCA9IHNldEdsb2JhbExlYWtXYXJuaW5nVGhyZXNob2xkO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxyXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuZnVuY3Rpb24gb25jZShmbikge1xyXG4gICAgY29uc3QgX3RoaXMgPSB0aGlzO1xyXG4gICAgbGV0IGRpZENhbGwgPSBmYWxzZTtcclxuICAgIGxldCByZXN1bHQ7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmIChkaWRDYWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRpZENhbGwgPSB0cnVlO1xyXG4gICAgICAgIHJlc3VsdCA9IGZuLmFwcGx5KF90aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9O1xyXG59XG5cbmV4cG9ydHMub25jZSA9IG9uY2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG4oZnVuY3Rpb24gKEl0ZXJhYmxlKSB7XHJcbiAgICBmdW5jdGlvbiBpcyh0aGluZykge1xyXG4gICAgICAgIHJldHVybiB0aGluZyAmJiB0eXBlb2YgdGhpbmcgPT09ICdvYmplY3QnICYmIHR5cGVvZiB0aGluZ1tTeW1ib2wuaXRlcmF0b3JdID09PSAnZnVuY3Rpb24nO1xyXG4gICAgfVxyXG4gICAgSXRlcmFibGUuaXMgPSBpcztcclxuICAgIGNvbnN0IF9lbXB0eSA9IE9iamVjdC5mcmVlemUoW10pO1xyXG4gICAgZnVuY3Rpb24gZW1wdHkoKSB7XHJcbiAgICAgICAgcmV0dXJuIF9lbXB0eTtcclxuICAgIH1cclxuICAgIEl0ZXJhYmxlLmVtcHR5ID0gZW1wdHk7XHJcbiAgICBmdW5jdGlvbiogc2luZ2xlKGVsZW1lbnQpIHtcclxuICAgICAgICB5aWVsZCBlbGVtZW50O1xyXG4gICAgfVxyXG4gICAgSXRlcmFibGUuc2luZ2xlID0gc2luZ2xlO1xyXG4gICAgZnVuY3Rpb24gZnJvbShpdGVyYWJsZSkge1xyXG4gICAgICAgIHJldHVybiBpdGVyYWJsZSB8fCBfZW1wdHk7XHJcbiAgICB9XHJcbiAgICBJdGVyYWJsZS5mcm9tID0gZnJvbTtcclxuICAgIGZ1bmN0aW9uIGZpcnN0KGl0ZXJhYmxlKSB7XHJcbiAgICAgICAgcmV0dXJuIGl0ZXJhYmxlW1N5bWJvbC5pdGVyYXRvcl0oKS5uZXh0KCkudmFsdWU7XHJcbiAgICB9XHJcbiAgICBJdGVyYWJsZS5maXJzdCA9IGZpcnN0O1xyXG4gICAgZnVuY3Rpb24gc29tZShpdGVyYWJsZSwgcHJlZGljYXRlKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGl0ZXJhYmxlKSB7XHJcbiAgICAgICAgICAgIGlmIChwcmVkaWNhdGUoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIEl0ZXJhYmxlLnNvbWUgPSBzb21lO1xyXG4gICAgZnVuY3Rpb24qIGZpbHRlcihpdGVyYWJsZSwgcHJlZGljYXRlKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGl0ZXJhYmxlKSB7XHJcbiAgICAgICAgICAgIGlmIChwcmVkaWNhdGUoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgICAgIHlpZWxkIGVsZW1lbnQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBJdGVyYWJsZS5maWx0ZXIgPSBmaWx0ZXI7XHJcbiAgICBmdW5jdGlvbiogbWFwKGl0ZXJhYmxlLCBmbikge1xyXG4gICAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBpdGVyYWJsZSkge1xyXG4gICAgICAgICAgICB5aWVsZCBmbihlbGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBJdGVyYWJsZS5tYXAgPSBtYXA7XHJcbiAgICBmdW5jdGlvbiogY29uY2F0KC4uLml0ZXJhYmxlcykge1xyXG4gICAgICAgIGZvciAoY29uc3QgaXRlcmFibGUgb2YgaXRlcmFibGVzKSB7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBpdGVyYWJsZSkge1xyXG4gICAgICAgICAgICAgICAgeWllbGQgZWxlbWVudDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIEl0ZXJhYmxlLmNvbmNhdCA9IGNvbmNhdDtcclxuICAgIC8qKlxyXG4gICAgICogQ29uc3VtZXMgYGF0TW9zdGAgZWxlbWVudHMgZnJvbSBpdGVyYWJsZSBhbmQgcmV0dXJucyB0aGUgY29uc3VtZWQgZWxlbWVudHMsXHJcbiAgICAgKiBhbmQgYW4gaXRlcmFibGUgZm9yIHRoZSByZXN0IG9mIHRoZSBlbGVtZW50cy5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gY29uc3VtZShpdGVyYWJsZSwgYXRNb3N0ID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZKSB7XHJcbiAgICAgICAgY29uc3QgY29uc3VtZWQgPSBbXTtcclxuICAgICAgICBpZiAoYXRNb3N0ID09PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbY29uc3VtZWQsIGl0ZXJhYmxlXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgaXRlcmF0b3IgPSBpdGVyYWJsZVtTeW1ib2wuaXRlcmF0b3JdKCk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdE1vc3Q7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBuZXh0ID0gaXRlcmF0b3IubmV4dCgpO1xyXG4gICAgICAgICAgICBpZiAobmV4dC5kb25lKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gW2NvbnN1bWVkLCBJdGVyYWJsZS5lbXB0eSgpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdW1lZC5wdXNoKG5leHQudmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW2NvbnN1bWVkLCB7IFtTeW1ib2wuaXRlcmF0b3JdKCkgeyByZXR1cm4gaXRlcmF0b3I7IH0gfV07XHJcbiAgICB9XHJcbiAgICBJdGVyYWJsZS5jb25zdW1lID0gY29uc3VtZTtcclxufSkoZXhwb3J0cy5JdGVyYWJsZSB8fCAoZXhwb3J0cy5JdGVyYWJsZSA9IHt9KSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbnZhciBmdW5jdGlvbmFsID0gcmVxdWlyZSgnLi4vLi4vLi4vYmFzZS9jb21tb24vZnVuY3Rpb25hbC9pbmRleC5qcycpO1xudmFyIGl0ZXJhdG9yID0gcmVxdWlyZSgnLi4vLi4vLi4vYmFzZS9jb21tb24vaXRlcmF0b3IvaW5kZXguanMnKTtcblxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbmZ1bmN0aW9uIG1hcmtUcmFja2VkKHgpIHtcclxuICAgIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gdHJhY2tEaXNwb3NhYmxlKHgpIHtcclxuICAgIHtcclxuICAgICAgICByZXR1cm4geDtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBpc0Rpc3Bvc2FibGUodGhpbmcpIHtcclxuICAgIHJldHVybiB0eXBlb2YgdGhpbmcuZGlzcG9zZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0aGluZy5kaXNwb3NlLmxlbmd0aCA9PT0gMDtcclxufVxyXG5mdW5jdGlvbiBkaXNwb3NlKGFyZykge1xyXG4gICAgaWYgKGl0ZXJhdG9yLkl0ZXJhYmxlLmlzKGFyZykpIHtcclxuICAgICAgICBmb3IgKGxldCBkIG9mIGFyZykge1xyXG4gICAgICAgICAgICBpZiAoZCkge1xyXG4gICAgICAgICAgICAgICAgZC5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXJnKSA/IFtdIDogYXJnO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoYXJnKSB7XHJcbiAgICAgICAgYXJnLmRpc3Bvc2UoKTtcclxuICAgICAgICByZXR1cm4gYXJnO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIGNvbWJpbmVkRGlzcG9zYWJsZSguLi5kaXNwb3NhYmxlcykge1xyXG4gICAgZGlzcG9zYWJsZXMuZm9yRWFjaChtYXJrVHJhY2tlZCk7XHJcbiAgICByZXR1cm4gdHJhY2tEaXNwb3NhYmxlKHsgZGlzcG9zZTogKCkgPT4gZGlzcG9zZShkaXNwb3NhYmxlcykgfSk7XHJcbn1cclxuZnVuY3Rpb24gdG9EaXNwb3NhYmxlKGZuKSB7XHJcbiAgICBjb25zdCBzZWxmID0gdHJhY2tEaXNwb3NhYmxlKHtcclxuICAgICAgICBkaXNwb3NlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGZuKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gc2VsZjtcclxufVxyXG5jbGFzcyBEaXNwb3NhYmxlU3RvcmUge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5fdG9EaXNwb3NlID0gbmV3IFNldCgpO1xyXG4gICAgICAgIHRoaXMuX2lzRGlzcG9zZWQgPSBmYWxzZTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogRGlzcG9zZSBvZiBhbGwgcmVnaXN0ZXJlZCBkaXNwb3NhYmxlcyBhbmQgbWFyayB0aGlzIG9iamVjdCBhcyBkaXNwb3NlZC5cclxuICAgICAqXHJcbiAgICAgKiBBbnkgZnV0dXJlIGRpc3Bvc2FibGVzIGFkZGVkIHRvIHRoaXMgb2JqZWN0IHdpbGwgYmUgZGlzcG9zZWQgb2Ygb24gYGFkZGAuXHJcbiAgICAgKi9cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2lzRGlzcG9zZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9pc0Rpc3Bvc2VkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmNsZWFyKCk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIERpc3Bvc2Ugb2YgYWxsIHJlZ2lzdGVyZWQgZGlzcG9zYWJsZXMgYnV0IGRvIG5vdCBtYXJrIHRoaXMgb2JqZWN0IGFzIGRpc3Bvc2VkLlxyXG4gICAgICovXHJcbiAgICBjbGVhcigpIHtcclxuICAgICAgICB0aGlzLl90b0Rpc3Bvc2UuZm9yRWFjaChpdGVtID0+IGl0ZW0uZGlzcG9zZSgpKTtcclxuICAgICAgICB0aGlzLl90b0Rpc3Bvc2UuY2xlYXIoKTtcclxuICAgIH1cclxuICAgIGFkZCh0KSB7XHJcbiAgICAgICAgaWYgKCF0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodCA9PT0gdGhpcykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCByZWdpc3RlciBhIGRpc3Bvc2FibGUgb24gaXRzZWxmIScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5faXNEaXNwb3NlZCkge1xyXG4gICAgICAgICAgICBpZiAoIURpc3Bvc2FibGVTdG9yZS5ESVNBQkxFX0RJU1BPU0VEX1dBUk5JTkcpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihuZXcgRXJyb3IoJ1RyeWluZyB0byBhZGQgYSBkaXNwb3NhYmxlIHRvIGEgRGlzcG9zYWJsZVN0b3JlIHRoYXQgaGFzIGFscmVhZHkgYmVlbiBkaXNwb3NlZCBvZi4gVGhlIGFkZGVkIG9iamVjdCB3aWxsIGJlIGxlYWtlZCEnKS5zdGFjayk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3RvRGlzcG9zZS5hZGQodCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG59XHJcbkRpc3Bvc2FibGVTdG9yZS5ESVNBQkxFX0RJU1BPU0VEX1dBUk5JTkcgPSBmYWxzZTtcclxuY2xhc3MgRGlzcG9zYWJsZSB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLl9zdG9yZSA9IG5ldyBEaXNwb3NhYmxlU3RvcmUoKTtcclxuICAgIH1cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5fc3RvcmUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG4gICAgX3JlZ2lzdGVyKHQpIHtcclxuICAgICAgICBpZiAodCA9PT0gdGhpcykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCByZWdpc3RlciBhIGRpc3Bvc2FibGUgb24gaXRzZWxmIScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5fc3RvcmUuYWRkKHQpO1xyXG4gICAgfVxyXG59XHJcbkRpc3Bvc2FibGUuTm9uZSA9IE9iamVjdC5mcmVlemUoeyBkaXNwb3NlKCkgeyB9IH0pO1xyXG4vKipcclxuICogTWFuYWdlcyB0aGUgbGlmZWN5Y2xlIG9mIGEgZGlzcG9zYWJsZSB2YWx1ZSB0aGF0IG1heSBiZSBjaGFuZ2VkLlxyXG4gKlxyXG4gKiBUaGlzIGVuc3VyZXMgdGhhdCB3aGVuIHRoZSBkaXNwb3NhYmxlIHZhbHVlIGlzIGNoYW5nZWQsIHRoZSBwcmV2aW91c2x5IGhlbGQgZGlzcG9zYWJsZSBpcyBkaXNwb3NlZCBvZi4gWW91IGNhblxyXG4gKiBhbHNvIHJlZ2lzdGVyIGEgYE11dGFibGVEaXNwb3NhYmxlYCBvbiBhIGBEaXNwb3NhYmxlYCB0byBlbnN1cmUgaXQgaXMgYXV0b21hdGljYWxseSBjbGVhbmVkIHVwLlxyXG4gKi9cclxuY2xhc3MgTXV0YWJsZURpc3Bvc2FibGUge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5faXNEaXNwb3NlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG4gICAgZ2V0IHZhbHVlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pc0Rpc3Bvc2VkID8gdW5kZWZpbmVkIDogdGhpcy5fdmFsdWU7XHJcbiAgICB9XHJcbiAgICBzZXQgdmFsdWUodmFsdWUpIHtcclxuICAgICAgICBpZiAodGhpcy5faXNEaXNwb3NlZCB8fCB2YWx1ZSA9PT0gdGhpcy5fdmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fdmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5fdmFsdWUuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5faXNEaXNwb3NlZCA9IHRydWU7XHJcbiAgICAgICAgaWYgKHRoaXMuX3ZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbn1cclxuY2xhc3MgUmVmZXJlbmNlQ29sbGVjdGlvbiB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnJlZmVyZW5jZXMgPSBuZXcgTWFwKCk7XHJcbiAgICB9XHJcbiAgICBhY3F1aXJlKGtleSwgLi4uYXJncykge1xyXG4gICAgICAgIGxldCByZWZlcmVuY2UgPSB0aGlzLnJlZmVyZW5jZXMuZ2V0KGtleSk7XHJcbiAgICAgICAgaWYgKCFyZWZlcmVuY2UpIHtcclxuICAgICAgICAgICAgcmVmZXJlbmNlID0geyBjb3VudGVyOiAwLCBvYmplY3Q6IHRoaXMuY3JlYXRlUmVmZXJlbmNlZE9iamVjdChrZXksIC4uLmFyZ3MpIH07XHJcbiAgICAgICAgICAgIHRoaXMucmVmZXJlbmNlcy5zZXQoa2V5LCByZWZlcmVuY2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB7IG9iamVjdCB9ID0gcmVmZXJlbmNlO1xyXG4gICAgICAgIGNvbnN0IGRpc3Bvc2UgPSBmdW5jdGlvbmFsLm9uY2UoKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoLS1yZWZlcmVuY2UuY291bnRlciA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kZXN0cm95UmVmZXJlbmNlZE9iamVjdChrZXksIHJlZmVyZW5jZS5vYmplY3QpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWZlcmVuY2VzLmRlbGV0ZShrZXkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmVmZXJlbmNlLmNvdW50ZXIrKztcclxuICAgICAgICByZXR1cm4geyBvYmplY3QsIGRpc3Bvc2UgfTtcclxuICAgIH1cclxufVxyXG5jbGFzcyBJbW1vcnRhbFJlZmVyZW5jZSB7XHJcbiAgICBjb25zdHJ1Y3RvcihvYmplY3QpIHtcclxuICAgICAgICB0aGlzLm9iamVjdCA9IG9iamVjdDtcclxuICAgIH1cclxuICAgIGRpc3Bvc2UoKSB7IH1cclxufVxuXG5leHBvcnRzLkRpc3Bvc2FibGUgPSBEaXNwb3NhYmxlO1xuZXhwb3J0cy5EaXNwb3NhYmxlU3RvcmUgPSBEaXNwb3NhYmxlU3RvcmU7XG5leHBvcnRzLkltbW9ydGFsUmVmZXJlbmNlID0gSW1tb3J0YWxSZWZlcmVuY2U7XG5leHBvcnRzLk11dGFibGVEaXNwb3NhYmxlID0gTXV0YWJsZURpc3Bvc2FibGU7XG5leHBvcnRzLlJlZmVyZW5jZUNvbGxlY3Rpb24gPSBSZWZlcmVuY2VDb2xsZWN0aW9uO1xuZXhwb3J0cy5jb21iaW5lZERpc3Bvc2FibGUgPSBjb21iaW5lZERpc3Bvc2FibGU7XG5leHBvcnRzLmRpc3Bvc2UgPSBkaXNwb3NlO1xuZXhwb3J0cy5pc0Rpc3Bvc2FibGUgPSBpc0Rpc3Bvc2FibGU7XG5leHBvcnRzLnRvRGlzcG9zYWJsZSA9IHRvRGlzcG9zYWJsZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbmNsYXNzIE5vZGUge1xyXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICAgICAgdGhpcy5uZXh0ID0gTm9kZS5VbmRlZmluZWQ7XHJcbiAgICAgICAgdGhpcy5wcmV2ID0gTm9kZS5VbmRlZmluZWQ7XHJcbiAgICB9XHJcbn1cclxuTm9kZS5VbmRlZmluZWQgPSBuZXcgTm9kZSh1bmRlZmluZWQpO1xyXG5jbGFzcyBMaW5rZWRMaXN0IHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuX2ZpcnN0ID0gTm9kZS5VbmRlZmluZWQ7XHJcbiAgICAgICAgdGhpcy5fbGFzdCA9IE5vZGUuVW5kZWZpbmVkO1xyXG4gICAgICAgIHRoaXMuX3NpemUgPSAwO1xyXG4gICAgfVxyXG4gICAgZ2V0IHNpemUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NpemU7XHJcbiAgICB9XHJcbiAgICBpc0VtcHR5KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9maXJzdCA9PT0gTm9kZS5VbmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICBjbGVhcigpIHtcclxuICAgICAgICB0aGlzLl9maXJzdCA9IE5vZGUuVW5kZWZpbmVkO1xyXG4gICAgICAgIHRoaXMuX2xhc3QgPSBOb2RlLlVuZGVmaW5lZDtcclxuICAgICAgICB0aGlzLl9zaXplID0gMDtcclxuICAgIH1cclxuICAgIHVuc2hpZnQoZWxlbWVudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pbnNlcnQoZWxlbWVudCwgZmFsc2UpO1xyXG4gICAgfVxyXG4gICAgcHVzaChlbGVtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2luc2VydChlbGVtZW50LCB0cnVlKTtcclxuICAgIH1cclxuICAgIF9pbnNlcnQoZWxlbWVudCwgYXRUaGVFbmQpIHtcclxuICAgICAgICBjb25zdCBuZXdOb2RlID0gbmV3IE5vZGUoZWxlbWVudCk7XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZpcnN0ID09PSBOb2RlLlVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB0aGlzLl9maXJzdCA9IG5ld05vZGU7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3QgPSBuZXdOb2RlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChhdFRoZUVuZCkge1xyXG4gICAgICAgICAgICAvLyBwdXNoXHJcbiAgICAgICAgICAgIGNvbnN0IG9sZExhc3QgPSB0aGlzLl9sYXN0O1xyXG4gICAgICAgICAgICB0aGlzLl9sYXN0ID0gbmV3Tm9kZTtcclxuICAgICAgICAgICAgbmV3Tm9kZS5wcmV2ID0gb2xkTGFzdDtcclxuICAgICAgICAgICAgb2xkTGFzdC5uZXh0ID0gbmV3Tm9kZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIHVuc2hpZnRcclxuICAgICAgICAgICAgY29uc3Qgb2xkRmlyc3QgPSB0aGlzLl9maXJzdDtcclxuICAgICAgICAgICAgdGhpcy5fZmlyc3QgPSBuZXdOb2RlO1xyXG4gICAgICAgICAgICBuZXdOb2RlLm5leHQgPSBvbGRGaXJzdDtcclxuICAgICAgICAgICAgb2xkRmlyc3QucHJldiA9IG5ld05vZGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3NpemUgKz0gMTtcclxuICAgICAgICBsZXQgZGlkUmVtb3ZlID0gZmFsc2U7XHJcbiAgICAgICAgcmV0dXJuICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKCFkaWRSZW1vdmUpIHtcclxuICAgICAgICAgICAgICAgIGRpZFJlbW92ZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmUobmV3Tm9kZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgc2hpZnQoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZpcnN0ID09PSBOb2RlLlVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzID0gdGhpcy5fZmlyc3QuZWxlbWVudDtcclxuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlKHRoaXMuX2ZpcnN0KTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBwb3AoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2xhc3QgPT09IE5vZGUuVW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zdCByZXMgPSB0aGlzLl9sYXN0LmVsZW1lbnQ7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZSh0aGlzLl9sYXN0KTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBfcmVtb3ZlKG5vZGUpIHtcclxuICAgICAgICBpZiAobm9kZS5wcmV2ICE9PSBOb2RlLlVuZGVmaW5lZCAmJiBub2RlLm5leHQgIT09IE5vZGUuVW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIC8vIG1pZGRsZVxyXG4gICAgICAgICAgICBjb25zdCBhbmNob3IgPSBub2RlLnByZXY7XHJcbiAgICAgICAgICAgIGFuY2hvci5uZXh0ID0gbm9kZS5uZXh0O1xyXG4gICAgICAgICAgICBub2RlLm5leHQucHJldiA9IGFuY2hvcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobm9kZS5wcmV2ID09PSBOb2RlLlVuZGVmaW5lZCAmJiBub2RlLm5leHQgPT09IE5vZGUuVW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIC8vIG9ubHkgbm9kZVxyXG4gICAgICAgICAgICB0aGlzLl9maXJzdCA9IE5vZGUuVW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB0aGlzLl9sYXN0ID0gTm9kZS5VbmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG5vZGUubmV4dCA9PT0gTm9kZS5VbmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gbGFzdFxyXG4gICAgICAgICAgICB0aGlzLl9sYXN0ID0gdGhpcy5fbGFzdC5wcmV2O1xyXG4gICAgICAgICAgICB0aGlzLl9sYXN0Lm5leHQgPSBOb2RlLlVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobm9kZS5wcmV2ID09PSBOb2RlLlVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAvLyBmaXJzdFxyXG4gICAgICAgICAgICB0aGlzLl9maXJzdCA9IHRoaXMuX2ZpcnN0Lm5leHQ7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpcnN0LnByZXYgPSBOb2RlLlVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gZG9uZVxyXG4gICAgICAgIHRoaXMuX3NpemUgLT0gMTtcclxuICAgIH1cclxuICAgICpbU3ltYm9sLml0ZXJhdG9yXSgpIHtcclxuICAgICAgICBsZXQgbm9kZSA9IHRoaXMuX2ZpcnN0O1xyXG4gICAgICAgIHdoaWxlIChub2RlICE9PSBOb2RlLlVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB5aWVsZCBub2RlLmVsZW1lbnQ7XHJcbiAgICAgICAgICAgIG5vZGUgPSBub2RlLm5leHQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdG9BcnJheSgpIHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBub2RlID0gdGhpcy5fZmlyc3Q7IG5vZGUgIT09IE5vZGUuVW5kZWZpbmVkOyBub2RlID0gbm9kZS5uZXh0KSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5vZGUuZWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbn1cblxuZXhwb3J0cy5MaW5rZWRMaXN0ID0gTGlua2VkTGlzdDtcbiIsIi8vIEltcG9ydHNcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fIGZyb20gXCIuLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvY3NzV2l0aE1hcHBpbmdUb1N0cmluZy5qc1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyBmcm9tIFwiLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2FwaS5qc1wiO1xudmFyIF9fX0NTU19MT0FERVJfRVhQT1JUX19fID0gX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18pO1xuLy8gTW9kdWxlXG5fX19DU1NfTE9BREVSX0VYUE9SVF9fXy5wdXNoKFttb2R1bGUuaWQsIFwiLl9fc2Nfb3ZlcmxheSB7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICBiYWNrZ3JvdW5kOiAjZGZiOGFiO1xcbiAgYm9yZGVyOiAxcHggc29saWQgcmVkO1xcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gIG9wYWNpdHk6IDAuMztcXG59XCIsIFwiXCIse1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wid2VicGFjazovLy4vY29udGVudC9zY3JlZW4uc2Nzc1wiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiQUFBQTtFQUNFLGtCQUFBO0VBQ0EsbUJBQUE7RUFDQSxxQkFBQTtFQUNBLHNCQUFBO0VBQ0EsWUFBQTtBQUNGXCIsXCJzb3VyY2VzQ29udGVudFwiOltcIi5fX3NjX292ZXJsYXkge1xcclxcbiAgcG9zaXRpb246IGFic29sdXRlO1xcclxcbiAgYmFja2dyb3VuZDogcmdiKDIyMywgMTg0LCAxNzEpO1xcclxcbiAgYm9yZGVyOiAxcHggc29saWQgcmVkO1xcclxcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcXHJcXG4gIG9wYWNpdHk6IC4zO1xcclxcbn1cIl0sXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcbi8vIEV4cG9ydHNcbmV4cG9ydCBkZWZhdWx0IF9fX0NTU19MT0FERVJfRVhQT1JUX19fO1xuIiwiLy8gSW1wb3J0c1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18gZnJvbSBcIi4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9jc3NXaXRoTWFwcGluZ1RvU3RyaW5nLmpzXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fIGZyb20gXCIuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzXCI7XG52YXIgX19fQ1NTX0xPQURFUl9FWFBPUlRfX18gPSBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyk7XG4vLyBNb2R1bGVcbl9fX0NTU19MT0FERVJfRVhQT1JUX19fLnB1c2goW21vZHVsZS5pZCwgXCIudG9vbC1tZWFzdXJlIHtcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIHRvcDogMDtcXG4gIGxlZnQ6IDA7XFxufVxcbi50b29sLW1lYXN1cmUgLmhvcml6b250YWwge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgdG9wOiAwO1xcbiAgaGVpZ2h0OiAxcHg7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiBjb3JuZmxvd2VyYmx1ZTtcXG59XFxuLnRvb2wtbWVhc3VyZSAudmVydGljYWwge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgbGVmdDogMDtcXG4gIHdpZHRoOiAxcHg7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiBjb3JuZmxvd2VyYmx1ZTtcXG59XFxuLnRvb2wtbWVhc3VyZSAubGFiZWwge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgZm9udC1zaXplOiAxMXB4O1xcbiAgYmFja2dyb3VuZDogYmxhY2s7XFxuICBjb2xvcjogd2hpdGU7XFxuICBwYWRkaW5nOiAzcHg7XFxuICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgb3BhY2l0eTogMTtcXG4gIGJvcmRlci1yYWRpdXM6IDdweDtcXG59XCIsIFwiXCIse1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wid2VicGFjazovLy4vY29udGVudC90b29sL21lYXN1cmUuc2Nzc1wiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiQUFBQTtFQUNFLGtCQUFBO0VBQ0EsTUFBQTtFQUNBLE9BQUE7QUFDRjtBQUNFO0VBQ0Usa0JBQUE7RUFDQSxNQUFBO0VBQ0EsV0FBQTtFQUNBLGdDQUFBO0FBQ0o7QUFFRTtFQUNFLGtCQUFBO0VBQ0EsT0FBQTtFQUNBLFVBQUE7RUFDQSxnQ0FBQTtBQUFKO0FBR0U7RUFDRSxrQkFBQTtFQUNBLGVBQUE7RUFDQSxpQkFBQTtFQUNBLFlBQUE7RUFDQSxZQUFBO0VBQ0Esc0JBQUE7RUFDQSxVQUFBO0VBQ0Esa0JBQUE7QUFESlwiLFwic291cmNlc0NvbnRlbnRcIjpbXCIudG9vbC1tZWFzdXJlIHtcXHJcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXHJcXG4gIHRvcDogMDtcXHJcXG4gIGxlZnQ6IDA7XFxyXFxuXFxyXFxuICAuaG9yaXpvbnRhbCB7XFxyXFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXHJcXG4gICAgdG9wOiAwO1xcclxcbiAgICBoZWlnaHQ6IDFweDtcXHJcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogY29ybmZsb3dlcmJsdWU7XFxyXFxuICB9XFxyXFxuXFxyXFxuICAudmVydGljYWwge1xcclxcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxyXFxuICAgIGxlZnQ6IDA7XFxyXFxuICAgIHdpZHRoOiAxcHg7XFxyXFxuICAgIGJhY2tncm91bmQtY29sb3I6IGNvcm5mbG93ZXJibHVlO1xcclxcbiAgfVxcclxcblxcclxcbiAgLmxhYmVsIHtcXHJcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcclxcbiAgICBmb250LXNpemU6IDExcHg7XFxyXFxuICAgIGJhY2tncm91bmQ6IGJsYWNrO1xcclxcbiAgICBjb2xvcjogd2hpdGU7XFxyXFxuICAgIHBhZGRpbmc6IDNweDtcXHJcXG4gICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcXHJcXG4gICAgb3BhY2l0eTogMTtcXHJcXG4gICAgYm9yZGVyLXJhZGl1czogN3B4O1xcclxcbiAgfVxcclxcblxcclxcbn1cIl0sXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcbi8vIEV4cG9ydHNcbmV4cG9ydCBkZWZhdWx0IF9fX0NTU19MT0FERVJfRVhQT1JUX19fO1xuIiwiLy8gSW1wb3J0c1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18gZnJvbSBcIi4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9jc3NXaXRoTWFwcGluZ1RvU3RyaW5nLmpzXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fIGZyb20gXCIuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzXCI7XG52YXIgX19fQ1NTX0xPQURFUl9FWFBPUlRfX18gPSBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyk7XG4vLyBNb2R1bGVcbl9fX0NTU19MT0FERVJfRVhQT1JUX19fLnB1c2goW21vZHVsZS5pZCwgXCIudG9vbC1zZWxlY3Qge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgdG9wOiAwO1xcbiAgbGVmdDogMDtcXG4gIHJpZ2h0OiAwO1xcbiAgYm90dG9tOiAwO1xcbiAgcG9pbnRlci1ldmVudHM6IGF1dG87XFxuICBjdXJzb3I6IG5vbmU7XFxufVxcbi50b29sLXNlbGVjdCAuaG92ZXJpbmcge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogc3RlZWxibHVlO1xcbiAgYm9yZGVyOiAxcHggc29saWQgcmVkO1xcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gIG9wYWNpdHk6IDAuMTtcXG59XFxuLnRvb2wtc2VsZWN0IC5zZWxlY3Rpbmcge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogc3RlZWxibHVlO1xcbiAgb3BhY2l0eTogMC4xNTtcXG59XCIsIFwiXCIse1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wid2VicGFjazovLy4vY29udGVudC90b29sL3NlbGVjdC5zY3NzXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJBQUFBO0VBQ0Usa0JBQUE7RUFDQSxNQUFBO0VBQ0EsT0FBQTtFQUNBLFFBQUE7RUFDQSxTQUFBO0VBQ0Esb0JBQUE7RUFDQSxZQUFBO0FBQ0Y7QUFDRTtFQUNFLGtCQUFBO0VBQ0EsMkJBQUE7RUFDQSxxQkFBQTtFQUNBLHNCQUFBO0VBQ0EsWUFBQTtBQUNKO0FBRUU7RUFDRSxrQkFBQTtFQUNBLDJCQUFBO0VBQ0EsYUFBQTtBQUFKXCIsXCJzb3VyY2VzQ29udGVudFwiOltcIi50b29sLXNlbGVjdCB7XFxyXFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxyXFxuICB0b3A6IDA7XFxyXFxuICBsZWZ0OiAwO1xcclxcbiAgcmlnaHQ6IDA7XFxyXFxuICBib3R0b206IDA7XFxyXFxuICBwb2ludGVyLWV2ZW50czogYXV0bztcXHJcXG4gIGN1cnNvcjogbm9uZTtcXHJcXG5cXHJcXG4gIC5ob3ZlcmluZyB7XFxyXFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXHJcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogc3RlZWxibHVlO1xcclxcbiAgICBib3JkZXI6IDFweCBzb2xpZCByZWQ7XFxyXFxuICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxyXFxuICAgIG9wYWNpdHk6IC4xO1xcclxcbiAgfVxcclxcblxcclxcbiAgLnNlbGVjdGluZyB7XFxyXFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXHJcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogc3RlZWxibHVlO1xcclxcbiAgICBvcGFjaXR5OiAuMTU7XFxyXFxuICB9XFxyXFxuXFxyXFxufVwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuLy8gRXhwb3J0c1xuZXhwb3J0IGRlZmF1bHQgX19fQ1NTX0xPQURFUl9FWFBPUlRfX187XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuLypcbiAgTUlUIExpY2Vuc2UgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcbiAgQXV0aG9yIFRvYmlhcyBLb3BwZXJzIEBzb2tyYVxuKi9cbi8vIGNzcyBiYXNlIGNvZGUsIGluamVjdGVkIGJ5IHRoZSBjc3MtbG9hZGVyXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZnVuYy1uYW1lc1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY3NzV2l0aE1hcHBpbmdUb1N0cmluZykge1xuICB2YXIgbGlzdCA9IFtdOyAvLyByZXR1cm4gdGhlIGxpc3Qgb2YgbW9kdWxlcyBhcyBjc3Mgc3RyaW5nXG5cbiAgbGlzdC50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiB0aGlzLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgdmFyIGNvbnRlbnQgPSBjc3NXaXRoTWFwcGluZ1RvU3RyaW5nKGl0ZW0pO1xuXG4gICAgICBpZiAoaXRlbVsyXSkge1xuICAgICAgICByZXR1cm4gXCJAbWVkaWEgXCIuY29uY2F0KGl0ZW1bMl0sIFwiIHtcIikuY29uY2F0KGNvbnRlbnQsIFwifVwiKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfSkuam9pbihcIlwiKTtcbiAgfTsgLy8gaW1wb3J0IGEgbGlzdCBvZiBtb2R1bGVzIGludG8gdGhlIGxpc3RcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGZ1bmMtbmFtZXNcblxuXG4gIGxpc3QuaSA9IGZ1bmN0aW9uIChtb2R1bGVzLCBtZWRpYVF1ZXJ5LCBkZWR1cGUpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZXMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgbW9kdWxlcyA9IFtbbnVsbCwgbW9kdWxlcywgXCJcIl1dO1xuICAgIH1cblxuICAgIHZhciBhbHJlYWR5SW1wb3J0ZWRNb2R1bGVzID0ge307XG5cbiAgICBpZiAoZGVkdXBlKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHByZWZlci1kZXN0cnVjdHVyaW5nXG4gICAgICAgIHZhciBpZCA9IHRoaXNbaV1bMF07XG5cbiAgICAgICAgaWYgKGlkICE9IG51bGwpIHtcbiAgICAgICAgICBhbHJlYWR5SW1wb3J0ZWRNb2R1bGVzW2lkXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgbW9kdWxlcy5sZW5ndGg7IF9pKyspIHtcbiAgICAgIHZhciBpdGVtID0gW10uY29uY2F0KG1vZHVsZXNbX2ldKTtcblxuICAgICAgaWYgKGRlZHVwZSAmJiBhbHJlYWR5SW1wb3J0ZWRNb2R1bGVzW2l0ZW1bMF1dKSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb250aW51ZVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKG1lZGlhUXVlcnkpIHtcbiAgICAgICAgaWYgKCFpdGVtWzJdKSB7XG4gICAgICAgICAgaXRlbVsyXSA9IG1lZGlhUXVlcnk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaXRlbVsyXSA9IFwiXCIuY29uY2F0KG1lZGlhUXVlcnksIFwiIGFuZCBcIikuY29uY2F0KGl0ZW1bMl0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGxpc3QucHVzaChpdGVtKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGxpc3Q7XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfc2xpY2VkVG9BcnJheShhcnIsIGkpIHsgcmV0dXJuIF9hcnJheVdpdGhIb2xlcyhhcnIpIHx8IF9pdGVyYWJsZVRvQXJyYXlMaW1pdChhcnIsIGkpIHx8IF91bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheShhcnIsIGkpIHx8IF9ub25JdGVyYWJsZVJlc3QoKTsgfVxuXG5mdW5jdGlvbiBfbm9uSXRlcmFibGVSZXN0KCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBhdHRlbXB0IHRvIGRlc3RydWN0dXJlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZS5cXG5JbiBvcmRlciB0byBiZSBpdGVyYWJsZSwgbm9uLWFycmF5IG9iamVjdHMgbXVzdCBoYXZlIGEgW1N5bWJvbC5pdGVyYXRvcl0oKSBtZXRob2QuXCIpOyB9XG5cbmZ1bmN0aW9uIF91bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheShvLCBtaW5MZW4pIHsgaWYgKCFvKSByZXR1cm47IGlmICh0eXBlb2YgbyA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIF9hcnJheUxpa2VUb0FycmF5KG8sIG1pbkxlbik7IHZhciBuID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pLnNsaWNlKDgsIC0xKTsgaWYgKG4gPT09IFwiT2JqZWN0XCIgJiYgby5jb25zdHJ1Y3RvcikgbiA9IG8uY29uc3RydWN0b3IubmFtZTsgaWYgKG4gPT09IFwiTWFwXCIgfHwgbiA9PT0gXCJTZXRcIikgcmV0dXJuIEFycmF5LmZyb20obyk7IGlmIChuID09PSBcIkFyZ3VtZW50c1wiIHx8IC9eKD86VWl8SSludCg/Ojh8MTZ8MzIpKD86Q2xhbXBlZCk/QXJyYXkkLy50ZXN0KG4pKSByZXR1cm4gX2FycmF5TGlrZVRvQXJyYXkobywgbWluTGVuKTsgfVxuXG5mdW5jdGlvbiBfYXJyYXlMaWtlVG9BcnJheShhcnIsIGxlbikgeyBpZiAobGVuID09IG51bGwgfHwgbGVuID4gYXJyLmxlbmd0aCkgbGVuID0gYXJyLmxlbmd0aDsgZm9yICh2YXIgaSA9IDAsIGFycjIgPSBuZXcgQXJyYXkobGVuKTsgaSA8IGxlbjsgaSsrKSB7IGFycjJbaV0gPSBhcnJbaV07IH0gcmV0dXJuIGFycjI7IH1cblxuZnVuY3Rpb24gX2l0ZXJhYmxlVG9BcnJheUxpbWl0KGFyciwgaSkgeyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoYXJyKSkpIHJldHVybjsgdmFyIF9hcnIgPSBbXTsgdmFyIF9uID0gdHJ1ZTsgdmFyIF9kID0gZmFsc2U7IHZhciBfZSA9IHVuZGVmaW5lZDsgdHJ5IHsgZm9yICh2YXIgX2kgPSBhcnJbU3ltYm9sLml0ZXJhdG9yXSgpLCBfczsgIShfbiA9IChfcyA9IF9pLm5leHQoKSkuZG9uZSk7IF9uID0gdHJ1ZSkgeyBfYXJyLnB1c2goX3MudmFsdWUpOyBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7IH0gfSBjYXRjaCAoZXJyKSB7IF9kID0gdHJ1ZTsgX2UgPSBlcnI7IH0gZmluYWxseSB7IHRyeSB7IGlmICghX24gJiYgX2lbXCJyZXR1cm5cIl0gIT0gbnVsbCkgX2lbXCJyZXR1cm5cIl0oKTsgfSBmaW5hbGx5IHsgaWYgKF9kKSB0aHJvdyBfZTsgfSB9IHJldHVybiBfYXJyOyB9XG5cbmZ1bmN0aW9uIF9hcnJheVdpdGhIb2xlcyhhcnIpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgcmV0dXJuIGFycjsgfVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNzc1dpdGhNYXBwaW5nVG9TdHJpbmcoaXRlbSkge1xuICB2YXIgX2l0ZW0gPSBfc2xpY2VkVG9BcnJheShpdGVtLCA0KSxcbiAgICAgIGNvbnRlbnQgPSBfaXRlbVsxXSxcbiAgICAgIGNzc01hcHBpbmcgPSBfaXRlbVszXTtcblxuICBpZiAodHlwZW9mIGJ0b2EgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxuICAgIHZhciBiYXNlNjQgPSBidG9hKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShjc3NNYXBwaW5nKSkpKTtcbiAgICB2YXIgZGF0YSA9IFwic291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD11dGYtODtiYXNlNjQsXCIuY29uY2F0KGJhc2U2NCk7XG4gICAgdmFyIHNvdXJjZU1hcHBpbmcgPSBcIi8qIyBcIi5jb25jYXQoZGF0YSwgXCIgKi9cIik7XG4gICAgdmFyIHNvdXJjZVVSTHMgPSBjc3NNYXBwaW5nLnNvdXJjZXMubWFwKGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICAgIHJldHVybiBcIi8qIyBzb3VyY2VVUkw9XCIuY29uY2F0KGNzc01hcHBpbmcuc291cmNlUm9vdCB8fCBcIlwiKS5jb25jYXQoc291cmNlLCBcIiAqL1wiKTtcbiAgICB9KTtcbiAgICByZXR1cm4gW2NvbnRlbnRdLmNvbmNhdChzb3VyY2VVUkxzKS5jb25jYXQoW3NvdXJjZU1hcHBpbmddKS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtjb250ZW50XS5qb2luKFwiXFxuXCIpO1xufTsiLCJpbXBvcnQgYXBpIGZyb20gXCIhLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5qZWN0U3R5bGVzSW50b1N0eWxlVGFnLmpzXCI7XG4gICAgICAgICAgICBpbXBvcnQgY29udGVudCBmcm9tIFwiISEuLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcyEuLi9ub2RlX21vZHVsZXMvc2Fzcy1sb2FkZXIvZGlzdC9janMuanMhLi9zY3JlZW4uc2Nzc1wiO1xuXG52YXIgb3B0aW9ucyA9IHt9O1xuXG5vcHRpb25zLmluc2VydCA9IFwiaGVhZFwiO1xub3B0aW9ucy5zaW5nbGV0b24gPSBmYWxzZTtcblxudmFyIHVwZGF0ZSA9IGFwaShjb250ZW50LCBvcHRpb25zKTtcblxuXG5cbmV4cG9ydCBkZWZhdWx0IGNvbnRlbnQubG9jYWxzIHx8IHt9OyIsImltcG9ydCBhcGkgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbmplY3RTdHlsZXNJbnRvU3R5bGVUYWcuanNcIjtcbiAgICAgICAgICAgIGltcG9ydCBjb250ZW50IGZyb20gXCIhIS4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4uLy4uL25vZGVfbW9kdWxlcy9zYXNzLWxvYWRlci9kaXN0L2Nqcy5qcyEuL21lYXN1cmUuc2Nzc1wiO1xuXG52YXIgb3B0aW9ucyA9IHt9O1xuXG5vcHRpb25zLmluc2VydCA9IFwiaGVhZFwiO1xub3B0aW9ucy5zaW5nbGV0b24gPSBmYWxzZTtcblxudmFyIHVwZGF0ZSA9IGFwaShjb250ZW50LCBvcHRpb25zKTtcblxuXG5cbmV4cG9ydCBkZWZhdWx0IGNvbnRlbnQubG9jYWxzIHx8IHt9OyIsImltcG9ydCBhcGkgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbmplY3RTdHlsZXNJbnRvU3R5bGVUYWcuanNcIjtcbiAgICAgICAgICAgIGltcG9ydCBjb250ZW50IGZyb20gXCIhIS4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4uLy4uL25vZGVfbW9kdWxlcy9zYXNzLWxvYWRlci9kaXN0L2Nqcy5qcyEuL3NlbGVjdC5zY3NzXCI7XG5cbnZhciBvcHRpb25zID0ge307XG5cbm9wdGlvbnMuaW5zZXJ0ID0gXCJoZWFkXCI7XG5vcHRpb25zLnNpbmdsZXRvbiA9IGZhbHNlO1xuXG52YXIgdXBkYXRlID0gYXBpKGNvbnRlbnQsIG9wdGlvbnMpO1xuXG5cblxuZXhwb3J0IGRlZmF1bHQgY29udGVudC5sb2NhbHMgfHwge307IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBpc09sZElFID0gZnVuY3Rpb24gaXNPbGRJRSgpIHtcbiAgdmFyIG1lbW87XG4gIHJldHVybiBmdW5jdGlvbiBtZW1vcml6ZSgpIHtcbiAgICBpZiAodHlwZW9mIG1lbW8gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBUZXN0IGZvciBJRSA8PSA5IGFzIHByb3Bvc2VkIGJ5IEJyb3dzZXJoYWNrc1xuICAgICAgLy8gQHNlZSBodHRwOi8vYnJvd3NlcmhhY2tzLmNvbS8jaGFjay1lNzFkODY5MmY2NTMzNDE3M2ZlZTcxNWMyMjJjYjgwNVxuICAgICAgLy8gVGVzdHMgZm9yIGV4aXN0ZW5jZSBvZiBzdGFuZGFyZCBnbG9iYWxzIGlzIHRvIGFsbG93IHN0eWxlLWxvYWRlclxuICAgICAgLy8gdG8gb3BlcmF0ZSBjb3JyZWN0bHkgaW50byBub24tc3RhbmRhcmQgZW52aXJvbm1lbnRzXG4gICAgICAvLyBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS93ZWJwYWNrLWNvbnRyaWIvc3R5bGUtbG9hZGVyL2lzc3Vlcy8xNzdcbiAgICAgIG1lbW8gPSBCb29sZWFuKHdpbmRvdyAmJiBkb2N1bWVudCAmJiBkb2N1bWVudC5hbGwgJiYgIXdpbmRvdy5hdG9iKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWVtbztcbiAgfTtcbn0oKTtcblxudmFyIGdldFRhcmdldCA9IGZ1bmN0aW9uIGdldFRhcmdldCgpIHtcbiAgdmFyIG1lbW8gPSB7fTtcbiAgcmV0dXJuIGZ1bmN0aW9uIG1lbW9yaXplKHRhcmdldCkge1xuICAgIGlmICh0eXBlb2YgbWVtb1t0YXJnZXRdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgdmFyIHN0eWxlVGFyZ2V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0YXJnZXQpOyAvLyBTcGVjaWFsIGNhc2UgdG8gcmV0dXJuIGhlYWQgb2YgaWZyYW1lIGluc3RlYWQgb2YgaWZyYW1lIGl0c2VsZlxuXG4gICAgICBpZiAod2luZG93LkhUTUxJRnJhbWVFbGVtZW50ICYmIHN0eWxlVGFyZ2V0IGluc3RhbmNlb2Ygd2luZG93LkhUTUxJRnJhbWVFbGVtZW50KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gVGhpcyB3aWxsIHRocm93IGFuIGV4Y2VwdGlvbiBpZiBhY2Nlc3MgdG8gaWZyYW1lIGlzIGJsb2NrZWRcbiAgICAgICAgICAvLyBkdWUgdG8gY3Jvc3Mtb3JpZ2luIHJlc3RyaWN0aW9uc1xuICAgICAgICAgIHN0eWxlVGFyZ2V0ID0gc3R5bGVUYXJnZXQuY29udGVudERvY3VtZW50LmhlYWQ7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dFxuICAgICAgICAgIHN0eWxlVGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBtZW1vW3RhcmdldF0gPSBzdHlsZVRhcmdldDtcbiAgICB9XG5cbiAgICByZXR1cm4gbWVtb1t0YXJnZXRdO1xuICB9O1xufSgpO1xuXG52YXIgc3R5bGVzSW5Eb20gPSBbXTtcblxuZnVuY3Rpb24gZ2V0SW5kZXhCeUlkZW50aWZpZXIoaWRlbnRpZmllcikge1xuICB2YXIgcmVzdWx0ID0gLTE7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHlsZXNJbkRvbS5sZW5ndGg7IGkrKykge1xuICAgIGlmIChzdHlsZXNJbkRvbVtpXS5pZGVudGlmaWVyID09PSBpZGVudGlmaWVyKSB7XG4gICAgICByZXN1bHQgPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gbW9kdWxlc1RvRG9tKGxpc3QsIG9wdGlvbnMpIHtcbiAgdmFyIGlkQ291bnRNYXAgPSB7fTtcbiAgdmFyIGlkZW50aWZpZXJzID0gW107XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldO1xuICAgIHZhciBpZCA9IG9wdGlvbnMuYmFzZSA/IGl0ZW1bMF0gKyBvcHRpb25zLmJhc2UgOiBpdGVtWzBdO1xuICAgIHZhciBjb3VudCA9IGlkQ291bnRNYXBbaWRdIHx8IDA7XG4gICAgdmFyIGlkZW50aWZpZXIgPSBcIlwiLmNvbmNhdChpZCwgXCIgXCIpLmNvbmNhdChjb3VudCk7XG4gICAgaWRDb3VudE1hcFtpZF0gPSBjb3VudCArIDE7XG4gICAgdmFyIGluZGV4ID0gZ2V0SW5kZXhCeUlkZW50aWZpZXIoaWRlbnRpZmllcik7XG4gICAgdmFyIG9iaiA9IHtcbiAgICAgIGNzczogaXRlbVsxXSxcbiAgICAgIG1lZGlhOiBpdGVtWzJdLFxuICAgICAgc291cmNlTWFwOiBpdGVtWzNdXG4gICAgfTtcblxuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgIHN0eWxlc0luRG9tW2luZGV4XS5yZWZlcmVuY2VzKys7XG4gICAgICBzdHlsZXNJbkRvbVtpbmRleF0udXBkYXRlcihvYmopO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZXNJbkRvbS5wdXNoKHtcbiAgICAgICAgaWRlbnRpZmllcjogaWRlbnRpZmllcixcbiAgICAgICAgdXBkYXRlcjogYWRkU3R5bGUob2JqLCBvcHRpb25zKSxcbiAgICAgICAgcmVmZXJlbmNlczogMVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWRlbnRpZmllcnMucHVzaChpZGVudGlmaWVyKTtcbiAgfVxuXG4gIHJldHVybiBpZGVudGlmaWVycztcbn1cblxuZnVuY3Rpb24gaW5zZXJ0U3R5bGVFbGVtZW50KG9wdGlvbnMpIHtcbiAgdmFyIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgdmFyIGF0dHJpYnV0ZXMgPSBvcHRpb25zLmF0dHJpYnV0ZXMgfHwge307XG5cbiAgaWYgKHR5cGVvZiBhdHRyaWJ1dGVzLm5vbmNlID09PSAndW5kZWZpbmVkJykge1xuICAgIHZhciBub25jZSA9IHR5cGVvZiBfX3dlYnBhY2tfbm9uY2VfXyAhPT0gJ3VuZGVmaW5lZCcgPyBfX3dlYnBhY2tfbm9uY2VfXyA6IG51bGw7XG5cbiAgICBpZiAobm9uY2UpIHtcbiAgICAgIGF0dHJpYnV0ZXMubm9uY2UgPSBub25jZTtcbiAgICB9XG4gIH1cblxuICBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICBzdHlsZS5zZXRBdHRyaWJ1dGUoa2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICB9KTtcblxuICBpZiAodHlwZW9mIG9wdGlvbnMuaW5zZXJ0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgb3B0aW9ucy5pbnNlcnQoc3R5bGUpO1xuICB9IGVsc2Uge1xuICAgIHZhciB0YXJnZXQgPSBnZXRUYXJnZXQob3B0aW9ucy5pbnNlcnQgfHwgJ2hlYWQnKTtcblxuICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZG4ndCBmaW5kIGEgc3R5bGUgdGFyZ2V0LiBUaGlzIHByb2JhYmx5IG1lYW5zIHRoYXQgdGhlIHZhbHVlIGZvciB0aGUgJ2luc2VydCcgcGFyYW1ldGVyIGlzIGludmFsaWQuXCIpO1xuICAgIH1cblxuICAgIHRhcmdldC5hcHBlbmRDaGlsZChzdHlsZSk7XG4gIH1cblxuICByZXR1cm4gc3R5bGU7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVN0eWxlRWxlbWVudChzdHlsZSkge1xuICAvLyBpc3RhbmJ1bCBpZ25vcmUgaWZcbiAgaWYgKHN0eWxlLnBhcmVudE5vZGUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdHlsZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHN0eWxlKTtcbn1cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICAqL1xuXG5cbnZhciByZXBsYWNlVGV4dCA9IGZ1bmN0aW9uIHJlcGxhY2VUZXh0KCkge1xuICB2YXIgdGV4dFN0b3JlID0gW107XG4gIHJldHVybiBmdW5jdGlvbiByZXBsYWNlKGluZGV4LCByZXBsYWNlbWVudCkge1xuICAgIHRleHRTdG9yZVtpbmRleF0gPSByZXBsYWNlbWVudDtcbiAgICByZXR1cm4gdGV4dFN0b3JlLmZpbHRlcihCb29sZWFuKS5qb2luKCdcXG4nKTtcbiAgfTtcbn0oKTtcblxuZnVuY3Rpb24gYXBwbHlUb1NpbmdsZXRvblRhZyhzdHlsZSwgaW5kZXgsIHJlbW92ZSwgb2JqKSB7XG4gIHZhciBjc3MgPSByZW1vdmUgPyAnJyA6IG9iai5tZWRpYSA/IFwiQG1lZGlhIFwiLmNvbmNhdChvYmoubWVkaWEsIFwiIHtcIikuY29uY2F0KG9iai5jc3MsIFwifVwiKSA6IG9iai5jc3M7IC8vIEZvciBvbGQgSUVcblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgICovXG5cbiAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICBzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSByZXBsYWNlVGV4dChpbmRleCwgY3NzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgY3NzTm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNzcyk7XG4gICAgdmFyIGNoaWxkTm9kZXMgPSBzdHlsZS5jaGlsZE5vZGVzO1xuXG4gICAgaWYgKGNoaWxkTm9kZXNbaW5kZXhdKSB7XG4gICAgICBzdHlsZS5yZW1vdmVDaGlsZChjaGlsZE5vZGVzW2luZGV4XSk7XG4gICAgfVxuXG4gICAgaWYgKGNoaWxkTm9kZXMubGVuZ3RoKSB7XG4gICAgICBzdHlsZS5pbnNlcnRCZWZvcmUoY3NzTm9kZSwgY2hpbGROb2Rlc1tpbmRleF0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZS5hcHBlbmRDaGlsZChjc3NOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYXBwbHlUb1RhZyhzdHlsZSwgb3B0aW9ucywgb2JqKSB7XG4gIHZhciBjc3MgPSBvYmouY3NzO1xuICB2YXIgbWVkaWEgPSBvYmoubWVkaWE7XG4gIHZhciBzb3VyY2VNYXAgPSBvYmouc291cmNlTWFwO1xuXG4gIGlmIChtZWRpYSkge1xuICAgIHN0eWxlLnNldEF0dHJpYnV0ZSgnbWVkaWEnLCBtZWRpYSk7XG4gIH0gZWxzZSB7XG4gICAgc3R5bGUucmVtb3ZlQXR0cmlidXRlKCdtZWRpYScpO1xuICB9XG5cbiAgaWYgKHNvdXJjZU1hcCAmJiB0eXBlb2YgYnRvYSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjc3MgKz0gXCJcXG4vKiMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LFwiLmNvbmNhdChidG9hKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShzb3VyY2VNYXApKSkpLCBcIiAqL1wiKTtcbiAgfSAvLyBGb3Igb2xkIElFXG5cbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICAqL1xuXG5cbiAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICBzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSBjc3M7XG4gIH0gZWxzZSB7XG4gICAgd2hpbGUgKHN0eWxlLmZpcnN0Q2hpbGQpIHtcbiAgICAgIHN0eWxlLnJlbW92ZUNoaWxkKHN0eWxlLmZpcnN0Q2hpbGQpO1xuICAgIH1cblxuICAgIHN0eWxlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNzcykpO1xuICB9XG59XG5cbnZhciBzaW5nbGV0b24gPSBudWxsO1xudmFyIHNpbmdsZXRvbkNvdW50ZXIgPSAwO1xuXG5mdW5jdGlvbiBhZGRTdHlsZShvYmosIG9wdGlvbnMpIHtcbiAgdmFyIHN0eWxlO1xuICB2YXIgdXBkYXRlO1xuICB2YXIgcmVtb3ZlO1xuXG4gIGlmIChvcHRpb25zLnNpbmdsZXRvbikge1xuICAgIHZhciBzdHlsZUluZGV4ID0gc2luZ2xldG9uQ291bnRlcisrO1xuICAgIHN0eWxlID0gc2luZ2xldG9uIHx8IChzaW5nbGV0b24gPSBpbnNlcnRTdHlsZUVsZW1lbnQob3B0aW9ucykpO1xuICAgIHVwZGF0ZSA9IGFwcGx5VG9TaW5nbGV0b25UYWcuYmluZChudWxsLCBzdHlsZSwgc3R5bGVJbmRleCwgZmFsc2UpO1xuICAgIHJlbW92ZSA9IGFwcGx5VG9TaW5nbGV0b25UYWcuYmluZChudWxsLCBzdHlsZSwgc3R5bGVJbmRleCwgdHJ1ZSk7XG4gIH0gZWxzZSB7XG4gICAgc3R5bGUgPSBpbnNlcnRTdHlsZUVsZW1lbnQob3B0aW9ucyk7XG4gICAgdXBkYXRlID0gYXBwbHlUb1RhZy5iaW5kKG51bGwsIHN0eWxlLCBvcHRpb25zKTtcblxuICAgIHJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZSgpIHtcbiAgICAgIHJlbW92ZVN0eWxlRWxlbWVudChzdHlsZSk7XG4gICAgfTtcbiAgfVxuXG4gIHVwZGF0ZShvYmopO1xuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlU3R5bGUobmV3T2JqKSB7XG4gICAgaWYgKG5ld09iaikge1xuICAgICAgaWYgKG5ld09iai5jc3MgPT09IG9iai5jc3MgJiYgbmV3T2JqLm1lZGlhID09PSBvYmoubWVkaWEgJiYgbmV3T2JqLnNvdXJjZU1hcCA9PT0gb2JqLnNvdXJjZU1hcCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHVwZGF0ZShvYmogPSBuZXdPYmopO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmUoKTtcbiAgICB9XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGxpc3QsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307IC8vIEZvcmNlIHNpbmdsZS10YWcgc29sdXRpb24gb24gSUU2LTksIHdoaWNoIGhhcyBhIGhhcmQgbGltaXQgb24gdGhlICMgb2YgPHN0eWxlPlxuICAvLyB0YWdzIGl0IHdpbGwgYWxsb3cgb24gYSBwYWdlXG5cbiAgaWYgKCFvcHRpb25zLnNpbmdsZXRvbiAmJiB0eXBlb2Ygb3B0aW9ucy5zaW5nbGV0b24gIT09ICdib29sZWFuJykge1xuICAgIG9wdGlvbnMuc2luZ2xldG9uID0gaXNPbGRJRSgpO1xuICB9XG5cbiAgbGlzdCA9IGxpc3QgfHwgW107XG4gIHZhciBsYXN0SWRlbnRpZmllcnMgPSBtb2R1bGVzVG9Eb20obGlzdCwgb3B0aW9ucyk7XG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUobmV3TGlzdCkge1xuICAgIG5ld0xpc3QgPSBuZXdMaXN0IHx8IFtdO1xuXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChuZXdMaXN0KSAhPT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFzdElkZW50aWZpZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaWRlbnRpZmllciA9IGxhc3RJZGVudGlmaWVyc1tpXTtcbiAgICAgIHZhciBpbmRleCA9IGdldEluZGV4QnlJZGVudGlmaWVyKGlkZW50aWZpZXIpO1xuICAgICAgc3R5bGVzSW5Eb21baW5kZXhdLnJlZmVyZW5jZXMtLTtcbiAgICB9XG5cbiAgICB2YXIgbmV3TGFzdElkZW50aWZpZXJzID0gbW9kdWxlc1RvRG9tKG5ld0xpc3QsIG9wdGlvbnMpO1xuXG4gICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGxhc3RJZGVudGlmaWVycy5sZW5ndGg7IF9pKyspIHtcbiAgICAgIHZhciBfaWRlbnRpZmllciA9IGxhc3RJZGVudGlmaWVyc1tfaV07XG5cbiAgICAgIHZhciBfaW5kZXggPSBnZXRJbmRleEJ5SWRlbnRpZmllcihfaWRlbnRpZmllcik7XG5cbiAgICAgIGlmIChzdHlsZXNJbkRvbVtfaW5kZXhdLnJlZmVyZW5jZXMgPT09IDApIHtcbiAgICAgICAgc3R5bGVzSW5Eb21bX2luZGV4XS51cGRhdGVyKCk7XG5cbiAgICAgICAgc3R5bGVzSW5Eb20uc3BsaWNlKF9pbmRleCwgMSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGFzdElkZW50aWZpZXJzID0gbmV3TGFzdElkZW50aWZpZXJzO1xuICB9O1xufTsiLCJleHBvcnQgY2xhc3MgQm94TWFuYWdlciB7XHJcblxyXG4gIHByaXZhdGUgYm94ZXNfOiBIVE1MRWxlbWVudFtdID0gW107XHJcbiAgZ2V0IGJveGVzKCk6IHJlYWRvbmx5IEhUTUxFbGVtZW50W10geyByZXR1cm4gdGhpcy5ib3hlc187IH1cclxuXHJcbiAgYWRkKGRvbTogSFRNTEVsZW1lbnQpIHtcclxuICAgIGlmICh0aGlzLmJveGVzXy5pbmRleE9mKGRvbSkgIT0gLTEpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5ib3hlc18ucHVzaChkb20pO1xyXG4gIH1cclxuXHJcbiAgcmVtb3ZlKGRvbTogSFRNTEVsZW1lbnQpIHtcclxuICAgIGNvbnN0IGlkeCA9IHRoaXMuYm94ZXNfLmluZGV4T2YoZG9tKTtcclxuICAgIGlmIChpZHggPT0gLTEpIHJldHVybjtcclxuICAgIHRoaXMuYm94ZXNfLnNwbGljZShpZHgsIDEpO1xyXG4gIH1cclxuXHJcbiAgaGFzKGRvbTogSFRNTEVsZW1lbnQpIHtcclxuICAgIHJldHVybiB0aGlzLmJveGVzXy5pbmRleE9mKGRvbSkgIT0gLTE7XHJcbiAgfVxyXG5cclxuICB2YWxpZGF0ZSgpIHtcclxuICAgIHRoaXMuYm94ZXNfID0gdGhpcy5ib3hlc18uZmlsdGVyKGIgPT4gZG9jdW1lbnQuYm9keS5jb250YWlucyhiKSk7XHJcbiAgfVxyXG5cclxufSIsImltcG9ydCB7IE1lYXN1cmUgfSBmcm9tICdjb250ZW50L21lYXN1cmUnO1xyXG5pbXBvcnQgeyBTY3JlZW4gfSBmcm9tICdjb250ZW50L3NjcmVlbic7XHJcblxyXG5jb25zdCBzY3JlZW4gPSBuZXcgU2NyZWVuKG5ldyBNZWFzdXJlKCkpO1xyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXByZXNzJywgZSA9PiB7XHJcbiAgaWYgKGUua2V5ID09PSAnbScpIHtcclxuICAgIHNjcmVlbi50b2dnbGUoKTtcclxuICB9XHJcbn0sIHtcclxuICBjYXB0dXJlOiB0cnVlXHJcbn0pXHJcblxyXG5mdW5jdGlvbiB1cGRhdGUoKSB7XHJcbiAgc2NyZWVuLnVwZGF0ZSgpO1xyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSh1cGRhdGUpO1xyXG59XHJcbnJlcXVlc3RBbmltYXRpb25GcmFtZSh1cGRhdGUpOyIsImltcG9ydCB7IGdldE92ZXJsYXBwaW5nRGltLCBnZXRSZWN0RGltLCBpc1BvaW50SW5SZWN0LCBpc1JlY3RJblJlY3QsIFJlY3QsIFVOSVFVRV9JRCB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElNZWFzdXJlIHtcclxuICBnZXRTbWFsbGVzdERPTUF0KHg6IG51bWJlciwgeTogbnVtYmVyKTogSFRNTEVsZW1lbnQ7XHJcbiAgZ2V0QmVzdE1hdGNoZWRET01JbnNpZGUocmVjdDogUmVjdCk6IEhUTUxFbGVtZW50O1xyXG4gIGdldEJvdW5kaW5nQ2xpZW50UmVjdChkb206IEhUTUxFbGVtZW50KTogRE9NUmVjdDtcclxuICBnZXRCZXN0TWF0Y2hlZFBhcmVudERPTShkb206IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNZWFzdXJlIGltcGxlbWVudHMgSU1lYXN1cmUge1xyXG5cclxuICBwcml2YXRlICppdGVyYXRlRE9NcygpOiBHZW5lcmF0b3I8SFRNTEVsZW1lbnQ+IHtcclxuICAgIGNvbnN0IGFsbCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiKlwiKTtcclxuICAgIGZvciAoY29uc3QgZWwgb2YgYWxsKSB7XHJcbiAgICAgIGlmIChlbC5jbGFzc0xpc3QuY29udGFpbnMoVU5JUVVFX0lEKSkgY29udGludWU7XHJcbiAgICAgIHlpZWxkIGVsIGFzIEhUTUxFbGVtZW50O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZ2V0U21hbGxlc3RET01BdCh4OiBudW1iZXIsIHk6IG51bWJlcik6IEhUTUxFbGVtZW50IHtcclxuICAgIGxldCBiZXN0OiBFbGVtZW50O1xyXG4gICAgbGV0IGJlc3REaW06IG51bWJlciA9IEluZmluaXR5O1xyXG4gICAgY29uc3QgZG9tcyA9IHRoaXMuaXRlcmF0ZURPTXMoKTtcclxuICAgIGZvciAoY29uc3QgZWwgb2YgZG9tcykge1xyXG4gICAgICBjb25zdCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgIGlmIChpc1BvaW50SW5SZWN0KHgsIHksIHJlY3QpKSB7XHJcbiAgICAgICAgY29uc3QgZGltID0gZ2V0UmVjdERpbShyZWN0KTtcclxuICAgICAgICBpZiAoYmVzdERpbSA+IGRpbSkge1xyXG4gICAgICAgICAgYmVzdCA9IGVsO1xyXG4gICAgICAgICAgYmVzdERpbSA9IGRpbTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBiZXN0IGFzIEhUTUxFbGVtZW50O1xyXG4gIH1cclxuXHJcbiAgZ2V0QmVzdE1hdGNoZWRET01JbnNpZGUocmVjdDogUmVjdCk6IEhUTUxFbGVtZW50IHtcclxuICAgIGxldCBiZXN0OiBFbGVtZW50O1xyXG4gICAgbGV0IGJlc3REaW06IG51bWJlciA9IDA7XHJcbiAgICBjb25zdCBkb21zID0gdGhpcy5pdGVyYXRlRE9NcygpO1xyXG4gICAgZm9yIChjb25zdCBlbCBvZiBkb21zKSB7XHJcbiAgICAgIGNvbnN0IGVsUmVjdCA9IHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGVsKTtcclxuICAgICAgaWYgKCFpc1JlY3RJblJlY3QocmVjdCwgZWxSZWN0KSkgY29udGludWU7XHJcbiAgICAgIGNvbnN0IGRpbSA9IGdldFJlY3REaW0oZWxSZWN0KTtcclxuICAgICAgaWYgKGJlc3REaW0gPD0gZGltKSB7XHJcbiAgICAgICAgYmVzdCA9IGVsO1xyXG4gICAgICAgIGJlc3REaW0gPSBkaW07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBiZXN0IGFzIEhUTUxFbGVtZW50O1xyXG4gIH1cclxuXHJcbiAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGRvbTogSFRNTEVsZW1lbnQpOiBET01SZWN0IHtcclxuICAgIHJldHVybiBkb20uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgfVxyXG5cclxuICBnZXRCZXN0TWF0Y2hlZFBhcmVudERPTShkb206IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdNZXRob2Qgbm90IGltcGxlbWVudGVkLicpO1xyXG4gIH1cclxuXHJcbn0iLCJpbXBvcnQgJy4vc2NyZWVuLnNjc3MnO1xyXG5pbXBvcnQgeyBFbWl0dGVyIH0gZnJvbSAnQG9yYW5nZTRnbGFjZS92cy1saWIvYmFzZS9jb21tb24vZXZlbnQnO1xyXG5pbXBvcnQgeyBCb3hNYW5hZ2VyIH0gZnJvbSAnY29udGVudC9ib3hNYW5hZ2VyJztcclxuaW1wb3J0IHsgU2NyZWVuTWVhc3VyZVRvb2wgfSBmcm9tICdjb250ZW50L3Rvb2wvbWVhc3VyZSc7XHJcbmltcG9ydCB7IFNjcmVlblNlbGVjdFRvb2wgfSBmcm9tICdjb250ZW50L3Rvb2wvc2VsZWN0JztcclxuaW1wb3J0IHsgSVNjcmVlblRvb2wgfSBmcm9tICdjb250ZW50L3Rvb2wvdG9vbCc7XHJcbmltcG9ydCB7IGFwcGx5RE9NUmVjdCwgVU5JUVVFX0lEIH0gZnJvbSAnY29udGVudC91dGlsJztcclxuaW1wb3J0IHsgSU1lYXN1cmUgfSBmcm9tICcuL21lYXN1cmUnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNjcmVlbiB7XHJcblxyXG4gIHByaXZhdGUgb25Nb3VzZW1vdmVfID0gbmV3IEVtaXR0ZXI8dm9pZD4oKTtcclxuICByZWFkb25seSBvbk1vdXNlbW92ZSA9IHRoaXMub25Nb3VzZW1vdmVfLmV2ZW50O1xyXG5cclxuICBwcml2YXRlIGRvbV86IEhUTUxFbGVtZW50O1xyXG4gIGdldCBkb20oKSB7IHJldHVybiB0aGlzLmRvbV87IH1cclxuXHJcbiAgcHJpdmF0ZSBwYWdlWF86IG51bWJlciA9IDA7XHJcbiAgZ2V0IHBhZ2VYKCkgeyByZXR1cm4gdGhpcy5wYWdlWF87IH1cclxuICBwcml2YXRlIHBhZ2VZXzogbnVtYmVyID0gMDtcclxuICBnZXQgcGFnZVkoKSB7IHJldHVybiB0aGlzLnBhZ2VZXzsgfVxyXG5cclxuICBwcml2YXRlIHNjcmVlblhfOiBudW1iZXIgPSAwO1xyXG4gIGdldCBzY3JlZW5YKCkgeyByZXR1cm4gdGhpcy5zY3JlZW5YXzsgfVxyXG4gIHByaXZhdGUgc2NyZWVuWV86IG51bWJlciA9IDA7XHJcbiAgZ2V0IHNjcmVlblkoKSB7IHJldHVybiB0aGlzLnNjcmVlbllfOyB9XHJcblxyXG4gIHByaXZhdGUgY2xpZW50WF86IG51bWJlciA9IDA7XHJcbiAgZ2V0IGNsaWVudFgoKSB7IHJldHVybiB0aGlzLmNsaWVudFhfOyB9XHJcbiAgcHJpdmF0ZSBjbGllbnRZXzogbnVtYmVyID0gMDtcclxuICBnZXQgY2xpZW50WSgpIHsgcmV0dXJuIHRoaXMuY2xpZW50WV87IH1cclxuXHJcbiAgcHJpdmF0ZSBjdXJyZW50VG9vbF86IElTY3JlZW5Ub29sO1xyXG4gIGdldCBjdXJyZW50VG9vbCgpIHsgcmV0dXJuIHRoaXMuY3VycmVudFRvb2xfOyB9XHJcblxyXG4gIHByaXZhdGUgd2lkdGhfOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBoZWlnaHRfOiBudW1iZXI7XHJcbiAgZ2V0IHdpZHRoKCkgeyByZXR1cm4gdGhpcy53aWR0aF87IH1cclxuICBnZXQgaGVpZ2h0KCkgeyByZXR1cm4gdGhpcy5oZWlnaHRfOyB9XHJcblxyXG4gIHJlYWRvbmx5IGJveGVzOiBCb3hNYW5hZ2VyO1xyXG5cclxuICBwcml2YXRlIGJveE92ZXJsYXlzXzogW0hUTUxFbGVtZW50LCBIVE1MRWxlbWVudF1bXSA9IFtdO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHJlYWRvbmx5IG1lYXN1cmU6IElNZWFzdXJlXHJcbiAgKSB7XHJcbiAgICB0aGlzLmJveGVzID0gbmV3IEJveE1hbmFnZXIoKTtcclxuICAgIFxyXG4gICAgdGhpcy5kb21fID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmRvbV8uY2xhc3NOYW1lID0gYCR7VU5JUVVFX0lEfWBcclxuICAgIHRoaXMuZG9tXy5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYFxyXG4gICAgICBwb3NpdGlvbjogZml4ZWQ7XHJcbiAgICAgIHotaW5kZXg6IDk5OTk5OTk5O1xyXG4gICAgICB0b3A6IDA7XHJcbiAgICAgIGxlZnQ6IDA7XHJcbiAgICAgIGJvdHRvbTogMDtcclxuICAgICAgcmlnaHQ6IDA7XHJcbiAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xyXG4gICAgYCk7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZCh0aGlzLmRvbV8pO1xyXG5cclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBlID0+IHtcclxuICAgICAgdGhpcy5wYWdlWF8gPSBlLnBhZ2VYO1xyXG4gICAgICB0aGlzLnBhZ2VZXyA9IGUucGFnZVk7XHJcbiAgICAgIHRoaXMuc2NyZWVuWF8gPSBlLnNjcmVlblg7XHJcbiAgICAgIHRoaXMuc2NyZWVuWV8gPSBlLnNjcmVlblk7XHJcbiAgICAgIHRoaXMuY2xpZW50WF8gPSBlLmNsaWVudFg7XHJcbiAgICAgIHRoaXMuY2xpZW50WV8gPSBlLmNsaWVudFk7XHJcbiAgICAgIHRoaXMub25Nb3VzZW1vdmVfLmZpcmUoKTtcclxuICAgIH0sIHtcclxuICAgICAgY2FwdHVyZTogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4gdGhpcy5yZXNpemUoKSk7XHJcbiAgICB0aGlzLnJlc2l6ZSgpO1xyXG5cclxuICAgIGNvbnN0IG1lYXN1cmVUb29sID0gbmV3IFNjcmVlbk1lYXN1cmVUb29sKHRoaXMpO1xyXG4gICAgY29uc3Qgc2VsZWN0VG9vbCA9IG5ldyBTY3JlZW5TZWxlY3RUb29sKHRoaXMpO1xyXG4gICAgbWVhc3VyZVRvb2wub25BY3RpdmF0ZSgpO1xyXG4gICAgc2VsZWN0VG9vbC5vbkFjdGl2YXRlKCk7XHJcbiAgICAvLyB0aGlzLnNldFRvb2woc2VsZWN0VG9vbCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlc2l6ZSgpIHtcclxuICAgIHRoaXMud2lkdGhfID0gdGhpcy5kb21fLm9mZnNldFdpZHRoO1xyXG4gICAgdGhpcy5oZWlnaHRfID0gdGhpcy5kb20ub2Zmc2V0SGVpZ2h0O1xyXG4gIH1cclxuXHJcbiAgc2V0VG9vbCh0b29sOiBJU2NyZWVuVG9vbCkge1xyXG4gICAgLy8gaWYgKHRoaXMuY3VycmVudFRvb2xfKSB7XHJcbiAgICAvLyAgIHRoaXMuY3VycmVudFRvb2xfLm9uRGVhY3RpdmF0ZSgpOyBcclxuICAgIC8vIH1cclxuICAgIC8vIHRoaXMuY3VycmVudFRvb2xfID0gdG9vbDtcclxuICAgIC8vIGlmICh0aGlzLmN1cnJlbnRUb29sXykge1xyXG4gICAgLy8gICB0aGlzLmN1cnJlbnRUb29sXy5vbkFjdGl2YXRlKCk7XHJcbiAgICAvLyB9XHJcbiAgfVxyXG5cclxuICB1cGRhdGUoKSB7XHJcbiAgICB0aGlzLmJveGVzLnZhbGlkYXRlKCk7XHJcbiAgICBjb25zdCByZW1vdmVzID0gdGhpcy5ib3hPdmVybGF5c18uZmlsdGVyKG8gPT4gIXRoaXMuYm94ZXMuaGFzKG9bMF0pKTtcclxuICAgIGNvbnN0IG5ld092ZXJsYXlzID0gdGhpcy5ib3hPdmVybGF5c18uZmlsdGVyKG8gPT4gdGhpcy5ib3hlcy5oYXMob1swXSkpO1xyXG4gICAgcmVtb3Zlcy5mb3JFYWNoKHJtID0+IHJtWzFdLnJlbW92ZSgpKTtcclxuICAgIGNvbnN0IGFwcGVuZHMgPSB0aGlzLmJveGVzLmJveGVzLmZpbHRlcihiID0+ICEhIXRoaXMuYm94T3ZlcmxheXNfLmZpbmQobyA9PiBvWzBdID09PSBiKSk7XHJcbiAgICBmb3IgKGNvbnN0IGEgb2YgYXBwZW5kcykge1xyXG4gICAgICBjb25zdCBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgIG92ZXJsYXkuY2xhc3NOYW1lID0gYCR7VU5JUVVFX0lEfSBfX3NjX292ZXJsYXlgO1xyXG4gICAgICB0aGlzLmRvbV8uYXBwZW5kKG92ZXJsYXkpO1xyXG4gICAgICBuZXdPdmVybGF5cy5wdXNoKFthLCBvdmVybGF5XSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmJveE92ZXJsYXlzXyA9IG5ld092ZXJsYXlzO1xyXG4gICAgZm9yIChjb25zdCBvIG9mIHRoaXMuYm94T3ZlcmxheXNfKSB7XHJcbiAgICAgIGFwcGx5RE9NUmVjdChvWzFdLCB0aGlzLm1lYXN1cmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KG9bMF0pKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGVuYWJsZSgpIHtcclxuICAgIHRoaXMuZG9tLnN0eWxlLmRpc3BsYXkgPSAnaW5oZXJpdCc7XHJcbiAgfVxyXG4gIFxyXG4gIGRpc2FibGUoKSB7XHJcbiAgICB0aGlzLmRvbV8uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICB9XHJcblxyXG4gIHRvZ2dsZSgpIHtcclxuICAgIGlmICh0aGlzLmRvbS5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZScpIHRoaXMuZW5hYmxlKCk7XHJcbiAgICBlbHNlIHRoaXMuZGlzYWJsZSgpO1xyXG4gIH1cclxuXHJcbn0iLCJpbXBvcnQgJy4vbWVhc3VyZS5zY3NzJztcclxuaW1wb3J0IHsgRGlzcG9zYWJsZVN0b3JlIH0gZnJvbSAnQG9yYW5nZTRnbGFjZS92cy1saWIvYmFzZS9jb21tb24vbGlmZWN5Y2xlJztcclxuaW1wb3J0IHsgU2NyZWVuIH0gZnJvbSAnLi4vc2NyZWVuJztcclxuaW1wb3J0IHsgSVNjcmVlblRvb2wgfSBmcm9tICcuL3Rvb2wnO1xyXG5pbXBvcnQgeyBnZXRSZWN0RGltLCBpc1BvaW50SW5SZWN0LCByYXljYXN0LCBVTklRVUVfSUQgfSBmcm9tICdjb250ZW50L3V0aWwnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNjcmVlbk1lYXN1cmVUb29sIGltcGxlbWVudHMgSVNjcmVlblRvb2wge1xyXG4gIHN0YXRpYyByZWFkb25seSBOQU1FID0gJ1NjcmVlbk1lYXN1cmVUb29sJztcclxuXHJcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nID0gU2NyZWVuTWVhc3VyZVRvb2wuTkFNRTtcclxuXHJcbiAgcHJpdmF0ZSBkaXNwb3NhYmxlc186IERpc3Bvc2FibGVTdG9yZTtcclxuXHJcbiAgcHJpdmF0ZSBkb21fOiBIVE1MQ2FudmFzRWxlbWVudDtcclxuICBwcml2YXRlIGN0eF86IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuICBwcml2YXRlIGhvcml6b250YWxET01fOiBIVE1MRWxlbWVudDtcclxuICBwcml2YXRlIHZlcnRpY2FsRE9NXzogSFRNTEVsZW1lbnQ7XHJcblxyXG4gIHByaXZhdGUgaG9yaXpvbnRhbExhYmVsRE9NXzogSFRNTEVsZW1lbnQ7XHJcbiAgcHJpdmF0ZSB2ZXJ0aWNhbExhYmVsRE9NXzogSFRNTEVsZW1lbnQ7XHJcblxyXG4gIHByaXZhdGUgd2lkdGhMYWJlbERPTV86IEhUTUxFbGVtZW50O1xyXG4gIHByaXZhdGUgaGVpZ2h0TGFiZWxET01fOiBIVE1MRWxlbWVudDtcclxuXHJcbiAgcHJpdmF0ZSBpbnRlcnZhbF86IGFueTtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICByZWFkb25seSBzY3JlZW46IFNjcmVlblxyXG4gICkge1xyXG4gICAgdGhpcy5kcmF3ID0gdGhpcy5kcmF3LmJpbmQodGhpcyk7XHJcblxyXG4gICAgdGhpcy5kb21fID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICB0aGlzLmN0eF8gPSB0aGlzLmRvbV8uZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB0aGlzLnJlc2l6ZSgpKTtcclxuICAgIHRoaXMucmVzaXplKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlc2l6ZSgpIHtcclxuICAgIHRoaXMuZG9tXy53aWR0aCA9IHRoaXMuc2NyZWVuLmRvbS5vZmZzZXRXaWR0aDtcclxuICAgIHRoaXMuZG9tXy5oZWlnaHQgPSB0aGlzLnNjcmVlbi5kb20ub2Zmc2V0SGVpZ2h0O1xyXG4gIH1cclxuXHJcbiAgb25BY3RpdmF0ZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZGlzcG9zYWJsZXNfID0gbmV3IERpc3Bvc2FibGVTdG9yZSgpO1xyXG5cclxuICAgIHRoaXMuaG9yaXpvbnRhbERPTV8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHRoaXMudmVydGljYWxET01fID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmhvcml6b250YWxMYWJlbERPTV8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHRoaXMudmVydGljYWxMYWJlbERPTV8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHRoaXMud2lkdGhMYWJlbERPTV8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHRoaXMuaGVpZ2h0TGFiZWxET01fID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmRvbV8uY2xhc3NOYW1lID0gYCR7VU5JUVVFX0lEfSB0b29sLW1lYXN1cmVgO1xyXG4gICAgdGhpcy5ob3Jpem9udGFsRE9NXy5jbGFzc05hbWUgPSBgJHtVTklRVUVfSUR9IGhvcml6b250YWxgO1xyXG4gICAgdGhpcy52ZXJ0aWNhbERPTV8uY2xhc3NOYW1lID0gYCR7VU5JUVVFX0lEfSB2ZXJ0aWNhbGA7XHJcbiAgICB0aGlzLmhvcml6b250YWxMYWJlbERPTV8uY2xhc3NOYW1lID0gYCR7VU5JUVVFX0lEfSBsYWJlbCBsYWJlbC1ob3Jpem9udGFsYDtcclxuICAgIHRoaXMudmVydGljYWxMYWJlbERPTV8uY2xhc3NOYW1lID0gYCR7VU5JUVVFX0lEfSBsYWJlbCBsYWJlbC12ZXJ0aWNhbGA7XHJcbiAgICB0aGlzLndpZHRoTGFiZWxET01fLmNsYXNzTmFtZSA9IGAke1VOSVFVRV9JRH0gbGFiZWwgbGFiZWwtaG9yaXpvbnRhbGA7XHJcbiAgICB0aGlzLmhlaWdodExhYmVsRE9NXy5jbGFzc05hbWUgPSBgJHtVTklRVUVfSUR9IGxhYmVsIGxhYmVsLXZlcnRpY2FsYDtcclxuICAgIHRoaXMuZG9tXy5hcHBlbmQodGhpcy5ob3Jpem9udGFsRE9NXyk7XHJcbiAgICB0aGlzLmRvbV8uYXBwZW5kKHRoaXMudmVydGljYWxET01fKTtcclxuICAgIHRoaXMuZG9tXy5hcHBlbmQodGhpcy5ob3Jpem9udGFsTGFiZWxET01fKTtcclxuICAgIHRoaXMuZG9tXy5hcHBlbmQodGhpcy52ZXJ0aWNhbExhYmVsRE9NXyk7XHJcbiAgICB0aGlzLmRvbV8uYXBwZW5kKHRoaXMud2lkdGhMYWJlbERPTV8pO1xyXG4gICAgdGhpcy5kb21fLmFwcGVuZCh0aGlzLmhlaWdodExhYmVsRE9NXyk7XHJcbiAgICB0aGlzLnNjcmVlbi5kb20uYXBwZW5kKHRoaXMuZG9tXyk7XHJcblxyXG4gICAgdGhpcy5kaXNwb3NhYmxlc18uYWRkKHRoaXMuc2NyZWVuLm9uTW91c2Vtb3ZlKCgpID0+IHRoaXMuZHJhdygpKSk7XHJcbiAgICB0aGlzLmludGVydmFsXyA9IHNldEludGVydmFsKHRoaXMuZHJhdywgMzMpO1xyXG4gIH1cclxuXHJcbiAgb25EZWFjdGl2YXRlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5kb21fLnJlbW92ZSgpO1xyXG4gICAgdGhpcy5kaXNwb3NhYmxlc18uZGlzcG9zZSgpO1xyXG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsXyk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGRyYXcoKSB7XHJcbiAgICBjb25zdCB4ID0gdGhpcy5zY3JlZW4uY2xpZW50WDtcclxuICAgIGNvbnN0IHkgPSB0aGlzLnNjcmVlbi5jbGllbnRZO1xyXG5cclxuICAgIGNvbnN0IGNhc3QgPSByYXljYXN0KHgsIHksIHRoaXMuc2NyZWVuLmJveGVzLmJveGVzLm1hcChiID0+IHRoaXMuc2NyZWVuLm1lYXN1cmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGIpKSk7XHJcblxyXG4gICAgY29uc3QgbGVmdCA9IE1hdGgubWF4KDAsIGNhc3QubGVmdCk7XHJcbiAgICBjb25zdCByaWdodCA9IE1hdGgubWluKHRoaXMuc2NyZWVuLndpZHRoLCBjYXN0LnJpZ2h0KTtcclxuICAgIGNvbnN0IHRvcCA9IE1hdGgubWF4KDAsIGNhc3QudG9wKTtcclxuICAgIGNvbnN0IGJvdHRvbSA9IE1hdGgubWluKHRoaXMuc2NyZWVuLmhlaWdodCwgY2FzdC5ib3R0b20pO1xyXG5cclxuICAgIHRoaXMuY3R4Xy5jbGVhclJlY3QoMCwgMCwgdGhpcy5zY3JlZW4ud2lkdGgsIHRoaXMuc2NyZWVuLmhlaWdodCk7XHJcblxyXG4gICAgdGhpcy5jdHhfLmxpbmVXaWR0aCA9IDE7XHJcbiAgICB0aGlzLmN0eF8uYmVnaW5QYXRoKCk7XHJcbiAgICB0aGlzLmN0eF8ubW92ZVRvKGxlZnQsIHkgKyAwLjUpO1xyXG4gICAgdGhpcy5jdHhfLmxpbmVUbyhyaWdodCwgeSArIDAuNSk7XHJcbiAgICB0aGlzLmN0eF8ubW92ZVRvKHggKyAwLjUsIHRvcCk7XHJcbiAgICB0aGlzLmN0eF8ubGluZVRvKHggKyAwLjUsIGJvdHRvbSk7XHJcbiAgICB0aGlzLmN0eF8uc3Ryb2tlKCk7XHJcblxyXG4gICAgdGhpcy5jdHhfLmZvbnQgPSAnMTFweCc7XHJcblxyXG4gICAge1xyXG4gICAgICBjb25zdCBob3Jpem9udGFsTGFiZWxEaW0gPSB0aGlzLmN0eF8ubWVhc3VyZVRleHQoYCR7cmlnaHQgLSBsZWZ0fWApO1xyXG4gICAgICBjb25zdCBobHkgPSB5ICsgNTtcclxuICAgICAgY29uc3QgaGx4ID0gTWF0aC5taW4odGhpcy5zY3JlZW4ud2lkdGggLSBob3Jpem9udGFsTGFiZWxEaW0ud2lkdGggLSA1LCByaWdodCArIDUpO1xyXG4gICAgICB0aGlzLmN0eF8uZmlsbFN0eWxlID0gJ2JsYWNrJztcclxuICAgICAgdGhpcy5jdHhfLmZpbGxSZWN0KGhseCAtIDIsIGhseSAtIDEyLCBob3Jpem9udGFsTGFiZWxEaW0ud2lkdGggKyA0LCAxMSArIDQpO1xyXG4gICAgICB0aGlzLmN0eF8uZmlsbFN0eWxlID0gJ3doaXRlJztcclxuICAgICAgdGhpcy5jdHhfLmZpbGxUZXh0KGAke3JpZ2h0IC0gbGVmdH1gLCBobHgsIGhseSk7XHJcbiAgICB9XHJcbiAgICB7IFxyXG4gICAgICBjb25zdCB2ZXJ0aWNhbExhYmVsRGltID0gdGhpcy5jdHhfLm1lYXN1cmVUZXh0KGAke2JvdHRvbSAtIHRvcH1gKTtcclxuICAgICAgY29uc3Qgdmx5ID0gTWF0aC5taW4odGhpcy5zY3JlZW4uaGVpZ2h0IC0gMTAsIGJvdHRvbSArIDE1KTtcclxuICAgICAgY29uc3Qgdmx4ID0geCAtIHZlcnRpY2FsTGFiZWxEaW0ud2lkdGggLyAyO1xyXG4gICAgICB0aGlzLmN0eF8uZmlsbFN0eWxlID0gJ2JsYWNrJztcclxuICAgICAgdGhpcy5jdHhfLmZpbGxSZWN0KHZseCAtIDIsIHZseSAtIDEyLCB2ZXJ0aWNhbExhYmVsRGltLndpZHRoICsgNCwgMTEgKyA0KTtcclxuICAgICAgdGhpcy5jdHhfLmZpbGxTdHlsZSA9ICd3aGl0ZSc7XHJcbiAgICAgIHRoaXMuY3R4Xy5maWxsVGV4dChgJHtib3R0b20gLSB0b3B9YCwgdmx4LCB2bHkpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNhbmRpZGF0ZXMgPSB0aGlzLnNjcmVlbi5ib3hlcy5ib3hlcy5maWx0ZXIoYm94ID0+IHtcclxuICAgICAgY29uc3QgcmVjdCA9IHRoaXMuc2NyZWVuLm1lYXN1cmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGJveCk7XHJcbiAgICAgIHJldHVybiBpc1BvaW50SW5SZWN0KHgsIHksIHJlY3QpO1xyXG4gICAgfSlcclxuICAgIGNhbmRpZGF0ZXMuc29ydCgoYSwgYikgPT4gZ2V0UmVjdERpbSh0aGlzLnNjcmVlbi5tZWFzdXJlLmdldEJvdW5kaW5nQ2xpZW50UmVjdChhKSkgLSBnZXRSZWN0RGltKHRoaXMuc2NyZWVuLm1lYXN1cmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGIpKSk7XHJcbiAgICBjb25zdCBob3ZlcmluZyA9IGNhbmRpZGF0ZXNbMF07XHJcbiAgICBpZiAoaG92ZXJpbmcpIHtcclxuICAgICAgY29uc3QgaG92ZXJpbmdSZWN0ID0gdGhpcy5zY3JlZW4ubWVhc3VyZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoaG92ZXJpbmcpO1xyXG4gICAgICBcclxuICAgICAgY29uc3QgaG9yaXpvbnRhbExhYmVsRGltID0gdGhpcy5jdHhfLm1lYXN1cmVUZXh0KGAke2hvdmVyaW5nUmVjdC5yaWdodCAtIGhvdmVyaW5nUmVjdC5sZWZ0fWApO1xyXG4gICAgICBjb25zdCBobHkgPSBob3ZlcmluZ1JlY3QudG9wIC0gNjtcclxuICAgICAgY29uc3QgaGx4ID0gaG92ZXJpbmdSZWN0LmxlZnQgKyBob3ZlcmluZ1JlY3Qud2lkdGggLyAyIC0gaG9yaXpvbnRhbExhYmVsRGltLndpZHRoIC8gMjtcclxuICAgICAgdGhpcy5jdHhfLmZpbGxTdHlsZSA9ICcjNDc0NzQ3JztcclxuICAgICAgdGhpcy5jdHhfLmZpbGxSZWN0KGhseCAtIDIsIGhseSAtIDEyLCBob3Jpem9udGFsTGFiZWxEaW0ud2lkdGggKyA0LCAxMSArIDQpO1xyXG4gICAgICB0aGlzLmN0eF8uZmlsbFN0eWxlID0gJ3doaXRlJztcclxuICAgICAgdGhpcy5jdHhfLmZpbGxUZXh0KGAke2hvdmVyaW5nUmVjdC5yaWdodCAtIGhvdmVyaW5nUmVjdC5sZWZ0fWAsIGhseCwgaGx5KTtcclxuXHJcbiAgICAgIGNvbnN0IHZlcnRpY2FsTGFiZWxEaW0gPSB0aGlzLmN0eF8ubWVhc3VyZVRleHQoYCR7aG92ZXJpbmdSZWN0LmJvdHRvbSAtIGhvdmVyaW5nUmVjdC50b3B9YCk7XHJcbiAgICAgIGNvbnN0IHZseSA9IGhvdmVyaW5nUmVjdC50b3AgKyBob3ZlcmluZ1JlY3QuaGVpZ2h0IC8gMiArIDExIC8gMjtcclxuICAgICAgY29uc3Qgdmx4ID0gaG92ZXJpbmdSZWN0LnJpZ2h0ICsgNjtcclxuICAgICAgdGhpcy5jdHhfLmZpbGxTdHlsZSA9ICcjNDc0NzQ3JztcclxuICAgICAgdGhpcy5jdHhfLmZpbGxSZWN0KHZseCAtIDIsIHZseSAtIDEyLCB2ZXJ0aWNhbExhYmVsRGltLndpZHRoICsgNCwgMTEgKyA0KTtcclxuICAgICAgdGhpcy5jdHhfLmZpbGxTdHlsZSA9ICd3aGl0ZSc7XHJcbiAgICAgIHRoaXMuY3R4Xy5maWxsVGV4dChgJHtob3ZlcmluZ1JlY3QuYm90dG9tIC0gaG92ZXJpbmdSZWN0LnRvcH1gLCB2bHgsIHZseSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy53aWR0aExhYmVsRE9NXy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICB0aGlzLmhlaWdodExhYmVsRE9NXy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY2FuQmVTd2l0Y2hlZFRvKHRvb2w6IElTY3JlZW5Ub29sKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG59IiwiaW1wb3J0ICcuL3NlbGVjdC5zY3NzJztcclxuaW1wb3J0IHsgU2NyZWVuIH0gZnJvbSAnY29udGVudC9zY3JlZW4nO1xyXG5pbXBvcnQgeyBJU2NyZWVuVG9vbCB9IGZyb20gJ2NvbnRlbnQvdG9vbC90b29sJztcclxuaW1wb3J0IHsgYXBwbHlET01SZWN0LCBnZXRSZWN0RGltLCBpc1BvaW50SW5SZWN0LCBpc1JlY3RJblJlY3QsIHRocm90dGxlLCBVTklRVUVfSUQgfSBmcm9tICdjb250ZW50L3V0aWwnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNjcmVlblNlbGVjdFRvb2wgaW1wbGVtZW50cyBJU2NyZWVuVG9vbCB7XHJcbiAgc3RhdGljIHJlYWRvbmx5IE5BTUUgPSAnU2NyZWVuU2VsZWN0VG9vbCc7XHJcblxyXG4gIG5hbWU6IHN0cmluZyA9IFNjcmVlblNlbGVjdFRvb2wuTkFNRTtcclxuXHJcbiAgcHJpdmF0ZSBkb21fOiBIVE1MRWxlbWVudDtcclxuICBwcml2YXRlIGhvdmVyaW5nRE9NXzogSFRNTEVsZW1lbnQ7XHJcbiAgcHJpdmF0ZSBob3ZlcmluZ1RhcmdldERPTV86IEhUTUxFbGVtZW50O1xyXG4gIHByaXZhdGUgc2VsZWN0aW5nRE9NXzogSFRNTEVsZW1lbnQ7XHJcblxyXG4gIHByaXZhdGUgbW91c2Vkb3duWF86IG51bWJlcjtcclxuICBwcml2YXRlIG1vdXNlZG93bllfOiBudW1iZXI7XHJcblxyXG4gIHByaXZhdGUgdG9wXzogbnVtYmVyO1xyXG4gIHByaXZhdGUgcmlnaHRfOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBib3R0b21fOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBsZWZ0XzogbnVtYmVyO1xyXG5cclxuICBwcml2YXRlIHBoYXNlXzogJ09WRVInIHwgJ1RIUkVTJyB8ICdSQU5HRSc7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcmVhZG9ubHkgc2NyZWVuOiBTY3JlZW5cclxuICApIHtcclxuICAgIHRoaXMuZG9tXyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGhpcy5kb21fLmNsYXNzTmFtZSA9IGAke1VOSVFVRV9JRH0gdG9vbC1zZWxlY3RgO1xyXG5cclxuICAgIHRoaXMuaGFuZGxlTW91c2Vkb3duID0gdGhpcy5oYW5kbGVNb3VzZWRvd24uYmluZCh0aGlzKTtcclxuICAgIHRoaXMuaGFuZGxlTW91c2Vtb3ZlID0gdGhpcy5oYW5kbGVNb3VzZW1vdmUuYmluZCh0aGlzKTtcclxuICAgIHRoaXMuaGFuZGxlTW91c2V1cCA9IHRoaXMuaGFuZGxlTW91c2V1cC5iaW5kKHRoaXMpO1xyXG4gICAgdGhpcy51cGRhdGVIb3ZlcmluZyA9IHRocm90dGxlKHRoaXMudXBkYXRlSG92ZXJpbmcuYmluZCh0aGlzKSwgMzMpO1xyXG4gIH1cclxuXHJcbiAgb25BY3RpdmF0ZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuaG92ZXJpbmdET01fPy5yZW1vdmUoKTtcclxuICAgIHRoaXMuc2VsZWN0aW5nRE9NXz8ucmVtb3ZlKCk7XHJcbiAgICB0aGlzLnNjcmVlbi5kb20uYXBwZW5kKHRoaXMuZG9tXyk7XHJcbiAgICB0aGlzLnBoYXNlXyA9ICdPVkVSJztcclxuXHJcbiAgICB0aGlzLmRvbV8uYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCBlID0+IGUucHJldmVudERlZmF1bHQoKSk7XHJcbiAgICB0aGlzLmRvbV8uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5oYW5kbGVNb3VzZWRvd24pO1xyXG4gICAgdGhpcy5kb21fLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuaGFuZGxlTW91c2Vtb3ZlKTtcclxuICAgIHRoaXMuZG9tXy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5oYW5kbGVNb3VzZXVwKTtcclxuICB9XHJcblxyXG4gIG9uRGVhY3RpdmF0ZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuaG92ZXJpbmdET01fPy5yZW1vdmUoKTtcclxuICAgIHRoaXMuc2VsZWN0aW5nRE9NXz8ucmVtb3ZlKCk7XHJcbiAgICB0aGlzLmRvbV8ucmVtb3ZlKCk7XHJcbiAgICBcclxuICAgIHRoaXMuZG9tXy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLmhhbmRsZU1vdXNlZG93bik7XHJcbiAgICB0aGlzLmRvbV8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5oYW5kbGVNb3VzZW1vdmUpO1xyXG4gICAgdGhpcy5kb21fLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLmhhbmRsZU1vdXNldXApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVNb3VzZWRvd24oZTogTW91c2VFdmVudCkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgY29uc3QgeCA9IHRoaXMuc2NyZWVuLmNsaWVudFg7XHJcbiAgICBjb25zdCB5ID0gdGhpcy5zY3JlZW4uY2xpZW50WTtcclxuICAgIHRoaXMubW91c2Vkb3duWF8gPSB4O1xyXG4gICAgdGhpcy5tb3VzZWRvd25ZXyA9IHk7XHJcblxyXG4gICAgaWYgKHRoaXMucGhhc2VfID09ICdPVkVSJykge1xyXG4gICAgICB0aGlzLnBoYXNlXyA9ICdUSFJFUyc7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZU1vdXNlbW92ZSgpIHtcclxuICAgIGNvbnN0IHggPSB0aGlzLnNjcmVlbi5jbGllbnRYO1xyXG4gICAgY29uc3QgeSA9IHRoaXMuc2NyZWVuLmNsaWVudFk7XHJcblxyXG4gICAgaWYgKHRoaXMucGhhc2VfID09PSAnT1ZFUicgfHwgdGhpcy5waGFzZV8gPT09ICdUSFJFUycpIHtcclxuICAgICAgaWYgKCF0aGlzLmhvdmVyaW5nRE9NXykge1xyXG4gICAgICAgIHRoaXMuaG92ZXJpbmdET01fID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgdGhpcy5ob3ZlcmluZ0RPTV8uY2xhc3NOYW1lID0gYCR7VU5JUVVFX0lEfSBob3ZlcmluZ2A7XHJcbiAgICAgICAgdGhpcy5kb21fLmFwcGVuZCh0aGlzLmhvdmVyaW5nRE9NXyk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy51cGRhdGVIb3ZlcmluZygpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodGhpcy5waGFzZV8gPT09ICdSQU5HRScpIHtcclxuICAgICAgdGhpcy5yaWdodF8gPSB4O1xyXG4gICAgICB0aGlzLmJvdHRvbV8gPSB5O1xyXG4gICAgICB0aGlzLnVwZGF0ZVNlbGVjdGluRE9NKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGlmICh0aGlzLnBoYXNlXyA9PT0gJ1RIUkVTJykge1xyXG4gICAgICBpZiAoTWF0aC5hYnModGhpcy5tb3VzZWRvd25YXyAtIHgpICsgTWF0aC5hYnModGhpcy5tb3VzZWRvd25ZXyAtIHkpID4gMykge1xyXG4gICAgICAgIHRoaXMuaG92ZXJpbmdET01fLnJlbW92ZSgpO1xyXG4gICAgICAgIHRoaXMuaG92ZXJpbmdET01fID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIHRoaXMuc2VsZWN0aW5nRE9NXyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHRoaXMuc2VsZWN0aW5nRE9NXy5jbGFzc05hbWUgPSBgJHtVTklRVUVfSUR9IHNlbGVjdGluZ2A7XHJcbiAgICAgICAgdGhpcy5kb21fLmFwcGVuZCh0aGlzLnNlbGVjdGluZ0RPTV8pO1xyXG4gICAgICAgIHRoaXMudG9wXyA9IHk7XHJcbiAgICAgICAgdGhpcy5yaWdodF8gPSB4O1xyXG4gICAgICAgIHRoaXMuYm90dG9tXyA9IHk7XHJcbiAgICAgICAgdGhpcy5sZWZ0XyA9IHg7XHJcbiAgICAgICAgdGhpcy51cGRhdGVTZWxlY3RpbkRPTSgpO1xyXG4gICAgICAgIHRoaXMucGhhc2VfID0gJ1JBTkdFJztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSB1cGRhdGVIb3ZlcmluZygpIHtcclxuICAgIGNvbnN0IHggPSB0aGlzLnNjcmVlbi5jbGllbnRYO1xyXG4gICAgY29uc3QgeSA9IHRoaXMuc2NyZWVuLmNsaWVudFk7XHJcbiAgICBpZiAodGhpcy5waGFzZV8gPT09ICdPVkVSJyB8fCB0aGlzLnBoYXNlXyA9PT0gJ1RIUkVTJykge1xyXG4gICAgICBjb25zdCBkb20gPSB0aGlzLnNjcmVlbi5tZWFzdXJlLmdldFNtYWxsZXN0RE9NQXQoeCwgeSk7XHJcbiAgICAgIHRoaXMuaG92ZXJpbmdUYXJnZXRET01fID0gZG9tO1xyXG4gICAgICBjb25zdCByZWN0ID0gdGhpcy5zY3JlZW4ubWVhc3VyZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoZG9tKTtcclxuICAgICAgYXBwbHlET01SZWN0KHRoaXMuaG92ZXJpbmdET01fLCByZWN0KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlTW91c2V1cChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICBjb25zdCB4ID0gdGhpcy5zY3JlZW4uY2xpZW50WDtcclxuICAgIGNvbnN0IHkgPSB0aGlzLnNjcmVlbi5jbGllbnRZO1xyXG4gICAgaWYgKHRoaXMucGhhc2VfID09PSAnUkFOR0UnKSB7XHJcbiAgICAgIGlmIChlLmJ1dHRvbiA9PSAwKSB7XHJcbiAgICAgICAgY29uc3QgYmVzdCA9IHRoaXMuc2NyZWVuLm1lYXN1cmUuZ2V0QmVzdE1hdGNoZWRET01JbnNpZGUodGhpcy5zZWxlY3RpbmdET01fLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpKTtcclxuICAgICAgICBpZiAoYmVzdCkge1xyXG4gICAgICAgICAgdGhpcy5zY3JlZW4uYm94ZXMuYWRkKGJlc3QpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBpZiAoZS5idXR0b24gPT0gMikge1xyXG4gICAgICAgIGNvbnN0IHJlbW92ZXMgPSB0aGlzLnNjcmVlbi5ib3hlcy5ib3hlcy5maWx0ZXIoYm94ID0+IGlzUmVjdEluUmVjdCh0aGlzLnNlbGVjdGluZ0RPTV8uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIHRoaXMuc2NyZWVuLm1lYXN1cmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGJveCkpKTtcclxuICAgICAgICBmb3IgKGNvbnN0IHJlbW92ZSBvZiByZW1vdmVzKSB7XHJcbiAgICAgICAgICB0aGlzLnNjcmVlbi5ib3hlcy5yZW1vdmUocmVtb3ZlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5zZWxlY3RpbmdET01fLnJlbW92ZSgpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGlmIChlLmJ1dHRvbiA9PSAwKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaG92ZXJpbmdUYXJnZXRET01fKSB7XHJcbiAgICAgICAgICB0aGlzLnNjcmVlbi5ib3hlcy5hZGQodGhpcy5ob3ZlcmluZ1RhcmdldERPTV8pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBpZiAoZS5idXR0b24gPT09IDIpIHtcclxuICAgICAgICBjb25zdCByZW1vdmVzID0gdGhpcy5zY3JlZW4uYm94ZXMuYm94ZXMuZmlsdGVyKGJveCA9PiB7XHJcbiAgICAgICAgICBjb25zdCByZWN0ID0gdGhpcy5zY3JlZW4ubWVhc3VyZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoYm94KTtcclxuICAgICAgICAgIHJldHVybiBpc1BvaW50SW5SZWN0KHgsIHksIHJlY3QpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmVtb3Zlcy5zb3J0KChhLCBiKSA9PiBnZXRSZWN0RGltKHRoaXMuc2NyZWVuLm1lYXN1cmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGEpKSAtIGdldFJlY3REaW0odGhpcy5zY3JlZW4ubWVhc3VyZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoYikpKTtcclxuICAgICAgICByZW1vdmVzWzBdICYmIHRoaXMuc2NyZWVuLmJveGVzLnJlbW92ZShyZW1vdmVzWzBdKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5waGFzZV8gPSAnT1ZFUic7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHVwZGF0ZVNlbGVjdGluRE9NKCkge1xyXG4gICAgY29uc3QgbCA9IE1hdGgubWluKHRoaXMubGVmdF8sIHRoaXMucmlnaHRfKTtcclxuICAgIGNvbnN0IHIgPSBNYXRoLm1heCh0aGlzLmxlZnRfLCB0aGlzLnJpZ2h0Xyk7XHJcbiAgICBjb25zdCB0ID0gTWF0aC5taW4odGhpcy50b3BfLCB0aGlzLmJvdHRvbV8pO1xyXG4gICAgY29uc3QgYiA9IE1hdGgubWF4KHRoaXMudG9wXywgdGhpcy5ib3R0b21fKTtcclxuICAgIHRoaXMuc2VsZWN0aW5nRE9NXy5zdHlsZS5sZWZ0ID0gYCR7bH1weGA7XHJcbiAgICB0aGlzLnNlbGVjdGluZ0RPTV8uc3R5bGUudG9wID0gYCR7dH1weGA7XHJcbiAgICB0aGlzLnNlbGVjdGluZ0RPTV8uc3R5bGUud2lkdGggPSBgJHtyIC0gbH1weGA7XHJcbiAgICB0aGlzLnNlbGVjdGluZ0RPTV8uc3R5bGUuaGVpZ2h0ID0gYCR7YiAtIHR9cHhgO1xyXG4gIH1cclxuXHJcbiAgY2FuQmVTd2l0Y2hlZFRvKHRvb2w6IElTY3JlZW5Ub29sKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG59IiwiZXhwb3J0IGNvbnN0IFVOSVFVRV9JRCA9ICdfX19fX19tZWFzdXJlJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0aHJvdHRsZSAoY2FsbGJhY2ssIGxpbWl0KSB7XHJcbiAgICB2YXIgd2FpdGluZyA9IGZhbHNlOyAgICAgICAgICAgICAgICAgICAgICAvLyBJbml0aWFsbHksIHdlJ3JlIG5vdCB3YWl0aW5nXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkgeyAgICAgICAgICAgICAgICAgICAgICAvLyBXZSByZXR1cm4gYSB0aHJvdHRsZWQgZnVuY3Rpb25cclxuICAgICAgICBpZiAoIXdhaXRpbmcpIHsgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHdlJ3JlIG5vdCB3YWl0aW5nXHJcbiAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7ICAvLyBFeGVjdXRlIHVzZXJzIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgIHdhaXRpbmcgPSB0cnVlOyAgICAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IGZ1dHVyZSBpbnZvY2F0aW9uc1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgICAgICAgICAgLy8gQWZ0ZXIgYSBwZXJpb2Qgb2YgdGltZVxyXG4gICAgICAgICAgICAgICAgd2FpdGluZyA9IGZhbHNlOyAgICAgICAgICAgICAgLy8gQW5kIGFsbG93IGZ1dHVyZSBpbnZvY2F0aW9uc1xyXG4gICAgICAgICAgICB9LCBsaW1pdCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFJlY3Qge1xyXG4gIHRvcDogbnVtYmVyO1xyXG4gIHJpZ2h0OiBudW1iZXI7XHJcbiAgYm90dG9tOiBudW1iZXI7XHJcbiAgbGVmdDogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlET01SZWN0KHNyYzogSFRNTEVsZW1lbnQsIHJlY3Q6IERPTVJlY3QpIHtcclxuICBzcmMuc3R5bGUubGVmdCA9IGAke3JlY3QubGVmdH1weGA7XHJcbiAgc3JjLnN0eWxlLnRvcCA9IGAke3JlY3QudG9wfXB4YDtcclxuICBzcmMuc3R5bGUud2lkdGggPSBgJHtyZWN0LndpZHRofXB4YDtcclxuICBzcmMuc3R5bGUuaGVpZ2h0ID0gYCR7cmVjdC5oZWlnaHR9cHhgO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNQb2ludEluUmVjdCh4OiBudW1iZXIsIHk6IG51bWJlciwgcmVjdDogUmVjdCk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiByZWN0LmxlZnQgPD0geCAmJiB4IDw9IHJlY3QucmlnaHQgJiYgcmVjdC50b3AgPD0geSAmJiB5IDw9IHJlY3QuYm90dG9tO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVjdERpbShyZWN0OiBSZWN0KTogbnVtYmVyIHtcclxuICByZXR1cm4gKHJlY3QucmlnaHQgLSByZWN0LmxlZnQpICogKHJlY3QuYm90dG9tIC0gcmVjdC50b3ApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3ZlcmxhcHBpbmdEaW0obGhzOiBSZWN0LCByaHM6IFJlY3QpOiBudW1iZXIge1xyXG4gIGNvbnN0IHcgPSBNYXRoLm1pbihsaHMucmlnaHQsIHJocy5yaWdodCkgLSBNYXRoLm1heChsaHMubGVmdCwgcmhzLmxlZnQpO1xyXG4gIGNvbnN0IGggPSBNYXRoLm1pbihsaHMuYm90dG9tIC0gcmhzLmJvdHRvbSkgLSBNYXRoLm1heChsaHMudG9wIC0gcmhzLnRvcCk7XHJcbiAgaWYgKHcgPj0gMCAmJiBoID49IDApIHJldHVybiB3ICogaDtcclxuICByZXR1cm4gMDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzUmVjdEluUmVjdChvdXRzaWRlOiBSZWN0LCBpbnNpZGU6IFJlY3QpOiBib29sZWFuIHtcclxuICByZXR1cm4gb3V0c2lkZS5sZWZ0IDw9IGluc2lkZS5sZWZ0ICYmIG91dHNpZGUucmlnaHQgPj0gaW5zaWRlLnJpZ2h0ICYmXHJcbiAgICAgICAgIG91dHNpZGUudG9wIDw9IGluc2lkZS50b3AgJiYgb3V0c2lkZS5ib3R0b20gPj0gaW5zaWRlLmJvdHRvbTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJheWNhc3QoeDogbnVtYmVyLCB5OiBudW1iZXIsIHJlY3RzOiByZWFkb25seSBSZWN0W10pIHtcclxuICBsZXQgbGVmdCA9IC1JbmZpbml0eTtcclxuICBsZXQgcmlnaHQgPSBJbmZpbml0eTtcclxuICBsZXQgdG9wID0gLUluZmluaXR5O1xyXG4gIGxldCBib3R0b20gPSBJbmZpbml0eTtcclxuXHJcbiAgZm9yIChjb25zdCByZWN0IG9mIHJlY3RzKSB7XHJcbiAgICBpZiAoeCA8PSByZWN0LmxlZnQgJiYgcmVjdC50b3AgPD0geSAmJiB5IDw9IHJlY3QuYm90dG9tKSB7XHJcbiAgICAgIHJpZ2h0ID0gTWF0aC5taW4ocmlnaHQsIHJlY3QubGVmdCk7XHJcbiAgICB9XHJcbiAgICBpZiAocmVjdC5yaWdodCA8PSB4ICYmIHJlY3QudG9wIDw9IHkgJiYgeSA8PSByZWN0LmJvdHRvbSkge1xyXG4gICAgICBsZWZ0ID0gTWF0aC5tYXgobGVmdCwgcmVjdC5yaWdodCk7XHJcbiAgICB9XHJcbiAgICBpZiAoeSA8PSByZWN0LnRvcCAmJiByZWN0LmxlZnQgPD0geCAmJiB4IDw9IHJlY3QucmlnaHQpIHtcclxuICAgICAgYm90dG9tID0gTWF0aC5taW4oYm90dG9tLCByZWN0LnRvcCk7XHJcbiAgICB9XHJcbiAgICBpZiAocmVjdC5ib3R0b20gPD0geSAmJiByZWN0LmxlZnQgPD0geCAmJiB4IDw9IHJlY3QucmlnaHQpIHtcclxuICAgICAgdG9wID0gTWF0aC5tYXgodG9wLCByZWN0LmJvdHRvbSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgbGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tXHJcbiAgfTtcclxufSIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdGlmKF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0pIHtcblx0XHRyZXR1cm4gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdGlkOiBtb2R1bGVJZCxcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbl9fd2VicGFja19yZXF1aXJlX18ubiA9IChtb2R1bGUpID0+IHtcblx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG5cdFx0KCkgPT4gKG1vZHVsZVsnZGVmYXVsdCddKSA6XG5cdFx0KCkgPT4gKG1vZHVsZSk7XG5cdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsIHsgYTogZ2V0dGVyIH0pO1xuXHRyZXR1cm4gZ2V0dGVyO1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGVcbl9fd2VicGFja19yZXF1aXJlX18oXCIuL2NvbnRlbnQvaW5kZXgudHNcIik7XG4vLyBUaGlzIGVudHJ5IG1vZHVsZSB1c2VkICdleHBvcnRzJyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG4iXSwic291cmNlUm9vdCI6IiJ9