
import { AuthForm } from '@/components/AuthForm';

export default function AdminAuthPage() {
  return (
    <div className="gradient-bg">
      <AuthForm userType="admin" />
    </div>
  );
}
