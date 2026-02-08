import { PassThrough } from "stream";
import { renderToReadableStream } from "react-dom/server";
import { type AppLoadContext } from "react-router";
import { isbot } from "isbot";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: AppLoadContext
) {
  const userAgent = request.headers.get("user-agent");

  const readable = await renderToReadableStream(
    routerContext.startViewTransition ? (
      <routerContext.startViewTransition />
    ) : (
      routerContext.root
    ),
    {
      signal: request.signal,
      onError(error: unknown) {
        console.error(error);
        responseStatusCode = 500;
      },
    }
  );

  if (isbot(userAgent)) {
    await readable.allReady;
  }

  responseHeaders.set("Content-Type", "text/html; charset=utf-8");
  return new Response(readable, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
