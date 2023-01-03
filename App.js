import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View, Dimensions, ToastAndroid } from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";
import { findNearest } from "geolib";
import Position from "./Position";
import parkingSpaces from "./parkingSpaces.json";
import { speak } from "expo-speech";
import useLocation from "./useLocation";
import useParkData from "./useParkData";
import Constants from "expo-constants";

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
    // const nearestParkingSpace = useMemo(() => {
    //     if (region != undefined) return;
    // }, []);

    const updateNearest = async () => {
        if (region != undefined) return;
        getCurrentPositionAsync().then((p) => {
            const curNearest = parkingSpacesLoc.indexOf(
                findNearest(p.coords, parkingSpacesLoc)
            );
            if (nearest != curNearest) {
                // FIXME nearest is not updated
                // console.log(`update nearest ${nearest} => ${curNearest}`);
                // different parking space is closer
                // setNearest(curNearest);
                const t = `Parkhaus ${
                    parkingSpaces.features[curNearest].properties.name ?? "e"
                } in der Nähe!`;
                ToastAndroid.show(t, ToastAndroid.SHORT);
                const s = `${t} Es sind noch ${3} Plätze frei.`;
                speak(s, { language: "de" });
            }
        });
    };

    useEffect(() => {
        // const updateNearestID = setInterval(updateNearest, 1000);
        // updateNearest();

        return () => {
            // clearInterval(updateNearestID);
        };
    }, []);

    return (
        <View style={styles.container}>
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
                                                    : parkDeck.Trend == 0
                                                    ? "😶"
                                                    : "☹"
                                            }`}</Text>
                                        </>
                                    ) : (
                                        <Text>{"No Data available"}</Text>
                                    )}
                                </View>
                            </Callout>
                        </Marker>
                    );
                })}
            </MapView>
            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    map: {
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
    },
});
