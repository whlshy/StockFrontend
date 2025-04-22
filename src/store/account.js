import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { array2obj } from '@/lib/fn'

const initialState = {
  mid: null,
  name: "訪客",
  account: null,
  email: null,
  sso: null,
  lastLoginDT: null,
  isLogin: null,
  refetch: null,
  isLoading: true,
  classes: [],
}

const stateAtom = atom(initialState,
  async (get, set, data) => {
    let state = get(stateAtom)
    set(stateAtom, { ...state, ...data })
  }
)

const useAccountStore = () => {
  const setData = useSetAtom(stateAtom)
  const setAccount = (data) => {

    if (!data?.data) {
      setData({
        ...data,
      })
    }
    else {
      setData({
        ...data?.data,
        isLogin: (data?.data?.mid == 0) ? false : true,
        ...(Array.isArray(data?.classes) ? { classes: array2obj(data?.classes, "CName") } : {})
      })
    }
  }

  return { ...useAtomValue(stateAtom), setAccount }
}

export default useAccountStore