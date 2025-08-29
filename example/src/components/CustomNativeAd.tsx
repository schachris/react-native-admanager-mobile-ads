import React, { useCallback, useState } from "react";

import { Text, type StyleProp, type ViewStyle } from "react-native";

import {
  AdAssets,
  CustomNativeAdHookReturnType,
  useVisibleCustomNativeAd
} from "react-native-admanager-mobile-ads";
import { VisibilityAwareView } from "react-native-visibility-aware-view";

import type { AdQueueLoader } from "../../../src/AdQueueLoader";

export type CustomNativeAdProps<AdFormatType extends AdAssets, Targeting> = {
  children?: (
    props: CustomNativeAdHookReturnType<AdFormatType, Targeting> & {
      visible: boolean;
    }
  ) => React.ReactNode;
  style?: StyleProp<ViewStyle>;

  adLoader: AdQueueLoader<AdFormatType, Targeting>;
  msToDisplayTillImpressionRecording?: number;
  msToDisplayTillRenew?: number;

  identifier?: string;
};

export function CustomNativeAd<AdFormatType extends AdAssets, Targeting>(
  props: CustomNativeAdProps<AdFormatType, Targeting>
) {
  const {
    children,
    adLoader,
    style,
    msToDisplayTillImpressionRecording = 2000,
    msToDisplayTillRenew = 30 * 1000,
    identifier
  } = props;

  const [visible, setVisibility] = useState<boolean>(false);
  const onBecomeVisible = useCallback(() => {
    setVisibility(true);
  }, [setVisibility]);
  const onBecomeInvisible = useCallback(() => {
    setVisibility(false);
  }, [setVisibility]);

  const customAdProps = useVisibleCustomNativeAd({
    visible,
    msToDisplayTillRenew,
    msToDisplayTillImpressionRecording,
    adLoader,
    log: !!identifier,
    identifier
  });

  return (
    <VisibilityAwareView
      minVisibleArea={0.5}
      style={style}
      onBecomeVisible={onBecomeVisible}
      onBecomeInvisible={onBecomeInvisible}
    >
      <Text>visible: {String(visible)}</Text>
      {children?.({ visible, ...customAdProps })}
    </VisibilityAwareView>
  );
}
