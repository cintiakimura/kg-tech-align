import AdminAuditReport from './pages/AdminAuditReport';
import AdminImportCatalogue from './pages/AdminImportCatalogue';
import Catalogue from './pages/Catalogue';
import ClientDetails from './pages/ClientDetails';
import CreateClientQuote from './pages/CreateClientQuote';
import ImportCatalogue from './pages/ImportCatalogue';
import ManagerDashboard from './pages/ManagerDashboard';
import Onboarding from './pages/Onboarding';
import ProductionControl from './pages/ProductionControl';
import StockControl from './pages/StockControl';
import SupplierDashboard from './pages/SupplierDashboard';
import FinancialAnalysis from './pages/FinancialAnalysis';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAuditReport": AdminAuditReport,
    "AdminImportCatalogue": AdminImportCatalogue,
    "Catalogue": Catalogue,
    "ClientDetails": ClientDetails,
    "CreateClientQuote": CreateClientQuote,
    "ImportCatalogue": ImportCatalogue,
    "ManagerDashboard": ManagerDashboard,
    "Onboarding": Onboarding,
    "ProductionControl": ProductionControl,
    "StockControl": StockControl,
    "SupplierDashboard": SupplierDashboard,
    "FinancialAnalysis": FinancialAnalysis,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};