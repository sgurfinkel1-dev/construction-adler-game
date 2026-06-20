import './App.css'
import './site.css'
import Nav from './components/Nav'
import Hero from './components/Hero'
import { Values, Empreendimentos, Historia, GameSection, Contato, Footer } from './components/Sections'

export default function App() {
  return (
    <div className="site">
      <Nav />
      <Hero />
      <Values />
      <Empreendimentos />
      <Historia />
      <GameSection />
      <Contato />
      <Footer />
    </div>
  )
}
