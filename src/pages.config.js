import Onboarding from './pages/Onboarding';
import ManagerDashboard from './pages/ManagerDashboard';
import ClientDetails from './pages/ClientDetails';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Onboarding": Onboarding,
    "ManagerDashboard": ManagerDashboard,
    "ClientDetails": ClientDetails,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};