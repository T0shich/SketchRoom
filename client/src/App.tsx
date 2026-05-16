import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import LoginForm from './components/Auth/LoginForm.tsx'
import RegisterForm from './components/Auth/RegisterForm.tsx'
import BoarsPage from './pages/BoardsPage.tsx'
import EditorModePage from './pages/EditorModePage.tsx'
import EditorPage from './pages/EditorPage'
import HomePage from './pages/HomePage.tsx'

function App() {
	return (
		<Routes>
			<Route path='/' element={<HomePage />} />
			<Route path='/login' element={<LoginForm />} />
			<Route path='/register' element={<RegisterForm />} />
			<Route path='/editor' element={<EditorModePage />} />
			<Route path='/canvas' element={<EditorPage />} />
			<Route path='/boards' element={<BoarsPage />} />
			<Route path='*' element={<Navigate to='/' replace />} />
		</Routes>
	)
}

export default App
