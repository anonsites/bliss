"use client";

import React from "react";
import Image from "next/image";
import uiStyles from "@/components/ui/ui.module.css";
import styles from "./profile.module.css";
import { BlockedUsersIcon } from "./ProfileNavIcons";
import type { BlockedUser } from "./Privacy";

interface BlockedUsersModalProps {
  onClose: () => void;
  blockedUsers: BlockedUser[];
  onUnblock: (userId: string) => Promise<void>;
  isUnblocking: string | null;
}

export function BlockedUsersModal({ onClose, blockedUsers, onUnblock, isUnblocking }: BlockedUsersModalProps) {
  return (
    <div className={uiStyles["modal-overlay"]} onClick={onClose}>
      <div className={`${uiStyles["modal-content"]} w-full max-w-lg`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className={styles.iconShell}>
              <BlockedUsersIcon className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Black List</h2>
          </div>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-white transition-colors">&times;</button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {blockedUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <BlockedUsersIcon className="h-10 w-10 opacity-20 mb-2" />
              <p>Your black list is empty.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((user) => (
                <div key={user.id} className={styles.privacyListItem}>
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/10">
                      <Image src={user.avatar_url} alt={user.username} fill className="object-cover" />
                    </div>
                    <span className="font-semibold text-white">{user.username}</span>
                  </div>
                  <button
                    onClick={() => void onUnblock(user.id)}
                    disabled={isUnblocking === user.id}
                    className={styles.secondaryBtnSmall}
                  >
                    {isUnblocking === user.id ? "..." : "Unblock"}
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