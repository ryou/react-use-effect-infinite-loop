import { NextPage } from 'next'
import { useCallback, useEffect, useState } from 'react'

const Content = () => {
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    console.log('run use effect')
    setCounter((oldCounter) => oldCounter + 1)
  }, [counter])

  return <div />
}

const SimplePage: NextPage = () => {
  const [active, setActive] = useState(false)

  const onClickActivate = useCallback(() => setActive(true), [])

  return (
    <div>
      <h1>シンプルな無限ループパターン</h1>
      {!active && (
        <div>
          <button onClick={onClickActivate}>
            押すと無限ループが発生するので注意
          </button>
        </div>
      )}
      {active && <Content />}
    </div>
  )
}

export default SimplePage
