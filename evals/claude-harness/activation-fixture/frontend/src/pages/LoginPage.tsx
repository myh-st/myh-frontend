export default function LoginPage() {
  return (<form method="post" action="/auth/login"><img src="/logo.png" /><input name="username" placeholder="user" /><input name="password" type="password" placeholder="pass" /><div onClick={() => (location.href = '/auth/sso/start')}>SSO</div><button>Go</button></form>);
}
