import { AdManager } from "./AdManager";
import { PackageConfig, logInfo } from "./log";
import type {
  AdAssets,
  AdLoaderDetails
} from "./spec/NativeAdManagerMobileAds";
import {
  AdState,
  type AdSpecification,
  type GADAdRequestOptions
} from "./types";
import { adStateToString } from "./utils";

export class AdLoader<
  AdFormatType extends AdAssets,
  AdTargetingOptions = Record<string, string>
> {
  private specification: AdSpecification;

  private state: AdState = AdState.Init;
  private adLoaderInfos: AdLoaderDetails<AdFormatType> | undefined;
  private usedTargeting?: AdTargetingOptions;

  private id?: string;
  private error?: Error;
  private requestOptions: GADAdRequestOptions<AdTargetingOptions> | undefined;

  public errorHandler?: (
    loader: AdLoader<AdFormatType, AdTargetingOptions>,
    error: Error
  ) => void;

  constructor(
    options: AdSpecification,
    requestOptions: GADAdRequestOptions<AdTargetingOptions> | undefined,
    tmp_id?: string
  ) {
    this.id = tmp_id;
    this.specification = options;
    this.requestOptions = requestOptions;
    this.load();
  }

  getId() {
    return this.id;
  }

  private async load() {
    try {
      const details = await AdManager.createAdLoader<AdFormatType>(
        this.specification
      );
      this.id = details.id;
      this.adLoaderInfos = details;
      this.updateState(AdState.Loading);

      const { targeting, ...load_details } = await AdManager.loadRequest<
        AdFormatType,
        AdTargetingOptions
      >(
        details.id,
        this.requestOptions || {
          targeting: undefined
        }
      );

      this.adLoaderInfos = load_details;
      this.usedTargeting = targeting;
      this.updateState(load_details.state);
      return details.id;
    } catch (e) {
      this.log(`load failed`, (e as Error)?.message);
      this.error = e as Error;
      this.updateState(AdState.Error);
    }
    return undefined;
  }

  getInfos() {
    return this.adLoaderInfos;
  }

  getTargeting() {
    return this.usedTargeting;
  }

  getError() {
    return this.error;
  }

  getSpecification() {
    return this.specification;
  }

  public onStateChangeHandler: ((newState: AdState) => void) | undefined;

  private updateState(newState: AdState) {
    this.state = newState;
    this.log(`updateState ${adStateToString(newState)}`);
    this.onStateChangeHandler?.(newState);
    if (newState === AdState.Error) {
      this.errorHandler?.(this, this.getError()!);
    }
  }

  display() {
    AdManager.setIsDisplayingForLoader<AdFormatType>(this.getRequestId()!)
      .then((infos) => {
        this.adLoaderInfos = infos;
        this.updateState(infos.state);
      })
      .catch((error) => {
        this.log(`displaying failed`, error?.message);
        this.error = error;
        this.updateState(AdState.Error);
      });
  }

  recordImpression() {
    AdManager.recordImpression<AdFormatType>(this.getRequestId()!)
      .then((infos) => {
        this.adLoaderInfos = infos;
        this.updateState(infos.state);
      })
      .catch((error) => {
        this.log(`recordImpression failed`, error?.message);
        this.error = error;
        this.updateState(AdState.Error);
      });
  }

  async recordClick(assetKey?: string) {
    try {
      let infos;
      if (assetKey) {
        infos = await AdManager.recordClickOnAssetKey<AdFormatType>(
          this.getRequestId()!,
          assetKey
        );
      } else {
        infos = await AdManager.recordClick<AdFormatType>(this.getRequestId()!);
      }
      this.adLoaderInfos = infos;
      this.updateState(infos.state);
      return infos.assetKey;
    } catch (e) {
      this.error = e as Error;
      this.log(`recordClick failed`, this.error?.message);
      this.updateState(AdState.Error);
      return undefined;
    }
  }

  makeOutdated() {
    AdManager.makeLoaderOutdated<AdFormatType>(this.getRequestId()!)
      .then((infos) => {
        this.adLoaderInfos = infos;
        this.updateState(infos.state);
      })
      .catch((error) => {
        this.log(`makeOutdated failed`, error?.message);
        this.error = error;
        this.updateState(AdState.Error);
      });
  }

  async destroy() {
    try {
      await AdManager.destroyLoader<AdFormatType>(this.getRequestId()!);
      await AdManager.removeAdLoader(this.getRequestId()!);
    } catch (e) {}
  }

  getRequestId() {
    return this.adLoaderInfos?.id;
  }

  getState() {
    return this.state;
  }

  toString() {
    return `ReqId: ${this.getRequestId() || this.id} State: ${adStateToString(this.state)}`;
  }

  log(name: string, ...props: any[]) {
    logInfo(
      PackageConfig.logging,
      {
        ...this.specification,
        identifier: this.id
      },
      name,
      ...props
    );
  }
}
