import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'

const initialState = {
  isSidebarOpen: true,
}

const stateAtom = atom(initialState,
  async (get, set, data) => {
    let state = get(stateAtom)
    set(stateAtom, { ...state, ...data })
  }
)

const useAppStore = () => {
  const [state, setData] = useAtom(stateAtom)

  const setSidebarOpen = (tf = null) => {
    setData({ isSidebarOpen: tf !== null ? tf : !state.isSidebarOpen })
  }

  return { ...useAtomValue(stateAtom), setSidebarOpen }
}

export default useAppStore