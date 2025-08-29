import {
  EmitterSubscription,
  NativeEventEmitter,
  Platform,
  findNodeHandle
} from "react-native";

import type {
  AdAssets,
  AdLoaderDetails,
  Spec
} from "./spec/NativeAdManagerMobileAds";
import type {
  AdTrackingTransparencyStatus,
  GADAdRequestOptions,
  GADInitializationStatus
} from "./types";

import AdManagerModule from "./spec/NativeAdManagerMobileAds";

const LINKING_ERROR =
  `The package 'react-native-admanager-mobile-ads' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: "" }) +
  "- You rebuilt the app after installing the package\n" +
  "- You are not using Expo Go\n";

export const NativeAdManager: Spec = AdManagerModule
  ? AdManagerModule
  : new Proxy({} as any, {
      get() {
        throw new Error(LINKING_ERROR);
      }
    });

export type CustomAdClickHandler = (
  result: { assetKey: string } & AdLoaderDetails<any>
) => void;

class AdManagerController {
  private emitter: NativeEventEmitter;
  private subscription: EmitterSubscription;
  private customClickHandler: { [id: string]: CustomAdClickHandler } = {};
  private defaultClickHandler: CustomAdClickHandler | undefined = undefined;
  constructor() {
    this.emitter = new NativeEventEmitter(NativeAdManager as any);

    // Set up the event listener
    this.subscription = this.emitter.addListener(
      "onAdClicked",
      (data: AdLoaderDetails<any> & { assetKey: string }) => {
        // Handle the callback data here
        if (data && data.id) {
          const handler = this.customClickHandler[data.id];
          if (handler) {
            handler(data);
          } else if (this.defaultClickHandler) {
            this.defaultClickHandler(data);
          }
        }
      }
    );
  }

  removeSubscription() {
    return this.subscription?.remove();
  }

  start() {
    return NativeAdManager.start();
  }

  startWithCallback(callback: (status: GADInitializationStatus) => void) {
    return NativeAdManager.startWithCallback(callback as any);
  }

  setTestDeviceIds(testDeviceIds: ReadonlyArray<string>) {
    return NativeAdManager.setTestDeviceIds(testDeviceIds);
  }

  requestAdTrackingTransparency(
    callback: (status: AdTrackingTransparencyStatus) => void
  ) {
    return NativeAdManager.requestAdTrackingTransparency(callback);
  }

  setOnlyRequestAdsAfterATTFinished(onlyLoadRequestsAfterATT: boolean) {
    return NativeAdManager.requestAdTrackingTransparencyBeforeAdLoad(
      onlyLoadRequestsAfterATT
    );
  }

  clearAll() {
    return NativeAdManager.clearAll();
  }

  async setCustomDefaultClickHandler(handler?: CustomAdClickHandler) {
    if (handler) {
      await NativeAdManager.setCustomDefaultClickHandler();
      this.defaultClickHandler = handler;
    } else {
      return this.removeCustomDefaultClickHandler();
    }
  }
  async removeCustomDefaultClickHandler() {
    await NativeAdManager.removeCustomDefaultClickHandler();
    this.defaultClickHandler = undefined;
  }

  createAdLoader<AdFormatType extends AdAssets = AdAssets>(options: {
    adUnitId: string;
    formatIds: ReadonlyArray<string>;
    videoConfig?: {
      startMuted?: boolean;
      customControlsRequested?: boolean;
      clickToExpandRequested?: boolean;
    };
    imageConfig?: {
      disableImageLoading?: boolean;
      shouldRequestMultipleImages?: boolean;
    };
  }) {
    return NativeAdManager.createAdLoader(options) as unknown as Promise<
      AdLoaderDetails<AdFormatType>
    >;
  }
  loadRequest<
    AdFormatType extends AdAssets = AdAssets,
    AdTargetingOptions = Record<string, string>
  >(adLoaderId: string, options: GADAdRequestOptions<AdTargetingOptions>) {
    return NativeAdManager.loadRequest(
      adLoaderId,
      options
    ) as unknown as Promise<
      AdLoaderDetails<AdFormatType> & { targeting: AdTargetingOptions }
    >;
  }

  removeAdLoader(loaderId: string) {
    return NativeAdManager.removeAdLoader(loaderId);
  }

  getAvailableAdLoaderIds() {
    return NativeAdManager.getAvailableAdLoaderIds();
  }

  getAdLoaderDetails<AdFormatType extends AdAssets = AdAssets>(
    adLoaderId: string
  ) {
    return NativeAdManager.getAdLoaderDetails(adLoaderId) as unknown as Promise<
      AdLoaderDetails<AdFormatType>
    >;
  }

  setIsDisplayingForLoader<AdFormatType extends AdAssets = AdAssets>(
    loaderId: string
  ) {
    return NativeAdManager.setIsDisplayingForLoader(
      loaderId
    ) as unknown as Promise<AdLoaderDetails<AdFormatType>>;
  }

  setIsDisplayingOnViewForLoader<AdFormatType extends AdAssets = AdAssets>(
    loaderId: string,
    adViewRef: React.RefObject<any>
  ) {
    if (adViewRef && adViewRef.current) {
      const adViewTag = findNodeHandle(adViewRef.current);
      if (adViewTag) {
        return NativeAdManager.setIsDisplayingOnViewForLoader(
          loaderId,
          adViewTag
        ) as unknown as Promise<AdLoaderDetails<AdFormatType>>;
      }
    }
    throw new Error("AdViewRef was not found or resolved in null value");
  }

  makeLoaderOutdated<AdFormatType extends AdAssets = AdAssets>(
    loaderId: string
  ) {
    return NativeAdManager.makeLoaderOutdated(loaderId) as unknown as Promise<
      AdLoaderDetails<AdFormatType>
    >;
  }

  destroyLoader<AdFormatType extends AdAssets = AdAssets>(loaderId: string) {
    return NativeAdManager.destroyLoader(loaderId) as unknown as Promise<
      AdLoaderDetails<AdFormatType>
    >;
  }

  recordImpression<AdFormatType extends AdAssets = AdAssets>(
    adLoaderId: string
  ) {
    return NativeAdManager.recordImpression(adLoaderId) as unknown as Promise<
      AdLoaderDetails<AdFormatType>
    >;
  }

  async setCustomClickHandlerForLoader(
    loaderId: string,
    clickHandler?: CustomAdClickHandler
  ) {
    if (clickHandler) {
      await NativeAdManager.setCustomClickHandlerForLoader(loaderId);
      this.customClickHandler[loaderId] = clickHandler;
    } else {
      return this.removeCustomClickHandlerForLoader(loaderId);
    }
  }

  async removeCustomClickHandlerForLoader(loaderId: string) {
    await NativeAdManager.removeCustomClickHandlerForLoader(loaderId);
    delete this.customClickHandler[loaderId];
  }

  recordClick<AdFormatType extends AdAssets = AdAssets>(adLoaderId: string) {
    return NativeAdManager.recordClick(adLoaderId) as Promise<
      AdLoaderDetails<AdFormatType> & { assetKey: string }
    >;
  }

  recordClickOnAssetKey<AdFormatType extends AdAssets = AdAssets>(
    adLoaderId: string,
    assetKey: string
  ) {
    return NativeAdManager.recordClickOnAssetKey(
      adLoaderId,
      assetKey
    ) as Promise<AdLoaderDetails<AdFormatType> & { assetKey: string }>;
  }
}

export const AdManager = new AdManagerController();
