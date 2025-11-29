package com.admanagermobileads;

import android.app.Activity;
import android.util.Log;
import android.view.View;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdLoader;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MediaContent;
import com.google.android.gms.ads.VideoOptions;
import com.google.android.gms.ads.admanager.AdManagerAdRequest;
import com.google.android.gms.ads.nativead.MediaView;
import com.google.android.gms.ads.nativead.NativeAdOptions;
import com.google.android.gms.ads.nativead.NativeCustomFormatAd;

import java.util.List;
import java.util.UUID;

public class CustomNativeAdLoader {

  private String loaderId;
  private String adUnitId;
  private List<String> formatIds;
  private CustomNativeAdState _adState;
  private CustomNativeAdError error;

  private NativeAdOptions.Builder adOptionBuilder;
  private AdLoader.Builder adLoaderBuilder;
  private AdLoader adLoader;
  private AdManagerAdRequest adRequest;
  private NativeCustomFormatAd receivedAd;

  private NativeCustomFormatAd.OnCustomClickListener customClickListener;

  private ReactApplicationContext reactApplicationContext;

  private AdStateChangeListener adStateChangeListener;
  private CustomNativeAdLoaderHandler adLoaderCompletionListener;

  public interface AdStateChangeListener {
    void onStateChanged(CustomNativeAdLoader loader, CustomNativeAdState oldState, CustomNativeAdState newState);
  }

  CustomNativeAdLoader(ReactApplicationContext context, String adUnitId, List<String> formatIds) {
    UUID uuid = UUID.randomUUID();
    this.loaderId = uuid.toString();

    this.adUnitId = adUnitId;
    this.formatIds = formatIds;
    this.reactApplicationContext = context;
    this.error = null;
    this._adState = CustomNativeAdState.CustomNativeAdStateInit;
    this.initBuilder();
  }

  private void initBuilder() {
    this.adLoaderBuilder = new AdLoader.Builder(this.reactApplicationContext, this.getAdUnitId());
    this.adOptionBuilder = new NativeAdOptions.Builder();
  }

  private void forceUpdateState(CustomNativeAdState newState) {
    CustomNativeAdState oldState = this._adState;
    this._adState = newState;
    if (this.adStateChangeListener != null) {
      this.adStateChangeListener.onStateChanged(this, oldState, newState);
    }
  }

  private void updateState(CustomNativeAdState newState) {
    CustomNativeAdState oldState = this._adState;
    if(oldState == CustomNativeAdState.CustomNativeAdStateError || oldState.getValue() < newState.getValue()) {
      this.forceUpdateState(newState);
    }
  }

  public String getAdUnitId() {
    return this.adUnitId;
  }

  public String getLoaderId() {
    return this.loaderId;
  }

//  public String getFormatId() {
//    return this.formatId;
//  }

  public Boolean hasCustomClickHandler() {
    return this.customClickListener != null;
  }

  public void setVideoOptions(@Nullable VideoOptions options) {
    // Methods in the NativeAdOptions.Builder class can be
    // used here to specify individual options settings.
    if (options == null) {
      adOptionBuilder.setVideoOptions(new VideoOptions.Builder().setStartMuted(true).build());
    } else {
      adOptionBuilder.setVideoOptions(options);
    }
  }
  public void setReturnUrlsForImageAssets(Boolean shouldSet) {
    this.adOptionBuilder.setReturnUrlsForImageAssets(shouldSet);
  }
  public void setRequestMultipleImages(Boolean shouldSet) {
    this.adOptionBuilder.setRequestMultipleImages(shouldSet);
  }

  public void removeCustomClickHandler() throws CustomNativeAdError {
    if (this._adState.getValue() <= CustomNativeAdState.CustomNativeAdStateLoading.getValue()) {
      this.customClickListener = null;
    } else {
      throw CustomNativeAdError.withMessage("Custom click handler can only be set before the loader starts to fetch an ad.", "SET_CUSTOM_CLICK_AFTER_LOAD");
    }
  }
  public void setCustomClickHandler(NativeCustomFormatAd.OnCustomClickListener handler) throws CustomNativeAdError {
    if (this._adState.getValue() <= CustomNativeAdState.CustomNativeAdStateLoading.getValue()) {
      this.customClickListener = handler;
    } else {
      throw CustomNativeAdError.withMessage("Custom click handler can only be set before the loader starts to fetch an ad.", "SET_CUSTOM_CLICK_AFTER_LOAD");
    }
  }

  public void clearup() {
    this.customClickListener = null;
    if (this.receivedAd != null) {
      this.receivedAd.destroy();
      this.receivedAd = null;
    }
    this.adLoader = null;
    this.adRequest = null;
    this.initBuilder();
    this.setVideoOptions(null);
    this.forceUpdateState(CustomNativeAdState.CustomNativeAdStateInit);
  }

