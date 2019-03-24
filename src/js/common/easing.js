/** @type {{ [name: string]: (time: number) => number }} */
export const easing = {
    linear: (t) => t,

    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => 1 - easing.easeInQuad(1 - t),
    easeInOutQuad: (t) => t < 0.5 ? (easing.easeInQuad(t * 2) / 2) : (easing.easeOutQuad(t * 2 - 1) / 2 + 0.5),

    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => 1 - easing.easeInCubic(1 - t),
    easeInOutCubic: (t) => t < 0.5 ? (easing.easeInCubic(t * 2) / 2) : (easing.easeOutCubic(t * 2 - 1) / 2 + 0.5),

    easeInQuart: (t) => t * t * t * t,
    easeOutQuart: (t) => 1 - easing.easeInQuart(1 - t),
    easeInOutQuart: (t) => t < 0.5 ? (easing.easeInQuart(t * 2) / 2) : (easing.easeOutQuart(t * 2 - 1) / 2 + 0.5),

    easeInQuint: (t) => t * t * t * t * t,
    easeOutQuint: (t) => 1 - easing.easeInQuint(1 - t),
    easeInOutQuint: (t) => t < 0.5 ? (easing.easeInQuint(t * 2) / 2) : (easing.easeOutQuint(t * 2 - 1) / 2 + 0.5),
};