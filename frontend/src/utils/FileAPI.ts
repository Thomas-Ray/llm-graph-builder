import { Method } from 'axios';
import { url } from './Utils';
import { UserCredentials, ExtractParams, UploadParams } from '../types';
import { apiCall } from '../services/CommonAPI';

// Upload Call
export const uploadAPI = async (file: any, userCredentials: any, model: string): Promise<any> => {
  const urlUpload = `${url()}/sources`;
  const method: Method = 'post';
  const commonParams: UserCredentials = userCredentials;
  const additionalParams: UploadParams = { file, model };
  const response = await apiCall(urlUpload, method, commonParams, additionalParams);
  return response;
};

// Extract call
export const extractAPI = async (
  file: any,
  model: string,
  userCredentials: any,
  source_url?: any,
  aws_access_key_id?: any,
  aws_secret_access_key?: any,
  max_sources?: number,
  wiki_query?: string
): Promise<any> => {
  const urlExtract = `${url()}/extract`;
  const method: Method = 'post';
  const commonParams: UserCredentials = userCredentials;
  let additionalParams: ExtractParams;
  if (source_url?.length) {
    if (max_sources != undefined && !isNaN(max_sources)) {
      additionalParams = { model, source_url, aws_secret_access_key, aws_access_key_id, max_sources, wiki_query };
    } else {
      additionalParams = { model, source_url, aws_secret_access_key, aws_access_key_id, wiki_query };
    }
  } else {
    additionalParams = { file, model };
  }
  const response = await apiCall(urlExtract, method, commonParams, additionalParams);
  return response;
};