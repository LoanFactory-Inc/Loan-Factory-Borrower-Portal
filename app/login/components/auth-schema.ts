import { z } from "zod";

/** Translate function scoped to the "common" namespace. */
type TranslateFn = (key: string) => string;

export const makeLoginSchema = (t: TranslateFn) =>
  z.object({
    email: z.string().min(1, t("validation.usernameRequired")),
    password: z.string().min(1, t("validation.passwordRequired")),
  });

export const makeRegisterSchema = (t: TranslateFn) =>
  z
    .object({
      userName: z
        .string()
        .min(1, t("validation.userNameRequired"))
        .max(50, t("validation.userNameMax")),
      email: z.string().min(1, t("validation.emailRequired")).email(t("validation.emailInvalid")),
      password: z
        .string()
        .min(8, t("validation.passwordMin"))
        .max(72, t("validation.passwordMax")),
      confirmPassword: z.string().min(1, t("validation.confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: t("validation.passwordsNoMatch"),
    });

// Kiểu dữ liệu độc lập với ngôn ngữ — dùng một schema mẫu để suy ra type.
export type LoginInput = z.input<ReturnType<typeof makeLoginSchema>>;
export type RegisterInput = z.input<ReturnType<typeof makeRegisterSchema>>;
