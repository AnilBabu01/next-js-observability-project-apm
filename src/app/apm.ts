import apm from "elastic-apm-node";

if (!apm.isStarted()) {
  apm.start({
    serviceName:
      process.env.ELASTIC_APM_SERVICE_NAME ||
      "nextjs-elastic-agent",

    serverUrl: process.env.ELASTIC_APM_SERVER_URL,

    secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,

    environment:
      process.env.ELASTIC_APM_ENVIRONMENT ||
      process.env.NODE_ENV ||
      "development",

    active: process.env.ELASTIC_APM_ACTIVE !== "false",

    instrument: true,

    captureBody: "transactions",

    transactionSampleRate: 1.0,

    centralConfig: true,
  });
}

export default apm;

