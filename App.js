import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, Text, View, Dimensions } from "react-native";
import MapView from "react-native-maps";
import { requestForegroundPermissionsAsync } from "expo-location";
import FetchService from "./FechtService";

function cvtToDate(s) {
    const dt = s.split(" ");
    let d = dt[0].split(".");
    let t = dt[1].split(":");
    return new Date(+d[2], d[1] - 1, +d[0], ...t);
}

export default function App() {
    console.log("hi");
    const obj = FetchService().then((d) => {
        console.log(d);
        const timestamp = cvtToDate(d.Daten.Zeitstempel);
        // carPark: Aktuell, Frei, Gesamt, Geschlossen, ID, Name, Status, Trend
        const carParks = d.Daten.Parkhaus;
    });
    let location = undefined;

    useEffect(() => {
        requestForegroundPermissionsAsync();
        location = undefined;
    });

    return (
        <View style={styles.container}>
            <MapView style={styles.map} region={location ? {} : undefined} />
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
