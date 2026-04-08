import { useEffect, useRef } from 'react'

const GenerativeBackground = () => {
	const cansvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {

		const canvas = cansvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return
		let animationFrameId: number

		const resizeCanvas = () => {
			canvas.width = window.innerWidth
			canvas.height = window.innerHeight
		}

		const particles = Array.from({ length: 200 }, () => ({ 
			x: Math.random() * canvas.width,
			y: Math.random() * canvas.height,
			vx: 0,
			vy: 0,
			oldX: 0,
			oldY: 0,
			myRandom: Math.random() * 1000
		}))

	
		const getValueAt = (x: number, y: number) => {
			
			const scale = 0.003
			return (Math.sin(x * scale) + Math.cos(y * scale)) * Math.PI * 2
		}

		const render = () => {
			ctx.fillStyle = 'rgba(240, 242, 245, 0.02)' 
			ctx.fillRect(0, 0, canvas.width, canvas.height)

			ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)' 
			ctx.lineWidth = 1
			ctx.lineCap = 'round' 

			particles.forEach(p => {
				p.oldX = p.x
				p.oldY = p.y

				const angle = getValueAt(p.x, p.y)

				const speed = 1.5
				p.vx = Math.cos(angle) * speed 
				p.vy = Math.sin(angle) * speed 

				p.x += p.vx
				p.y += p.vy

				ctx.beginPath()
				ctx.moveTo(p.oldX, p.oldY)
				ctx.lineTo(p.x, p.y)
				ctx.stroke()


				if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
					p.x = Math.random() * canvas.width
					p.y = Math.random() * canvas.height
					p.oldX = p.x 
					p.oldY = p.y
				}
			})

			animationFrameId = requestAnimationFrame(render)
		}

		window.addEventListener('resize', resizeCanvas)
		resizeCanvas()

		render()

		return () => {
			window.removeEventListener('resize', resizeCanvas)
			cancelAnimationFrame(animationFrameId)
		}

	}, [])

	return (
		<canvas ref={cansvasRef} className='pointer-events-none fixed left-0 top-0 -z-10' />
	)
}

export default GenerativeBackground