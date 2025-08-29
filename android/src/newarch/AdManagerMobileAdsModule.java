package com.admanagermobileads;

import android.view.View;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.UIManagerModule;
import com.google.android.gms.ads.admanager.AdManagerAdRequest;
import com.google.android.gms.ads.nativead.NativeCustomFormatAd;

import java.util.List;
import java.util.Set;

public class AdManagerMobileAdsModule extends com.admanagermobileads.AdManagerMobileAdsSpec {
  public static final String NAME = "AdManagerMobileAds";

  AdManagerMobileAdsModule(ReactApplicationContext context) {
    super(context);
    this._defaultTargeting = null;
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }


  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  // @ReactMethod
  // public void multiply(double a, double b, Promise promise) {
  //   promise.resolve(a * b);
  // }


  private ReadableMap _defaultTargeting;
  private boolean hasCustomClickHandler = false;

  @ReactMethod
  public void start() {
    AdManagerImpl.start(this.getReactApplicationContext());
  }

  @ReactMethod
  public void clearAll() {
    AdManagerImpl.main().clearAll();
  }

  @ReactMethod
  public void startWithCallback(Callback callback) {
    AdManagerImpl.startWithCallback(this.getReactApplicationContext(), initializationStatus -> callback.invoke(Utils.initializationStatusToMap(initializationStatus)));
  }

  @ReactMethod
  public void setTestDeviceIds(ReadableArray testDeviceIds) {
    List<String> deviceIds = Utils.convertReadableArrayToStringArray(testDeviceIds);
    AdManagerImpl.setTestDeviceIds(deviceIds);
  }

  @ReactMethod
  public void defaultTargeting(ReadableMap targeting) {
    this._defaultTargeting = targeting;
  }

  @ReactMethod
  public void removeCustomDefaultClickHandler(Promise promise) {
    this.hasCustomClickHandler = false;
    promise.resolve(null);
  }

  @ReactMethod
  public void setCustomDefaultClickHandler(Promise promise) {
    this.hasCustomClickHandler = true;
    promise.resolve(null);
  }

  @ReactMethod
  public void requestAdTrackingTransparency(Callback callback) {
    // this method is currently ios only so we "mock this and send an authorized code to the JS part"
    callback.invoke(3);
  }

  @ReactMethod
  public void requestAdTrackingTransparencyBeforeAdLoad(boolean shouldRequestATT) {
    // this method is ios only
  }

  @ReactMethod
  public void getAvailableAdLoaderIds(Promise promise) {
    promise.resolve(Utils.convertToWriteableArray(AdManagerImpl.main().getLoaderIds()));
  }

  @ReactMethod
  public void getAdLoaderDetails(String loaderId, Promise promise) {
    try {
      CustomNativeAdLoader loader = AdManagerImpl.main().getAdLoaderForId(loaderId);
      promise.resolve(loader.getDetails().toWriteableMap());
    }catch (CustomNativeAdError error){
      error.insertIntoReactPromiseReject(promise);
    }
  }

  @ReactMethod
  public void createAdLoader(ReadableMap options, Promise promise) {
    try{
      String adUnitId = options.getString("adUnitId");
      ReadableArray formatIds = options.getArray("formatIds");
      String formatId = formatIds.getString(0);
      ReadableMap videoOptions = options.getMap("videoOptions");
      CustomNativeAdLoader loader = AdManagerImpl.main().createAdLoader(this.getReactApplicationContext(), adUnitId, formatId);
      loader.setVideoOptions(AdManagerImpl.getVideoOptions(videoOptions));
      promise.resolve(loader.getDetails().toWriteableMap());
    }catch (Throwable error){
      CustomNativeAdError.fromError(error, "CREATE_REQUEST_ERROR").insertIntoReactPromiseReject(promise);
    }
  }

  @ReactMethod
  public void removeCustomClickHandlerForLoader(String loaderId, Promise promise) {
    try{
      CustomNativeAdLoader loader = AdManagerImpl.main().getAdLoaderForId(loaderId);
      loader.removeCustomClickHandler();
      promise.resolve(null);
    }catch (CustomNativeAdError error){
      error.insertIntoReactPromiseReject(promise);
    }
  }

  @ReactMethod
  public void setCustomClickHandlerForLoader(String loaderId, Promise promise) {
    try{
      CustomNativeAdLoader loader = AdManagerImpl.main().getAdLoaderForId(loaderId);
      loader.setCustomClickHandler((nativeCustomFormatAd, s) -> {
        sendClickEventForLoader(loader, s);
      });
      promise.resolve(null);
    }catch (CustomNativeAdError error){
      error.insertIntoReactPromiseReject(promise);
    }
  }

  @ReactMethod
  public void setIsDisplayingForLoader(String loaderId, Promise promise) {
    try{
      CustomNativeAdLoader loader = AdManagerImpl.main().getAdLoaderForId(loaderId);
      loader.displayAd();
      promise.resolve(loader.getDetails().toWriteableMap());
    }catch (CustomNativeAdError error){
      error.insertIntoReactPromiseReject(promise);
    }
  }

