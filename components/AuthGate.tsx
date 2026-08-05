"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth, googleProvider } from "@/lib/firebaseAuth";

interface OwnerAuthContextValue {
  user: User;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  signOutOwner: () => Promise<void>;
}

const OwnerAuthContext = createContext<OwnerAuthContextValue | null>(null);

const configuredOwnerEmails = (
  process.env.NEXT_PUBLIC_OWNER_EMAILS || "fnaticdoc@gmail.com"
)
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const OWNER_EMAILS = new Set(configuredOwnerEmails);

function isApprovedOwner(user: User, claims: Record<string, unknown>) {
  if (claims.owner === true) return true;

  const email = user.email?.trim().toLowerCase();
  return Boolean(email && user.emailVerified && OWNER_EMAILS.has(email));
}

function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return "Google 로그인 중 알 수 없는 오류가 발생했습니다. 다시 시도해 주세요.";
  }

  switch (error.code) {
    case "auth/unauthorized-domain":
      return "현재 도메인이 Firebase 승인 도메인에 등록되지 않았습니다. 관리자 설정이 필요합니다. (auth/unauthorized-domain)";
    case "auth/operation-not-allowed":
      return "Firebase에서 Google 로그인 제공자가 활성화되지 않았습니다. (auth/operation-not-allowed)";
    case "auth/network-request-failed":
      return "Google 또는 Firebase에 연결하지 못했습니다. 네트워크와 광고 차단 확장 프로그램을 확인해 주세요. (auth/network-request-failed)";
    case "auth/popup-closed-by-user":
      return "Google 로그인 창이 닫혔습니다. 다시 로그인해 주세요.";
    case "auth/cancelled-popup-request":
      return "이미 다른 로그인 요청이 진행 중입니다. 잠시 후 다시 시도해 주세요.";
    default:
      return `Google 로그인에 실패했습니다. (${error.code})`;
  }
}

export function useOwnerAuth() {
  const value = useContext(OwnerAuthContext);
  if (!value) {
    throw new Error("useOwnerAuth must be used inside AuthGate");
  }
  return value;
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        // 새 custom claim이 설정된 경우 즉시 반영되도록 강제로 토큰을 갱신한다.
        const tokenResult = await currentUser.getIdTokenResult(true);

        if (!isApprovedOwner(currentUser, tokenResult.claims)) {
          setUnauthorized(true);
          setUser(null);
          await signOut(auth);
          return;
        }

        setUnauthorized(false);
        setUser(currentUser);
      } catch (error) {
        console.error("[AuthGate] owner verification failed", error);
        setUser(null);
        setErrorMessage(
          "계정 권한을 확인하지 못했습니다. 로그아웃 후 다시 로그인해 주세요."
        );
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const signIn = useCallback(async () => {
    setLoading(true);
    setUnauthorized(false);
    setErrorMessage("");

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      if (error instanceof FirebaseError && error.code === "auth/popup-blocked") {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          console.error("[AuthGate] redirect sign-in failed", redirectError);
          setErrorMessage(getAuthErrorMessage(redirectError));
        }
      } else {
        console.error("[AuthGate] popup sign-in failed", error);
        setErrorMessage(getAuthErrorMessage(error));
      }
      setLoading(false);
    }
  }, []);

  const contextValue = useMemo<OwnerAuthContextValue | null>(() => {
    if (!user) return null;

    return {
      user,
      getIdToken: (forceRefresh = false) => user.getIdToken(forceRefresh),
      signOutOwner: () => signOut(auth),
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-sm text-[color:var(--muted)]">계정 권한을 확인하는 중...</p>
      </div>
    );
  }

  if (contextValue) {
    return (
      <OwnerAuthContext.Provider value={contextValue}>
        {children}
      </OwnerAuthContext.Provider>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-black/8 bg-white p-6 text-center dark:border-white/10 dark:bg-[var(--color-ink-900)]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-ink-900)] text-xl font-semibold text-white dark:bg-white/10">
          V
        </div>
        <h1 className="text-xl font-semibold">VitalSync 개인 계정</h1>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
          건강 기록과 식사 사진은 등록된 소유자 계정에서만 볼 수 있습니다.
        </p>

        {(unauthorized || errorMessage) && (
          <p className="mt-3 rounded-xl bg-[var(--color-wine-500)]/10 px-3 py-2 text-xs leading-5 text-[var(--color-wine-600)] dark:text-[var(--color-wine-400)]">
            {errorMessage || "이 Google 계정에는 접근 권한이 없습니다."}
          </p>
        )}

        <button
          type="button"
          onClick={signIn}
          className="mt-5 w-full rounded-xl bg-[var(--color-ink-900)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 dark:bg-white/10"
        >
          Google로 로그인
        </button>
      </div>
    </main>
  );
}
