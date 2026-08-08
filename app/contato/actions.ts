"use server";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

const DEFAULT_RESEND_FROM = "Vitalis <onboarding@resend.dev>";

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function resolveSenderEmail() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.RESEND_FROM ||
    process.env.FROM_EMAIL ||
    DEFAULT_RESEND_FROM
  );
}

export async function submitContactForm(
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const name = asString(formData.get("name"));
  const email = asString(formData.get("email"));
  const subject = asString(formData.get("subject"));
  const message = asString(formData.get("message"));

  if (!name || !email || !subject || !message) {
    return {
      status: "error",
      message: "Preencha todos os campos antes de enviar.",
    };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const senderEmail = resolveSenderEmail();
  const to = process.env.CONTACT_TO_EMAIL;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

  if (!resendApiKey || !to) {
    return {
      status: "error",
      message: "O formulário está temporariamente indisponível.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: senderEmail,
      to,
      subject: `[Vitalis] ${subject}`,
      reply_to: email,
      html: `
        <div style="font-family: Arial, sans-serif; color: #10324c;">
          <h2>Novo contato pelo site da Vitalis</h2>
          <p><strong>Nome:</strong> ${safeName}</p>
          <p><strong>E-mail:</strong> ${safeEmail}</p>
          <p><strong>Assunto:</strong> ${safeSubject}</p>
          <p><strong>Mensagem:</strong></p>
          <p>${safeMessage}</p>
        </div>
      `,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Resend send failed", response.status, errorBody);

    return {
      status: "error",
      message: "Não foi possível enviar agora. Tente novamente em instantes.",
    };
  }

  return {
    status: "success",
    message: "Mensagem enviada com sucesso. Retornaremos em breve.",
  };
}