  public void destroy() {
    this.clearup();
  }

  public CustomNativeAdLoaderDetails getDetails() {
    CustomNativeAdLoaderDetails details = new CustomNativeAdLoaderDetails(this.loaderId, this.adUnitId, this.formatIds, this._adState);
    details.setReceivedAd(this.receivedAd);
    return details;
  }

  private void prepareForAdLoading() {
    for (String formatId : this.formatIds){
      this.adLoaderBuilder.forCustomFormatAd(formatId, new NativeCustomFormatAd.OnCustomFormatAdLoadedListener() {
        @Override
        public void onCustomFormatAdLoaded(@NonNull NativeCustomFormatAd nativeCustomFormatAd) {
          // If this callback occurs after the activity is destroyed, you
          // must call destroy and return or you may get a memory leak.
          // Note `isDestroyed()` is a method on Activity.
          Activity activity = CustomNativeAdLoader.this.reactApplicationContext.getCurrentActivity();
          if(activity == null) {
            nativeCustomFormatAd.destroy();
            CustomNativeAdError error = CustomNativeAdError.withMessage("Current Activity is null", "FAILED_TO_RECEIVE_AD");
            CustomNativeAdLoader.this.error = error;
            CustomNativeAdLoader.this.updateState(CustomNativeAdState.CustomNativeAdStateError);
            CustomNativeAdLoader.this.adLoaderCompletionListener.onAdLoadFailed(CustomNativeAdLoader.this, error);
            CustomNativeAdLoader.this.adLoaderCompletionListener = null;
            return;
          }
          if (activity.isDestroyed()) {
            nativeCustomFormatAd.destroy();
            CustomNativeAdError error = CustomNativeAdError.withMessage("Current Activity is destroyed", "FAILED_TO_RECEIVE_AD");
            CustomNativeAdLoader.this.error = error;
            CustomNativeAdLoader.this.updateState(CustomNativeAdState.CustomNativeAdStateError);
            CustomNativeAdLoader.this.adLoaderCompletionListener.onAdLoadFailed(CustomNativeAdLoader.this, error);
            CustomNativeAdLoader.this.adLoaderCompletionListener = null;
            return;
          }
          // Show the custom format and record an impression.
          CustomNativeAdLoader.this.receivedAd = nativeCustomFormatAd;
          CustomNativeAdLoader.this.updateState(CustomNativeAdState.CustomNativeAdStateReceived);
          CustomNativeAdLoader.this.adLoaderCompletionListener.onAdReceived(CustomNativeAdLoader.this, nativeCustomFormatAd);
          CustomNativeAdLoader.this.adLoaderCompletionListener = null;
        }
      }, this.customClickListener);
    }
    this.adLoaderBuilder.withNativeAdOptions(CustomNativeAdLoader.this.adOptionBuilder.build());
    this.adLoaderBuilder.withAdListener(new AdListener() {
      @Override
      public void onAdFailedToLoad(@NonNull LoadAdError var1) {
        CustomNativeAdError error = CustomNativeAdError.fromAdError(var1, "FAILED_TO_RECEIVE_AD");
        CustomNativeAdLoader.this.error = error;
        CustomNativeAdLoader.this.updateState(CustomNativeAdState.CustomNativeAdStateError);
        // Handle the failure by logging, altering the UI, and so on.
        CustomNativeAdLoader.this.adLoaderCompletionListener.onAdLoadFailed(CustomNativeAdLoader.this, error);
        CustomNativeAdLoader.this.adLoaderCompletionListener = null;
      }
    });
  }

