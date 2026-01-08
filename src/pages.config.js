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
import Purchases from './pages/Purchases';
import Logistics from './pages/Logistics';
import Clients from './pages/Clients';
import Quotations from './pages/Quotations';
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
    "Purchases": Purchases,
    "Logistics": Logistics,
    "Clients": Clients,
    "Quotations": Quotations,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};