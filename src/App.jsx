// import HomeCompare from "./pages/HomeCompare.jsx";
import Groceries from "./pages/Groceries.jsx";
import LocalServices from "./pages/LocalServices.jsx";
import Consultancy from "./pages/Consultancy.jsx";
import PetServices from "./pages/PetServices.jsx";
// frontend/src/App.jsx

import React from "react";
import axios from "axios";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import { AdminAuthProvider } from "./context/AdminAuthContext";
import { CrackerCartProvider } from "./context/CrackerCartContext";

/* LAYOUT */
import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppFloating from "./components/WhatsAppFloating";

/* USER PAGES */
import Home from "./pages/Home.jsx";
import Crackers from "./pages/Crackers.jsx";
import Flowers from "./pages/Flowers.jsx";
import ProductBrowser from "./pages/ProductBrowser.jsx";
import ProductDetail from "./pages/ProductDetail/ProductDetail.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutReview from "./pages/CheckoutReview.jsx";
import OrderSuccess from "./pages/OrderSuccess/OrderSuccess.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import PaymentSubmitted from "./pages/PaymentSubmitted.jsx";
import Login from "./pages/Login.jsx";
import CustomerVerify from "./pages/CustomerVerify.jsx";
import AddressPage from "./pages/AddressPage.jsx";
import AddressManagerPage from "./pages/AddressManagerPage.jsx";
import ProfileEditPage from "./pages/ProfileEditPage.jsx";
import SavedSuppliersPage from "./pages/SavedSuppliersPage.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import MyOrdersPage from "./pages/MyOrdersPage.jsx";
import OrderDetailPage from "./pages/OrderDetailPage.jsx";
import SelectAddressPage from "./pages/SelectAddressPage.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import TermsOfService from "./pages/TermsOfService.jsx";

/* SUPPLIER PAGES */
import SupplierLogin from "./pages/SupplierLogin.jsx";
import SupplierRegister from "./pages/SupplierRegister.jsx";
import SupplierDashboard from "./pages/SupplierDashboard/SupplierDashboard.jsx";
import SupplierOrders from "./pages/SupplierOrders/SupplierOrders.jsx";
import SupplierOrderDetail from "./pages/SupplierOrderDetail/SupplierOrderDetail.jsx";
import SupplierProducts from "./pages/SupplierProducts/SupplierProducts.jsx";
import AddProduct from "./pages/SupplierProducts/AddProduct.jsx";
import EditProduct from "./pages/SupplierProducts/EditProduct.jsx";

/* ADMIN CORE */
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import RequireAdmin from "./components/auth/RequireAdmin.jsx";

import AdminSuppliersList from "./pages/admin/suppliers/AdminSuppliersList.jsx";
import AdminSupplierDetail from "./pages/admin/suppliers/AdminSupplierDetail.jsx";
import AdminAdsList from "./pages/admin/ads/AdminAdsList.jsx";
import AdminAdForm from "./pages/admin/ads/AdminAdForm.jsx";
import AnalyticsPage from "./pages/admin/AnalyticsPage.jsx";
import AdminProductsList from "./pages/admin/products/AdminProductsList.jsx";
import AdminProductForm from "./pages/admin/products/AdminProductForm.jsx";
import AdminBulkUpload from "./pages/admin/products/AdminBulkUpload.jsx";
import ProductTranslator from "./pages/admin/ProductTranslator.jsx";
import AdminOrdersList from "./pages/admin/orders/AdminOrdersList.jsx";
import AdminOrderDetail from "./pages/admin/orders/AdminOrderDetail.jsx";
import AdminCategoriesList from "./pages/admin/categories/AdminCategoriesList.jsx";
import AdminCategoryForm from "./pages/admin/categories/AdminCategoryForm.jsx";
import AdminVarietiesList from "./pages/admin/varieties/AdminVarietiesList.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";
import VendorKycApproval from "./pages/admin/VendorKycApproval.jsx";
import AdminKycApproval from "./pages/admin/AdminKycApproval.jsx";
import CmsManager from "./pages/admin/CmsManager.jsx";

