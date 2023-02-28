const XLSX = require("xlsx");
const db = require('../../db');
const {getNumberRaw} = require("../../helpers/helper");
const xl = require('excel4node');
const {defStyles, getHeader} = require('./func');
const {style} = defStyles;
const {formatDateJS} = require("../../helpers/dates");

const excel = {};

excel.parsePhonesFromExcel = async (buffer) => {
    let wb = XLSX.read(buffer, {type: 'buffer'});
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {range: 1});
    const passwordsById = await db.passwords.__filter({}).then(({data}) => data.reduce((acc, el) => {
        acc[el.id] = el;
        return acc;
    }, {}));
    const getPassId = (passId) => {
        if (parseInt(passId) === 0) {
            return null;
        } else if ([1, 2, 3, 4, 5].includes(parseInt(passId))) {
            return parseInt(passId)
        } else if (typeof passId === "string" && passId.length === 0) {
            return 5
        } else if (typeof passId === "string" && passId.length) {
            return null;
        }
        return null;
    }
    const getCurPass = (passId) => {
        if ([1, 2, 3, 4, 5].includes(parseInt(passId))) {
            return passwordsById[passId].value;
        } else {
            return null
        }
    }
    return rows.reduce((phones, row) => {
        if (row["номер сим в формате 9001234567"]) {
            const passId = getPassId(row['Признак при оплате (см. ниже)'] ?? 5);
            const curPassString = row['Признак при оплате (см. ниже)'] ?? "";
            phones.push({
                //важные поля
                phone: getNumberRaw(row["номер сим в формате 9001234567"].toString()),
                password_id: passId,
                current_password: getCurPass(passId) ?? curPassString,
                is_active: !!passId,
                min_value: parseInt(row['Требуемый баланс']) || 0,
                tariff_date: null,
                //неважные поля
                fio: row['ФИО на кого оформлена (проставляет проверочный робот)']?.toString() || "",
                sip: row['Не используется, пишем чья сим ( номер)']?.toString() || "",
                comment: row['Наш коммент']?.toString() || "",
                //доп поля для фронта
                operator: passId ? passwordsById[passId].operator : (curPassString==0?"":`Неизвестен. Пароль по умолчанию ${curPassString}`),
            });
        }
        return phones;
    }, []);
}

excel.generatePhonesExcel = async () => {
    let wb = new xl.Workbook();
    let ws = wb.addWorksheet('1');
    let header1 = [
        {
            text: 'SIP',
            width: 10,
        },
        {
            text: 'Комментарий',
            width: 20,
        },
        {
            text: 'new sim',
            width: 30,
        },
        {
            text: '',
            width: 20,
        },
        {
            text: '',
            width: 20,
        },
        {
            text: '',
            width: 40,
        },
        {
            text: 'new sim2',
            width: 20,
        },
        {
            text: 'ГБ',
            width: 10,
        },
        {
            text: '',
            width: 20,
        },
        {
            text: 'Не оплачивать (0)',
            width: 20,
        },
        {
            text: 'Ошибки',
            width: 20,
        },
        {
            text: 'Коммент робота',
            width: 20,
        },
        {
            text: '',
            width: 20,
        },
        {
            text: 'Платить?',
            width: 20,
        },
        {
            text: 'Требуемый баланс',
            width: 20,
        },
        {
            text: 'ФИО на кого оформлена',
            width: 20,
        },
    ];
    let header2 = [
        {
            text: 'Не используется, пишем чья сим ( номер)',
            width: 10,
        },
        {
            text: 'Наш коммент',
            width: 20,
        },
        {
            text: 'номер сим в формате 9001234567',
            width: 30,
        },
        {
            text: 'стоимость тарифа',
            width: 20,
        },
        {
            text: 'текущий баланс (проставляет проверочный робот)',
            width: 20,
        },
        {
            text: 'сколько оплачено ( проставляет робот платы)',
            width: 40,
        },
        {
            text: 'номер в формате +79001234567',
            width: 20,
        },
        {
            text: 'кол-во ГБ в пакете (проставляет проверочный робот)',
            width: 10,
        },
        {
            text: 'Дата списания по тарифу (проставляет проверочный робот)',
            width: 20,
        },
        {
            text: 'Признак при оплате (см. ниже)',
            width: 20,
        },
        {
            text: 'Для ошибок при оплате (проставляет робот оплаты)',
            width: 20,
        },
        {
            text: 'сейчас не используется',
            width: 20,
        },
        {
            text: '',
            width: 20,
        },
        {
            text: 'признак для оплаты (1-платить)',
            width: 20,
        },
        {
            text: 'Требуемый баланс',
            width: 20,
        },
        {
            text: 'ФИО на кого оформлена (проставляет проверочный робот)',
            width: 20,
        },
    ];
    ws = getHeader(ws, header1, style, 1)
    ws = getHeader(ws, header2, style, 2)
    const data = await db.phones.__filter({}).then(({data}) => data);
    const passwordsById = await db.passwords.__filter({}).then(({data}) => data).then(arr => arr.reduce((acc, el) => {
        acc[el.id] = el;
        return acc;
    }, {}));
    const NumFromObj = (phoneObj) => {
        const opById = {
            1: "1",
            2: "2",
            3: "3",
            4: "4",
            5: "",
        }
        if (phoneObj.password_id > 0 && opById.hasOwnProperty(phoneObj.password_id) && passwordsById[phoneObj.password_id].value === phoneObj.current_password) {
            return opById[phoneObj.password_id];
        } else if (phoneObj.password_id > 0) {
            return phoneObj.current_password
        } else {
            return "0";
        }
    }
    let row = 3;
    for (let i = 0; i < data.length; i++) {
        let col = 1
        let el = data[i]
        ws.cell(row, col).string(el.sip ?? "").style(style);col++
        ws.cell(row, col).string(el.comment ?? "").style(style);col++
        ws.cell(row, col).string(el.phone.toString()).style(style);col++
        ws.cell(row, col).number(el.tariff_cost || 0).style(style);col++
        ws.cell(row, col).number(el.balance || 0).style(style);col++
        ws.cell(row, col).number(0).style(style);col++
        ws.cell(row, col).string("+7" + el.phone.toString()).style(style);col++
        ws.cell(row, col).string(el.gb_packet?.toString() ?? "").style(style);col++
        ws.cell(row, col).string(el.tariff_date ? formatDateJS(el.tariff_date, "DD.MM.YYYY") : "").style(style);col++
        ws.cell(row, col).string(NumFromObj(el)).style(style);col++
        ws.cell(row, col).string(el.last_error ?? "").style(style);col++
        ws.cell(row, col).string("").style(style);col++
        ws.cell(row, col).string("").style(style);col++
        ws.cell(row, col).number(0).style(style);col++
        ws.cell(row, col).number(el.min_value ?? 0).style(style);col++
        ws.cell(row, col).string(el.fio ?? "").style(style);col++
        row++
    }

    row++
    ws.cell(row, 1).string("Признаки оплаты:");row++
    ws.cell(row, 1).string("(Пустое поле) - мегафон, пароль вариант 1");row++
    ws.cell(row, 1).string("1 -  мегафон, пароль вариант 2");row++
    ws.cell(row, 1).string("2 - МТС, пароль от МТС");row++
    ws.cell(row, 1).string("3 - Теле2, пароль от Теле2");row++
    ws.cell(row, 1).string("4 - Биллайн, пароль от билайн");row++
    return {excelObject: wb, name: `Выгрузка телефонов.xlsx`}
}
module.exports = excel;
