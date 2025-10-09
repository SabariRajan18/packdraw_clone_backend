module.exports = {
  apps: [
    {
      name: "Packdraw_Clone",
      script: "src/server.ts",
      watch: false,
      instances: 1,
      autorestart: true,
      error_file: "./src/pm2/err-0.log",
      out_file: "./src/pm2/out-0.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};