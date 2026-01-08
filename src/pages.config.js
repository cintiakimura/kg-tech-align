import AdminAuditReport from './pages/AdminAuditReport';
import AdminImportCatalogue from './pages/AdminImportCatalogue';
import Catalogue from './pages/Catalogue';
import ClientDetails from './pages/ClientDetails';
import Clients from './pages/Clients';
import CreateClientQuote from './pages/CreateClientQuote';
import FinancialAnalysis from './pages/FinancialAnalysis';
import Logistics from './pages/Logistics';
import Onboarding from './pages/Onboarding';
import Purchases from './pages/Purchases';
import StockControl from './pages/StockControl';
import SupplierDashboard from './pages/SupplierDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import ProductionControl from './pages/ProductionControl';
import Quotations from './pages/Quotations';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAuditReport": AdminAuditReport,
    "AdminImportCatalogue": AdminImportCatalogue,
    "Catalogue": Catalogue,
    "ClientDetails": ClientDetails,
    "Clients": Clients,
    "CreateClientQuote": CreateClientQuote,
    "FinancialAnalysis": FinancialAnalysis,
    "Logistics": Logistics,
    "Onboarding": Onboarding,
    "Purchases": Purchases,
    "StockControl": StockControl,
    "SupplierDashboard": SupplierDashboard,
    "ManagerDashboard": ManagerDashboard,
    "ProductionControl": ProductionControl,
    "Quotations": Quotations,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};