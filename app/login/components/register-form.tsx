"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import logo from "@/public/logo.png";

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
import { register as registerApi } from "../services";

import { makeRegisterSchema, type RegisterInput } from "./auth-schema";

export function RegisterForm() {
  const router = useRouter();
  const { t } = useTranslation(["auth", "common"]);
  const [success, setSuccess] = useState(false);

  const schema = useMemo(
    () => makeRegisterSchema((key: string) => t(key, { ns: "common" })),
    [t],
  );

  const form = useForm<RegisterInput>({
    resolver: zodResolver(schema),
    defaultValues: { userName: "", email: "", password: "", confirmPassword: "" },
    mode: "onChange",
  });

  const onSubmit = async (values: RegisterInput) => {
    try {
      const response = await registerApi({
        email_id: values.email,
        password: values.password,
        user_name: values.userName,
      });
      if (response.status !== 0) return;
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      // lỗi đã được toast tập trung ở axios interceptor
    }
  };

  const submitting = form.formState.isSubmitting;

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircleIcon size={48} weight="fill" className="text-green-600" />
          <h1 className="text-2xl font-semibold tracking-tight">{t("register.successTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("register.successDescription")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image
          src={logo}
          alt={t("register.logoAlt")}
          width={56}
          height={56}
          priority
          className="mb-3"
        />
        <h1 className="text-2xl font-semibold tracking-tight">{t("register.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("register.subtitle")}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("register.userNameLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder={t("register.userNamePlaceholder")}
                    autoComplete="username"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("register.emailLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("register.emailPlaceholder")}
                    autoComplete="email"
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
              <FormItem>
                <FormLabel>{t("register.passwordLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("register.passwordPlaceholder")}
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("register.confirmPasswordLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("register.confirmPasswordPlaceholder")}
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? t("register.submitting") : t("register.submit")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
