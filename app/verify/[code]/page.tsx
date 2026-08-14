import { VerificationClient } from "./VerificationClient";

// This mirrors your existing app/verify/[verificationCode]/ route —
// rename the folder to match if you keep the longer param name, or
// swap this in directly if you're consolidating naming.
export default function VerifyPage({ params }: { params: { code: string } }) {
  return <VerificationClient code={params.code} />;
}
