export interface ValidationErrors {
	[key: string]: string
}

export const validateEmail = (email: string): string | null => {
	if (!email.trim()) {
		return 'Email обязателен'
	}
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	if (!emailRegex.test(email)) {
		return 'Введите корректный email'
	}
	return null
}

export const validatePassword = (password: string): string | null => {
	if (!password) {
		return 'Пароль обязателен'
	}
	if (password.length < 6) {
		return 'Пароль должен содержать минимум 6 символов'
	}
	return null
}

export const validateName = (name: string): string | null => {
	if (!name.trim()) {
		return 'Имя пользователя обязательно'
	}
	if (name.trim().length < 2) {
		return 'Имя должно содержать минимум 2 символа'
	}
	if (name.trim().length > 50) {
		return 'Имя не должно превышать 50 символов'
	}
	return null
}

export const validateLoginForm = (
	email: string,
	password: string,
): ValidationErrors => {
	const errors: ValidationErrors = {}

	const emailError = validateEmail(email)
	if (emailError) errors.email = emailError

	const passwordError = validatePassword(password)
	if (passwordError) errors.password = passwordError

	return errors
}

export const validateRegisterForm = (
	name: string,
	email: string,
	password: string,
): ValidationErrors => {
	const errors: ValidationErrors = {}

	const nameError = validateName(name)
	if (nameError) errors.name = nameError

	const emailError = validateEmail(email)
	if (emailError) errors.email = emailError

	const passwordError = validatePassword(password)
	if (passwordError) errors.password = passwordError

	return errors
}
