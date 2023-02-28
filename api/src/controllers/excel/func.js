let xl = require('excel4node');
let wb = new xl.Workbook();
module.exports = {
    correctColorStyle: (tmp,styles,inverse=false) => {
        if (inverse) {
            return tmp <= 0 ? styles.styleGreen : styles.styleRed
        }
        return tmp >= 0 ? styles.styleGreen : styles.styleRed
    },
    posNumberFormatter: (num,withoutPlus=false, noReplace = false) => {
        let string = (num >= 0 ? (withoutPlus ? '' : '+') : '') + num.toLocaleString()
        if (!noReplace) {
            string.replace(/,/mig, ' ')
        }
        return string
    },
    getHeader: (ws, arr, style, row, col, step= 1) => {
        col = col || 1
        let offset = step + 1
        arr.map(colElem => {
            if ('width' in colElem) {
                ws.column(col).setWidth(colElem.width)
            }
            if (step > 1) {
                ws.cell(row, col, row, offset , true).string(colElem.text).style(colElem.style?colElem.style:style);
                col+=step
                offset+=step
            }
            else {
                ws.cell(row, col).string(colElem.text).style(colElem.style?colElem.style:style);
                col+=step
            }
        })
        return ws
    },
    defStyles: {
        style: wb.createStyle({
            border: {
                left: {style: 'thin', color: 'CE000000'},
                right: {style: 'thin', color: 'CE000000'},
                top: {style: 'thin', color: 'CE000000'},
                bottom: {style: 'thin', color: 'CE000000'}
            },
            margins: {
                left: 0,
                right: 0,
            },
            alignment: {
                horizontal: ['center'],
                vertical: ['center'],
                wrapText: true,
            },
            font: {
                size: 12,
            },
            numberFormat: '#,##0; -#,##0;0',
        }),
        boldText: wb.createStyle({
            border: {
                left: {style: 'thin', color: 'CE000000'},
                right: {style: 'thin', color: 'CE000000'},
                top: {style: 'thin', color: 'CE000000'},
                bottom: {style: 'thin', color: 'CE000000'}
            },
            margins: {
                left: 0,
                right: 0,
            },
            alignment: {
                horizontal: ['center'],
                vertical: ['center'],
                wrapText: true,
            },
            font: {
                bold: true,
                size: 12,
            },
            numberFormat: '#,##0; -#,##0;0',
        })
    },
    getDayAndMOnth: (timestamp) => {
        let datetime = new Date(timestamp * 1000)
        let date = datetime.toLocaleDateString("ru-RU").split('.')
        return `${date[0]}.${date[1]}`
    }
}
//для % {numberFormat: '#,##0.00; -#,##0.00;0'}
