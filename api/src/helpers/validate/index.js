const Ajv = require("ajv");
const ajv = new Ajv({allErrors: true});
const fs = require("fs");
const {checkPassword} = require("../helper");

ajv.addKeyword({
    keyword: "validatePasswordForSim",
    schema: false,
    errors: true,
    validate: function (data) {
        return checkPassword(data.value)
    }
});


readSchemas(`${__dirname}`);

function readSchemas(dir) {
    fs.readdirSync(dir).map((module) => {
        if (module.indexOf(".json") !== -1) {
            const nameByPath =  dir.split("validate/").length>=2 ? dir.split("validate/")[1].replaceAll("/", "_").replaceAll("\\", "_") +"_" : "";
            ajv.addSchema(require(`${dir}/${module}`), nameByPath + module.replace(".json", ""));
        } else if (module.indexOf(".") === -1) {
            readSchemas(`${dir}/${module}`);
        }
    });
}

function errorResponse(schemaErrors) {
    const errors = schemaErrors.map((error) => ({
        path: error.instancePath.length ? error.instancePath : undefined,
        requireType: error.params.type,
        message: error.message,
    }));
    return {
        errors: errors,
    };
}

module.exports = (schemaName) => async (req, res, next) => {
    try {
        if (
            !ajv.validate(schemaName, {...req.body, ...req.files, ...req.params})
        ) {
            return res.status(400).send(errorResponse(ajv.errors));
        }
        next();
    } catch (error) {
        next(error);
    }
};
