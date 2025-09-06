import { AuthForm } from '@/components/AuthForm';

export default function TeacherLoginPage() {
  return (
    <div className="gradient-bg-dark">
      <AuthForm userType="teacher" />
    </div>
  );
}
