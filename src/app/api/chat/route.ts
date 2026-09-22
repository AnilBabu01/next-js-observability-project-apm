import { NextRequest, NextResponse } from "next/server";
import apm from "@/app/apm";

const ELASTIC_URL = process.env.ELASTIC_KIBANA_URL!;
const API_KEY = process.env.ELASTIC_API_KEY!;
const AGENT_ID =
  process.env.ELASTIC_AGENT_ID || "elk-log-analysis-agent";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const transaction = apm.startTransaction(
    "Agent Builder Chat",
    "request"
  );

  try {
    const body = await req.json();

    const input = body.input;
    const conversationId = body.conversation_id;

    if (!input || typeof input !== "string") {
      transaction.result = "HTTP 400";
      transaction.outcome = "failure";

      return NextResponse.json(
        {
          error: "input is required",
        },
        {
          status: 400,
        }
      );
    }

    // Add useful metadata to APM
    transaction.addLabels({
      agent_id: AGENT_ID,
      has_conversation_id: Boolean(conversationId),
    });

    transaction.setOutcome("success");

    const elasticBody: Record<string, string> = {
      agent_id: AGENT_ID,
      input,
    };

    if (conversationId) {
      elasticBody.conversation_id = conversationId;
    }

    // ---------------------------------------------------------
    // Custom span for Elastic Agent Builder
    // ---------------------------------------------------------

    const span = apm.startSpan(
      "Elastic Agent Builder",
      "external.http"
    );

    span?.setLabel("agent_id", AGENT_ID);

    const startTime = Date.now();

    const response = await fetch(
      `${ELASTIC_URL}/api/agent_builder/converse`,
      {
        method: "POST",

        headers: {
          Authorization: `ApiKey ${API_KEY}`,
          "Content-Type": "application/json",
          "kbn-xsrf": "true",
        },

        body: JSON.stringify(elasticBody),

        cache: "no-store",
      }
    );

    const duration = Date.now() - startTime;

    span?.setLabel(
      "elastic_response_time_ms",
      duration
    );

    span?.setOutcome(
      response.ok ? "success" : "failure"
    );

    span?.end();

    const data = await response.json();

    if (!response.ok) {
      transaction.result = `HTTP ${response.status}`;
      transaction.outcome = "failure";

      return NextResponse.json(
        {
          error:
            "Elastic Agent Builder request failed",

          details: data,
        },
        {
          status: response.status,
        }
      );
    }

    transaction.result = "HTTP 200";
    transaction.outcome = "success";

    return NextResponse.json(data);

  } catch (error) {
    transaction.result = "HTTP 500";
    transaction.outcome = "failure";

    apm.captureError(error as Error);

    console.error(
      "Agent Builder error:",
      error
    );

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );

  } finally {
    transaction.end();
  }
}