  public void loadAd(AdManagerAdRequest adRequest, CustomNativeAdLoaderHandler completionListener) {
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if(adLoader != null && adLoader.isLoading()){
          CustomNativeAdError error = CustomNativeAdError.withMessage("This loader is already loading a request.", "AD_REQUEST_ALREADY_RUNNING");
          CustomNativeAdLoader.this.error = error;
          CustomNativeAdLoader.this.updateState(CustomNativeAdState.CustomNativeAdStateError);
          CustomNativeAdLoader.this.adLoaderCompletionListener.onAdLoadFailed(CustomNativeAdLoader.this, error);
        }else{
          if (adLoader == null) {
            CustomNativeAdLoader.this.prepareForAdLoading();
          }
          CustomNativeAdLoader.this.adLoaderCompletionListener = completionListener;
          CustomNativeAdLoader.this.adLoader = adLoaderBuilder.build();
          CustomNativeAdLoader.this.adRequest = adRequest;
          CustomNativeAdLoader.this.updateState(CustomNativeAdState.CustomNativeAdStateLoading);
          CustomNativeAdLoader.this.adLoader.loadAd(adRequest);
        }
      }
    });
  }

  public void displayAd() throws CustomNativeAdError {
    if (this._adState.getValue() >= CustomNativeAdState.CustomNativeAdStateReceived.getValue()) {
      this.updateState(CustomNativeAdState.CustomNativeAdStateDisplaying);
    } else {
      throw CustomNativeAdError.withMessage("The ad is not ready to display.", "AD_NOT_DISPLAYABLE");
    }
  }

  public void displayAdOnView(@Nullable View view) throws CustomNativeAdError {
    if (this._adState.getValue() >= CustomNativeAdState.CustomNativeAdStateReceived.getValue()) {
      if(this.receivedAd != null && view != null){
        this.receivedAd.getDisplayOpenMeasurement().setView(view);
        boolean result = this.receivedAd.getDisplayOpenMeasurement().start();
        if(result == false){
          Log.w("ReactNativeAdManager", "The ad could not be displayed on the given view. The view was found but displayOpenMeasurement failed.");
//          throw CustomNativeAdError.withMessage("", "AD_DISPLAY_MEASUREMENT_FAILED");
        }
        this.updateState(CustomNativeAdState.CustomNativeAdStateDisplaying);
      }else{
        throw CustomNativeAdError.withMessage("The ad could not be displayed on the given view. The view was probably not found. You may add collapsable=false to resolve this issue.", "AD_NOT_DISPLAYABLE");
      }
    } else {
      throw CustomNativeAdError.withMessage("The ad is not ready to display.", "AD_NOT_DISPLAYABLE");
    }
  }

  private void displayVideo(@Nullable FrameLayout mediaPlaceholder) throws CustomNativeAdError {
    //TODO: not implemented yet
    MediaContent mediaContent = this.receivedAd.getMediaContent();
    if(mediaContent != null && mediaContent.hasVideoContent()){
      MediaView mediaView = new MediaView(mediaPlaceholder.getContext());
      mediaView.setMediaContent(mediaContent);
      mediaPlaceholder.addView(mediaView);
      // Create a new VideoLifecycleCallbacks object and pass it to the VideoController. The
      // VideoController will call methods on this object when events occur in the video
      // lifecycle.
      //    myNativeAd.getMediaContent().getVideoController()
//      .setVideoLifecycleCallbacks(new VideoLifecycleCallbacks() {
//
//        /** Called when video playback first begins. */
//        @Override
//        public void onVideoStart() {
//          // Do something when the video starts the first time.
//          Log.d("MyApp", "Video Started");
//        }
//
//        /** Called when video playback is playing. */
//        @Override
//        public void onVideoPlay() {
//          // Do something when the video plays.
//          Log.d("MyApp", "Video Played");
//        }
//
//        /** Called when video playback is paused. */
//        @Override
//        public void onVideoPause() {
//          // Do something when the video pauses.
//          Log.d("MyApp", "Video Paused");
//        }
//
//        /** Called when video playback finishes playing. */
//        @Override
//        public void onVideoEnd() {
//          // Do something when the video ends.
//          Log.d("MyApp", "Video Ended");
//        }
//
//        /** Called when the video changes mute state. */
//        @Override
//        public void onVideoMute(boolean isMuted) {
//          // Do something when the video is muted.
//          Log.d("MyApp", "Video Muted");
//        }
//
//      });
    }else{
      throw CustomNativeAdError.withMessage("The ad has no video to display.", "VIDEO_AD_NOT_DISPLAYABLE");
    }
  }

  public void recordImpression() throws CustomNativeAdError {
    if (this.receivedAd != null) {
      UiThreadUtil.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          CustomNativeAdLoader.this.receivedAd.recordImpression();
        }
      });
      CustomNativeAdLoader.this.updateState(CustomNativeAdState.CustomNativeAdStateImpression);
    }else{
      throw CustomNativeAdError.withMessage("Could not record impression. Propably no ad received yet.", "RECORD_AD_IMPRESSION_FAILED");
    }
  }

  public String recordClick(@Nullable String assetKey) throws CustomNativeAdError {
    if (this.receivedAd != null) {
      String clickedAssetKey;
      if(assetKey == null){
        clickedAssetKey = Utils.getOneAssetKey(this.receivedAd);
      }else{
        clickedAssetKey = assetKey;
      }
      UiThreadUtil.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          //It does not matter if we call this function to often...google will take care of that and still tracks it as a single impression
          //so if someone clicks it the ad must have been seen
          CustomNativeAdLoader.this.receivedAd.recordImpression();
          CustomNativeAdLoader.this.receivedAd.performClick(clickedAssetKey);
        }
      });
      CustomNativeAdLoader.this.updateState(CustomNativeAdState.CustomNativeAdStateClicked);
      return clickedAssetKey;
    }else{
      throw CustomNativeAdError.withMessage("Could not record click on asset key. Propably no ad received yet.", "RECORD_AD_CLICK_FAILED");
    }
  }

  public void makeOutdated() {
    this.updateState(CustomNativeAdState.CustomNativeAdStateOutdated);
  }
}
