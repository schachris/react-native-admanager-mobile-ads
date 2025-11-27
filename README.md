# react-native-admanager-mobile-ads

![Supports iOS and Android][support-badge]

Google Mobile Ads Custom Native Formats wrapper

## Installation

```sh
npm install react-native-admanager-mobile-ads
```

> On Android, before releasing your app, you must select _Yes, my app contains ads_ in the Google Play Store, Policy, App content, Manage under Ads.

## Optionally configure iOS static frameworks

On iOS if you need to use static frameworks (that is, `use_frameworks! :linkage => :static` in your `Podfile`) you must add the variable `$RNAdManagerMobileAdsAsStaticFramework = true` to the targets in your `Podfile`. You may need this if you use this module in combination with react-native-firebase v15 and higher since it requires `use_frameworks!`.

Expo users may enable static frameworks by using the `expo-build-properties` plugin.
To do so [follow the official `expo-build-properties` installation instructions](https://docs.expo.dev/versions/latest/sdk/build-properties/) and merge the following code into your `app.json` or `app.config.js` file:

#### app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ]
  }
}
```

#### app.config.js

```js
{
  expo: {
    plugins: [
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static"
          }
        }
      ]
    ];
  }
}
```

## Usage

This package is for extreme flexibility.
Its a wrapper around [Google Ad Manager - Mobile Ads SDK](https://developers.google.com/ad-manager/mobile-ads-sdk) for ios and android. It tries to pass the core functionality to JS

```js
import {AdManager, useCustomNativeAd, useVisibleCustomNativeAd} from 'react-native-admanager-mobile-ads';

const adLoader = new AdQueueLoader<CustomAdFormat, CustomTargeting>(adSpecification, {
      length: 1,
    });

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
  } = useCustomNativeAd(adLoader);


// ...
```

## Testing

### New Arch

#### iOS

```sh
yarn
cd example/ios
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
xcodebuild clean
cd ../..
# or one line
yarn && cd example/ios && RCT_NEW_ARCH_ENABLED=1 bundle exec pod install && cd ../..
yarn && cd example/ios && RCT_NEW_ARCH_ENABLED=0 bundle exec pod install && cd ../..

# and then
yarn example ios
```

#### Android

Navigate to example/android/gradle.properties and set _newArchEnabled=true_
then run

```sh
yarn clean
yarn
# and then
yarn example android
```

##### generate Artifacts

```sh
cd ./example/android
./gradlew generateCodegenArtifactsFromSchema
cd ../../
yarn example android

# or
cd ./example/android && ./gradlew generateCodegenArtifactsFromSchema && cd ../../ && yarn example android
```

## European User Consent

Under the Google EU User Consent Policy, you must make certain disclosures to your users in the European Economic Area (EEA) and obtain their consent to use cookies or other local storage, where legally required, and to use personal data (such as AdID) to serve ads. This policy reflects the requirements of the EU ePrivacy Directive and the General Data Protection Regulation (GDPR).

The React Native AdManager Mobile Ads module provides out of the box support for helping to manage your users consent within your application. The AdsConsent helper which comes with the module wraps the Google UMP SDK for both Android & iOS, and provides a single JavaScript interface for both platforms.

> This is mostly copied from https://docs.page/invertase/react-native-admanager-mobile-ads/european-user-consent. as invertase did a great work on it.

### Understanding Ads

Ads served by Google can be categorized as personalized or non-personalized, both requiring consent from users in the EEA. By default,
ad requests to Google serve personalized ads, with ad selection based on the user's previously collected data. Users outside of the EEA do not require consent.

> The `AdsConsent` helper only provides you with the tools for requesting consent, it is up to the developer to ensure the consent status is reflected throughout the app.

### Handling consent

To setup and configure ads consent collection, first of all:

- Enable and configure GDPR and IDFA messaging in the [Privacy & messaging section of AdManager's Web Console](https://admanager.google.com/).

- For Android, add the following rule into
  `android/app/proguard-rules.pro`:
  ```
  -keep class com.google.android.gms.internal.consent_sdk.** { *; }
  ```
- For Expo users, add extraProguardRules property to `app.json` file following this guide [Expo](https://docs.expo.dev/versions/latest/sdk/build-properties/#pluginconfigtypeandroid):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "extraProguardRules": "-keep class com.google.android.gms.internal.consent_sdk.** { *; }"
          }
        }
      ]
    ]
  }
}
```

You'll need to generate a new development build before using it.

### Requesting consent information

It is recommended you request consent information each time your application starts to determine if the consent modal should be shown, e.g. due to provider changes.

The `AdsConsent` helper provides a promise based method to return the users consent status called `requestInfoUpdate`.

```js
import { AdsConsent } from "react-native-admanager-mobile-ads";

const consentInfo = await AdsConsent.requestConsentInfoUpdate();
```

The method returns an `AdsConsentInfo` interface, which provides information about consent form availability and the users consent status:

- **status**: The status can be one of 4 outcomes:
  - `UNKNOWN`: Unknown consent status.
  - `REQUIRED`: User consent required but not yet obtained.
  - `NOT_REQUIRED`: User consent not required.
  - `OBTAINED`: User consent already obtained.
- **isConsentFormAvailable**: A boolean value. If `true` a consent form is available.

