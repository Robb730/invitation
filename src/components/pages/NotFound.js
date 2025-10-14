import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div>
      <h1>404 NOT FOUND</h1>
      <Link to="/">
        <button>Go Home</button>
      </Link>
    </div>
  )
}

export default NotFound
