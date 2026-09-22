import apm from "@/app/apm";
import { NextResponse } from "next/server";

const ELASTIC_URL = process.env.ELASTIC_KIBANA_URL;
const API_KEY = process.env.ELASTIC_API_KEY;
const ELASTIC_AGENT_ID = process.env.ELASTIC_AGENT_ID;

export async function GET() {
  // Start APM transaction
  const transaction = apm.startTransaction(
    "GET /api/conversations",
    "request"
  );

  try {
    // Validate environment variables
    if (!ELASTIC_URL || !API_KEY || !ELASTIC_AGENT_ID) {
      const error = new Error(
        "Missing required Elastic environment variables"
      );

      apm.captureError(error);

      transaction?.setOutcome("failure");
      transaction?.end();

      return NextResponse.json(
        {
          error: "Server configuration error",
          details: "Missing Elastic environment variables",
        },
        { status: 500 }
      );
    }

    // Create span for Elastic API request
    const span = transaction?.startSpan(
      "Fetch Agent Builder conversations",
      "external",
      "http"
    );

    try {
      const response = await fetch(
        `${ELASTIC_URL}/api/agent_builder/conversations?agent_id=${encodeURIComponent(
          ELASTIC_AGENT_ID
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `ApiKey ${API_KEY}`,
            "kbn-xsrf": "true",
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      // Add useful APM span information
      span?.setOutcome(response.ok ? "success" : "failure");

      if (!response.ok) {
        const error = new Error(
          `Elastic Agent Builder API returned ${response.status}`
        );

        apm.captureError(error);

        transaction?.setOutcome("failure");

        return NextResponse.json(
          {
            error: "Failed to fetch conversations",
            details: data,
          },
          { status: response.status }
        );
      }

      transaction?.setOutcome("success");

      return NextResponse.json(data);
    } catch (error) {
      span?.setOutcome("failure");

      if (error instanceof Error) {
        apm.captureError(error);
      } else {
        apm.captureError(new Error(String(error)));
      }

      transaction?.setOutcome("failure");

      console.error("Elastic Agent Builder API error:", error);

      return NextResponse.json(
        {
          error: "Failed to communicate with Elastic Agent Builder",
        },
        { status: 502 }
      );
    } finally {
      span?.end();
    }
  } catch (error) {
    transaction?.setOutcome("failure");

    if (error instanceof Error) {
      apm.captureError(error);
    } else {
      apm.captureError(new Error(String(error)));
    }

    console.error("API route error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  } finally {
    // Always end transaction
    transaction?.end();
  }
}