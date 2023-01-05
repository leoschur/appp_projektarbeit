import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View, Dimensions, ToastAndroid } from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";
import {
    Provider,
    Button,
    Dialog,
    Portal,
    IconButton,
    ToggleButton,
    Checkbox,
} from "react-native-paper";
import { getCurrentPositionAsync } from "expo-location";
import { StatusBar } from "expo-status-bar";
import { speak } from "expo-speech";
import Constants from "expo-constants";
import { findNearest } from "geolib";
// own imports
import Position from "./Position";
import parkingSpaces from "./parkingSpaces.json";
import useLocation from "./useLocation";
import useParkData from "./useParkData";
import useAsyncStorage from "./useAsyncStorage";

function cvtToDate(s) {
    if (s == undefined) return undefined;
    const dt = s.split(" ");
    let d = dt[0].split(".");
    let t = dt[1].split(":");
    return new Date(+d[2], d[1] - 1, +d[0], ...t);
}

function percentToColor(v) {
    switch (true) {
        case v <= 0.6:
            return "#4cab3c";
        case v <= 0.8:
            return "#ffc724";
        case v <= 0.95:
            return "#ef642a";
        case v <= 1:
            return "#e92e26";
        default:
            return "#7986cb";
    }
}

/**
 * Converts a geometry feature of type point to a position {longitude, latitude}
 * @param {feature} feat
 * @returns {Position} position
 */
const featToPos = (feat) =>
    new Position(feat.geometry.coordinates[1], feat.geometry.coordinates[0]);

export default function App() {
    const data = useParkData();
    const location = useLocation();
    const parkingSpacesLoc = parkingSpaces.features.map(featToPos);
    // const [nearest, setNearest] = useState(undefined);
    /**
     * @type {number | undefined} index of nearest in parkingSpaces
     */
    const nearestParkingSpace = useMemo(() => {
        if (location == undefined) return undefined;
        return parkingSpacesLoc.indexOf(
            findNearest(location, parkingSpacesLoc)
        );
        // if (nearest != curNearest) {
        //     // FIXME nearest is not updated
        //     // console.log(`update nearest ${nearest} => ${curNearest}`);
        //     // different parking space is closer
        //     // setNearest(curNearest);
        //     const t = `Parkhaus ${
        //         parkingSpaces.features[curNearest].properties.name ?? "e"
        //     } in der Nähe!`;
        //     ToastAndroid.show(t, ToastAndroid.SHORT);
        //     const s = `${t} Es sind noch ${3} Plätze frei.`;
        //     speak(s, { language: "de" });
        // }
    }, [location]);

    const [showSettings, setSettings] = useState(false);
    const toggleSettings = () => setSettings(!showSettings);
    /**
     * @type {[boolean, (v: boolean) => void]}
     */
    const [mute, setMute] = useAsyncStorage("mute", false);
    const [favorites, setFavorites] = useAsyncStorage(
        "favorites",
        parkingSpaces.features.reduce(
            (o, feat) => ({ ...o, [feat.properties.name]: true }),
            {}
        )
    );

    const updateNearest = async () => {};

    useEffect(() => {
        // const updateNearestID = setInterval(updateNearest, 1000);
        // updateNearest();

        return () => {
            // clearInterval(updateNearestID);
        };
    }, []);

    return (
        <Provider>
            <View style={styles.container}>
                <StatusBar style="auto" />
                <MapView
                    style={styles.map}
                    showsUserLocation={!!location}
                    followsUserLocation={!!location}
                    initialRegion={Constants.expoConfig.extra.INITIAL_REGION}
                >
                    {parkingSpaces.features.map((feat, i) => {
                        const parkDeck = data?.Parkhaus.find(
                            (p) => p.Name == feat.properties.name
                        );
                        let color = "#7986cb";
                        if (parkDeck != undefined) {
                            let c = parkDeck.Aktuell / parkDeck.Gesamt;
                            color = percentToColor(c);
                        }
                        return (
                            favorites[feat.properties.name] && (
                                <Marker
                                    title={feat.properties.name}
                                    key={`${i}-${color}`}
                                    pinColor={color}
                                    coordinate={featToPos(feat)}
                                >
                                    <Callout onPress={() => {}}>
                                        <View>
                                            <Text>{feat.properties.name}</Text>
                                            {parkDeck ? (
                                                <>
                                                    <Text>{`Frei: ${parkDeck.Frei}/${parkDeck.Gesamt}`}</Text>
                                                    <Text>{`Trend: ${
                                                        parkDeck.Trend == -1
                                                            ? "🙂"
                                                            : parkDeck.Trend ==
                                                              0
                                                            ? "😶"
                                                            : "☹"
                                                    }`}</Text>
                                                </>
                                            ) : (
                                                <Text>
                                                    {"No Data available"}
                                                </Text>
                                            )}
                                        </View>
                                    </Callout>
                                </Marker>
                            )
                        );
                    })}
                </MapView>
                {/* Settings */}
                <Portal>
                    <Dialog visible={showSettings} onDismiss={toggleSettings}>
                        <Dialog.Title>Einstellungen</Dialog.Title>
                        <Dialog.Content style={styles.settingsContent}>
                            <View style={styles.option}>
                                <Text>Sprachausgabe</Text>
                                <Checkbox
                                    status={mute ? "unchecked" : "checked"}
                                    onPress={() => {
                                        setMute(!mute);
                                    }}
                                />
                            </View>
                            <Text style={styles.centerText}>Favoriten</Text>
                            <View>
                                {parkingSpaces.features.map(
                                    ({ properties: { name } }, i) => (
                                        <View key={i} style={styles.option}>
                                            <Text>{name}</Text>
                                            <Checkbox
                                                status={
                                                    favorites[name]
                                                        ? "checked"
                                                        : "unchecked"
                                                }
                                                onPress={() => {
                                                    setFavorites({
                                                        ...favorites,
                                                        [name]: !favorites[
                                                            name
                                                        ],
                                                    });
                                                }}
                                            />
                                        </View>
                                    )
                                )}
                            </View>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={toggleSettings}>Fertig</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
                <IconButton
                    style={styles.iconButton}
                    icon="cog"
                    size={40}
                    onPress={toggleSettings}
                ></IconButton>
            </View>
        </Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        alignContent: "center",
    },
    map: {
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
    },
    iconButton: {
        position: "absolute",
        top: "90%",
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    settingsContent: {
        marginLeft: 50,
        marginRight: 50,
    },
    centerText: {
        alignSelf: "center",
    },
});
