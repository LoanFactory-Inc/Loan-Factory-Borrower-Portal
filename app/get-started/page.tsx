"use client";

import { AppFooterPortal } from "@/app/application/components/app-footer-portal";
import { ApplicationHeader } from "@/app/application/components/app-header";

import { GetStartedHero } from "./get-started-hero";

export default function GetStartedPage() {
  return (
    <div className="flex h-svh flex-col bg-page">
      <ApplicationHeader />

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-295 flex-1 px-4 sm:px-7 py-12">
          <div className="w-full">
            <GetStartedHero />
          </div>
        </div>

        <AppFooterPortal />
      </div>
    </div>
  );
}
