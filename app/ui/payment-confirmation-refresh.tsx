"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentConfirmationRefresh() {
  const router = useRouter();
  const [stopped, setStopped] = useState(false);
  useEffect(() => {
    let attempts = 0;
    const timer = window.setInterval(() => {
      if (++attempts >= 20) { window.clearInterval(timer); setStopped(true); }
      router.refresh();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [router]);
  return <div className="mt-6 text-sm" role="status">{stopped ? "La confirmation prend plus de temps que prévu. Ne repassez pas commande. Vous pouvez vérifier à nouveau ou contacter le support." : "Vérification automatique de votre accès en cours…"}<button onClick={() => router.refresh()} className="mt-3 block font-semibold underline">Vérifier à nouveau</button></div>;
}
