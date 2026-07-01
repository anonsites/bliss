"use client";

import React from "react";
import uiStyles from "@/components/ui/ui.module.css";
import styles from "./profile.module.css";

interface LogOutModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function LogOutModal({ onClose, onConfirm }: LogOutModalProps) {
  return (
    <div className={uiStyles["modal-overlay"]} onClick={onClose}>
      <div className={`${uiStyles["modal-content"]} ${styles.profileConfirmModal}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.profileConfirmModalHeader}>
          <h2>Log out?</h2>
          <p>Are you sure you want to log out of your account?</p>
        </div>
        <div className={styles.profileConfirmModalActions}>
          <button 
            onClick={onConfirm}
            className={styles.profileConfirmPrimaryBtn}
            type="button"
          >
            Log out
          </button>
          <button 
            onClick={onClose}
            className={styles.profileConfirmCancelBtn}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
