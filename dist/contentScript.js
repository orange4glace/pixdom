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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9waXhkb20vLi9ub2RlX21vZHVsZXMvQG9yYW5nZTRnbGFjZS92cy1saWIvYmFzZS9jb21tb24vZXJyb3JzL2luZGV4LmpzIiwid2VicGFjazovL3BpeGRvbS8uL25vZGVfbW9kdWxlcy9Ab3JhbmdlNGdsYWNlL3ZzLWxpYi9iYXNlL2NvbW1vbi9ldmVudC9pbmRleC5qcyIsIndlYnBhY2s6Ly9waXhkb20vLi9ub2RlX21vZHVsZXMvQG9yYW5nZTRnbGFjZS92cy1saWIvYmFzZS9jb21tb24vZnVuY3Rpb25hbC9pbmRleC5qcyIsIndlYnBhY2s6Ly9waXhkb20vLi9ub2RlX21vZHVsZXMvQG9yYW5nZTRnbGFjZS92cy1saWIvYmFzZS9jb21tb24vaXRlcmF0b3IvaW5kZXguanMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vbm9kZV9tb2R1bGVzL0BvcmFuZ2U0Z2xhY2UvdnMtbGliL2Jhc2UvY29tbW9uL2xpZmVjeWNsZS9pbmRleC5qcyIsIndlYnBhY2s6Ly9waXhkb20vLi9ub2RlX21vZHVsZXMvQG9yYW5nZTRnbGFjZS92cy1saWIvYmFzZS9jb21tb24vbGlua2VkTGlzdC9pbmRleC5qcyIsIndlYnBhY2s6Ly9waXhkb20vLi9jb250ZW50L3NjcmVlbi5zY3NzIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvdG9vbC9tZWFzdXJlLnNjc3MiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vY29udGVudC90b29sL3NlbGVjdC5zY3NzIiwid2VicGFjazovL3BpeGRvbS8uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9hcGkuanMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2Nzc1dpdGhNYXBwaW5nVG9TdHJpbmcuanMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vY29udGVudC9zY3JlZW4uc2Nzcz9mOWFiIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvdG9vbC9tZWFzdXJlLnNjc3M/NTliYyIsIndlYnBhY2s6Ly9waXhkb20vLi9jb250ZW50L3Rvb2wvc2VsZWN0LnNjc3M/ODA3ZiIsIndlYnBhY2s6Ly9waXhkb20vLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbmplY3RTdHlsZXNJbnRvU3R5bGVUYWcuanMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vY29udGVudC9ib3hNYW5hZ2VyLnRzIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vY29udGVudC9tZWFzdXJlLnRzIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvc2NyZWVuLnRzIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvdG9vbC9tZWFzdXJlLnRzIiwid2VicGFjazovL3BpeGRvbS8uL2NvbnRlbnQvdG9vbC9zZWxlY3QudHMiLCJ3ZWJwYWNrOi8vcGl4ZG9tLy4vY29udGVudC91dGlsLnRzIiwid2VicGFjazovL3BpeGRvbS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9waXhkb20vd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vcGl4ZG9tL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9waXhkb20vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9waXhkb20vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9waXhkb20vd2VicGFjay9zdGFydHVwIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBYTs7QUFFYiw4Q0FBNkMsQ0FBQyxjQUFjLEVBQUM7O0FBRTdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9DQUFvQywyQ0FBMkM7QUFDL0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQ0FBb0MsMkNBQTJDO0FBQy9FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxvQkFBb0IsYUFBYSxLQUFLO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCLFVBQVUsNkNBQTZDLGNBQWMsOENBQThDLFNBQVM7QUFDeko7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0RBQXdELFVBQVU7QUFDbEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsRUFBRTtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CO0FBQ3BCLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDbkM7WUFDRCxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUN0RCxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ3JDO1lBQ0QsSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDekQsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUNsQztTQUNGOzs7Ozs7Ozs7SUFFRCxPQUFPO1FBQ0wsSUFBSSxRQUFFLEtBQUssU0FBRSxHQUFHLE9BQUUsTUFBTTtLQUN6QixDQUFDO0FBQ0osQ0FBQzs7Ozs7OztVQ3pFRDtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0NyQkE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLGdDQUFnQyxZQUFZO1dBQzVDO1dBQ0EsRTs7Ozs7V0NQQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHdDQUF3Qyx5Q0FBeUM7V0FDakY7V0FDQTtXQUNBLEU7Ozs7O1dDUEEsd0Y7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0Esc0RBQXNELGtCQUFrQjtXQUN4RTtXQUNBLCtDQUErQyxjQUFjO1dBQzdELEU7Ozs7VUNOQTtVQUNBO1VBQ0E7VUFDQSIsImZpbGUiOiJjb250ZW50U2NyaXB0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxyXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuLy8gQXZvaWQgY2lyY3VsYXIgZGVwZW5kZW5jeSBvbiBFdmVudEVtaXR0ZXIgYnkgaW1wbGVtZW50aW5nIGEgc3Vic2V0IG9mIHRoZSBpbnRlcmZhY2UuXHJcbmNsYXNzIEVycm9ySGFuZGxlciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmxpc3RlbmVycyA9IFtdO1xyXG4gICAgICAgIHRoaXMudW5leHBlY3RlZEVycm9ySGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGUuc3RhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZS5tZXNzYWdlICsgJ1xcblxcbicgKyBlLnN0YWNrKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgICAgIH0sIDApO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBhZGRMaXN0ZW5lcihsaXN0ZW5lcikge1xyXG4gICAgICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xyXG4gICAgICAgIHJldHVybiAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgZW1pdChlKSB7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcclxuICAgICAgICAgICAgbGlzdGVuZXIoZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBfcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpIHtcclxuICAgICAgICB0aGlzLmxpc3RlbmVycy5zcGxpY2UodGhpcy5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lciksIDEpO1xyXG4gICAgfVxyXG4gICAgc2V0VW5leHBlY3RlZEVycm9ySGFuZGxlcihuZXdVbmV4cGVjdGVkRXJyb3JIYW5kbGVyKSB7XHJcbiAgICAgICAgdGhpcy51bmV4cGVjdGVkRXJyb3JIYW5kbGVyID0gbmV3VW5leHBlY3RlZEVycm9ySGFuZGxlcjtcclxuICAgIH1cclxuICAgIGdldFVuZXhwZWN0ZWRFcnJvckhhbmRsZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudW5leHBlY3RlZEVycm9ySGFuZGxlcjtcclxuICAgIH1cclxuICAgIG9uVW5leHBlY3RlZEVycm9yKGUpIHtcclxuICAgICAgICB0aGlzLnVuZXhwZWN0ZWRFcnJvckhhbmRsZXIoZSk7XHJcbiAgICAgICAgdGhpcy5lbWl0KGUpO1xyXG4gICAgfVxyXG4gICAgLy8gRm9yIGV4dGVybmFsIGVycm9ycywgd2UgZG9uJ3Qgd2FudCB0aGUgbGlzdGVuZXJzIHRvIGJlIGNhbGxlZFxyXG4gICAgb25VbmV4cGVjdGVkRXh0ZXJuYWxFcnJvcihlKSB7XHJcbiAgICAgICAgdGhpcy51bmV4cGVjdGVkRXJyb3JIYW5kbGVyKGUpO1xyXG4gICAgfVxyXG59XHJcbmNvbnN0IGVycm9ySGFuZGxlciA9IG5ldyBFcnJvckhhbmRsZXIoKTtcclxuZnVuY3Rpb24gc2V0VW5leHBlY3RlZEVycm9ySGFuZGxlcihuZXdVbmV4cGVjdGVkRXJyb3JIYW5kbGVyKSB7XHJcbiAgICBlcnJvckhhbmRsZXIuc2V0VW5leHBlY3RlZEVycm9ySGFuZGxlcihuZXdVbmV4cGVjdGVkRXJyb3JIYW5kbGVyKTtcclxufVxyXG5mdW5jdGlvbiBvblVuZXhwZWN0ZWRFcnJvcihlKSB7XHJcbiAgICAvLyBpZ25vcmUgZXJyb3JzIGZyb20gY2FuY2VsbGVkIHByb21pc2VzXHJcbiAgICBpZiAoIWlzUHJvbWlzZUNhbmNlbGVkRXJyb3IoZSkpIHtcclxuICAgICAgICBlcnJvckhhbmRsZXIub25VbmV4cGVjdGVkRXJyb3IoZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcbmZ1bmN0aW9uIG9uVW5leHBlY3RlZEV4dGVybmFsRXJyb3IoZSkge1xyXG4gICAgLy8gaWdub3JlIGVycm9ycyBmcm9tIGNhbmNlbGxlZCBwcm9taXNlc1xyXG4gICAgaWYgKCFpc1Byb21pc2VDYW5jZWxlZEVycm9yKGUpKSB7XHJcbiAgICAgICAgZXJyb3JIYW5kbGVyLm9uVW5leHBlY3RlZEV4dGVybmFsRXJyb3IoZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcbmZ1bmN0aW9uIHRyYW5zZm9ybUVycm9yRm9yU2VyaWFsaXphdGlvbihlcnJvcikge1xyXG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcclxuICAgICAgICBsZXQgeyBuYW1lLCBtZXNzYWdlIH0gPSBlcnJvcjtcclxuICAgICAgICBjb25zdCBzdGFjayA9IGVycm9yLnN0YWNrdHJhY2UgfHwgZXJyb3Iuc3RhY2s7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgJGlzRXJyb3I6IHRydWUsXHJcbiAgICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICAgIG1lc3NhZ2UsXHJcbiAgICAgICAgICAgIHN0YWNrXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIC8vIHJldHVybiBhcyBpc1xyXG4gICAgcmV0dXJuIGVycm9yO1xyXG59XHJcbmNvbnN0IGNhbmNlbGVkTmFtZSA9ICdDYW5jZWxlZCc7XHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIGdpdmVuIGVycm9yIGlzIGEgcHJvbWlzZSBpbiBjYW5jZWxlZCBzdGF0ZVxyXG4gKi9cclxuZnVuY3Rpb24gaXNQcm9taXNlQ2FuY2VsZWRFcnJvcihlcnJvcikge1xyXG4gICAgcmV0dXJuIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiYgZXJyb3IubmFtZSA9PT0gY2FuY2VsZWROYW1lICYmIGVycm9yLm1lc3NhZ2UgPT09IGNhbmNlbGVkTmFtZTtcclxufVxyXG4vKipcclxuICogUmV0dXJucyBhbiBlcnJvciB0aGF0IHNpZ25hbHMgY2FuY2VsbGF0aW9uLlxyXG4gKi9cclxuZnVuY3Rpb24gY2FuY2VsZWQoKSB7XHJcbiAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihjYW5jZWxlZE5hbWUpO1xyXG4gICAgZXJyb3IubmFtZSA9IGVycm9yLm1lc3NhZ2U7XHJcbiAgICByZXR1cm4gZXJyb3I7XHJcbn1cclxuZnVuY3Rpb24gaWxsZWdhbEFyZ3VtZW50KG5hbWUpIHtcclxuICAgIGlmIChuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihgSWxsZWdhbCBhcmd1bWVudDogJHtuYW1lfWApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBFcnJvcignSWxsZWdhbCBhcmd1bWVudCcpO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIGlsbGVnYWxTdGF0ZShuYW1lKSB7XHJcbiAgICBpZiAobmFtZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoYElsbGVnYWwgc3RhdGU6ICR7bmFtZX1gKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoJ0lsbGVnYWwgc3RhdGUnKTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiByZWFkb25seShuYW1lKSB7XHJcbiAgICByZXR1cm4gbmFtZVxyXG4gICAgICAgID8gbmV3IEVycm9yKGByZWFkb25seSBwcm9wZXJ0eSAnJHtuYW1lfSBjYW5ub3QgYmUgY2hhbmdlZCdgKVxyXG4gICAgICAgIDogbmV3IEVycm9yKCdyZWFkb25seSBwcm9wZXJ0eSBjYW5ub3QgYmUgY2hhbmdlZCcpO1xyXG59XHJcbmZ1bmN0aW9uIGRpc3Bvc2VkKHdoYXQpIHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBFcnJvcihgJHt3aGF0fSBoYXMgYmVlbiBkaXNwb3NlZGApO1xyXG4gICAgcmVzdWx0Lm5hbWUgPSAnRElTUE9TRUQnO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5mdW5jdGlvbiBnZXRFcnJvck1lc3NhZ2UoZXJyKSB7XHJcbiAgICBpZiAoIWVycikge1xyXG4gICAgICAgIHJldHVybiAnRXJyb3InO1xyXG4gICAgfVxyXG4gICAgaWYgKGVyci5tZXNzYWdlKSB7XHJcbiAgICAgICAgcmV0dXJuIGVyci5tZXNzYWdlO1xyXG4gICAgfVxyXG4gICAgaWYgKGVyci5zdGFjaykge1xyXG4gICAgICAgIHJldHVybiBlcnIuc3RhY2suc3BsaXQoJ1xcbicpWzBdO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFN0cmluZyhlcnIpO1xyXG59XHJcbmNsYXNzIE5vdEltcGxlbWVudGVkRXJyb3IgZXh0ZW5kcyBFcnJvciB7XHJcbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlKSB7XHJcbiAgICAgICAgc3VwZXIoJ05vdEltcGxlbWVudGVkJyk7XHJcbiAgICAgICAgaWYgKG1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuY2xhc3MgTm90U3VwcG9ydGVkRXJyb3IgZXh0ZW5kcyBFcnJvciB7XHJcbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlKSB7XHJcbiAgICAgICAgc3VwZXIoJ05vdFN1cHBvcnRlZCcpO1xyXG4gICAgICAgIGlmIChtZXNzYWdlKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XG5cbmV4cG9ydHMuRXJyb3JIYW5kbGVyID0gRXJyb3JIYW5kbGVyO1xuZXhwb3J0cy5Ob3RJbXBsZW1lbnRlZEVycm9yID0gTm90SW1wbGVtZW50ZWRFcnJvcjtcbmV4cG9ydHMuTm90U3VwcG9ydGVkRXJyb3IgPSBOb3RTdXBwb3J0ZWRFcnJvcjtcbmV4cG9ydHMuY2FuY2VsZWQgPSBjYW5jZWxlZDtcbmV4cG9ydHMuZGlzcG9zZWQgPSBkaXNwb3NlZDtcbmV4cG9ydHMuZXJyb3JIYW5kbGVyID0gZXJyb3JIYW5kbGVyO1xuZXhwb3J0cy5nZXRFcnJvck1lc3NhZ2UgPSBnZXRFcnJvck1lc3NhZ2U7XG5leHBvcnRzLmlsbGVnYWxBcmd1bWVudCA9IGlsbGVnYWxBcmd1bWVudDtcbmV4cG9ydHMuaWxsZWdhbFN0YXRlID0gaWxsZWdhbFN0YXRlO1xuZXhwb3J0cy5pc1Byb21pc2VDYW5jZWxlZEVycm9yID0gaXNQcm9taXNlQ2FuY2VsZWRFcnJvcjtcbmV4cG9ydHMub25VbmV4cGVjdGVkRXJyb3IgPSBvblVuZXhwZWN0ZWRFcnJvcjtcbmV4cG9ydHMub25VbmV4cGVjdGVkRXh0ZXJuYWxFcnJvciA9IG9uVW5leHBlY3RlZEV4dGVybmFsRXJyb3I7XG5leHBvcnRzLnJlYWRvbmx5ID0gcmVhZG9ubHk7XG5leHBvcnRzLnNldFVuZXhwZWN0ZWRFcnJvckhhbmRsZXIgPSBzZXRVbmV4cGVjdGVkRXJyb3JIYW5kbGVyO1xuZXhwb3J0cy50cmFuc2Zvcm1FcnJvckZvclNlcmlhbGl6YXRpb24gPSB0cmFuc2Zvcm1FcnJvckZvclNlcmlhbGl6YXRpb247XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbnZhciBlcnJvcnMgPSByZXF1aXJlKCcuLi8uLi8uLi9iYXNlL2NvbW1vbi9lcnJvcnMvaW5kZXguanMnKTtcbnZhciBmdW5jdGlvbmFsID0gcmVxdWlyZSgnLi4vLi4vLi4vYmFzZS9jb21tb24vZnVuY3Rpb25hbC9pbmRleC5qcycpO1xudmFyIGxpZmVjeWNsZSA9IHJlcXVpcmUoJy4uLy4uLy4uL2Jhc2UvY29tbW9uL2xpZmVjeWNsZS9pbmRleC5qcycpO1xudmFyIGxpbmtlZExpc3QgPSByZXF1aXJlKCcuLi8uLi8uLi9iYXNlL2NvbW1vbi9saW5rZWRMaXN0L2luZGV4LmpzJyk7XG5cbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG4oZnVuY3Rpb24gKEV2ZW50KSB7XHJcbiAgICBFdmVudC5Ob25lID0gKCkgPT4gbGlmZWN5Y2xlLkRpc3Bvc2FibGUuTm9uZTtcclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gYW4gZXZlbnQsIHJldHVybnMgYW5vdGhlciBldmVudCB3aGljaCBvbmx5IGZpcmVzIG9uY2UuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIG9uY2UoZXZlbnQpIHtcclxuICAgICAgICByZXR1cm4gKGxpc3RlbmVyLCB0aGlzQXJncyA9IG51bGwsIGRpc3Bvc2FibGVzKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIHdlIG5lZWQgdGhpcywgaW4gY2FzZSB0aGUgZXZlbnQgZmlyZXMgZHVyaW5nIHRoZSBsaXN0ZW5lciBjYWxsXHJcbiAgICAgICAgICAgIGxldCBkaWRGaXJlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGxldCByZXN1bHQ7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGV2ZW50KGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRpZEZpcmUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlkRmlyZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdGVuZXIuY2FsbCh0aGlzQXJncywgZSk7XHJcbiAgICAgICAgICAgIH0sIG51bGwsIGRpc3Bvc2FibGVzKTtcclxuICAgICAgICAgICAgaWYgKGRpZEZpcmUpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgRXZlbnQub25jZSA9IG9uY2U7XHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGFuIGV2ZW50IGFuZCBhIGBtYXBgIGZ1bmN0aW9uLCByZXR1cm5zIGFub3RoZXIgZXZlbnQgd2hpY2ggbWFwcyBlYWNoIGVsZW1lbnRcclxuICAgICAqIHRocm91Z2ggdGhlIG1hcHBpbmcgZnVuY3Rpb24uXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIG1hcChldmVudCwgbWFwKSB7XHJcbiAgICAgICAgcmV0dXJuIHNuYXBzaG90KChsaXN0ZW5lciwgdGhpc0FyZ3MgPSBudWxsLCBkaXNwb3NhYmxlcykgPT4gZXZlbnQoaSA9PiBsaXN0ZW5lci5jYWxsKHRoaXNBcmdzLCBtYXAoaSkpLCBudWxsLCBkaXNwb3NhYmxlcykpO1xyXG4gICAgfVxyXG4gICAgRXZlbnQubWFwID0gbWFwO1xyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhbiBldmVudCBhbmQgYW4gYGVhY2hgIGZ1bmN0aW9uLCByZXR1cm5zIGFub3RoZXIgaWRlbnRpY2FsIGV2ZW50IGFuZCBjYWxsc1xyXG4gICAgICogdGhlIGBlYWNoYCBmdW5jdGlvbiBwZXIgZWFjaCBlbGVtZW50LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBmb3JFYWNoKGV2ZW50LCBlYWNoKSB7XHJcbiAgICAgICAgcmV0dXJuIHNuYXBzaG90KChsaXN0ZW5lciwgdGhpc0FyZ3MgPSBudWxsLCBkaXNwb3NhYmxlcykgPT4gZXZlbnQoaSA9PiB7IGVhY2goaSk7IGxpc3RlbmVyLmNhbGwodGhpc0FyZ3MsIGkpOyB9LCBudWxsLCBkaXNwb3NhYmxlcykpO1xyXG4gICAgfVxyXG4gICAgRXZlbnQuZm9yRWFjaCA9IGZvckVhY2g7XHJcbiAgICBmdW5jdGlvbiBmaWx0ZXIoZXZlbnQsIGZpbHRlcikge1xyXG4gICAgICAgIHJldHVybiBzbmFwc2hvdCgobGlzdGVuZXIsIHRoaXNBcmdzID0gbnVsbCwgZGlzcG9zYWJsZXMpID0+IGV2ZW50KGUgPT4gZmlsdGVyKGUpICYmIGxpc3RlbmVyLmNhbGwodGhpc0FyZ3MsIGUpLCBudWxsLCBkaXNwb3NhYmxlcykpO1xyXG4gICAgfVxyXG4gICAgRXZlbnQuZmlsdGVyID0gZmlsdGVyO1xyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhbiBldmVudCwgcmV0dXJucyB0aGUgc2FtZSBldmVudCBidXQgdHlwZWQgYXMgYEV2ZW50PHZvaWQ+YC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gc2lnbmFsKGV2ZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIGV2ZW50O1xyXG4gICAgfVxyXG4gICAgRXZlbnQuc2lnbmFsID0gc2lnbmFsO1xyXG4gICAgZnVuY3Rpb24gYW55KC4uLmV2ZW50cykge1xyXG4gICAgICAgIHJldHVybiAobGlzdGVuZXIsIHRoaXNBcmdzID0gbnVsbCwgZGlzcG9zYWJsZXMpID0+IGxpZmVjeWNsZS5jb21iaW5lZERpc3Bvc2FibGUoLi4uZXZlbnRzLm1hcChldmVudCA9PiBldmVudChlID0+IGxpc3RlbmVyLmNhbGwodGhpc0FyZ3MsIGUpLCBudWxsLCBkaXNwb3NhYmxlcykpKTtcclxuICAgIH1cclxuICAgIEV2ZW50LmFueSA9IGFueTtcclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gYW4gZXZlbnQgYW5kIGEgYG1lcmdlYCBmdW5jdGlvbiwgcmV0dXJucyBhbm90aGVyIGV2ZW50IHdoaWNoIG1hcHMgZWFjaCBlbGVtZW50XHJcbiAgICAgKiBhbmQgdGhlIGN1bXVsYXRpdmUgcmVzdWx0IHRocm91Z2ggdGhlIGBtZXJnZWAgZnVuY3Rpb24uIFNpbWlsYXIgdG8gYG1hcGAsIGJ1dCB3aXRoIG1lbW9yeS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcmVkdWNlKGV2ZW50LCBtZXJnZSwgaW5pdGlhbCkge1xyXG4gICAgICAgIGxldCBvdXRwdXQgPSBpbml0aWFsO1xyXG4gICAgICAgIHJldHVybiBtYXAoZXZlbnQsIGUgPT4ge1xyXG4gICAgICAgICAgICBvdXRwdXQgPSBtZXJnZShvdXRwdXQsIGUpO1xyXG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgRXZlbnQucmVkdWNlID0gcmVkdWNlO1xyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhIGNoYWluIG9mIGV2ZW50IHByb2Nlc3NpbmcgZnVuY3Rpb25zIChmaWx0ZXIsIG1hcCwgZXRjKSwgZWFjaFxyXG4gICAgICogZnVuY3Rpb24gd2lsbCBiZSBpbnZva2VkIHBlciBldmVudCAmIHBlciBsaXN0ZW5lci4gU25hcHNob3R0aW5nIGFuIGV2ZW50XHJcbiAgICAgKiBjaGFpbiBhbGxvd3MgZWFjaCBmdW5jdGlvbiB0byBiZSBpbnZva2VkIGp1c3Qgb25jZSBwZXIgZXZlbnQuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHNuYXBzaG90KGV2ZW50KSB7XHJcbiAgICAgICAgbGV0IGxpc3RlbmVyO1xyXG4gICAgICAgIGNvbnN0IGVtaXR0ZXIgPSBuZXcgRW1pdHRlcih7XHJcbiAgICAgICAgICAgIG9uRmlyc3RMaXN0ZW5lckFkZCgpIHtcclxuICAgICAgICAgICAgICAgIGxpc3RlbmVyID0gZXZlbnQoZW1pdHRlci5maXJlLCBlbWl0dGVyKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb25MYXN0TGlzdGVuZXJSZW1vdmUoKSB7XHJcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gZW1pdHRlci5ldmVudDtcclxuICAgIH1cclxuICAgIEV2ZW50LnNuYXBzaG90ID0gc25hcHNob3Q7XHJcbiAgICBmdW5jdGlvbiBkZWJvdW5jZShldmVudCwgbWVyZ2UsIGRlbGF5ID0gMTAwLCBsZWFkaW5nID0gZmFsc2UsIGxlYWtXYXJuaW5nVGhyZXNob2xkKSB7XHJcbiAgICAgICAgbGV0IHN1YnNjcmlwdGlvbjtcclxuICAgICAgICBsZXQgb3V0cHV0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIGxldCBoYW5kbGUgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgbGV0IG51bURlYm91bmNlZENhbGxzID0gMDtcclxuICAgICAgICBjb25zdCBlbWl0dGVyID0gbmV3IEVtaXR0ZXIoe1xyXG4gICAgICAgICAgICBsZWFrV2FybmluZ1RocmVzaG9sZCxcclxuICAgICAgICAgICAgb25GaXJzdExpc3RlbmVyQWRkKCkge1xyXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uID0gZXZlbnQoY3VyID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBudW1EZWJvdW5jZWRDYWxscysrO1xyXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dCA9IG1lcmdlKG91dHB1dCwgY3VyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGVhZGluZyAmJiAhaGFuZGxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVtaXR0ZXIuZmlyZShvdXRwdXQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChoYW5kbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZSA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBfb3V0cHV0ID0gb3V0cHV0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFsZWFkaW5nIHx8IG51bURlYm91bmNlZENhbGxzID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW1pdHRlci5maXJlKF9vdXRwdXQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bURlYm91bmNlZENhbGxzID0gMDtcclxuICAgICAgICAgICAgICAgICAgICB9LCBkZWxheSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb25MYXN0TGlzdGVuZXJSZW1vdmUoKSB7XHJcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGVtaXR0ZXIuZXZlbnQ7XHJcbiAgICB9XHJcbiAgICBFdmVudC5kZWJvdW5jZSA9IGRlYm91bmNlO1xyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhbiBldmVudCwgaXQgcmV0dXJucyBhbm90aGVyIGV2ZW50IHdoaWNoIGZpcmVzIG9ubHkgb25jZSBhbmQgYXMgc29vbiBhc1xyXG4gICAgICogdGhlIGlucHV0IGV2ZW50IGVtaXRzLiBUaGUgZXZlbnQgZGF0YSBpcyB0aGUgbnVtYmVyIG9mIG1pbGxpcyBpdCB0b29rIGZvciB0aGVcclxuICAgICAqIGV2ZW50IHRvIGZpcmUuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHN0b3B3YXRjaChldmVudCkge1xyXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgcmV0dXJuIG1hcChvbmNlKGV2ZW50KSwgXyA9PiBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0KTtcclxuICAgIH1cclxuICAgIEV2ZW50LnN0b3B3YXRjaCA9IHN0b3B3YXRjaDtcclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gYW4gZXZlbnQsIGl0IHJldHVybnMgYW5vdGhlciBldmVudCB3aGljaCBmaXJlcyBvbmx5IHdoZW4gdGhlIGV2ZW50XHJcbiAgICAgKiBlbGVtZW50IGNoYW5nZXMuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGxhdGNoKGV2ZW50KSB7XHJcbiAgICAgICAgbGV0IGZpcnN0Q2FsbCA9IHRydWU7XHJcbiAgICAgICAgbGV0IGNhY2hlO1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXIoZXZlbnQsIHZhbHVlID0+IHtcclxuICAgICAgICAgICAgY29uc3Qgc2hvdWxkRW1pdCA9IGZpcnN0Q2FsbCB8fCB2YWx1ZSAhPT0gY2FjaGU7XHJcbiAgICAgICAgICAgIGZpcnN0Q2FsbCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBjYWNoZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gc2hvdWxkRW1pdDtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIEV2ZW50LmxhdGNoID0gbGF0Y2g7XHJcbiAgICAvKipcclxuICAgICAqIEJ1ZmZlcnMgdGhlIHByb3ZpZGVkIGV2ZW50IHVudGlsIGEgZmlyc3QgbGlzdGVuZXIgY29tZXNcclxuICAgICAqIGFsb25nLCBhdCB3aGljaCBwb2ludCBmaXJlIGFsbCB0aGUgZXZlbnRzIGF0IG9uY2UgYW5kXHJcbiAgICAgKiBwaXBlIHRoZSBldmVudCBmcm9tIHRoZW4gb24uXHJcbiAgICAgKlxyXG4gICAgICogYGBgdHlwZXNjcmlwdFxyXG4gICAgICogY29uc3QgZW1pdHRlciA9IG5ldyBFbWl0dGVyPG51bWJlcj4oKTtcclxuICAgICAqIGNvbnN0IGV2ZW50ID0gZW1pdHRlci5ldmVudDtcclxuICAgICAqIGNvbnN0IGJ1ZmZlcmVkRXZlbnQgPSBidWZmZXIoZXZlbnQpO1xyXG4gICAgICpcclxuICAgICAqIGVtaXR0ZXIuZmlyZSgxKTtcclxuICAgICAqIGVtaXR0ZXIuZmlyZSgyKTtcclxuICAgICAqIGVtaXR0ZXIuZmlyZSgzKTtcclxuICAgICAqIC8vIG5vdGhpbmcuLi5cclxuICAgICAqXHJcbiAgICAgKiBjb25zdCBsaXN0ZW5lciA9IGJ1ZmZlcmVkRXZlbnQobnVtID0+IGNvbnNvbGUubG9nKG51bSkpO1xyXG4gICAgICogLy8gMSwgMiwgM1xyXG4gICAgICpcclxuICAgICAqIGVtaXR0ZXIuZmlyZSg0KTtcclxuICAgICAqIC8vIDRcclxuICAgICAqIGBgYFxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBidWZmZXIoZXZlbnQsIG5leHRUaWNrID0gZmFsc2UsIF9idWZmZXIgPSBbXSkge1xyXG4gICAgICAgIGxldCBidWZmZXIgPSBfYnVmZmVyLnNsaWNlKCk7XHJcbiAgICAgICAgbGV0IGxpc3RlbmVyID0gZXZlbnQoZSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChidWZmZXIpIHtcclxuICAgICAgICAgICAgICAgIGJ1ZmZlci5wdXNoKGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZW1pdHRlci5maXJlKGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc3QgZmx1c2ggPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChidWZmZXIpIHtcclxuICAgICAgICAgICAgICAgIGJ1ZmZlci5mb3JFYWNoKGUgPT4gZW1pdHRlci5maXJlKGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBidWZmZXIgPSBudWxsO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgY29uc3QgZW1pdHRlciA9IG5ldyBFbWl0dGVyKHtcclxuICAgICAgICAgICAgb25GaXJzdExpc3RlbmVyQWRkKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFsaXN0ZW5lcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyID0gZXZlbnQoZSA9PiBlbWl0dGVyLmZpcmUoZSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbkZpcnN0TGlzdGVuZXJEaWRBZGQoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYnVmZmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5leHRUaWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmx1c2goKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uTGFzdExpc3RlbmVyUmVtb3ZlKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbGlzdGVuZXIgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGVtaXR0ZXIuZXZlbnQ7XHJcbiAgICB9XHJcbiAgICBFdmVudC5idWZmZXIgPSBidWZmZXI7XHJcbiAgICBjbGFzcyBDaGFpbmFibGVFdmVudCB7XHJcbiAgICAgICAgY29uc3RydWN0b3IoZXZlbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5ldmVudCA9IGV2ZW50O1xyXG4gICAgICAgIH1cclxuICAgICAgICBtYXAoZm4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBDaGFpbmFibGVFdmVudChtYXAodGhpcy5ldmVudCwgZm4pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yRWFjaChmbikge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IENoYWluYWJsZUV2ZW50KGZvckVhY2godGhpcy5ldmVudCwgZm4pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZmlsdGVyKGZuKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ2hhaW5hYmxlRXZlbnQoZmlsdGVyKHRoaXMuZXZlbnQsIGZuKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlZHVjZShtZXJnZSwgaW5pdGlhbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IENoYWluYWJsZUV2ZW50KHJlZHVjZSh0aGlzLmV2ZW50LCBtZXJnZSwgaW5pdGlhbCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsYXRjaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBDaGFpbmFibGVFdmVudChsYXRjaCh0aGlzLmV2ZW50KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRlYm91bmNlKG1lcmdlLCBkZWxheSA9IDEwMCwgbGVhZGluZyA9IGZhbHNlLCBsZWFrV2FybmluZ1RocmVzaG9sZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IENoYWluYWJsZUV2ZW50KGRlYm91bmNlKHRoaXMuZXZlbnQsIG1lcmdlLCBkZWxheSwgbGVhZGluZywgbGVha1dhcm5pbmdUaHJlc2hvbGQpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgb24obGlzdGVuZXIsIHRoaXNBcmdzLCBkaXNwb3NhYmxlcykge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ldmVudChsaXN0ZW5lciwgdGhpc0FyZ3MsIGRpc3Bvc2FibGVzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgb25jZShsaXN0ZW5lciwgdGhpc0FyZ3MsIGRpc3Bvc2FibGVzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBvbmNlKHRoaXMuZXZlbnQpKGxpc3RlbmVyLCB0aGlzQXJncywgZGlzcG9zYWJsZXMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGNoYWluKGV2ZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBDaGFpbmFibGVFdmVudChldmVudCk7XHJcbiAgICB9XHJcbiAgICBFdmVudC5jaGFpbiA9IGNoYWluO1xyXG4gICAgZnVuY3Rpb24gZnJvbU5vZGVFdmVudEVtaXR0ZXIoZW1pdHRlciwgZXZlbnROYW1lLCBtYXAgPSBpZCA9PiBpZCkge1xyXG4gICAgICAgIGNvbnN0IGZuID0gKC4uLmFyZ3MpID0+IHJlc3VsdC5maXJlKG1hcCguLi5hcmdzKSk7XHJcbiAgICAgICAgY29uc3Qgb25GaXJzdExpc3RlbmVyQWRkID0gKCkgPT4gZW1pdHRlci5vbihldmVudE5hbWUsIGZuKTtcclxuICAgICAgICBjb25zdCBvbkxhc3RMaXN0ZW5lclJlbW92ZSA9ICgpID0+IGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoZXZlbnROYW1lLCBmbik7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IEVtaXR0ZXIoeyBvbkZpcnN0TGlzdGVuZXJBZGQsIG9uTGFzdExpc3RlbmVyUmVtb3ZlIH0pO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQuZXZlbnQ7XHJcbiAgICB9XHJcbiAgICBFdmVudC5mcm9tTm9kZUV2ZW50RW1pdHRlciA9IGZyb21Ob2RlRXZlbnRFbWl0dGVyO1xyXG4gICAgZnVuY3Rpb24gZnJvbURPTUV2ZW50RW1pdHRlcihlbWl0dGVyLCBldmVudE5hbWUsIG1hcCA9IGlkID0+IGlkKSB7XHJcbiAgICAgICAgY29uc3QgZm4gPSAoLi4uYXJncykgPT4gcmVzdWx0LmZpcmUobWFwKC4uLmFyZ3MpKTtcclxuICAgICAgICBjb25zdCBvbkZpcnN0TGlzdGVuZXJBZGQgPSAoKSA9PiBlbWl0dGVyLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBmbik7XHJcbiAgICAgICAgY29uc3Qgb25MYXN0TGlzdGVuZXJSZW1vdmUgPSAoKSA9PiBlbWl0dGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBmbik7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IEVtaXR0ZXIoeyBvbkZpcnN0TGlzdGVuZXJBZGQsIG9uTGFzdExpc3RlbmVyUmVtb3ZlIH0pO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQuZXZlbnQ7XHJcbiAgICB9XHJcbiAgICBFdmVudC5mcm9tRE9NRXZlbnRFbWl0dGVyID0gZnJvbURPTUV2ZW50RW1pdHRlcjtcclxuICAgIGZ1bmN0aW9uIGZyb21Qcm9taXNlKHByb21pc2UpIHtcclxuICAgICAgICBjb25zdCBlbWl0dGVyID0gbmV3IEVtaXR0ZXIoKTtcclxuICAgICAgICBsZXQgc2hvdWxkRW1pdCA9IGZhbHNlO1xyXG4gICAgICAgIHByb21pc2VcclxuICAgICAgICAgICAgLnRoZW4odW5kZWZpbmVkLCAoKSA9PiBudWxsKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghc2hvdWxkRW1pdCkge1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBlbWl0dGVyLmZpcmUodW5kZWZpbmVkKSwgMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBlbWl0dGVyLmZpcmUodW5kZWZpbmVkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHNob3VsZEVtaXQgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiBlbWl0dGVyLmV2ZW50O1xyXG4gICAgfVxyXG4gICAgRXZlbnQuZnJvbVByb21pc2UgPSBmcm9tUHJvbWlzZTtcclxuICAgIGZ1bmN0aW9uIHRvUHJvbWlzZShldmVudCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShjID0+IG9uY2UoZXZlbnQpKGMpKTtcclxuICAgIH1cclxuICAgIEV2ZW50LnRvUHJvbWlzZSA9IHRvUHJvbWlzZTtcclxufSkoZXhwb3J0cy5FdmVudCB8fCAoZXhwb3J0cy5FdmVudCA9IHt9KSk7XHJcbmxldCBfZ2xvYmFsTGVha1dhcm5pbmdUaHJlc2hvbGQgPSAtMTtcclxuZnVuY3Rpb24gc2V0R2xvYmFsTGVha1dhcm5pbmdUaHJlc2hvbGQobikge1xyXG4gICAgY29uc3Qgb2xkVmFsdWUgPSBfZ2xvYmFsTGVha1dhcm5pbmdUaHJlc2hvbGQ7XHJcbiAgICBfZ2xvYmFsTGVha1dhcm5pbmdUaHJlc2hvbGQgPSBuO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICBfZ2xvYmFsTGVha1dhcm5pbmdUaHJlc2hvbGQgPSBvbGRWYWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcbmNsYXNzIExlYWthZ2VNb25pdG9yIHtcclxuICAgIGNvbnN0cnVjdG9yKGN1c3RvbVRocmVzaG9sZCwgbmFtZSA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMTgpLnNsaWNlKDIsIDUpKSB7XHJcbiAgICAgICAgdGhpcy5jdXN0b21UaHJlc2hvbGQgPSBjdXN0b21UaHJlc2hvbGQ7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICB0aGlzLl93YXJuQ291bnRkb3duID0gMDtcclxuICAgIH1cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3N0YWNrcykge1xyXG4gICAgICAgICAgICB0aGlzLl9zdGFja3MuY2xlYXIoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjaGVjayhsaXN0ZW5lckNvdW50KSB7XHJcbiAgICAgICAgbGV0IHRocmVzaG9sZCA9IF9nbG9iYWxMZWFrV2FybmluZ1RocmVzaG9sZDtcclxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuY3VzdG9tVGhyZXNob2xkID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICB0aHJlc2hvbGQgPSB0aGlzLmN1c3RvbVRocmVzaG9sZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRocmVzaG9sZCA8PSAwIHx8IGxpc3RlbmVyQ291bnQgPCB0aHJlc2hvbGQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0aGlzLl9zdGFja3MpIHtcclxuICAgICAgICAgICAgdGhpcy5fc3RhY2tzID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBzdGFjayA9IG5ldyBFcnJvcigpLnN0YWNrLnNwbGl0KCdcXG4nKS5zbGljZSgzKS5qb2luKCdcXG4nKTtcclxuICAgICAgICBjb25zdCBjb3VudCA9ICh0aGlzLl9zdGFja3MuZ2V0KHN0YWNrKSB8fCAwKTtcclxuICAgICAgICB0aGlzLl9zdGFja3Muc2V0KHN0YWNrLCBjb3VudCArIDEpO1xyXG4gICAgICAgIHRoaXMuX3dhcm5Db3VudGRvd24gLT0gMTtcclxuICAgICAgICBpZiAodGhpcy5fd2FybkNvdW50ZG93biA8PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIG9ubHkgd2FybiBvbiBmaXJzdCBleGNlZWQgYW5kIHRoZW4gZXZlcnkgdGltZSB0aGUgbGltaXRcclxuICAgICAgICAgICAgLy8gaXMgZXhjZWVkZWQgYnkgNTAlIGFnYWluXHJcbiAgICAgICAgICAgIHRoaXMuX3dhcm5Db3VudGRvd24gPSB0aHJlc2hvbGQgKiAwLjU7XHJcbiAgICAgICAgICAgIC8vIGZpbmQgbW9zdCBmcmVxdWVudCBsaXN0ZW5lciBhbmQgcHJpbnQgd2FybmluZ1xyXG4gICAgICAgICAgICBsZXQgdG9wU3RhY2s7XHJcbiAgICAgICAgICAgIGxldCB0b3BDb3VudCA9IDA7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgW3N0YWNrLCBjb3VudF0gb2YgdGhpcy5fc3RhY2tzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRvcFN0YWNrIHx8IHRvcENvdW50IDwgY291bnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0b3BTdGFjayA9IHN0YWNrO1xyXG4gICAgICAgICAgICAgICAgICAgIHRvcENvdW50ID0gY291bnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbJHt0aGlzLm5hbWV9XSBwb3RlbnRpYWwgbGlzdGVuZXIgTEVBSyBkZXRlY3RlZCwgaGF2aW5nICR7bGlzdGVuZXJDb3VudH0gbGlzdGVuZXJzIGFscmVhZHkuIE1PU1QgZnJlcXVlbnQgbGlzdGVuZXIgKCR7dG9wQ291bnR9KTpgKTtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKHRvcFN0YWNrKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuICgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY291bnQgPSAodGhpcy5fc3RhY2tzLmdldChzdGFjaykgfHwgMCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0YWNrcy5zZXQoc3RhY2ssIGNvdW50IC0gMSk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufVxyXG4vKipcclxuICogVGhlIEVtaXR0ZXIgY2FuIGJlIHVzZWQgdG8gZXhwb3NlIGFuIEV2ZW50IHRvIHRoZSBwdWJsaWNcclxuICogdG8gZmlyZSBpdCBmcm9tIHRoZSBpbnNpZGVzLlxyXG4gKiBTYW1wbGU6XHJcbiAgICBjbGFzcyBEb2N1bWVudCB7XHJcblxyXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgX29uRGlkQ2hhbmdlID0gbmV3IEVtaXR0ZXI8KHZhbHVlOnN0cmluZyk9PmFueT4oKTtcclxuXHJcbiAgICAgICAgcHVibGljIG9uRGlkQ2hhbmdlID0gdGhpcy5fb25EaWRDaGFuZ2UuZXZlbnQ7XHJcblxyXG4gICAgICAgIC8vIGdldHRlci1zdHlsZVxyXG4gICAgICAgIC8vIGdldCBvbkRpZENoYW5nZSgpOiBFdmVudDwodmFsdWU6c3RyaW5nKT0+YW55PiB7XHJcbiAgICAgICAgLy8gXHRyZXR1cm4gdGhpcy5fb25EaWRDaGFuZ2UuZXZlbnQ7XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBwcml2YXRlIF9kb0l0KCkge1xyXG4gICAgICAgICAgICAvLy4uLlxyXG4gICAgICAgICAgICB0aGlzLl9vbkRpZENoYW5nZS5maXJlKHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAqL1xyXG5jbGFzcyBFbWl0dGVyIHtcclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcclxuICAgICAgICB0aGlzLl9kaXNwb3NlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX29wdGlvbnMgPSBvcHRpb25zO1xyXG4gICAgICAgIHRoaXMuX2xlYWthZ2VNb24gPSBfZ2xvYmFsTGVha1dhcm5pbmdUaHJlc2hvbGQgPiAwXHJcbiAgICAgICAgICAgID8gbmV3IExlYWthZ2VNb25pdG9yKHRoaXMuX29wdGlvbnMgJiYgdGhpcy5fb3B0aW9ucy5sZWFrV2FybmluZ1RocmVzaG9sZClcclxuICAgICAgICAgICAgOiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIEZvciB0aGUgcHVibGljIHRvIGFsbG93IHRvIHN1YnNjcmliZVxyXG4gICAgICogdG8gZXZlbnRzIGZyb20gdGhpcyBFbWl0dGVyXHJcbiAgICAgKi9cclxuICAgIGdldCBldmVudCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2V2ZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50ID0gKGxpc3RlbmVyLCB0aGlzQXJncywgZGlzcG9zYWJsZXMpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGlzdGVuZXJzID0gbmV3IGxpbmtlZExpc3QuTGlua2VkTGlzdCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29uc3QgZmlyc3RMaXN0ZW5lciA9IHRoaXMuX2xpc3RlbmVycy5pc0VtcHR5KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3RMaXN0ZW5lciAmJiB0aGlzLl9vcHRpb25zICYmIHRoaXMuX29wdGlvbnMub25GaXJzdExpc3RlbmVyQWRkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fb3B0aW9ucy5vbkZpcnN0TGlzdGVuZXJBZGQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZW1vdmUgPSB0aGlzLl9saXN0ZW5lcnMucHVzaCghdGhpc0FyZ3MgPyBsaXN0ZW5lciA6IFtsaXN0ZW5lciwgdGhpc0FyZ3NdKTtcclxuICAgICAgICAgICAgICAgIGlmIChmaXJzdExpc3RlbmVyICYmIHRoaXMuX29wdGlvbnMgJiYgdGhpcy5fb3B0aW9ucy5vbkZpcnN0TGlzdGVuZXJEaWRBZGQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9vcHRpb25zLm9uRmlyc3RMaXN0ZW5lckRpZEFkZCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9vcHRpb25zICYmIHRoaXMuX29wdGlvbnMub25MaXN0ZW5lckRpZEFkZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX29wdGlvbnMub25MaXN0ZW5lckRpZEFkZCh0aGlzLCBsaXN0ZW5lciwgdGhpc0FyZ3MpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgYW5kIHJlY29yZCB0aGlzIGVtaXR0ZXIgZm9yIHBvdGVudGlhbCBsZWFrYWdlXHJcbiAgICAgICAgICAgICAgICBsZXQgcmVtb3ZlTW9uaXRvcjtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9sZWFrYWdlTW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlTW9uaXRvciA9IHRoaXMuX2xlYWthZ2VNb24uY2hlY2sodGhpcy5fbGlzdGVuZXJzLnNpemUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdDtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICBkaXNwb3NlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZW1vdmVNb25pdG9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVNb25pdG9yKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmRpc3Bvc2UgPSBFbWl0dGVyLl9ub29wO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2Rpc3Bvc2VkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9vcHRpb25zICYmIHRoaXMuX29wdGlvbnMub25MYXN0TGlzdGVuZXJSZW1vdmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBoYXNMaXN0ZW5lcnMgPSAodGhpcy5fbGlzdGVuZXJzICYmICF0aGlzLl9saXN0ZW5lcnMuaXNFbXB0eSgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWhhc0xpc3RlbmVycykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9vcHRpb25zLm9uTGFzdExpc3RlbmVyUmVtb3ZlKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBpZiAoZGlzcG9zYWJsZXMgaW5zdGFuY2VvZiBsaWZlY3ljbGUuRGlzcG9zYWJsZVN0b3JlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlzcG9zYWJsZXMuYWRkKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGRpc3Bvc2FibGVzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpc3Bvc2FibGVzLnB1c2gocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9ldmVudDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogVG8gYmUga2VwdCBwcml2YXRlIHRvIGZpcmUgYW4gZXZlbnQgdG9cclxuICAgICAqIHN1YnNjcmliZXJzXHJcbiAgICAgKi9cclxuICAgIGZpcmUoZXZlbnQpIHtcclxuICAgICAgICBpZiAodGhpcy5fbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgIC8vIHB1dCBhbGwgW2xpc3RlbmVyLGV2ZW50XS1wYWlycyBpbnRvIGRlbGl2ZXJ5IHF1ZXVlXHJcbiAgICAgICAgICAgIC8vIHRoZW4gZW1pdCBhbGwgZXZlbnQuIGFuIGlubmVyL25lc3RlZCBldmVudCBtaWdodCBiZVxyXG4gICAgICAgICAgICAvLyB0aGUgZHJpdmVyIG9mIHRoaXNcclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9kZWxpdmVyeVF1ZXVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9kZWxpdmVyeVF1ZXVlID0gbmV3IGxpbmtlZExpc3QuTGlua2VkTGlzdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMuX2xpc3RlbmVycykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZGVsaXZlcnlRdWV1ZS5wdXNoKFtsaXN0ZW5lciwgZXZlbnRdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB3aGlsZSAodGhpcy5fZGVsaXZlcnlRdWV1ZS5zaXplID4gMCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgW2xpc3RlbmVyLCBldmVudF0gPSB0aGlzLl9kZWxpdmVyeVF1ZXVlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIuY2FsbCh1bmRlZmluZWQsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyWzBdLmNhbGwobGlzdGVuZXJbMV0sIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5vblVuZXhwZWN0ZWRFcnJvcihlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2xpc3RlbmVycykge1xyXG4gICAgICAgICAgICB0aGlzLl9saXN0ZW5lcnMuY2xlYXIoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2RlbGl2ZXJ5UXVldWUpIHtcclxuICAgICAgICAgICAgdGhpcy5fZGVsaXZlcnlRdWV1ZS5jbGVhcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fbGVha2FnZU1vbikge1xyXG4gICAgICAgICAgICB0aGlzLl9sZWFrYWdlTW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zZWQgPSB0cnVlO1xyXG4gICAgfVxyXG59XHJcbkVtaXR0ZXIuX25vb3AgPSBmdW5jdGlvbiAoKSB7IH07XHJcbmNsYXNzIFBhdXNlYWJsZUVtaXR0ZXIgZXh0ZW5kcyBFbWl0dGVyIHtcclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcclxuICAgICAgICBzdXBlcihvcHRpb25zKTtcclxuICAgICAgICB0aGlzLl9pc1BhdXNlZCA9IDA7XHJcbiAgICAgICAgdGhpcy5fZXZlbnRRdWV1ZSA9IG5ldyBsaW5rZWRMaXN0LkxpbmtlZExpc3QoKTtcclxuICAgICAgICB0aGlzLl9tZXJnZUZuID0gb3B0aW9ucyAmJiBvcHRpb25zLm1lcmdlO1xyXG4gICAgfVxyXG4gICAgcGF1c2UoKSB7XHJcbiAgICAgICAgdGhpcy5faXNQYXVzZWQrKztcclxuICAgIH1cclxuICAgIHJlc3VtZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5faXNQYXVzZWQgIT09IDAgJiYgLS10aGlzLl9pc1BhdXNlZCA9PT0gMCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fbWVyZ2VGbikge1xyXG4gICAgICAgICAgICAgICAgLy8gdXNlIHRoZSBtZXJnZSBmdW5jdGlvbiB0byBjcmVhdGUgYSBzaW5nbGUgY29tcG9zaXRlXHJcbiAgICAgICAgICAgICAgICAvLyBldmVudC4gbWFrZSBhIGNvcHkgaW4gY2FzZSBmaXJpbmcgcGF1c2VzIHRoaXMgZW1pdHRlclxyXG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRzID0gdGhpcy5fZXZlbnRRdWV1ZS50b0FycmF5KCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9ldmVudFF1ZXVlLmNsZWFyKCk7XHJcbiAgICAgICAgICAgICAgICBzdXBlci5maXJlKHRoaXMuX21lcmdlRm4oZXZlbnRzKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBubyBtZXJnaW5nLCBmaXJlIGVhY2ggZXZlbnQgaW5kaXZpZHVhbGx5IGFuZCB0ZXN0XHJcbiAgICAgICAgICAgICAgICAvLyB0aGF0IHRoaXMgZW1pdHRlciBpc24ndCBwYXVzZWQgaGFsZndheSB0aHJvdWdoXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoIXRoaXMuX2lzUGF1c2VkICYmIHRoaXMuX2V2ZW50UXVldWUuc2l6ZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN1cGVyLmZpcmUodGhpcy5fZXZlbnRRdWV1ZS5zaGlmdCgpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZpcmUoZXZlbnQpIHtcclxuICAgICAgICBpZiAodGhpcy5fbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc1BhdXNlZCAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRRdWV1ZS5wdXNoKGV2ZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHN1cGVyLmZpcmUoZXZlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmNsYXNzIEFzeW5jRW1pdHRlciBleHRlbmRzIEVtaXR0ZXIge1xyXG4gICAgYXN5bmMgZmlyZUFzeW5jKGRhdGEsIHRva2VuLCBwcm9taXNlSm9pbikge1xyXG4gICAgICAgIGlmICghdGhpcy5fbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0aGlzLl9hc3luY0RlbGl2ZXJ5UXVldWUpIHtcclxuICAgICAgICAgICAgdGhpcy5fYXN5bmNEZWxpdmVyeVF1ZXVlID0gbmV3IGxpbmtlZExpc3QuTGlua2VkTGlzdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMuX2xpc3RlbmVycykge1xyXG4gICAgICAgICAgICB0aGlzLl9hc3luY0RlbGl2ZXJ5UXVldWUucHVzaChbbGlzdGVuZXIsIGRhdGFdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2hpbGUgKHRoaXMuX2FzeW5jRGVsaXZlcnlRdWV1ZS5zaXplID4gMCAmJiAhdG9rZW4uaXNDYW5jZWxsYXRpb25SZXF1ZXN0ZWQpIHtcclxuICAgICAgICAgICAgY29uc3QgW2xpc3RlbmVyLCBkYXRhXSA9IHRoaXMuX2FzeW5jRGVsaXZlcnlRdWV1ZS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBjb25zdCB0aGVuYWJsZXMgPSBbXTtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIGRhdGEpLCB7IHdhaXRVbnRpbDogKHApID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmlzRnJvemVuKHRoZW5hYmxlcykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd3YWl0VW50aWwgY2FuIE5PVCBiZSBjYWxsZWQgYXN5bmNocm9ub3VzJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9taXNlSm9pbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwID0gcHJvbWlzZUpvaW4ocCwgdHlwZW9mIGxpc3RlbmVyID09PSAnZnVuY3Rpb24nID8gbGlzdGVuZXIgOiBsaXN0ZW5lclswXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoZW5hYmxlcy5wdXNoKHApO1xyXG4gICAgICAgICAgICAgICAgfSB9KTtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lci5jYWxsKHVuZGVmaW5lZCwgZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJbMF0uY2FsbChsaXN0ZW5lclsxXSwgZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBlcnJvcnMub25VbmV4cGVjdGVkRXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBmcmVlemUgdGhlbmFibGVzLWNvbGxlY3Rpb24gdG8gZW5mb3JjZSBzeW5jLWNhbGxzIHRvXHJcbiAgICAgICAgICAgIC8vIHdhaXQgdW50aWwgYW5kIHRoZW4gd2FpdCBmb3IgYWxsIHRoZW5hYmxlcyB0byByZXNvbHZlXHJcbiAgICAgICAgICAgIE9iamVjdC5mcmVlemUodGhlbmFibGVzKTtcclxuICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGhlbmFibGVzKS5jYXRjaChlID0+IGVycm9ycy5vblVuZXhwZWN0ZWRFcnJvcihlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmNsYXNzIEV2ZW50TXVsdGlwbGV4ZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5oYXNMaXN0ZW5lcnMgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmV2ZW50cyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZW1pdHRlciA9IG5ldyBFbWl0dGVyKHtcclxuICAgICAgICAgICAgb25GaXJzdExpc3RlbmVyQWRkOiAoKSA9PiB0aGlzLm9uRmlyc3RMaXN0ZW5lckFkZCgpLFxyXG4gICAgICAgICAgICBvbkxhc3RMaXN0ZW5lclJlbW92ZTogKCkgPT4gdGhpcy5vbkxhc3RMaXN0ZW5lclJlbW92ZSgpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBnZXQgZXZlbnQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZW1pdHRlci5ldmVudDtcclxuICAgIH1cclxuICAgIGFkZChldmVudCkge1xyXG4gICAgICAgIGNvbnN0IGUgPSB7IGV2ZW50OiBldmVudCwgbGlzdGVuZXI6IG51bGwgfTtcclxuICAgICAgICB0aGlzLmV2ZW50cy5wdXNoKGUpO1xyXG4gICAgICAgIGlmICh0aGlzLmhhc0xpc3RlbmVycykge1xyXG4gICAgICAgICAgICB0aGlzLmhvb2soZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGRpc3Bvc2UgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmhhc0xpc3RlbmVycykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51bmhvb2soZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgaWR4ID0gdGhpcy5ldmVudHMuaW5kZXhPZihlKTtcclxuICAgICAgICAgICAgdGhpcy5ldmVudHMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gbGlmZWN5Y2xlLnRvRGlzcG9zYWJsZShmdW5jdGlvbmFsLm9uY2UoZGlzcG9zZSkpO1xyXG4gICAgfVxyXG4gICAgb25GaXJzdExpc3RlbmVyQWRkKCkge1xyXG4gICAgICAgIHRoaXMuaGFzTGlzdGVuZXJzID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmV2ZW50cy5mb3JFYWNoKGUgPT4gdGhpcy5ob29rKGUpKTtcclxuICAgIH1cclxuICAgIG9uTGFzdExpc3RlbmVyUmVtb3ZlKCkge1xyXG4gICAgICAgIHRoaXMuaGFzTGlzdGVuZXJzID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5ldmVudHMuZm9yRWFjaChlID0+IHRoaXMudW5ob29rKGUpKTtcclxuICAgIH1cclxuICAgIGhvb2soZSkge1xyXG4gICAgICAgIGUubGlzdGVuZXIgPSBlLmV2ZW50KHIgPT4gdGhpcy5lbWl0dGVyLmZpcmUocikpO1xyXG4gICAgfVxyXG4gICAgdW5ob29rKGUpIHtcclxuICAgICAgICBpZiAoZS5saXN0ZW5lcikge1xyXG4gICAgICAgICAgICBlLmxpc3RlbmVyLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZS5saXN0ZW5lciA9IG51bGw7XHJcbiAgICB9XHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZW1pdHRlci5kaXNwb3NlKCk7XHJcbiAgICB9XHJcbn1cclxuLyoqXHJcbiAqIFRoZSBFdmVudEJ1ZmZlcmVyIGlzIHVzZWZ1bCBpbiBzaXR1YXRpb25zIGluIHdoaWNoIHlvdSB3YW50XHJcbiAqIHRvIGRlbGF5IGZpcmluZyB5b3VyIGV2ZW50cyBkdXJpbmcgc29tZSBjb2RlLlxyXG4gKiBZb3UgY2FuIHdyYXAgdGhhdCBjb2RlIGFuZCBiZSBzdXJlIHRoYXQgdGhlIGV2ZW50IHdpbGwgbm90XHJcbiAqIGJlIGZpcmVkIGR1cmluZyB0aGF0IHdyYXAuXHJcbiAqXHJcbiAqIGBgYFxyXG4gKiBjb25zdCBlbWl0dGVyOiBFbWl0dGVyO1xyXG4gKiBjb25zdCBkZWxheWVyID0gbmV3IEV2ZW50RGVsYXllcigpO1xyXG4gKiBjb25zdCBkZWxheWVkRXZlbnQgPSBkZWxheWVyLndyYXBFdmVudChlbWl0dGVyLmV2ZW50KTtcclxuICpcclxuICogZGVsYXllZEV2ZW50KGNvbnNvbGUubG9nKTtcclxuICpcclxuICogZGVsYXllci5idWZmZXJFdmVudHMoKCkgPT4ge1xyXG4gKiAgIGVtaXR0ZXIuZmlyZSgpOyAvLyBldmVudCB3aWxsIG5vdCBiZSBmaXJlZCB5ZXRcclxuICogfSk7XHJcbiAqXHJcbiAqIC8vIGV2ZW50IHdpbGwgb25seSBiZSBmaXJlZCBhdCB0aGlzIHBvaW50XHJcbiAqIGBgYFxyXG4gKi9cclxuY2xhc3MgRXZlbnRCdWZmZXJlciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmJ1ZmZlcnMgPSBbXTtcclxuICAgIH1cclxuICAgIHdyYXBFdmVudChldmVudCkge1xyXG4gICAgICAgIHJldHVybiAobGlzdGVuZXIsIHRoaXNBcmdzLCBkaXNwb3NhYmxlcykgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gZXZlbnQoaSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBidWZmZXIgPSB0aGlzLmJ1ZmZlcnNbdGhpcy5idWZmZXJzLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlci5wdXNoKCgpID0+IGxpc3RlbmVyLmNhbGwodGhpc0FyZ3MsIGkpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyLmNhbGwodGhpc0FyZ3MsIGkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCB1bmRlZmluZWQsIGRpc3Bvc2FibGVzKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgYnVmZmVyRXZlbnRzKGZuKSB7XHJcbiAgICAgICAgY29uc3QgYnVmZmVyID0gW107XHJcbiAgICAgICAgdGhpcy5idWZmZXJzLnB1c2goYnVmZmVyKTtcclxuICAgICAgICBjb25zdCByID0gZm4oKTtcclxuICAgICAgICB0aGlzLmJ1ZmZlcnMucG9wKCk7XHJcbiAgICAgICAgYnVmZmVyLmZvckVhY2goZmx1c2ggPT4gZmx1c2goKSk7XHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9XHJcbn1cclxuLyoqXHJcbiAqIEEgUmVsYXkgaXMgYW4gZXZlbnQgZm9yd2FyZGVyIHdoaWNoIGZ1bmN0aW9ucyBhcyBhIHJlcGx1Z2FiYmxlIGV2ZW50IHBpcGUuXHJcbiAqIE9uY2UgY3JlYXRlZCwgeW91IGNhbiBjb25uZWN0IGFuIGlucHV0IGV2ZW50IHRvIGl0IGFuZCBpdCB3aWxsIHNpbXBseSBmb3J3YXJkXHJcbiAqIGV2ZW50cyBmcm9tIHRoYXQgaW5wdXQgZXZlbnQgdGhyb3VnaCBpdHMgb3duIGBldmVudGAgcHJvcGVydHkuIFRoZSBgaW5wdXRgXHJcbiAqIGNhbiBiZSBjaGFuZ2VkIGF0IGFueSBwb2ludCBpbiB0aW1lLlxyXG4gKi9cclxuY2xhc3MgUmVsYXkge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5pbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmlucHV0RXZlbnQgPSBleHBvcnRzLkV2ZW50Lk5vbmU7XHJcbiAgICAgICAgdGhpcy5pbnB1dEV2ZW50TGlzdGVuZXIgPSBsaWZlY3ljbGUuRGlzcG9zYWJsZS5Ob25lO1xyXG4gICAgICAgIHRoaXMuZW1pdHRlciA9IG5ldyBFbWl0dGVyKHtcclxuICAgICAgICAgICAgb25GaXJzdExpc3RlbmVyRGlkQWRkOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3RlbmluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlucHV0RXZlbnRMaXN0ZW5lciA9IHRoaXMuaW5wdXRFdmVudCh0aGlzLmVtaXR0ZXIuZmlyZSwgdGhpcy5lbWl0dGVyKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb25MYXN0TGlzdGVuZXJSZW1vdmU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlucHV0RXZlbnRMaXN0ZW5lci5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmV2ZW50ID0gdGhpcy5lbWl0dGVyLmV2ZW50O1xyXG4gICAgfVxyXG4gICAgc2V0IGlucHV0KGV2ZW50KSB7XHJcbiAgICAgICAgdGhpcy5pbnB1dEV2ZW50ID0gZXZlbnQ7XHJcbiAgICAgICAgaWYgKHRoaXMubGlzdGVuaW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW5wdXRFdmVudExpc3RlbmVyLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgdGhpcy5pbnB1dEV2ZW50TGlzdGVuZXIgPSBldmVudCh0aGlzLmVtaXR0ZXIuZmlyZSwgdGhpcy5lbWl0dGVyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuaW5wdXRFdmVudExpc3RlbmVyLmRpc3Bvc2UoKTtcclxuICAgICAgICB0aGlzLmVtaXR0ZXIuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG59XG5cbmV4cG9ydHMuQXN5bmNFbWl0dGVyID0gQXN5bmNFbWl0dGVyO1xuZXhwb3J0cy5FbWl0dGVyID0gRW1pdHRlcjtcbmV4cG9ydHMuRXZlbnRCdWZmZXJlciA9IEV2ZW50QnVmZmVyZXI7XG5leHBvcnRzLkV2ZW50TXVsdGlwbGV4ZXIgPSBFdmVudE11bHRpcGxleGVyO1xuZXhwb3J0cy5QYXVzZWFibGVFbWl0dGVyID0gUGF1c2VhYmxlRW1pdHRlcjtcbmV4cG9ydHMuUmVsYXkgPSBSZWxheTtcbmV4cG9ydHMuc2V0R2xvYmFsTGVha1dhcm5pbmdUaHJlc2hvbGQgPSBzZXRHbG9iYWxMZWFrV2FybmluZ1RocmVzaG9sZDtcbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbmZ1bmN0aW9uIG9uY2UoZm4pIHtcclxuICAgIGNvbnN0IF90aGlzID0gdGhpcztcclxuICAgIGxldCBkaWRDYWxsID0gZmFsc2U7XHJcbiAgICBsZXQgcmVzdWx0O1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoZGlkQ2FsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgICAgICBkaWRDYWxsID0gdHJ1ZTtcclxuICAgICAgICByZXN1bHQgPSBmbi5hcHBseShfdGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfTtcclxufVxuXG5leHBvcnRzLm9uY2UgPSBvbmNlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxyXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuKGZ1bmN0aW9uIChJdGVyYWJsZSkge1xyXG4gICAgZnVuY3Rpb24gaXModGhpbmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpbmcgJiYgdHlwZW9mIHRoaW5nID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdGhpbmdbU3ltYm9sLml0ZXJhdG9yXSA9PT0gJ2Z1bmN0aW9uJztcclxuICAgIH1cclxuICAgIEl0ZXJhYmxlLmlzID0gaXM7XHJcbiAgICBjb25zdCBfZW1wdHkgPSBPYmplY3QuZnJlZXplKFtdKTtcclxuICAgIGZ1bmN0aW9uIGVtcHR5KCkge1xyXG4gICAgICAgIHJldHVybiBfZW1wdHk7XHJcbiAgICB9XHJcbiAgICBJdGVyYWJsZS5lbXB0eSA9IGVtcHR5O1xyXG4gICAgZnVuY3Rpb24qIHNpbmdsZShlbGVtZW50KSB7XHJcbiAgICAgICAgeWllbGQgZWxlbWVudDtcclxuICAgIH1cclxuICAgIEl0ZXJhYmxlLnNpbmdsZSA9IHNpbmdsZTtcclxuICAgIGZ1bmN0aW9uIGZyb20oaXRlcmFibGUpIHtcclxuICAgICAgICByZXR1cm4gaXRlcmFibGUgfHwgX2VtcHR5O1xyXG4gICAgfVxyXG4gICAgSXRlcmFibGUuZnJvbSA9IGZyb207XHJcbiAgICBmdW5jdGlvbiBmaXJzdChpdGVyYWJsZSkge1xyXG4gICAgICAgIHJldHVybiBpdGVyYWJsZVtTeW1ib2wuaXRlcmF0b3JdKCkubmV4dCgpLnZhbHVlO1xyXG4gICAgfVxyXG4gICAgSXRlcmFibGUuZmlyc3QgPSBmaXJzdDtcclxuICAgIGZ1bmN0aW9uIHNvbWUoaXRlcmFibGUsIHByZWRpY2F0ZSkge1xyXG4gICAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBpdGVyYWJsZSkge1xyXG4gICAgICAgICAgICBpZiAocHJlZGljYXRlKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBJdGVyYWJsZS5zb21lID0gc29tZTtcclxuICAgIGZ1bmN0aW9uKiBmaWx0ZXIoaXRlcmFibGUsIHByZWRpY2F0ZSkge1xyXG4gICAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBpdGVyYWJsZSkge1xyXG4gICAgICAgICAgICBpZiAocHJlZGljYXRlKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICB5aWVsZCBlbGVtZW50O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgSXRlcmFibGUuZmlsdGVyID0gZmlsdGVyO1xyXG4gICAgZnVuY3Rpb24qIG1hcChpdGVyYWJsZSwgZm4pIHtcclxuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgaXRlcmFibGUpIHtcclxuICAgICAgICAgICAgeWllbGQgZm4oZWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgSXRlcmFibGUubWFwID0gbWFwO1xyXG4gICAgZnVuY3Rpb24qIGNvbmNhdCguLi5pdGVyYWJsZXMpIHtcclxuICAgICAgICBmb3IgKGNvbnN0IGl0ZXJhYmxlIG9mIGl0ZXJhYmxlcykge1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgaXRlcmFibGUpIHtcclxuICAgICAgICAgICAgICAgIHlpZWxkIGVsZW1lbnQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBJdGVyYWJsZS5jb25jYXQgPSBjb25jYXQ7XHJcbiAgICAvKipcclxuICAgICAqIENvbnN1bWVzIGBhdE1vc3RgIGVsZW1lbnRzIGZyb20gaXRlcmFibGUgYW5kIHJldHVybnMgdGhlIGNvbnN1bWVkIGVsZW1lbnRzLFxyXG4gICAgICogYW5kIGFuIGl0ZXJhYmxlIGZvciB0aGUgcmVzdCBvZiB0aGUgZWxlbWVudHMuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGNvbnN1bWUoaXRlcmFibGUsIGF0TW9zdCA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSkge1xyXG4gICAgICAgIGNvbnN0IGNvbnN1bWVkID0gW107XHJcbiAgICAgICAgaWYgKGF0TW9zdCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW2NvbnN1bWVkLCBpdGVyYWJsZV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGl0ZXJhdG9yID0gaXRlcmFibGVbU3ltYm9sLml0ZXJhdG9yXSgpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXRNb3N0OyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgbmV4dCA9IGl0ZXJhdG9yLm5leHQoKTtcclxuICAgICAgICAgICAgaWYgKG5leHQuZG9uZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtjb25zdW1lZCwgSXRlcmFibGUuZW1wdHkoKV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3VtZWQucHVzaChuZXh0LnZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFtjb25zdW1lZCwgeyBbU3ltYm9sLml0ZXJhdG9yXSgpIHsgcmV0dXJuIGl0ZXJhdG9yOyB9IH1dO1xyXG4gICAgfVxyXG4gICAgSXRlcmFibGUuY29uc3VtZSA9IGNvbnN1bWU7XHJcbn0pKGV4cG9ydHMuSXRlcmFibGUgfHwgKGV4cG9ydHMuSXRlcmFibGUgPSB7fSkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG52YXIgZnVuY3Rpb25hbCA9IHJlcXVpcmUoJy4uLy4uLy4uL2Jhc2UvY29tbW9uL2Z1bmN0aW9uYWwvaW5kZXguanMnKTtcbnZhciBpdGVyYXRvciA9IHJlcXVpcmUoJy4uLy4uLy4uL2Jhc2UvY29tbW9uL2l0ZXJhdG9yL2luZGV4LmpzJyk7XG5cbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5mdW5jdGlvbiBtYXJrVHJhY2tlZCh4KSB7XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIHRyYWNrRGlzcG9zYWJsZSh4KSB7XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHg7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gaXNEaXNwb3NhYmxlKHRoaW5nKSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIHRoaW5nLmRpc3Bvc2UgPT09ICdmdW5jdGlvbicgJiYgdGhpbmcuZGlzcG9zZS5sZW5ndGggPT09IDA7XHJcbn1cclxuZnVuY3Rpb24gZGlzcG9zZShhcmcpIHtcclxuICAgIGlmIChpdGVyYXRvci5JdGVyYWJsZS5pcyhhcmcpKSB7XHJcbiAgICAgICAgZm9yIChsZXQgZCBvZiBhcmcpIHtcclxuICAgICAgICAgICAgaWYgKGQpIHtcclxuICAgICAgICAgICAgICAgIGQuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KGFyZykgPyBbXSA6IGFyZztcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKGFyZykge1xyXG4gICAgICAgIGFyZy5kaXNwb3NlKCk7XHJcbiAgICAgICAgcmV0dXJuIGFyZztcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBjb21iaW5lZERpc3Bvc2FibGUoLi4uZGlzcG9zYWJsZXMpIHtcclxuICAgIGRpc3Bvc2FibGVzLmZvckVhY2gobWFya1RyYWNrZWQpO1xyXG4gICAgcmV0dXJuIHRyYWNrRGlzcG9zYWJsZSh7IGRpc3Bvc2U6ICgpID0+IGRpc3Bvc2UoZGlzcG9zYWJsZXMpIH0pO1xyXG59XHJcbmZ1bmN0aW9uIHRvRGlzcG9zYWJsZShmbikge1xyXG4gICAgY29uc3Qgc2VsZiA9IHRyYWNrRGlzcG9zYWJsZSh7XHJcbiAgICAgICAgZGlzcG9zZTogKCkgPT4ge1xyXG4gICAgICAgICAgICBmbigpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHNlbGY7XHJcbn1cclxuY2xhc3MgRGlzcG9zYWJsZVN0b3JlIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuX3RvRGlzcG9zZSA9IG5ldyBTZXQoKTtcclxuICAgICAgICB0aGlzLl9pc0Rpc3Bvc2VkID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIERpc3Bvc2Ugb2YgYWxsIHJlZ2lzdGVyZWQgZGlzcG9zYWJsZXMgYW5kIG1hcmsgdGhpcyBvYmplY3QgYXMgZGlzcG9zZWQuXHJcbiAgICAgKlxyXG4gICAgICogQW55IGZ1dHVyZSBkaXNwb3NhYmxlcyBhZGRlZCB0byB0aGlzIG9iamVjdCB3aWxsIGJlIGRpc3Bvc2VkIG9mIG9uIGBhZGRgLlxyXG4gICAgICovXHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9pc0Rpc3Bvc2VkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5faXNEaXNwb3NlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5jbGVhcigpO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBEaXNwb3NlIG9mIGFsbCByZWdpc3RlcmVkIGRpc3Bvc2FibGVzIGJ1dCBkbyBub3QgbWFyayB0aGlzIG9iamVjdCBhcyBkaXNwb3NlZC5cclxuICAgICAqL1xyXG4gICAgY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5fdG9EaXNwb3NlLmZvckVhY2goaXRlbSA9PiBpdGVtLmRpc3Bvc2UoKSk7XHJcbiAgICAgICAgdGhpcy5fdG9EaXNwb3NlLmNsZWFyKCk7XHJcbiAgICB9XHJcbiAgICBhZGQodCkge1xyXG4gICAgICAgIGlmICghdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHQgPT09IHRoaXMpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcmVnaXN0ZXIgYSBkaXNwb3NhYmxlIG9uIGl0c2VsZiEnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2lzRGlzcG9zZWQpIHtcclxuICAgICAgICAgICAgaWYgKCFEaXNwb3NhYmxlU3RvcmUuRElTQUJMRV9ESVNQT1NFRF9XQVJOSU5HKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4obmV3IEVycm9yKCdUcnlpbmcgdG8gYWRkIGEgZGlzcG9zYWJsZSB0byBhIERpc3Bvc2FibGVTdG9yZSB0aGF0IGhhcyBhbHJlYWR5IGJlZW4gZGlzcG9zZWQgb2YuIFRoZSBhZGRlZCBvYmplY3Qgd2lsbCBiZSBsZWFrZWQhJykuc3RhY2spO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl90b0Rpc3Bvc2UuYWRkKHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdDtcclxuICAgIH1cclxufVxyXG5EaXNwb3NhYmxlU3RvcmUuRElTQUJMRV9ESVNQT1NFRF9XQVJOSU5HID0gZmFsc2U7XHJcbmNsYXNzIERpc3Bvc2FibGUge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5fc3RvcmUgPSBuZXcgRGlzcG9zYWJsZVN0b3JlKCk7XHJcbiAgICB9XHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuX3N0b3JlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuICAgIF9yZWdpc3Rlcih0KSB7XHJcbiAgICAgICAgaWYgKHQgPT09IHRoaXMpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcmVnaXN0ZXIgYSBkaXNwb3NhYmxlIG9uIGl0c2VsZiEnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0b3JlLmFkZCh0KTtcclxuICAgIH1cclxufVxyXG5EaXNwb3NhYmxlLk5vbmUgPSBPYmplY3QuZnJlZXplKHsgZGlzcG9zZSgpIHsgfSB9KTtcclxuLyoqXHJcbiAqIE1hbmFnZXMgdGhlIGxpZmVjeWNsZSBvZiBhIGRpc3Bvc2FibGUgdmFsdWUgdGhhdCBtYXkgYmUgY2hhbmdlZC5cclxuICpcclxuICogVGhpcyBlbnN1cmVzIHRoYXQgd2hlbiB0aGUgZGlzcG9zYWJsZSB2YWx1ZSBpcyBjaGFuZ2VkLCB0aGUgcHJldmlvdXNseSBoZWxkIGRpc3Bvc2FibGUgaXMgZGlzcG9zZWQgb2YuIFlvdSBjYW5cclxuICogYWxzbyByZWdpc3RlciBhIGBNdXRhYmxlRGlzcG9zYWJsZWAgb24gYSBgRGlzcG9zYWJsZWAgdG8gZW5zdXJlIGl0IGlzIGF1dG9tYXRpY2FsbHkgY2xlYW5lZCB1cC5cclxuICovXHJcbmNsYXNzIE11dGFibGVEaXNwb3NhYmxlIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuX2lzRGlzcG9zZWQgPSBmYWxzZTtcclxuICAgIH1cclxuICAgIGdldCB2YWx1ZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faXNEaXNwb3NlZCA/IHVuZGVmaW5lZCA6IHRoaXMuX3ZhbHVlO1xyXG4gICAgfVxyXG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2lzRGlzcG9zZWQgfHwgdmFsdWUgPT09IHRoaXMuX3ZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX3ZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIGNsZWFyKCkge1xyXG4gICAgICAgIHRoaXMudmFsdWUgPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuX2lzRGlzcG9zZWQgPSB0cnVlO1xyXG4gICAgICAgIGlmICh0aGlzLl92YWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl92YWx1ZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG59XHJcbmNsYXNzIFJlZmVyZW5jZUNvbGxlY3Rpb24ge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5yZWZlcmVuY2VzID0gbmV3IE1hcCgpO1xyXG4gICAgfVxyXG4gICAgYWNxdWlyZShrZXksIC4uLmFyZ3MpIHtcclxuICAgICAgICBsZXQgcmVmZXJlbmNlID0gdGhpcy5yZWZlcmVuY2VzLmdldChrZXkpO1xyXG4gICAgICAgIGlmICghcmVmZXJlbmNlKSB7XHJcbiAgICAgICAgICAgIHJlZmVyZW5jZSA9IHsgY291bnRlcjogMCwgb2JqZWN0OiB0aGlzLmNyZWF0ZVJlZmVyZW5jZWRPYmplY3Qoa2V5LCAuLi5hcmdzKSB9O1xyXG4gICAgICAgICAgICB0aGlzLnJlZmVyZW5jZXMuc2V0KGtleSwgcmVmZXJlbmNlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgeyBvYmplY3QgfSA9IHJlZmVyZW5jZTtcclxuICAgICAgICBjb25zdCBkaXNwb3NlID0gZnVuY3Rpb25hbC5vbmNlKCgpID0+IHtcclxuICAgICAgICAgICAgaWYgKC0tcmVmZXJlbmNlLmNvdW50ZXIgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGVzdHJveVJlZmVyZW5jZWRPYmplY3Qoa2V5LCByZWZlcmVuY2Uub2JqZWN0KTtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVmZXJlbmNlcy5kZWxldGUoa2V5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJlZmVyZW5jZS5jb3VudGVyKys7XHJcbiAgICAgICAgcmV0dXJuIHsgb2JqZWN0LCBkaXNwb3NlIH07XHJcbiAgICB9XHJcbn1cclxuY2xhc3MgSW1tb3J0YWxSZWZlcmVuY2Uge1xyXG4gICAgY29uc3RydWN0b3Iob2JqZWN0KSB7XHJcbiAgICAgICAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XHJcbiAgICB9XHJcbiAgICBkaXNwb3NlKCkgeyB9XHJcbn1cblxuZXhwb3J0cy5EaXNwb3NhYmxlID0gRGlzcG9zYWJsZTtcbmV4cG9ydHMuRGlzcG9zYWJsZVN0b3JlID0gRGlzcG9zYWJsZVN0b3JlO1xuZXhwb3J0cy5JbW1vcnRhbFJlZmVyZW5jZSA9IEltbW9ydGFsUmVmZXJlbmNlO1xuZXhwb3J0cy5NdXRhYmxlRGlzcG9zYWJsZSA9IE11dGFibGVEaXNwb3NhYmxlO1xuZXhwb3J0cy5SZWZlcmVuY2VDb2xsZWN0aW9uID0gUmVmZXJlbmNlQ29sbGVjdGlvbjtcbmV4cG9ydHMuY29tYmluZWREaXNwb3NhYmxlID0gY29tYmluZWREaXNwb3NhYmxlO1xuZXhwb3J0cy5kaXNwb3NlID0gZGlzcG9zZTtcbmV4cG9ydHMuaXNEaXNwb3NhYmxlID0gaXNEaXNwb3NhYmxlO1xuZXhwb3J0cy50b0Rpc3Bvc2FibGUgPSB0b0Rpc3Bvc2FibGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5jbGFzcyBOb2RlIHtcclxuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgICAgIHRoaXMubmV4dCA9IE5vZGUuVW5kZWZpbmVkO1xyXG4gICAgICAgIHRoaXMucHJldiA9IE5vZGUuVW5kZWZpbmVkO1xyXG4gICAgfVxyXG59XHJcbk5vZGUuVW5kZWZpbmVkID0gbmV3IE5vZGUodW5kZWZpbmVkKTtcclxuY2xhc3MgTGlua2VkTGlzdCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLl9maXJzdCA9IE5vZGUuVW5kZWZpbmVkO1xyXG4gICAgICAgIHRoaXMuX2xhc3QgPSBOb2RlLlVuZGVmaW5lZDtcclxuICAgICAgICB0aGlzLl9zaXplID0gMDtcclxuICAgIH1cclxuICAgIGdldCBzaXplKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9zaXplO1xyXG4gICAgfVxyXG4gICAgaXNFbXB0eSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZmlyc3QgPT09IE5vZGUuVW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5fZmlyc3QgPSBOb2RlLlVuZGVmaW5lZDtcclxuICAgICAgICB0aGlzLl9sYXN0ID0gTm9kZS5VbmRlZmluZWQ7XHJcbiAgICAgICAgdGhpcy5fc2l6ZSA9IDA7XHJcbiAgICB9XHJcbiAgICB1bnNoaWZ0KGVsZW1lbnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faW5zZXJ0KGVsZW1lbnQsIGZhbHNlKTtcclxuICAgIH1cclxuICAgIHB1c2goZWxlbWVudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pbnNlcnQoZWxlbWVudCwgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgICBfaW5zZXJ0KGVsZW1lbnQsIGF0VGhlRW5kKSB7XHJcbiAgICAgICAgY29uc3QgbmV3Tm9kZSA9IG5ldyBOb2RlKGVsZW1lbnQpO1xyXG4gICAgICAgIGlmICh0aGlzLl9maXJzdCA9PT0gTm9kZS5VbmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5fZmlyc3QgPSBuZXdOb2RlO1xyXG4gICAgICAgICAgICB0aGlzLl9sYXN0ID0gbmV3Tm9kZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoYXRUaGVFbmQpIHtcclxuICAgICAgICAgICAgLy8gcHVzaFxyXG4gICAgICAgICAgICBjb25zdCBvbGRMYXN0ID0gdGhpcy5fbGFzdDtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdCA9IG5ld05vZGU7XHJcbiAgICAgICAgICAgIG5ld05vZGUucHJldiA9IG9sZExhc3Q7XHJcbiAgICAgICAgICAgIG9sZExhc3QubmV4dCA9IG5ld05vZGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyB1bnNoaWZ0XHJcbiAgICAgICAgICAgIGNvbnN0IG9sZEZpcnN0ID0gdGhpcy5fZmlyc3Q7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpcnN0ID0gbmV3Tm9kZTtcclxuICAgICAgICAgICAgbmV3Tm9kZS5uZXh0ID0gb2xkRmlyc3Q7XHJcbiAgICAgICAgICAgIG9sZEZpcnN0LnByZXYgPSBuZXdOb2RlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9zaXplICs9IDE7XHJcbiAgICAgICAgbGV0IGRpZFJlbW92ZSA9IGZhbHNlO1xyXG4gICAgICAgIHJldHVybiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghZGlkUmVtb3ZlKSB7XHJcbiAgICAgICAgICAgICAgICBkaWRSZW1vdmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlKG5ld05vZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIHNoaWZ0KCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9maXJzdCA9PT0gTm9kZS5VbmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IHRoaXMuX2ZpcnN0LmVsZW1lbnQ7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZSh0aGlzLl9maXJzdCk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcG9wKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9sYXN0ID09PSBOb2RlLlVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzID0gdGhpcy5fbGFzdC5lbGVtZW50O1xyXG4gICAgICAgICAgICB0aGlzLl9yZW1vdmUodGhpcy5fbGFzdCk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgX3JlbW92ZShub2RlKSB7XHJcbiAgICAgICAgaWYgKG5vZGUucHJldiAhPT0gTm9kZS5VbmRlZmluZWQgJiYgbm9kZS5uZXh0ICE9PSBOb2RlLlVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAvLyBtaWRkbGVcclxuICAgICAgICAgICAgY29uc3QgYW5jaG9yID0gbm9kZS5wcmV2O1xyXG4gICAgICAgICAgICBhbmNob3IubmV4dCA9IG5vZGUubmV4dDtcclxuICAgICAgICAgICAgbm9kZS5uZXh0LnByZXYgPSBhbmNob3I7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG5vZGUucHJldiA9PT0gTm9kZS5VbmRlZmluZWQgJiYgbm9kZS5uZXh0ID09PSBOb2RlLlVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAvLyBvbmx5IG5vZGVcclxuICAgICAgICAgICAgdGhpcy5fZmlyc3QgPSBOb2RlLlVuZGVmaW5lZDtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdCA9IE5vZGUuVW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChub2RlLm5leHQgPT09IE5vZGUuVW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIC8vIGxhc3RcclxuICAgICAgICAgICAgdGhpcy5fbGFzdCA9IHRoaXMuX2xhc3QucHJldjtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdC5uZXh0ID0gTm9kZS5VbmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG5vZGUucHJldiA9PT0gTm9kZS5VbmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gZmlyc3RcclxuICAgICAgICAgICAgdGhpcy5fZmlyc3QgPSB0aGlzLl9maXJzdC5uZXh0O1xyXG4gICAgICAgICAgICB0aGlzLl9maXJzdC5wcmV2ID0gTm9kZS5VbmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGRvbmVcclxuICAgICAgICB0aGlzLl9zaXplIC09IDE7XHJcbiAgICB9XHJcbiAgICAqW1N5bWJvbC5pdGVyYXRvcl0oKSB7XHJcbiAgICAgICAgbGV0IG5vZGUgPSB0aGlzLl9maXJzdDtcclxuICAgICAgICB3aGlsZSAobm9kZSAhPT0gTm9kZS5VbmRlZmluZWQpIHtcclxuICAgICAgICAgICAgeWllbGQgbm9kZS5lbGVtZW50O1xyXG4gICAgICAgICAgICBub2RlID0gbm9kZS5uZXh0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRvQXJyYXkoKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgbm9kZSA9IHRoaXMuX2ZpcnN0OyBub2RlICE9PSBOb2RlLlVuZGVmaW5lZDsgbm9kZSA9IG5vZGUubmV4dCkge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaChub2RlLmVsZW1lbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG59XG5cbmV4cG9ydHMuTGlua2VkTGlzdCA9IExpbmtlZExpc3Q7XG4iLCIvLyBJbXBvcnRzXG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyBmcm9tIFwiLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2Nzc1dpdGhNYXBwaW5nVG9TdHJpbmcuanNcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18gZnJvbSBcIi4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9hcGkuanNcIjtcbnZhciBfX19DU1NfTE9BREVSX0VYUE9SVF9fXyA9IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fKTtcbi8vIE1vZHVsZVxuX19fQ1NTX0xPQURFUl9FWFBPUlRfX18ucHVzaChbbW9kdWxlLmlkLCBcIi5fX3NjX292ZXJsYXkge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgYmFja2dyb3VuZDogI2RmYjhhYjtcXG4gIGJvcmRlcjogMXB4IHNvbGlkIHJlZDtcXG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxuICBvcGFjaXR5OiAwLjM7XFxufVwiLCBcIlwiLHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIndlYnBhY2s6Ly8uL2NvbnRlbnQvc2NyZWVuLnNjc3NcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIkFBQUE7RUFDRSxrQkFBQTtFQUNBLG1CQUFBO0VBQ0EscUJBQUE7RUFDQSxzQkFBQTtFQUNBLFlBQUE7QUFDRlwiLFwic291cmNlc0NvbnRlbnRcIjpbXCIuX19zY19vdmVybGF5IHtcXHJcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXHJcXG4gIGJhY2tncm91bmQ6IHJnYigyMjMsIDE4NCwgMTcxKTtcXHJcXG4gIGJvcmRlcjogMXB4IHNvbGlkIHJlZDtcXHJcXG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxyXFxuICBvcGFjaXR5OiAuMztcXHJcXG59XCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG4vLyBFeHBvcnRzXG5leHBvcnQgZGVmYXVsdCBfX19DU1NfTE9BREVSX0VYUE9SVF9fXztcbiIsIi8vIEltcG9ydHNcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fIGZyb20gXCIuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvY3NzV2l0aE1hcHBpbmdUb1N0cmluZy5qc1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2FwaS5qc1wiO1xudmFyIF9fX0NTU19MT0FERVJfRVhQT1JUX19fID0gX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18pO1xuLy8gTW9kdWxlXG5fX19DU1NfTE9BREVSX0VYUE9SVF9fXy5wdXNoKFttb2R1bGUuaWQsIFwiLnRvb2wtbWVhc3VyZSB7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICB6LWluZGV4OiA1O1xcbiAgdG9wOiAwO1xcbiAgbGVmdDogMDtcXG59XFxuLnRvb2wtbWVhc3VyZSAuaG9yaXpvbnRhbCB7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICB0b3A6IDA7XFxuICBoZWlnaHQ6IDFweDtcXG4gIGJhY2tncm91bmQtY29sb3I6IGNvcm5mbG93ZXJibHVlO1xcbn1cXG4udG9vbC1tZWFzdXJlIC52ZXJ0aWNhbCB7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICBsZWZ0OiAwO1xcbiAgd2lkdGg6IDFweDtcXG4gIGJhY2tncm91bmQtY29sb3I6IGNvcm5mbG93ZXJibHVlO1xcbn1cXG4udG9vbC1tZWFzdXJlIC5sYWJlbCB7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICBmb250LXNpemU6IDExcHg7XFxuICBiYWNrZ3JvdW5kOiBibGFjaztcXG4gIGNvbG9yOiB3aGl0ZTtcXG4gIHBhZGRpbmc6IDNweDtcXG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxuICBvcGFjaXR5OiAxO1xcbiAgYm9yZGVyLXJhZGl1czogN3B4O1xcbn1cIiwgXCJcIix7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCJ3ZWJwYWNrOi8vLi9jb250ZW50L3Rvb2wvbWVhc3VyZS5zY3NzXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJBQUFBO0VBQ0Usa0JBQUE7RUFDQSxVQUFBO0VBQ0EsTUFBQTtFQUNBLE9BQUE7QUFDRjtBQUNFO0VBQ0Usa0JBQUE7RUFDQSxNQUFBO0VBQ0EsV0FBQTtFQUNBLGdDQUFBO0FBQ0o7QUFFRTtFQUNFLGtCQUFBO0VBQ0EsT0FBQTtFQUNBLFVBQUE7RUFDQSxnQ0FBQTtBQUFKO0FBR0U7RUFDRSxrQkFBQTtFQUNBLGVBQUE7RUFDQSxpQkFBQTtFQUNBLFlBQUE7RUFDQSxZQUFBO0VBQ0Esc0JBQUE7RUFDQSxVQUFBO0VBQ0Esa0JBQUE7QUFESlwiLFwic291cmNlc0NvbnRlbnRcIjpbXCIudG9vbC1tZWFzdXJlIHtcXHJcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXHJcXG4gIHotaW5kZXg6IDU7XFxyXFxuICB0b3A6IDA7XFxyXFxuICBsZWZ0OiAwO1xcclxcblxcclxcbiAgLmhvcml6b250YWwge1xcclxcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxyXFxuICAgIHRvcDogMDtcXHJcXG4gICAgaGVpZ2h0OiAxcHg7XFxyXFxuICAgIGJhY2tncm91bmQtY29sb3I6IGNvcm5mbG93ZXJibHVlO1xcclxcbiAgfVxcclxcblxcclxcbiAgLnZlcnRpY2FsIHtcXHJcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcclxcbiAgICBsZWZ0OiAwO1xcclxcbiAgICB3aWR0aDogMXB4O1xcclxcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiBjb3JuZmxvd2VyYmx1ZTtcXHJcXG4gIH1cXHJcXG5cXHJcXG4gIC5sYWJlbCB7XFxyXFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXHJcXG4gICAgZm9udC1zaXplOiAxMXB4O1xcclxcbiAgICBiYWNrZ3JvdW5kOiBibGFjaztcXHJcXG4gICAgY29sb3I6IHdoaXRlO1xcclxcbiAgICBwYWRkaW5nOiAzcHg7XFxyXFxuICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxyXFxuICAgIG9wYWNpdHk6IDE7XFxyXFxuICAgIGJvcmRlci1yYWRpdXM6IDdweDtcXHJcXG4gIH1cXHJcXG5cXHJcXG59XCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG4vLyBFeHBvcnRzXG5leHBvcnQgZGVmYXVsdCBfX19DU1NfTE9BREVSX0VYUE9SVF9fXztcbiIsIi8vIEltcG9ydHNcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fIGZyb20gXCIuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvY3NzV2l0aE1hcHBpbmdUb1N0cmluZy5qc1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2FwaS5qc1wiO1xudmFyIF9fX0NTU19MT0FERVJfRVhQT1JUX19fID0gX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18pO1xuLy8gTW9kdWxlXG5fX19DU1NfTE9BREVSX0VYUE9SVF9fXy5wdXNoKFttb2R1bGUuaWQsIFwiLnRvb2wtc2VsZWN0IHtcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIHotaW5kZXg6IDE7XFxuICB0b3A6IDA7XFxuICBsZWZ0OiAwO1xcbiAgcmlnaHQ6IDA7XFxuICBib3R0b206IDA7XFxuICBwb2ludGVyLWV2ZW50czogYXV0bztcXG4gIGN1cnNvcjogbm9uZTtcXG59XFxuLnRvb2wtc2VsZWN0IC5ob3ZlcmluZyB7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiBzdGVlbGJsdWU7XFxuICBib3JkZXI6IDFweCBzb2xpZCByZWQ7XFxuICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgb3BhY2l0eTogMC4xO1xcbn1cXG4udG9vbC1zZWxlY3QgLnNlbGVjdGluZyB7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiBzdGVlbGJsdWU7XFxuICBvcGFjaXR5OiAwLjE1O1xcbn1cIiwgXCJcIix7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCJ3ZWJwYWNrOi8vLi9jb250ZW50L3Rvb2wvc2VsZWN0LnNjc3NcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIkFBQUE7RUFDRSxrQkFBQTtFQUNBLFVBQUE7RUFDQSxNQUFBO0VBQ0EsT0FBQTtFQUNBLFFBQUE7RUFDQSxTQUFBO0VBQ0Esb0JBQUE7RUFDQSxZQUFBO0FBQ0Y7QUFDRTtFQUNFLGtCQUFBO0VBQ0EsMkJBQUE7RUFDQSxxQkFBQTtFQUNBLHNCQUFBO0VBQ0EsWUFBQTtBQUNKO0FBRUU7RUFDRSxrQkFBQTtFQUNBLDJCQUFBO0VBQ0EsYUFBQTtBQUFKXCIsXCJzb3VyY2VzQ29udGVudFwiOltcIi50b29sLXNlbGVjdCB7XFxyXFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxyXFxuICB6LWluZGV4OiAxO1xcclxcbiAgdG9wOiAwO1xcclxcbiAgbGVmdDogMDtcXHJcXG4gIHJpZ2h0OiAwO1xcclxcbiAgYm90dG9tOiAwO1xcclxcbiAgcG9pbnRlci1ldmVudHM6IGF1dG87XFxyXFxuICBjdXJzb3I6IG5vbmU7XFxyXFxuXFxyXFxuICAuaG92ZXJpbmcge1xcclxcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxyXFxuICAgIGJhY2tncm91bmQtY29sb3I6IHN0ZWVsYmx1ZTtcXHJcXG4gICAgYm9yZGVyOiAxcHggc29saWQgcmVkO1xcclxcbiAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcclxcbiAgICBvcGFjaXR5OiAuMTtcXHJcXG4gIH1cXHJcXG5cXHJcXG4gIC5zZWxlY3Rpbmcge1xcclxcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxyXFxuICAgIGJhY2tncm91bmQtY29sb3I6IHN0ZWVsYmx1ZTtcXHJcXG4gICAgb3BhY2l0eTogLjE1O1xcclxcbiAgfVxcclxcblxcclxcbn1cIl0sXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcbi8vIEV4cG9ydHNcbmV4cG9ydCBkZWZhdWx0IF9fX0NTU19MT0FERVJfRVhQT1JUX19fO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qXG4gIE1JVCBMaWNlbnNlIGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwXG4gIEF1dGhvciBUb2JpYXMgS29wcGVycyBAc29rcmFcbiovXG4vLyBjc3MgYmFzZSBjb2RlLCBpbmplY3RlZCBieSB0aGUgY3NzLWxvYWRlclxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGZ1bmMtbmFtZXNcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNzc1dpdGhNYXBwaW5nVG9TdHJpbmcpIHtcbiAgdmFyIGxpc3QgPSBbXTsgLy8gcmV0dXJuIHRoZSBsaXN0IG9mIG1vZHVsZXMgYXMgY3NzIHN0cmluZ1xuXG4gIGxpc3QudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHZhciBjb250ZW50ID0gY3NzV2l0aE1hcHBpbmdUb1N0cmluZyhpdGVtKTtcblxuICAgICAgaWYgKGl0ZW1bMl0pIHtcbiAgICAgICAgcmV0dXJuIFwiQG1lZGlhIFwiLmNvbmNhdChpdGVtWzJdLCBcIiB7XCIpLmNvbmNhdChjb250ZW50LCBcIn1cIik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH0pLmpvaW4oXCJcIik7XG4gIH07IC8vIGltcG9ydCBhIGxpc3Qgb2YgbW9kdWxlcyBpbnRvIHRoZSBsaXN0XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBmdW5jLW5hbWVzXG5cblxuICBsaXN0LmkgPSBmdW5jdGlvbiAobW9kdWxlcywgbWVkaWFRdWVyeSwgZGVkdXBlKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGVzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgIG1vZHVsZXMgPSBbW251bGwsIG1vZHVsZXMsIFwiXCJdXTtcbiAgICB9XG5cbiAgICB2YXIgYWxyZWFkeUltcG9ydGVkTW9kdWxlcyA9IHt9O1xuXG4gICAgaWYgKGRlZHVwZSkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBwcmVmZXItZGVzdHJ1Y3R1cmluZ1xuICAgICAgICB2YXIgaWQgPSB0aGlzW2ldWzBdO1xuXG4gICAgICAgIGlmIChpZCAhPSBudWxsKSB7XG4gICAgICAgICAgYWxyZWFkeUltcG9ydGVkTW9kdWxlc1tpZF0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IG1vZHVsZXMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICB2YXIgaXRlbSA9IFtdLmNvbmNhdChtb2R1bGVzW19pXSk7XG5cbiAgICAgIGlmIChkZWR1cGUgJiYgYWxyZWFkeUltcG9ydGVkTW9kdWxlc1tpdGVtWzBdXSkge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29udGludWVcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChtZWRpYVF1ZXJ5KSB7XG4gICAgICAgIGlmICghaXRlbVsyXSkge1xuICAgICAgICAgIGl0ZW1bMl0gPSBtZWRpYVF1ZXJ5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGl0ZW1bMl0gPSBcIlwiLmNvbmNhdChtZWRpYVF1ZXJ5LCBcIiBhbmQgXCIpLmNvbmNhdChpdGVtWzJdKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsaXN0LnB1c2goaXRlbSk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBsaXN0O1xufTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3NsaWNlZFRvQXJyYXkoYXJyLCBpKSB7IHJldHVybiBfYXJyYXlXaXRoSG9sZXMoYXJyKSB8fCBfaXRlcmFibGVUb0FycmF5TGltaXQoYXJyLCBpKSB8fCBfdW5zdXBwb3J0ZWRJdGVyYWJsZVRvQXJyYXkoYXJyLCBpKSB8fCBfbm9uSXRlcmFibGVSZXN0KCk7IH1cblxuZnVuY3Rpb24gX25vbkl0ZXJhYmxlUmVzdCgpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UuXFxuSW4gb3JkZXIgdG8gYmUgaXRlcmFibGUsIG5vbi1hcnJheSBvYmplY3RzIG11c3QgaGF2ZSBhIFtTeW1ib2wuaXRlcmF0b3JdKCkgbWV0aG9kLlwiKTsgfVxuXG5mdW5jdGlvbiBfdW5zdXBwb3J0ZWRJdGVyYWJsZVRvQXJyYXkobywgbWluTGVuKSB7IGlmICghbykgcmV0dXJuOyBpZiAodHlwZW9mIG8gPT09IFwic3RyaW5nXCIpIHJldHVybiBfYXJyYXlMaWtlVG9BcnJheShvLCBtaW5MZW4pOyB2YXIgbiA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKS5zbGljZSg4LCAtMSk7IGlmIChuID09PSBcIk9iamVjdFwiICYmIG8uY29uc3RydWN0b3IpIG4gPSBvLmNvbnN0cnVjdG9yLm5hbWU7IGlmIChuID09PSBcIk1hcFwiIHx8IG4gPT09IFwiU2V0XCIpIHJldHVybiBBcnJheS5mcm9tKG8pOyBpZiAobiA9PT0gXCJBcmd1bWVudHNcIiB8fCAvXig/OlVpfEkpbnQoPzo4fDE2fDMyKSg/OkNsYW1wZWQpP0FycmF5JC8udGVzdChuKSkgcmV0dXJuIF9hcnJheUxpa2VUb0FycmF5KG8sIG1pbkxlbik7IH1cblxuZnVuY3Rpb24gX2FycmF5TGlrZVRvQXJyYXkoYXJyLCBsZW4pIHsgaWYgKGxlbiA9PSBudWxsIHx8IGxlbiA+IGFyci5sZW5ndGgpIGxlbiA9IGFyci5sZW5ndGg7IGZvciAodmFyIGkgPSAwLCBhcnIyID0gbmV3IEFycmF5KGxlbik7IGkgPCBsZW47IGkrKykgeyBhcnIyW2ldID0gYXJyW2ldOyB9IHJldHVybiBhcnIyOyB9XG5cbmZ1bmN0aW9uIF9pdGVyYWJsZVRvQXJyYXlMaW1pdChhcnIsIGkpIHsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwidW5kZWZpbmVkXCIgfHwgIShTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpKSByZXR1cm47IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pW1wicmV0dXJuXCJdICE9IG51bGwpIF9pW1wicmV0dXJuXCJdKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfVxuXG5mdW5jdGlvbiBfYXJyYXlXaXRoSG9sZXMoYXJyKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHJldHVybiBhcnI7IH1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjc3NXaXRoTWFwcGluZ1RvU3RyaW5nKGl0ZW0pIHtcbiAgdmFyIF9pdGVtID0gX3NsaWNlZFRvQXJyYXkoaXRlbSwgNCksXG4gICAgICBjb250ZW50ID0gX2l0ZW1bMV0sXG4gICAgICBjc3NNYXBwaW5nID0gX2l0ZW1bM107XG5cbiAgaWYgKHR5cGVvZiBidG9hID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbiAgICB2YXIgYmFzZTY0ID0gYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoY3NzTWFwcGluZykpKSk7XG4gICAgdmFyIGRhdGEgPSBcInNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmLTg7YmFzZTY0LFwiLmNvbmNhdChiYXNlNjQpO1xuICAgIHZhciBzb3VyY2VNYXBwaW5nID0gXCIvKiMgXCIuY29uY2F0KGRhdGEsIFwiICovXCIpO1xuICAgIHZhciBzb3VyY2VVUkxzID0gY3NzTWFwcGluZy5zb3VyY2VzLm1hcChmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgICByZXR1cm4gXCIvKiMgc291cmNlVVJMPVwiLmNvbmNhdChjc3NNYXBwaW5nLnNvdXJjZVJvb3QgfHwgXCJcIikuY29uY2F0KHNvdXJjZSwgXCIgKi9cIik7XG4gICAgfSk7XG4gICAgcmV0dXJuIFtjb250ZW50XS5jb25jYXQoc291cmNlVVJMcykuY29uY2F0KFtzb3VyY2VNYXBwaW5nXSkuam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbY29udGVudF0uam9pbihcIlxcblwiKTtcbn07IiwiaW1wb3J0IGFwaSBmcm9tIFwiIS4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qc1wiO1xuICAgICAgICAgICAgaW1wb3J0IGNvbnRlbnQgZnJvbSBcIiEhLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi4vbm9kZV9tb2R1bGVzL3Nhc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4vc2NyZWVuLnNjc3NcIjtcblxudmFyIG9wdGlvbnMgPSB7fTtcblxub3B0aW9ucy5pbnNlcnQgPSBcImhlYWRcIjtcbm9wdGlvbnMuc2luZ2xldG9uID0gZmFsc2U7XG5cbnZhciB1cGRhdGUgPSBhcGkoY29udGVudCwgb3B0aW9ucyk7XG5cblxuXG5leHBvcnQgZGVmYXVsdCBjb250ZW50LmxvY2FscyB8fCB7fTsiLCJpbXBvcnQgYXBpIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5qZWN0U3R5bGVzSW50b1N0eWxlVGFnLmpzXCI7XG4gICAgICAgICAgICBpbXBvcnQgY29udGVudCBmcm9tIFwiISEuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcyEuLi8uLi9ub2RlX21vZHVsZXMvc2Fzcy1sb2FkZXIvZGlzdC9janMuanMhLi9tZWFzdXJlLnNjc3NcIjtcblxudmFyIG9wdGlvbnMgPSB7fTtcblxub3B0aW9ucy5pbnNlcnQgPSBcImhlYWRcIjtcbm9wdGlvbnMuc2luZ2xldG9uID0gZmFsc2U7XG5cbnZhciB1cGRhdGUgPSBhcGkoY29udGVudCwgb3B0aW9ucyk7XG5cblxuXG5leHBvcnQgZGVmYXVsdCBjb250ZW50LmxvY2FscyB8fCB7fTsiLCJpbXBvcnQgYXBpIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5qZWN0U3R5bGVzSW50b1N0eWxlVGFnLmpzXCI7XG4gICAgICAgICAgICBpbXBvcnQgY29udGVudCBmcm9tIFwiISEuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcyEuLi8uLi9ub2RlX21vZHVsZXMvc2Fzcy1sb2FkZXIvZGlzdC9janMuanMhLi9zZWxlY3Quc2Nzc1wiO1xuXG52YXIgb3B0aW9ucyA9IHt9O1xuXG5vcHRpb25zLmluc2VydCA9IFwiaGVhZFwiO1xub3B0aW9ucy5zaW5nbGV0b24gPSBmYWxzZTtcblxudmFyIHVwZGF0ZSA9IGFwaShjb250ZW50LCBvcHRpb25zKTtcblxuXG5cbmV4cG9ydCBkZWZhdWx0IGNvbnRlbnQubG9jYWxzIHx8IHt9OyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgaXNPbGRJRSA9IGZ1bmN0aW9uIGlzT2xkSUUoKSB7XG4gIHZhciBtZW1vO1xuICByZXR1cm4gZnVuY3Rpb24gbWVtb3JpemUoKSB7XG4gICAgaWYgKHR5cGVvZiBtZW1vID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gVGVzdCBmb3IgSUUgPD0gOSBhcyBwcm9wb3NlZCBieSBCcm93c2VyaGFja3NcbiAgICAgIC8vIEBzZWUgaHR0cDovL2Jyb3dzZXJoYWNrcy5jb20vI2hhY2stZTcxZDg2OTJmNjUzMzQxNzNmZWU3MTVjMjIyY2I4MDVcbiAgICAgIC8vIFRlc3RzIGZvciBleGlzdGVuY2Ugb2Ygc3RhbmRhcmQgZ2xvYmFscyBpcyB0byBhbGxvdyBzdHlsZS1sb2FkZXJcbiAgICAgIC8vIHRvIG9wZXJhdGUgY29ycmVjdGx5IGludG8gbm9uLXN0YW5kYXJkIGVudmlyb25tZW50c1xuICAgICAgLy8gQHNlZSBodHRwczovL2dpdGh1Yi5jb20vd2VicGFjay1jb250cmliL3N0eWxlLWxvYWRlci9pc3N1ZXMvMTc3XG4gICAgICBtZW1vID0gQm9vbGVhbih3aW5kb3cgJiYgZG9jdW1lbnQgJiYgZG9jdW1lbnQuYWxsICYmICF3aW5kb3cuYXRvYik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1lbW87XG4gIH07XG59KCk7XG5cbnZhciBnZXRUYXJnZXQgPSBmdW5jdGlvbiBnZXRUYXJnZXQoKSB7XG4gIHZhciBtZW1vID0ge307XG4gIHJldHVybiBmdW5jdGlvbiBtZW1vcml6ZSh0YXJnZXQpIHtcbiAgICBpZiAodHlwZW9mIG1lbW9bdGFyZ2V0XSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHZhciBzdHlsZVRhcmdldCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGFyZ2V0KTsgLy8gU3BlY2lhbCBjYXNlIHRvIHJldHVybiBoZWFkIG9mIGlmcmFtZSBpbnN0ZWFkIG9mIGlmcmFtZSBpdHNlbGZcblxuICAgICAgaWYgKHdpbmRvdy5IVE1MSUZyYW1lRWxlbWVudCAmJiBzdHlsZVRhcmdldCBpbnN0YW5jZW9mIHdpbmRvdy5IVE1MSUZyYW1lRWxlbWVudCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIFRoaXMgd2lsbCB0aHJvdyBhbiBleGNlcHRpb24gaWYgYWNjZXNzIHRvIGlmcmFtZSBpcyBibG9ja2VkXG4gICAgICAgICAgLy8gZHVlIHRvIGNyb3NzLW9yaWdpbiByZXN0cmljdGlvbnNcbiAgICAgICAgICBzdHlsZVRhcmdldCA9IHN0eWxlVGFyZ2V0LmNvbnRlbnREb2N1bWVudC5oZWFkO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgLy8gaXN0YW5idWwgaWdub3JlIG5leHRcbiAgICAgICAgICBzdHlsZVRhcmdldCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbWVtb1t0YXJnZXRdID0gc3R5bGVUYXJnZXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1lbW9bdGFyZ2V0XTtcbiAgfTtcbn0oKTtcblxudmFyIHN0eWxlc0luRG9tID0gW107XG5cbmZ1bmN0aW9uIGdldEluZGV4QnlJZGVudGlmaWVyKGlkZW50aWZpZXIpIHtcbiAgdmFyIHJlc3VsdCA9IC0xO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3R5bGVzSW5Eb20ubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoc3R5bGVzSW5Eb21baV0uaWRlbnRpZmllciA9PT0gaWRlbnRpZmllcikge1xuICAgICAgcmVzdWx0ID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIG1vZHVsZXNUb0RvbShsaXN0LCBvcHRpb25zKSB7XG4gIHZhciBpZENvdW50TWFwID0ge307XG4gIHZhciBpZGVudGlmaWVycyA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gbGlzdFtpXTtcbiAgICB2YXIgaWQgPSBvcHRpb25zLmJhc2UgPyBpdGVtWzBdICsgb3B0aW9ucy5iYXNlIDogaXRlbVswXTtcbiAgICB2YXIgY291bnQgPSBpZENvdW50TWFwW2lkXSB8fCAwO1xuICAgIHZhciBpZGVudGlmaWVyID0gXCJcIi5jb25jYXQoaWQsIFwiIFwiKS5jb25jYXQoY291bnQpO1xuICAgIGlkQ291bnRNYXBbaWRdID0gY291bnQgKyAxO1xuICAgIHZhciBpbmRleCA9IGdldEluZGV4QnlJZGVudGlmaWVyKGlkZW50aWZpZXIpO1xuICAgIHZhciBvYmogPSB7XG4gICAgICBjc3M6IGl0ZW1bMV0sXG4gICAgICBtZWRpYTogaXRlbVsyXSxcbiAgICAgIHNvdXJjZU1hcDogaXRlbVszXVxuICAgIH07XG5cbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICBzdHlsZXNJbkRvbVtpbmRleF0ucmVmZXJlbmNlcysrO1xuICAgICAgc3R5bGVzSW5Eb21baW5kZXhdLnVwZGF0ZXIob2JqKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGVzSW5Eb20ucHVzaCh7XG4gICAgICAgIGlkZW50aWZpZXI6IGlkZW50aWZpZXIsXG4gICAgICAgIHVwZGF0ZXI6IGFkZFN0eWxlKG9iaiwgb3B0aW9ucyksXG4gICAgICAgIHJlZmVyZW5jZXM6IDFcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlkZW50aWZpZXJzLnB1c2goaWRlbnRpZmllcik7XG4gIH1cblxuICByZXR1cm4gaWRlbnRpZmllcnM7XG59XG5cbmZ1bmN0aW9uIGluc2VydFN0eWxlRWxlbWVudChvcHRpb25zKSB7XG4gIHZhciBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gIHZhciBhdHRyaWJ1dGVzID0gb3B0aW9ucy5hdHRyaWJ1dGVzIHx8IHt9O1xuXG4gIGlmICh0eXBlb2YgYXR0cmlidXRlcy5ub25jZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB2YXIgbm9uY2UgPSB0eXBlb2YgX193ZWJwYWNrX25vbmNlX18gIT09ICd1bmRlZmluZWQnID8gX193ZWJwYWNrX25vbmNlX18gOiBudWxsO1xuXG4gICAgaWYgKG5vbmNlKSB7XG4gICAgICBhdHRyaWJ1dGVzLm5vbmNlID0gbm9uY2U7XG4gICAgfVxuICB9XG5cbiAgT2JqZWN0LmtleXMoYXR0cmlidXRlcykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgc3R5bGUuc2V0QXR0cmlidXRlKGtleSwgYXR0cmlidXRlc1trZXldKTtcbiAgfSk7XG5cbiAgaWYgKHR5cGVvZiBvcHRpb25zLmluc2VydCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIG9wdGlvbnMuaW5zZXJ0KHN0eWxlKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgdGFyZ2V0ID0gZ2V0VGFyZ2V0KG9wdGlvbnMuaW5zZXJ0IHx8ICdoZWFkJyk7XG5cbiAgICBpZiAoIXRhcmdldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGRuJ3QgZmluZCBhIHN0eWxlIHRhcmdldC4gVGhpcyBwcm9iYWJseSBtZWFucyB0aGF0IHRoZSB2YWx1ZSBmb3IgdGhlICdpbnNlcnQnIHBhcmFtZXRlciBpcyBpbnZhbGlkLlwiKTtcbiAgICB9XG5cbiAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICB9XG5cbiAgcmV0dXJuIHN0eWxlO1xufVxuXG5mdW5jdGlvbiByZW1vdmVTdHlsZUVsZW1lbnQoc3R5bGUpIHtcbiAgLy8gaXN0YW5idWwgaWdub3JlIGlmXG4gIGlmIChzdHlsZS5wYXJlbnROb2RlID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc3R5bGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzdHlsZSk7XG59XG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAgKi9cblxuXG52YXIgcmVwbGFjZVRleHQgPSBmdW5jdGlvbiByZXBsYWNlVGV4dCgpIHtcbiAgdmFyIHRleHRTdG9yZSA9IFtdO1xuICByZXR1cm4gZnVuY3Rpb24gcmVwbGFjZShpbmRleCwgcmVwbGFjZW1lbnQpIHtcbiAgICB0ZXh0U3RvcmVbaW5kZXhdID0gcmVwbGFjZW1lbnQ7XG4gICAgcmV0dXJuIHRleHRTdG9yZS5maWx0ZXIoQm9vbGVhbikuam9pbignXFxuJyk7XG4gIH07XG59KCk7XG5cbmZ1bmN0aW9uIGFwcGx5VG9TaW5nbGV0b25UYWcoc3R5bGUsIGluZGV4LCByZW1vdmUsIG9iaikge1xuICB2YXIgY3NzID0gcmVtb3ZlID8gJycgOiBvYmoubWVkaWEgPyBcIkBtZWRpYSBcIi5jb25jYXQob2JqLm1lZGlhLCBcIiB7XCIpLmNvbmNhdChvYmouY3NzLCBcIn1cIikgOiBvYmouY3NzOyAvLyBGb3Igb2xkIElFXG5cbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICAqL1xuXG4gIGlmIChzdHlsZS5zdHlsZVNoZWV0KSB7XG4gICAgc3R5bGUuc3R5bGVTaGVldC5jc3NUZXh0ID0gcmVwbGFjZVRleHQoaW5kZXgsIGNzcyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGNzc05vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjc3MpO1xuICAgIHZhciBjaGlsZE5vZGVzID0gc3R5bGUuY2hpbGROb2RlcztcblxuICAgIGlmIChjaGlsZE5vZGVzW2luZGV4XSkge1xuICAgICAgc3R5bGUucmVtb3ZlQ2hpbGQoY2hpbGROb2Rlc1tpbmRleF0pO1xuICAgIH1cblxuICAgIGlmIChjaGlsZE5vZGVzLmxlbmd0aCkge1xuICAgICAgc3R5bGUuaW5zZXJ0QmVmb3JlKGNzc05vZGUsIGNoaWxkTm9kZXNbaW5kZXhdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGUuYXBwZW5kQ2hpbGQoY3NzTm9kZSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGFwcGx5VG9UYWcoc3R5bGUsIG9wdGlvbnMsIG9iaikge1xuICB2YXIgY3NzID0gb2JqLmNzcztcbiAgdmFyIG1lZGlhID0gb2JqLm1lZGlhO1xuICB2YXIgc291cmNlTWFwID0gb2JqLnNvdXJjZU1hcDtcblxuICBpZiAobWVkaWEpIHtcbiAgICBzdHlsZS5zZXRBdHRyaWJ1dGUoJ21lZGlhJywgbWVkaWEpO1xuICB9IGVsc2Uge1xuICAgIHN0eWxlLnJlbW92ZUF0dHJpYnV0ZSgnbWVkaWEnKTtcbiAgfVxuXG4gIGlmIChzb3VyY2VNYXAgJiYgdHlwZW9mIGJ0b2EgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgY3NzICs9IFwiXFxuLyojIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxcIi5jb25jYXQoYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoc291cmNlTWFwKSkpKSwgXCIgKi9cIik7XG4gIH0gLy8gRm9yIG9sZCBJRVxuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAgKi9cblxuXG4gIGlmIChzdHlsZS5zdHlsZVNoZWV0KSB7XG4gICAgc3R5bGUuc3R5bGVTaGVldC5jc3NUZXh0ID0gY3NzO1xuICB9IGVsc2Uge1xuICAgIHdoaWxlIChzdHlsZS5maXJzdENoaWxkKSB7XG4gICAgICBzdHlsZS5yZW1vdmVDaGlsZChzdHlsZS5maXJzdENoaWxkKTtcbiAgICB9XG5cbiAgICBzdHlsZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjc3MpKTtcbiAgfVxufVxuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcbnZhciBzaW5nbGV0b25Db3VudGVyID0gMDtcblxuZnVuY3Rpb24gYWRkU3R5bGUob2JqLCBvcHRpb25zKSB7XG4gIHZhciBzdHlsZTtcbiAgdmFyIHVwZGF0ZTtcbiAgdmFyIHJlbW92ZTtcblxuICBpZiAob3B0aW9ucy5zaW5nbGV0b24pIHtcbiAgICB2YXIgc3R5bGVJbmRleCA9IHNpbmdsZXRvbkNvdW50ZXIrKztcbiAgICBzdHlsZSA9IHNpbmdsZXRvbiB8fCAoc2luZ2xldG9uID0gaW5zZXJ0U3R5bGVFbGVtZW50KG9wdGlvbnMpKTtcbiAgICB1cGRhdGUgPSBhcHBseVRvU2luZ2xldG9uVGFnLmJpbmQobnVsbCwgc3R5bGUsIHN0eWxlSW5kZXgsIGZhbHNlKTtcbiAgICByZW1vdmUgPSBhcHBseVRvU2luZ2xldG9uVGFnLmJpbmQobnVsbCwgc3R5bGUsIHN0eWxlSW5kZXgsIHRydWUpO1xuICB9IGVsc2Uge1xuICAgIHN0eWxlID0gaW5zZXJ0U3R5bGVFbGVtZW50KG9wdGlvbnMpO1xuICAgIHVwZGF0ZSA9IGFwcGx5VG9UYWcuYmluZChudWxsLCBzdHlsZSwgb3B0aW9ucyk7XG5cbiAgICByZW1vdmUgPSBmdW5jdGlvbiByZW1vdmUoKSB7XG4gICAgICByZW1vdmVTdHlsZUVsZW1lbnQoc3R5bGUpO1xuICAgIH07XG4gIH1cblxuICB1cGRhdGUob2JqKTtcbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZVN0eWxlKG5ld09iaikge1xuICAgIGlmIChuZXdPYmopIHtcbiAgICAgIGlmIChuZXdPYmouY3NzID09PSBvYmouY3NzICYmIG5ld09iai5tZWRpYSA9PT0gb2JqLm1lZGlhICYmIG5ld09iai5zb3VyY2VNYXAgPT09IG9iai5zb3VyY2VNYXApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB1cGRhdGUob2JqID0gbmV3T2JqKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVtb3ZlKCk7XG4gICAgfVxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChsaXN0LCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9OyAvLyBGb3JjZSBzaW5nbGUtdGFnIHNvbHV0aW9uIG9uIElFNi05LCB3aGljaCBoYXMgYSBoYXJkIGxpbWl0IG9uIHRoZSAjIG9mIDxzdHlsZT5cbiAgLy8gdGFncyBpdCB3aWxsIGFsbG93IG9uIGEgcGFnZVxuXG4gIGlmICghb3B0aW9ucy5zaW5nbGV0b24gJiYgdHlwZW9mIG9wdGlvbnMuc2luZ2xldG9uICE9PSAnYm9vbGVhbicpIHtcbiAgICBvcHRpb25zLnNpbmdsZXRvbiA9IGlzT2xkSUUoKTtcbiAgfVxuXG4gIGxpc3QgPSBsaXN0IHx8IFtdO1xuICB2YXIgbGFzdElkZW50aWZpZXJzID0gbW9kdWxlc1RvRG9tKGxpc3QsIG9wdGlvbnMpO1xuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlKG5ld0xpc3QpIHtcbiAgICBuZXdMaXN0ID0gbmV3TGlzdCB8fCBbXTtcblxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobmV3TGlzdCkgIT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhc3RJZGVudGlmaWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGlkZW50aWZpZXIgPSBsYXN0SWRlbnRpZmllcnNbaV07XG4gICAgICB2YXIgaW5kZXggPSBnZXRJbmRleEJ5SWRlbnRpZmllcihpZGVudGlmaWVyKTtcbiAgICAgIHN0eWxlc0luRG9tW2luZGV4XS5yZWZlcmVuY2VzLS07XG4gICAgfVxuXG4gICAgdmFyIG5ld0xhc3RJZGVudGlmaWVycyA9IG1vZHVsZXNUb0RvbShuZXdMaXN0LCBvcHRpb25zKTtcblxuICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBsYXN0SWRlbnRpZmllcnMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICB2YXIgX2lkZW50aWZpZXIgPSBsYXN0SWRlbnRpZmllcnNbX2ldO1xuXG4gICAgICB2YXIgX2luZGV4ID0gZ2V0SW5kZXhCeUlkZW50aWZpZXIoX2lkZW50aWZpZXIpO1xuXG4gICAgICBpZiAoc3R5bGVzSW5Eb21bX2luZGV4XS5yZWZlcmVuY2VzID09PSAwKSB7XG4gICAgICAgIHN0eWxlc0luRG9tW19pbmRleF0udXBkYXRlcigpO1xuXG4gICAgICAgIHN0eWxlc0luRG9tLnNwbGljZShfaW5kZXgsIDEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxhc3RJZGVudGlmaWVycyA9IG5ld0xhc3RJZGVudGlmaWVycztcbiAgfTtcbn07IiwiZXhwb3J0IGNsYXNzIEJveE1hbmFnZXIge1xyXG5cclxuICBwcml2YXRlIGJveGVzXzogSFRNTEVsZW1lbnRbXSA9IFtdO1xyXG4gIGdldCBib3hlcygpOiByZWFkb25seSBIVE1MRWxlbWVudFtdIHsgcmV0dXJuIHRoaXMuYm94ZXNfOyB9XHJcblxyXG4gIGFkZChkb206IEhUTUxFbGVtZW50KSB7XHJcbiAgICBpZiAodGhpcy5ib3hlc18uaW5kZXhPZihkb20pICE9IC0xKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMuYm94ZXNfLnB1c2goZG9tKTtcclxuICB9XHJcblxyXG4gIHJlbW92ZShkb206IEhUTUxFbGVtZW50KSB7XHJcbiAgICBjb25zdCBpZHggPSB0aGlzLmJveGVzXy5pbmRleE9mKGRvbSk7XHJcbiAgICBpZiAoaWR4ID09IC0xKSByZXR1cm47XHJcbiAgICB0aGlzLmJveGVzXy5zcGxpY2UoaWR4LCAxKTtcclxuICB9XHJcblxyXG4gIGhhcyhkb206IEhUTUxFbGVtZW50KSB7XHJcbiAgICByZXR1cm4gdGhpcy5ib3hlc18uaW5kZXhPZihkb20pICE9IC0xO1xyXG4gIH1cclxuXHJcbiAgdmFsaWRhdGUoKSB7XHJcbiAgICB0aGlzLmJveGVzXyA9IHRoaXMuYm94ZXNfLmZpbHRlcihiID0+IGRvY3VtZW50LmJvZHkuY29udGFpbnMoYikpO1xyXG4gIH1cclxuXHJcbn0iLCJpbXBvcnQgeyBNZWFzdXJlIH0gZnJvbSAnY29udGVudC9tZWFzdXJlJztcclxuaW1wb3J0IHsgU2NyZWVuIH0gZnJvbSAnY29udGVudC9zY3JlZW4nO1xyXG5cclxuY29uc3Qgc2NyZWVuID0gbmV3IFNjcmVlbihuZXcgTWVhc3VyZSgpKTtcclxuXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIGUgPT4ge1xyXG4gIGlmIChlLmtleSA9PT0gJ20nKSB7XHJcbiAgICBzY3JlZW4udG9nZ2xlKCk7XHJcbiAgfVxyXG59LCB7XHJcbiAgY2FwdHVyZTogdHJ1ZVxyXG59KVxyXG5cclxuZnVuY3Rpb24gdXBkYXRlKCkge1xyXG4gIHNjcmVlbi51cGRhdGUoKTtcclxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodXBkYXRlKTtcclxufVxyXG5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodXBkYXRlKTsiLCJpbXBvcnQgeyBnZXRPdmVybGFwcGluZ0RpbSwgZ2V0UmVjdERpbSwgaXNQb2ludEluUmVjdCwgaXNSZWN0SW5SZWN0LCBSZWN0LCBVTklRVUVfSUQgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJTWVhc3VyZSB7XHJcbiAgZ2V0U21hbGxlc3RET01BdCh4OiBudW1iZXIsIHk6IG51bWJlcik6IEhUTUxFbGVtZW50O1xyXG4gIGdldEJlc3RNYXRjaGVkRE9NSW5zaWRlKHJlY3Q6IFJlY3QpOiBIVE1MRWxlbWVudDtcclxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3QoZG9tOiBIVE1MRWxlbWVudCk6IERPTVJlY3Q7XHJcbiAgZ2V0QmVzdE1hdGNoZWRQYXJlbnRET00oZG9tOiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50O1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTWVhc3VyZSBpbXBsZW1lbnRzIElNZWFzdXJlIHtcclxuXHJcbiAgcHJpdmF0ZSAqaXRlcmF0ZURPTXMoKTogR2VuZXJhdG9yPEhUTUxFbGVtZW50PiB7XHJcbiAgICBjb25zdCBhbGwgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcIipcIik7XHJcbiAgICBmb3IgKGNvbnN0IGVsIG9mIGFsbCkge1xyXG4gICAgICBpZiAoZWwuY2xhc3NMaXN0LmNvbnRhaW5zKFVOSVFVRV9JRCkpIGNvbnRpbnVlO1xyXG4gICAgICB5aWVsZCBlbCBhcyBIVE1MRWxlbWVudDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGdldFNtYWxsZXN0RE9NQXQoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBIVE1MRWxlbWVudCB7XHJcbiAgICBsZXQgYmVzdDogRWxlbWVudDtcclxuICAgIGxldCBiZXN0RGltOiBudW1iZXIgPSBJbmZpbml0eTtcclxuICAgIGNvbnN0IGRvbXMgPSB0aGlzLml0ZXJhdGVET01zKCk7XHJcbiAgICBmb3IgKGNvbnN0IGVsIG9mIGRvbXMpIHtcclxuICAgICAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICBpZiAoaXNQb2ludEluUmVjdCh4LCB5LCByZWN0KSkge1xyXG4gICAgICAgIGNvbnN0IGRpbSA9IGdldFJlY3REaW0ocmVjdCk7XHJcbiAgICAgICAgaWYgKGJlc3REaW0gPiBkaW0pIHtcclxuICAgICAgICAgIGJlc3QgPSBlbDtcclxuICAgICAgICAgIGJlc3REaW0gPSBkaW07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYmVzdCBhcyBIVE1MRWxlbWVudDtcclxuICB9XHJcblxyXG4gIGdldEJlc3RNYXRjaGVkRE9NSW5zaWRlKHJlY3Q6IFJlY3QpOiBIVE1MRWxlbWVudCB7XHJcbiAgICBsZXQgYmVzdDogRWxlbWVudDtcclxuICAgIGxldCBiZXN0RGltOiBudW1iZXIgPSAwO1xyXG4gICAgY29uc3QgZG9tcyA9IHRoaXMuaXRlcmF0ZURPTXMoKTtcclxuICAgIGZvciAoY29uc3QgZWwgb2YgZG9tcykge1xyXG4gICAgICBjb25zdCBlbFJlY3QgPSB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdChlbCk7XHJcbiAgICAgIGlmICghaXNSZWN0SW5SZWN0KHJlY3QsIGVsUmVjdCkpIGNvbnRpbnVlO1xyXG4gICAgICBjb25zdCBkaW0gPSBnZXRSZWN0RGltKGVsUmVjdCk7XHJcbiAgICAgIGlmIChiZXN0RGltIDw9IGRpbSkge1xyXG4gICAgICAgIGJlc3QgPSBlbDtcclxuICAgICAgICBiZXN0RGltID0gZGltO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYmVzdCBhcyBIVE1MRWxlbWVudDtcclxuICB9XHJcblxyXG4gIGdldEJvdW5kaW5nQ2xpZW50UmVjdChkb206IEhUTUxFbGVtZW50KTogRE9NUmVjdCB7XHJcbiAgICByZXR1cm4gZG9tLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gIH1cclxuXHJcbiAgZ2V0QmVzdE1hdGNoZWRQYXJlbnRET00oZG9tOiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHtcclxuICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcclxuICB9XHJcblxyXG59IiwiaW1wb3J0ICcuL3NjcmVlbi5zY3NzJztcclxuaW1wb3J0IHsgRW1pdHRlciB9IGZyb20gJ0BvcmFuZ2U0Z2xhY2UvdnMtbGliL2Jhc2UvY29tbW9uL2V2ZW50JztcclxuaW1wb3J0IHsgQm94TWFuYWdlciB9IGZyb20gJ2NvbnRlbnQvYm94TWFuYWdlcic7XHJcbmltcG9ydCB7IFNjcmVlbk1lYXN1cmVUb29sIH0gZnJvbSAnY29udGVudC90b29sL21lYXN1cmUnO1xyXG5pbXBvcnQgeyBTY3JlZW5TZWxlY3RUb29sIH0gZnJvbSAnY29udGVudC90b29sL3NlbGVjdCc7XHJcbmltcG9ydCB7IElTY3JlZW5Ub29sIH0gZnJvbSAnY29udGVudC90b29sL3Rvb2wnO1xyXG5pbXBvcnQgeyBhcHBseURPTVJlY3QsIFVOSVFVRV9JRCB9IGZyb20gJ2NvbnRlbnQvdXRpbCc7XHJcbmltcG9ydCB7IElNZWFzdXJlIH0gZnJvbSAnLi9tZWFzdXJlJztcclxuXHJcbmV4cG9ydCBjbGFzcyBTY3JlZW4ge1xyXG5cclxuICBwcml2YXRlIG9uTW91c2Vtb3ZlXyA9IG5ldyBFbWl0dGVyPHZvaWQ+KCk7XHJcbiAgcmVhZG9ubHkgb25Nb3VzZW1vdmUgPSB0aGlzLm9uTW91c2Vtb3ZlXy5ldmVudDtcclxuXHJcbiAgcHJpdmF0ZSBkb21fOiBIVE1MRWxlbWVudDtcclxuICBnZXQgZG9tKCkgeyByZXR1cm4gdGhpcy5kb21fOyB9XHJcblxyXG4gIHByaXZhdGUgcGFnZVhfOiBudW1iZXIgPSAwO1xyXG4gIGdldCBwYWdlWCgpIHsgcmV0dXJuIHRoaXMucGFnZVhfOyB9XHJcbiAgcHJpdmF0ZSBwYWdlWV86IG51bWJlciA9IDA7XHJcbiAgZ2V0IHBhZ2VZKCkgeyByZXR1cm4gdGhpcy5wYWdlWV87IH1cclxuXHJcbiAgcHJpdmF0ZSBzY3JlZW5YXzogbnVtYmVyID0gMDtcclxuICBnZXQgc2NyZWVuWCgpIHsgcmV0dXJuIHRoaXMuc2NyZWVuWF87IH1cclxuICBwcml2YXRlIHNjcmVlbllfOiBudW1iZXIgPSAwO1xyXG4gIGdldCBzY3JlZW5ZKCkgeyByZXR1cm4gdGhpcy5zY3JlZW5ZXzsgfVxyXG5cclxuICBwcml2YXRlIGNsaWVudFhfOiBudW1iZXIgPSAwO1xyXG4gIGdldCBjbGllbnRYKCkgeyByZXR1cm4gdGhpcy5jbGllbnRYXzsgfVxyXG4gIHByaXZhdGUgY2xpZW50WV86IG51bWJlciA9IDA7XHJcbiAgZ2V0IGNsaWVudFkoKSB7IHJldHVybiB0aGlzLmNsaWVudFlfOyB9XHJcblxyXG4gIHByaXZhdGUgY3VycmVudFRvb2xfOiBJU2NyZWVuVG9vbDtcclxuICBnZXQgY3VycmVudFRvb2woKSB7IHJldHVybiB0aGlzLmN1cnJlbnRUb29sXzsgfVxyXG5cclxuICBwcml2YXRlIHdpZHRoXzogbnVtYmVyO1xyXG4gIHByaXZhdGUgaGVpZ2h0XzogbnVtYmVyO1xyXG4gIGdldCB3aWR0aCgpIHsgcmV0dXJuIHRoaXMud2lkdGhfOyB9XHJcbiAgZ2V0IGhlaWdodCgpIHsgcmV0dXJuIHRoaXMuaGVpZ2h0XzsgfVxyXG5cclxuICByZWFkb25seSBib3hlczogQm94TWFuYWdlcjtcclxuXHJcbiAgcHJpdmF0ZSBib3hPdmVybGF5c186IFtIVE1MRWxlbWVudCwgSFRNTEVsZW1lbnRdW10gPSBbXTtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICByZWFkb25seSBtZWFzdXJlOiBJTWVhc3VyZVxyXG4gICkge1xyXG4gICAgdGhpcy5ib3hlcyA9IG5ldyBCb3hNYW5hZ2VyKCk7XHJcbiAgICBcclxuICAgIHRoaXMuZG9tXyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGhpcy5kb21fLmNsYXNzTmFtZSA9IGAke1VOSVFVRV9JRH1gXHJcbiAgICB0aGlzLmRvbV8uc2V0QXR0cmlidXRlKCdzdHlsZScsIGBcclxuICAgICAgcG9zaXRpb246IGZpeGVkO1xyXG4gICAgICB6LWluZGV4OiA5OTk5OTk5OTtcclxuICAgICAgdG9wOiAwO1xyXG4gICAgICBsZWZ0OiAwO1xyXG4gICAgICBib3R0b206IDA7XHJcbiAgICAgIHJpZ2h0OiAwO1xyXG4gICAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcclxuICAgIGApO1xyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmQodGhpcy5kb21fKTtcclxuXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZSA9PiB7XHJcbiAgICAgIHRoaXMucGFnZVhfID0gZS5wYWdlWDtcclxuICAgICAgdGhpcy5wYWdlWV8gPSBlLnBhZ2VZO1xyXG4gICAgICB0aGlzLnNjcmVlblhfID0gZS5zY3JlZW5YO1xyXG4gICAgICB0aGlzLnNjcmVlbllfID0gZS5zY3JlZW5ZO1xyXG4gICAgICB0aGlzLmNsaWVudFhfID0gZS5jbGllbnRYO1xyXG4gICAgICB0aGlzLmNsaWVudFlfID0gZS5jbGllbnRZO1xyXG4gICAgICB0aGlzLm9uTW91c2Vtb3ZlXy5maXJlKCk7XHJcbiAgICB9LCB7XHJcbiAgICAgIGNhcHR1cmU6IHRydWVcclxuICAgIH0pO1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHRoaXMucmVzaXplKCkpO1xyXG4gICAgdGhpcy5yZXNpemUoKTtcclxuXHJcbiAgICBjb25zdCBtZWFzdXJlVG9vbCA9IG5ldyBTY3JlZW5NZWFzdXJlVG9vbCh0aGlzKTtcclxuICAgIGNvbnN0IHNlbGVjdFRvb2wgPSBuZXcgU2NyZWVuU2VsZWN0VG9vbCh0aGlzKTtcclxuICAgIG1lYXN1cmVUb29sLm9uQWN0aXZhdGUoKTtcclxuICAgIHNlbGVjdFRvb2wub25BY3RpdmF0ZSgpO1xyXG4gICAgLy8gdGhpcy5zZXRUb29sKHNlbGVjdFRvb2wpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZXNpemUoKSB7XHJcbiAgICB0aGlzLndpZHRoXyA9IHRoaXMuZG9tXy5vZmZzZXRXaWR0aDtcclxuICAgIHRoaXMuaGVpZ2h0XyA9IHRoaXMuZG9tLm9mZnNldEhlaWdodDtcclxuICB9XHJcblxyXG4gIHNldFRvb2wodG9vbDogSVNjcmVlblRvb2wpIHtcclxuICAgIC8vIGlmICh0aGlzLmN1cnJlbnRUb29sXykge1xyXG4gICAgLy8gICB0aGlzLmN1cnJlbnRUb29sXy5vbkRlYWN0aXZhdGUoKTsgXHJcbiAgICAvLyB9XHJcbiAgICAvLyB0aGlzLmN1cnJlbnRUb29sXyA9IHRvb2w7XHJcbiAgICAvLyBpZiAodGhpcy5jdXJyZW50VG9vbF8pIHtcclxuICAgIC8vICAgdGhpcy5jdXJyZW50VG9vbF8ub25BY3RpdmF0ZSgpO1xyXG4gICAgLy8gfVxyXG4gIH1cclxuXHJcbiAgdXBkYXRlKCkge1xyXG4gICAgdGhpcy5ib3hlcy52YWxpZGF0ZSgpO1xyXG4gICAgY29uc3QgcmVtb3ZlcyA9IHRoaXMuYm94T3ZlcmxheXNfLmZpbHRlcihvID0+ICF0aGlzLmJveGVzLmhhcyhvWzBdKSk7XHJcbiAgICBjb25zdCBuZXdPdmVybGF5cyA9IHRoaXMuYm94T3ZlcmxheXNfLmZpbHRlcihvID0+IHRoaXMuYm94ZXMuaGFzKG9bMF0pKTtcclxuICAgIHJlbW92ZXMuZm9yRWFjaChybSA9PiBybVsxXS5yZW1vdmUoKSk7XHJcbiAgICBjb25zdCBhcHBlbmRzID0gdGhpcy5ib3hlcy5ib3hlcy5maWx0ZXIoYiA9PiAhISF0aGlzLmJveE92ZXJsYXlzXy5maW5kKG8gPT4gb1swXSA9PT0gYikpO1xyXG4gICAgZm9yIChjb25zdCBhIG9mIGFwcGVuZHMpIHtcclxuICAgICAgY29uc3Qgb3ZlcmxheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBvdmVybGF5LmNsYXNzTmFtZSA9IGAke1VOSVFVRV9JRH0gX19zY19vdmVybGF5YDtcclxuICAgICAgdGhpcy5kb21fLmFwcGVuZChvdmVybGF5KTtcclxuICAgICAgbmV3T3ZlcmxheXMucHVzaChbYSwgb3ZlcmxheV0pO1xyXG4gICAgfVxyXG4gICAgdGhpcy5ib3hPdmVybGF5c18gPSBuZXdPdmVybGF5cztcclxuICAgIGZvciAoY29uc3QgbyBvZiB0aGlzLmJveE92ZXJsYXlzXykge1xyXG4gICAgICBhcHBseURPTVJlY3Qob1sxXSwgdGhpcy5tZWFzdXJlLmdldEJvdW5kaW5nQ2xpZW50UmVjdChvWzBdKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBlbmFibGUoKSB7XHJcbiAgICB0aGlzLmRvbS5zdHlsZS5kaXNwbGF5ID0gJ2luaGVyaXQnO1xyXG4gIH1cclxuICBcclxuICBkaXNhYmxlKCkge1xyXG4gICAgdGhpcy5kb21fLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgfVxyXG5cclxuICB0b2dnbGUoKSB7XHJcbiAgICBpZiAodGhpcy5kb20uc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnKSB0aGlzLmVuYWJsZSgpO1xyXG4gICAgZWxzZSB0aGlzLmRpc2FibGUoKTtcclxuICB9XHJcblxyXG59IiwiaW1wb3J0ICcuL21lYXN1cmUuc2Nzcyc7XHJcbmltcG9ydCB7IERpc3Bvc2FibGVTdG9yZSB9IGZyb20gJ0BvcmFuZ2U0Z2xhY2UvdnMtbGliL2Jhc2UvY29tbW9uL2xpZmVjeWNsZSc7XHJcbmltcG9ydCB7IFNjcmVlbiB9IGZyb20gJy4uL3NjcmVlbic7XHJcbmltcG9ydCB7IElTY3JlZW5Ub29sIH0gZnJvbSAnLi90b29sJztcclxuaW1wb3J0IHsgZ2V0UmVjdERpbSwgaXNQb2ludEluUmVjdCwgcmF5Y2FzdCwgVU5JUVVFX0lEIH0gZnJvbSAnY29udGVudC91dGlsJztcclxuXHJcbmV4cG9ydCBjbGFzcyBTY3JlZW5NZWFzdXJlVG9vbCBpbXBsZW1lbnRzIElTY3JlZW5Ub29sIHtcclxuICBzdGF0aWMgcmVhZG9ubHkgTkFNRSA9ICdTY3JlZW5NZWFzdXJlVG9vbCc7XHJcblxyXG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZyA9IFNjcmVlbk1lYXN1cmVUb29sLk5BTUU7XHJcblxyXG4gIHByaXZhdGUgZGlzcG9zYWJsZXNfOiBEaXNwb3NhYmxlU3RvcmU7XHJcblxyXG4gIHByaXZhdGUgZG9tXzogSFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgcHJpdmF0ZSBjdHhfOiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcbiAgcHJpdmF0ZSBob3Jpem9udGFsRE9NXzogSFRNTEVsZW1lbnQ7XHJcbiAgcHJpdmF0ZSB2ZXJ0aWNhbERPTV86IEhUTUxFbGVtZW50O1xyXG5cclxuICBwcml2YXRlIGhvcml6b250YWxMYWJlbERPTV86IEhUTUxFbGVtZW50O1xyXG4gIHByaXZhdGUgdmVydGljYWxMYWJlbERPTV86IEhUTUxFbGVtZW50O1xyXG5cclxuICBwcml2YXRlIHdpZHRoTGFiZWxET01fOiBIVE1MRWxlbWVudDtcclxuICBwcml2YXRlIGhlaWdodExhYmVsRE9NXzogSFRNTEVsZW1lbnQ7XHJcblxyXG4gIHByaXZhdGUgaW50ZXJ2YWxfOiBhbnk7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcmVhZG9ubHkgc2NyZWVuOiBTY3JlZW5cclxuICApIHtcclxuICAgIHRoaXMuZHJhdyA9IHRoaXMuZHJhdy5iaW5kKHRoaXMpO1xyXG5cclxuICAgIHRoaXMuZG9tXyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgdGhpcy5jdHhfID0gdGhpcy5kb21fLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4gdGhpcy5yZXNpemUoKSk7XHJcbiAgICB0aGlzLnJlc2l6ZSgpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZXNpemUoKSB7XHJcbiAgICB0aGlzLmRvbV8ud2lkdGggPSB0aGlzLnNjcmVlbi5kb20ub2Zmc2V0V2lkdGg7XHJcbiAgICB0aGlzLmRvbV8uaGVpZ2h0ID0gdGhpcy5zY3JlZW4uZG9tLm9mZnNldEhlaWdodDtcclxuICB9XHJcblxyXG4gIG9uQWN0aXZhdGUoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRpc3Bvc2FibGVzXyA9IG5ldyBEaXNwb3NhYmxlU3RvcmUoKTtcclxuXHJcbiAgICB0aGlzLmhvcml6b250YWxET01fID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLnZlcnRpY2FsRE9NXyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGhpcy5ob3Jpem9udGFsTGFiZWxET01fID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLnZlcnRpY2FsTGFiZWxET01fID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLndpZHRoTGFiZWxET01fID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmhlaWdodExhYmVsRE9NXyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGhpcy5kb21fLmNsYXNzTmFtZSA9IGAke1VOSVFVRV9JRH0gdG9vbC1tZWFzdXJlYDtcclxuICAgIHRoaXMuaG9yaXpvbnRhbERPTV8uY2xhc3NOYW1lID0gYCR7VU5JUVVFX0lEfSBob3Jpem9udGFsYDtcclxuICAgIHRoaXMudmVydGljYWxET01fLmNsYXNzTmFtZSA9IGAke1VOSVFVRV9JRH0gdmVydGljYWxgO1xyXG4gICAgdGhpcy5ob3Jpem9udGFsTGFiZWxET01fLmNsYXNzTmFtZSA9IGAke1VOSVFVRV9JRH0gbGFiZWwgbGFiZWwtaG9yaXpvbnRhbGA7XHJcbiAgICB0aGlzLnZlcnRpY2FsTGFiZWxET01fLmNsYXNzTmFtZSA9IGAke1VOSVFVRV9JRH0gbGFiZWwgbGFiZWwtdmVydGljYWxgO1xyXG4gICAgdGhpcy53aWR0aExhYmVsRE9NXy5jbGFzc05hbWUgPSBgJHtVTklRVUVfSUR9IGxhYmVsIGxhYmVsLWhvcml6b250YWxgO1xyXG4gICAgdGhpcy5oZWlnaHRMYWJlbERPTV8uY2xhc3NOYW1lID0gYCR7VU5JUVVFX0lEfSBsYWJlbCBsYWJlbC12ZXJ0aWNhbGA7XHJcbiAgICB0aGlzLmRvbV8uYXBwZW5kKHRoaXMuaG9yaXpvbnRhbERPTV8pO1xyXG4gICAgdGhpcy5kb21fLmFwcGVuZCh0aGlzLnZlcnRpY2FsRE9NXyk7XHJcbiAgICB0aGlzLmRvbV8uYXBwZW5kKHRoaXMuaG9yaXpvbnRhbExhYmVsRE9NXyk7XHJcbiAgICB0aGlzLmRvbV8uYXBwZW5kKHRoaXMudmVydGljYWxMYWJlbERPTV8pO1xyXG4gICAgdGhpcy5kb21fLmFwcGVuZCh0aGlzLndpZHRoTGFiZWxET01fKTtcclxuICAgIHRoaXMuZG9tXy5hcHBlbmQodGhpcy5oZWlnaHRMYWJlbERPTV8pO1xyXG4gICAgdGhpcy5zY3JlZW4uZG9tLmFwcGVuZCh0aGlzLmRvbV8pO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zYWJsZXNfLmFkZCh0aGlzLnNjcmVlbi5vbk1vdXNlbW92ZSgoKSA9PiB0aGlzLmRyYXcoKSkpO1xyXG4gICAgdGhpcy5pbnRlcnZhbF8gPSBzZXRJbnRlcnZhbCh0aGlzLmRyYXcsIDMzKTtcclxuICB9XHJcblxyXG4gIG9uRGVhY3RpdmF0ZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZG9tXy5yZW1vdmUoKTtcclxuICAgIHRoaXMuZGlzcG9zYWJsZXNfLmRpc3Bvc2UoKTtcclxuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbF8pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBkcmF3KCkge1xyXG4gICAgY29uc3QgeCA9IHRoaXMuc2NyZWVuLmNsaWVudFg7XHJcbiAgICBjb25zdCB5ID0gdGhpcy5zY3JlZW4uY2xpZW50WTtcclxuXHJcbiAgICBjb25zdCBjYXN0ID0gcmF5Y2FzdCh4LCB5LCB0aGlzLnNjcmVlbi5ib3hlcy5ib3hlcy5tYXAoYiA9PiB0aGlzLnNjcmVlbi5tZWFzdXJlLmdldEJvdW5kaW5nQ2xpZW50UmVjdChiKSkpO1xyXG5cclxuICAgIGNvbnN0IGxlZnQgPSBNYXRoLm1heCgwLCBjYXN0LmxlZnQpO1xyXG4gICAgY29uc3QgcmlnaHQgPSBNYXRoLm1pbih0aGlzLnNjcmVlbi53aWR0aCwgY2FzdC5yaWdodCk7XHJcbiAgICBjb25zdCB0b3AgPSBNYXRoLm1heCgwLCBjYXN0LnRvcCk7XHJcbiAgICBjb25zdCBib3R0b20gPSBNYXRoLm1pbih0aGlzLnNjcmVlbi5oZWlnaHQsIGNhc3QuYm90dG9tKTtcclxuXHJcbiAgICB0aGlzLmN0eF8uY2xlYXJSZWN0KDAsIDAsIHRoaXMuc2NyZWVuLndpZHRoLCB0aGlzLnNjcmVlbi5oZWlnaHQpO1xyXG5cclxuICAgIHRoaXMuY3R4Xy5saW5lV2lkdGggPSAxO1xyXG4gICAgdGhpcy5jdHhfLmJlZ2luUGF0aCgpO1xyXG4gICAgdGhpcy5jdHhfLm1vdmVUbyhsZWZ0LCB5ICsgMC41KTtcclxuICAgIHRoaXMuY3R4Xy5saW5lVG8ocmlnaHQsIHkgKyAwLjUpO1xyXG4gICAgdGhpcy5jdHhfLm1vdmVUbyh4ICsgMC41LCB0b3ApO1xyXG4gICAgdGhpcy5jdHhfLmxpbmVUbyh4ICsgMC41LCBib3R0b20pO1xyXG4gICAgdGhpcy5jdHhfLnN0cm9rZSgpO1xyXG5cclxuICAgIHRoaXMuY3R4Xy5mb250ID0gJzExcHgnO1xyXG5cclxuICAgIHtcclxuICAgICAgY29uc3QgaG9yaXpvbnRhbExhYmVsRGltID0gdGhpcy5jdHhfLm1lYXN1cmVUZXh0KGAke3JpZ2h0IC0gbGVmdH1gKTtcclxuICAgICAgY29uc3QgaGx5ID0geSArIDU7XHJcbiAgICAgIGNvbnN0IGhseCA9IE1hdGgubWluKHRoaXMuc2NyZWVuLndpZHRoIC0gaG9yaXpvbnRhbExhYmVsRGltLndpZHRoIC0gNSwgcmlnaHQgKyA1KTtcclxuICAgICAgdGhpcy5jdHhfLmZpbGxTdHlsZSA9ICdibGFjayc7XHJcbiAgICAgIHRoaXMuY3R4Xy5maWxsUmVjdChobHggLSAyLCBobHkgLSAxMiwgaG9yaXpvbnRhbExhYmVsRGltLndpZHRoICsgNCwgMTEgKyA0KTtcclxuICAgICAgdGhpcy5jdHhfLmZpbGxTdHlsZSA9ICd3aGl0ZSc7XHJcbiAgICAgIHRoaXMuY3R4Xy5maWxsVGV4dChgJHtyaWdodCAtIGxlZnR9YCwgaGx4LCBobHkpO1xyXG4gICAgfVxyXG4gICAgeyBcclxuICAgICAgY29uc3QgdmVydGljYWxMYWJlbERpbSA9IHRoaXMuY3R4Xy5tZWFzdXJlVGV4dChgJHtib3R0b20gLSB0b3B9YCk7XHJcbiAgICAgIGNvbnN0IHZseSA9IE1hdGgubWluKHRoaXMuc2NyZWVuLmhlaWdodCAtIDEwLCBib3R0b20gKyAxNSk7XHJcbiAgICAgIGNvbnN0IHZseCA9IHggLSB2ZXJ0aWNhbExhYmVsRGltLndpZHRoIC8gMjtcclxuICAgICAgdGhpcy5jdHhfLmZpbGxTdHlsZSA9ICdibGFjayc7XHJcbiAgICAgIHRoaXMuY3R4Xy5maWxsUmVjdCh2bHggLSAyLCB2bHkgLSAxMiwgdmVydGljYWxMYWJlbERpbS53aWR0aCArIDQsIDExICsgNCk7XHJcbiAgICAgIHRoaXMuY3R4Xy5maWxsU3R5bGUgPSAnd2hpdGUnO1xyXG4gICAgICB0aGlzLmN0eF8uZmlsbFRleHQoYCR7Ym90dG9tIC0gdG9wfWAsIHZseCwgdmx5KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjYW5kaWRhdGVzID0gdGhpcy5zY3JlZW4uYm94ZXMuYm94ZXMuZmlsdGVyKGJveCA9PiB7XHJcbiAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLnNjcmVlbi5tZWFzdXJlLmdldEJvdW5kaW5nQ2xpZW50UmVjdChib3gpO1xyXG4gICAgICByZXR1cm4gaXNQb2ludEluUmVjdCh4LCB5LCByZWN0KTtcclxuICAgIH0pXHJcbiAgICBjYW5kaWRhdGVzLnNvcnQoKGEsIGIpID0+IGdldFJlY3REaW0odGhpcy5zY3JlZW4ubWVhc3VyZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoYSkpIC0gZ2V0UmVjdERpbSh0aGlzLnNjcmVlbi5tZWFzdXJlLmdldEJvdW5kaW5nQ2xpZW50UmVjdChiKSkpO1xyXG4gICAgY29uc3QgaG92ZXJpbmcgPSBjYW5kaWRhdGVzWzBdO1xyXG4gICAgaWYgKGhvdmVyaW5nKSB7XHJcbiAgICAgIGNvbnN0IGhvdmVyaW5nUmVjdCA9IHRoaXMuc2NyZWVuLm1lYXN1cmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGhvdmVyaW5nKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IGhvcml6b250YWxMYWJlbERpbSA9IHRoaXMuY3R4Xy5tZWFzdXJlVGV4dChgJHtob3ZlcmluZ1JlY3QucmlnaHQgLSBob3ZlcmluZ1JlY3QubGVmdH1gKTtcclxuICAgICAgY29uc3QgaGx5ID0gaG92ZXJpbmdSZWN0LnRvcCAtIDY7XHJcbiAgICAgIGNvbnN0IGhseCA9IGhvdmVyaW5nUmVjdC5sZWZ0ICsgaG92ZXJpbmdSZWN0LndpZHRoIC8gMiAtIGhvcml6b250YWxMYWJlbERpbS53aWR0aCAvIDI7XHJcbiAgICAgIHRoaXMuY3R4Xy5maWxsU3R5bGUgPSAnIzQ3NDc0Nyc7XHJcbiAgICAgIHRoaXMuY3R4Xy5maWxsUmVjdChobHggLSAyLCBobHkgLSAxMiwgaG9yaXpvbnRhbExhYmVsRGltLndpZHRoICsgNCwgMTEgKyA0KTtcclxuICAgICAgdGhpcy5jdHhfLmZpbGxTdHlsZSA9ICd3aGl0ZSc7XHJcbiAgICAgIHRoaXMuY3R4Xy5maWxsVGV4dChgJHtob3ZlcmluZ1JlY3QucmlnaHQgLSBob3ZlcmluZ1JlY3QubGVmdH1gLCBobHgsIGhseSk7XHJcblxyXG4gICAgICBjb25zdCB2ZXJ0aWNhbExhYmVsRGltID0gdGhpcy5jdHhfLm1lYXN1cmVUZXh0KGAke2hvdmVyaW5nUmVjdC5ib3R0b20gLSBob3ZlcmluZ1JlY3QudG9wfWApO1xyXG4gICAgICBjb25zdCB2bHkgPSBob3ZlcmluZ1JlY3QudG9wICsgaG92ZXJpbmdSZWN0LmhlaWdodCAvIDIgKyAxMSAvIDI7XHJcbiAgICAgIGNvbnN0IHZseCA9IGhvdmVyaW5nUmVjdC5yaWdodCArIDY7XHJcbiAgICAgIHRoaXMuY3R4Xy5maWxsU3R5bGUgPSAnIzQ3NDc0Nyc7XHJcbiAgICAgIHRoaXMuY3R4Xy5maWxsUmVjdCh2bHggLSAyLCB2bHkgLSAxMiwgdmVydGljYWxMYWJlbERpbS53aWR0aCArIDQsIDExICsgNCk7XHJcbiAgICAgIHRoaXMuY3R4Xy5maWxsU3R5bGUgPSAnd2hpdGUnO1xyXG4gICAgICB0aGlzLmN0eF8uZmlsbFRleHQoYCR7aG92ZXJpbmdSZWN0LmJvdHRvbSAtIGhvdmVyaW5nUmVjdC50b3B9YCwgdmx4LCB2bHkpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMud2lkdGhMYWJlbERPTV8uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgdGhpcy5oZWlnaHRMYWJlbERPTV8uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNhbkJlU3dpdGNoZWRUbyh0b29sOiBJU2NyZWVuVG9vbCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxufSIsImltcG9ydCAnLi9zZWxlY3Quc2Nzcyc7XHJcbmltcG9ydCB7IFNjcmVlbiB9IGZyb20gJ2NvbnRlbnQvc2NyZWVuJztcclxuaW1wb3J0IHsgSVNjcmVlblRvb2wgfSBmcm9tICdjb250ZW50L3Rvb2wvdG9vbCc7XHJcbmltcG9ydCB7IGFwcGx5RE9NUmVjdCwgZ2V0UmVjdERpbSwgaXNQb2ludEluUmVjdCwgaXNSZWN0SW5SZWN0LCB0aHJvdHRsZSwgVU5JUVVFX0lEIH0gZnJvbSAnY29udGVudC91dGlsJztcclxuXHJcbmV4cG9ydCBjbGFzcyBTY3JlZW5TZWxlY3RUb29sIGltcGxlbWVudHMgSVNjcmVlblRvb2wge1xyXG4gIHN0YXRpYyByZWFkb25seSBOQU1FID0gJ1NjcmVlblNlbGVjdFRvb2wnO1xyXG5cclxuICBuYW1lOiBzdHJpbmcgPSBTY3JlZW5TZWxlY3RUb29sLk5BTUU7XHJcblxyXG4gIHByaXZhdGUgZG9tXzogSFRNTEVsZW1lbnQ7XHJcbiAgcHJpdmF0ZSBob3ZlcmluZ0RPTV86IEhUTUxFbGVtZW50O1xyXG4gIHByaXZhdGUgaG92ZXJpbmdUYXJnZXRET01fOiBIVE1MRWxlbWVudDtcclxuICBwcml2YXRlIHNlbGVjdGluZ0RPTV86IEhUTUxFbGVtZW50O1xyXG5cclxuICBwcml2YXRlIG1vdXNlZG93blhfOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBtb3VzZWRvd25ZXzogbnVtYmVyO1xyXG5cclxuICBwcml2YXRlIHRvcF86IG51bWJlcjtcclxuICBwcml2YXRlIHJpZ2h0XzogbnVtYmVyO1xyXG4gIHByaXZhdGUgYm90dG9tXzogbnVtYmVyO1xyXG4gIHByaXZhdGUgbGVmdF86IG51bWJlcjtcclxuXHJcbiAgcHJpdmF0ZSBwaGFzZV86ICdPVkVSJyB8ICdUSFJFUycgfCAnUkFOR0UnO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHJlYWRvbmx5IHNjcmVlbjogU2NyZWVuXHJcbiAgKSB7XHJcbiAgICB0aGlzLmRvbV8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHRoaXMuZG9tXy5jbGFzc05hbWUgPSBgJHtVTklRVUVfSUR9IHRvb2wtc2VsZWN0YDtcclxuXHJcbiAgICB0aGlzLmhhbmRsZU1vdXNlZG93biA9IHRoaXMuaGFuZGxlTW91c2Vkb3duLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLmhhbmRsZU1vdXNlbW92ZSA9IHRoaXMuaGFuZGxlTW91c2Vtb3ZlLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLmhhbmRsZU1vdXNldXAgPSB0aGlzLmhhbmRsZU1vdXNldXAuYmluZCh0aGlzKTtcclxuICAgIHRoaXMudXBkYXRlSG92ZXJpbmcgPSB0aHJvdHRsZSh0aGlzLnVwZGF0ZUhvdmVyaW5nLmJpbmQodGhpcyksIDMzKTtcclxuICB9XHJcblxyXG4gIG9uQWN0aXZhdGUoKTogdm9pZCB7XHJcbiAgICB0aGlzLmhvdmVyaW5nRE9NXz8ucmVtb3ZlKCk7XHJcbiAgICB0aGlzLnNlbGVjdGluZ0RPTV8/LnJlbW92ZSgpO1xyXG4gICAgdGhpcy5zY3JlZW4uZG9tLmFwcGVuZCh0aGlzLmRvbV8pO1xyXG4gICAgdGhpcy5waGFzZV8gPSAnT1ZFUic7XHJcblxyXG4gICAgdGhpcy5kb21fLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgZSA9PiBlLnByZXZlbnREZWZhdWx0KCkpO1xyXG4gICAgdGhpcy5kb21fLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuaGFuZGxlTW91c2Vkb3duKTtcclxuICAgIHRoaXMuZG9tXy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLmhhbmRsZU1vdXNlbW92ZSk7XHJcbiAgICB0aGlzLmRvbV8uYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuaGFuZGxlTW91c2V1cCk7XHJcbiAgfVxyXG5cclxuICBvbkRlYWN0aXZhdGUoKTogdm9pZCB7XHJcbiAgICB0aGlzLmhvdmVyaW5nRE9NXz8ucmVtb3ZlKCk7XHJcbiAgICB0aGlzLnNlbGVjdGluZ0RPTV8/LnJlbW92ZSgpO1xyXG4gICAgdGhpcy5kb21fLnJlbW92ZSgpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRvbV8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5oYW5kbGVNb3VzZWRvd24pO1xyXG4gICAgdGhpcy5kb21fLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuaGFuZGxlTW91c2Vtb3ZlKTtcclxuICAgIHRoaXMuZG9tXy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5oYW5kbGVNb3VzZXVwKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlTW91c2Vkb3duKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIGNvbnN0IHggPSB0aGlzLnNjcmVlbi5jbGllbnRYO1xyXG4gICAgY29uc3QgeSA9IHRoaXMuc2NyZWVuLmNsaWVudFk7XHJcbiAgICB0aGlzLm1vdXNlZG93blhfID0geDtcclxuICAgIHRoaXMubW91c2Vkb3duWV8gPSB5O1xyXG5cclxuICAgIGlmICh0aGlzLnBoYXNlXyA9PSAnT1ZFUicpIHtcclxuICAgICAgdGhpcy5waGFzZV8gPSAnVEhSRVMnO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVNb3VzZW1vdmUoKSB7XHJcbiAgICBjb25zdCB4ID0gdGhpcy5zY3JlZW4uY2xpZW50WDtcclxuICAgIGNvbnN0IHkgPSB0aGlzLnNjcmVlbi5jbGllbnRZO1xyXG5cclxuICAgIGlmICh0aGlzLnBoYXNlXyA9PT0gJ09WRVInIHx8IHRoaXMucGhhc2VfID09PSAnVEhSRVMnKSB7XHJcbiAgICAgIGlmICghdGhpcy5ob3ZlcmluZ0RPTV8pIHtcclxuICAgICAgICB0aGlzLmhvdmVyaW5nRE9NXyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHRoaXMuaG92ZXJpbmdET01fLmNsYXNzTmFtZSA9IGAke1VOSVFVRV9JRH0gaG92ZXJpbmdgO1xyXG4gICAgICAgIHRoaXMuZG9tXy5hcHBlbmQodGhpcy5ob3ZlcmluZ0RPTV8pO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMudXBkYXRlSG92ZXJpbmcoKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHRoaXMucGhhc2VfID09PSAnUkFOR0UnKSB7XHJcbiAgICAgIHRoaXMucmlnaHRfID0geDtcclxuICAgICAgdGhpcy5ib3R0b21fID0geTtcclxuICAgICAgdGhpcy51cGRhdGVTZWxlY3RpbkRPTSgpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZiAodGhpcy5waGFzZV8gPT09ICdUSFJFUycpIHtcclxuICAgICAgaWYgKE1hdGguYWJzKHRoaXMubW91c2Vkb3duWF8gLSB4KSArIE1hdGguYWJzKHRoaXMubW91c2Vkb3duWV8gLSB5KSA+IDMpIHtcclxuICAgICAgICB0aGlzLmhvdmVyaW5nRE9NXy5yZW1vdmUoKTtcclxuICAgICAgICB0aGlzLmhvdmVyaW5nRE9NXyA9IHVuZGVmaW5lZDtcclxuICAgICAgICB0aGlzLnNlbGVjdGluZ0RPTV8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICB0aGlzLnNlbGVjdGluZ0RPTV8uY2xhc3NOYW1lID0gYCR7VU5JUVVFX0lEfSBzZWxlY3RpbmdgO1xyXG4gICAgICAgIHRoaXMuZG9tXy5hcHBlbmQodGhpcy5zZWxlY3RpbmdET01fKTtcclxuICAgICAgICB0aGlzLnRvcF8gPSB5O1xyXG4gICAgICAgIHRoaXMucmlnaHRfID0geDtcclxuICAgICAgICB0aGlzLmJvdHRvbV8gPSB5O1xyXG4gICAgICAgIHRoaXMubGVmdF8gPSB4O1xyXG4gICAgICAgIHRoaXMudXBkYXRlU2VsZWN0aW5ET00oKTtcclxuICAgICAgICB0aGlzLnBoYXNlXyA9ICdSQU5HRSc7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgdXBkYXRlSG92ZXJpbmcoKSB7XHJcbiAgICBjb25zdCB4ID0gdGhpcy5zY3JlZW4uY2xpZW50WDtcclxuICAgIGNvbnN0IHkgPSB0aGlzLnNjcmVlbi5jbGllbnRZO1xyXG4gICAgaWYgKHRoaXMucGhhc2VfID09PSAnT1ZFUicgfHwgdGhpcy5waGFzZV8gPT09ICdUSFJFUycpIHtcclxuICAgICAgY29uc3QgZG9tID0gdGhpcy5zY3JlZW4ubWVhc3VyZS5nZXRTbWFsbGVzdERPTUF0KHgsIHkpO1xyXG4gICAgICB0aGlzLmhvdmVyaW5nVGFyZ2V0RE9NXyA9IGRvbTtcclxuICAgICAgY29uc3QgcmVjdCA9IHRoaXMuc2NyZWVuLm1lYXN1cmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGRvbSk7XHJcbiAgICAgIGFwcGx5RE9NUmVjdCh0aGlzLmhvdmVyaW5nRE9NXywgcmVjdCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZU1vdXNldXAoZTogTW91c2VFdmVudCkge1xyXG4gICAgY29uc3QgeCA9IHRoaXMuc2NyZWVuLmNsaWVudFg7XHJcbiAgICBjb25zdCB5ID0gdGhpcy5zY3JlZW4uY2xpZW50WTtcclxuICAgIGlmICh0aGlzLnBoYXNlXyA9PT0gJ1JBTkdFJykge1xyXG4gICAgICBpZiAoZS5idXR0b24gPT0gMCkge1xyXG4gICAgICAgIGNvbnN0IGJlc3QgPSB0aGlzLnNjcmVlbi5tZWFzdXJlLmdldEJlc3RNYXRjaGVkRE9NSW5zaWRlKHRoaXMuc2VsZWN0aW5nRE9NXy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSk7XHJcbiAgICAgICAgaWYgKGJlc3QpIHtcclxuICAgICAgICAgIHRoaXMuc2NyZWVuLmJveGVzLmFkZChiZXN0KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGUuYnV0dG9uID09IDIpIHtcclxuICAgICAgICBjb25zdCByZW1vdmVzID0gdGhpcy5zY3JlZW4uYm94ZXMuYm94ZXMuZmlsdGVyKGJveCA9PiBpc1JlY3RJblJlY3QodGhpcy5zZWxlY3RpbmdET01fLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCB0aGlzLnNjcmVlbi5tZWFzdXJlLmdldEJvdW5kaW5nQ2xpZW50UmVjdChib3gpKSk7XHJcbiAgICAgICAgZm9yIChjb25zdCByZW1vdmUgb2YgcmVtb3Zlcykge1xyXG4gICAgICAgICAgdGhpcy5zY3JlZW4uYm94ZXMucmVtb3ZlKHJlbW92ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuc2VsZWN0aW5nRE9NXy5yZW1vdmUoKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBpZiAoZS5idXR0b24gPT0gMCkge1xyXG4gICAgICAgIGlmICh0aGlzLmhvdmVyaW5nVGFyZ2V0RE9NXykge1xyXG4gICAgICAgICAgdGhpcy5zY3JlZW4uYm94ZXMuYWRkKHRoaXMuaG92ZXJpbmdUYXJnZXRET01fKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGUuYnV0dG9uID09PSAyKSB7XHJcbiAgICAgICAgY29uc3QgcmVtb3ZlcyA9IHRoaXMuc2NyZWVuLmJveGVzLmJveGVzLmZpbHRlcihib3ggPT4ge1xyXG4gICAgICAgICAgY29uc3QgcmVjdCA9IHRoaXMuc2NyZWVuLm1lYXN1cmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGJveCk7XHJcbiAgICAgICAgICByZXR1cm4gaXNQb2ludEluUmVjdCh4LCB5LCByZWN0KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIHJlbW92ZXMuc29ydCgoYSwgYikgPT4gZ2V0UmVjdERpbSh0aGlzLnNjcmVlbi5tZWFzdXJlLmdldEJvdW5kaW5nQ2xpZW50UmVjdChhKSkgLSBnZXRSZWN0RGltKHRoaXMuc2NyZWVuLm1lYXN1cmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGIpKSk7XHJcbiAgICAgICAgcmVtb3Zlc1swXSAmJiB0aGlzLnNjcmVlbi5ib3hlcy5yZW1vdmUocmVtb3Zlc1swXSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMucGhhc2VfID0gJ09WRVInO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSB1cGRhdGVTZWxlY3RpbkRPTSgpIHtcclxuICAgIGNvbnN0IGwgPSBNYXRoLm1pbih0aGlzLmxlZnRfLCB0aGlzLnJpZ2h0Xyk7XHJcbiAgICBjb25zdCByID0gTWF0aC5tYXgodGhpcy5sZWZ0XywgdGhpcy5yaWdodF8pO1xyXG4gICAgY29uc3QgdCA9IE1hdGgubWluKHRoaXMudG9wXywgdGhpcy5ib3R0b21fKTtcclxuICAgIGNvbnN0IGIgPSBNYXRoLm1heCh0aGlzLnRvcF8sIHRoaXMuYm90dG9tXyk7XHJcbiAgICB0aGlzLnNlbGVjdGluZ0RPTV8uc3R5bGUubGVmdCA9IGAke2x9cHhgO1xyXG4gICAgdGhpcy5zZWxlY3RpbmdET01fLnN0eWxlLnRvcCA9IGAke3R9cHhgO1xyXG4gICAgdGhpcy5zZWxlY3RpbmdET01fLnN0eWxlLndpZHRoID0gYCR7ciAtIGx9cHhgO1xyXG4gICAgdGhpcy5zZWxlY3RpbmdET01fLnN0eWxlLmhlaWdodCA9IGAke2IgLSB0fXB4YDtcclxuICB9XHJcblxyXG4gIGNhbkJlU3dpdGNoZWRUbyh0b29sOiBJU2NyZWVuVG9vbCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxufSIsImV4cG9ydCBjb25zdCBVTklRVUVfSUQgPSAnX19fX19fbWVhc3VyZSc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGhyb3R0bGUgKGNhbGxiYWNrLCBsaW1pdCkge1xyXG4gICAgdmFyIHdhaXRpbmcgPSBmYWxzZTsgICAgICAgICAgICAgICAgICAgICAgLy8gSW5pdGlhbGx5LCB3ZSdyZSBub3Qgd2FpdGluZ1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHsgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgcmV0dXJuIGEgdGhyb3R0bGVkIGZ1bmN0aW9uXHJcbiAgICAgICAgaWYgKCF3YWl0aW5nKSB7ICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSdyZSBub3Qgd2FpdGluZ1xyXG4gICAgICAgICAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyAgLy8gRXhlY3V0ZSB1c2VycyBmdW5jdGlvblxyXG4gICAgICAgICAgICB3YWl0aW5nID0gdHJ1ZTsgICAgICAgICAgICAgICAgICAgLy8gUHJldmVudCBmdXR1cmUgaW52b2NhdGlvbnNcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7ICAgICAgICAgIC8vIEFmdGVyIGEgcGVyaW9kIG9mIHRpbWVcclxuICAgICAgICAgICAgICAgIHdhaXRpbmcgPSBmYWxzZTsgICAgICAgICAgICAgIC8vIEFuZCBhbGxvdyBmdXR1cmUgaW52b2NhdGlvbnNcclxuICAgICAgICAgICAgfSwgbGltaXQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBSZWN0IHtcclxuICB0b3A6IG51bWJlcjtcclxuICByaWdodDogbnVtYmVyO1xyXG4gIGJvdHRvbTogbnVtYmVyO1xyXG4gIGxlZnQ6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5RE9NUmVjdChzcmM6IEhUTUxFbGVtZW50LCByZWN0OiBET01SZWN0KSB7XHJcbiAgc3JjLnN0eWxlLmxlZnQgPSBgJHtyZWN0LmxlZnR9cHhgO1xyXG4gIHNyYy5zdHlsZS50b3AgPSBgJHtyZWN0LnRvcH1weGA7XHJcbiAgc3JjLnN0eWxlLndpZHRoID0gYCR7cmVjdC53aWR0aH1weGA7XHJcbiAgc3JjLnN0eWxlLmhlaWdodCA9IGAke3JlY3QuaGVpZ2h0fXB4YDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzUG9pbnRJblJlY3QoeDogbnVtYmVyLCB5OiBudW1iZXIsIHJlY3Q6IFJlY3QpOiBib29sZWFuIHtcclxuICByZXR1cm4gcmVjdC5sZWZ0IDw9IHggJiYgeCA8PSByZWN0LnJpZ2h0ICYmIHJlY3QudG9wIDw9IHkgJiYgeSA8PSByZWN0LmJvdHRvbTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlY3REaW0ocmVjdDogUmVjdCk6IG51bWJlciB7XHJcbiAgcmV0dXJuIChyZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0KSAqIChyZWN0LmJvdHRvbSAtIHJlY3QudG9wKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE92ZXJsYXBwaW5nRGltKGxoczogUmVjdCwgcmhzOiBSZWN0KTogbnVtYmVyIHtcclxuICBjb25zdCB3ID0gTWF0aC5taW4obGhzLnJpZ2h0LCByaHMucmlnaHQpIC0gTWF0aC5tYXgobGhzLmxlZnQsIHJocy5sZWZ0KTtcclxuICBjb25zdCBoID0gTWF0aC5taW4obGhzLmJvdHRvbSAtIHJocy5ib3R0b20pIC0gTWF0aC5tYXgobGhzLnRvcCAtIHJocy50b3ApO1xyXG4gIGlmICh3ID49IDAgJiYgaCA+PSAwKSByZXR1cm4gdyAqIGg7XHJcbiAgcmV0dXJuIDA7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1JlY3RJblJlY3Qob3V0c2lkZTogUmVjdCwgaW5zaWRlOiBSZWN0KTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIG91dHNpZGUubGVmdCA8PSBpbnNpZGUubGVmdCAmJiBvdXRzaWRlLnJpZ2h0ID49IGluc2lkZS5yaWdodCAmJlxyXG4gICAgICAgICBvdXRzaWRlLnRvcCA8PSBpbnNpZGUudG9wICYmIG91dHNpZGUuYm90dG9tID49IGluc2lkZS5ib3R0b207XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByYXljYXN0KHg6IG51bWJlciwgeTogbnVtYmVyLCByZWN0czogcmVhZG9ubHkgUmVjdFtdKSB7XHJcbiAgbGV0IGxlZnQgPSAtSW5maW5pdHk7XHJcbiAgbGV0IHJpZ2h0ID0gSW5maW5pdHk7XHJcbiAgbGV0IHRvcCA9IC1JbmZpbml0eTtcclxuICBsZXQgYm90dG9tID0gSW5maW5pdHk7XHJcblxyXG4gIGZvciAoY29uc3QgcmVjdCBvZiByZWN0cykge1xyXG4gICAgaWYgKHggPD0gcmVjdC5sZWZ0ICYmIHJlY3QudG9wIDw9IHkgJiYgeSA8PSByZWN0LmJvdHRvbSkge1xyXG4gICAgICByaWdodCA9IE1hdGgubWluKHJpZ2h0LCByZWN0LmxlZnQpO1xyXG4gICAgfVxyXG4gICAgaWYgKHJlY3QucmlnaHQgPD0geCAmJiByZWN0LnRvcCA8PSB5ICYmIHkgPD0gcmVjdC5ib3R0b20pIHtcclxuICAgICAgbGVmdCA9IE1hdGgubWF4KGxlZnQsIHJlY3QucmlnaHQpO1xyXG4gICAgfVxyXG4gICAgaWYgKHkgPD0gcmVjdC50b3AgJiYgcmVjdC5sZWZ0IDw9IHggJiYgeCA8PSByZWN0LnJpZ2h0KSB7XHJcbiAgICAgIGJvdHRvbSA9IE1hdGgubWluKGJvdHRvbSwgcmVjdC50b3ApO1xyXG4gICAgfVxyXG4gICAgaWYgKHJlY3QuYm90dG9tIDw9IHkgJiYgcmVjdC5sZWZ0IDw9IHggJiYgeCA8PSByZWN0LnJpZ2h0KSB7XHJcbiAgICAgIHRvcCA9IE1hdGgubWF4KHRvcCwgcmVjdC5ib3R0b20pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbVxyXG4gIH07XHJcbn0iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHRpZihfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdKSB7XG5cdFx0cmV0dXJuIF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0uZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHRpZDogbW9kdWxlSWQsXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSAobW9kdWxlKSA9PiB7XG5cdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuXHRcdCgpID0+IChtb2R1bGVbJ2RlZmF1bHQnXSkgOlxuXHRcdCgpID0+IChtb2R1bGUpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCB7IGE6IGdldHRlciB9KTtcblx0cmV0dXJuIGdldHRlcjtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlXG5fX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9jb250ZW50L2luZGV4LnRzXCIpO1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgdXNlZCAnZXhwb3J0cycgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxuIl0sInNvdXJjZVJvb3QiOiIifQ==