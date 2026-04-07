import axios from 'axios'
import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { saveAuthToken } from '../../store/Auth'
import { Button, Card, Input, Layout } from '../../ui'
import GenerativeBackground from '../GenerativeBackground'

const API_URL = import.meta.env.API_URL || 'http://localhost:3000'

const RegisterForm = () => {
	const navigate = useNavigate()
	const [userData, setUserData] = useState({
		name: '',
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
			const response = await axios.post(`${API_URL}/auth/register`, {
				name: userData.name,
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
			console.error('Ошибка при регистрации:', error)
			if (axios.isAxiosError(error)) {
				alert(error.response?.data?.message || 'Ошибка при регистрации')
				return
			}
			alert('Ошибка при регистрации')
		}
	}

	return (
		<Layout>
			<GenerativeBackground />

			<div className="flex items-center justify-center min-h-screen">
				<Card className="flex flex-col h-fit w-fit gap-6">
					<form onSubmit={handleSubmit} className="flex flex-col gap-6">
						<h2 className='text-2xl text-slate-900/80 font-bold text-center my-8'>Регистрация</h2>

						<div className="flex flex-col gap-8 min-w-80">
							<Input
								label="Имя пользователя"
								name='name'
								value={userData.name}
								onChange={handleChange}
								type='text'
								placeholder='Имя пользователя'
							/>
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

						<Button type='submit' className='mt-8'>
							Зарегистрироваться
						</Button>
						<span className='text-center text-slate-600/70'>
							Уже есть аккаунт? <Link to='/login' className='text-blue-500/80 hover:underline'>Войти</Link>
						</span>
					</form>
				</Card>
			</div>
		</Layout>
	)
}

export default RegisterForm
