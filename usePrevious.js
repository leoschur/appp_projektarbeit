import { useRef, useEffect } from "react";

/**
 * Stores previous value to a react state
 * @see https://blog.logrocket.com/accessing-previous-props-state-react-hooks/
 * @param {any} value
 * @returns {any} previous value
 */
function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
}
export default usePrevious;
