import axios from 'axios'
import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { saveAuthToken } from '../../store/Auth'
import { Button, Card, Input, Layout } from '../../ui'
import { validateRegisterForm, type ValidationErrors } from '../../utils/validation'
import GenerativeBackground from '../GenerativeBackground'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const RegisterForm = () => {
	const navigate = useNavigate()
	const [userData, setUserData] = useState({
		name: '',
		email: '',
		password: ''
	})
	const [errors, setErrors] = useState<ValidationErrors>({})
	const [serverError, setServerError] = useState<string>('')
	const [isLoading, setIsLoading] = useState(false)

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setUserData(prev => ({ ...prev, [name]: value }))
		if (errors[name]) {
			setErrors(prev => ({ ...prev, [name]: '' }))
		}
		setServerError('')
	}

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setServerError('')
		setIsLoading(true)

		const validationErrors = validateRegisterForm(userData.name, userData.email, userData.password)
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors)
			setIsLoading(false)
			return
		}

		setErrors({})

		try {
			const response = await axios.post(`${API_URL}/auth/register`, {
				name: userData.name,
				email: userData.email,
				password: userData.password,
			})

			const token = response.data?.token
			if (!token) {
				setServerError('Токен не получен от сервера')
				setIsLoading(false)
				return
			}

			saveAuthToken(token)
			navigate('/', { replace: true })
		} catch (error) {
			console.error('Ошибка при регистрации:', error)
			if (axios.isAxiosError(error)) {
				const errorMessage = error.response?.data?.message || 'Ошибка при регистрации'
				// Если ошибка связана с конкретным полем, показываем её в поле
				if (error.response?.data?.field) {
					setErrors({ [error.response.data.field]: errorMessage })
				} else {
					setServerError(errorMessage)
				}
			} else {
				setServerError('Ошибка при регистрации')
			}
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Layout>
			<GenerativeBackground />

			<div className="flex items-center justify-center min-h-screen">
				<Card className="flex flex-col h-fit w-fit gap-6">
					<form onSubmit={handleSubmit} className="flex flex-col gap-6">
						<h2 className='text-2xl text-slate-900/80 font-bold text-center my-8'>Регистрация</h2>

						{serverError && (
							<div className="p-3 rounded-lg bg-red-50 border border-red-200">
								<p className="text-sm text-red-700">{serverError}</p>
							</div>
						)}

						<div className="flex flex-col gap-8 min-w-80">
							<Input
								label="Имя пользователя"
								name='name'
								value={userData.name}
								onChange={handleChange}
								type='text'
								placeholder='Имя пользователя'
								error={errors.name}
								disabled={isLoading}
							/>
							<Input
								label="Email"
								name='email'
								value={userData.email}
								onChange={handleChange}
								type='email'
								placeholder='Email'
								error={errors.email}
								disabled={isLoading}
							/>
							<Input
								label="Пароль"
								name='password'
								value={userData.password}
								onChange={handleChange}
								type='password'
								placeholder='Пароль'
								error={errors.password}
								disabled={isLoading}
							/>
						</div>

						<Button type='submit' className='mt-8' disabled={isLoading}>
							{isLoading ? 'Загрузка...' : 'Зарегистрироваться'}
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
