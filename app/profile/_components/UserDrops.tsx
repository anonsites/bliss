"use client";

import Image from "next/image";
import styles from "./profile.module.css";

interface UserDropsProps {
  username: string;
  drops: Array<{ id: string; media_url: string }>;
}

export function UserDrops({ username, drops }: UserDropsProps) {
  return (
    <section className="h-full flex flex-col">
      <div className={styles.sectionHeading}>
        <h2 className="text-2xl font-bold text-white">My Drops</h2>
      </div>

      {drops.length > 0 ? (
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {drops.map((drop) => (
            <div
              className="relative aspect-[9/16] w-32 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40 hover:border-[#27d6c5] transition-colors"
              key={drop.id}
            >
              <Image
                alt={`${username} drop`}
                className="object-cover"
                fill
                sizes="112px"
                src={drop.media_url}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>You have no drops yet. Drop something...</p>
        </div>
      )}
    </section>
  );
}