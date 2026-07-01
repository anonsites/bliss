"use client";

import React, { useState } from "react";
import uiStyles from "@/components/ui/ui.module.css";
import styles from "./profile.module.css";
import { HideUsersIcon } from "./ProfileNavIcons";

interface HiddenContactsModalProps {
  onClose: () => void;
  hiddenContacts: string[];
  onHidePhone: (phone: string) => Promise<void>;
  onRemoveHiddenPhone: (phone: string) => Promise<void>;
  isHiding: boolean;
}

export function HiddenContactsModal({ onClose, hiddenContacts, onHidePhone, onRemoveHiddenPhone, isHiding }: HiddenContactsModalProps) {
  const [phoneToHide, setPhoneToHide] = useState("");

  const handleSubmit = async () => {
    const phone = phoneToHide.trim();
    if (!phone) return;
    await onHidePhone(phone);
    setPhoneToHide("");
  };

  return (
    <div className={uiStyles["modal-overlay"]} onClick={onClose}>
      <div className={`${uiStyles["modal-content"]} w-full max-w-lg`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className={styles.iconShell}>
              <HideUsersIcon className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Hidden Contacts</h2>
          </div>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-white transition-colors">&times;</button>
        </div>

        <div className="mb-10">
          <p className="text-sm text-gray-400 mb-4">Enter a number to hide your profile from them.</p>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <input 
                type="tel"
                value={phoneToHide}
                onChange={(e) => setPhoneToHide(e.target.value)}
                placeholder="+1234567890"
                className={styles.underlinedInput}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={isHiding || !phoneToHide.trim()}
              className={styles.actionBtnSmall}
            >
              {isHiding ? "..." : "Hide"}
            </button>
          </div>
        </div>

        <div className="max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          {hiddenContacts.length === 0 ? (
            <div className={styles.emptyState}>
              <p className="opacity-60 italic">No numbers hidden yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hiddenContacts.map((phone) => (
                <div key={phone} className={styles.privacyListItem}>
                  <span className="text-sm text-white font-medium">{phone}</span>
                  <button 
                    onClick={() => void onRemoveHiddenPhone(phone)}
                    className={styles.secondaryBtnSmall}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
          <button onClick={onClose} className={styles.saveChangesBtn}>Done</button>
        </div>
      </div>
    </div>
  );
}