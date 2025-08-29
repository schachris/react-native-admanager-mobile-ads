//
//  AdManagerController.m
//  react-native-admanager-mobile-ads
//
//  Created by Christian Schaffrath on 18.05.23.
//

#import "AdManagerController.h"
#import "CustomNativeAdError.h"
#import "GADCustomNativeAd+Infos.h"
#import <AppTrackingTransparency/AppTrackingTransparency.h>
#import <AdSupport/AdSupport.h>

@interface AdManagerController ()

@property (nonatomic, strong) NSMutableDictionary<NSString*, CustomNativeAdLoader*> * adLoaders;

@end

@implementation AdManagerController {
    NSNumber * cachedATTResult;
}

+ (instancetype) main {
    static AdManagerController *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[self alloc] init];
    });
    return sharedInstance;
}

+ (void) startGoogleMobileAdsSDK:(nullable GADInitializationCompletionHandler) completionHandler {
    [GADMobileAds.sharedInstance startWithCompletionHandler:completionHandler];
}

+ (GADVideoOptions *) getVideoOptions: (NSDictionary*) options {
    GADVideoOptions *videoOptions = [[GADVideoOptions alloc] init];
    videoOptions.startMuted = YES;
    if (options != nil) {
        BOOL startMuted = [options objectForKey:@"startMuted"];
        if (startMuted == NO) {
            videoOptions.startMuted = NO;
        }else {
            videoOptions.startMuted = YES;
        }
        BOOL customControlsRequested = [options objectForKey:@"customControlsRequested"];
        if (customControlsRequested == YES) {
            videoOptions.customControlsRequested = YES;
        }
        
        BOOL clickToExpandRequested = [options objectForKey:@"clickToExpandRequested"];
        if (clickToExpandRequested == YES){
            videoOptions.clickToExpandRequested = clickToExpandRequested;
        }
    }
    return videoOptions;
}

+ (GADNativeAdImageAdLoaderOptions *) getImageOptions: (NSDictionary*) options {
    GADNativeAdImageAdLoaderOptions *imageOptions = [[GADNativeAdImageAdLoaderOptions alloc] init];
    imageOptions.disableImageLoading = NO;
    if (options != nil) {
        BOOL disableImageLoading = [options objectForKey:@"disableImageLoading"];
        if (disableImageLoading == YES) {
            imageOptions.disableImageLoading = YES;
        }else {
            imageOptions.disableImageLoading = NO;
        }
        
        BOOL shouldRequestMultipleImages = [options objectForKey:@"shouldRequestMultipleImages"];
        if (shouldRequestMultipleImages == YES){
            imageOptions.shouldRequestMultipleImages = shouldRequestMultipleImages;
        }
    }
    return imageOptions;
}

+ (GAMRequest *) getRequestWithOptions: (NSDictionary*) options andDefaultTargeting: (NSDictionary<NSString *, NSString *> *) defaultTargeting {
    GAMRequest *request = [GAMRequest request];
    
    if (options != nil) {
        NSDictionary<NSString *, NSString *> *customTargeting = [options objectForKey:@"targeting"];
        if (customTargeting != nil) {
            request.customTargeting = customTargeting;
        }else if (defaultTargeting != nil){
            request.customTargeting = defaultTargeting;
        }
        NSArray *categoryExclusions = [options objectForKey:@"categoryExclusions"];
        if (categoryExclusions != nil) {
            request.categoryExclusions = categoryExclusions;
        }
        NSArray *keywords = [options objectForKey:@"keywords"];
        if (keywords != nil) {
            request.keywords = keywords;
        }
        NSString *content_url = [options objectForKey:@"contentURL"];
        if (content_url != nil) {
            request.contentURL = content_url;
        }
        NSString *publisherProvidedID = [options objectForKey:@"publisherProvidedID"];
        if (publisherProvidedID != nil) {
            request.publisherProvidedID = publisherProvidedID;
        }
        NSString *requestAgent = [options objectForKey:@"requestAgent"];
        if (requestAgent != nil) {
            request.requestAgent = requestAgent;
        }
        
        NSArray<NSString *> *neighboringContentURLStrings = [options objectForKey:@"neighboringContentURLStrings"];
        if (neighboringContentURLStrings != nil) {
            request.neighboringContentURLStrings = neighboringContentURLStrings;
        }
        
    }
    return request;
}

