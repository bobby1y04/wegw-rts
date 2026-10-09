"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function DeleteDataButton() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deleteData() {
    if (
      !window.confirm(
        "Alle Profil-, Fahrplan- und Chatdaten dieser Demo-Sitzung endgültig löschen?",
      )
    ) {
      return;
    }
    setDeleting(true);
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      if (!response.ok) throw new Error();
      window.location.assign(new URL("/", window.location.href));
    } catch {
      setError("Die Daten konnten gerade nicht gelöscht werden.");
      setDeleting(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
      <h2 className="font-semibold text-red-950">Demo-Daten löschen</h2>
      <p className="mt-1 text-sm leading-6 text-red-900/80">
        Löscht Profil, Fahrplan und Chats dieser anonymen Sitzung endgültig.
      </p>
      {error && (
        <p className="mt-3 text-sm font-medium text-red-800" role="alert">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="danger"
        className="mt-4"
        disabled={deleting}
        onClick={deleteData}
      >
        <Trash2 className="size-4" aria-hidden />
        {deleting ? "Wird gelöscht …" : "Alle Demo-Daten löschen"}
      </Button>
    </div>
  );
}