**Note:** The return status of this call is the status of _form presentation and response collection_, **not
the the actual user consent**. It simply indicates if you now have a consent response to decode.
(_i.e._ if user consent is **required**, the form has been presented, and user has
**denied** the consent, the status returned by this method will be `OBTAINED`,
and not `REQUIRED` as some may expect). To check the actual consent status
see [Inspecting consent choices] below.

### Gathering user consent

You should request an update of the user's consent information at every app launch, using `requestInfoUpdate`.
This determines whether your user needs to provide consent if they haven't done so already, or if their consent has expired.

After you have received the most up-to-date consent status, call `loadAndShowConsentFormIfRequired` to load a consent form.
If the consent status is required, the SDK loads a form and immediately presents it.
The completion handler is called after the form is dismissed. If consent is not required, the completion handler is called immediately.

Before requesting ads in your app, check if you have obtained consent from the user using `canRequestAds`.
If an error occurs during the consent gathering process, you should still attempt to request ads.
The UMP SDK uses the consent status from the previous session.

```js
import {
  AdManager,
  AdsConsent,
  AdsConsentStatus
} from "react-native-admanager-mobile-ads";

let isMobileAdsStartCalled = false;

// Request an update for the consent information.
AdsConsent.requestInfoUpdate().then(() => {
  AdsConsent.loadAndShowConsentFormIfRequired().then((adsConsentInfo) => {
    // Consent has been gathered.
    if (adsConsentInfo.canRequestAds) {
      startGoogleMobileAdsSDK();
    }
  });
});

// Check if you can initialize the Google Mobile Ads SDK in parallel
// while checking for new consent information. Consent obtained in
// the previous session can be used to request ads.
// So you can start loading ads as soon as possible after your app launches.
const { canRequestAds } = await AdsConsent.getConsentInfo();
if (canRequestAds) {
  startGoogleMobileAdsSDK();
}

async function startGoogleMobileAdsSDK() {
  if (isMobileAdsStartCalled) return;

  isMobileAdsStartCalled = true;

  // (Optional, iOS) Handle Apple's App Tracking Transparency manually.
  const gdprApplies = await AdsConsent.getGdprApplies();
  const hasConsentForPurposeOne =
    gdprApplies && (await AdsConsent.getPurposeConsents()).startsWith("1");
  if (!gdprApplies || hasConsentForPurposeOne) {
    // Request ATT...
  }

  // Initialize the Google Mobile Ads SDK.
  await AdManager.start();

  // Request an ad...
}
```

> Do not persist the status. You could however store this locally in application state (e.g. React Context) and update the status on every app launch as it may change.

### Inspecting consent choices

The AdsConsentStatus tells you if you should show the modal to a user or not. Often times you want to run logic based on the user's choices though.
Especially since the Google Mobile Ads SDK won't show any ads if the user didn't give consent to store and/or access information on the device.
This library exports a method that returns some of the most relevant consent flags to handle common use cases.

```js
import { AdsConsent } from "react-native-admanager-mobile-ads";

const {
  activelyScanDeviceCharacteristicsForIdentification,
  applyMarketResearchToGenerateAudienceInsights,
  createAPersonalisedAdsProfile,
  createAPersonalisedContentProfile,
  developAndImproveProducts,
  measureAdPerformance,
  measureContentPerformance,
  selectBasicAds,
  selectPersonalisedAds,
  selectPersonalisedContent,
  storeAndAccessInformationOnDevice,
  usePreciseGeolocationData
} = await AdsConsent.getUserChoices();

if (storeAndAccessInformationOnDevice === false) {
  /**
   * The user declined consent for purpose 1,
   * the Google Mobile Ads SDK won't serve ads.
   */
}
```

**Note:** Don't try to use this functionality to enforce user consent on iOS,
this will likely result in failed app review upon submission to Apple Store, based on [review guideline 3.2.2.vi](https://developer.apple.com/app-store/review/guidelines/#3.2.2):

> ...Apps should not require users to rate the app, review the app, watch videos, download other apps, tap on advertisements, enable tracking...

### Testing

When developing the consent flow, the behavior of the `AdsConsent` responses may not be reliable due to the environment
(e.g. using an emulator vs real device). It is possible to set a debug location to test the various responses from the
UMP SDK.

If using a real device, ensure you add it to the list of allowed devices by passing the device ID, which can be obtained from native logs or using a library
such as [react-native-device-info](https://github.com/react-native-community/react-native-device-info), to `testDeviceIdentifiers`.

> Emulators are automatically whitelisted.

To set a debug location, use the `debugGeography` key. It accepts 3 values:

- **DISABLED**: Removes any previous debug locations.
- **EEA**: Set the test device to be within the EEA.
- **NOT_EEA**: Set the test device to be outside of the EEA.

For example:

```js
import {
  AdsConsent,
  AdsConsentDebugGeography
} from "react-native-admanager-mobile-ads";

const consentInfo = await AdsConsent.requestInfoUpdate({
  debugGeography: AdsConsentDebugGeography.EEA,
  testDeviceIdentifiers: ["TEST-DEVICE-HASHED-ID"]
});
```

It is possible to reset the UMP state for test devices. To reset the ATT state you have to delete and reinstall your app though.

```js
import { AdsConsent } from "react-native-admanager-mobile-ads";

AdsConsent.reset();
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)

[support-badge]: https://img.shields.io/badge/platforms-android%20%7C%20ios-lightgrey.svg?style=flat-square
