import { XMLParser } from "fast-xml-parser";
import AsyncStorage from "@react-native-async-storage/async-storage";

const url = "https://parken.amberg.de:443/wp-content/uploads/pls/pls.xml";

const parseXML = (xml) => {
    const parser = new XMLParser();
    const obj = parser.parse(xml);
    return obj;
};

export default function FetchService(data, setData) {
    this.updateCycle = 10000; //60000; // in ms
    this.intervalId = undefined;

    this.update = function () {
        fetch(url)
            .then((res) => res.text())
            .then((xml) => {
                d = parseXML(xml);
                // TODO error handling
                if (d.Daten)
                    AsyncStorage.setItem("Daten", JSON.stringify(d.Daten))
                        .then(setData(d.Daten))
                        .catch((e) => console.log(e));
            })
            .catch((e) => {
                AsyncStorage.getItem("Daten")
                    .then((d) => {
                        setData(JSON.parse(d));
                    })
                    .catch((e) => {
                        // TODO error handling
                        console.log(e);
                    });
            });
    };

    this.start = function () {
        this.intervalId = setInterval(this.update, this.updateCycle);
    };

    this.stop = function () {
        clearInterval(this.intervalId);
    };
}
