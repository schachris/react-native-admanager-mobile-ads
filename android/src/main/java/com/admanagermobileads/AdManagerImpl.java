package com.admanagermobileads;
import android.content.Context;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.RequestConfiguration;
import com.google.android.gms.ads.VideoOptions;
import com.google.android.gms.ads.admanager.AdManagerAdRequest;
import com.google.android.gms.ads.initialization.OnInitializationCompleteListener;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class AdManagerImpl  {

  /**
   * @{Map} with all registered managers
   **/
  private final Map<String, CustomNativeAdLoader> adLoaders = new HashMap<>();

  public Set<String> getLoaderIds() {
    return adLoaders.keySet();
  }

  private static AdManagerImpl instance;
  public static AdManagerImpl main() {
    if (instance == null) {
      instance = new AdManagerImpl();
    }
    return instance;
  }

  private AdManagerImpl() {
    // private constructor to prevent instantiation from outside the class
  }

  public void clearAll() {
    for (String id : this.adLoaders.keySet()) {
      CustomNativeAdLoader loader = this.adLoaders.get(id);
      loader.clearup();
      loader = null;
    }
    this.adLoaders.clear();
  }

  public CustomNativeAdLoader getAdLoaderForId(String loaderId) throws CustomNativeAdError {
    CustomNativeAdLoader loader = this.adLoaders.get(loaderId);
    if (loader != null) {
      return loader;
    } else {
      throw CustomNativeAdError.withMessage("AdLoader not found.", "AD_REQUEST_NOT_FOUND");
    }
  }

  public Set<String> removeAdLoaderForId(String loaderId) throws CustomNativeAdError {
    CustomNativeAdLoader loader = this.adLoaders.get(loaderId);
    if (loader != null) {
      loader.makeOutdated();
      loader.clearup();
      this.adLoaders.remove(loader);
      loader = null;
      return this.getLoaderIds();
    } else {
      throw CustomNativeAdError.withMessage("AdLoader not found.", "AD_REQUEST_NOT_FOUND");
    }
  }


  public CustomNativeAdLoader createAdLoader(ReactApplicationContext context, String adUnitId, List<String> formatIds) {
    CustomNativeAdLoader loader = new CustomNativeAdLoader(context, adUnitId, formatIds);
    this.adLoaders.put(loader.getLoaderId(), loader);
    return loader;
  }

  /**
   * Statics
   */

  public static void start(Context context) {
    MobileAds.initialize(context, null);
  }

  public static void startWithCallback(Context context, OnInitializationCompleteListener callback) {
    MobileAds.initialize(context, callback);
  }

  public static void setTestDeviceIds(List<String> testDeviceIds) {
    testDeviceIds.add(AdManagerAdRequest.DEVICE_ID_EMULATOR);
    RequestConfiguration configuration = new RequestConfiguration.Builder().setTestDeviceIds(testDeviceIds).build();
    MobileAds.setRequestConfiguration(configuration);
  }

  public static VideoOptions getVideoOptions(ReadableMap videoOptions) {
    VideoOptions customVideoOptions = null;
    if (videoOptions != null) {
      VideoOptions.Builder videoOptionsBuilder = new VideoOptions.Builder();

      if (videoOptions.hasKey("startMuted")) {
        Boolean startMuted = videoOptions.getBoolean("startMuted");
        videoOptionsBuilder.setStartMuted(startMuted);
      } else {
        videoOptionsBuilder.setStartMuted(true);
      }
      if (videoOptions.hasKey("clickToExpandRequested")) {
        Boolean clickToExpandRequested = videoOptions.getBoolean("clickToExpandRequested");
        videoOptionsBuilder.setClickToExpandRequested(clickToExpandRequested);
      }

      if (videoOptions.hasKey("customControlsRequested")) {
        Boolean startMuted = videoOptions.getBoolean("customControlsRequested");
        videoOptionsBuilder.setStartMuted(startMuted);
      }

      customVideoOptions = videoOptionsBuilder.build();
    }
    return customVideoOptions;
  }

  public static AdManagerAdRequest getRequestWithOptions(ReadableMap options, @Nullable ReadableMap defaultTargeting) {
    AdManagerAdRequest.Builder adRequest = new AdManagerAdRequest.Builder();
    ReadableArray categoryExclusions = options.getArray("categoryExclusions");
    if (categoryExclusions != null) {
      for (int i = 0; i < categoryExclusions.size(); i++) {
        adRequest.addCategoryExclusion(categoryExclusions.getString(i));
      }
    }

    ReadableArray keywords = options.getArray("keywords");
    if (keywords != null) {
      for (int i = 0; i < categoryExclusions.size(); i++) {
        adRequest.addKeyword(keywords.getString(i));
      }
    }

    String publisherProvidedID = options.getString("publisherProvidedID");
    if (publisherProvidedID != null) {
      adRequest.setPublisherProvidedId(publisherProvidedID);
    }

    String requestAgent = options.getString("requestAgent");
    if (requestAgent != null) {
      adRequest.setRequestAgent(requestAgent);
    }

    ReadableArray neighboringContentURLStrings = options.getArray("neighboringContentURLStrings");
    if (neighboringContentURLStrings != null) {
      adRequest.setNeighboringContentUrls(Utils.convertReadableArrayToStringArray(neighboringContentURLStrings));
    }

    ReadableMap targeting = options.getMap("targeting");
    if (targeting == null) {
      targeting = defaultTargeting;
    }
    if (targeting != null) {
      ReadableMapKeySetIterator iterator = targeting.keySetIterator();
      while (iterator.hasNextKey()) {
        String key = iterator.nextKey();
        String value = targeting.getString(key);
        if (value != null) {
          adRequest.addCustomTargeting(key, value);
        }
      }
    }
    return adRequest.build();
  }
}
