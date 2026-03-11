import React from "react"
import Viewer from "./components/Viewer"
import Viewer2 from "./components/Viewer copy"

function App() {
  const [v, setV] = React.useState('viewer')
  const handleClick = () => {
    if(v === 'viewer')
      setV('viewer2')
    else
      setV('viewer')
  }
  return <div style={{width:"100vw", height:"100vh", overflow:"hidden"}}>
    {v === 'viewer' && <Viewer />}
    {v === 'viewer2' && <Viewer2 />}
    <div style={{cursor:"pointer",position:'absolute', top:"10px", left:'10px',
    background:"rgba(222,0,0,0.3)", width:"100px", height:"50px"}}
      onClick={handleClick}
    >
      change viewer
    </div>
  </div>
}

export default App