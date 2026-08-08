"use client";

import { useActionState } from "react";
import { submitContactForm, type ContactFormState } from "@/app/contato/actions";

const initialState: ContactFormState = {
  status: "idle",
  message: "",
};

const labelClass =
  "text-sm font-semibold uppercase text-[var(--muted)]";
const fieldClass =
  "w-full rounded-[8px] border border-[var(--line)] bg-[rgba(255,253,248,0.72)] px-4 py-3 text-base text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:bg-white";

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContactForm, initialState);

  return (
    <form action={action} className="premium-card space-y-4 p-6 md:p-7">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className={labelClass}>Nome</span>
          <input
            type="text"
            name="name"
            required
            className={fieldClass}
          />
        </label>
        <label className="space-y-2">
          <span className={labelClass}>E-mail</span>
          <input
            type="email"
            name="email"
            required
            className={fieldClass}
          />
        </label>
      </div>

      <label className="space-y-2">
        <span className={labelClass}>Assunto</span>
        <input
          type="text"
          name="subject"
          required
          className={fieldClass}
        />
      </label>

      <label className="space-y-2">
        <span className={labelClass}>Mensagem</span>
        <textarea
          name="message"
          required
          rows={6}
          className={`${fieldClass} resize-none`}
        />
      </label>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={pending}
          className="vitalis-button-primary inline-flex items-center justify-center px-6 py-4 text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Enviando..." : "Enviar mensagem"}
        </button>
        <p
          aria-live="polite"
          className={`text-sm ${
            state.status === "error" ? "text-[#b42318]" : "text-[var(--muted)]"
          }`}
        >
          {state.message}
        </p>
      </div>
    </form>
  );
}
