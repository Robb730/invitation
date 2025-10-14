import React from 'react'
import HostNav from './hostpage-comp/HostNav'
import SideDash from './hostpage-comp/SideDash'
import Dashboard from './hostpage-comp/Dashboard'

const HostPage = () => {
  return (
    <div className='bg-beige h-screen'>
        <HostNav/>
        <SideDash/>
        <Dashboard/>
    </div>
  )
}

export default HostPage
