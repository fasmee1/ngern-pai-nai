import { IconLogout } from "./icons";

// Plain form post, so signing out works without JavaScript.
export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post" className="signout">
      <button type="submit" className="ghost wide icon-button">
        <IconLogout size={18} />
        ออกจากระบบ
      </button>
    </form>
  );
}
