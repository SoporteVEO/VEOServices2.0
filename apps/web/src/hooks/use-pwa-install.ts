"use client";

import { useSyncExternalStore } from "react";
import {
  isIosDevice,
  isMobileDevice,
  isStandalone,
  subscribeToDisplayMode,
} from "@/lib/pwa/browser";
import {
  getInstallPrompt,
  promptInstall,
  subscribeToInstallPrompt,
} from "@/lib/pwa/install-prompt";

const noopSubscribe = () => () => {};

export function usePwaInstall() {
  const standalone = useSyncExternalStore(
    subscribeToDisplayMode,
    isStandalone,
    () => false,
  );
  const installPrompt = useSyncExternalStore(
    subscribeToInstallPrompt,
    getInstallPrompt,
    () => null,
  );
  const ios = useSyncExternalStore(noopSubscribe, isIosDevice, () => false);
  const mobile = useSyncExternalStore(noopSubscribe, isMobileDevice, () => false);

  return {
    isStandalone: standalone,
    isIos: ios,
    isMobile: mobile,
    canPromptInstall: installPrompt !== null,
    promptInstall,
  };
}
