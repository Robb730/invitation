import React, { useState, useEffect } from 'react'
import HostNav from './hostpage-comp/HostNav'
import SideDash from './hostpage-comp/SideDash'
import Dashboard from './hostpage-comp/Dashboard'
import Listings from './hostpage-comp/Listings'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../firebaseConfig'

const HostPage = () => {
  const [user, setUser] = useState(null)
  const [activePage, setActivePage] = useState("Dashboard")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  const renderContent = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard />
      case "My Listings":
        return <Listings user = {user} />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="bg-beige min-h-screen">
      <HostNav user={user} />
      <SideDash setActivePage={setActivePage} />
      {/*The layout spacing now stays consistent*/}
      <div className="ml-64 pt-24 px-10">{renderContent()}</div>
    </div>
  )
}

export default HostPage
