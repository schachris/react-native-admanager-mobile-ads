import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

import { Int32, UnsafeObject } from "react-native/Libraries/Types/CodegenTypes";

import { GADNativeAdImageProps } from "../types";

export type AdAssets = { [key: string]: string | GADNativeAdImageProps };

export type AdDetails<AdFormatType extends AdAssets = AdAssets> = {
  formatId: string;
  responseInfo: { [key: string]: Object };
  assets: AdFormatType;
  assetKeys: keyof AdFormatType;
};

enum AdState {
  Error = -1,
  Init = 0,
  Loading = 1,
  Received = 2,
  Displaying = 3,
  Impression = 4,
  Clicked = 5,
  Outdated = 6
}

export type AdLoaderDetails<AdFormatType extends AdAssets = AdAssets> = {
  id: string;
  adUnitId: string;
  formatIds: string[];
  state: AdState;
  ad?: AdDetails<AdFormatType>;
};

type LoaderDetails = {
  id: string;
  adUnitId: string;
  formatIds: string[];
  state: AdState;
  ad?: {
    formatId: string;
    responseInfo: { [key: string]: Object };
    assets: AdAssets;
    assetKeys: string[];
  };
};

export interface Spec extends TurboModule {
  start(): void;
  clearAll(): void;
  startWithCallback(callback: (status: UnsafeObject) => void): void;
  setTestDeviceIds(testDeviceIds: ReadonlyArray<string>): void;

  requestAdTrackingTransparency(callback: (status: Int32) => void): void;
  requestAdTrackingTransparencyBeforeAdLoad(shouldRequestATT: boolean): void;

  setCustomDefaultClickHandler(): Promise<void>;
  removeCustomDefaultClickHandler(): Promise<void>;

  createAdLoader(options: {
    adUnitId: string;
    formatIds: ReadonlyArray<string>;
    videoConfig?: {
      startMuted?: boolean;
      customControlsRequested?: boolean;
      clickToExpandRequested?: boolean;
    };
    /**
     * iOS only as android is managed differently
     * see GADAdRequestOptions for Android config
     */
    imageConfig?: {
      disableImageLoading?: boolean;
      shouldRequestMultipleImages?: boolean;
    };
  }): Promise<LoaderDetails>;
  loadRequest(
    adLoaderId: string,
    options: UnsafeObject
  ): Promise<LoaderDetails & { targeting: Object }>;

  removeAdLoader(loaderId: string): Promise<ReadonlyArray<string>>;

  getAvailableAdLoaderIds(): Promise<string[]>;
  getAdLoaderDetails(adLoaderId: string): Promise<LoaderDetails>;

  setIsDisplayingForLoader(loaderId: string): Promise<LoaderDetails>;
  setIsDisplayingOnViewForLoader(
    loaderId: string,
    viewTag: Int32
  ): Promise<LoaderDetails>;
  makeLoaderOutdated(loaderId: string): Promise<LoaderDetails>;
  destroyLoader(loaderId: string): Promise<LoaderDetails>;

  recordImpression(adLoaderId: string): Promise<LoaderDetails>;

  setCustomClickHandlerForLoader(loaderId: string): Promise<void>;
  removeCustomClickHandlerForLoader(loaderId: string): Promise<void>;

  recordClick(
    adLoaderId: string
  ): Promise<LoaderDetails & { assetKey: string }>;
  recordClickOnAssetKey(
    adLoaderId: string,
    assetKey: string
  ): Promise<LoaderDetails & { assetKey: string }>;

  // event emitter
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>("AdManagerMobileAds");
