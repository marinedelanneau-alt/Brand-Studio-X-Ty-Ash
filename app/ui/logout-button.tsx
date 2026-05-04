"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { logout } from "../logout";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(() => {
          void logout().then(() => {
            router.push("/");
            router.refresh();
          });
        });
      }}
      className={
        className ??
        "flex h-14 items-center justify-center rounded-[1.15rem] bg-[linear-gradient(135deg,#e19b34,#f2cf58)] px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_18px_30px_rgba(227,175,64,0.24)] transition duration-200 hover:-translate-y-0.5"
      }
    >
      Se deconnecter
    </button>
  );
}
