import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const loginMock = vi.fn();
const logoutMock = vi.fn();
const meMock = vi.fn();
const resetDemoStateMock = vi.fn();
const setTokensMock = vi.fn();
const getAccessTokenMock = vi.fn();

vi.mock("@/services", () => ({
  isDemoMode: true,
  api: {
    auth: {
      login: (...args: unknown[]) => loginMock(...args),
      logout: (...args: unknown[]) => logoutMock(...args),
      me: (...args: unknown[]) => meMock(...args),
    },
  },
}));

vi.mock("@/services/demo/store", () => ({
  resetDemoState: () => resetDemoStateMock(),
}));

vi.mock("@/services/api/http", () => ({
  getAccessToken: () => getAccessTokenMock(),
  setTokens: (...args: unknown[]) => setTokensMock(...args),
}));

const { useAuthStore } = await import("../auth");

const demoStudent = {
  id: 1,
  username: "aluno.demo",
  email: "aluno.demo@x.com",
  first_name: "Ana",
  last_name: "Estudante",
  role: "aluno" as const,
};

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe("useAuthStore", () => {
  it("login define o usuário autenticado", async () => {
    loginMock.mockResolvedValue({ access: "demo-token", user: demoStudent });
    const store = useAuthStore();

    await store.login("aluno.demo", "");

    expect(store.isAuthenticated).toBe(true);
    expect(store.isStudent).toBe(true);
    expect(store.user?.username).toBe("aluno.demo");
  });

  it("logout limpa o usuário e reseta o estado demo", async () => {
    loginMock.mockResolvedValue({ access: "demo-token", user: demoStudent });
    const store = useAuthStore();
    await store.login("aluno.demo", "");

    await store.logout();

    expect(store.isAuthenticated).toBe(false);
    expect(store.user).toBeNull();
    expect(logoutMock).toHaveBeenCalled();
    expect(resetDemoStateMock).toHaveBeenCalled();
  });
});
