// THESIS: one calm step before your money list, nothing else competes for attention.
// OWN-WORLD: same white canvas and sky-to-lavender light as the summary.

import { SignInButton } from "./sign-in-button";
import { LogoMark } from "./logo";

export function SignInScreen({ failed }: { failed: boolean }) {
  return (
    <div className="screen">
      <div className="aurora" aria-hidden="true" />
      <main className="signin">
        <LogoMark size={72} id="logo-signin" />
        <p className="signin-name">เงินไปไหน</p>
        <h1>รู้ให้ได้ว่าเงินหายไปไหน</h1>
        <p className="signin-lede">เข้าด้วยบัญชี Google แล้วข้อมูลของคุณจะเห็นอยู่คนเดียว</p>
        {failed ? <p className="signin-note" role="alert">เข้าระบบไม่สำเร็จ ลองอีกครั้งนะ</p> : null}
        <SignInButton />
      </main>
    </div>
  );
}
