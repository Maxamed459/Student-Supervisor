import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AdminLayout({ children, title }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <Topbar title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}