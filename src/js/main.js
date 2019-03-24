const appConfig = {}; // Put any properties that will override the default widget configuration from './widget/config.js'


/* Initialize *********************************************************************************************************/
document.addEventListener('DOMContentLoaded', function() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '../chart_data.json', true);
    xhr.send();

    xhr.onreadystatechange = function() {
        if (xhr.readyState !== 4) return;
        if (xhr.status !== 200) throw 'Invalid Chart Data URL';
        
        const chartData = window.chart_data = JSON.parse(xhr.responseText);
        initCharts(chartData);
    }

    initNightMode();
});


/**
 * @param {Array.<import('./chart-widget').TChartData>} chartData
 */
function initCharts(chartData) {
    Array.prototype.forEach.call(document.querySelectorAll('.b-chart-widget'), function(node) {
        const index = node.getAttribute('index');
        if (!index) return;
        new ChartWidget(node, chartData[+index], appConfig);
    });
}


function initNightMode() {
    const body = document.querySelector('body');
    const node = document.querySelector('.b-toggle-night-mode');
    const button = new ToggleButton(node);

    node.addEventListener('toggle', function(ev) {
        window.localStorage.setItem('night-mode', ev.detail.index);
        if (ev.detail.state === 'night') body.classList.add('m-night-mode');
        else body.classList.remove('m-night-mode');
    });

    const iState = window.localStorage.getItem('night-mode');
    if (iState !== null) {
        button.update(+iState);
    }
}


/* Toggle Button ******************************************************************************************************/
/**
 * @constructor
 * @param {HTMLElement} el 
 */
function ToggleButton(el) {
    this.el = el;
    this._initState();

    this.el.addEventListener('click', function() {
        this.update(this.index + 1);
    }.bind(this));
}


ToggleButton.prototype._initState = function() {
    const initial = this.el.getAttribute('initial-state');
    let index = 0;
    
    this.states = Array.prototype.map.call(this.el.querySelectorAll('[state]'), function(node, i) {
        const state = node.getAttribute('state');
        if (initial && initial === state) index = i;
        return { value: state, el: node };
    }, this);

    this.update(index, true);
};


/**
 * @param {number} index
 */
ToggleButton.prototype.update = function(index, silent) {
    this.index = Math.max(0, index) % this.states.length;
    this.states.forEach(function(s, i) {
        s.el.style.display = i === this.index ? 'inline' : 'none';
    }, this);
    
    if (!silent) {
        this.el.dispatchEvent(new CustomEvent('toggle', {
            bubbles: true,
            detail: { index: this.index, state: this.states[this.index].value }
        }));
    }
};