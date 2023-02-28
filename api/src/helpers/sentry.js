const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const {SENTRY, PRODUCTION} = require("../config");

module.exports = (app) => {
    if (SENTRY !== false) {
        Sentry.init({
            environment: PRODUCTION ? "production" : "develop",
            dsn: SENTRY,
            integrations: [
                new Sentry.Integrations.Http({breadcrumbs: true, tracing: true}),
                new Tracing.Integrations.Express({app}),
            ],
            tracesSampleRate: 0.3,
        });
        app.use(Sentry.Handlers.requestHandler());
        app.use(Sentry.Handlers.tracingHandler());
    }
};
