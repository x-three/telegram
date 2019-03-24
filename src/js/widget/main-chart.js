/**
 * @typedef {import('./').TGraph} TGraph
 * @typedef {import('./preview').THBounds} THBounds
 * @typedef {{ min: number, max: number }} TVBounds
 * @typedef {import('./').TColumnData} TColumnData
 */


import { appendChild, objToColor, dpr } from '../common/utils';
import { FXHelper } from '../common/fx-helper';
import { BottomLabels } from './bottom-labels';
import { Tooltip } from './tooltip';
const DPR = dpr();


/**
 * @constructor
 * @param {HTMLElement} el 
 * @param {TColumnData} xAxis
 * @param {TGraph[]} graphs
 * @param {import('./config').TWidgetConfig} config
 */
export function MainChart(el, xAxis, graphs, config) {
    this.el = el;
    this.el.className = 'b-main-chart';
    /** @type {HTMLCanvasElement} */
    this.eCanvas = appendChild(this.el, 'canvas');
    this.ctx = this.eCanvas.getContext('2d');
    
    this.config = config;
    this._initHMargin();

    this.xAxis = xAxis;
    this.graphs = graphs;
    this.mask = ''; // Visible Graphs
    this.vLabelsCount = 6;
    this.hLabels = new BottomLabels(this.eCanvas, this.xAxis, this.graphs, this.config);

    this.state = new FXHelper(this._redraw.bind(this));
    this.state.add('h-bounds');
    this.state.add('v-bounds');
    this.tooltip = new Tooltip(this.eCanvas, this.state['h-bounds'], this.config, this._onTooltip.bind(this));
    
    window.addEventListener('resize', this.onResize.bind(this));
    this.onResize();
}


MainChart.prototype._initHMargin = function() {
    const style = getComputedStyle(this.el);
    
    if (this.config.chart.margin.left == undefined) {
        this.config.chart.margin.left = -parseFloat(style.marginLeft);
    }
    if (this.config.chart.margin.right == undefined) {
        this.config.chart.margin.right = -parseFloat(style.marginRight);
    }
};


MainChart.prototype.onResize = function () {
    this.eCanvas.width = this.eCanvas.clientWidth * DPR;
    this.eCanvas.height = this.eCanvas.clientHeight * DPR;
    const hBounds = this.state['h-bounds'];
    if (hBounds.first) this._updateHorizontalLabelsFx(hBounds);
    this.state.addFx('redraw');
};


/**
 * @returns {string}
 */
MainChart.prototype._getVisibleGraphsMask = function() {
    return this.graphs.reduce((mask, graph) => {
        return mask + +graph.visible;
    }, '');
};


/* Update *************************************************************************************************************/
/**
 * @param {TVBounds} [hBounds]
 * @param {boolean} [instant]
 */
