"use client";

import { useState } from "react";

interface ContactFormProps {
  source?: string;
}

export function ContactForm({ source = "contacto" }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          source,
          plan_interest: message || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "No pudimos enviar tu mensaje.",
        );
      }

      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Error al enviar el formulario.",
      );
    }
  }

  if (status === "success") {
    return (
      <div
        className="rounded-xl border border-green-200 bg-green-50 p-6 text-sm text-green-800"
        role="status"
      >
        ¡Gracias! Recibimos tu mensaje y te contactaremos pronto.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Nombre</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-1 focus:ring-coveru-red"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-1 focus:ring-coveru-red"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Teléfono (opcional)</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-1 focus:ring-coveru-red"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Mensaje</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-1 focus:ring-coveru-red"
        />
      </label>

      {status === "error" && errorMessage && (
        <p className="text-sm text-coveru-red" role="alert">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-full bg-coveru-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-coveru-red-dark disabled:opacity-60"
      >
        {status === "loading" ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
