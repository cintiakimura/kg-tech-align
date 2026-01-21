import AdminAuditReport from './pages/AdminAuditReport';
import Catalogue from './pages/Catalogue';
import ClientDashboard from './pages/ClientDashboard';
import Home from './pages/Home';
import ManagerDashboard from './pages/ManagerDashboard';
import Onboarding from './pages/Onboarding';
import SupplierDashboard from './pages/SupplierDashboard';
import SupplierPortal from './pages/SupplierPortal';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAuditReport": AdminAuditReport,
    "Catalogue": Catalogue,
    "ClientDashboard": ClientDashboard,
    "Home": Home,
    "ManagerDashboard": ManagerDashboard,
    "Onboarding": Onboarding,
    "SupplierDashboard": SupplierDashboard,
    "SupplierPortal": SupplierPortal,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};