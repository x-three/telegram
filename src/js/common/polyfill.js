import { merge } from './utils';


(function() { // Custom Event for IE11
    if (typeof window.CustomEvent === 'function') return false;

    function CustomEvent(name, params) {
        params = merge({ bubbles: false, cancelable: false, detail: undefined }, params);
        const ev = document.createEvent('CustomEvent');
        ev.initCustomEvent(name, params.bubbles, params.cancelable, params.detail);
        return ev;
    }

    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
})();