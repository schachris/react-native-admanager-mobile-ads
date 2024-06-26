package com.admanagermobileads;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.google.android.ump.ConsentDebugSettings;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

import javax.annotation.Nonnull;

public class AdManagerMobileAdsConsentModule extends AdManagerMobileAdsConsentSpec {
  public static final String NAME = "AdManagerMobileAdsConsent";
  private ConsentInformation consentInformation;

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }


  public AdManagerMobileAdsConsentModule(ReactApplicationContext reactContext) {
    super(reactContext);
    consentInformation = UserMessagingPlatform.getConsentInformation(reactContext);
  }

  private String getConsentStatusString(int consentStatus) {
    switch (consentStatus) {
      case ConsentInformation.ConsentStatus.REQUIRED:
        return "REQUIRED";
      case ConsentInformation.ConsentStatus.NOT_REQUIRED:
        return "NOT_REQUIRED";
      case ConsentInformation.ConsentStatus.OBTAINED:
        return "OBTAINED";
      case ConsentInformation.ConsentStatus.UNKNOWN:
      default:
        return "UNKNOWN";
    }
  }

  private String getPrivacyOptionsRequirementStatusString(
      ConsentInformation.PrivacyOptionsRequirementStatus privacyOptionsRequirementStatus) {
    switch (privacyOptionsRequirementStatus) {
      case REQUIRED:
        return "REQUIRED";
      case NOT_REQUIRED:
        return "NOT_REQUIRED";
      case UNKNOWN:
      default:
        return "UNKNOWN";
    }
  }

  private WritableMap getConsentInformation() {
    WritableMap consentStatusMap = Arguments.createMap();
    consentStatusMap.putString(
        "status", getConsentStatusString(consentInformation.getConsentStatus()));
    consentStatusMap.putBoolean("canRequestAds", consentInformation.canRequestAds());
    consentStatusMap.putString(
        "privacyOptionsRequirementStatus",
        getPrivacyOptionsRequirementStatusString(
            consentInformation.getPrivacyOptionsRequirementStatus()));
    consentStatusMap.putBoolean(
        "isConsentFormAvailable", consentInformation.isConsentFormAvailable());
    return consentStatusMap;
  }

  @ReactMethod
  public void requestInfoUpdate(@Nonnull final ReadableMap options, final Promise promise) {
    try {
      ConsentRequestParameters.Builder paramsBuilder = new ConsentRequestParameters.Builder();
      ConsentDebugSettings.Builder debugSettingsBuilder =
          new ConsentDebugSettings.Builder(this.getApplicationContext());

      if (options.hasKey("testDeviceIdentifiers")) {
        ReadableArray devices = options.getArray("testDeviceIdentifiers");

        for (int i = 0; i < devices.size(); i++) {
          debugSettingsBuilder.addTestDeviceHashedId(devices.getString(i));
        }
      }

      if (options.hasKey("debugGeography")) {
        debugSettingsBuilder.setDebugGeography(options.getInt("debugGeography"));
      }

      paramsBuilder.setConsentDebugSettings(debugSettingsBuilder.build());

      if (options.hasKey("tagForUnderAgeOfConsent")) {
        paramsBuilder.setTagForUnderAgeOfConsent(options.getBoolean("tagForUnderAgeOfConsent"));
      }

      ConsentRequestParameters consentRequestParameters = paramsBuilder.build();

      Activity currentActivity = this.getCurrentActivity();

      if (currentActivity == null) {
        rejectPromiseWithCodeAndMessage(
            promise,
            "null-activity",
            "Attempted to request a consent info update but the current Activity was null.");
        return;
      }

      consentInformation.requestConsentInfoUpdate(
          currentActivity,
          consentRequestParameters,
          () -> {
            promise.resolve(getConsentInformation());
          },
          formError ->
              rejectPromiseWithCodeAndMessage(
                  promise, "consent-update-failed", formError.getMessage()));
    } catch (Exception e) {
      rejectPromiseWithCodeAndMessage(promise, "consent-update-failed", e.toString());
    }
  }

  @ReactMethod
  public void showForm(final Promise promise) {
    try {
      Activity currentActivity = this.getCurrentActivity();

      if (currentActivity == null) {
        rejectPromiseWithCodeAndMessage(
            promise,
            "null-activity",
            "Consent form attempted to show but the current Activity was null.");
        return;
      }

      currentActivity.runOnUiThread(
          () ->
              UserMessagingPlatform.loadConsentForm(
                  this.getReactApplicationContext(),
                  consentForm ->
                      consentForm.show(
                          currentActivity,
                          formError -> {
                            if (formError != null) {
                              rejectPromiseWithCodeAndMessage(
                                  promise, "consent-form-error", formError.getMessage());
                            } else {
                              promise.resolve(getConsentInformation());
                            }
                          }),
                  formError ->
                      rejectPromiseWithCodeAndMessage(
                          promise, "consent-form-error", formError.getMessage())));
    } catch (Exception e) {
      rejectPromiseWithCodeAndMessage(promise, "consent-form-error", e.toString());
    }
  }

  @ReactMethod
  public void showPrivacyOptionsForm(final Promise promise) {
    try {
      Activity currentActivity = this.getCurrentActivity();

      if (currentActivity == null) {
        rejectPromiseWithCodeAndMessage(
            promise,
            "null-activity",
            "Privacy options form attempted to show but the current Activity was null.");
        return;
      }

      currentActivity.runOnUiThread(
          () ->
              UserMessagingPlatform.showPrivacyOptionsForm(
                  currentActivity,
                  formError -> {
                    if (formError != null) {
                      rejectPromiseWithCodeAndMessage(
                          promise, "privacy-options-form-error", formError.getMessage());
                    } else {
                      promise.resolve(getConsentInformation());
                    }
                  }));
    } catch (Exception e) {
      rejectPromiseWithCodeAndMessage(promise, "consent-form-error", e.toString());
    }
  }

  @ReactMethod
  public void loadAndShowConsentFormIfRequired(final Promise promise) {
    try {
      Activity currentActivity = this.getCurrentActivity();

      if (currentActivity == null) {
        rejectPromiseWithCodeAndMessage(
            promise,
            "null-activity",
            "Consent form attempted to load and show if required but the current Activity was"
                + " null.");
        return;
      }

      currentActivity.runOnUiThread(
          () ->
              UserMessagingPlatform.loadAndShowConsentFormIfRequired(
                  currentActivity,
                  formError -> {
                    if (formError != null) {
                      rejectPromiseWithCodeAndMessage(
                          promise, "consent-form-error", formError.getMessage());
                    } else {
                      promise.resolve(getConsentInformation());
                    }
                  }));
    } catch (Exception e) {
      rejectPromiseWithCodeAndMessage(promise, "consent-form-error", e.toString());
    }
  }

  @ReactMethod
  public void getConsentInfo(Promise promise) {
    promise.resolve(getConsentInformation());
  }

  @ReactMethod
  public void reset() {
    consentInformation.reset();
  }

  @ReactMethod
  public void getTCString(Promise promise) {
    try {
      SharedPreferences prefs =
          PreferenceManager.getDefaultSharedPreferences(this.getReactApplicationContext());
      // https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md#in-app-details
      String tcString = prefs.getString("IABTCF_TCString", null);
      promise.resolve(tcString);
    } catch (Exception e) {
      rejectPromiseWithCodeAndMessage(promise, "consent-string-error", e.toString());
    }
  }

  @ReactMethod
  public void getGdprApplies(Promise promise) {
    try {
      SharedPreferences prefs =
          PreferenceManager.getDefaultSharedPreferences(this.getReactApplicationContext());
      int gdprApplies = prefs.getInt("IABTCF_gdprApplies", 0);
      promise.resolve(gdprApplies == 1);
    } catch (Exception e) {
      rejectPromiseWithCodeAndMessage(promise, "consent-string-error", e.toString());
    }
  }

  @ReactMethod
  public void getPurposeConsents(Promise promise) {
    try {
      SharedPreferences prefs =
          PreferenceManager.getDefaultSharedPreferences(this.getReactApplicationContext());
      String purposeConsents = prefs.getString("IABTCF_PurposeConsents", "");
      promise.resolve(purposeConsents);
    } catch (Exception e) {
      rejectPromiseWithCodeAndMessage(promise, "consent-string-error", e.toString());
    }
  }

  public Context getApplicationContext() {
    return this.getReactApplicationContext().getApplicationContext();
  }

  public static void rejectPromiseWithCodeAndMessage(Promise promise, String code, String message) {
    WritableMap userInfoMap = Arguments.createMap();
    userInfoMap.putString("code", code);
    userInfoMap.putString("message", message);
    promise.reject(code, message, userInfoMap);
  }
}
