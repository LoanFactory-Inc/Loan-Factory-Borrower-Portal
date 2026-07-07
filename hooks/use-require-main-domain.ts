"use client";

import { notFound } from "next/navigation";

import { useAppSelector } from "@/store/hooks";

/**
 * Chặn các trang chỉ dành cho main domain.
 * Khi profile đã load và is_main_domain === false thì trả về not-found
 * (kể cả khi người dùng gõ URL trực tiếp).
 */
export function useRequireMainDomain() {
  const profile = useAppSelector((state) => state.auth.profile);
  if (profile && !profile.is_main_domain) {
    notFound();
  }
}
