import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPostMessage = vi.fn();
const mockLookupByEmail = vi.fn();

vi.mock("@slack/web-api", () => {
  return {
    WebClient: class MockWebClient {
      chat = { postMessage: mockPostMessage };
      users = { lookupByEmail: mockLookupByEmail };
    },
  };
});

vi.mock("../lib/firebase", () => ({
  getSecret: vi.fn().mockResolvedValue("xoxb-fake-token"),
}));

// Import after mocks are set up
const { lookupSlackUser, sendSlackDM, _resetClient } = await import("../lib/slack");

describe("lookupSlackUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetClient();
  });

  it("returns user ID on successful lookup", async () => {
    mockLookupByEmail.mockResolvedValueOnce({ user: { id: "U123ABC" } });
    const result = await lookupSlackUser("alice@example.com");
    expect(result).toBe("U123ABC");
    expect(mockLookupByEmail).toHaveBeenCalledWith({ email: "alice@example.com" });
  });

  it("returns null and logs warn when users_not_found", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockLookupByEmail.mockRejectedValueOnce({ data: { error: "users_not_found" } });

    const result = await lookupSlackUser("unknown@example.com");
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[slack] User not found for email: unknown@example.com"),
    );

    warnSpy.mockRestore();
  });

  it("returns null and logs error on other errors", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockLookupByEmail.mockRejectedValueOnce(new Error("network failure"));

    const result = await lookupSlackUser("fail@example.com");
    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[slack] lookupByEmail failed for fail@example.com"),
      expect.anything(),
    );

    errorSpy.mockRestore();
  });
});

describe("sendSlackDM", () => {
  const testMessage = {
    text: "Test notification",
    blocks: [{ type: "section" as const, text: { type: "mrkdwn" as const, text: "Hello" } }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    _resetClient();
  });

  it("calls chat.postMessage with userId as channel when user found", async () => {
    mockLookupByEmail.mockResolvedValueOnce({ user: { id: "U123ABC" } });
    mockPostMessage.mockResolvedValueOnce({ ok: true });

    await sendSlackDM("alice@example.com", testMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      channel: "U123ABC",
      text: testMessage.text,
      blocks: testMessage.blocks,
    });
  });

  it("does not call chat.postMessage when user not found", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockLookupByEmail.mockRejectedValueOnce({ data: { error: "users_not_found" } });

    await sendSlackDM("unknown@example.com", testMessage);

    expect(mockPostMessage).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("catches postMessage errors and does not throw", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockLookupByEmail.mockResolvedValueOnce({ user: { id: "U123ABC" } });
    mockPostMessage.mockRejectedValueOnce(new Error("channel_not_found"));

    // Should not throw
    await expect(sendSlackDM("alice@example.com", testMessage)).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[slack] Failed to DM alice@example.com"),
      expect.anything(),
    );

    errorSpy.mockRestore();
  });
});
