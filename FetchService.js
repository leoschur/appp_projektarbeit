import { XMLParser, XMLValidator } from "fast-xml-parser";
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
                console.log(d.Daten.Parkhaus);
                // FIXME
                for (const datum of d.Daten.Parkhaus) {
                    datum.Name = datum.Name.replaceAll(/&#228;/, "ä")
                        .replaceAll(/&#252;/, "ü")
                        .replaceAll(/&#223;/, "ß");
                    console.log(datum.Name);
                }
                // TODO error handling
                if (d.Daten)
                    AsyncStorage.setItem("Daten", JSON.stringify(d.Daten))
                        .then(setData(d.Daten))
                        .catch((e) => console.error(e));
            })
            .catch((e) => {
                AsyncStorage.getItem("Daten")
                    .then((d) => {
                        setData(JSON.parse(d));
                    })
                    .catch((e) => {
                        // TODO error handling
                        console.error(e);
                    });
            });
    };

    this.start = function () {
        this.update();
        this.intervalId = setInterval(this.update, this.updateCycle);
    };

    this.stop = function () {
        clearInterval(this.intervalId);
    };
}
