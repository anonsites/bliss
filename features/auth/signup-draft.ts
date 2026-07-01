export interface PendingSignupDraft {
  password: string;
  phoneNumber: string;
}

const SIGNUP_DRAFT_STORAGE_KEY = "bliss_pending_signup";
const signupDraftListeners = new Set<() => void>();

let cachedRawSignupDraft: string | null | undefined;
let cachedSignupDraftSnapshot: PendingSignupDraft | null = null;

function getSessionStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

function notifySignupDraftListeners() {
  signupDraftListeners.forEach((listener) => listener());
}

function parsePendingSignupDraft(
  rawValue: string | null,
): PendingSignupDraft | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<PendingSignupDraft>;

    if (
      typeof parsedValue.phoneNumber !== "string" ||
      !parsedValue.phoneNumber.trim() ||
      typeof parsedValue.password !== "string" ||
      !parsedValue.password
    ) {
      return null;
    }

    return {
      password: parsedValue.password,
      phoneNumber: parsedValue.phoneNumber,
    };
  } catch {
    return null;
  }
}

export function readPendingSignupDraft(): PendingSignupDraft | null {
  const storage = getSessionStorage();

  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(SIGNUP_DRAFT_STORAGE_KEY);

  if (rawValue === cachedRawSignupDraft) {
    return cachedSignupDraftSnapshot;
  }

  const nextSnapshot = parsePendingSignupDraft(rawValue);
  cachedRawSignupDraft = rawValue;
  cachedSignupDraftSnapshot = nextSnapshot;

  return cachedSignupDraftSnapshot;
}

export function subscribePendingSignupDraft(listener: () => void) {
  signupDraftListeners.add(listener);

  if (typeof window === "undefined") {
    return () => {
      signupDraftListeners.delete(listener);
    };
  }

  const handleStorage = (event: StorageEvent) => {
    if (
      event.storageArea === window.sessionStorage &&
      event.key === SIGNUP_DRAFT_STORAGE_KEY
    ) {
      cachedRawSignupDraft = undefined;
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    signupDraftListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function writePendingSignupDraft(draft: PendingSignupDraft) {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  const rawValue = JSON.stringify(draft);

  storage.setItem(SIGNUP_DRAFT_STORAGE_KEY, rawValue);
  cachedRawSignupDraft = rawValue;
  cachedSignupDraftSnapshot = {
    password: draft.password,
    phoneNumber: draft.phoneNumber,
  };
  notifySignupDraftListeners();
}

export function clearPendingSignupDraft() {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(SIGNUP_DRAFT_STORAGE_KEY);
  cachedRawSignupDraft = null;
  cachedSignupDraftSnapshot = null;
  notifySignupDraftListeners();
}
