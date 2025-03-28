import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'

const initialState = {
  open: false,
  title: "",
  content: "",
  handleAgree: () => { },
  handleDisagree: () => { },
}

const stateAtom = atom(initialState,
  async (get, set, data) => {
    let state = get(stateAtom)
    set(stateAtom, { ...state, ...data })
  }
)

const useAlertStore = () => {
  const setData = useSetAtom(stateAtom)

  const setAlert = (data) => {
    setData({ ...initialState, ...data, open: true })
  }

  const closeAlert = () => {
    setData({ open: false })
  }

  return { ...useAtomValue(stateAtom), setAlert, closeAlert }
}


export default useAlertStore