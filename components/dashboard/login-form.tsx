"use client";

import { useActionState, useState } from "react";

import {
  signInAction,
  signUpAction,
  type LoginState,
} from "@/app/entrar/actions";
import styles from "@/components/dashboard/dashboard.module.css";

type AuthMode = "signin" | "signup";

const initialState: LoginState = { error: null, success: null };

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [signInState, signInFormAction, signInPending] = useActionState(
    signInAction,
    initialState,
  );
  const [signUpState, signUpFormAction, signUpPending] = useActionState(
    signUpAction,
    initialState,
  );

  const isSignup = mode === "signup";
  const state = isSignup ? signUpState : signInState;
  const pending = isSignup ? signUpPending : signInPending;
  const action = isSignup ? signUpFormAction : signInFormAction;

  return (
    <div className={styles.authShell}>
      <div className={styles.authModeSwitch} role="tablist" aria-label="Acesso Vitalis">
        <button
          aria-selected={!isSignup}
          className={!isSignup ? styles.authModeActive : ""}
          onClick={() => {
            setMode("signin");
            setShowPassword(false);
          }}
          role="tab"
          type="button"
        >
          Entrar
        </button>
        <button
          aria-selected={isSignup}
          className={isSignup ? styles.authModeActive : ""}
          onClick={() => {
            setMode("signup");
            setShowPassword(false);
          }}
          role="tab"
          type="button"
        >
          Criar conta
        </button>
      </div>

      <form action={action} className={styles.loginForm}>
        <input name="next" type="hidden" value={nextPath} />
        <label className={styles.field}>
          <span>E-mail</span>
          <input
            autoComplete="email"
            autoFocus
            inputMode="email"
            name="email"
            placeholder="voce@exemplo.com"
            required
            type="email"
          />
        </label>
        <label className={`${styles.field} ${styles.passwordField}`}>
          <span>{isSignup ? "Crie uma senha" : "Senha"}</span>
          <span className={styles.passwordInputWrap}>
            <input
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={6}
              name="password"
              placeholder="Mínimo de 6 caracteres"
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className={styles.passwordToggle}
              onClick={() => setShowPassword((value) => !value)}
              type="button"
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </span>
        </label>
        {isSignup ? (
          <label className={styles.field}>
            <span>Confirme sua senha</span>
            <input
              autoComplete="new-password"
              minLength={6}
              name="passwordConfirmation"
              placeholder="Repita sua senha"
              required
              type={showPassword ? "text" : "password"}
            />
          </label>
        ) : null}
        {state.error ? (
          <p aria-live="polite" className={styles.formError} role="alert">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p aria-live="polite" className={styles.formSuccess} role="status">
            {state.success}
          </p>
        ) : null}
        <button className={styles.loginButton} disabled={pending} type="submit">
          <span>
            {pending
              ? isSignup
                ? "Criando sua conta…"
                : "Entrando…"
              : isSignup
                ? "Criar minha conta"
                : "Entrar no HUB"}
          </span>
          <span aria-hidden="true">→</span>
        </button>
      </form>
    </div>
  );
}
