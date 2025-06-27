import { useEffect, useState } from 'react';
function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);
        const handleChange = (event) => {
            setMatches(event.matches);
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, [query]);
    return matches;
}
export default useMediaQuery;
