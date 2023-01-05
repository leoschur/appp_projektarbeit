import { defineTask, unregisterTaskAsync } from "expo-task-manager";
import { useEffect, useState } from "react";
import {
    requestForegroundPermissionsAsync,
    requestBackgroundPermissionsAsync,
    startLocationUpdatesAsync,
    LocationAccuracy,
} from "expo-location";

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
                console.error(error);
            } else {
                if (locations != undefined) {
                    setLocation(locations[0].coords);
                }
            }
        };

        requestForegroundPermissionsAsync()
            .then(() => {
                requestBackgroundPermissionsAsync().then(() => {
                    startLocationUpdatesAsync(LOC_UPDATE, {
                        accuracy: LocationAccuracy.BestForNavigation,
                    });
                });
            })
            .catch((e) => console.error("Permission denied!\n", e));

        return () => {
            executor = undefined;
            unregisterTaskAsync(LOC_UPDATE);
        };
    }, []);

    return location;
}
