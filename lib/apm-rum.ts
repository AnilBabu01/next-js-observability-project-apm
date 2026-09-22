"use client";

import { init as initApm } from "@elastic/apm-rum";

let initialized = false;

export function initializeRUM() {
  if (initialized) return;

  initialized = true;

  initApm({
    serviceName:
      process.env.NEXT_PUBLIC_ELASTIC_APM_SERVICE_NAME ||
      "nextjs-elastic-browser-agent",

    serverUrl:
      process.env.NEXT_PUBLIC_ELASTIC_APM_SERVER_URL,

    serviceVersion:
      process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",

    environment:
      process.env.NEXT_PUBLIC_ELASTIC_APM_ENVIRONMENT ||
      "development",

    active: true,

    distributedTracingOrigins: [
      window.location.origin,
    ],
  });
}