+ (void) setTestDeviceIds: (NSArray *) testDeviceIds {
    NSMutableArray * deviceIdsWithSimulator = [NSMutableArray arrayWithArray:testDeviceIds];
  // simulator is enabled by default as test-device https://developers.google.com/ad-manager/mobile-ads-sdk/ios/rel-notes
   // [deviceIdsWithSimulator addObject:GADSimulatorID];
    GADMobileAds.sharedInstance.requestConfiguration.testDeviceIdentifiers = deviceIdsWithSimulator;
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    _adLoaders = [NSMutableDictionary new];
  }
  return self;
}


- (NSArray<NSString*> *) getAvailableAdLoaderIds {
    return [self.adLoaders allKeys];
}

- (NSArray<NSString*> *) removeAdLoader:(NSString *)loaderId {
    CustomNativeAdLoader * loader = [self.adLoaders objectForKey:loaderId];
    if (loader != nil){
        [loader cleanup];
        [self.adLoaders removeObjectForKey:loaderId];
        loader = nil;
        return [self getAvailableAdLoaderIds];
    }else{
        @throw [CustomNativeAdError errorWithMessage:@"AdLoader not found." andCode:@"AD_REQUEST_NOT_FOUND"];
    }
}

- (CustomNativeAdLoader*) createAdLoaderForAdUnitId:(NSString*)adUnitId
                                      withFormatIds: (NSArray<NSString*> *)formatIds
                                         andOptions: (nullable NSArray<GADAdLoaderOptions *> *)options {
    
    CustomNativeAdLoader * adLoader = [[CustomNativeAdLoader alloc] initWithAdUnitId:adUnitId andFormatIds:formatIds rootViewController:nil options: options];
    
    [self.adLoaders setObject:adLoader forKey:[adLoader getLoaderId]];
    
    return adLoader;
}

- (CustomNativeAdLoaderDetails) getAdLoaderDetailsForId: (NSString *) loaderId {
    CustomNativeAdLoader * loader = [self getLoaderForIdOrThrow:loaderId];
    return [loader getDetails];
}

- (void) clearAll {
    for (NSString *loaderId in self.adLoaders.allKeys){
        CustomNativeAdLoader *loader = [self.adLoaders objectForKey:loaderId];
        [loader cleanup];
    }
    self.adLoaders = [NSMutableDictionary new];
}

- (void) clearAllClickHandler {
    for (NSString *loaderId in self.adLoaders.allKeys){
        CustomNativeAdLoader *loader = [self.adLoaders objectForKey:loaderId];
        [loader setCustomClickHandler:nil];
    }
}


- ( CustomNativeAdLoader * _Nonnull ) getLoaderForIdOrThrow: (NSString *) loaderId {
    
    CustomNativeAdLoader * loader = [self.adLoaders objectForKey:loaderId];
    if (loader != nil){
        return loader;
    }else{
        @throw [CustomNativeAdError errorWithMessage:@"AdLoader not found." andCode:@"AD_REQUEST_NOT_FOUND"];
    }
}

- (CustomNativeAdLoader *) loadRequest: (GAMRequest*) request forId: (NSString *) loaderId withSuccessHandler: (ReceivedAdBlock) successHandler andErrorHandler: (AdErrorBlock) errorHandler
{
    CustomNativeAdLoader * loader = [self.adLoaders objectForKey:loaderId];
    if(self.onlyLoadRequestAfterATT){
        [self requestCachedIDFAWithCompletion:^(NSNumber *status) {
            [self loadRequest:request forLoader:loader withSuccessHandler:successHandler andErrorHandler:errorHandler];
        }];
    }else{
        [self loadRequest:request forLoader:loader withSuccessHandler:successHandler andErrorHandler:errorHandler];
    }
    return loader;
}

- (void) loadRequest: (GAMRequest*) request forLoader: (CustomNativeAdLoader *) loader withSuccessHandler: (ReceivedAdBlock) successHandler andErrorHandler: (AdErrorBlock) errorHandler {
    if (loader != nil){
        [loader loadRequest:request WithCompletion:^(CustomNativeAdError * _Nullable error, GADCustomNativeAd * _Nullable customNativeAd) {
            if (error != nil) {
                errorHandler(error);
            }else{
                successHandler(loader, customNativeAd);
            }
        }];
    }else{
        errorHandler([CustomNativeAdError errorWithMessage:@"AdLoader not found." andCode:@"AD_REQUEST_NOT_FOUND"]);
    }
}

