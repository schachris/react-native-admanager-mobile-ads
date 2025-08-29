import { useCallback, useEffect, useRef, useState } from "react";

import { AdLoader } from "./AdLoader";
import { AdQueueLoader } from "./AdQueueLoader";
import { PackageConfig, logInfo } from "./log";
import { AdAssets, AdDetails } from "./spec/NativeAdManagerMobileAds";
import { AdState, type AdSpecification } from "./types";
import { adStateToString } from "./utils";

export type AdLoading = {
  specification: AdSpecification;
  state: AdState.Loading;
};

export type AdError = {
  state: AdState.Error;
  error?: Error;
};

export type AdDisplaying<AdFormatType extends AdAssets> = {
  ad: AdDetails<AdFormatType>;
  state: AdState.Displaying;
};

export type AdReceived<AdFormatType extends AdAssets> = {
  ad: AdDetails<AdFormatType>;
  state: AdState.Received;
  targeting?: Record<string, string>;
};

export type AdImpressionRecorded<AdFormatType extends AdAssets, Targeting> = {
  ad: AdDetails<AdFormatType>;
  state: AdState.Impression;
  targeting?: Targeting;
};

export type AdClicked<AdFormatType extends AdAssets, Targeting> = {
  ad: AdDetails<AdFormatType>;
  state: AdState.Clicked;
  targeting?: Targeting;
};

export type AdOutdated<AdFormatType extends AdAssets, Targeting> = {
  ad: AdDetails<AdFormatType>;
  state: AdState.Outdated;
  targeting?: Targeting;
};

type AdStates<AdFormatType extends AdAssets, Targeting> =
  | AdLoading
  | AdError
  | AdReceived<AdFormatType>
  | AdDisplaying<AdFormatType>
  | AdImpressionRecorded<AdFormatType, Targeting>
  | AdClicked<AdFormatType, Targeting>
  | AdOutdated<AdFormatType, Targeting>;

function getAdState<AdFormatType extends AdAssets, Targeting>(
  ad?: AdLoader<AdFormatType, Targeting>
): AdStates<AdFormatType, Targeting> {
  if (ad) {
    const state = ad.getState();
    if (state === AdState.Init) {
      return {
        specification: ad.getSpecification(),
        state: AdState.Loading
      };
    } else if (state === AdState.Loading) {
      return {
        specification: ad.getSpecification(),
        state: AdState.Loading
      };
    } else if (state >= AdState.Received) {
      return {
        ad: ad.getInfos()!.ad!,
        targeting: ad.getTargeting(),
        state
      } as AdStates<AdFormatType, Targeting>;
    }
  }
  return {
    error: ad?.getError(),
    state: AdState.Error
  };
}

function getOne<AdFormatType extends AdAssets, Targeting>(config: {
  loader: AdQueueLoader<AdFormatType, Targeting>;
  instanceId?: string;
}) {
  const { loader, instanceId } = config;
  const specification = loader.getSpecification();
  const { adUnitId, formatIds } = specification;
  const possibleAd = loader.dequeue();
  logInfo(
    PackageConfig.logging,
    {
      ...specification,
      identifier: instanceId
    },
    "getOne",
    possibleAd ? adStateToString(possibleAd.getState()) : "create adloader"
  );

  if (possibleAd) {
    return possibleAd;
  }
  const options = loader.getOptions();
  return new AdLoader<AdFormatType, Targeting>(
    {
      adUnitId,
      formatIds
    },
    options,
    instanceId
  );
}

