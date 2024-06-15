#import <React/RCTUtils.h>

#import <React/RCTConvert.h>
#if !TARGET_OS_MACCATALYST
#include <UserMessagingPlatform/UserMessagingPlatform.h>
#endif
#import "RCTBridgeModule.h"
#import "AdManagerMobileAdsConsent.h"

@implementation AdManagerMobileAdsConsent
static NSString *const RNErrorDomain = @"RNErrorDomain";
#pragma mark -
#pragma mark Module Setup

RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

#pragma mark -
#pragma mark AdManager Mobile Ads Methods

#if !TARGET_OS_MACCATALYST
- (NSString *)getConsentStatusString:(UMPConsentStatus)consentStatus {
  switch (consentStatus) {
    case UMPConsentStatusRequired:
      return @"REQUIRED";
    case UMPConsentStatusNotRequired:
      return @"NOT_REQUIRED";
    case UMPConsentStatusObtained:
      return @"OBTAINED";
    case UMPConsentStatusUnknown:
    default:
      return @"UNKNOWN";
  }
}
#endif

#if !TARGET_OS_MACCATALYST
- (NSString *)getPrivacyOptionsRequirementStatusString:
    (UMPPrivacyOptionsRequirementStatus)privacyOptionsRequirementStatus {
  switch (privacyOptionsRequirementStatus) {
    case UMPPrivacyOptionsRequirementStatusRequired:
      return @"REQUIRED";
    case UMPPrivacyOptionsRequirementStatusNotRequired:
      return @"NOT_REQUIRED";
    case UMPPrivacyOptionsRequirementStatusUnknown:
    default:
      return @"UNKNOWN";
  }
}
#endif

#if !TARGET_OS_MACCATALYST
- (NSDictionary *)getConsentInformation {
  return @{
    @"status" : [self getConsentStatusString:UMPConsentInformation.sharedInstance.consentStatus],
    @"canRequestAds" : @(UMPConsentInformation.sharedInstance.canRequestAds),
    @"privacyOptionsRequirementStatus" :
        [self getPrivacyOptionsRequirementStatusString:UMPConsentInformation.sharedInstance
                                                           .privacyOptionsRequirementStatus],
    @"isConsentFormAvailable" :
        @(UMPConsentInformation.sharedInstance.formStatus == UMPFormStatusAvailable)
  };
}
#endif

RCT_EXPORT_METHOD(requestInfoUpdate
                  : (NSDictionary *)options
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
#if !TARGET_OS_MACCATALYST
  UMPRequestParameters *parameters = [[UMPRequestParameters alloc] init];
  UMPDebugSettings *debugSettings = [[UMPDebugSettings alloc] init];

  debugSettings.geography = [options[@"debugGeography"] integerValue] ?: UMPDebugGeographyDisabled;
  debugSettings.testDeviceIdentifiers =
      [options valueForKeyPath:@"testDeviceIdentifiers"] ?: [[NSMutableArray alloc] init];

  parameters.debugSettings = debugSettings;
  parameters.tagForUnderAgeOfConsent = [options[@"tagForUnderAgeOfConsent"] boolValue] ?: FALSE;

  [UMPConsentInformation.sharedInstance
      requestConsentInfoUpdateWithParameters:parameters
                           completionHandler:^(NSError *_Nullable error) {
                             if (error) {
                                 [AdManagerMobileAdsConsent
                                   rejectPromiseWithUserInfo:reject
                                                    userInfo:[@{
                                                      @"code" : @"consent-update-failed",
                                                      @"message" : error.localizedDescription,
                                                    } mutableCopy]];
                             } else {
                               resolve([self getConsentInformation]);
                             }
                           }];
#endif
}

RCT_EXPORT_METHOD(showForm : (RCTPromiseResolveBlock)resolve : (RCTPromiseRejectBlock)reject) {
#if !TARGET_OS_MACCATALYST
  [UMPConsentForm loadWithCompletionHandler:^(UMPConsentForm *form, NSError *loadError) {
    if (loadError) {
        [AdManagerMobileAdsConsent rejectPromiseWithUserInfo:reject
                                      userInfo:[@{
                                        @"code" : @"consent-form-error",
                                        @"message" : loadError.localizedDescription,
                                      } mutableCopy]];
    } else {
      [form presentFromViewController:[UIApplication sharedApplication]
                                          .delegate.window.rootViewController
                    completionHandler:^(NSError *_Nullable dismissError) {
                      if (dismissError) {
                          [AdManagerMobileAdsConsent
                            rejectPromiseWithUserInfo:reject
                                             userInfo:[@{
                                               @"code" : @"consent-form-error",
                                               @"message" : dismissError.localizedDescription,
                                             } mutableCopy]];
                      } else {
                        resolve([self getConsentInformation]);
                      }
                    }];
    }
  }];
#endif
}

