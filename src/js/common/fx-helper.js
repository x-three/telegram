/**
 * @typedef {{ from?: any, to?: any, time?: number, pos?: number, value?: number }} TFxData
 * @typedef {{ start: number, duration: number, easing: string, destroy: boolean }} TFxParams
 * @typedef { TFxParams & TFxData } TFx
 * @typedef {{ [name: string]: any, fx?: TFx }} TFxItem
 * @typedef {{ [name: string]: TStateItem }} TFxItemMap
 */


import { assign } from '../common/utils';
import { easing as easingMap } from './easing';


 /**
 * @constructor
 * @param {(fxList: TFxItemMap) => void} cbRedraw
 * @returns {TFxItemMap}
 */
export function FXHelper(cbRedraw) {
    Object.defineProperties(this, {
        _cb: { value: cbRedraw },
        _rafId: { value: null, writable: true }
    });
}


Object.defineProperties(FXHelper.prototype, {
    add:       { value: add },
    addFx:     { value: addFx },
    removeFx:  { value: removeFx },
    clearFx:   { value: clearFx },
    invertFx:  { value: invertFx },
    get:       { value: get },
    _start:    { value: _start },
    _onFrame:  { value: _onFrame },
    _updateFx: { value: _updateFx }
});


/**
 * @param {string} name
 * @param {*} state
 */
function add(name, state) {
    this[name] = assign({}, state);
}


/**
 * @param {string} name
 * @param {*} [state]
 * @param {*} [from]
 * @param {*} [to]
 * @param {number} [duration]
 * @param {string} [easing]
 * @param {boolean} [destroy]
 */
function addFx(name, state, from, to, duration, easing, destroy) {
    const item = this[name] || (this[name] = {});
    
    if (state != null) {
        for (let p in item) delete item[p];
        assign(item, state);
    } else {
        delete item.fx;
    }

    item.fx = {
        start: Date.now(),
        duration: duration || 0,
        easing: easingMap[easing] ? easing : 'linear',
        destroy: destroy != null ? destroy : (arguments.length === 1 || !Object.keys(item).length)
    };

    if (from !== undefined && to !== undefined) {
        assign(item.fx, { from, to, time: 0, pos: 0 });
    }
    this._start();
}


/**
 * @param {string} name
 * @param {boolean} [destroy]
 */
function removeFx(name, destroy) {
    for (let n in this) {
        if ((n === name || n.indexOf(name + ':') === 0)) {
            if (destroy) delete this[n];
            else delete this[n].fx;
        }
    }
}


/**
 * @param {number} [time]
 */
function clearFx(time) {
    for (let n in this) {
        const fx = this[n].fx;
        if (fx && (time == null || time >= fx.start + fx.duration)) {
            if (fx.destroy) delete this[n];
            else delete this[n].fx;
        }
    }
}


/**
 * @param {string} name
 * @param {boolean} [destroy]
 */
function invertFx(name, destroy) {
    let fx;
    if (!this[name] || !(fx = this[name].fx)) return;

    const swap = fx.from;
    fx.from = fx.to;
    fx.to = swap;

    fx.time = 1 - fx.time;
    fx.start = Date.now() - fx.duration * fx.time;

    if (fx.easing !== 'linear' && fx.easing.indexOf('easeInOut') === -1) {
        fx.easing = fx.easing.replace(/^ease(In|Out)/, (match, p1) => 'ease' + (p1 === 'In' ? 'Out' : 'In'));
    }
    fx.pos = fx.easing === 'linear' ? fx.time : easingMap[fx.easing](fx.time);

    if (destroy != null) fx.destroy = destroy;
}


/**
 * @param {string | null} [name]
 * @param {boolean} [fx] Filter by active FX only
 * @returns {TFxItemMap}
 */
function get(name, fx) {
    const result = {};

    for (let n in this) {
        if ((!name || n === name || n.indexOf(name + ':') === 0) && (!fx || this[n].fx)) {
            result[n] = this[n];
        }
    }
    return result;
}


function _start() {
    if (this._rafId === null) {
        this._rafId = window.requestAnimationFrame(this._onFrame.bind(this));
    }
}


function _onFrame() {
    this._rafId = null;
    const now = Date.now();
    this._cb(this._updateFx(now));
    this.clearFx(now);

    if (Object.keys(this.get(null, true)).length > 0) {
        this._start();
    }
}


/**
 * @returns {TFxItemMap}
 */
function _updateFx(time) {
    const result = {};

    for (let name in this) {
        const fx = this[name].fx;
        if (!fx) continue

        if (fx.from !== undefined && fx.to !== undefined) {
            fx.time = Math.max(0, Math.min(1, (time - fx.start) / fx.duration));
            fx.pos = fx.easing === 'linear' ? fx.time : easingMap[fx.easing](fx.time);
            if (typeof fx.from === 'number' && typeof fx.to === 'number') {
                fx.value = fx.from + (fx.to - fx.from) * fx.pos;
            }
        }
        result[name] = this[name];
    }
    return result;
}