export function useCustomNativeAd<AdFormatType extends AdAssets, Targeting>(
  queue: AdQueueLoader<AdFormatType, Targeting>,
  options?: {
    renew_attempts?: number;
    log?: boolean;
    identifier?: string;
  }
) {
  const {
    renew_attempts = 2,
    log = false,
    identifier = "useCustomNativeAd"
  } = options || {};
  const tracker = useRef<{
    renew_counter: number;
    renew_afterError: number;
    impressions: number;
  }>({
    renew_counter: 0,
    renew_afterError: 0,
    impressions: 0
  });
  const ref = useRef<AdLoader<AdFormatType, Targeting>>(undefined);
  if (!ref.current) {
    ref.current = getOne<AdFormatType, Targeting>({
      loader: queue,
      instanceId: identifier
    });
  }
  const [state, setState] = useState<AdStates<AdFormatType, Targeting>>(
    getAdState(ref.current)
  );
  useEffect(() => {
    if (ref.current) {
      ref.current.onStateChangeHandler = () => {
        const adState = getAdState<AdFormatType, Targeting>(ref.current);
        setState(adState);
      };
    }

    return () => {
      if (ref.current) {
        ref.current.destroy();
        ref.current.onStateChangeHandler = undefined;
      }
    };
  }, []);

  const upcomingAdRef = useRef<AdLoader<AdFormatType, Targeting>>(undefined);
  const renew = useCallback(() => {
    logInfo(
      log,
      {
        ...queue.getSpecification(),
        identifier
      },
      "renew action",
      "tracker:",
      tracker.current,
      "upcoming:",
      upcomingAdRef.current
    );

    if (!upcomingAdRef.current) {
      tracker.current.renew_counter += 1;
      const newAd = getOne({ loader: queue });
      const newAdState = newAd.getState();

      logInfo(
        log,
        {
          ...queue.getSpecification(),
          identifier
        },
        "get new adstate",
        newAdState
      );
      if (newAdState === AdState.Init || newAdState === AdState.Loading) {
        upcomingAdRef.current = newAd;
        upcomingAdRef.current!.onStateChangeHandler = (newState) => {
          logInfo(
            log,
            {
              ...queue.getSpecification(),
              identifier
            },
            "legacy upcoming onStateChangeHandler",
            adStateToString(newState)
          );
          if (upcomingAdRef.current) {
            if (newState === AdState.Error) {
              upcomingAdRef.current.onStateChangeHandler = undefined;
              upcomingAdRef.current = undefined;
              //   renew_tracker.current.afterError += 1;
              //   if (renew_tracker.current.afterError < renew_attempts) {
              //     console.log('admanager-mobile-ads:''call renew');
              //     renew();
              //   }
            } else if (newState === AdState.Received) {
              tracker.current.renew_afterError = 0;
              if (ref.current) {
                ref.current.destroy();
                ref.current.onStateChangeHandler = undefined;
                ref.current = undefined;
              }
              ref.current = upcomingAdRef.current;
              ref.current.onStateChangeHandler = () =>
                setState(getAdState(ref.current));
              upcomingAdRef.current = undefined;
              setState(getAdState(ref.current));
            }
          }
        };
      } else if (newAdState === AdState.Received) {
        tracker.current.renew_afterError = 0;
        if (ref.current) {
          ref.current.destroy();
          ref.current.onStateChangeHandler = undefined;
        }
        ref.current = newAd;
        newAd.onStateChangeHandler = () => setState(getAdState(ref.current));
        setState(getAdState(ref.current));
      } else {
        tracker.current.renew_afterError += 1;
        if (tracker.current.renew_afterError < renew_attempts) {
          logInfo(
            log,
            {
              ...queue.getSpecification(),
              identifier
            },
            "call renew error"
          );
          renew();
        }
      }
    } else {
      logInfo(
        log,
        {
          ...queue.getSpecification(),
          identifier
        },
        "blocked...something running already"
      );
    }
  }, [queue, log, renew_attempts, identifier]);

  const outdated = useCallback(() => {
    ref.current?.makeOutdated();
  }, []);

  const impression = useCallback(() => {
    ref.current?.recordImpression();
    tracker.current.impressions += 1;
  }, []);

  const display = useCallback(() => {
    ref.current?.display();
  }, []);

  const click = useCallback((assetKey?: string) => {
    ref.current?.recordClick(assetKey);
  }, []);

  return {
    state: state.state,
    id: ref.current.getId(),
    ad: (state as AdReceived<AdFormatType>).ad || undefined,
    targeting: (state as AdReceived<AdFormatType>).targeting,
    error: (state as AdError).error,
    display,
    outdated,
    impression,
    click,
    renew,
    tracker: tracker.current
  } as CustomNativeAdHookReturnType<AdFormatType, Targeting>;
}

export type CustomNativeAdHookReturnType<AdFormatType extends AdAssets, T> = {
  state: AdState;
  id: string;
  ad?: AdDetails<AdFormatType>;
  error?: Error;
  click: (assetKey?: string) => void;
  display: () => void;
  impression: () => void;
  outdated: () => void;
  renew: (targeting?: T) => void;
  targeting: T;
  tracker: {
    renew_counter: number;
    renew_afterError: number;
    impressions: number;
  };
};
