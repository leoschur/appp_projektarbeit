import { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View, Dimensions, ToastAndroid } from "react-native";
import MapView, { Callout, Marker, Polyline } from "react-native-maps";
import {
    Provider,
    Button,
    Dialog,
    Portal,
    IconButton,
    Checkbox,
} from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { speak } from "expo-speech";
import Constants from "expo-constants";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { findNearest } from "geolib";
// own imports
import Position from "./Position";
import parkingSpaces from "./parkingSpaces.json";
import useLocation from "./useLocation";
import useParkData from "./useParkData";
import useAsyncStorage from "./useAsyncStorage";
import usePrevious from "./usePrevious";
import Padding from "./Padding";
import { registerRootComponent } from "expo";

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
            return "#154889";
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
    const [showSettings, setSettings] = useState(false);
    const toggleSettings = () => setSettings(!showSettings);
    const mapRef = useRef();
    const data = useParkData();
    const location = useLocation();
    /**
     * @type {[boolean, (v: boolean) => void]}
     */
    const [mute, setMute] = useAsyncStorage("mute", false);
    /**
     * @type {[boolean, (v: boolean) => void]}
     */
    const [showLine, setShowLine] = useAsyncStorage("showLine", true);
    /**
     * @type {[{[name: string]: boolean}, function({[name: string]: boolean}): void]}
     */
    const [favorites, setFavorites] = useAsyncStorage(
        "favorites",
        parkingSpaces.features.reduce(
            (o, feat) => ({ ...o, [feat.properties.name]: true }),
            {}
        )
    );
    /**
     * @type {string | undefined} name of nearest in parkingSpaces
     */
    const nearestParkingSpace = useMemo(() => {
        if (location == undefined) return undefined;
        const filteredPS = parkingSpaces.features.filter(
            (feat) => favorites[feat.properties.name]
        );
        const filteredPSPos = filteredPS.map((feat) => featToPos(feat));
        const nearestFromFiltered = filteredPSPos.indexOf(
            findNearest(location, filteredPSPos)
        );
        return filteredPS[nearestFromFiltered].properties.name;
    }, [location]);
    /**
     * contains the last value from nearestParkingSpace
     * @type {string}
     */
    const previousNearest = usePrevious(nearestParkingSpace);

    // custom geofencing
    // react if an other parking space is closer than the previous closest
    if (previousNearest != nearestParkingSpace) {
        const nearest = parkingSpaces.features.find(
            (feat) => feat.properties.name == nearestParkingSpace
        ).properties.name;
        // if no data is available leave blank
        const free = data
            ? data.Parkhaus.find((d) => d.Name == nearest).Frei
            : " ";
        const t = `Parkhaus ${nearest ?? "e"} in der Nähe!`;
        const s = `${t} ${free
            ? `Es ${free == 1 ? "ist" : "sind"} noch ${free} ${free == 1 ? "Platz" : "Plätze"
            } frei.`
            : "Alle Parkplätze sind belegt."
            }`;
        ToastAndroid.show(t, ToastAndroid.SHORT);
        if (!mute) speak(s, { language: "de" });
    }

    return (
        <SafeAreaProvider>
            <Provider>
                <Padding />
                <View style={styles.container}>
                    <StatusBar style="auto" />
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        showsUserLocation={!!location}
                        followsUserLocation={!!location}
                        initialRegion={Constants.expoConfig.extra.INITIAL_REGION}
                    >
                        {parkingSpaces.features.map((feat, i) => {
                            const parkDeck = data?.Parkhaus.find(
                                (p) => p.Name == feat.properties.name
                            );
                            let color = "#154889";
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
                                        <Callout onPress={() => { }}>
                                            <View>
                                                <Text
                                                    style={{ fontWeight: "bold" }}
                                                >
                                                    {feat.properties.name}
                                                </Text>
                                                {parkDeck ? (
                                                    <>
                                                        <Text>{`Frei: ${parkDeck.Frei}/${parkDeck.Gesamt}`}</Text>
                                                        <Text>{`Trend: ${parkDeck.Trend == -1
                                                            ? "🙂"
                                                            : parkDeck.Trend ==
                                                                0
                                                                ? "😶"
                                                                : "🙁"
                                                            }`}</Text>
                                                    </>
                                                ) : (
                                                    <Text>
                                                        {"Keine Daten verfügbar"}
                                                    </Text>
                                                )}
                                            </View>
                                        </Callout>
                                    </Marker>
                                )
                            );
                        })}
                        {location != undefined && showLine && (
                            <Polyline
                                coordinates={[
                                    location,
                                    featToPos(
                                        parkingSpaces.features.find(
                                            (feat) =>
                                                feat.properties.name ==
                                                nearestParkingSpace
                                        )
                                    ),
                                ]}
                                strokeColor="#154889"
                                strokeWidth={2}
                            />
                        )}
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
                                <View style={styles.option}>
                                    <Text>Linie zu nächsten Parkplatz</Text>
                                    <Checkbox
                                        status={showLine ? "checked" : "unchecked"}
                                        onPress={() => {
                                            setShowLine(!showLine);
                                        }}
                                    />
                                </View>
                                <Text
                                    style={{
                                        ...styles.centerText,
                                        fontWeight: "bold",
                                    }}
                                >
                                    Favoriten
                                </Text>
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
        </SafeAreaProvider>
    );
}

registerRootComponent(App);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
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
