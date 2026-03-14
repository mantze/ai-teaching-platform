import React, { useEffect, useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight, GraduationCap } from 'lucide-react'
import { db } from '../../services/supabase'
import { Subject, Topic } from '../../types'

const GRADES = [
  { id: 'P1', name: '小一' },
  { id: 'P2', name: '小二' },
  { id: 'P3', name: '小三' },
  { id: 'P4', name: '小四' },
  { id: 'P5', name: '小五' },
  { id: 'P6', name: '小六' },
  { id: 'S1', name: '中一' },
  { id: 'S2', name: '中二' },
  { id: 'S3', name: '中三' },
  { id: 'S4', name: '中四' },
  { id: 'S5', name: '中五' },
  { id: 'S6', name: '中六' },
]

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

interface SidebarProps {
  selectedGrade?: string
  selectedSubject?: string
  selectedTopic?: string
  selectedLevel?: number
  onGradeChange?: (grade: string) => void
  onSubjectChange?: (subject: string) => void
  onTopicChange?: (topic: string) => void
  onLevelChange?: (level: number) => void
}

export function Sidebar({ 
  selectedGrade, 
  selectedSubject, 
  selectedTopic, 
  selectedLevel,
  onGradeChange, 
  onSubjectChange, 
  onTopicChange,
  onLevelChange 
}: SidebarProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Record<string, Topic[]>>({})
  const [expandedGrades, setExpandedGrades] = useState<string[]>([])
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([])

  useEffect(() => {
    loadSubjects()
  }, [])

  async function loadSubjects() {
    const { data } = await db.getSubjects()
    if (data) setSubjects(data)
  }

  async function loadTopics(subjectId: string) {
    const { data } = await db.getTopicsBySubject(subjectId)
    if (data) setTopics(prev => ({ ...prev, [subjectId]: data }))
  }

  function toggleGrade(gradeId: string) {
    setExpandedGrades(prev => 
      prev.includes(gradeId) ? prev.filter(id => id !== gradeId) : [...prev, gradeId]
    )
  }

  function toggleSubject(subjectId: string) {
    setExpandedSubjects(prev => 
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    )
    if (!topics[subjectId]) loadTopics(subjectId)
  }

  function getLevelClass(level: number) {
    const base = 'p-2 rounded border text-sm font-medium transition-colors'
    if (selectedLevel === level) return base + ' bg-blue-600 text-white border-blue-600'
    return base + ' bg-white hover:bg-gray-50 border-gray-300'
  }

  return (
    <div className={'p-4'}>
      <h2 className={'text-lg font-semibold mb-4 flex items-center gap-2'}>
        <BookOpen className={'w-5 h-5'} />
        題目設定
      </h2>
      
      <div className={'space-y-4'}>
        <div>
          <h3 className={'text-sm font-medium text-gray-700 mb-2 flex items-center gap-2'}>
            <GraduationCap className={'w-4 h-4'} />
            年級
          </h3>
          <div className={'space-y-1'}>
            {GRADES.map(grade => (
              <div key={grade.id} className={'border rounded-md'}>
                <button
                  className={'w-full p-2 text-left flex items-center justify-between hover:bg-gray-50'}
                  onClick={() => { toggleGrade(grade.id); onGradeChange?.(grade.id) }}
                >
                  <span className={'font-medium'}>{grade.name}</span>
                  {expandedGrades.includes(grade.id) ? <ChevronDown className={'w-4 h-4'} /> : <ChevronRight className={'w-4 h-4'} />}
                </button>
                {expandedGrades.includes(grade.id) && (
                  <div className={'pl-4 pr-2 pb-2'}>
                    {subjects.map(subject => (
                      <div key={subject.id} className={'border rounded mt-1'}>
                        <button
                          className={'w-full p-2 text-left flex items-center justify-between hover:bg-gray-50 text-sm'}
                          onClick={() => { toggleSubject(subject.id); onSubjectChange?.(subject.id) }}
                        >
                          <div className={'flex items-center gap-2'}>
                            <div className={'w-2 h-2 rounded-full'} style={{ backgroundColor: subject.color || '#ccc' }} />
                            <span>{subject.name}</span>
                          </div>
                          {expandedSubjects.includes(subject.id) ? <ChevronDown className={'w-3 h-3'} /> : <ChevronRight className={'w-3 h-3'} />}
                        </button>
                        {expandedSubjects.includes(subject.id) && topics[subject.id] && (
                          <div className={'pl-6 pr-2 pb-2'}>
                            {topics[subject.id].map(topic => (
                              <button
                                key={topic.id}
                                className={'block w-full text-left py-1 px-2 rounded hover:bg-gray-100 text-xs'}
                                onClick={() => onTopicChange?.(topic.id)}
                              >
                                {topic.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className={'text-sm font-medium text-gray-700 mb-2'}>難度 (Level 1-10)</h3>
          <div className={'grid grid-cols-5 gap-2'}>
            {LEVELS.map(level => (
              <button key={level} className={getLevelClass(level)} onClick={() => onLevelChange?.(level)}>
                {level}
              </button>
            ))}
          </div>
          <p className={'text-xs text-gray-500 mt-2'}>1-3: 淺 | 4-6: 中 | 7-8: 深 | 9-10: 極深</p>
        </div>
      </div>
    </div>
  )
}
