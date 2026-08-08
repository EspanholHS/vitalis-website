"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null; success: string | null };

function safeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/hub";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/hub";
}

export async function signInAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Informe seu e-mail e sua senha.", success: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error: "Não foi possível entrar. Confira os dados e tente novamente.",
      success: null,
    };
  }

  redirect(safeNextPath(formData.get("next")));
}

export async function signUpAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("passwordConfirmation") ?? "");

  if (!email || !password || !confirmation) {
    return {
      error: "Preencha seu e-mail e crie uma senha para continuar.",
      success: null,
    };
  }

  if (password.length < 6) {
    return { error: "Sua senha precisa ter pelo menos 6 caracteres.", success: null };
  }

  if (password !== confirmation) {
    return { error: "As senhas ainda não coincidem.", success: null };
  }

  const supabase = await createClient();
  const nextPath = safeNextPath(formData.get("next"));
  const requestHeaders = await headers();
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const origin = requestHeaders.get("origin") ?? configuredOrigin;
  const emailRedirectTo = origin
    ? `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
    : undefined;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  });

  if (error) {
    return {
      error: "Não foi possível criar a conta. Confira os dados e tente novamente.",
      success: null,
    };
  }

  if (data.session) {
    redirect(nextPath);
  }

  return {
    error: null,
    success: "Conta criada. Confira seu e-mail para confirmar o acesso ao HUB.",
  };
}
