/**
 * @typedef {import('./').TGraph} TGraph
 * @typedef {import('./preview').THBounds} THBounds
 * @typedef {{ min: number, max: number }} TVBounds
 * @typedef {import('../common/fx-helper').TFxDataMap} TFxDataMap
 */


import { appendChild, objToColor, dpr } from '../common/utils';
import { FXHelper } from '../common/fx-helper';
const DPR = dpr();


/**
 * @constructor
 * @param {HTMLElement} el
 * @param {TGraph[]} graphs
 * @param {import('./config').TWidgetConfig} config
 */
export function MiniChart(el, graphs, config) {
    this.el = el;
    this.el.className = 'b-mini-chart';
    /** @type {HTMLCanvasElement} */
    this.eCanvas = appendChild(this.el, 'canvas');
    this.ctx = this.eCanvas.getContext('2d');

    this.config = config;
    this.graphs = graphs;
    this.mask = ''; // Visible Graphs

    this.state = new FXHelper(this._redraw.bind(this));
    this.state.add('h-bounds');
    this.state.add('v-bounds');
    this.update({ first: 1, last: this.graphs[0].columns.length - 1 }, true);

    window.addEventListener('resize', this.onResize.bind(this));
    this.onResize();
}


MiniChart.prototype.onResize = function() {
    this.eCanvas.width = this.eCanvas.clientWidth * DPR;
    this.eCanvas.height = this.eCanvas.clientHeight * DPR;
    this.state.addFx('redraw');
};


/**
 * @returns {string}
 */
MiniChart.prototype._getVisibleGraphsMask = function() {
    return this.graphs.reduce((mask, graph) => {
        return mask + +graph.visible;
    }, '');
};


/* Update *************************************************************************************************************/
/**
 * @param {THBounds} [newBounds]
 * @param {boolean} [instant]
 */
MiniChart.prototype.update = function(hBounds, instant) {
    if (hBounds) {
        this.state['h-bounds'].first = hBounds.first;
        this.state['h-bounds'].last = hBounds.last;
    }

    if (instant) this.state.clearFx();
    const mask = this._getVisibleGraphsMask();
    this._updateVBounds(mask, instant);

    if (this.mask !== mask) {
        !instant && this._updateGraphVisibilityFx(mask);
        this.mask = mask;
    }

    this.state.addFx('redraw');
};


/**
 * @param {string} mask
 * @param {boolean} [instant]
 */
MiniChart.prototype._updateVBounds = function(mask, instant) {
    const cur = this.state['v-bounds'];
    const _new = this._getVerticalBounds(mask);

    if (_new && (_new.min !== cur.min || _new.max !== cur.max)) {
        if (instant || this.mask.indexOf('1') === -1 || this.mask === mask) {
            cur.min = _new.min;
            cur.max = _new.max;
        } else {
            this.state.addFx('v-bounds', null, { min: cur.min, max: cur.max }, _new, this.config.fx.duration, this.config.fx.easing);
        }
    } else {
        this.state.removeFx('v-bounds');
    }
};


/**
 * @param {string} mask
 */
MiniChart.prototype._updateGraphVisibilityFx = function(mask) {
    for (let i = 0; i < mask.length; i++) {
        if (mask[i] !== this.mask[i]) {
            const id = 'graph-fade:' + i;

            if (!this.state[id]) {
                if (mask[i] === '1') {
                    this.state.addFx(id, { index: i }, -1, 1, this.config.fx.duration, null, true);
                } else {
                    this.state.addFx(id, { index: i }, 1, -1, this.config.fx.duration, null, true);
                }
            } else {
                this.state.invertFx(id);
            }
        }
    }
};


/* Redraw *************************************************************************************************************/
/**
 * @param {TFxDataMap} fxList
 */
MiniChart.prototype._redraw = function(fxList) {
    this._updateState(fxList);
    
    const first = this.state['h-bounds'].first,
        last = this.state['h-bounds'].last,
        max = this.state['v-bounds'].max,
        top = this.config.preview.margin * DPR,
        p3 = (max - this.state['v-bounds'].min) / (this.eCanvas.height - 2 * top), // Vertical Points per Pixel
        step = this.eCanvas.width / (last - first);                                // Distance between two columns

    this.ctx.clearRect(0, 0, this.eCanvas.width, this.eCanvas.height);
    this.ctx.lineWidth = this.config.preview.thickness * DPR;
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'square';

    for (let i = 0; i < this.graphs.length; i++) {
        const fxItem = fxList['graph-fade:' + i];
        if (!(this.graphs[i].visible || fxItem)) continue;

        const c = this.graphs[i].columns;
        this.ctx.beginPath();
        this.ctx.moveTo(0, top + (max - c[first]) / p3);

        for (let j = first + 1; j <= last; j++) {
            this.ctx.lineTo((j - first) * step, top + (max - c[j]) / p3);
        }

        this.ctx.strokeStyle = objToColor(this.graphs[i].color, (!fxItem ? 1 : Math.max(0, fxItem.fx.value)));
        this.ctx.stroke();
    }
};


/**
 * @param {TFxDataMap} fxList
 */
MiniChart.prototype._updateState = function(fxList) {
    for (let n in fxList) {
        const fx = fxList[n].fx;
        if (n === 'v-bounds') {
            fxList[n].min = fx.from.min + (fx.to.min - fx.from.min) * fx.pos;
            fxList[n].max = fx.from.max + (fx.to.max - fx.from.max) * fx.pos;
        }
    }
};


/* Vertical Bounds ****************************************************************************************************/
/**
 * @param {string} mask
 * @returns {TVBounds | null} 
 */
MiniChart.prototype._getVerticalBounds = function(mask) {
    if (mask.indexOf('1') === -1) return null;

    return {
        min: this._getMinValue(mask),
        max: this._getMaxValue(mask)
    };
};


/**
 * @param {string} mask
 * @returns {number}
 */
MiniChart.prototype._getMinValue = function(mask) {
    return this.graphs.reduce((min, graph, index) => {
        if (mask[index] === '0') return min;
        const columns = graph.columns.slice(this.state['h-bounds'].first, this.state['h-bounds'].last + 1);
        return Math.min(min, Math.min.apply(null, columns));
    }, Number.POSITIVE_INFINITY);
};


/**
 * @param {string} mask
 * @returns {number}
 */
MiniChart.prototype._getMaxValue = function(mask) {
    return this.graphs.reduce((max, graph, index) => {
        if (mask[index] === '0') return max;
        const columns = graph.columns.slice(this.state['h-bounds'].first, this.state['h-bounds'].last + 1);
        return Math.max(max, Math.max.apply(null, columns));
    }, Number.NEGATIVE_INFINITY);
};