// src/layouts/AdminLayout.jsx
// Thin wrapper that mounts the shared Layout shell with the ADMIN role nav.
// RoleGuard protection is applied at the router level — this file is layout only.
import Layout from '../components/layout/Layout';

const AdminLayout = () => <Layout role="ADMIN" />;

export default AdminLayout;
