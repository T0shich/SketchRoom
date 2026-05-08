export const env = {
	PORT: process.env.PORT || '3000',
	DATABASE_URL: process.env.DATABASE_URL || '',
	JWT_SECRET: process.env.JWT_SECRET || '',
	SECRET_PEPPER: process.env.SECRET_PEPPER || 'default_pepper',
	NODE_ENV: process.env.NODE_ENV || 'development',
}
