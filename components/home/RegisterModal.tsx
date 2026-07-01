"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import type { AuthActionResponse } from "@/features/auth";
import {
  clearPendingSignupDraft,
  readPendingSignupDraft,
  writePendingSignupDraft,
} from "@/features/auth/signup-draft";
import { useToast } from "@/lib/toast-context";
import { AuthModalBrand } from "../ui/AuthModalBrand";
import { AuthPhoneCountrySelect } from "../ui/AuthPhoneCountrySelect";
import uiStyles from "../ui/ui.module.css";
 /* FUTURE: import { GoogleSignInButton } from "../ui/GoogleSignInButton"; */

type RegisterModalProps = {
  onClose: () => void;
  onSwitchToLogin: () => void;
};

export function RegisterModal({ onClose, onSwitchToLogin }: RegisterModalProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [value, setValue] = useState<string | undefined>(() => readPendingSignupDraft()?.phoneNumber);
  const [password, setPassword] = useState(() => readPendingSignupDraft()?.password ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!value || !isValidPhoneNumber(value)) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (password.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setError(null);
      setIsCheckingAvailability(true);

      const response = await fetch("/api/auth/register/check", {
        body: JSON.stringify({ phoneNumber: value }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as AuthActionResponse;

      if (!response.ok) {
        setError(payload.error ?? "Unable to continue with sign up.");
        addToast({
          type: "error",
          title: "Registration Check Failed",
          message: payload.error ?? "Unable to continue with sign up.",
          duration: 5000,
        });
        return;
      }

      addToast({
        type: "success",
        message: "Let's complete your profile.",
        duration: 3000,
      });
      writePendingSignupDraft({
        password,
        phoneNumber: value,
      });
      router.push("/checkpoint");
    } catch {
      setError("Unable to continue with sign up right now.");
      addToast({
        type: "error",
        title: "Connection Error",
        message: "Unable to continue with sign up right now.",
        duration: 5000,
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  return (
    <div
      className={uiStyles['modal-overlay']}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className={`${uiStyles['modal-content']} ${uiStyles['modal-content--auth']}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header modal-header--auth">
          <AuthModalBrand />
          <h2>Create account</h2>
        </div>

        <form className="modal-form modal-form--auth" onSubmit={handleSubmit}>
          <div className="input-group">
            <PhoneInput
              international
              countrySelectComponent={AuthPhoneCountrySelect}
              defaultCountry="RW"
              value={value}
              onChange={(nextValue) => {
                setValue(nextValue);
                setError(null);
              }}
              placeholder="Phone number"
              autoFocus
              className="modal-input"
            />
          </div>

          <div className="input-group">
            <div className="relative">
              <input
                aria-label="Password"
                autoComplete="new-password"
                className="modal-text-input pr-12"
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
                placeholder="Insert a password"
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error ? <p className="modal-error">{error}</p> : null}

          <button className={`${uiStyles['home-button']} ${uiStyles['home-button--primary']}`} disabled={isCheckingAvailability} type="submit">
            {isCheckingAvailability ? "Checking..." : "Continue"}
          </button>
        </form>

        <div className={`${uiStyles['modal-footer']} ${uiStyles['modal-footer--auth']}`}>
          <div className="modal-switch">
            <span>Already have an account?</span>
            <button
              className="btn-link btn-link--inline"
              onClick={() => {
                clearPendingSignupDraft();
                onSwitchToLogin();
              }}
              type="button"
            >
              Sign in
            </button>
          </div>

          <button
            aria-label="Close sign up dialog"
            className="btn-link btn-link--icon"
            onClick={() => {
              clearPendingSignupDraft();
              onClose();
            }}
            type="button"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
