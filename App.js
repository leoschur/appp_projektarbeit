import { StatusBar } from "expo-status-bar";
import { useEffect, useState, componentDidMount } from "react";
import { StyleSheet, Text, View, Dimensions } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { requestForegroundPermissionsAsync } from "expo-location";
import FetchService from "./FetchService";
import * as Location from "expo-location";
import Position from "./Position";
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
    const [region, setRegion] = useState();
    const [pos, setPos] = useState();

    const dataFetcher = new FetchService(data, setData);

    useEffect(() => {
        requestForegroundPermissionsAsync();
        Location.getCurrentPositionAsync().then((p) =>
            setRegion({
                latitude: p.coords.latitude,
                longitude: p.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.02,
            })
        );

        // set current Position
        dataFetcher.start();

        return () => {
            dataFetcher.stop();
        };
    }, []);

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                // region={region}
                showsUserLocation={true}
                followsUserLocation={true}
                initialRegion={region}
            >
                {parkingSpaces.features.map((feat, i) => {
                    // console.log(data?.Parkhaus?.map((p) => p.Name));
                    const parkDeck = data?.Parkhaus?.find((p) => {
                        p.Name == feat.properties.name;
                    });
                    if (parkDeck != undefined) {
                        // console.log(parkDeck);
                    }
                    return (
                        <Marker
                            key={i}
                            coordinate={
                                new Position(
                                    feat.geometry.coordinates[1],
                                    feat.geometry.coordinates[0]
                                )
                            }
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
