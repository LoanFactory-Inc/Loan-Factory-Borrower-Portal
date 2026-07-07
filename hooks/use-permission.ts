"use client";

import { useAppSelector } from "@/store/hooks";
import { enableBit } from "@/lib/helpers";
import type { FunctionPermissionKey } from "@/lib/constants";

export function useHasFunctionPermission(permissionKey: FunctionPermissionKey) {
  const rolePermissionNumber = useAppSelector(
    (state) => state.auth.profile?.role_permission_number ?? 0,
  );
  const permission = useAppSelector(
    (state) => state.config.permissionValue[permissionKey]?.permission ?? 0,
  );
  return enableBit(rolePermissionNumber, permission);
}
