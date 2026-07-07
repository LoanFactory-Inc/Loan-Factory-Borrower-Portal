"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { login } from "../services";
import { useAppDispatch } from "@/store/hooks";
import { setApiToken } from "@/store/slices/auth-slice";
import { setAuthCookie } from "@/store/auth-token";

import { makeLoginSchema, type LoginInput } from "./auth-schema";

const inputClass =
  "h-13.5 rounded-xl bg-card px-4 text-[15px] shadow-none focus-visible:ring-0 focus-visible:border-primary";

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["auth", "common"]);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loginError, setLoginError] = React.useState(false);

  const schema = React.useMemo(
    () => makeLoginSchema((key: string) => t(key, { ns: "common" })),
    [t],
  );

  const form = useForm<LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  const onSubmit = async (values: LoginInput) => {
    setLoginError(false);
    try {
      const response = await login({
        username: values.email,
        password: values.password,
      });

      // tera-be trả HTTP 401 khi sai credential (đã throw ở interceptor);
      // thành công thì access_token nằm trong response.payload.
      const token = response.payload?.access_token;
      if (!token) {
        setLoginError(true);
        return;
      }

      dispatch(setApiToken(token));
      setAuthCookie(token);

      router.replace("/");
    } catch {
      // lỗi đã được toast tập trung ở axios interceptor
      setLoginError(true);
    }
  };

  const submitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 flex flex-col">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="gap-2">
              <FormLabel className="text-[13px] text-foreground">
                {t("loginForm.emailLabel")} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("loginForm.emailPlaceholder")}
                  autoComplete="email"
                  className={inputClass}
                  onChangeCapture={() => setLoginError(false)}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="mt-5 gap-2">
              <FormLabel className="text-[13px] text-foreground">
                {t("loginForm.passwordLabel")} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("loginForm.passwordPlaceholder")}
                    autoComplete="current-password"
                    className={cn(inputClass, "pr-12")}
                    onChangeCapture={() => setLoginError(false)}
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? t("loginForm.hidePassword") : t("loginForm.showPassword")
                    }
                    className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="size-4.75" />
                    ) : (
                      <EyeIcon className="size-4.75" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {loginError && (
          <p className="mt-4 text-[13px] font-medium text-destructive" role="alert">
            {t("loginForm.invalidCredentials")}
          </p>
        )}

        <div className="mt-3 flex justify-end">
          <a
            href="#"
            className="text-[13.5px] font-medium text-muted-foreground hover:text-accent-foreground"
          >
            {t("loginForm.forgotPassword")}
          </a>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="mt-6 w-full rounded-md text-[15px] shadow-[0_12px_26px_-8px_rgba(243,111,32,0.65)]"
        >
          {submitting ? t("loginForm.signingIn") : t("loginForm.signIn")}
        </Button>

        <p className="mt-6 text-center text-[13px] text-muted-foreground">
          {t("loginForm.troublePrefix")}{" "}
          <a href="#" className="font-semibold text-foreground hover:text-accent-foreground">
            {t("loginForm.contactOfficer")}
          </a>
        </p>
      </form>
    </Form>
  );
}
