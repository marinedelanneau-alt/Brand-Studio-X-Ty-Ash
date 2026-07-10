"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { PowerIcon } from "@heroicons/react/24/outline";
import { logout } from "../logout";

export default function LogoutButton({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={iconOnly ? "Se déconnecter" : undefined}
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
      {iconOnly ? (
        <>
          <PowerIcon className="h-5 w-5" aria-hidden="true" />
          <span className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-[#eadfca] bg-white px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#6b625a] opacity-0 shadow-[0_8px_20px_rgba(92,78,63,0.12)] transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            Se déconnecter
          </span>
        </>
      ) : (
        "Se deconnecter"
      )}
    </button>
  );
}
