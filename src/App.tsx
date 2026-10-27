import { ApproximationLab } from './components/ApproximationLab'
import { BinomialLab } from './components/BinomialLab'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { Nav } from './components/Nav'
import { PoissonLab } from './components/PoissonLab'
import { ScrollProgress } from './components/ScrollProgress'

function App() {
  return (
    <div className="site-shell">
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <BinomialLab />
        <PoissonLab />
        <ApproximationLab />
      </main>
      <Footer />
    </div>
  )
}

export default App
