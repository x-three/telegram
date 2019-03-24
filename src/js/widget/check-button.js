/**
 * @typedef {{ checked: boolean }} TCheckEventData
 */


import { appendChild } from '../common/utils';


/**
 * @constructor
 * @param {HTMLElement} el 
 * @param {string} name 
 * @param {string} color 
 * @param {boolean} checked 
 */
export function CheckButton(el, name, color, checked) {
    this.el = el;
    this.el.classList.add('b-check-button');
    this._initChildren(name, color);

    this.state = checked;
    this.toggleState(this.state, true);
    this.el.addEventListener('click', () => { this.toggleState() });
}


/**
 * @param {string} name
 * @param {color} name
 */
CheckButton.prototype._initChildren = function(name, color) {
    this.eIcon = appendChild(this.el, 'i', 'e-icon');
    this.eIcon.style.cssText = `border-color: ${color};`;
    appendChild(this.el, 'span', 'e-label').textContent = name;
};


/**
 * @param {boolean | undefined} [state]
 * @param {boolean} [silent]
 */
CheckButton.prototype.toggleState = function(state, silent) {
    /** @type {boolean} */
    this.state = state !== undefined ? state : !this.state;

    if (this.state) {
        this.el.classList.add('m-checked');
        this.el.classList.remove('m-unchecked');
    } else {
        this.el.classList.remove('m-checked');
        this.el.classList.add('m-unchecked');
    }

    if (!silent) {
        this.el.dispatchEvent(new CustomEvent('check', {
            bubbles: true,
            detail: { checked: this.state }
        }));
    }
};