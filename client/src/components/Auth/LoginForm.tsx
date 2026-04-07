import axios from 'axios'
import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { saveAuthToken } from '../../store/Auth'
import { Button, Card, Input, Layout } from '../../ui'
import GenerativeBackground from '../GenerativeBackground'

const API_URL = import.meta.env.API_URL || 'http://localhost:3000'

const LoginForm = () => {
	const navigate = useNavigate()
	const [userData, setUserData] = useState({
		email: '',
		password: ''
	})

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setUserData(prev => ({ ...prev, [name]: value }))
	}

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		try {
			const response = await axios.post(`${API_URL}/auth/login`, {
				email: userData.email,
				password: userData.password,
			})

			const token = response.data?.token
			if (!token) {
				alert('Токен не получен от сервера')
				return
			}

			saveAuthToken(token)
			navigate('/', { replace: true })
		} catch (error) {
			console.error('Ошибка при входе:', error)
			if (axios.isAxiosError(error)) {
				alert(error.response?.data?.message || 'Ошибка при входе')
				return
			}
			alert('Ошибка при входе')
		}
	}

	return (
		<Layout>
			<GenerativeBackground />

			<div className="flex items-center justify-center min-h-screen">
				<Card className="flex flex-col h-fit w-fit gap-6">
					<form onSubmit={handleSubmit} className="flex flex-col gap-6">
						<h2 className='text-2xl text-slate-900/80 font-bold text-center my-8'>Вход в систему</h2>

						<div className="flex flex-col gap-7 min-w-80">
							<Input
								label="Email"
								name='email'
								value={userData.email}
								onChange={handleChange}
								type='email'
								placeholder='Email'
							/>
							<Input
								label="Пароль"
								name='password'
								value={userData.password}
								onChange={handleChange}
								type='password'
								placeholder='Пароль'
							/>
						</div>

						<Button type='submit' className='mt-6'>
							Войти
						</Button>
						<span className='text-center text-slate-600/70'>
							Нет аккаунта? <Link to='/register' className='text-blue-500/80 hover:underline'>Зарегистрироваться</Link>
						</span>
					</form>
				</Card>
			</div>
		</Layout>
	)
}

export default LoginForm
