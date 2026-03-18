import RegisterForm from '../components/RegisterForm'
import LoginForm from '../components/LoginForm'
import { useLocation } from 'react-router-dom';
const AuthPage = () => {
	const location = useLocation();
	const isLogin = location.pathname === '/login';
	return (
		<div>
			{isLogin ? <LoginForm /> : <RegisterForm />}
		</div>
	)
}

export default AuthPage
