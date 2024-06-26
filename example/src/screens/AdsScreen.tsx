import * as React from "react";

import {
  ActivityIndicator,
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import {
  AdQueueLoader,
  AdState,
  GADNativeAdImageProps,
  adStateToString
} from "react-native-admanager-mobile-ads";

import { CustomNativeAd } from "../components/CustomNativeAd";
import {
  CustomNativeAdContainer,
  useAd,
  useAdImpressionTracker,
  useAdState
} from "../components/CustomNativeAdContainer";
import { LogBox } from "../components/LogBox";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white"
  },
  fakeAd: {
    borderWidth: 2,
    borderColor: "orange",
    minHeight: 50,
    minWidth: 200
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 20
  }
});

type CustomAdFormat = {
  title: string;
  subtitle: string;

  callToActionTitle?: string;
  callToActionSubtitle?: string;
  contentImage?: GADNativeAdImageProps;
  titleIcon?: GADNativeAdImageProps;
};

type CustomTargeting = { t: "d" | "l" };

const adUnitId = "/22248153318/test_native_ad";
const formatIds = ["12008639"];

const adSpecification = {
  adUnitId,
  formatIds
};

function AdStateView() {
  const adState = useAdState();
  const impressions = useAdImpressionTracker();
  return (
    <View>
      <Text>{`Impressions: ${impressions}`}</Text>
      <Text>{adStateToString(adState)}</Text>
    </View>
  );
}

function MyCustomAd() {
  const ad = useAd<CustomAdFormat>();
  if (!ad) {
    return <ActivityIndicator />;
  }
  return (
    <View>
      {ad.assets.titleIcon ? (
        <Image
          source={{ uri: ad.assets.titleIcon.uri }}
          style={{
            width: 40,
            height: 40
          }}
        />
      ) : undefined}
      <Text>{ad.assets.title}</Text>
      <Text>{ad.assets.subtitle}</Text>
      {ad.assets.contentImage ? (
        <Image
          source={{ uri: ad.assets.contentImage.uri }}
          style={{ width: "100%", aspectRatio: 3.2 }}
        />
      ) : undefined}
      <Text>{ad.assets.callToActionTitle}</Text>
      <Text>{ad.assets.callToActionSubtitle}</Text>
    </View>
  );
}

export function AdsScreen() {
  const queueRef = React.useRef<AdQueueLoader<
    CustomAdFormat,
    CustomTargeting
  > | null>(null);

  if (!queueRef.current) {
    queueRef.current = new AdQueueLoader<CustomAdFormat, CustomTargeting>(
      adSpecification,
      {
        length: 1
      }
    );
  }
  const queueLoader = queueRef.current!;

  const [targeting, setTargeting] = React.useState<undefined | CustomTargeting>(
    undefined
  );
  const [options, setOptions] = React.useState({
    refreshCount: 0
  });
  const navigation = useNavigation<any>();
  const [log] = React.useState<any[]>([]);
  // const addLog = (...addedLogs: any[]) => setLog((logs) => [...logs, '\n', ...addedLogs]);

  const [delay, setDelay] = React.useState(true);
  React.useEffect(() => {
    setDelay(true);
    setTimeout(() => {
      setDelay(false);
    }, 100);
  }, [options.refreshCount]);

  if (delay) {
    console.log(
      "=======================================\n\n\n\n\n==================================="
    );
    return null;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView />

      <Button
        title="Manager"
        onPress={() => navigation.navigate("ManagerScreen")}
      />

      <Button
        title="Refresh"
        onPress={() => {
          setOptions((options) => ({ refreshCount: options.refreshCount + 1 }));
          queueLoader.clear();
        }}
      />
      <LogBox logs={log} />

      <ScrollView
        key={options.refreshCount}
        style={styles.container}
        contentContainerStyle={{
          backgroundColor: "yellow"
        }}
      >
        <Button
          onPress={() => {
            queueLoader.reload();
          }}
          title="queueLoader.reload"
        />
        <Text>{JSON.stringify(targeting)}</Text>
        <Button
          onPress={() => {
            let newTargeting: CustomTargeting | undefined;
            if (targeting?.t === "d") {
              newTargeting = {
                t: "l"
              };
            } else if (targeting?.t === "l") {
            } else {
              newTargeting = {
                t: "d"
              };
            }
            setTargeting(newTargeting);
            queueLoader.setOptions({
              targeting: newTargeting
            });
          }}
          title="Update Targeting"
        />
        <CustomNativeAdContainer
          adLoader={queueLoader}
          identifier={"CustomNativeAdContainer"}
        >
          <MyCustomAd />
          <AdStateView />
        </CustomNativeAdContainer>
        <View style={{ height: 500 }} />
        <View style={styles.section}>
          <CustomNativeAd<CustomAdFormat, CustomTargeting>
            {...adSpecification}
            adLoader={queueLoader}
          >
            {({ ad, state, click, visible, targeting, id }) => {
              const {
                title,
                subtitle,
                titleIcon,
                contentImage,
                callToActionSubtitle,
                callToActionTitle
              } = ad?.assets || {};
              const common = (
                <>
                  <Text>{visible ? "visible" : "invis"}</Text>
                  <Text>{id}</Text>
                  <Text>Targeting: {JSON.stringify(targeting || {})}</Text>
                </>
              );
              if (state < AdState.Received) {
                return (
                  <View>
                    {common}
                    <ActivityIndicator />
                  </View>
                );
              }
              return (
                <TouchableOpacity
                  onPress={() => {
                    console.log("Record a click");
                    click();
                  }}
                >
                  {common}

                  <View style={[styles.fakeAd, {}]}>
                    <Text>{title}</Text>
                    {titleIcon ? (
                      <Image
                        source={{ uri: titleIcon.uri }}
                        style={{
                          width: 40,
                          height: 40
                        }}
                      />
                    ) : undefined}
                    {contentImage ? (
                      <Image
                        source={{ uri: contentImage.uri }}
                        style={{ width: "100%", aspectRatio: 3.2 }}
                      />
                    ) : undefined}
                    <Text>{subtitle}</Text>

                    <View style={{ gap: 4 }}>
                      {callToActionTitle ? (
                        <Text>{callToActionTitle}</Text>
                      ) : undefined}
                      {callToActionSubtitle ? (
                        <Text>{callToActionSubtitle}</Text>
                      ) : undefined}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          </CustomNativeAd>

          {/* <NativeAd {...adSpecification} testId="Ad_2" loader={queueLoader}>
            {({ ad }) => {
              return (
                <View style={[styles.fakeAd, {}]}>
                  <Text>Hey there I'm another ad with same "source"</Text>
                  <Text>{ad?.assets.title}</Text>
                  <Text>{ad?.assets.subtitle}</Text>
                </View>
              );
            }}
          </NativeAd> */}
        </View>
        <View style={{ height: 800 }} />
      </ScrollView>
    </View>
  );
}
