import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'

const initialState = {
  open: false,
  message: null,
  anchorOrigin: { vertical: 'top', horizontal: 'center' },
  autoHideDuration: 3000,
  status: null,
}

const stateAtom = atom(initialState,
  async (get, set, data) => {
    let state = get(stateAtom)
    set(stateAtom, { ...state, ...data })
  }
)

const useSnackbarStore = () => {
  const setData = useSetAtom(stateAtom)

  const setSnackMsg = (data) => {
    setData({ ...initialState, ...data, open: true })
  }

  const closeSnackbar = () => {
    setData({ open: false })
  }

  return { ...useAtomValue(stateAtom), setSnackMsg, closeSnackbar }
}


export default useSnackbarStore