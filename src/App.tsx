import React from "react"
import Viewer from "./components/Viewer"
import Viewer2 from "./components/Viewer2"
import Viewer3 from "./components/Viewer3"

function App() {
  const [v, setV] = React.useState('viewer')
  const handleClick = () => {
    if(v === 'viewer')
      setV('viewer2')
    else if(v === 'viewer2')
      setV('viewer3')
    else
      setV('viewer')
  }
  return <div style={{width:"100vw", height:"100vh", overflow:"hidden"}}>
    {v === 'viewer' && <Viewer />}
    {v === 'viewer2' && <Viewer2 />}
    {v === 'viewer3' && <Viewer3 />}
    <div style={{cursor:"pointer",position:'absolute', top:"10px", left:'10px', padding:'10px 32px',
    background:"rgba(222,0,0,0.3)", borderRadius:"4px", border:'1px solid yellow', textAlign:"center", width:"100px", height:"50px"}}
      onClick={handleClick}
    >
      change {v}
    </div>
  </div>
}

export default App