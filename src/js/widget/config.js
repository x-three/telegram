/** 
 * @typedef {{ [id: string]: boolean }} TVisible
 * @typedef {{ duration: number, easing: string }} TFx
 * @typedef {{ days: string[], months: string[], separator: {decimal: string, thousand: string}, suffixes: string[] }} TLocalization
 * @typedef {{ family: string, size: number, hLetter: number, weight: number, color: string }} TFont
 * @typedef {{ start: number, end?: number, min: number, max?: number, adaptive?: number }} TColumns
 * @typedef {{ hLine: string, vLine: string }} TChartColor
 * @typedef {{ graph: number, grid: number }} TChartThickness
 * @typedef {{ top: number, bottom: number, left?: number, right?: number }} TChartMargin
 * @typedef {{ left: number, bottom: number }} TChartLabelVOffset
 * @typedef {{ color: TChartColor, thickness: TChartThickness, margin: TChartMargin, labelVOffset: TChartLabelVOffset, tails: boolean }} TChart
 * @typedef {{ thickness: number, margin: number }} TPreview
 * @typedef {{ crossingRadius: number, offset: number }} TTooltip
 * @typedef {{ visible: TVisible, fx: TFx, localization: TLocalization, font: TFont, columns: TColumns, chart: TChart, preview: TPreview, tooltip: TTooltip }} TWidgetConfig
 */


/** @type {TWidgetConfig} */
export const config = {
    visible: {          // Visible graphs on startup
        y0: true, 
        y1: true, 
        y2: true, 
        y3: true 
    },

    fx: {
        duration: 350,
        easing: 'easeOutQuad'
    },

    localization: {
        days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
        separator: { decimal: '.', thousand: ' ' },
        suffixes: ['K', 'M', 'G', 'T']
    },

    font: {
        family: 'Arial, sans-serif',
        size: 15,
        hLetter: 1 / 1.4,
        weight: 400,
        color: '#697d8cb2'
    },

    columns: {
        start: 0,       // First visible column (0 - the most recent date)
        // end: 111,    // Last visible column
        min: 13,        // Min visible columns  
        // max: 50,     // Max visible columns
        adaptive: 606   // Scales min and max properties relative to this value. If this property is missing, then min and max will be fixed for any screen width.
    },

    chart: {
        color: {        // Horizontal and vertical lines color
            hLine: '#61788514',
            vLine: '#809baf40'
        },
        thickness: {    // Line width
            graph: 3,
            grid: 1.5
        },
        margin: {
            top: 32,
            bottom: 28
        },
        labelVOffset: { // Vertical offset of labels relative to horizontal lines
            left: 9,
            bottom: 9
        },
        tails: true     // Draw side tails
    },

    preview: {
        thickness: 1.5, // Line width
        margin: 5
    },

    tooltip: {
        crossingRadius: 6,
        offset: 37
    }
};