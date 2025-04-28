import { supabase, checkAuth } from '../config/supabase'

export const uploadImage = async (evaluationId, file) => {
  try {
    // 인증 상태 확인
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      throw new Error('인증이 필요합니다. 로그인해주세요.');
    }

    if (!evaluationId) {
      throw new Error('수행평가 ID가 필요합니다.');
    }

    if (!file) {
      throw new Error('업로드할 파일이 필요합니다.');
    }

    console.log('이미지 업로드 시작:', { evaluationId, fileName: file.name });
    
    // 파일 이름 생성 (중복 방지)
    const fileExt = file.name.split('.').pop();
    const timestamp = new Date().getTime();
    const randomNum = Math.random().toString(36).substring(2, 8);
    const fileName = `${evaluationId}/${timestamp}-${randomNum}.${fileExt}`;
    console.log('생성된 파일명:', fileName);
    
    // Storage에 이미지 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('evaluation-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('이미지 업로드 에러:', uploadError);
      if (uploadError.message.includes('bucket')) {
        throw new Error('스토리지 버킷에 접근할 수 없습니다. 관리자에게 문의하세요.');
      }
      throw uploadError;
    }
    console.log('Storage 업로드 성공:', uploadData);

    // 이미지 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from('evaluation-images')
      .getPublicUrl(fileName);
    console.log('생성된 이미지 URL:', publicUrl);

    // 데이터베이스에 이미지 정보 저장
    const { data: imageData, error: dbError } = await supabase
      .from('images')
      .insert([{
        evaluation_id: evaluationId,
        url: publicUrl
      }])
      .select()
      .single();

    if (dbError) {
      console.error('이미지 정보 저장 에러:', dbError);
      // 이미지 업로드는 성공했지만 DB 저장에 실패한 경우, 업로드된 이미지 삭제
      try {
        await supabase.storage
          .from('evaluation-images')
          .remove([fileName]);
        console.log('업로드된 이미지 삭제 성공');
      } catch (deleteError) {
        console.error('업로드된 이미지 삭제 실패:', deleteError);
      }
      throw new Error(`이미지 정보 저장 실패: ${dbError.message}`);
    }
    console.log('이미지 정보 저장 성공:', imageData);

    return imageData;
  } catch (error) {
    console.error('이미지 업로드 중 에러 발생:', error);
    throw error;
  }
}

export const getImages = async (evaluationId) => {
  try {
    console.log('이미지 조회 시작:', evaluationId);
    
    const { data: images, error } = await supabase
      .from('images')
      .select('*')
      .eq('evaluation_id', evaluationId)

    if (error) {
      console.error('이미지 조회 에러:', error)
      throw error
    }
    console.log('조회된 이미지:', images);

    return images
  } catch (error) {
    console.error('이미지 조회 중 에러 발생:', error)
    throw error
  }
}

export const deleteImage = async (imageId) => {
  try {
    console.log('이미지 삭제 시작:', imageId);
    
    // 이미지 URL 가져오기
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('url')
      .eq('id', imageId)
      .single()

    if (fetchError) {
      console.error('이미지 URL 조회 에러:', fetchError)
      throw fetchError
    }
    console.log('삭제할 이미지 URL:', image.url);

    // Storage에서 이미지 삭제
    const fileName = image.url.split('/').pop()
    const { error: storageError } = await supabase.storage
      .from('evaluation-images')
      .remove([fileName])

    if (storageError) {
      console.error('Storage 이미지 삭제 에러:', storageError)
      throw storageError
    }
    console.log('Storage 이미지 삭제 성공');

    // 데이터베이스에서 이미지 정보 삭제
    const { error: dbError } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId)

    if (dbError) {
      console.error('이미지 정보 삭제 에러:', dbError)
      throw dbError
    }
    console.log('이미지 정보 삭제 성공');
  } catch (error) {
    console.error('이미지 삭제 중 에러 발생:', error)
    throw error
  }
} 