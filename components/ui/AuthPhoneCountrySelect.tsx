"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ComponentType, FocusEvent } from "react";
import { getCountryCallingCode } from "react-phone-number-input";
import type { Country } from "react-phone-number-input";

type CountryOption = {
  divider?: boolean;
  label: string;
  value?: Country;
};

type CountryIconProps = {
  aspectRatio?: number;
  country?: string;
  label: string;
};

type AuthPhoneCountrySelectProps = {
  "aria-label"?: string;
  className?: string;
  disabled?: boolean;
  iconComponent?: ComponentType<CountryIconProps>;
  name?: string;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
  onChange: (value?: Country) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  options: CountryOption[];
  readOnly?: boolean;
  value?: Country;
};

function getOptionKey(option: CountryOption) {
  return option.divider ? `divider-${option.label}` : option.value ?? "ZZ";
}

export function AuthPhoneCountrySelect({
  "aria-label": ariaLabel,
  disabled = false,
  iconComponent: Icon,
  name,
  onBlur,
  onChange,
  onFocus,
  options,
  readOnly = false,
  value,
}: AuthPhoneCountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const selectableOptions = useMemo(
    () => options.filter((option) => !option.divider),
    [options],
  );

  const selectedOption =
    selectableOptions.find((option) => option.value === value) ??
    selectableOptions.find((option) => option.value == null) ??
    selectableOptions[0];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isDisabled = disabled || readOnly;
  const selectedLabel = selectedOption?.label ?? "Select country";

  return (
    <div className="auth-phone-country" ref={rootRef}>
      {name ? <input name={name} type="hidden" value={value ?? "ZZ"} /> : null}

      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel ?? "Select country"}
        className="auth-phone-country__trigger"
        disabled={isDisabled}
        onBlur={onBlur}
        onClick={() => {
          if (isDisabled) {
            return;
          }

          setIsOpen((current) => !current);
        }}
        onFocus={onFocus}
        onKeyDown={(event) => {
          if (isDisabled) {
            return;
          }

          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        ref={triggerRef}
        type="button"
      >
        <span className="auth-phone-country__flag" aria-hidden="true">
          {Icon ? (
            <Icon
              country={selectedOption?.value}
              label={selectedLabel}
            />
          ) : null}
        </span>

        <span className="auth-phone-country__arrow" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="auth-phone-country__menu" id={menuId} role="listbox">
          {options.map((option) =>
            option.divider ? (
              <div
                aria-hidden="true"
                className="auth-phone-country__divider"
                key={getOptionKey(option)}
              />
            ) : (
              <button
                aria-selected={option.value === value}
                className="auth-phone-country__option"
                key={getOptionKey(option)}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                role="option"
                type="button"
              >
                <span className="auth-phone-country__flag" aria-hidden="true">
                  {Icon ? (
                    <Icon
                      country={option.value}
                      label={option.label}
                    />
                  ) : null}
                </span>
                <span className="auth-phone-country__meta">
                  <span className="auth-phone-country__code">
                    {option.value ? `+${getCountryCallingCode(option.value)}` : "Intl"}
                  </span>
                  <span className="auth-phone-country__label">{option.label}</span>
                </span>
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
