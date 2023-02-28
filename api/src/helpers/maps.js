module.exports = {
    passwords: {
        map: {
            id: {
                item: "passwords.id",
                type: "number",
                table: false,
            },
            value: {
                item: "passwords.value",
                type: "string",
                table: false,
            },
            operator: {
                item: "passwords.operator",
                type: "string",
                table: false,
            },
            description: {
                item: "passwords.description",
                type: "string",
                table: false,
            },
            phones_cnt: {
                item: "count(`phones`.`phone`)",
                type: "number",
                table: "phones",
            },
        },
        tables: {
            phones: {
                item: "left join phones on phones.password_id=passwords.id",
                link: false,
            },
        }
    },
    messages: {
        map: {
            id: {
                item: "messages.id",
                type: "string",
                table: false,
            },
            created_at: {
                item: "messages.created_at",
                type: "integer",
                table: false,
            },
            finished_at: {
                item: "messages.finished_at",
                type: "integer",
                table: false,
            },
            phone: {
                item: "messages.phone",
                type: "integer",
                table: false,
            },
            status: {
                item: "messages.status",
                type: "integer",
                table: false,
            },
            action_type: {
                item: "messages.action_type",
                type: "string",
                table: false,
            },
            error: {
                item: "messages.error",
                type: "string",
                table: false,
            },
            data: {
                item: "messages.data",
                type: "json",
                table: false,
            },
        },
        tables: {}
    },
    phones: {
        map: {
            phone: {
                item: "phones.phone",
                type: "string",
                table: false,
            },
            password_id: {
                item: "phones.password_id",
                type: "number",
                table: false,
            },
            operator: {
                item: "passwords.operator",
                type: "string",
                table: "passwords",
            },
            current_password: {
                item: "phones.current_password",
                type: "string",
                table: false,
            },
            auto_pay: {
                item: "phones.auto_pay",
                type: "number",
                table: false,
            },
            min_value: {
                item: "phones.min_value",
                type: "number",
                table: false,
            },
            fio: {
                item: "phones.fio",
                type: "string",
                table: false,
            },
            is_active: {
                item: "phones.is_active",
                type: "number",
                table: false,
            },
            sip: {
                item: "phones.sip",
                type: "string",
                table: false,
            },
            comment: {
                item: "phones.comment",
                type: "string",
                table: false,
            },
            tariff_cost: {
                item: "phones.tariff_cost",
                type: "number",
                table: false,
            },
            balance: {
                item: "phones.balance",
                type: "number",
                table: false,
            },
            gb_packet: {
                item: "phones.gb_packet",
                type: "string",
                table: false,
            },
            gb_available: {
                item: "phones.gb_available",
                type: "string",
                table: false,
            },
            tariff_date: {
                item: "phones.tariff_date",
                type: "number",
                table: false,
            },
            last_error: {
                item: "phones.last_error",
                type: "string",
                table: false,
            },
            qiwi_token_id: {
                item: "phones.qiwi_token_id",
                type: "number",
                table: false,
            },
            qiwi_token: {
                item: "qiwi_tokens.token",
                type: "number",
                table: "qiwi_tokens",
            },
            qiwi_token_descr: {
                item: "qiwi_tokens.description",
                type: "number",
                table: "qiwi_tokens",
            },
            last_pars_timestamp: {
                item: "phones.last_pars_timestamp",
                type: "number",
                table: false,
            },
            status: {
                item: "phones.status",
                type: "number",
                table: false,
            },
            in_pay: {
                item: "phones.in_pay",
                type: "number",
                table: false,
            }
        },
        tables: {
            qiwi_tokens: {
                item: "left join qiwi_tokens on phones.qiwi_token_id=qiwi_tokens.id",
                link: false,
            },
            passwords: {
                item: "left join passwords on phones.password_id=passwords.id",
                link: false,
            }
        },
    },
    qiwi_tokens: {
        map: {
            id: {
                item: "qiwi_tokens.id",
                type: "number",
                table: false,
            },
            token: {
                item: "qiwi_tokens.token",
                type: "string",
                table: false,
            },
            is_active: {
                item: "qiwi_tokens.is_active",
                type: "number",
                table: false,
            },
            balance: {
                item: "qiwi_tokens.balance",
                type: "number",
                table: false,
            },
            limit: {
                item: "qiwi_tokens.limit",
                type: "number",
                table: false,
            },
            description: {
                item: "qiwi_tokens.description",
                type: "number",
                table: false,
            }
        },
        tables: {}
    }
}
