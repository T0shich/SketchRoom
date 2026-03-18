import AuthButton from '../ui/AuthButton'
import AuthInput from '../ui/AuthInput'
import { Layout } from './Layout'
import axios from 'axios'
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

const RegisterForm = () => {
	const [userData, setUserData] = useState({
		username: '',
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
			const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, userData)
			alert(response.data.message)
		} catch (error) {
			console.error('Error registering user:', error)
		}
	}

	return (
		<Layout>
			<div className="flex items-center justify-center min-h-screen">
				<form onSubmit={handleSubmit} className="flex flex-col h-fit w-fit rounded-2xl bg-white px-13 py-10 gap-6 shadow-lg">
					<h2 className='text-2xl text-slate-900/80 font-bold text-center my-8'>Регистрация</h2>

					<div className="flex flex-col gap-8 min-w-80">
						<AuthInput name='username' value={userData.username} onChange={handleChange} type='text' placeholder='Username' />
						<AuthInput name='email' value={userData.email} onChange={handleChange} type='email' placeholder='Email' />
						<AuthInput name='password' value={userData.password} onChange={handleChange} type='password' placeholder='Password' />
					</div>

					<AuthButton type='submit' className='my-8'>
						Зарегистрироваться
					</AuthButton>
				</form>
			</div>

		</Layout>
	)
}

export default RegisterForm
