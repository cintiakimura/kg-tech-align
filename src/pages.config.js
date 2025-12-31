import AdminImportCatalogue from './pages/AdminImportCatalogue';
import Catalogue from './pages/Catalogue';
import ClientDetails from './pages/ClientDetails';
import Home from './pages/Home';
import ImportCatalogue from './pages/ImportCatalogue';
import ManagerDashboard from './pages/ManagerDashboard';
import Onboarding from './pages/Onboarding';
import SupplierDashboard from './pages/SupplierDashboard';
import AdminAuditReport from './pages/AdminAuditReport';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminImportCatalogue": AdminImportCatalogue,
    "Catalogue": Catalogue,
    "ClientDetails": ClientDetails,
    "Home": Home,
    "ImportCatalogue": ImportCatalogue,
    "ManagerDashboard": ManagerDashboard,
    "Onboarding": Onboarding,
    "SupplierDashboard": SupplierDashboard,
    "AdminAuditReport": AdminAuditReport,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};