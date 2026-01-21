import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Catalogue from './pages/Catalogue';
import SupplierPortal from './pages/SupplierPortal';
import ManagerDashboard from './pages/ManagerDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Onboarding": Onboarding,
    "Catalogue": Catalogue,
    "SupplierPortal": SupplierPortal,
    "ManagerDashboard": ManagerDashboard,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};