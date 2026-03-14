import React, { ReactNode } from 'react'

interface LayoutProps {
  sidebar: ReactNode
  toolbar: ReactNode
  main: ReactNode
}

export function Layout({ sidebar, toolbar, main }: LayoutProps) {
  return (
    <div className={'flex flex-col h-screen'}>
      <header className={'bg-white border-b border-gray-200 p-4'}>{toolbar}</header>
      <div className={'flex flex-1 overflow-hidden'}>
        <aside className={'w-64 bg-white border-r border-gray-200 overflow-y-auto'}>{sidebar}</aside>
        <main className={'flex-1 overflow-auto bg-gray-100'}>{main}</main>
      </div>
    </div>
  )
}
