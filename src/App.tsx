import { useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router'
import Lenis from '@studio-freight/lenis'
import HomePage from './pages/HomePage'
import PoseAnalysisPage from './pages/PoseAnalysisPage'
import TrainingArchivePage from './pages/TrainingArchivePage'

function App() {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef.current = lenis

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pose-analysis" element={<PoseAnalysisPage />} />
      <Route path="/training-archive" element={<TrainingArchivePage />} />
    </Routes>
  )
}

export default App
