import { XMLParser } from "fast-xml-parser";
import { decode } from "html-entities";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import Constants from "expo-constants";

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
                    AsyncStorage.setItem("Daten", JSON.stringify(d.Daten))
                        .then(setData(d.Daten))
                        .catch((e) => console.error(e));
            })
            .catch((e) => {
                console.warn("Data could not be feched\n", e);
                AsyncStorage.getItem("Daten")
                    .then((d) => {
                        // TODO check if Date is from today
                        setData(JSON.parse(d));
                    })
                    .catch((e) => {
                        // TODO error handling
                        console.error("No Data availabe\n", e);
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
