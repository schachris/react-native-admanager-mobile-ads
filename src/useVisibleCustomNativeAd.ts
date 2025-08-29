import { useEffect } from "react";

import type { AdQueueLoader } from "./AdQueueLoader";
import { logInfo } from "./log";
import { AdAssets } from "./spec/NativeAdManagerMobileAds";
import { AdState } from "./types";
import {
  CustomNativeAdHookReturnType,
  useCustomNativeAd
} from "./useCustomNativeAd";
import { useFireAfterVisibilityDuration } from "./useFireAfterVisibilityDuration";
import { adStateToString } from "./utils";

export function useVisibleCustomNativeAd<
  AdFormatType extends AdAssets,
  Targeting
>({
  visible,
  adLoader,
  msToDisplayTillImpressionRecording = 2000,
  msToDisplayTillRenew = 30 * 1000,
  renew_attempts,
  log = false,
  identifier
}: {
  visible: boolean;
  adLoader: AdQueueLoader<AdFormatType, Targeting>;
  msToDisplayTillImpressionRecording?: number;
  msToDisplayTillRenew?: number;
  renew_attempts?: number;
  log?: boolean;
  identifier?: string;
}): CustomNativeAdHookReturnType<AdFormatType, Targeting> {
  const {
    id,
    ad,
    state: adState,
    display,
    renew,
    impression,
    click,
    outdated,
    targeting,
    tracker,
    error
  } = useCustomNativeAd(adLoader!, {
    renew_attempts,
    log,
    identifier
  });

  useEffect(() => {
    logInfo(
      log,
      { ...adLoader.getSpecification(), identifier },
      "updateEffect",
      adStateToString(adState),
      "visible:",
      visible
    );
    if (adState === AdState.Received && visible) {
      display();
    } else if (adState === AdState.Error) {
      logInfo(
        log,
        { ...adLoader.getSpecification(), identifier },
        "error -> renew"
      );
      renew();
    } else if (visible && adState === AdState.Outdated) {
      logInfo(
        log,
        { ...adLoader.getSpecification(), identifier },
        "outdated -> renew"
      );
      renew();
    }
  }, [adState, visible, renew, display, log, adLoader, identifier]);

  const isMinDisplaying = adState >= AdState.Displaying;
  const isMinImpression = adState >= AdState.Impression;
  useFireAfterVisibilityDuration(
    visible,
    impression,
    msToDisplayTillImpressionRecording,
    isMinDisplaying
  );
  useFireAfterVisibilityDuration(
    visible,
    outdated,
    msToDisplayTillRenew - msToDisplayTillImpressionRecording,
    isMinImpression
  );

  return {
    id,
    ad,
    state: adState,
    display,
    renew,
    impression,
    click,
    outdated,
    targeting,
    tracker,
    error
  };
}
