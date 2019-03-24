import { getOffset } from '../common/utils';


/**
 * @constructor
 * @param {HTMLCanvasElement} canvas 
 * @param {import('./preview').THBounds} hBounds
 * @param {import('./config').TWidgetConfig} config
 * @param {(_new: number | null, old: number | null) => void} cb
 */
export function Tooltip(canvas, hBounds, config, cb) {
    this.eCanvas = canvas;
    this.config = config;
    this.hBounds = hBounds;
    this.cb = cb;

    this.el = document.createElement('div');
    this.el.className = 'b-tooltip';
    this.eParent = this.eCanvas.parentElement;

    /** @type {null | number} */
    this.iHover = null;
    this._bind();
}


/**
 * @typedef {Array.<{name: string, color: string, text: string, hint: string}>} TTooltipData
 * @param {number} x
 * @param {number} opacity
 * @param {string} date
 * @param {TTooltipData} data
 */
Tooltip.prototype.update = function(x, opacity, date, data) {
    let html = `<header>${date}</header>`;
    html += '<ul>';
    for (let i = 0; i < data.length; i++) {
        html += `<li style="color: ${data[i].color};"><a class="e-value" title="${data[i].hint}">${data[i].text}</a><span class="e-name">${data[i].name}</span></li>`;
    }
    html += '</ul>';
    this.el.innerHTML = html;
    this.el.style.opacity = opacity;

    const style = getComputedStyle(this.el),
        offset = this.config.tooltip.offset,
        ml = parseInt(style.marginLeft) || 0,
        mr = parseInt(style.marginRight) || 0;

    let left = Math.max(0, x - offset - ml);
    left = Math.min(left, this.eParent.clientWidth - this.el.clientWidth - mr - ml)
    this.el.style.left = left + 'px';
    
    if (!this.el.parentElement && opacity > 0) {
        this.eParent.appendChild(this.el);
    } else if (this.el.parentElement && opacity === 0) {
        this.eParent.removeChild(this.el);
    }
};  


Tooltip.prototype._bind = function() {
    const that = this;
    let tLastTouch = 0;
    
    const onTouchEnd = () => {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);

        if (this.iHover !== null) {
            this.cb(null, this.iHover);
            this.iHover = null;
        }
    };

    const onTouchMove = (ev) => {
        this._onHover(ev.touches[0].pageX, ev.touches[0].pageY);
    };

    const onTouchStart = (ev) => {
        tLastTouch = Date.now();
        if (ev.touches.length === 1) {
            this._onHover(ev.touches[0].pageX, ev.touches[0].pageY);
            document.addEventListener('touchmove', onTouchMove);
            document.addEventListener('touchend', onTouchEnd);
        } else {
            onTouchEnd(ev);
        }
    };

    const onMouseMove = (ev) => {
        for (let el = ev.target; el !== null; el = el.parentElement) {
            if (el === this.eCanvas) {
                this._onHover(ev.pageX, ev.pageY);
                return;
            } else if (el === this.eParent) {
                return;
            }
        }
         
        document.removeEventListener('mousemove', onMouseMove);
        this.eParent.addEventListener('mouseenter', onMouseEnter);

        if (this.iHover !== null) {
            this.cb(null, this.iHover);
            this.iHover = null;
        }
    };

    const onMouseEnter = () => {
        if (Date.now() < tLastTouch + 500) return; // Don't show when tap on screen
        this.eParent.removeEventListener('mouseenter', onMouseEnter);
        document.addEventListener('mousemove', onMouseMove);
    };

    this.eParent.addEventListener('mouseenter', onMouseEnter);
    this.eCanvas.addEventListener('touchstart', onTouchStart);
};


/**
 * @param {number} pageX
 * @param {number} pageY
 */
Tooltip.prototype._onHover = function(pageX, pageY) {
    const offset = getOffset(this.eCanvas),
        x = pageX - offset.left,
        y = pageY - offset.top,
        margin = this.config.chart.margin,
        inside = y >= margin.top && y < (this.eCanvas.clientHeight - margin.bottom);

    let iHover = null;

    if (inside) {
        const step = (this.eCanvas.clientWidth - margin.left - margin.right) / (this.hBounds.last - this.hBounds.first);
        iHover = this.hBounds.first + Math.round((x - margin.left) / step);
        iHover = Math.max(this.hBounds.first, Math.min(this.hBounds.last, iHover));
    }

    if (iHover !== this.iHover) {
        this.cb(iHover, this.iHover);
        this.iHover = iHover;
    }
};


/**
 * @returns {number}
 */
Tooltip.prototype.getBottom = function() {
    const rc = this.eCanvas.getBoundingClientRect();
    if (!this.el.parentElement) {
        return rc.height;
    } 

    const rt = this.el.getBoundingClientRect();    
    return rt.top - rc.top + rt.height;
};