import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Dimensions } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { requestForegroundPermissionsAsync } from "expo-location";
import FetchService from "./FetchService";
import Geolocation from "@react-native-community/geolocation";
import parkingSpaces from "./parkingSpaces.json";

function cvtToDate(s) {
    if (s == undefined) return undefined;
    const dt = s.split(" ");
    let d = dt[0].split(".");
    let t = dt[1].split(":");
    return new Date(+d[2], d[1] - 1, +d[0], ...t);
}

export default function App() {
    const [data, setData] = useState(undefined);
    const [pos, setPos] = useState(new Location(51.1657, 10.4515));

    const dataFetcher = new FetchService(data, setData);
    const timestamp = data ? cvtToDate(data.Zeitstempel) : undefined;
    console.log(`Timestamp ${cvtToDate(timestamp)}`);

    useEffect(() => {
        requestForegroundPermissionsAsync();
        // set current location
        Geolocation.getCurrentPosition((p) => {
            setPos(new Location(pos.coords.latitude, pos.coords.longitude));
        });

        dataFetcher.start();
        return () => {
            dataFetcher.stop();
        };
    });

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                region={pos}
                showsUserLocation={true}
                followsUserLocation={true}
            >
                {parkingSpaces.features.map((feat, i) => {
                    parkDeck = data?.Parkhaus?.find((p) => {
                        p.Name?.split(" ")[0] == feat.properties.name;
                    });
                    if (parkDeck != undefined) {
                    }
                    return (
                        <Marker
                            key={i}
                            coordinate={new Location(feat.geometry.coordinates)}
                        />
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