- (CustomNativeAdLoader *) recordImpressionForId: (NSString *) loaderId {
    CustomNativeAdLoader * loader = [self getLoaderForIdOrThrow:loaderId];
    BOOL success = [loader recordImpression];
    if(success){
        return loader;
    }
    @throw [CustomNativeAdError errorWithMessage:@"Could not record impression. Propably no ad received yet." andCode:@"RECORD_AD_IMPRESSION_FAILED"];
}

- (CustomNativeAdLoader *) setIsDisplayingOnView: (UIView *) view forLoader: (NSString*) loaderId
{
    if (view == nil){
        @throw [CustomNativeAdError errorWithMessage:@"The ad could not be displayed on the given view. The view was probably not found. You may add collapsable=false to resolve this issue." andCode:@"AD_NOT_DISPLAYABLE"];
    }
    CustomNativeAdLoader * loader = [self getLoaderForIdOrThrow:loaderId];
    BOOL success = [loader setIsDisplayingOnView:view];
    if (success){
        return loader;
    }else{
        @throw [CustomNativeAdError errorWithMessage:@"The ad is not ready to display." andCode:@"AD_NOT_DISPLAYABLE"];
    }
}

- (CustomNativeAdLoader *) setIsDisplayingForLoader: (NSString*) loaderId
{
    CustomNativeAdLoader * loader = [self getLoaderForIdOrThrow:loaderId];
    BOOL success = [loader setIsDisplaying];
    if (success){
        return loader;
    }else{
        @throw [CustomNativeAdError errorWithMessage:@"The ad is not ready to display." andCode:@"AD_NOT_DISPLAYABLE"];
    }
}

- (CustomNativeAdLoader *) makeLoaderOutdated: (NSString*) loaderId {
    CustomNativeAdLoader * loader = [self getLoaderForIdOrThrow:loaderId];
    [loader makeOutdated];
    return loader;
}

- (CustomNativeAdLoader *) destroyLoader: (NSString*) loaderId {
    CustomNativeAdLoader * loader = [self getLoaderForIdOrThrow:loaderId];
    [loader makeOutdated];
    return loader;
}

- (CustomNativeAdLoader *) setCustomClickHandlerForLoader: (NSString*) loaderId clickHandler:(nullable GADNativeAdCustomClickHandler) handler {
    CustomNativeAdLoader * loader = [self getLoaderForIdOrThrow:loaderId];
    [loader setCustomClickHandler:handler];
    return loader;
}


- (NSString *) forLoaderId: (NSString *) loaderId
                 recordClickOnAssetKey: (nullable NSString *) assetKey withDefaultClickHandler: (nullable GADNativeAdCustomClickHandler) defaultClickHandler
{
    CustomNativeAdLoader * loader = [self getLoaderForIdOrThrow:loaderId];
    GADCustomNativeAd * ad = [loader getReceivedAd];
    
    if (ad != nil){
        NSString * clickKey = assetKey;
        if(clickKey == nil) {
            clickKey = [[loader getReceivedAd] getOneAssetKey];
        }
        
        if (![[ad availableAssetKeys] containsObject:clickKey]){
            @throw [CustomNativeAdError errorWithMessage:@"Asset key must be one of the included assetKeys." andCode:@"RECORD_AD_CLICK_FAILED"];
        }
        
        //In case there is a "defaultCustomClickHandler" set
        if(defaultClickHandler && ![loader hasActiveCustomClickHandler]){
            [loader setCustomClickHandler:defaultClickHandler];
        }
        
        BOOL success = [loader performClickOnAssetWithKey:clickKey];
        if(success){
            return clickKey;
        }
    }
    
    @throw [CustomNativeAdError errorWithMessage:@"Could not record click on asset key. Propably no ad received yet." andCode:@"RECORD_AD_CLICK_FAILED"];;
}

#pragma mark AppTrackingTransparency

- (void)requestIDFAWithCompletion: (void(^)(NSNumber * status))completion  {
    if (@available(iOS 14, *)) {
        [ATTrackingManager requestTrackingAuthorizationWithCompletionHandler:^(ATTrackingManagerAuthorizationStatus status) {
            self->cachedATTResult = [NSNumber numberWithUnsignedInteger:status];
            completion(self->cachedATTResult);
        }];
    } else {
        // Fallback on earlier versions
        cachedATTResult = @1;
        completion(@1);
    }
}

- (void)requestCachedIDFAWithCompletion: (void(^)(NSNumber * status))completion  {
    //if its not determined yet we should call it at least once
    if(cachedATTResult.intValue == 0){
        [self requestIDFAWithCompletion:completion];
    }else{
        completion(cachedATTResult);
    }
}


@end
