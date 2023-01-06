import { useEffect, useMemo, useRef, useState } from "react";
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
import { findNearest } from "geolib";
// own imports
import Position from "./Position";
import parkingSpaces from "./parkingSpaces.json";
import useLocation from "./useLocation";
import useParkData from "./useParkData";
import useAsyncStorage from "./useAsyncStorage";
import usePrevious from "./usePrevious";

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
    const parkingSpacesLoc = parkingSpaces.features.map(featToPos);
    /**
     * @type {number | undefined} index of nearest in parkingSpaces
     */
    const nearestParkingSpace = useMemo(() => {
        if (location == undefined) return undefined;
        return parkingSpacesLoc.indexOf(
            findNearest(location, parkingSpacesLoc)
        );
    }, [location]);
    const previousNearest = usePrevious(nearestParkingSpace);
    /**
     * @type {[boolean, (v: boolean) => void]}
     */
    const [mute, setMute] = useAsyncStorage("mute", false);
    const [showLine, setShowLine] = useAsyncStorage("showLine", true);
    const [favorites, setFavorites] = useAsyncStorage(
        "favorites",
        parkingSpaces.features.reduce(
            (o, feat) => ({ ...o, [feat.properties.name]: true }),
            {}
        )
    );

    if (previousNearest != nearestParkingSpace) {
        const nearest =
            parkingSpaces.features[nearestParkingSpace].properties.name;
        const free = data.Parkhaus.find((d) => d.Name == nearest).Frei;
        const t = `Parkhaus ${nearest ?? "e"} in der Nähe!`;
        console.info(t);
        ToastAndroid.show(t, ToastAndroid.SHORT);
        const s = `${t} ${
            free
                ? `Es ${free == 1 ? "ist" : "sind"} noch ${free} ${
                      free == 1 ? "Platz" : "Plätze"
                  } frei.`
                : "Alle Parkplätze sind belegt."
        }`;
        if (!mute) speak(s, { language: "de" });
    }

    return (
        <Provider>
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
                                    <Callout onPress={() => {}}>
                                        <View>
                                            <Text
                                                style={{ fontWeight: "bold" }}
                                            >
                                                {feat.properties.name}
                                            </Text>
                                            {parkDeck ? (
                                                <>
                                                    <Text>{`Frei: ${parkDeck.Frei}/${parkDeck.Gesamt}`}</Text>
                                                    <Text>{`Trend: ${
                                                        parkDeck.Trend == -1
                                                            ? "🙂"
                                                            : parkDeck.Trend ==
                                                              0
                                                            ? "😶"
                                                            : "🙁"
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
                    {location != undefined && showLine && (
                        <Polyline
                            coordinates={[
                                location,
                                parkingSpacesLoc[nearestParkingSpace],
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
