import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ''
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const db = {
  getSubjects: () => supabase.from('subjects').select('*').order('sort_order'),
  
  getTopicsBySubject: (subjectId: string) => 
    supabase.from('topics').select('*').eq('subject_id', subjectId).order('sort_order'),
  
  getQuestions: (filters?: any) => {
    let query = supabase.from('questions').select('*')
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.subjectId) {
      query = query.eq('subject_id', filters.subjectId)
    }
    if (filters?.topicId) {
      query = query.eq('topic_id', filters.topicId)
    }
    
    return query.order('created_at', { ascending: false })
  },
  
  createQuestion: (question: any) => 
    supabase.from('questions').insert([question]).select(),
  
  updateQuestion: (id: string, question: any) =>
    supabase.from('questions').update(question).eq('id', id),
  
  deleteQuestion: (id: string) =>
    supabase.from('questions').delete().eq('id', id),
}
