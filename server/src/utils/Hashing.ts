import bcrypt from 'bcrypt'

const pepper = process.env.SECRET_PEPPER || 'default_pepper'

export const hashPassword = (password: string): string => {
	const saltRounds = 10
	const saltedPassword = password + pepper
	return bcrypt.hashSync(saltedPassword, saltRounds)
}

export const comparePassword = (password: string, hash: string): boolean => {
	const saltedPassword = password + pepper
	return bcrypt.compareSync(saltedPassword, hash)
}

