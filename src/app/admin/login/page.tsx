
import { AuthForm } from '@/components/AuthForm';

export default function AdminAuthPage() {
  return (
    <div className="gradient-bg-dark">
      <AuthForm userType="admin" />
    </div>
  );
}
