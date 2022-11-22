import { XMLParser } from "fast-xml-parser";
import AsyncStorage from "@react-native-async-storage/async-storage";

const xml = `<Daten>
<Zeitstempel>22.11.2022 20:01:00</Zeitstempel>
<Parkhaus>
    <ID>1</ID>
    <Name>Kurfürstengarage</Name>
    <Gesamt>179</Gesamt>
    <Aktuell>51</Aktuell>
    <Frei>128</Frei>
    <Trend>-1</Trend>
    <Status>OK</Status>
    <Geschlossen>0</Geschlossen>
</Parkhaus>
<Parkhaus>
    <ID>2</ID>
    <Name>Theatergarage</Name>
    <Gesamt>105</Gesamt>
    <Aktuell>54</Aktuell>
    <Frei>51</Frei>
    <Trend>0</Trend>
    <Status>OK</Status>
    <Geschlossen>0</Geschlossen>
</Parkhaus>
<Parkhaus>
    <ID>3</ID>
    <Name>Kräuterwiese</Name>
    <Gesamt>240</Gesamt>
    <Aktuell>50</Aktuell>
    <Frei>190</Frei>
    <Trend>0</Trend>
    <Status>OK</Status>
    <Geschlossen>0</Geschlossen>
</Parkhaus>
<Parkhaus>
    <ID>4</ID>
    <Name>Am Ziegeltor</Name>
    <Gesamt>200</Gesamt>
    <Aktuell>58</Aktuell>
    <Frei>142</Frei>
    <Trend>0</Trend>
    <Status>OK</Status>
    <Geschlossen>0</Geschlossen>
</Parkhaus>
<Parkhaus>
    <ID>5</ID>
    <Name>Kurfürstenbad</Name>
    <Gesamt>40</Gesamt>
    <Aktuell>32</Aktuell>
    <Frei>8</Frei>
    <Trend>0</Trend>
    <Status>OK</Status>
    <Geschlossen>0</Geschlossen>
</Parkhaus>
<Parkhaus>
    <ID>6</ID>
    <Name>Kino</Name>
    <Gesamt>99</Gesamt>
    <Aktuell>62</Aktuell>
    <Frei>37</Frei>
    <Trend>-1</Trend>
    <Status>OK</Status>
    <Geschlossen>0</Geschlossen>
</Parkhaus>
<Parkhaus>
    <ID>7</ID>
    <Name>ACC</Name>
    <Gesamt>271</Gesamt>
    <Aktuell>44</Aktuell>
    <Frei>227</Frei>
    <Trend>0</Trend>
    <Status>OK</Status>
    <Geschlossen>0</Geschlossen>
</Parkhaus>
<Parkhaus>
    <ID>8</ID>
    <Name>Altstadtgarage</Name>
    <Gesamt>135</Gesamt>
    <Aktuell>35</Aktuell>
    <Frei>100</Frei>
    <Trend>-1</Trend>
    <Status>OK</Status>
    <Geschlossen>0</Geschlossen>
</Parkhaus>
<Parkhaus>
    <ID>9</ID>
    <Name>Marienstraße</Name>
    <Gesamt>860</Gesamt>
    <Aktuell>98</Aktuell>
    <Frei>762</Frei>
    <Trend>0</Trend>
    <Status>OK</Status>
    <Geschlossen>0</Geschlossen>
</Parkhaus>
</Daten>`;

const parseXML = (xml) => {
    const parser = new XMLParser();
    const obj = parser.parse(xml);
    return obj;
};

export default function FetchService() {
    return new Promise((res, rej) => {
        const url =
            "https://parken.amberg.de:443/wp-content/uploads/pls/pls.xml";
        /*
        fetch(url)
            .then((res) => res.text())
            .then((xml) => res(parseXML(xml)))
            .catch((e) => {
                console.log(e);
                rej(e);
            });*/

        // retrieve new date
        // setTimeout(() => res(parseXML(xml)), 0);
        let data = res(parseXML(xml));
        // if successful write to storage then resolve
        AsyncStorage.setItem("Daten", JSON.stringify(data.Daten))
            .catch((e) => console.log(e))
            .finally(() => res(data.Daten));
        // else try read from storage
        AsyncStorage.getItem("Daten")
            .then((d) => {
                res(JSON.parse(d));
            })
            .catch((e) => rej(e));
        // if nothing reject
    });
}
