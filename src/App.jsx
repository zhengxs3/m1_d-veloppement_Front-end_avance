import { Routes, Route, Link } from 'react-router-dom'
import Acceuil from './Acceuil'
import About from './About'
import BookDetail from './BookDetail'

function App() {
  return (
    <>
      <nav>
        <Link to="/"> Accueil </Link>
         | 
        <Link to="/about"> À propos </Link>
      </nav>  

      <Routes>
        <Route path="/" element={<Acceuil />} />
        <Route path="/about" element={<About />} />
        <Route path="/book/:id" element={<BookDetail />} />
      </Routes>
    </>
    
  )
}

export default App
