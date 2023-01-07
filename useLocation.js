import { defineTask, unregisterTaskAsync } from "expo-task-manager";
import { useEffect, useState } from "react";
import {
    requestForegroundPermissionsAsync,
    requestBackgroundPermissionsAsync,
    startLocationUpdatesAsync,
    LocationAccuracy,
} from "expo-location";
import { ToastAndroid } from "react-native";

const LOC_UPDATE = "LOC_UPDATE";
let executor = undefined;
defineTask(LOC_UPDATE, (payload) => {
    if (executor) executor(payload);
});

/**
 * Provides a react hook to access the current location of the user
 * requires foreground and background permission to acces location
 * @returns {{accuracy: number, altitude: number, altitudeAccuracy: number, heading: number, latitude: number, longitude: number, speed: number} | undefined} current location of the user
 */
export default function useLocation() {
    const [location, setLocation] = useState(undefined);

    useEffect(() => {
        executor = ({ data: { locations }, error }) => {
            if (error) {
                ToastAndroid.show(
                    "Standort konnte nicht abgerufen werden.",
                    ToastAndroid.SHORT
                );
            } else {
                if (locations != undefined) {
                    setLocation(locations[0].coords);
                }
            }
        };

        requestForegroundPermissionsAsync().then((res) => {
            if (res.granted) {
                requestBackgroundPermissionsAsync().then((res) => {
                    if (res.granted) {
                        startLocationUpdatesAsync(LOC_UPDATE, {
                            accuracy: LocationAccuracy.BestForNavigation,
                        });
                    } else
                        ToastAndroid.show(
                            "Standortberechtigung verweigert.",
                            ToastAndroid.SHORT
                        );
                });
            } else
                ToastAndroid.show(
                    "Standortberechtigung verweigert.",
                    ToastAndroid.SHORT
                );
        });

        return () => {
            executor = undefined;
            unregisterTaskAsync(LOC_UPDATE);
        };
    }, []);

    return location;
}
