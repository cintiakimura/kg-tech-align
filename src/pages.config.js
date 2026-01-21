import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Catalogue from './pages/Catalogue';
import SupplierPortal from './pages/SupplierPortal';
import ManagerDashboard from './pages/ManagerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import AdminAuditReport from './pages/AdminAuditReport';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Onboarding": Onboarding,
    "Catalogue": Catalogue,
    "SupplierPortal": SupplierPortal,
    "ManagerDashboard": ManagerDashboard,
    "ClientDashboard": ClientDashboard,
    "SupplierDashboard": SupplierDashboard,
    "AdminAuditReport": AdminAuditReport,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};