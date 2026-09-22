import {
  NextRequest,
  NextResponse,
} from "next/server";

import apm from "@/app/apm";

const ELASTIC_URL =
  process.env.ELASTIC_KIBANA_URL!;

const API_KEY =
  process.env.ELASTIC_API_KEY!;

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const transaction = apm.startTransaction(
    "Get Agent Conversation",
    "request"
  );

  try {
    const { id } = await params;

    if (!id) {
      transaction.result = "HTTP 400";
      transaction.outcome = "failure";

      return NextResponse.json(
        {
          error: "Conversation ID is required",
        },
        {
          status: 400,
        }
      );
    }

    transaction.addLabels({
      conversation_id: id,
    });

    const span = apm.startSpan(
      "Elastic Conversation API",
      "external.http"
    );

    const response = await fetch(
      `${ELASTIC_URL}/api/agent_builder/conversations/${encodeURIComponent(
        id
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
            "Failed to fetch conversation",

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

    console.error(error);

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