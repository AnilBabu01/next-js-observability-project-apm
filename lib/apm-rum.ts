"use client";

import { init as initApm } from "@elastic/apm-rum";

let initialized = false;

export function initializeRUM() {
  if (initialized) {
    return;
  }

  initialized = true;

  initApm({
    serviceName:
      process.env.NEXT_PUBLIC_ELASTIC_APM_SERVICE_NAME ||
      "nextjs-elastic-agent",

    serverUrl:
      process.env.NEXT_PUBLIC_ELASTIC_APM_SERVER_URL,

    serviceVersion:
      process.env.NEXT_PUBLIC_APP_VERSION ||
      "1.0.0",

    environment:
      process.env.NEXT_PUBLIC_ELASTIC_APM_ENVIRONMENT ||
      "development",

    distributedTracingOrigins: [
      window.location.origin,
    ],

    // pageLoadTraceIdEnabled: true,

    active: true,
  });
}