/* WRAPPER */
function AppWrapper() {
  const location = useLocation();
  const hideLayout = location.pathname.startsWith("/admin");

  return (
    <>
      {!hideLayout && <Header />}

      <div style={{ minHeight: "80vh" }}>
        <Routes>
          {/* USER */}
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<ProductBrowser />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/saved-suppliers" element={<SavedSuppliersPage />} />
          <Route path="/checkout/select-address" element={<SelectAddressPage />} />

          {/* SPECIAL */}
          <Route path="/crackers" element={<Crackers />} />
          {/* <Route path="/home-compare" element={<HomeCompare />} /> */}
          <Route path="/groceries" element={<Groceries />} />
          <Route path="/flowers" element={<Flowers />} />
          <Route path="/localservices" element={<LocalServices />} />
          <Route path="/consultancy" element={<Consultancy />} />
          <Route path="/petservices" element={<PetServices />} />

          {/* AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<CustomerVerify />} />

          {/* PROFILE */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<ProfileEditPage />} />

          {/* ADDRESS */}
          <Route path="/address" element={<AddressPage />} />
          <Route path="/address/manage" element={<AddressManagerPage />} />

          {/* ORDERS */}
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/my-orders/:id" element={<OrderDetailPage />} />

          {/* CART */}
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutReview />} />
          <Route path="/order-success/:orderId" element={<OrderSuccess />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment-success" element={<PaymentSubmitted />} />

          {/* LEGAL */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          {/* SUPPLIER */}
          <Route path="/supplier/login" element={<SupplierLogin />} />
          <Route path="/supplier/register" element={<SupplierRegister />} />
          <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
          <Route path="/supplier/orders" element={<SupplierOrders />} />
          <Route path="/supplier/orders/:orderId" element={<SupplierOrderDetail />} />
          <Route path="/supplier/products" element={<SupplierProducts />} />
          <Route path="/supplier/products/add" element={<AddProduct />} />
          <Route path="/supplier/products/:productId/edit" element={<EditProduct />} />

          {/* ADMIN */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="cms" element={<CmsManager />} />
              <Route path="suppliers" element={<AdminSuppliersList />} />
              <Route path="suppliers/:id" element={<AdminSupplierDetail />} />
              <Route path="ads" element={<AdminAdsList />} />
              <Route path="ads/new" element={<AdminAdForm mode="create" />} />
              <Route path="ads/:id/edit" element={<AdminAdForm mode="edit" />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="products" element={<AdminProductsList />} />
              <Route path="products/new" element={<AdminProductForm mode="create" />} />
              <Route path="products/bulk" element={<AdminBulkUpload />} />
              <Route path="products/:id/edit" element={<AdminProductForm mode="edit" />} />
              <Route path="translator" element={<ProductTranslator />} />
              <Route path="orders" element={<AdminOrdersList />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />
              <Route path="categories" element={<AdminCategoriesList />} />
              <Route path="categories/new" element={<AdminCategoryForm />} />
              <Route path="categories/:id/edit" element={<AdminCategoryForm />} />
              <Route path="varieties" element={<AdminVarietiesList />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="vendors/kyc" element={<VendorKycApproval />} />
              <Route path="kyc-approval" element={<AdminKycApproval />} />
            </Route>
          </Route>
        </Routes>
      </div>

      {!hideLayout && <WhatsAppFloating />}
      {!hideLayout && <Footer />}
    </>
  );
}

/* MAIN */
export default function App() {
  axios.defaults.withCredentials = true;
  return (
    <AdminAuthProvider>
      <CrackerCartProvider>
        <AppWrapper />
      </CrackerCartProvider>
    </AdminAuthProvider>
  );
}
