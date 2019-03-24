/**
 * @param {HTMLElement} eParent 
 * @param {string} tag 
 * @param {string} [className] 
 * @returns {HTMLElement} Child element
 */
export function appendChild(eParent, tag, className) {
    const el = document.createElement(tag);
    el.className = className || '';
    return eParent.appendChild(el);
}


/**
 * @param {HTMLElement} eParent 
 * @param {string} tag 
 * @param {string} [className] 
 * @returns {HTMLElement} Child element
 */
export function prependChild(eParent, tag, className) {
    if (eParent.firstChild === null) return appendChild(eParent, tag, className);
    const el = document.createElement(tag);
    el.className = className || '';
    return eParent.insertBefore(el, eParent.firstChild);
}


/**********************************************************************************************************************/
/**
 * @typedef {{ x: string, y: string, sx: string, sy: string, ox: string, oy: string }} TDragData
 * @param {HTMLElement} el 
 * @param {(ev: string, data: TDragData) => void} cb 
 */
export function draggable(el, cb) {
    let startX, startY, offsetX, offsetY;

    const getData = (ev) => {
        return { x: ev.pageX, y: ev.pageY, sx: startX, sy: startY, ox: offsetX, oy: offsetY };
    };

    const updateData = (touch) => {
        const rect = el.getBoundingClientRect();
        startX = touch.pageX;
        startY = touch.pageY;
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;
    };

    const onTouchEnd = (ev) => {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onTouchEnd);
        cb('end', getData(ev.changedTouches[0]));
    };

    const onTouchStart = (ev) => {
        ev.stopPropagation();
        ev.preventDefault();

        if (ev.touches.length !== 1) {
            onTouchEnd(ev);
            return;
        }

        updateData(ev.touches[0]);
        cb('start', getData(ev.touches[0]));
        document.addEventListener('touchmove', onMove);
        document.addEventListener('touchend', onTouchEnd);
    };

    const onMouseUp = (ev) => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onMouseUp);
        cb('end', getData(ev));
    };

    const onMove = (ev) => {
        cb('move', getData(ev.touches ? ev.touches[0] : ev));
    };

    const onMouseDown = (ev) => {
        if (ev.which !== 1) return;
        ev.stopPropagation();
        ev.preventDefault();
        
        updateData(ev);
        cb('start', getData(ev));
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('touchstart', onTouchStart);
}


/**********************************************************************************************************************/
/**
 * @param {HTMLElement} el 
 * @returns {{ left: number, top: number }} Coordinates relative to the document
 */
export function getOffset(el) {
    const rect = el.getBoundingClientRect();
    return { 
        left: window.pageXOffset + rect.left,
        top: window.pageYOffset + rect.top
    };
}


/**
 * @param {string} color Any correct hex color (3, 4, 6 or 8 hex digits)
 * @returns {string} Normalized hex color (6 or 8 hex digits)
 */
export function normalizeColor(color) {
    return (color.length > 5 ? color : color.replace(/^#(.)(.)(.)(.)?$/, '#$1$1$2$2$3$3$4$4')).toUpperCase();
}


/**
 * @param {string} color Normalized hex color
 * @param {number} fade 0 <= fade <= 1
 * @returns {string} Hex color with alpha channel (8 hex digits)
 */
export function colorFade(color, fade) {
    let opacity = parseInt(color.length <= 7 ? 'FF' : color.substring(7), 16);
    opacity = (~~(opacity * fade)).toString(16);
    if (opacity.length === 1) opacity = '0' + opacity;
    return (color.substring(0, 7) + opacity).toUpperCase();
}


/**
 * @typedef {{ r: number, g: number, b: number, a: number }} TColorObj
 * @param {string} color rgb, rgba or hex color
 * @returns {TColorObj | null} 
 */
export function colorToObj(color) {
    if (color[0] === '#') {
        if (!/^#[0-9a-z]+$/i.test(color) || [4, 5, 7, 9].indexOf(color.length) === -1) return null;
        if (color.length <= 5) color = color.replace(/([0-9a-z])/ig, '$1$1');
        return {
            r: parseInt(color.substring(1, 3), 16),
            g: parseInt(color.substring(3, 5), 16),
            b: parseInt(color.substring(5, 7), 16),
            a: color.length <= 7 ? 1 : parseInt(color.substring(7, 9), 16) / 255,
        };
    } 
    
    else {
        const matches = /^rgba?\(([0-9]+), ?([0-9]+), ?([0-9]+)(?:, ?(1|0|0\.[0-9]+))?\)$/i.exec(color);
        return !matches ? null : {
            r: +matches[1],
            g: +matches[2],
            b: +matches[3],
            a: matches[4] !== undefined ? +matches[4] : 1
        };
    }
}


/**
 * @param {TColorObj} color 
 * @param {number} opacity 
 * @returns {string} rgba color
 */
export function objToColor(color, opacity) {
    opacity = color.a * (opacity != undefined ? opacity : 1);
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
}


/**********************************************************************************************************************/
/**
 * @param {TCollection} target
 * @param {...TCollection} sources
 * @returns {TCollection}
 */
export function assign(target, ...sources) {
    return _merge(1, target, sources);
}


/**
 * 
 * @param {TCollection} target
 * @param {...TCollection} sources
 * @returns {TCollection}
 */
export function merge(target, ...sources) {
    return _merge(null, target, sources);
}


/**
 * @param {number} depth
 * @param {TCollection} target
 * @param {TCollection[]} sources
 * @returns {TCollection}
 */
function _merge(depth, target, sources) {
    if (!(target instanceof Object)) throw 'Invalid Target Object';
    if (!sources.length) return target;

    return sources.reduce((t, s) => {
        return (s instanceof Object) && (!(s instanceof Array) || (t instanceof Array)) ? _merge2(t, s, 1, depth) : t;
    }, target);
}


/**
 * @typedef {Object.<string, any> | Array.<any>} TCollection
 * @param {TCollection} target
 * @param {TCollection} source
 * @returns {TCollection}
 */
function _merge2(target, source, depth, maxDepth) {
    for (let key in source) {
        const sType = (source[key] instanceof Array) ? 'array' : typeof source[key];
        const tType = (target[key] instanceof Array) ? 'array' : typeof target[key];

        if ((maxDepth == undefined || depth < maxDepth) && (sType === 'array' || sType === 'object')) {
            if (sType !== tType) target[key] = sType === 'array' ? [] : {};
            _merge2(target[key], source[key], depth + 1, maxDepth);
        } else {
            target[key] = source[key];
        }
    }
    return target;
} 


/**********************************************************************************************************************/
/**
 * @param {number} timeout 
 * @return {(cb: () => void) => void}
 */
export function debounce(timeout) {
    let id = null;
    return function(cb) {
        clearTimeout(id);
        id = setTimeout(cb, timeout);
    };
}


/**
 * @param {TCollection} collection 
 * @param {(el: any, index: number, collection: TCollection) => boolean} cb 
 * @returns {any}
 */
export function find(collection, cb) {
    for (let i in collection) {
        if (collection.hasOwnProperty(i) && cb(collection[i], (isNaN(+i) ? i : +i), collection)) {
            return collection[i];
        }
    }
}


/* Mobile *************************************************************************************************************/
/**
 * @returns {number}
 */
export function dpr() {
    return Math.min(2, window.devicePixelRatio); // Already sharp enough
}


/**
 * @returns {boolean}
 */
export function isMobile() {
    return /Android|iPad|iPhone|Windows Phone/.test(window.navigator.userAgent);
}