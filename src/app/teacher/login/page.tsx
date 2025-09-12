import { AuthForm } from '@/components/AuthForm';

export default function TeacherLoginPage() {
  return (
    <div className="gradient-bg">
      <AuthForm userType="teacher" />
    </div>
  );
}
