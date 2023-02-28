module.exports = {
    apps: [
        {
            error_file: "/var/log/pm2_err.log",
            out_file: "/var/log/pm2_out.log",
            name: "api",
            script: "npm",
            watch: false,
            args: "run start:app",
            cwd: "/var/app/",
        },
        {
            error_file: "/var/log/pm2_err_wss.log",
            out_file: "/var/log/pm2_out_wss.log",
            name: "wss",
            script: "npm",
            watch: false,
            args: "run start:wss",
            cwd: "/var/app/",
        },
    ],
};
