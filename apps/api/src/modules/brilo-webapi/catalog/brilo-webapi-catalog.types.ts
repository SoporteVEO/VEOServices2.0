export type BriloHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface BriloParamDoc {
  name: string;
  in: 'query' | 'path' | 'header' | 'form';
  type?: string;
  required?: boolean;
  description?: string;
  default?: string;
}

export interface BriloEndpointDoc {
  id: string;
  module: string;
  method: BriloHttpMethod;
  path: string;
  summary: string;
  description?: string;
  params?: readonly BriloParamDoc[];
  body?: string;
  returns?: string;
}