RCT_EXPORT_METHOD(showPrivacyOptionsForm
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
#if !TARGET_OS_MACCATALYST
  [UMPConsentForm
      presentPrivacyOptionsFormFromViewController:[UIApplication sharedApplication]
                                                      .delegate.window.rootViewController
                                completionHandler:^(NSError *_Nullable formError) {
                                  if (formError) {
                                      [AdManagerMobileAdsConsent
                                        rejectPromiseWithUserInfo:reject
                                                         userInfo:[@{
                                                           @"code" : @"privacy-options-form-error",
                                                           @"message" :
                                                               formError.localizedDescription,
                                                         } mutableCopy]];
                                  } else {
                                    resolve([self getConsentInformation]);
                                  }
                                }];
#endif
}

RCT_EXPORT_METHOD(loadAndShowConsentFormIfRequired
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
#if !TARGET_OS_MACCATALYST
  [UMPConsentForm
      loadAndPresentIfRequiredFromViewController:[UIApplication sharedApplication]
                                                     .delegate.window.rootViewController
                               completionHandler:^(NSError *_Nullable formError) {
                                 if (formError) {
                                     [AdManagerMobileAdsConsent
                                       rejectPromiseWithUserInfo:reject
                                                        userInfo:[@{
                                                          @"code" : @"consent-form-error",
                                                          @"message" :
                                                              formError.localizedDescription,
                                                        } mutableCopy]];
                                 } else {
                                   resolve([self getConsentInformation]);
                                 }
                               }];
#endif
}

RCT_EXPORT_METHOD(reset) {
#if !TARGET_OS_MACCATALYST
  [UMPConsentInformation.sharedInstance reset];
#endif
}

RCT_EXPORT_METHOD(getConsentInfo
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  resolve([self getConsentInformation]);
}

RCT_EXPORT_METHOD(getTCString : (RCTPromiseResolveBlock)resolve : (RCTPromiseRejectBlock)reject) {
  @try {
    // https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md#in-app-details
    NSString *tcString = [[NSUserDefaults standardUserDefaults] objectForKey:@"IABTCF_TCString"];
    resolve(tcString);
  } @catch (NSError *error) {
      [AdManagerMobileAdsConsent rejectPromiseWithUserInfo:reject
                                    userInfo:[@{
                                      @"code" : @"consent-string-error",
                                      @"message" : error.localizedDescription,
                                    } mutableCopy]];
  }
}

RCT_EXPORT_METHOD(getGdprApplies
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  @try {
    BOOL gdprApplies = [[NSUserDefaults standardUserDefaults] boolForKey:@"IABTCF_gdprApplies"];
    resolve(@(gdprApplies));
  } @catch (NSError *error) {
      [AdManagerMobileAdsConsent rejectPromiseWithUserInfo:reject
                                    userInfo:[@{
                                      @"code" : @"consent-string-error",
                                      @"message" : error.localizedDescription,
                                    } mutableCopy]];
  }
}

RCT_EXPORT_METHOD(getPurposeConsents
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  @try {
    NSString *purposeConsents =
        [[NSUserDefaults standardUserDefaults] stringForKey:@"IABTCF_PurposeConsents"];
    resolve(purposeConsents);
  } @catch (NSError *error) {
      [AdManagerMobileAdsConsent rejectPromiseWithUserInfo:reject
                                    userInfo:[@{
                                      @"code" : @"consent-string-error",
                                      @"message" : error.localizedDescription,
                                    } mutableCopy]];
  }
}


#pragma mark -
#pragma mark Utils
+ (void)rejectPromiseWithUserInfo:(RCTPromiseRejectBlock)reject
                         userInfo:(NSMutableDictionary *)userInfo {
  NSError *error = [NSError errorWithDomain:RNErrorDomain code:666 userInfo:userInfo];
  reject(userInfo[@"code"], userInfo[@"message"], error);
}

@end