MainChart.prototype.update = function(hBounds, instant) {
    if (hBounds) {
        this._updateHorizontalLabelsFx(hBounds, instant);
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
 * @param {number} _new
 * @param {number} old
 */
MainChart.prototype._onTooltip = function (_new, old) {
    const idFade = 'tooltip:fade',
        idPos = 'tooltip:position',
        fade = this.state[idFade];

    if (_new !== null) {
        if (!fade) {
            this.state.addFx(idFade, null, 0, 1, this.config.fx.duration, null, false);
            this.state.add(idPos, { index: _new });
        } else {
            if (fade.fx && fade.fx.to === 0) {
                this.state.invertFx(idFade, false);
            }
            const from = old === null ? this.state[idPos].index : (this.state[idPos].index * 2 / 3 + old * 1 / 3);
            this.state.addFx(idPos, { index: _new }, from, _new, this.config.fx.duration, this.config.fx.easing);
        }
    }

    else if (fade) {
        if (!fade.fx) {
            this.state.addFx(idFade, null, 1, 0, this.config.fx.duration, null, true);
        } else if (fade.fx.to === 1) {
            this.state.invertFx(idFade, true);
        }
    }
};


/**
 * @param {THBounds} hBounds
 * @param {boolean} [instant]
 */
MainChart.prototype._updateHorizontalLabelsFx = function(hBounds, instant) {
    const minPreset = this.hLabels.getMinLabelPresetId(hBounds),
        presets = this.hLabels.getVisibleLabels(hBounds);

    if (instant) {
        this.state.removeFx('h-labels', true);
        for (let p in presets) {
            if (!(p < minPreset)) { // It may be a string that is always show
                this.state.add('h-labels:' + p, { preset: +p || p });
            }
        }
    } 
    
    else {
        const oldHBounds = this.state['h-bounds'];

        if (oldHBounds.minPreset !== minPreset || Object.keys(this.hLabels.getVisibleLabels(oldHBounds)).join(' ') !== Object.keys(presets).join(' ')) {
            const fxItems = this.state.get('h-labels');
            for (let n in fxItems) {
                const item = fxItems[n];

                if (!item.fx) { // Update existing
                    if (item.preset < minPreset) {
                        for (let n in fxItems) { // Immediately hide previous hidden labels to avoid large amounts of animated text
                            if (fxItems[n].fx && fxItems[n].fx.to === 0 && fxItems[n].preset < item.preset) {
                                this.state.removeFx(n, true);
                            }
                        };
                        this.state.addFx(n, null, 1, 0, this.config.fx.duration, null, true);
                    }
                } else {
                    if (item.fx.to === 1 && item.preset < minPreset) this.state.invertFx(n, true);
                    else if (item.fx.to === 0 && item.preset >= minPreset) this.state.invertFx(n, false);
                }
            }

            for (let p in presets) { // Show new
                const idFx = 'h-labels:' + p;
                if (!fxItems[idFx] && !(p < minPreset)) { // See above (~148)
                    this.state.addFx(idFx, { preset: +p || p }, 0, 1, this.config.fx.duration);
                }
            }
        }
    }

    this.state['h-bounds'].minPreset = minPreset;
};


/**
 * @param {string} mask
 * @param {boolean} [instant]
 */
MainChart.prototype._updateVBounds = function(mask, instant) {
    const cur = this.state['v-bounds'];
    const _new = this._getVerticalBounds(mask);

    if (_new && (_new.min !== cur.min || _new.max !== cur.max)) {
        this._updateVerticalLabelsFx(_new, mask, instant);
        if (instant || this.mask === mask) { // Instant or horizontal scroll
            cur.min = _new.min;
            cur.max = _new.max;
        } else {                             // Check Button
            this.state.addFx('v-bounds', null, { min: cur.min, max: cur.max }, _new, this.config.fx.duration, this.config.fx.easing);
        }
    } else {
        this.state.removeFx('v-bounds');
    }
};


/**
 * @param {TVBounds} vBounds
 * @param {string} mask
 * @param {boolean} [instant]
 */
MainChart.prototype._updateVerticalLabelsFx = function(vBounds, mask, instant) {
    const _new = this._getMaxVerticalLabel(vBounds.maxValue),
        idNew = 'v-labels:' + _new;

    if (instant || this.mask === mask) { // !!!
        this.state.removeFx('v-labels', true);
        this.state.add(idNew, { labels: this._getLabels(_new) });
    } 

    else {
        const fxItems = this.state.get('v-labels');
        for (let n in fxItems) { // Update existing
            if (n !== idNew) {
                if (!fxItems[n].fx) this.state.addFx(n, null, 1, 0, this.config.fx.duration, null, true);
                else if (fxItems[n].fx.to === 1) this.state.invertFx(n, true);
            }
        }

        const newItem = fxItems[idNew]; // Show new
        if (!newItem) this.state.addFx(idNew, { labels: this._getLabels(_new) }, 0, 1, this.config.fx.duration);
        else if (newItem.fx && newItem.fx.to === 0) this.state.invertFx(idNew, false);
    }
};


/**
 * @param {string} mask
 */
MainChart.prototype._updateGraphVisibilityFx = function(mask) {
    for (let i = 0; i < mask.length; i++) {
        if (mask[i] !== this.mask[i]) {
            const id = 'graph-fade:' + i;

            if (!this.state[id]) {
                if (mask[i] === '1') {
                    this.state.addFx(id, { index: i }, 0, 1, this.config.fx.duration, null, true);
                } else {
                    this.state.addFx(id, { index: i }, 1, 0, this.config.fx.duration, null, true);
                }
            } else {
                this.state.invertFx(id);
            }
        }
    }
};


/* Draw ***************************************************************************************************************/
/**
 * @param {TFxDataMap} fxList
 */
MainChart.prototype._redraw = function(fxList) {
    this.ctx.clearRect(0, 0, this.eCanvas.width, this.eCanvas.height);
    this._updateState(fxList);
    const data = this._getDrawData();
    this._drawHorizontalLabels(data);
    this._drawVerticalLabels(data);
    this._drawGraphs(fxList, data);
    if (this.config.chart.tails) this._drawGraphTails(fxList, data);
    this._drawTooltipLine(fxList, data);
};


/**
 * @param {TFxDataMap} fxList
 */
MainChart.prototype._updateState = function(fxList) {
    for (let n in fxList) {
        const fx = this.state[n].fx;
        if (n === 'v-bounds') {
            this.state[n].min = fx.from.min + (fx.to.min - fx.from.min) * fx.pos;
            this.state[n].max = fx.from.max + (fx.to.max - fx.from.max) * fx.pos;
        } else if (n === 'tooltip:position') {
            this.state[n].index = fx.value;
        }
    }
};


/**
 * @typedef {*} TDrawData
 * @returns {TDrawData}
 */
MainChart.prototype._getDrawData = function() {
    const first = this.state['h-bounds'].first,                                                      // First visible column
        last = this.state['h-bounds'].last,                                                          // Last visible column
        margin = this.config.chart.margin,
        top = margin.top * DPR,
        bottom = this.eCanvas.height - margin.bottom * DPR,
        left = margin.left * DPR,
        right = this.eCanvas.width - margin.right * DPR,
        max = this.state['v-bounds'].max,                                                            // Max Value
        p3 = (max - this.state['v-bounds'].min) / (this.eCanvas.height - top - margin.bottom * DPR), // Vertical Points per Pixel
        step = (this.eCanvas.width - left - margin.right * DPR) / (last - first),                    // Distance between two columns
        hlw = this.config.chart.thickness.grid / 2,                                                  // Half Line Width
        po = (Math.ceil(hlw) - hlw) * DPR; // !!!                                                    // Point Offset. To draw lines without anti-aliasing (if possible)

    return { first, last, margin, top, bottom, left, right, max, p3, step, po };
};


/* Draw Labels ********************************************************************************************************/
/**
 * @param {TDrawData} data
 */
MainChart.prototype._drawHorizontalLabels = function({ first, margin, left, bottom, step }) {
    this.ctx.font = this.config.font.weight + ' ' + (this.config.font.size * DPR) + 'px ' + this.config.font.family;
    this.ctx.fillStyle = objToColor(this.config.font.color);
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    const fxItems = this.state.get('h-labels'),
        range = this.hLabels.getVisibleLabelsRange(this.state['h-bounds']),
        presets = this.hLabels.createPresets(range),
        y = bottom + this.config.chart.labelVOffset.bottom * DPR,
        x = left + (this.xAxis.length - 1 - first - range.last) * step;

    // Draw first
    if (presets['first']) {
        const value = presets['first'][0],
            label = this.hLabels.getLabel(value),
            w = this.hLabels.measure(label);

        let xLabel = x + (range.last - value) * step;
        if (xLabel - w / 2 < this.eCanvas.width && this.state['h-bounds'].last === this.xAxis.length - 1) {
            xLabel = Math.min(xLabel, this.eCanvas.width - margin.right * DPR * 0.75 - w / 2);
        }

        this.ctx.fillStyle = objToColor(this.config.font.color);
        this.ctx.fillText(label, xLabel, y);
    }

    // Draw last
    const oLastLabel = (range.last === this.xAxis.length - 2) ? this.hLabels.getLastLabel(presets) : null;

    if (oLastLabel) {
        const label = this.hLabels.getLabel(oLastLabel.value),
            w = this.hLabels.measure(label),
            xLabel = left + (this.xAxis.length - 2 - oLastLabel.value) * step - w / 2;

        if (xLabel > left / DPR) {
            this.ctx.fillStyle = objToColor(this.config.font.color);
            this.ctx.fillText(label, xLabel, y);
        }
    }

    // Draw other labels
    for (let n in fxItems) {
        const p = fxItems[n].preset;
        if (!(typeof p === 'number' && presets[p])) continue;

        const fx = fxItems[n].fx; 
        this.ctx.fillStyle = objToColor(this.config.font.color, !fx ? 1 : fx.value);

        for (let j = 0; j < presets[p].length; j++) {
            if (oLastLabel && presets[p][j] === oLastLabel.value) continue;
            this.ctx.fillText(this.hLabels.getLabel(presets[p][j]), x + (range.last - presets[p][j]) * step, y);
        }
    }
};


/**
 * @param {TDrawData} data
 */
MainChart.prototype._drawVerticalLabels = function({ top, left, right, max, p3, po }) {
    this.ctx.font = this.config.font.weight + ' ' + (this.config.font.size * DPR) + 'px ' + this.config.font.family;
    this.ctx.fillStyle = objToColor(this.config.font.color);
    this.ctx.textAlign = 'start';
    this.ctx.textBaseline = 'alphabetic';
    
    this.ctx.strokeStyle = objToColor(this.config.chart.color.hLine);
    this.ctx.lineWidth = this.config.chart.thickness.grid * DPR; 
    this.ctx.lineCap = 'butt';

    const fxItems = this.state.get('v-labels');

    // Draw Zero
    this.ctx.beginPath();
    const y = Math.round(top + max / p3);
    this.ctx.moveTo(left, y - po);
    this.ctx.lineTo(right, y - po);
    this.ctx.fillText('0', left, y - this.config.chart.labelVOffset.left * DPR);
    this.ctx.stroke();

    // Draw other lines
    for (let n in fxItems) {
        const item = fxItems[n];
        const opacity = !item.fx ? 1 : item.fx.value;
        this.ctx.strokeStyle = objToColor(this.config.chart.color.hLine, opacity);
        this.ctx.fillStyle = objToColor(this.config.font.color, opacity);

        this.ctx.beginPath();
        for (let i = 1; i < item.labels.length; i++) {
            const y = Math.round(top + (max - item.labels[i].value) / p3);
            this.ctx.moveTo(left, y - po);
            this.ctx.lineTo(right, y - po);
            this.ctx.fillText(item.labels[i].text, left, y - this.config.chart.labelVOffset.left * DPR);
        }
        this.ctx.stroke();
    }
};


/* Draw Graphs ********************************************************************************************************/
/**
 * @param {TFxDataMap} fxList
 * @param {TDrawData} data
 */
MainChart.prototype._drawGraphs = function(fxList, { first, last, top, left, max, p3, step }) {
    this.ctx.lineWidth = this.config.chart.thickness.graph * DPR;
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';

    for (let i = 0; i < this.graphs.length; i++) {
        const fxItem = fxList['graph-fade:' + i];
        if (!(this.graphs[i].visible || fxItem)) continue;

        const c = this.graphs[i].columns;
        this.ctx.beginPath();
        this.ctx.moveTo(left, top + (max - c[first]) / p3);

        for (let j = first + 1; j <= last; j++) {
            this.ctx.lineTo(left + (j - first) * step, top + (max - c[j]) / p3);
        }

        this.ctx.strokeStyle = objToColor(this.graphs[i].color, !fxItem ? 1 : fxItem.fx.value);
        this.ctx.stroke();
    }
};


MainChart.prototype._drawGraphTails = function(fxList, { first, last, top, left, max, p3, step }) {
    this.ctx.lineWidth = this.config.chart.thickness.graph * DPR;
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';

    for (let i = 0; i < this.graphs.length; i++) {
        const fxItem = fxList['graph-fade:' + i];
        if (!(this.graphs[i].visible || fxItem)) continue;

        // Draw Left
        const c = this.graphs[i].columns;
        this.ctx.beginPath();
        this.ctx.moveTo(left, top + (max - c[first]) / p3);

        for (let j = first - 1; j >= 1; j--) {
            const x = left + (j - first) * step;
            this.ctx.lineTo(x, top + (max - c[j]) / p3);
            if (x < 0) break;
        }

        this.ctx.strokeStyle = objToColor(this.graphs[i].color, !fxItem ? 1 : fxItem.fx.value);
        this.ctx.stroke();

        // Draw Right
        this.ctx.beginPath();
        this.ctx.moveTo(left + (last - first) * step, top + (max - c[last]) / p3);

        for (let j = last + 1; j < this.xAxis.length; j++) {
            const x = left + (j - first) * step;
            this.ctx.lineTo(x, top + (max - c[j]) / p3);
            if (x > this.eCanvas.width) break;
        }

        this.ctx.strokeStyle = objToColor(this.graphs[i].color, !fxItem ? 1 : fxItem.fx.value);
        this.ctx.stroke();
    }
};


/* Tooltip ************************************************************************************************************/
/**
 * @param {TFxDataMap} fxList
 * @param {TDrawData} data
 */
MainChart.prototype._drawTooltipLine = function(fxList, { top, left, bottom, first, max, p3, step, po }) {
    const fade = this.state['tooltip:fade'];
    if (!fade || Object.keys(this.state.get('graph-fade')).length === 0 && this.mask.indexOf(1) === -1) return;
    
    const pos = this.state['tooltip:position'],
        x = left + (pos.index - first) * step,
        progress = !fade.fx ? 1 : fade.fx.value;

    this.ctx.lineWidth = this.config.chart.thickness.grid * DPR;
    this.ctx.lineCap = 'butt';
    this.ctx.strokeStyle = objToColor(this.config.chart.color.vLine, progress);

    this.ctx.moveTo(x - po, this.tooltip.getBottom() * DPR);
    this.ctx.lineTo(x - po, bottom);
    this.ctx.stroke();

    const r = this.config.tooltip.crossingRadius * DPR * progress,
        hlw = this.config.chart.thickness.graph / 2 * DPR; // Half Line Width
    
    this.ctx.lineWidth = hlw * 2;

    for (let i = 0; i < this.graphs.length; i++) {
        const fxItem = fxList['graph-fade:' + i];
        if (!(this.graphs[i].visible || fxItem)) continue;

        const cols = this.graphs[i].columns;
        let v = pos.index;
        v = v % 1 === 0 ? cols[v] : (cols[~~v] + (cols[~~v + 1] - cols[~~v]) * (v % 1));
        const y = top + (max - v) / p3;
        const opacity = (fxItem ? fxItem.fx.value : 1) * progress;
        this.ctx.strokeStyle = objToColor(this.graphs[i].color, opacity);

        const rc = Math.max(0, Math.ceil(r - hlw));
        this.ctx.clearRect(x - rc, y - rc, rc * 2, rc * 2);
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    this._updateTooltip((pos.fx ? pos.fx.to : ~~pos.index), ~~(x / DPR), progress);
};


/**
 * @param {number} index
 * @param {number} x
 */
MainChart.prototype._updateTooltip = function(col, x, opacity) {
    const data = [];
    for (let i = 0; i < this.graphs.length; i++) {
        if (this.mask[i] === '1' || this.state['graph-fade:' + i]){
            data.push({
                name: this.graphs[i].name,
                color: objToColor(this.graphs[i].color),
                text: this._valueToLabel(this.graphs[i].columns[col]),
                hint: this._formatValue(this.graphs[i].columns[col])
            });
        }
    }

    const index = this.xAxis.length - 1 - col;
    const date = this.hLabels.getDayOfWeek(index) + ', ' + this.hLabels.getLabel(index);
    this.tooltip.update(x, opacity, date, data);
};


/* Labels *************************************************************************************************************/
/**
 * @typedef {{ value: number, text: string }} TLabelItem
 * @param {number} maxValue
 * @returns {TLabelItem[]}
 */
MainChart.prototype._getLabels = function(maxLabelValue) {
    const step = maxLabelValue / (this.vLabelsCount - 1);
    const result = [];

    for (let i = 0; i < this.vLabelsCount; i++) {
        result.push({ value: step * i, text: this._valueToLabel(step * i) });
    }
    return result;
};


/**
 * @param {number} maxValue 
 * @returns {number}
 */
MainChart.prototype._getMaxVerticalLabel = function(maxValue) {
    const pow = Math.max(0, (~~maxValue).toString().length - 3);
    const k = (10 ** pow) * (this.vLabelsCount - 1) * 2;
    return Math.round(maxValue / k) * k;
};


/**
 * @param {number} value 
 * @returns {string}
 */
MainChart.prototype._valueToLabel = function(value) {
    if (value < 1000) return (~~value).toString();

    const length = (~~value).toString().length;
    let pow = (Math.ceil(length / 3) - 1) * 3;
    let str;

    if (length - pow > 1) { // > 10
        value = Math.round(value / 10 ** pow);
        if (value === 1000) { // After rounding the number may be greater
            value = 1;
            pow += 3;
        }
        str = value.toString();
    } 
    
    else { // < 10
        value = Math.round(value / 10 ** (pow - 1)) / 10;
        str = (~~value).toString();
        const frac = Math.round(value % 1 * 10).toString();
        if (frac !== '0') str += this.config.localization.separator.decimal + frac;
    }

    return str + this.config.localization.suffixes[pow / 3 - 1];
};


/**
 * @param {number} value
 * @returns {string}
 */
MainChart.prototype._formatValue = function(value) {
    return value.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1' + this.config.localization.separator.thousand);
};


/* Vertical Bounds ****************************************************************************************************/
/**
 * @param {string} mask
 * @returns {TVBounds | null} 
 */
MainChart.prototype._getVerticalBounds = function(mask) {
    if (mask.indexOf('1') === -1) return null;
    
    const min = this._getMinValue(mask),
        maxValue = this._getMaxValue(mask),
        margin = this.config.chart.margin,
        p31 = (maxValue - min) / (this.eCanvas.height - margin.top * DPR - margin.bottom * DPR),
        maxLabel = this._getMaxVerticalLabel(maxValue),
        hFont = this.config.font.size * this.config.font.hLetter * DPR,
        offset = this.config.chart.labelVOffset.left * DPR,
        p32 = (maxLabel - min) / (this.eCanvas.height - margin.top * DPR - margin.bottom * DPR - hFont - offset);

    return {
        min, 
        max: p31 > p32 ? maxValue : (maxLabel + (hFont + offset) * p32),
        maxValue
    };
};


/**
 * @returns {number}
 */
MainChart.prototype._getMinValue = function() {
    return 0;
};


/**
 * @param {string} mask
 * @returns {number}
 */
MainChart.prototype._getMaxValue = function(mask) {
    return this.graphs.reduce((max, graph, index) => {
        if (mask[index] === '0') return max;
        const columns = graph.columns.slice(this.state['h-bounds'].first, this.state['h-bounds'].last + 1);
        return Math.max(max, Math.max.apply(null, columns));
    }, Number.NEGATIVE_INFINITY);
};