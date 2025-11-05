import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Earnings from './pages/Earnings'
import Navbar from './components/Navbar'
import Abc from './pages/Abc'


function App() {

  return (
    <BrowserRouter>
      <div className="bg-[#0d0d0d] min-h-screen"> 

          <Navbar />

          <div className="pl-10px md:pl-[270px]"> {/* push content right but keep bg full */}
            <Routes>
              <Route path = "/Abc" element = { <Abc />}></Route>
              <Route path = "/earnings" element = { <Earnings /> }></Route>
            </Routes>
          </div>
      </div>
    </BrowserRouter>
  )
}

export default App
