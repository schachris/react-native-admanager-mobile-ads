import React, { useCallback, useState } from "react";

import { StyleProp, Text, View, ViewStyle } from "react-native";

import {
  AdAssets,
  CustomNativeAdHookReturnType,
  useVisibleCustomNativeAd,
  type AdQueueLoader
} from "react-native-admanager-mobile-ads";
import { VisibilityAwareView } from "react-native-visibility-aware-view";

type CustomAdContext<
  AdFormatType extends AdAssets,
  Targeting
> = CustomNativeAdHookReturnType<AdFormatType, Targeting> & {
  visible: boolean;
};

const Context: React.Context<CustomAdContext<any, any>> = React.createContext<
  CustomAdContext<any, any>
>({} as any);
export function useAd<F extends AdAssets>() {
  return React.useContext<CustomAdContext<F, any>>(Context).ad;
}
export function useAdState<F extends AdAssets>() {
  return React.useContext<CustomAdContext<F, any>>(Context).state;
}
export function useAdClick<F extends AdAssets>() {
  return React.useContext<CustomAdContext<F, any>>(Context).click;
}
export function useAdImpressionTracker<F extends AdAssets>() {
  return React.useContext<CustomAdContext<F, any>>(Context).tracker.impressions;
}

export function useCustomNativeAdContext<F extends AdAssets, T>() {
  return React.useContext<CustomAdContext<F, T>>(Context);
}

export function CustomNativeAdContainer<T extends AdAssets>({
  children,
  adLoader,
  style,
  msToDisplayTillImpressionRecording = 2000,
  msToDisplayTillRenew = 30 * 1000,
  identifier
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  adLoader: AdQueueLoader<T, any>;
  msToDisplayTillImpressionRecording?: number;
  msToDisplayTillRenew?: number;
  identifier: string;
}) {
  const [visible, setVisibility] = useState<boolean>(false);
  const onBecomeVisible = useCallback(() => {
    setVisibility(true);
  }, [setVisibility]);
  const onBecomeInvisible = useCallback(() => {
    setVisibility(false);
  }, [setVisibility]);

  const result = useVisibleCustomNativeAd({
    visible,
    msToDisplayTillRenew,
    msToDisplayTillImpressionRecording,
    adLoader,
    log: true,
    identifier
  });

  return (
    <VisibilityAwareView
      minVisibleArea={0.9}
      style={style}
      onBecomeVisible={onBecomeVisible}
      onBecomeInvisible={onBecomeInvisible}
    >
      {__DEV__ ? (
        <View>
          <Text>{visible ? "visible" : "invis"}</Text>
          <Text>{result.id}</Text>
          <Text>{JSON.stringify(result.tracker)}</Text>
          <Text>Targeting: {JSON.stringify(result.targeting || {})}</Text>
        </View>
      ) : undefined}
      <Context.Provider
        value={{
          ...result,
          visible
        }}
      >
        {children}
      </Context.Provider>
      <Text>{visible ? "visible" : "invis"}</Text>
    </VisibilityAwareView>
  );
}
