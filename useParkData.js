import { XMLParser } from "fast-xml-parser";
import { decode } from "html-entities";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import Constants from "expo-constants";
import { ToastAndroid } from "react-native";

const parseXML = (xml) => {
    const parser = new XMLParser();
    const obj = parser.parse(xml);
    return obj;
};

/**
 * fetches data about current parking spaces in amberg
 * or retrives the last fetched data from local storage in case no connection is available
 * @returns {{Parkhaus: [{ID, Name, Gesamt, Aktuell, Frei, Trend, Status, Geschlossen}]} | undefined}
 */
export default function useParkData() {
    const [data, setData] = useState(undefined);
    let intervalId = undefined;

    const updateData = () => {
        fetch(Constants.expoConfig.extra.PARKING_DATA_ENDPOINT)
            .then((res) => res.text())
            .then((xml) => {
                d = parseXML(xml);
                // replace relevant unicode chars (caused by fastxml parser)
                for (const datum of d.Daten.Parkhaus) {
                    datum.Name = decode(datum.Name);
                }
                if (d.Daten)
                    AsyncStorage.setItem("Daten", JSON.stringify(d.Daten)).then(
                        () => setData(d.Daten)
                    );
            })
            .catch((e) => {
                ToastAndroid.show(
                    "Parkhausdaten konnten nicht abgerufen werden.",
                    ToastAndroid.SHORT
                );
                ToastAndroid.show(
                    "Zuletzt gespeicherte Daten werden geladen.",
                    ToastAndroid.SHORT
                );
                AsyncStorage.getItem("Daten")
                    .then((dataString) => {
                        // check if data is from today else discard
                        const d = JSON.parse(dataString);
                        const [day, month, year] =
                            d.Zeitstempel.split(" ")[0].split(".");
                        const date = new Date(year, month - 1, day);
                        const now = new Date();
                        if (
                            date.getFullYear() == now.getFullYear &&
                            date.getMonth == now.getMonth &&
                            date.getDate() == now.getDate()
                        ) {
                            setData(d);
                        } else throw "No current data available";
                    })
                    .catch((e) => {
                        ToastAndroid.show(
                            "Keine lokalen Daten verfügbar.",
                            ToastAndroid.SHORT
                        );
                    });
            });
    };

    useEffect(() => {
        updateData();
        intervalId = setInterval(
            updateData,
            Constants.expoConfig.extra.PARKING_DATA_UPDATECYCLE
        );

        return () => {
            clearInterval(this.intervalId);
        };
    }, []);

    return data;
}
