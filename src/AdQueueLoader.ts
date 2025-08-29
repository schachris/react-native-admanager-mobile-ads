import { AdLoader } from "./AdLoader";
import { Queue } from "./Queue";
import { PackageConfig, logInfo } from "./log";
import { AdAssets } from "./spec/NativeAdManagerMobileAds";
import type { AdSpecification, GADAdRequestOptions } from "./types";

function guidGenerator() {
  var S4 = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return S4() + S4() + "-" + S4() + "-" + S4() + S4() + S4();
}

export class AdQueueLoader<
  AdFormatType extends AdAssets,
  AdTargetingOptions = Record<string, string>
> extends Queue<AdLoader<AdFormatType, AdTargetingOptions>> {
  private minNumberOfItems: number = 0;
  private specification: AdSpecification;

  private requestOptions: GADAdRequestOptions<AdTargetingOptions> | undefined;

  constructor(
    specification: AdSpecification,
    specs: undefined | { length?: number },
    requestOptions?: GADAdRequestOptions<AdTargetingOptions> | undefined
  ) {
    super();
    this.handler = this;
    this.minNumberOfItems = specs?.length || 0;
    this.specification = specification;
    this.setOptions(requestOptions);
  }

  public setOptions(
    options: GADAdRequestOptions<AdTargetingOptions> | undefined
  ) {
    logInfo(PackageConfig.logging, this.specification, "setOptions", options);
    this.requestOptions = options;
    this.clear();
  }

  public getOptions() {
    return this.requestOptions;
  }

  public getSpecification() {
    return this.specification;
  }

  public onSizeChanged(): void {
    this.refillQueue();
  }

  public reload(): void {
    this.clear();
    // this will cause a onSizeChanged call
    // => so we do not need to refillQueue here again
  }

  private refillQueue() {
    const missing = this.minNumberOfItems - this.size();
    logInfo(
      PackageConfig.logging,
      this.specification,
      "refill",
      `missing: ${missing}`
    );

    for (let index = 0; index < missing; index++) {
      const ad = new AdLoader<AdFormatType, AdTargetingOptions>(
        this.specification,
        this.requestOptions,
        `prefetch_ad_${guidGenerator()}`
      );
      this.items.push(ad);
    }
  }
}
