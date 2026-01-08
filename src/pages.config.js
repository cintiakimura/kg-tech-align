import AdminAuditReport from './pages/AdminAuditReport';
import AdminImportCatalogue from './pages/AdminImportCatalogue';
import Catalogue from './pages/Catalogue';
import ClientDetails from './pages/ClientDetails';
import Clients from './pages/Clients';
import CreateClientQuote from './pages/CreateClientQuote';
import FinancialAnalysis from './pages/FinancialAnalysis';
import Logistics from './pages/Logistics';
import ManagerDashboard from './pages/ManagerDashboard';
import Onboarding from './pages/Onboarding';
import ProductionControl from './pages/ProductionControl';
import Purchases from './pages/Purchases';
import Quotations from './pages/Quotations';
import StockControl from './pages/StockControl';
import SupplierDashboard from './pages/SupplierDashboard';
import SupplierQuotations from './pages/SupplierQuotations';
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
    "ManagerDashboard": ManagerDashboard,
    "Onboarding": Onboarding,
    "ProductionControl": ProductionControl,
    "Purchases": Purchases,
    "Quotations": Quotations,
    "StockControl": StockControl,
    "SupplierDashboard": SupplierDashboard,
    "SupplierQuotations": SupplierQuotations,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};