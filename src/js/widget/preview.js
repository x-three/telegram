/**
 * @typedef {{ first: number, last: number }} THBounds
 * @typedef {import('../common/utils').TDragData} TDragData
 * @typedef {import('./').TGraph} TGraph
 */


import { MiniChart } from './mini-chart';
import { appendChild, draggable, getOffset } from '../common/utils';


/**
 * @constructor
 * @param {HTMLElement} el 
 * @param {TGraph[]} graphs
 * @param {import('./config').TWidgetConfig} config
 */
export function Preview(el, graphs, config) {
    this.el = el;
    this.el.classList.add('b-chart-preview');

    this.graphs = graphs;
    this.config = config;
    this.bounds = { first: -1, last: -1 };
    this.chart = new MiniChart(appendChild(this.el, 'div'), this.graphs, this.config);
    
    this.eHandle = appendChild(this.el, 'div', 'd-handle');
    this.eLeftEdge = appendChild(this.eHandle, 'span', 'e-edge m-left');
    this.eRightEdge = appendChild(this.eHandle, 'span', 'e-edge m-right');

    draggable(this.el, this._onDrag.bind(this));
    draggable(this.eHandle, this._onHandleDrag.bind(this));
    draggable(this.eLeftEdge, this._onLeftDrag.bind(this));
    draggable(this.eRightEdge, this._onRightDrag.bind(this));

    window.addEventListener('resize', () => { this._initData() });
    this._initData(true);
}


/**
 * @param {boolean} [silent]
 */
Preview.prototype._initData = function(silent) {
    const cols = this.config.columns,
        wEl = this.el.clientWidth,
        k = cols.adaptive ? wEl / cols.adaptive : 1;

    const w1 = 1 / (this.graphs[0].columns.length - 2);
    this.minWidth = Math.min(1, (~~((cols.min - 1) * k)) * w1);
    this.maxWidth = (!cols.max || cols.max < cols.min) ? 1 : Math.min(1, (~~((cols.max - 1) * k)) * w1);
    if (this.width != undefined) this.width = Math.max(this.minWidth, Math.min(this.maxWidth, this.width));
    else this.width = (!cols.end || cols.end < cols.start) ? this.minWidth : Math.min(1, Math.max(this.minWidth, (cols.end - cols.start) * w1));
    this.pos = Math.max(0, 1 - this.width - cols.start * w1);
    this._updateHandle(silent);
};


/**
 * @param {boolean} [silent]
 */
Preview.prototype._updateHandle = function(silent) {
    this.eHandle.style.left = (this.pos * 100) + '%';
    this.eHandle.style.right = ((1 - this.pos - this.width) * 100) + '%';

    const newBounds = this._getBounds();
    if (newBounds.first === newBounds.last) throw 'Invalid Environment';

    if (!silent && (newBounds.first !== this.bounds.first || newBounds.last !== this.bounds.last)) {
        this.el.dispatchEvent(new CustomEvent('new-bounds', {
            bubbles: true,
            detail: newBounds
        }));
    }
    this.bounds = newBounds;
};


/**
 * @returns {THBounds}
 */
Preview.prototype._getBounds = function() {
    const length = this.graphs[0].columns.length - 2;
    return {
        first: Math.round(length * this.pos) + 1,
        last: Math.round(length * (this.pos + this.width)) + 1
    };
};


/**
 * @param {string} ev
 * @param {TDragData} pos
 */
Preview.prototype._onDrag = function(ev, pos) {
    const wEl = this.el.clientWidth,
        ox = getOffset(this.el).left,
        newPos = (pos.x - ox) / wEl - this.width / 2;

    this.pos = Math.max(0, Math.min(1 - this.width, newPos));
    this._updateHandle();
};


/**
 * @param {string} ev
 * @param {TDragData} pos
 */
Preview.prototype._onHandleDrag = function(ev, pos) {
    const wEl = this.el.clientWidth,
        ox = getOffset(this.el).left,
        newPos = (pos.x - ox - pos.ox) / wEl;

    this.pos = Math.max(0, Math.min(1 - this.width, newPos));
    this._updateHandle();
};


/**
 * @param {string} ev
 * @param {TDragData} pos
 */
Preview.prototype._onLeftDrag = function(ev, pos) {
    const wEl = this.el.clientWidth,
        ox = getOffset(this.el).left,
        right = this.pos + this.width,
        newPos = (pos.x - ox - pos.ox) / wEl;

    this.pos = Math.max(0, right - this.maxWidth, Math.min(right - this.minWidth, newPos));
    this.width = right - this.pos;
    this._updateHandle();
};


/**
 * @param {string} ev
 * @param {TDragData} pos
 */
Preview.prototype._onRightDrag = function(ev, pos) {
    const wEl = this.el.clientWidth,
        ox = getOffset(this.el).left,
        oxRight = this.eRightEdge.clientWidth - pos.ox,
        newWidth = (pos.x - ox + oxRight) / wEl - this.pos;

    this.width = Math.max(this.minWidth, Math.min(1 - this.pos, this.maxWidth, newWidth));
    this._updateHandle();
};