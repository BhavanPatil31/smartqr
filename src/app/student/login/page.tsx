import { AuthForm } from '@/components/AuthForm';

export default function StudentAuthPage() {
  return (
    <div className="gradient-bg">
      <AuthForm userType="student" />
    </div>
  );
}
