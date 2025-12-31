import ClientDetails from './pages/ClientDetails';
import Home from './pages/Home';
import ManagerDashboard from './pages/ManagerDashboard';
import Onboarding from './pages/Onboarding';
import SupplierDashboard from './pages/SupplierDashboard';
import ImportCatalogue from './pages/ImportCatalogue';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ClientDetails": ClientDetails,
    "Home": Home,
    "ManagerDashboard": ManagerDashboard,
    "Onboarding": Onboarding,
    "SupplierDashboard": SupplierDashboard,
    "ImportCatalogue": ImportCatalogue,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};