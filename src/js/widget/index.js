/**
 * @typedef {{ [idGraph: string]: string }} TStringMap
 * @typedef {number[] & { 0: string }} TColumnData
 * @typedef {{ colors: TStringMap, columns: TColumnData[], names: TStringMap, types: TStringMap }} TChartData
 * @typedef {{ name: string, color: string, columns: TColumnData, visible: boolean }} TGraph
 * @typedef {import('./config').TWidgetConfig} TWidgetConfig
 */


import '../common/polyfill';
import { appendChild, prependChild, colorToObj, objToColor, merge, find, isMobile } from '../common/utils';
import { config as defaultConfig } from './config';
import { MainChart } from './main-chart';
import { Preview } from './preview';
import { CheckButton } from './check-button';

window.ChartWidget = ChartWidget;


/**
 * @constructor
 * @param {HTMLElement} el 
 * @param {TChartData} data
 * @param {TWidgetConfig} config 
 */
export function ChartWidget(el, data, config) {
    this.el = el;
    this.el.classList.add('b-chart-widget');
    /** @type {TWidgetConfig} */
    this.config = merge({}, defaultConfig, config);
    this.config.columns.min = parseInt(this.el.getAttribute('min-columns')) || this.config.columns.min;
    this.config.columns.max = parseInt(this.el.getAttribute('max-columns')) || this.config.columns.max;

    if (document.fonts) {
        const font = this.config.font;
        document.fonts.load(`${font.weight} ${font.size}px ${font.family}`).then(this._initAll.bind(this, data)); // Because we can
    } else {
        this._initAll(data); // IE and Edge will have to wait for cache
    }
}


ChartWidget.prototype._initAll = function(data) {
    if (isMobile()) this.el.classList.add('m-mobile');
    this._normalizeColors();
    this._initialize(data);
    this._initPreview();
    this._initLegend();
    this._initMainChart();
    this.main.update(this.preview.bounds, true);
};


/**
 * @param {TChartData} data
 */
ChartWidget.prototype._initialize = function(data) {
    const visible = this.config.visible;

    /** @type {TGraph[]} */
    this.graphs = [];
    for (let key in data.types) {
        if (data.types[key] === 'x') {
            this.xAxis = find(data.columns, (col) => col[0] === key);
        } else {
            this.graphs.push({ 
                name: data.names[key], 
                color: colorToObj(data.colors[key]),
                columns: find(data.columns, (col) => col[0] === key),
                visible: visible && visible[key] !== undefined ? visible[key] : true
            });
        }
    }
};


ChartWidget.prototype._initMainChart = function() {
    const div = prependChild(this.el, 'div');
    this.main = new MainChart(div, this.xAxis, this.graphs, this.config);
};


ChartWidget.prototype._initPreview = function() {
    const div = appendChild(this.el, 'div');
    this.preview = new Preview(div, this.graphs, this.config);
    this.preview.el.addEventListener('new-bounds', (ev) => {
        this.main.update(ev.detail);
    });
};


ChartWidget.prototype._initLegend = function() {
    const ul = appendChild(this.el, 'ul', 'd-legend');
    /** @type {CheckButton[]} */
    this.legend = [];

    for (let i = 0; i < this.graphs.length; i++) { 
        const li = appendChild(ul, 'li');
        this.legend.push(new CheckButton(li, this.graphs[i].name, objToColor(this.graphs[i].color), this.graphs[i].visible));
        this.legend[i].el.addEventListener('check', this._onButtonCheck.bind(this, i));
    }
};


/**
 * @param {number} index
 * @param {{ detail: import('./check-button').TCheckEventData }} ev
 */
ChartWidget.prototype._onButtonCheck = function(index, ev) {
    this.graphs[index].visible = ev.detail.checked;
    this.preview.chart.update();
    this.main.update();
};


ChartWidget.prototype._normalizeColors = function() {
    this.config.font.color = colorToObj(this.config.font.color);
    this.config.chart.color.hLine = colorToObj(this.config.chart.color.hLine);
    this.config.chart.color.vLine = colorToObj(this.config.chart.color.vLine);
};