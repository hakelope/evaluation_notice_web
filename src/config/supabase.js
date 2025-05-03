import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing. Please check your .env file.')
  console.error('REACT_APP_SUPABASE_URL:', supabaseUrl)
  console.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseKey)
}

// 세션 관리를 위한 커스텀 스토리지
const customStorage = {
  getItem: (key) => {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Error reading from storage:', error)
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error writing to storage:', error)
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from storage:', error)
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: customStorage
  }
})

// 인증 상태 확인 함수
export const checkAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('인증 상태 확인 중 오류 발생:', error)
      return false
    }
    return !!session
  } catch (error) {
    console.error('세션 확인 중 오류:', error)
    return false
  }
}

// 로그인 함수
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  } catch (error) {
    console.error('로그인 중 오류:', error)
    throw error
  }
}

// 로그아웃 함수
export const signOut = async () => {
  try {
    // 1. Supabase 로그아웃
    await supabase.auth.signOut({ scope: 'global' })
    
    // 2. auth-token 직접 삭제
    localStorage.removeItem('sb-zrjxwcmlsycadodkpktq-auth-token')
    sessionStorage.removeItem('sb-zrjxwcmlsycadodkpktq-auth-token')
    
    // 3. 다른 Supabase 관련 데이터 삭제
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key)
      }
    })
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        sessionStorage.removeItem(key)
      }
    })
    
    // 4. 쿠키 삭제
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=')
      const trimmedName = name.trim()
      if (trimmedName.startsWith('sb-')) {
        document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      }
    })
    
    // 5. Supabase 클라이언트 재설정
    await supabase.auth.clearSession()
    
    // 6. 페이지 새로고침
    window.location.href = '/admin'
  } catch (error) {
    console.error('로그아웃 중 오류 발생:', error)
    throw error
  }
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