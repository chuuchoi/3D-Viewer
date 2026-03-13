import React from "react"
import Viewer from "./components/Viewer"
import Viewer2 from "./components/Viewer2"
import Viewer3 from "./components/Viewer3"
import Viewer3copy from "./components/Viewer3 copy"

function App() {
  const [v, setV] = React.useState('viewer')

  return <div style={{width:"100vw", height:"100vh", overflow:"hidden"}}>
    {v === 'viewer' && <Viewer />}
    {v === 'viewer2' && <Viewer2 />}
    {v === 'viewer3' && <Viewer3 />}
    {v === 'viewer3.1' && <Viewer3copy />}
    {v === 'viewer4' && <>
      <Viewer style={{top:"20px", left:"52%", width:"44%",height:"44%",border:"1px solid white"}} />
      <Viewer style={{position:"absolute",top:"50%", width:"50%",height:"50%",border:"1px solid white"}}/>
      <Viewer2 style={{top:"-20%", left:"10%", width:"50%",height:"50%",border:"1px solid white"}}/>
      <Viewer3 style={{position:"absolute", bottom:"1px", right:"1px", width:"50%",height:"50%",border:"1px solid white"}}/>
    </>}
    <div style={{position:'absolute', top:"10px", left:'10px', display:'flex', gap:'8px'}}>
      <div className='scene-btn' style={{
      border:v === 'viewer'? '1px solid yellow':'1px solid gray',
    }}
        onClick={()=>setV('viewer')}
      >Scene 1</div>
      <div className='scene-btn' style={{
      border:v === 'viewer2'? '1px solid yellow':'1px solid gray',
    }}
        onClick={()=>setV('viewer2')}
      >Scene 2</div>
      <div className='scene-btn' style={{
      border:v === 'viewer3'? '1px solid yellow':'1px solid gray',
    }}
        onClick={()=>setV('viewer3')}
      >Scene 3</div>
      <div className='scene-btn' style={{
      border:v === 'viewer3.1'? '1px solid yellow':'1px solid gray',
    }}
        onClick={()=>setV('viewer3.1')}
      >Scene 3.1</div>
      <div className='scene-btn' style={{
      border:v === 'viewer4'? '1px solid yellow':'1px solid gray',
    }}
        onClick={()=>setV('viewer4')}
      >Scene 4</div>
    </div>
  </div>
}

export default App