import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'

const initialState = {
  open: false,
  title: "",
  content: null,
  actions: null,
  body: null,
}

const stateAtom = atom(initialState,
  async (get, set, data) => {
    let state = get(stateAtom)
    set(stateAtom, { ...state, ...data })
  }
)

const useDialogStore = () => {
  const setData = useSetAtom(stateAtom)

  const setDialog = (data) => {
    setData({ ...initialState, ...data, open: true })
  }

  const closeDialog = () => {
    setData({ open: false })
  }

  return { ...useAtomValue(stateAtom), setDialog, closeDialog }
}

export default useDialogStore