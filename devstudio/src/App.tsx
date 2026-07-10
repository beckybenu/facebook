import { useEffect, useState } from 'react'
import Selector from './variants/Selector'
import Nova from './variants/Nova'
import NeoTokyo from './variants/NeoTokyo'
import Aurora from './variants/Aurora'
import MatrixTerm from './variants/MatrixTerm'
import Singularite from './variants/Singularite'

const getRoute = () => window.location.hash.replace(/^#\/?/, '')

export default function App() {
  const [route, setRoute] = useState(getRoute())

  useEffect(() => {
    const onHash = () => {
      setRoute(getRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  switch (route) {
    case 'neo':
      return <NeoTokyo />
    case 'aurora':
      return <Aurora />
    case 'nova':
      return <Nova />
    case 'matrix':
      return <MatrixTerm />
    case 'singularite':
      return <Singularite />
    default:
      return <Selector />
  }
}
