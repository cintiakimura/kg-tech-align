import AdminAuditReport from './pages/AdminAuditReport';
import AdminImportCatalogue from './pages/AdminImportCatalogue';
import Catalogue from './pages/Catalogue';
import ClientDetails from './pages/ClientDetails';
import ClientLogin from './pages/ClientLogin';
import Clients from './pages/Clients';
import CreateClientQuote from './pages/CreateClientQuote';
import FinancialAnalysis from './pages/FinancialAnalysis';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Logistics from './pages/Logistics';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerLogin from './pages/ManagerLogin';
import Onboarding from './pages/Onboarding';
import ProductionControl from './pages/ProductionControl';
import Purchases from './pages/Purchases';
import Quotations from './pages/Quotations';
import StockControl from './pages/StockControl';
import SupplierDashboard from './pages/SupplierDashboard';
import SupplierLogin from './pages/SupplierLogin';
import SupplierQuotations from './pages/SupplierQuotations';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAuditReport": AdminAuditReport,
    "AdminImportCatalogue": AdminImportCatalogue,
    "Catalogue": Catalogue,
    "ClientDetails": ClientDetails,
    "ClientLogin": ClientLogin,
    "Clients": Clients,
    "CreateClientQuote": CreateClientQuote,
    "FinancialAnalysis": FinancialAnalysis,
    "Home": Home,
    "Landing": Landing,
    "Logistics": Logistics,
    "ManagerDashboard": ManagerDashboard,
    "ManagerLogin": ManagerLogin,
    "Onboarding": Onboarding,
    "ProductionControl": ProductionControl,
    "Purchases": Purchases,
    "Quotations": Quotations,
    "StockControl": StockControl,
    "SupplierDashboard": SupplierDashboard,
    "SupplierLogin": SupplierLogin,
    "SupplierQuotations": SupplierQuotations,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};