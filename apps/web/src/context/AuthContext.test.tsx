import { describe, expect, it, vi } from "vitest";

const mockSetCustomParameters = vi.fn();

vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: class MockGoogleAuthProvider {
    setCustomParameters = mockSetCustomParameters;
  },
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock("../firebase", () => ({
  firebaseAuth: {},
  firestore: {},
}));

describe("AuthContext", () => {
  it("configures Google provider with hd: 1x.tech", async () => {
    const { GOOGLE_HD_PARAM } = await import("./AuthContext");

    expect(GOOGLE_HD_PARAM).toBe("1x.tech");
    expect(mockSetCustomParameters).toHaveBeenCalledWith({ hd: "1x.tech" });
  });
});
