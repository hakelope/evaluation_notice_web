import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing. Please check your .env file.')
  console.error('REACT_APP_SUPABASE_URL:', supabaseUrl)
  console.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseKey)
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 인증 상태 확인 함수
export const checkAuth = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('인증 상태 확인 중 오류 발생:', error)
    return false
  }
  return !!session
}

// 로그인 함수
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

// 로그아웃 함수
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const addEvaluation = async (evaluationData) => {
  // evaluations 테이블에 데이터 추가
  const { data: evaluation, error } = await supabase
    .from('evaluations')
    .insert([{
      subject: evaluationData.subject,
      title: evaluationData.title,
      highlight_color: evaluationData.highlightColor,
      default_date: evaluationData.defaultDate
    }])
    .select()
    .single()

  if (error) throw error

  // class_dates 테이블에 데이터 추가
  const classDates = Object.entries(evaluationData.classDates).map(([classNumber, date]) => ({
    evaluation_id: evaluation.id,
    class_number: parseInt(classNumber),
    date: date
  }))

  await supabase.from('class_dates').insert(classDates)

  // evaluation_details 테이블에 데이터 추가
  await supabase.from('evaluation_details').insert([{
    evaluation_id: evaluation.id,
    ...evaluationData.details
  }])

  return evaluation
} 