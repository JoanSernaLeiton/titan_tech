const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function middlewareRequest(
  providerSlug: string,
  path: string,
  options: {
    method: "GET" | "POST";
    queryParams?: Record<string, string>;
    body?: unknown;
  }
): Promise<unknown> {
  const baseUrl = process.env.TINKU_BASE_URL;
  if (baseUrl == null || baseUrl === "") {
    throw new Error("TINKU_BASE_URL environment variable is not set");
  }

  const apiKey = process.env.TINKU_API_KEY;
  if (apiKey == null || apiKey === "") {
    throw new Error("TINKU_API_KEY environment variable is not set");
  }

  const headers: Record<string, string> = {
    Authorization: `tk_${apiKey}`,
    "Content-Type": "application/json",
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      let url = `${baseUrl}/${providerSlug}${path}`;

      if (options.queryParams != null && Object.keys(options.queryParams).length > 0) {
        const params = new URLSearchParams(options.queryParams);
        url = `${url}?${params.toString()}`;
      }

      const fetchOptions: RequestInit = {
        method: options.method,
        headers,
      };

      if (options.method === "POST" && Boolean(options.body)) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, fetchOptions);

      if (response.status === 401) {
        throw new Error("Unauthorized: Invalid or missing API key");
      }

      if (response.status === 502 || response.status === 503) {
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        if (attempt < MAX_RETRIES - 1) {
          await delay(backoffMs);
          continue;
        }
        throw new Error(`Provider service unavailable (${String(response.status)}) after ${String(MAX_RETRIES)} retries`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${String(response.status)}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (
        error instanceof Error &&
        (error.message.includes("Unauthorized") || error.message.includes("Invalid or missing API key"))
      ) {
        throw error;
      }

      if (attempt < MAX_RETRIES - 1) {
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        await delay(backoffMs);
      }
    }
  }

  throw lastError ?? new Error("Failed to fetch from middleware after maximum retries");
}
