import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter/wght.css'
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource-variable/jetbrains-mono/wght.css'
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>)
