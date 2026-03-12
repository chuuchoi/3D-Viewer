import './style.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// import typescriptLogo from './typescript.svg'
// import viteLogo from '/vite.svg'
// import { setupCounter } from './counter.ts'
const el = document.getElementById('root')
if(el !== null){

  const root = ReactDOM.createRoot(el);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

