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
                // replace relevant unicode chars (caused by fastxml parser)
                for (const datum of d.Daten.Parkhaus) {
                    datum.Name = datum.Name.replace(/&#228;/g, "ä")
                        .replace(/&#252;/g, "ü")
                        .replace(/&#223;/g, "ß");
                }
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
