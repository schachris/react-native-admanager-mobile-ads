package com.admanagermobileads;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.google.android.gms.ads.nativead.NativeCustomFormatAd;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class CustomNativeAdLoaderDetails {

  public String id;
  public String adUnitId;
  public List<String> formatIds;

  public CustomNativeAdState state;

  public NativeCustomFormatAd receivedAd;

  public CustomNativeAdLoaderDetails(String id, String adUnitId, List<String> formatIds, CustomNativeAdState state) {
    this.id = id;
    this.adUnitId = adUnitId;
    this.formatIds = formatIds;
    this.state = state;
  }

  public void setReceivedAd(@Nullable NativeCustomFormatAd ad) {
    if(ad != null){
      this.receivedAd = ad;
    }else{
      this.receivedAd = null;
    }
  }

  public WritableMap toWriteableMap() {
    WritableMap infos = Arguments.createMap();
    infos.putString("id", this.id);
    infos.putString("adUnitId", this.adUnitId);
    infos.putArray("formatIds", Utils.convertToWriteableArray(this.formatIds));
    infos.putInt("state", this.state.getValue());

    if (this.receivedAd != null) {
      WritableMap ad = Arguments.createMap();
      ad.putString("formatId", this.receivedAd.getCustomFormatId());
      ad.putArray("assetKeys", Utils.getAvailableAssetKeys(this.receivedAd));
      ad.putMap("responseInfo", Arguments.createMap());
      WritableMap assets = Utils.getAvailableAssets(this.receivedAd);
      ad.putMap("assets", assets);
      infos.putMap("ad", ad);
    }
    return infos;
  }

}
