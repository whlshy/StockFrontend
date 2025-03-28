import React, { useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { atom, useAtom, useSetAtom } from 'jotai'
import { Box } from '@mui/material'

const queryAtom = atom({},
  async (get, set, data) => {
    const state = get(queryAtom)
    set(queryAtom, { ...state, ...data })
  }
)

const getDataArr = (data) => data?.pages?.flatMap(p => p?.data) || [];

const useBasicInfiniteQuery = ({ keyName, counts, ...props }) => {
  const setQuery = useSetAtom(queryAtom)

  const queryData = useInfiniteQuery({
    initialPageParam: 0,
    getPreviousPageParam: (firstPage) => firstPage?.previousId ?? undefined,
    getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
      let now_page = allPageParams[allPageParams?.length - 1]
      let total = lastPage?.body?.total
      let next_page = undefined
      if ((now_page + 1) * counts < total)
        next_page = now_page + 1
      return next_page ?? undefined
    },
    ...props,
  })

  const { data } = queryData

  useEffect(() => {
    setQuery({ [keyName]: { ...queryData, data_arr: getDataArr(data) } })
  }, [queryData, keyName])

  const InViewQuery = ({ sx }) => {
    const { isFetchingNextPage, isFetching, hasNextPage, fetchNextPage } = queryData

    const { ref, inView } = useInView()

    useEffect(() => {
      if (inView && !isFetching && !!fetchNextPage && !!hasNextPage) {
        fetchNextPage()
      }
    }, [inView, fetchNextPage, isFetching, hasNextPage])

    return (
      <Box ref={ref} sx={{ fontSize: '12px', color: '#919191', cursor: 'pointer', ...sx }} onClick={fetchNextPage}>
        {isFetchingNextPage || isFetching ? '載入更多內容中...' : hasNextPage ? '載入更多' : '沒有更多內容了...'}
      </Box>
    )
  }

  return { ...queryData, data_arr: getDataArr(data), InViewQuery }
}

export { useBasicInfiniteQuery }