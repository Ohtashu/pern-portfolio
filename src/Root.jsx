import { useEffect, useState } from 'react';
import Admin from './Admin.jsx';
import App from './App.jsx';

export default function Root() {
    const [isAdminPage, setIsAdminPage] = useState(window.location.hash === '#/admin');

    useEffect(() => {
        function updateRoute() {
            setIsAdminPage(window.location.hash === '#/admin');
        }

        window.addEventListener('hashchange', updateRoute);
        return () => window.removeEventListener('hashchange', updateRoute);
    }, []);

    return isAdminPage ? <Admin /> : <App />;
}