import { SignIn } from "@clerk/nextjs";
import { authAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-900 px-4 py-12">
      <div className="mb-8 text-center">
        <p className="text-2xl font-bold tracking-tight text-white">
          Excavation<span className="text-brand-500">OS</span>
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Sign in to your operations dashboard
        </p>
      </div>
      <SignIn appearance={authAppearance} />
    </main>
  );
}
