import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import FetchService from "./fetchservice";

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
    return (
        <View style={styles.container}>
            <Text>Open up App.js to start working on your app!</Text>
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
});
