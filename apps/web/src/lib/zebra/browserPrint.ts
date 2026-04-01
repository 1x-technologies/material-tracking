export const BROWSER_PRINT_BASE_URL = "http://localhost:9100";

export interface ZebraPrinter {
  uid: string;
  name: string;
  connection: string;
  deviceType: string;
}

export interface BrowserPrintError {
  type: "agent_unavailable" | "no_printers" | "send_failed";
  message: string;
  instructions?: string;
}

const AGENT_UNAVAILABLE_INSTRUCTIONS =
  "Zebra Browser Print is not running. Please ensure the Zebra Browser Print application is installed and running on this device. Download it from zebra.com/browserprint.";

export async function checkAgent(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${BROWSER_PRINT_BASE_URL}/available`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

export async function discoverPrinters(): Promise<
  { printers: ZebraPrinter[] } | { error: BrowserPrintError }
> {
  const agentReady = await checkAgent();
  if (!agentReady) {
    return {
      error: {
        type: "agent_unavailable",
        message: "Zebra Browser Print agent is not reachable.",
        instructions: AGENT_UNAVAILABLE_INSTRUCTIONS,
      },
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${BROWSER_PRINT_BASE_URL}/available`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json();

    const printers: ZebraPrinter[] = Array.isArray(data?.printer)
      ? data.printer
      : Array.isArray(data)
        ? data
        : [];

    if (printers.length === 0) {
      return {
        error: {
          type: "no_printers",
          message:
            "No Zebra printers found. Ensure a printer is connected and powered on.",
        },
      };
    }

    return { printers };
  } catch {
    return {
      error: {
        type: "agent_unavailable",
        message: "Failed to communicate with the Zebra Browser Print agent.",
        instructions: AGENT_UNAVAILABLE_INSTRUCTIONS,
      },
    };
  }
}

export async function sendZpl(
  printer: ZebraPrinter,
  zpl: string,
): Promise<{ success: true } | { error: BrowserPrintError }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${BROWSER_PRINT_BASE_URL}/write`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ device: { uid: printer.uid }, data: zpl }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        error: {
          type: "send_failed",
          message: `Print failed with status ${response.status}: ${response.statusText}`,
        },
      };
    }

    return { success: true };
  } catch (err) {
    return {
      error: {
        type: "send_failed",
        message: `Failed to send ZPL to printer: ${err instanceof Error ? err.message : "Unknown error"}`,
      },
    };
  }
}
