/**
 * ReactQueryのuseQueriesが返す配列が、レンダリング毎に参照が変わることによって無限ループが発生しているパターン
 */
import { NextPage } from 'next'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider, useQueries } from 'react-query'

type Nutrition = {
  p: number
  f: number
  c: number
}

const emptyNutrition = {
  p: 0,
  f: 0,
  c: 0,
}

type Food = {
  id: string
  nutrition: Nutrition
}

const fetchFood = async (id: string): Promise<Food> => {
  return {
    id,
    nutrition: {
      p: 100,
      f: 100,
      c: 100,
    },
  }
}

const useFoods = (ids: string[]) => {
  const queryOptions = useMemo(() => {
    console.log('queryOptions updated')
    return ids.map((id) => {
      return {
        queryKey: ['food', id],
        queryFn: () => fetchFood(id),
      }
    })
  }, [ids])
  const foodQueries = useQueries(queryOptions)

  useEffect(() => {
    console.log('foodQueries updated')
  }, [foodQueries])

  const isError = useMemo(
    () => foodQueries.some((foodQuery) => foodQuery.isError),
    [foodQueries]
  )

  const foods = useMemo(
    () => foodQueries.map((foodQuery) => foodQuery.data),
    [foodQueries]
  )

  const data = useMemo(() => {
    if (foods.some((item) => item === undefined)) return undefined

    return foods as Food[]
  }, [foods])

  // dataはidsに変化があるたびにundefinedになるので使いづらい
  // dataのキャッシュを持っておき、更新中もキャッシュを返すことによってundefinedを返すのを極力避ける
  // 更新中か否かはisUpdatingで判定
  // ...というための処理だが、これが原因で無限ループが発生する
  // depsにこのフックの変数があり、これはレンダリング毎に参照が変わってしまっている（useQueriesが返す配列がレンダリング毎に参照が変わるため）
  const [cachedData, setCachedData] = useState<Food[] | undefined>(undefined)
  useEffect(() => {
    setCachedData(data)
  }, [data])

  const isUpdating = data === undefined

  return { data: cachedData, isError, isUpdating }
}

const calcTotalNutrition = (foods: Food[]): Nutrition => {
  return foods.reduce<Nutrition>((prev, current) => {
    return {
      p: prev.p + current.nutrition.p,
      f: prev.f + current.nutrition.f,
      c: prev.c + current.nutrition.c,
    }
  }, emptyNutrition)
}

const RecipeDetail = ({ foods }: { foods: Food[] }) => {
  const totalNutrition = useMemo(() => calcTotalNutrition(foods), [foods])

  return (
    <div>
      <ul>
        {foods.map((food, index) => (
          <li key={index}>{food.id}</li>
        ))}
      </ul>
      <div>
        <h2>栄養総計</h2>
        <div>P: {totalNutrition.p}</div>
        <div>F: {totalNutrition.f}</div>
        <div>C: {totalNutrition.c}</div>
      </div>
    </div>
  )
}

const Content = () => {
  const [foodIds, setFoodIds] = useState<string[]>([])
  const { data, isError } = useFoods(foodIds)

  return (
    <div>
      {isError ? (
        <div>error</div>
      ) : data === undefined ? (
        <div>loading</div>
      ) : (
        <RecipeDetail foods={data} />
      )}
    </div>
  )
}

const queryClient = new QueryClient()

const ComplexPage: NextPage = () => {
  const [active, setActive] = useState(false)

  const onClickActivate = useCallback(() => setActive(true), [])

  return (
    <QueryClientProvider client={queryClient}>
      <h1>複雑な無限ループパターン</h1>
      {!active && (
        <div>
          <button onClick={onClickActivate}>
            押すと無限ループが発生するので注意
          </button>
        </div>
      )}
      {active && <Content />}
    </QueryClientProvider>
  )
}

export default ComplexPage
