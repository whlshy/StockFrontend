import React from "react"
import ReactDOM from 'react-dom/client'
import App from "./components/App"
import './styles/main.styl'
import './styles/lib/tailwind.css'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query"
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from "react-router-dom"
import useSnackbarStore from "./store/snackbar"
import useApiDataStore from "./store/apidata"

const Index = () => {
  const { setSnackMsg } = useSnackbarStore(state => state)
  const { setApiData } = useApiDataStore()

  const handleErrorAlert = (err_arr = []) => {
    let str = ''
    err_arr?.map((d, idx) => {
      str += ((idx == 0 ? "" : "\n\n") + (d?.displayName || d?.field) + '：\n' + d?.error)
    })
    setAlert({
      title: "錯誤",
      content: str,
      handleAgree: (callback) => callback()
    })
  }

  const onError = (error, variables, context) => {
    console.log('onError', error, variables)
    setSnackMsg({ message: "API發生未知錯誤" })
  }

  const onSuccess = async (data, query) => {
    if (query?.queryKey?.[0]?.[0] == "_") {
      setApiData({ key: query?.queryKey?.[0]?.replace('_', ''), body: { data: data?.body, refetch: query?.options?.queryFn } })
    }
    const status = (data?.body?.status !== null && data?.body?.status !== undefined) ? data?.body?.status : null
    if (status !== null && Array.isArray(data?.body?.errorArray)) {
      handleErrorAlert(data?.body?.errorArray)
    } else if (status !== null)
      setSnackMsg({ message: data?.body?.message })
    !data?.ok && status == null && !data?.pages && setSnackMsg({ message: "API發生未知錯誤！" })
  }

  const onSettled = (data, error) => {
  }

  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onSuccess,
      onError,
      onSettled,
    }),
    mutationCache: new MutationCache({
      onSuccess,
      onError
    }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false, // default: true
        select: (data) => {
          const status = (data?.body?.status !== null && data?.body?.status !== undefined) ? data?.body?.status : null
          let response = (status == null ? (data.body || null) : null)
          if (Array.isArray(data?.pages)) {
            let page_data = []
            data?.pages?.map((m, idx) => {
              page_data[idx] = (m?.body || m);
            })
            response = { ...data, pages: page_data }
          }
          return response
        }
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}

const rootElement = document.getElementById('root')
ReactDOM.createRoot(rootElement).render(<Index />)
