import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

/**
 * provides access to async storage via react state
 * @param {string} key
 * @param {any} initialState
 * @returns {[any, (value: any) => void]} value and setter
 */
export default function useAsyncStorage(key, initialState) {
    const [value, setValue] = useState(initialState);

    useEffect(() => {
        AsyncStorage.getItem(key).then((v) => {
            if (v) setValue(JSON.parse(v));
        });
    }, []);

    return [
        value,
        (v) => {
            setValue(v);
            AsyncStorage.setItem(key, JSON.stringify(v));
        },
    ];
}
