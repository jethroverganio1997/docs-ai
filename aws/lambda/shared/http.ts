type ApiGatewayEvent = {
  httpMethod?: string;
  requestContext?: {
    http?: {
      method?: string;
    };
  };
};

type LambdaResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

function getCorsOrigin() {
  return process.env.CORS_ALLOW_ORIGIN?.trim() || "*";
}

function createCorsHeaders(allowedMethods: string) {
  return {
    "Access-Control-Allow-Origin": getCorsOrigin(),
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": allowedMethods,
    "Access-Control-Max-Age": "86400",
  };
}

export function getRequestMethod(event: ApiGatewayEvent) {
  return event.requestContext?.http?.method ?? event.httpMethod ?? "GET";
}

export function createJsonResponse(
  statusCode: number,
  body: unknown,
  allowedMethods: string,
): LambdaResponse {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...createCorsHeaders(allowedMethods),
    },
    body: JSON.stringify(body),
  };
}

export function createOptionsResponse(allowedMethods: string): LambdaResponse {
  return {
    statusCode: 204,
    headers: createCorsHeaders(allowedMethods),
    body: "",
  };
}
