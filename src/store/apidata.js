import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'

const initialState = {
}

const stateAtom = atom(initialState,
  async (get, set, data) => {
    let state = get(stateAtom)
    set(stateAtom, { ...state, ...data })
  }
)

const useApiDataStore = () => {
  const [{ ...state }, setData] = useAtom(stateAtom)
  const setApiData = ({ key, body }) => {
    console.log(`apiDataAtom log (${key}):`, { ...state, [key]: body })
    setData({ [key]: body })
  }

  return { ...useAtomValue(stateAtom), setApiData }
}

export default useApiDataStore