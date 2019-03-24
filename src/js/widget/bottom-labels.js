/**
 * @typedef {import('./preview').THBounds} THBounds
 * @typedef {THBounds} TLabelsRange
 * @typedef {{ [id: string]: number[] }} TPresets
 */


import { dpr } from '../common/utils';
const DPR = dpr();


/**
 * @constructor
 * @param {HTMLCanvasElement} canvas
 * @param {import('./').TColumnData} xAxis
 * @param {Array.<import('./').TGraph>} graphs
 * @param {import('./config').TWidgetConfig} config
 */
export function BottomLabels(canvas, xAxis, graphs, config) {
    this.eCanvas = canvas;
    this.ctx = this.eCanvas.getContext('2d');
    this.xAxis = xAxis;
    this.graphs = graphs;
    this.config = config;

    this.ctx.font = this.config.font.weight + ' ' + (this.config.font.size * DPR) + 'px ' + this.config.font.family;
    this.maxLabelWidth = this.getMaxLabelWidth();
    // this.presets = this.createPresets({ first: 0, last: this.xAxis.length - 2 }); // Samples
}


/**
 * @returns {number}
 */
BottomLabels.prototype.getFirstLabelOffset = function() {
    const margin = this.config.chart.margin,
        step = (this.eCanvas.width - margin.left * DPR - margin.right * DPR) / this.config.columns.min;
    return Math.max(1, Math.round(this.maxLabelWidth / 2 / step));
};


/**
 * @param {THBounds} hBounds
 * @returns {TLabelsRange}
 */
BottomLabels.prototype.getVisibleLabelsRange = function(hBounds) {
    const iPreset = this.getMinLabelPresetId(hBounds),
        offset = this.getFirstLabelOffset(),
        max = this.xAxis.length - 2;

    let first = (Math.ceil(Math.max(0, this.xAxis.length - 1 - hBounds.last - offset) / iPreset) * iPreset - iPreset) + offset,
        last = (Math.floor(Math.max(0, this.xAxis.length - 1 - hBounds.first - offset) / iPreset) * iPreset + iPreset) + offset; 

    if (first < 0) first -= Math.floor(first / iPreset) * iPreset;
    // if (last > max) last -= Math.ceil((last - max) / iPreset) * iPreset;
    if (last > max) last -= Math.ceil((last - max) / (iPreset / 2)) * (iPreset / 2);
    return { first, last };
};


/**
 * @param {THBounds} hBounds
 * @returns {TPresets}
 */
BottomLabels.prototype.getVisibleLabels = function(hBounds) {
    const range = this.getVisibleLabelsRange(hBounds);
    return this.createPresets(range);
};


/**
 * @param {TLabelsRange} hBounds
 * @returns {TPresets}
 */
BottomLabels.prototype.createPresets = function(range) {
    const presets = {},
        offset = this.getFirstLabelOffset(),
        first = range.first - offset,
        last = range.last - offset;

    for (let i = 1; ; i *= 2) {
        presets[i] = [];
        const start = Math.ceil((Math.max(1, first) - i) / i / 2) * i * 2 + i
        
        for (let j = start; j <= last; j += i * 2) {
            presets[i].push(j + offset);
        }

        if (i * 2 > last) {
            if (first === 0) {
                // presets[0x1000000] = [0 + offset];
                presets['first'] = [0 + offset];
            }
            break;
        }
    }
    return presets;
};


/**
 * @param {THBounds} hBounds
 * @returns {number}
 */
BottomLabels.prototype.getMinLabelPresetId = function(hBounds) {
    const margin = this.config.chart.margin,
        step = (this.eCanvas.width - margin.left * DPR - margin.right * DPR) / (hBounds.last - hBounds.first);

    for (var index = 1; index <= 1024; index *= 2) {
        if (step * index > this.maxLabelWidth * 1.75) {
            return index;
        }
    }
    return null;
};


/**
 * @param {number} index
 * @returns {string}
 */
BottomLabels.prototype.getLabel = function(index) {
    const date0 = new Date(this.xAxis[this.xAxis.length - 1 - index]);
    return this.config.localization.months[date0.getMonth()] + ' ' + date0.getDate();
};


/**
 * @param {TPresets} presets
 * @return {{ preset: number, index: number, value: number }}
 */
BottomLabels.prototype.getLastLabel = function(presets) {
    let max = -1, iPreset, iValue;
    
    for (let p in presets) {
        const index = presets[p].length - 1;
        if (presets[p][index] > max) {
            max = presets[p][index];
            iPreset = p;
            iValue = index;
        }
    }
    return { preset: iPreset, index: iValue, value: presets[iPreset][iValue] };
};


/**
 * @param {number} index
 * @returns {string}
 */
BottomLabels.prototype.getDayOfWeek = function(index) {
    const date0 = new Date(this.xAxis[this.xAxis.length - 1 - index]);
    return this.config.localization.days[date0.getDay()];
};


/** 
 * @returns {number}
 */
BottomLabels.prototype.getMaxLabelWidth = function() {
    const month = this.config.localization.months.reduce((max, month) => {
        return month.length > max.length ? month : max;
    }, '');
    return this.measure(month + ' 00')
};


/**
 * @param {string} text
 * @returns {number}
 */
BottomLabels.prototype.measure = function(text) {
    return this.ctx.measureText(text).width;
};