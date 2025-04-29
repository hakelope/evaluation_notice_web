import { supabase } from '../config/supabase'

export const getEvaluations = async () => {
  const { data: evaluations, error } = await supabase
    .from('evaluations')
    .select(`
      *,
      class_dates (*),
      evaluation_details (*),
      images (*)
    `)
  
  if (error) {
    console.error('수행평가 목록을 불러오는데 실패했습니다:', error)
    throw error
  }

  // 데이터 구조 변환
  return evaluations.map(evaluation => {
    const details = evaluation.evaluation_details?.[0] || null;
    
    // requirements와 materials 파싱
    let requirements = [];
    let materials = [];
    
    if (details) {
      try {
        requirements = typeof details.requirements === 'string' 
          ? JSON.parse(details.requirements)
          : details.requirements || [];
        
        materials = typeof details.materials === 'string'
          ? JSON.parse(details.materials)
          : details.materials || [];
      } catch (e) {
        console.error('데이터 파싱 에러:', e);
      }
    }

    return {
      ...evaluation,
      evaluation_details: details ? {
        ...details,
        requirements,
        materials
      } : null,
      class_dates: evaluation.class_dates || []
    };
  });
}

export const addEvaluation = async (evaluationData) => {
  try {
    // evaluations 테이블에 데이터 추가
    const { data: evaluation, error } = await supabase
      .from('evaluations')
      .insert([{
        subject: evaluationData.subject,
        title: evaluationData.title,
        highlight_color: evaluationData.highlightColor,
        default_date: evaluationData.defaultDate,
        subject_type: evaluationData.subjectType
      }])
      .select()
      .single()

    if (error) {
      console.error('evaluations 테이블 에러:', error)
      throw new Error(`evaluations 테이블 에러: ${error.message}`)
    }

    // class_dates 테이블에 데이터 추가
    const classDates = Object.entries(evaluationData.classDates)
      .filter(([_, date]) => date) // 날짜가 있는 경우만 필터링
      .map(([classNumber, date]) => ({
        evaluation_id: evaluation.id,
        class_number: classNumber,
        date: date
      }));

    if (classDates.length > 0) {
      const { error: classDatesError } = await supabase
        .from('class_dates')
        .insert(classDates);

      if (classDatesError) {
        console.error('class_dates 테이블 에러:', classDatesError)
        throw new Error(`class_dates 테이블 에러: ${classDatesError.message}`)
      }
    }

    // evaluation_details 테이블에 데이터 추가
    const { error: detailsError } = await supabase.from('evaluation_details').insert([{
      evaluation_id: evaluation.id,
      type: evaluationData.details.type,
      requirements: evaluationData.details.requirements,
      materials: evaluationData.details.materials,
      notes: evaluationData.details.notes
    }])

    if (detailsError) {
      console.error('evaluation_details 테이블 에러:', detailsError)
      throw new Error(`evaluation_details 테이블 에러: ${detailsError.message}`)
    }

    return evaluation
  } catch (error) {
    console.error('수행평가 추가 중 에러 발생:', error)
    throw error
  }
}

export const updateEvaluation = async (id, evaluationData) => {
  const { data: evaluation, error } = await supabase
    .from('evaluations')
    .update({
      subject: evaluationData.subject,
      title: evaluationData.title,
      highlight_color: evaluationData.highlightColor,
      default_date: evaluationData.defaultDate,
      subject_type: evaluationData.subjectType
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // class_dates 업데이트
  await supabase.from('class_dates').delete().eq('evaluation_id', id)
  
  const classDates = Object.entries(evaluationData.classDates)
    .filter(([_, date]) => date) // 날짜가 있는 경우만 필터링
    .map(([classNumber, date]) => ({
      evaluation_id: id,
      class_number: classNumber,
      date: date
    }));

  if (classDates.length > 0) {
    const { error: classDatesError } = await supabase
      .from('class_dates')
      .insert(classDates);

    if (classDatesError) {
      console.error('class_dates 테이블 에러:', classDatesError)
      throw new Error(`class_dates 테이블 에러: ${classDatesError.message}`)
    }
  }

  // evaluation_details 업데이트
  await supabase.from('evaluation_details')
    .update({
      ...evaluationData.details
    })
    .eq('evaluation_id', id)

  return evaluation
}

export const deleteEvaluation = async (id) => {
  const { error } = await supabase
    .from('evaluations')
    .delete()
    .eq('id', id)

  if (error) throw error
} 