  @ReactMethod
  public void setIsDisplayingOnViewForLoader(String loaderId, double viewTag, Promise promise) {
    getReactApplicationContext().getNativeModule(UIManagerModule.class).addUIBlock(nativeViewHierarchyManager -> {
      try {
        View nativeAdViewContainer = null;
        if (viewTag != -1) {
          nativeAdViewContainer = nativeViewHierarchyManager.resolveView((int) viewTag);
        }
        CustomNativeAdLoader loader = AdManagerImpl.main().getAdLoaderForId(loaderId);
        loader.displayAdOnView(nativeAdViewContainer);
        promise.resolve(loader.getDetails().toWriteableMap());
      } catch (ClassCastException e) {
        promise.reject("E_CANNOT_CAST", e);
      } catch (IllegalViewOperationException e) {
        promise.reject("E_INVALID_TAG_ERROR", e);
      } catch (NullPointerException e) {
        promise.reject("E_NO_NATIVE_AD_VIEW", e);
      }catch (CustomNativeAdError error){
        error.insertIntoReactPromiseReject(promise);
      }
    });
  }

  @ReactMethod
  public void makeLoaderOutdated(String loaderId, Promise promise) {
    try{
      CustomNativeAdLoader loader = AdManagerImpl.main().getAdLoaderForId(loaderId);
      loader.makeOutdated();
      promise.resolve(loader.getDetails().toWriteableMap());
    }catch (CustomNativeAdError error){
      error.insertIntoReactPromiseReject(promise);
    }
  }

  @ReactMethod
  public void destroyLoader(String loaderId, Promise promise) {
    try{
      CustomNativeAdLoader loader = AdManagerImpl.main().getAdLoaderForId(loaderId);
      loader.destroy();
      promise.resolve(loader.getDetails().toWriteableMap());
    }catch (CustomNativeAdError error){
      error.insertIntoReactPromiseReject(promise);
    }
  }

  @ReactMethod
  public void removeAdLoader(String loaderId, Promise promise) {
    try{
      Set<String> remainingIds = AdManagerImpl.main().removeAdLoaderForId(loaderId);
      promise.resolve(Utils.convertToWriteableArray(remainingIds));
    }catch (CustomNativeAdError error){
      error.insertIntoReactPromiseReject(promise);
    }
  }

  @ReactMethod
  public void loadRequest(String loaderId, ReadableMap options, Promise promise) {
    try{
      CustomNativeAdLoader loader = AdManagerImpl.main().getAdLoaderForId(loaderId);
      AdManagerAdRequest adRequest = AdManagerImpl.getRequestWithOptions(options, this._defaultTargeting);
      WritableMap customTargeting = Arguments.fromBundle(adRequest.getCustomTargeting());

      if(this.hasCustomClickHandler && !loader.hasCustomClickHandler()){
        loader.setCustomClickHandler((nativeCustomFormatAd, s) -> {
          sendClickEventForLoader(loader, s);
        });
      }

      if(options.hasKey("returnUrlsForImageAssets")) {
        loader.setReturnUrlsForImageAssets(options.getBoolean("returnUrlsForImageAssets"));
      }

      if(options.hasKey("requestMultipleImages")) {
        loader.setRequestMultipleImages(options.getBoolean("requestMultipleImages"));
      }

      loader.loadAd(adRequest, new CustomNativeAdLoaderHandler() {

        @Override
        public void onAdReceived(CustomNativeAdLoader adLoader, NativeCustomFormatAd nativeCustomFormatAd) {
          WritableMap data = adLoader.getDetails().toWriteableMap();
          data.putMap("targeting", customTargeting);
          promise.resolve(data);
        }

        @Override
        public void onAdLoadFailed(CustomNativeAdLoader adLoader, CustomNativeAdError adError) {
          adError.insertIntoReactPromiseReject(promise);
        }
      });

    }catch (CustomNativeAdError error){
      error.insertIntoReactPromiseReject(promise);
    }
  }

  @ReactMethod
  public void recordImpression(String loaderId, Promise promise) {
    try{
      CustomNativeAdLoader loader = AdManagerImpl.main().getAdLoaderForId(loaderId);
      loader.recordImpression();
      promise.resolve(loader.getDetails().toWriteableMap());
    }catch (CustomNativeAdError error){
      error.insertIntoReactPromiseReject(promise);
    }
  }

  @ReactMethod
  public void recordClickOnAssetKey(String loaderId, String assetKey, Promise promise) {
    try{
      CustomNativeAdLoader loader = AdManagerImpl.main().getAdLoaderForId(loaderId);
      String clickedAssetKey = loader.recordClick(assetKey);
      WritableMap result = loader.getDetails().toWriteableMap();
      result.putString("assetKey", clickedAssetKey);
      promise.resolve(result);
    }catch (CustomNativeAdError error){
      error.insertIntoReactPromiseReject(promise);
    }
  }

  @ReactMethod
  public void recordClick(String loaderId, Promise promise) {
    this.recordClickOnAssetKey(loaderId, null, promise);
  }

  private void sendClickEventForLoader(CustomNativeAdLoader loader, String assetKey) {
    WritableMap data = loader.getDetails().toWriteableMap();
    data.putString("assetKey", assetKey);
    getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit("onAdClicked", data);
  }

  private int listenerCount = 0;
  private boolean hasListeners = false;

  @ReactMethod
  public void addListener(String eventName) {
    if (listenerCount == 0) {
      // Set up any upstream listeners or background tasks as necessary
    }
    listenerCount += 1;
    this.hasListeners = true;
  }

  @ReactMethod
  public void removeListeners(double count) {
    listenerCount -= count;
    if (listenerCount == 0) {
      // Remove upstream listeners, stop unnecessary background tasks
      this.hasListeners = false;
    }
  }
}
