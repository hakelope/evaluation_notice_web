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
        default_end_date: evaluationData.evaluationType === 'period' ? evaluationData.defaultEndDate : null,
        subject_type: evaluationData.subjectType,
        evaluation_type: evaluationData.evaluationType,
        grade: evaluationData.grade
      }])
      .select()
      .single();

    if (error) {
      console.error('evaluations 테이블 에러:', error);
      throw new Error(`evaluations 테이블 에러: ${error.message}`);
    }

    // 변경사항 기록
    const { error: changeError } = await supabase
      .from('evaluation_changes')
      .insert([{
        evaluation_id: evaluation.id,
        change_type: 'add',
        title: evaluation.title,
        details: {
          subject: evaluation.subject,
          grade: evaluation.grade,
          evaluation_type: evaluation.evaluation_type
        }
      }]);

    if (changeError) {
      console.error('변경사항 기록 에러:', changeError);
    }

    // class_dates 테이블에 데이터 추가
    const classDates = Object.entries(evaluationData.classDates)
      .filter(([_, date]) => date) // 날짜가 있는 경우만 필터링
      .map(([classNumber, date]) => ({
        evaluation_id: evaluation.id,
        class_number: classNumber,
        date: date,
        end_date: evaluationData.evaluationType === 'period' ? evaluationData.classEndDates[classNumber] : null
      }));

    if (classDates.length > 0) {
      const { error: classDatesError } = await supabase
        .from('class_dates')
        .insert(classDates);

      if (classDatesError) {
        console.error('class_dates 테이블 에러:', classDatesError);
        throw new Error(`class_dates 테이블 에러: ${classDatesError.message}`);
      }
    }

    // evaluation_details 테이블에 데이터 추가
    const { error: detailsError } = await supabase
      .from('evaluation_details')
      .insert([{
        evaluation_id: evaluation.id,
        type: evaluationData.details.type,
        requirements: evaluationData.details.requirements,
        materials: evaluationData.details.materials,
        notes: evaluationData.details.notes
      }]);

    if (detailsError) {
      console.error('evaluation_details 테이블 에러:', detailsError);
      throw new Error(`evaluation_details 테이블 에러: ${detailsError.message}`);
    }

    return evaluation;
  } catch (error) {
    console.error('수행평가 추가 중 에러 발생:', error);
    throw error;
  }
};

export const updateEvaluation = async (id, evaluationData) => {
  const { data: evaluation, error } = await supabase
    .from('evaluations')
    .update({
      subject: evaluationData.subject,
      title: evaluationData.title,
      highlight_color: evaluationData.highlightColor,
      default_date: evaluationData.defaultDate,
      default_end_date: evaluationData.evaluationType === 'period' ? evaluationData.defaultEndDate : null,
      subject_type: evaluationData.subjectType,
      evaluation_type: evaluationData.evaluationType,
      grade: evaluationData.grade
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // 변경사항 기록
  const { error: changeError } = await supabase
    .from('evaluation_changes')
    .insert([{
      evaluation_id: id,
      change_type: 'update',
      title: evaluation.title,
      details: {
        subject: evaluation.subject,
        grade: evaluation.grade,
        evaluation_type: evaluation.evaluation_type
      }
    }]);

  if (changeError) {
    console.error('변경사항 기록 에러:', changeError);
  }

  // class_dates 업데이트
  await supabase.from('class_dates').delete().eq('evaluation_id', id)
  
  const classDates = Object.entries(evaluationData.classDates)
    .filter(([_, date]) => date) // 날짜가 있는 경우만 필터링
    .map(([classNumber, date]) => ({
      evaluation_id: id,
      class_number: classNumber,
      date: date,
      end_date: evaluationData.evaluationType === 'period' ? evaluationData.classEndDates[classNumber] : null
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
  try {
    // 삭제할 평가 정보 조회
    const { data: evaluation, error: fetchError } = await supabase
      .from('evaluations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('평가 정보 조회 중 에러:', fetchError);
      throw new Error(`평가 정보 조회 중 에러: ${fetchError.message}`);
    }

    // 변경사항 기록
    const { error: changeError } = await supabase
      .from('evaluation_changes')
      .insert([{
        evaluation_id: id,
        change_type: 'delete',
        title: evaluation.title,
        details: {
          subject: evaluation.subject,
          grade: evaluation.grade,
          evaluation_type: evaluation.evaluation_type
        }
      }]);

    if (changeError) {
      console.error('변경사항 기록 에러:', changeError);
    }

    // 1. 관련된 이미지 삭제
    const { error: imagesError } = await supabase
      .from('images')
      .delete()
      .eq('evaluation_id', id);

    if (imagesError) {
      console.error('이미지 삭제 중 에러:', imagesError);
      throw new Error(`이미지 삭제 중 에러: ${imagesError.message}`);
    }

    // 2. 평가 상세 정보 삭제
    const { error: detailsError } = await supabase
      .from('evaluation_details')
      .delete()
      .eq('evaluation_id', id);

    if (detailsError) {
      console.error('평가 상세 정보 삭제 중 에러:', detailsError);
      throw new Error(`평가 상세 정보 삭제 중 에러: ${detailsError.message}`);
    }

    // 3. 반별 날짜 정보 삭제
    const { error: classDatesError } = await supabase
      .from('class_dates')
      .delete()
      .eq('evaluation_id', id);

    if (classDatesError) {
      console.error('반별 날짜 정보 삭제 중 에러:', classDatesError);
      throw new Error(`반별 날짜 정보 삭제 중 에러: ${classDatesError.message}`);
    }

    // 4. 수행평가 삭제
    const { error: evaluationError } = await supabase
      .from('evaluations')
      .delete()
      .eq('id', id);

    if (evaluationError) {
      console.error('수행평가 삭제 중 에러:', evaluationError);
      throw new Error(`수행평가 삭제 중 에러: ${evaluationError.message}`);
    }
  } catch (error) {
    console.error('수행평가 삭제 중 에러 발생:', error);
    throw error;
  }
}; 