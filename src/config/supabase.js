import { createClient } from '@supabase/supabase-js'
import CryptoJS from 'crypto-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// 암호화 키 (실제 운영 환경에서는 환경 변수로 관리해야 함)
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'your-secure-key';

// 암호화 함수
const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

// 복호화 함수
const decrypt = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('복호화 실패:', error);
    return null;
  }
};

if (!supabaseUrl || !supabaseKey) {
  console.error('환경 변수 설정이 누락되었습니다.');
  throw new Error('서비스 초기화에 실패했습니다. 관리자에게 문의하세요.');
}

// API 키 암호화
const encryptedKey = encrypt(supabaseKey);
const decryptedKey = decrypt(encryptedKey);

if (!decryptedKey) {
  throw new Error('API 키 복호화에 실패했습니다. 관리자에게 문의하세요.');
}

export const supabase = createClient(supabaseUrl, decryptedKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 세션 만료 시간 (24시간)
const SESSION_EXPIRY = 24 * 60 * 60 * 1000;

// 인증 상태 확인 함수
export const checkAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('인증 상태 확인 중 오류 발생:', error);
      return false;
    }
    
    if (!session) return false;

    // 세션 만료 확인
    const sessionCreatedAt = new Date(session.created_at).getTime();
    const now = new Date().getTime();
    if (now - sessionCreatedAt > SESSION_EXPIRY) {
      await signOut();
      return false;
    }

    return true;
  } catch (error) {
    console.error('인증 상태 확인 중 오류 발생:', error);
    return false;
  }
}

// 로그인 함수
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) {
    console.error('로그인 에러:', error);
    throw new Error('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
  }
  return data
}

// 로그아웃 함수
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('로그아웃 에러:', error);
    throw new Error('로그아웃에 실패했습니다. 잠시 후 다시 시도해주세요.');
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